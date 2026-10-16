import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCreditPayment, simulatePayment } from '../api/paymentApi'
import { getCreditLedger, getWallet } from '../api/walletApi'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import StatusBadge from '../components/common/StatusBadge'
import { useApp } from '../context/AppContext'
import { formatINR, paiseToRupees } from '../utils/money'

export default function PaymentsPage() {
  const { user, t } = useApp()
  const [wallet, setWallet] = useState(null)
  const [ledger, setLedger] = useState([])
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true); setError('')
    try {
      const [balance, entries] = await Promise.all([getWallet(), getCreditLedger()])
      setWallet(balance); setLedger(entries)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (user?.role === 'BUYER') refresh() }, [user?.role])

  async function buyCredits() {
    setBusy(true); setError('')
    try { setPayment(await createCreditPayment()) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function simulate(success) {
    setBusy(true); setError('')
    try {
      const updated = await simulatePayment(payment.id, success)
      setPayment(updated)
      if (updated.status === 'SUCCESS') await refresh()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('BUYER SPACE')}</p><h1>{t('Payments & ledger')}</h1><p>{t('Manage prototype credit-pack payments and review wallet transactions.')}</p></div>
    {user?.role !== 'BUYER' ? <div className="workflow-card"><h2>{t('Buyer account required')}</h2><p>{t('Wallet and credit purchases are available to buyer accounts.')}</p><Link className="button button-secondary" to="/buyer">{t('Back to buyer space')}</Link></div> : <>
      <div className="wallet-toolbar"><div><span className="eyebrow">{t('AVAILABLE CREDITS')}</span><div className="wallet-balance"><b>{wallet?.balance ?? '—'}</b><small>{t('Current wallet balance')}</small></div></div><div className="button-row"><button className="button button-secondary" disabled={loading} onClick={refresh}>{loading?t('Loading…'):t('Refresh wallet')}</button><button className="button button-primary" disabled={busy} onClick={buyCredits}>{t('Create credit-pack payment')}</button></div></div>
      {error&&<ErrorState message={error} onRetry={refresh}/>}
      {loading&&!wallet&&<LoadingState label={t('Loading wallet…')}/>}
      {payment&&<div className="payment-box"><div><p className="eyebrow">{t(`CREDIT PACK PAYMENT #${payment.id}`)}</p><h2>{formatINR(paiseToRupees(payment.amountPaise))} · {payment.creditsToGrant} {t('credits')}</h2><StatusBadge status={payment.status}/><p className="helper-note">{t('Prototype simulation only. No real payment is collected.')}</p></div>{payment.status==='PENDING'&&<div className="button-row"><button disabled={busy} className="button button-primary" onClick={()=>simulate(true)}>{t('Simulate success')}</button><button disabled={busy} className="button button-secondary" onClick={()=>simulate(false)}>{t('Simulate failure')}</button></div>}</div>}
      <div className="section-heading compact-heading"><div><p className="eyebrow">{t('CREDIT LEDGER')}</p><h2>{t('Wallet activity')}</h2></div></div>
      {ledger.length?<div className="ledger-list">{ledger.map(entry=><div className="ledger-row" key={entry.id}><div><b>{t(entry.reason)}</b><small>{entry.paymentId?`${t('Payment')} #${entry.paymentId}`:`${t('Listing')} #${entry.listingId}`} · {entry.createdAt?.replace('T',' ')}</small></div><strong className={entry.creditChange<0?'credit-debit':''}>{entry.creditChange>0?'+':''}{entry.creditChange} {t('credits')}</strong></div>)}</div>:!loading&&<EmptyState title={t('No credit transactions')} description={t('Credit purchases and listing unlocks will appear here.')}/>}
      <p className="helper-note">{t('Seller listing-fee payments are initiated from the listing creation flow.') } <Link to="/create-listing">{t('Create a listing')}</Link></p>
    </>}
  </section>
}
