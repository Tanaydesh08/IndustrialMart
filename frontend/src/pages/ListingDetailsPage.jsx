import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getListing } from '../api/listingApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, LoadingState } from '../components/common/States'
import { formatINR } from '../utils/money'
import { useApp } from '../context/AppContext'
import CategoryIcon from '../components/common/CategoryIcon'
import { getUnlockedListingDetails, unlockListing } from '../api/unlockApi'
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
  async function load() {
    setLoading(true); setError('')
    try { setListing(await getListing(id)) } catch (err) { setError(err.message); setListing(null) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])
  async function unlock() {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUYER') { setUnlockMessage(t('A buyer account is required to unlock listings.')); return }
    setUnlockBusy(true); setUnlockMessage('')
    try {
      const result = await unlockListing(id)
      const details = await getUnlockedListingDetails(id)
      setListing(details)
      setUnlockMessage(result.charged ? t(`Unlocked. ${result.creditsCharged} credit used; ${result.remainingCredits} remaining.`) : t('This listing was already unlocked; no credit was charged.'))
    } catch (err) { setUnlockMessage(err.message) }
    finally { setUnlockBusy(false) }
  }
  if (loading) return <section className="section-wrap page-section"><LoadingState label={t('Loading listing…')}/></section>
  if (error) return <section className="section-wrap page-section"><Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> {t('Back to marketplace')}</Link><ErrorState message={error} onRetry={load}/></section>
  return <section className="section-wrap page-section">
    <Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> {t('Back to marketplace')}</Link>
    <article className="detail-layout"><div className={`detail-illustration detail-art-${listing.categorySlug || 'default'}`}><span><CategoryIcon slug={listing.categorySlug}/></span><i className="detail-orbit detail-orbit-one"/><i className="detail-orbit detail-orbit-two"/></div><div className="detail-content"><div className="detail-top"><p className="eyebrow">{t(listing.categorySlug?.replaceAll('-',' ') || '')}</p><StatusBadge status={listing.status}/></div><h1>{t(listing.title)}</h1><p className="detail-price">{formatINR(listing.price)}</p><p className="detail-description">{t(listing.description)}</p><dl className="detail-facts"><div><dt>{t('Condition')}</dt><dd>{t(listing.condition)}</dd></div><div><dt>{t('Seller')}</dt><dd>{t(listing.sellerName)}</dd></div><div><dt>{t('Location')}</dt><dd><MapPin size={15}/>{t(listing.location)}</dd></div><div><dt>{t('Moderation status')}</dt><dd><StatusBadge status={listing.status}/></dd></div></dl>{user?.role==='BUYER'&&listing.status==='APPROVED'&&<button className="button button-primary" disabled={unlockBusy} onClick={unlock}>{unlockBusy?t('Unlocking…'):t('Unlock with 1 credit')}</button>}{unlockMessage&&<p className="helper-note" role="status">{t(unlockMessage)}</p>}</div></article>
  </section>
}
