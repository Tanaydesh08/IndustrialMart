import { useEffect, useState } from 'react'
import { createSponsoredAd, deleteSponsoredAd, getSponsoredAds, updateSponsoredAd, uploadSponsoredImage } from '../../api/adminApi'
import { useApp } from '../../context/AppContext'
import { ErrorState, Notice } from '../common/States'

const blank = { title: '', description: '', imageUrl: '', active: false, startsAt: '', endsAt: '' }
const fields = ['title', 'description', 'imageUrl', 'startsAt', 'endsAt']

export default function SponsoredAdsAdmin() {
  const { t } = useApp()
  const [ads, setAds] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  async function load() { try { setAds(await getSponsoredAds()) } catch (e) { setError(e.message) } }
  useEffect(() => { load() }, [])
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const payload = { title: form.title, description: form.description, imageUrl: form.imageUrl,
        active: form.active, startsAt: form.startsAt || null, endsAt: form.endsAt || null }
      if (editing) await updateSponsoredAd(editing, payload); else await createSponsoredAd(payload)
      setForm(blank); setEditing(null); setNotice(t(editing ? 'Sponsored ad updated.' : 'Sponsored ad created.')); await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function remove(id, title) {
    if (!window.confirm(t('Delete sponsored ad “{title}”?', { title }))) return
    try { await deleteSponsoredAd(id); setNotice(t('Sponsored ad deleted.')); await load() } catch (e) { setError(e.message) }
  }
  function edit(ad) { setEditing(ad.id); setForm({ ...ad, startsAt: ad.startsAt?.slice(0, 16) || '', endsAt: ad.endsAt?.slice(0, 16) || '' }) }
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('The image must be JPG, PNG, or WEBP and no larger than 5 MB.')); event.target.value = ''; return
    }
    setUploading(true); setError('')
    try { const saved = await uploadSponsoredImage(file); setForm(current => ({ ...current, imageUrl: saved.imageUrl })) }
    catch (e) { setError(e.message) } finally { setUploading(false) }
  }
  return <section className="workflow-card"><h2>{t('Sponsored Ads')}</h2>{notice && <Notice>{notice}</Notice>}{error && <ErrorState message={error} />}
    <form className="form-grid" onSubmit={save}>
      {fields.map(field => <label className="form-field" key={field}><span>{t(field)}</span><input required={['title', 'imageUrl'].includes(field)} type={field.endsWith('At') ? 'datetime-local' : 'text'} value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })} /></label>)}
      <label className="form-field"><span>{t('Image upload')}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />{uploading && <small>{t('Photo upload ho rahi hai…')}</small>}</label>
      <label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> {t('Active')}</label>
      <button className="button button-primary" disabled={busy || uploading}>{t(editing ? 'Save changes' : 'Create sponsored ad')}</button>
      {editing && <button type="button" className="button button-secondary" onClick={() => { setEditing(null); setForm(blank) }}>{t('Cancel')}</button>}
    </form>
    <div className="moderation-list">{ads.map(ad => <article className="moderation-card" key={ad.id}><b>{ad.title}</b><p>{ad.description}</p><span>{t(ad.active ? 'Active' : 'Off')}</span><div className="button-row"><button className="button button-secondary" onClick={() => edit(ad)}>{t('Edit')}</button><button className="button button-danger" onClick={() => remove(ad.id, ad.title)}>{t('Remove')}</button></div></article>)}</div>
  </section>
}
