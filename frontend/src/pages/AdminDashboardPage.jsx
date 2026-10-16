import { useEffect, useState } from 'react'
import { deleteListing, updateListing } from '../api/listingApi'
import { getModerationQueue, moderateListing } from '../api/moderationApi'
import StatusBadge from '../components/common/StatusBadge'
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/common/States'
import { formatINR } from '../utils/money'
import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'

export default function AdminDashboardPage() {
  const { user, t } = useApp()
  const [queue,setQueue]=useState([])
  const [reasons,setReasons]=useState({})
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [editing,setEditing]=useState(null)
  const [editForm,setEditForm]=useState({})
  async function load() {
    setLoading(true);setError('')
    try { setQueue(await getModerationQueue()) } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(()=>{if(user?.role==='ADMIN')load()},[user?.role])
  if (!user || user.role !== 'ADMIN') return <section className="section-wrap page-section"><div className="workflow-card dashboard-limitation"><h2>{t('Administrator access required')}</h2><p>{t('Sign in with an administrator account to review marketplace listings.')}</p><Link className="button button-primary" to="/login">{t('Sign in')}</Link></div></section>
  async function decide(item,status) {
    const reason=(reasons[item.id]||'').trim()
    if(!reason){setError('A moderation reason is required.');return}
    if(status==='REJECTED'&&!window.confirm(`Reject listing “${item.title}”?`))return
    setBusy(true);setError('');setNotice('')
    try { await moderateListing(item.id,{status,reason});setNotice(`Listing #${item.id} updated.`);await load() }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function remove(item) {
    if(!window.confirm(`Delete listing “${item.title}”? This cannot be undone.`))return
    setBusy(true);setError('')
    try { await deleteListing(item.id);setNotice(`Listing #${item.id} deleted.`);await load() }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  function beginEdit(item) { setEditing(item);setEditForm({title:item.title,description:item.description,categorySlug:item.categorySlug,sellerName:item.sellerName,location:item.location,price:item.price,condition:item.condition}) }
  async function saveEdit(e) {
    e.preventDefault();setBusy(true);setError('')
    try { await updateListing(editing.id,{...editForm,price:Number(editForm.price)});setNotice('Listing updated.');setEditing(null);await load() }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('MODERATION')}</p><h1>{t('Review queue')}</h1><p>{t('Pending submissions and listings needing another review, loaded from the backend.')}</p></div>
    <Notice kind="warning">{t('Moderation is restricted to authenticated administrator accounts.')}</Notice>
    {notice&&<Notice>{notice}</Notice>}{error&&<ErrorState message={error}/>}
    {loading?<LoadingState label="Loading moderation queue…"/>:error&&!queue.length?null:queue.length?<div className="moderation-list">{queue.map(item=><article className="moderation-card" key={item.id}>
      <div className="moderation-preview"><div><p className="eyebrow">LISTING #{item.id} · {t(item.categorySlug?.replaceAll('-',' ') || '')}</p><h2>{t(item.title)}</h2><p>{t(item.description)}</p><div className="listing-meta"><span>{t(item.sellerName)}</span><span>{t(item.location)}</span><span>{t(item.condition)}</span></div><b>{formatINR(item.price)}</b></div><StatusBadge status={item.status}/></div>
      {item.moderationReason&&<p className="helper-note">{t('Previous note:')} {t(item.moderationReason)}</p>}
      <label className="form-field"><span>{t('Decision reason')} <b>*</b></span><input value={reasons[item.id]||''} onChange={e=>setReasons({...reasons,[item.id]:e.target.value})} placeholder={t('Required by the moderation API')}/></label>
      <div className="button-row"><button className="button button-primary" disabled={busy} onClick={()=>decide(item,'APPROVED')}>{t('Approve')}</button><button className="button button-secondary" disabled={busy} onClick={()=>decide(item,'NEEDS_REVIEW')}>{t('Request review')}</button><button className="button button-danger" disabled={busy} onClick={()=>decide(item,'REJECTED')}>{t('Reject')}</button><button className="button button-quiet" disabled={busy} onClick={()=>beginEdit(item)}>{t('Edit')}</button><button className="button button-quiet" disabled={busy} onClick={()=>remove(item)}>{t('Delete')}</button></div>
    </article>)}</div>:<EmptyState title="Queue is clear" description="There are no pending or needs-review listings."/ >}
    {editing&&<div className="dialog-backdrop"><form className="form-card edit-dialog" onSubmit={saveEdit}><div className="section-heading"><h2>Edit listing #{editing.id}</h2><button type="button" className="icon-button" onClick={()=>setEditing(null)}>×</button></div>{['title','description','categorySlug','sellerName','location','price','condition'].map(name=><label className="form-field" key={name}><span>{name}</span>{name==='description'?<textarea required value={editForm[name]} onChange={e=>setEditForm({...editForm,[name]:e.target.value})}/>:<input required type={name==='price'?'number':'text'} min={name==='price'?'0':undefined} value={editForm[name]} onChange={e=>setEditForm({...editForm,[name]:e.target.value})}/>}</label>)}<div className="button-row"><button type="button" className="button button-secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="button button-primary" disabled={busy}>Save changes</button></div></form></div>}
  </section>
}
