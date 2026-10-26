import { useEffect, useState } from 'react'
import { deleteListing, updateListing } from '../api/listingApi'
import { getModerationQueue, moderateListing } from '../api/moderationApi'
import StatusBadge from '../components/common/StatusBadge'
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/common/States'
import { formatINR } from '../utils/money'
import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'
import { getAdminDashboard, getAdminListings, getAdminUsers } from '../api/adminApi'
import SponsoredAdsAdmin from '../components/admin/SponsoredAdsAdmin'
import ProtectedImage from '../components/common/ProtectedImage'

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
  const [stats,setStats]=useState(null)
  const [allListings,setAllListings]=useState([])
  const [users,setUsers]=useState([])
  async function load() {
    setLoading(true);setError('')
    try { const [queueData,statData,listingData,userData]=await Promise.all([getModerationQueue(),getAdminDashboard(),getAdminListings(),getAdminUsers()]);setQueue(queueData);setStats(statData);setAllListings(listingData);setUsers(userData) } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(()=>{if(user?.role==='ADMIN')load()},[user?.role])
  if (!user || user.role !== 'ADMIN') return <section className="section-wrap page-section"><div className="workflow-card dashboard-limitation"><h2>{t('Administrator access required')}</h2><p>{t('Sign in with an administrator account to review listings.')}</p><Link className="button button-primary" to="/login">{t('Sign in')}</Link></div></section>
  async function decide(item,status) {
    const reason=(reasons[item.id]||'').trim()
    if(!reason){setError(t('A moderation reason is required.'));return}
    if(status==='REJECTED'&&!window.confirm(t('Reject listing “{title}”?',{title:item.title})))return
    setBusy(true);setError('');setNotice('')
    try { await moderateListing(item.id,{status,reason});setNotice(t('Listing #{id} updated.',{id:item.id}));await load() }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function remove(item) {
    if(!window.confirm(t('Delete listing “{title}”? This cannot be undone.',{title:item.title})))return
    setBusy(true);setError('')
    try { await deleteListing(item.id);setNotice(t('Listing #{id} deleted.',{id:item.id}));await load() }
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
    {stats&&<div className="admin-stats">{[['Total users',stats.totalUsers],['Total listings',stats.totalListings],['Pending review',stats.pendingModeration],['Approved ads',stats.approvedListings],['Sponsored ads',stats.sponsoredAdvertisements]].map(([label,value])=><div className="workflow-card" key={label}><span>{t(label)}</span><b>{value}</b></div>)}</div>}
    {notice&&<Notice>{notice}</Notice>}{error&&<ErrorState message={error}/>}
    {loading?<LoadingState label={t('Loading moderation queue…')}/>:error&&!queue.length?null:queue.length?<div className="moderation-list">{queue.map(item=><article className="moderation-card" key={item.id}>
      <div className="moderation-preview"><div><p className="eyebrow">LISTING #{item.id} · {t(item.categorySlug?.replaceAll('-',' ') || '')}</p><h2>{item.title}</h2><p>{item.description}</p>{item.imageUrls?.length>0&&<div className="detail-gallery">{item.imageUrls.map(src=><ProtectedImage key={src} src={src} alt={item.title}/>)}</div>}<div className="listing-meta"><span>{item.sellerName}</span><span>{item.location}</span><span>{t(item.condition)}</span></div><b>{formatINR(item.price)}</b></div><StatusBadge status={item.status}/></div>
      {item.moderationReason&&<p className="helper-note">{t('Previous note:')} {item.moderationReason}</p>}
      <label className="form-field"><span>{t('Decision reason')} <b>*</b></span><input value={reasons[item.id]||''} onChange={e=>setReasons({...reasons,[item.id]:e.target.value})} placeholder={t('Required by the moderation API')}/></label>
      <div className="button-row"><button className="button button-primary" disabled={busy} onClick={()=>decide(item,'APPROVED')}>{t('Approve')}</button><button className="button button-secondary" disabled={busy} onClick={()=>decide(item,'NEEDS_REVIEW')}>{t('Request review')}</button><button className="button button-danger" disabled={busy} onClick={()=>decide(item,'REJECTED')}>{t('Reject')}</button><button className="button button-quiet" disabled={busy} onClick={()=>beginEdit(item)}>{t('Edit')}</button><button className="button button-quiet" disabled={busy} onClick={()=>remove(item)}>{t('Delete')}</button></div>
    </article>)}</div>:<EmptyState title={t('Queue is clear')} description={t('There are no pending or needs-review listings.')}/ >}
    <section className="workflow-card"><h2>{t('All listings')}</h2><div className="moderation-list">{allListings.map(item=><div className="ledger-row" key={item.id}><span>#{item.id} · {item.title}</span><StatusBadge status={item.status}/></div>)}</div></section>
    <section className="workflow-card"><h2>{t('Registered users')}</h2><div className="moderation-list">{users.map(person=><div className="ledger-row" key={person.id}><span>{person.fullName} · {person.email}</span><b>{person.role}</b></div>)}</div></section>
    <SponsoredAdsAdmin/>
    {editing&&<div className="dialog-backdrop"><form className="form-card edit-dialog" onSubmit={saveEdit}><div className="section-heading"><h2>{t('Edit listing #{id}',{id:editing.id})}</h2><button type="button" className="icon-button" onClick={()=>setEditing(null)}>×</button></div>{['title','description','categorySlug','sellerName','location','price','condition'].map(name=><label className="form-field" key={name}><span>{t(name)}</span>{name==='description'?<textarea required value={editForm[name]} onChange={e=>setEditForm({...editForm,[name]:e.target.value})}/>:<input required type={name==='price'?'number':'text'} min={name==='price'?'0':undefined} value={editForm[name]} onChange={e=>setEditForm({...editForm,[name]:e.target.value})}/>}</label>)}<div className="button-row"><button type="button" className="button button-secondary" onClick={()=>setEditing(null)}>{t('Cancel')}</button><button className="button button-primary" disabled={busy}>{t('Save changes')}</button></div></form></div>}
  </section>
}
