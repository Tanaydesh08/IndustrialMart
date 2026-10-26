import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getListing } from '../api/listingApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, LoadingState } from '../components/common/States'
import { formatINR, paiseToRupees } from '../utils/money'
import { useApp } from '../context/AppContext'
import CategoryIcon from '../components/common/CategoryIcon'
import { getUnlockedListingDetails, createListingUnlockPayment, simulatePayment } from '../api/unlockApi'
import ProtectedImage from '../components/common/ProtectedImage'

// Only public previews are retained in memory. Entitlement is checked by the backend on every visit.
const listingPreviews = new Map()

export default function ListingDetailsPage() {
  const { t, tError, user } = useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlockBusy, setUnlockBusy] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [payment, setPayment] = useState(null)
  const requestVersion = useRef(0)
  const flowVersion = useRef(0)
  const actionInFlight = useRef(false)

  const load = useCallback(async (signal) => {
    const version = ++requestVersion.current
    setLoading(true)
    setError('')
    try {
      let data
      if (user?.role === 'BUYER') {
        try {
          // This protected response is the only source of unlock authorization.
          data = { ...(await getUnlockedListingDetails(id, { signal })), unlockAuthorized: true }
        } catch (accessError) {
          if (![403, 404].includes(accessError.status)) throw accessError
          data = listingPreviews.get(String(id))
          if (!data) {
            data = await getListing(id, { signal })
            listingPreviews.set(String(id), data)
          }
        }
      } else {
        data = await getListing(id, { signal })
        listingPreviews.set(String(id), data)
      }
      if (version === requestVersion.current && !signal?.aborted) setListing(data)
    } catch (err) {
      if (version === requestVersion.current && !signal?.aborted) {
        setError(err.message)
        setListing(null)
      }
    } finally {
      if (version === requestVersion.current && !signal?.aborted) setLoading(false)
    }
  }, [id, user?.role, user?.token])

  useEffect(() => {
    const controller = new AbortController()
    flowVersion.current += 1
    actionInFlight.current = false
    setPayment(null)
    setUnlockMessage('')
    setUnlockError('')
    setUnlockBusy(false)
    load(controller.signal)
    return () => {
      controller.abort()
      requestVersion.current += 1
      flowVersion.current += 1
    }
  }, [load])

  async function revealUnlockedDetails(transaction, actionVersion) {
    try {
      const details = await getUnlockedListingDetails(id)
      if (actionVersion !== flowVersion.current) return
      setListing({ ...details, unlockAuthorized: true })
      setPayment(null)
      setUnlockMessage('Listing details are unlocked. This was a simulated payment.')
      setUnlockError('')
    } catch (err) {
      if (actionVersion !== flowVersion.current) return
      // Payment already succeeded. Keep it successful and offer a details-only retry.
      setPayment(transaction)
      setUnlockError(err.message)
    }
  }

  async function unlock() {
    if (actionInFlight.current) return
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUYER') { setUnlockMessage('A buyer account is required to unlock listings.'); return }

    actionInFlight.current = true
    const actionVersion = flowVersion.current
    setUnlockBusy(true)
    setUnlockMessage('')
    setUnlockError('')
    try {
      const transaction = await createListingUnlockPayment(id)
      if (actionVersion !== flowVersion.current) return
      if (transaction.status === 'SUCCESS') {
        await revealUnlockedDetails(transaction, actionVersion)
      } else {
        setPayment(transaction)
        setUnlockMessage('Payment is ready. Choose a demo result.')
      }
    } catch (err) {
      if (actionVersion === flowVersion.current) setUnlockError(err.message)
    } finally {
      if (actionVersion === flowVersion.current) {
        actionInFlight.current = false
        setUnlockBusy(false)
      }
    }
  }

  async function finishUnlock(success) {
    if (!payment || payment.status !== 'PENDING' || actionInFlight.current) return
    actionInFlight.current = true
    const actionVersion = flowVersion.current
    setUnlockBusy(true)
    setUnlockMessage('')
    setUnlockError('')
    try {
      const result = await simulatePayment(payment.id, success)
      if (actionVersion !== flowVersion.current) return
      if (result.status !== 'SUCCESS') {
        setPayment(null)
        setUnlockMessage('Payment failed. Try again to unlock this listing.')
        return
      }
      await revealUnlockedDetails(result, actionVersion)
    } catch (err) {
      if (actionVersion === flowVersion.current) setUnlockError(err.message)
    } finally {
      if (actionVersion === flowVersion.current) {
        actionInFlight.current = false
        setUnlockBusy(false)
      }
    }
  }

  async function retryDetails() {
    if (!payment || payment.status !== 'SUCCESS' || actionInFlight.current) return
    actionInFlight.current = true
    const actionVersion = flowVersion.current
    setUnlockBusy(true)
    setUnlockError('')
    try {
      await revealUnlockedDetails(payment, actionVersion)
    } finally {
      if (actionVersion === flowVersion.current) {
        actionInFlight.current = false
        setUnlockBusy(false)
      }
    }
  }

  if (loading) return <section className="section-wrap page-section"><LoadingState label={t('Loading listing...')}/></section>
  if (error) return <section className="section-wrap page-section"><Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> {t('Back to marketplace')}</Link><ErrorState message={error} onRetry={() => load()}/></section>

  return <section className="section-wrap page-section">
    <Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> {t('Back to marketplace')}</Link>
    <article className="detail-layout"><div className="detail-content">
      <div className="detail-top"><p className="eyebrow">{t(listing.categorySlug?.replaceAll('-', ' ') || '')}</p><StatusBadge status={listing.status}/></div>
      <h1>{listing.title}</h1>
      {listing.imageUrls?.length ? <div className="detail-gallery">{listing.imageUrls.map(src=><ProtectedImage key={src} src={src} alt={listing.title}/>)}</div> : <div className={`detail-illustration detail-art-${listing.categorySlug || 'default'}`}><span><CategoryIcon slug={listing.categorySlug}/></span></div>}
      <p className="detail-price">{formatINR(listing.price)}</p>
      {listing.unlockAuthorized && <><p className="detail-description">{listing.description}</p><dl className="detail-facts"><div><dt>{t('Condition')}</dt><dd>{t(listing.condition)}</dd></div><div><dt>{t('Seller')}</dt><dd>{listing.sellerName}</dd></div><div><dt>{t('Location')}</dt><dd><MapPin size={15}/>{listing.location}</dd></div></dl></>}
      {user?.role === 'BUYER' && listing.status === 'APPROVED' && !listing.unlockAuthorized && <div className="workflow-card">
        <p>{t('Seller details become available after payment.')}</p>
        <p className="helper-note">{t('Prototype payment: no real money is charged.')}</p>
        {!payment && <button className="button button-primary" disabled={unlockBusy} onClick={unlock}>{unlockBusy ? t('Payment is processing...') : t('Pay ₹99 to View Details')}</button>}
        {payment?.status === 'PENDING' && <><p className="detail-price">{t('Simulated amount')}: {formatINR(paiseToRupees(payment.amountPaise))}</p><div className="button-row"><button className="button button-primary" disabled={unlockBusy} onClick={() => finishUnlock(true)}>{t('Demo: Payment successful')}</button><button className="button button-secondary" disabled={unlockBusy} onClick={() => finishUnlock(false)}>{t('Demo: Payment failed')}</button></div></>}
        {payment?.status === 'SUCCESS' && <button className="button button-primary" disabled={unlockBusy} onClick={retryDetails}>{t('Load unlocked details')}</button>}
      </div>}
      {unlockMessage && <p className="helper-note" role="status">{t(unlockMessage)}</p>}
      {unlockError && <p className="helper-note" role="alert">{tError(unlockError)}</p>}
    </div></article>
  </section>
}
