import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getListing } from '../api/listingApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, LoadingState } from '../components/common/States'
import { formatINR } from '../utils/money'
import { useApp } from '../context/AppContext'
import CategoryIcon from '../components/common/CategoryIcon'
import { getUnlockedListingDetails, createListingUnlockPayment, simulatePayment } from '../api/unlockApi'
import { useNavigate } from 'react-router-dom'

export default function ListingDetailsPage() {
  const { t } = useApp()
  const { user } = useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlockBusy, setUnlockBusy] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState('')
  const [payment, setPayment] = useState(null)
  async function load() {
    setLoading(true); setError('')
    try {
      let data = await getListing(id)
      if (user?.role === 'BUYER') {
        try { data = { ...(await getUnlockedListingDetails(id)), unlockAuthorized: true } }
        catch (accessError) { if (![403, 404].includes(accessError.status)) throw accessError }
      }
      setListing(data)
    } catch (err) { setError(err.message); setListing(null) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id, user?.token])
  async function unlock() {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUYER') { setUnlockMessage(t('A buyer account is required to unlock listings.')); return }
    setUnlockBusy(true); setUnlockMessage('')
    try {
      setPayment(await createListingUnlockPayment(id))
      setUnlockMessage(t('Payment taiyar hai. Demo ke liye result chunein.'))
    } catch (err) { setUnlockMessage(err.message) }
    finally { setUnlockBusy(false) }
  }
  async function finishUnlock(success) {
    if (!payment || unlockBusy) return
    setUnlockBusy(true); setUnlockMessage('')
    try {
      const result = await simulatePayment(payment.id, success)
      if (result.status !== 'SUCCESS') { setUnlockMessage(t('Payment nahi ho paya. Dobara koshish karein.')); setPayment(null); return }
      const details = await getUnlockedListingDetails(id)
      setListing(details)
      setUnlockMessage(t('Jaankari khul gayi. Yeh demo payment hai.'))
    } catch (err) { setUnlockMessage(err.message) }
    finally { setUnlockBusy(false) }
  }
  if (loading) return <section className="section-wrap page-section"><LoadingState label={t('Loading listing…')}/></section>
  if (error) return <section className="section-wrap page-section"><Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> {t('Back to marketplace')}</Link><ErrorState message={error} onRetry={load}/></section>
  return <section className="section-wrap page-section">
    <Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> {t('Back to marketplace')}</Link>
    <article className="detail-layout"><div className="detail-content"><div className="detail-top"><p className="eyebrow">{t(listing.categorySlug?.replaceAll('-',' ') || '')}</p><StatusBadge status={listing.status}/></div><h1>{t(listing.title)}</h1>{listing.imageUrls?.length ? <div className="detail-gallery">{listing.imageUrls.map(src=><img key={src} src={src} alt={listing.title}/>)}</div> : <div className={`detail-illustration detail-art-${listing.categorySlug || 'default'}`}><span><CategoryIcon slug={listing.categorySlug}/></span></div>}<p className="detail-price">{formatINR(listing.price)}</p>{listing.unlockAuthorized&&<><p className="detail-description">{t(listing.description)}</p><dl className="detail-facts"><div><dt>{t('Condition')}</dt><dd>{t(listing.condition)}</dd></div><div><dt>{t('Seller')}</dt><dd>{t(listing.sellerName)}</dd></div><div><dt>{t('Location')}</dt><dd><MapPin size={15}/>{t(listing.location)}</dd></div></dl></>}{user?.role==='BUYER'&&listing.status==='APPROVED'&&!listing.unlockAuthorized&&<div className="workflow-card"><p>{t('Seller ki poori jaankari payment ke baad milegi.')}</p><p className="helper-note">{t('Prototype payment: no real money is charged.')}</p>{!payment?<button className="button button-primary" disabled={unlockBusy} onClick={unlock}>{unlockBusy?t('Payment chal raha hai…'):'Jaankari Dekhne Ke Liye ₹99 Pay Karein'}</button>:<div className="button-row"><button className="button button-primary" disabled={unlockBusy} onClick={()=>finishUnlock(true)}>{t('Demo: Payment successful')}</button><button className="button button-secondary" disabled={unlockBusy} onClick={()=>finishUnlock(false)}>{t('Demo: Payment failed')}</button></div>}</div>}{unlockMessage&&<p className="helper-note" role="status">{unlockMessage}</p>}</div></article>
  </section>
}
