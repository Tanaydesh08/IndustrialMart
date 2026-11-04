import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getMyListings } from '../api/listingApi'
import { createListingFeePayment, simulatePayment } from '../api/paymentApi'
import { useApp } from '../context/AppContext'
import StatusBadge from '../components/common/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { formatINR, paiseToRupees } from '../utils/money'

export default function SellerDashboardPage() {
  const { t, user } = useApp()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState({})
  const [paymentBusy, setPaymentBusy] = useState({})
  const [paymentError, setPaymentError] = useState('')
  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getMyListings().then(setListings).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, user?.token])

  async function startFee(item) {
    setPaymentError('')
    setPaymentBusy(current => ({ ...current, [item.id]: true }))
    try {
      const payment = await createListingFeePayment(item.id)
      setPayments(current => ({ ...current, [item.id]: payment }))
    } catch (e) { setPaymentError(e.message) }
    finally { setPaymentBusy(current => ({ ...current, [item.id]: false })) }
  }

  async function finishFee(item, success) {
    const payment = payments[item.id]
    if (!payment) return
    setPaymentError('')
    setPaymentBusy(current => ({ ...current, [item.id]: true }))
    try {
      const result = await simulatePayment(payment.id, success)
      setPayments(current => ({ ...current, [item.id]: result }))
    } catch (e) { setPaymentError(e.message) }
    finally { setPaymentBusy(current => ({ ...current, [item.id]: false })) }
  }

  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('SELLER SPACE')}</p><h1>{t('My Ads')}</h1><p>{t('Start a listing and follow its payment and moderation status.')}</p></div>
    <div className="seller-listing-actions"><Link className="button button-primary" to="/create-listing"><Plus size={17} /> {t('Post an Ad')}</Link></div>
    {paymentError && <ErrorState message={paymentError}/>}
    {loading ? <LoadingState label={t('Loading listings...')} /> : error ? <ErrorState message={error} onRetry={load} /> : listings.length ? <div className="moderation-list">{listings.map(item => {
      const payment = payments[item.id]
      const feeEligible = !['APPROVED', 'REJECTED'].includes(item.status)
      return <article className="workflow-card" key={item.id}>
        <div className="section-heading"><div><p className="eyebrow">#{item.id}</p><h2>{item.title}</h2></div><StatusBadge status={item.status} /></div>
        <p>{formatINR(item.price)} · {t(item.categorySlug)}</p>
        {item.moderationReason && <p>{item.moderationReason}</p>}
        {feeEligible && <div className="payment-box">
          <div><h3>{t('Listing fee')}</h3>{payment ? <><p>{formatINR(paiseToRupees(payment.amountPaise))}</p><StatusBadge status={payment.status}/></> : <p className="helper-note">{t('A successful listing fee payment is required before admin approval.')}</p>}</div>
          {!payment && <button className="button button-primary" disabled={paymentBusy[item.id]} onClick={() => startFee(item)}>{paymentBusy[item.id] ? t('Preparing listing fee payment...') : t('Pay or check listing fee')}</button>}
          {payment?.status === 'PENDING' && <div className="button-row"><button className="button button-primary" disabled={paymentBusy[item.id]} onClick={() => finishFee(item, true)}>{t('Simulate success')}</button><button className="button button-secondary" disabled={paymentBusy[item.id]} onClick={() => finishFee(item, false)}>{t('Simulate failure')}</button></div>}
          {payment?.status === 'FAILED' && <button className="button button-secondary" disabled={paymentBusy[item.id]} onClick={() => startFee(item)}>{t('Create a new fee transaction')}</button>}
          {payment?.status === 'SUCCESS' && <p className="helper-note">{t('Listing fee paid. Waiting for admin approval.')}</p>}
        </div>}
        <Link className="button button-secondary" to={`/listings/${item.id}`}>{t('View Details')}</Link>
      </article>
    })}</div> : <EmptyState title={t('No listings yet')} description={t('Create an ad and follow payment and moderation status here.')} />}
  </section>
}
