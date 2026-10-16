import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCreditLedger, getWallet } from '../api/walletApi'
import { createCreditPayment, simulatePayment } from '../api/paymentApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, EmptyState, LoadingState } from '../components/common/States'
import { formatINR, paiseToRupees } from '../utils/money'
import { useApp } from '../context/AppContext'
import { getBuyerUnlocks } from '../api/unlockApi'

export default function BuyerDashboardPage() {
  const { user, t } = useApp()
  const [wallet,setWallet]=useState(null)
  const [ledger,setLedger]=useState([])
  const [payment,setPayment]=useState(null)
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [loaded,setLoaded]=useState(false)
  const [unlocks,setUnlocks]=useState([])
  async function refresh() {
    setLoading(true);setError('')
    try { const [w,l,u]=await Promise.all([getWallet(),getCreditLedger(),getBuyerUnlocks()]);setWallet(w);setLedger(l);setUnlocks(u);setLoaded(true) }
    catch(err) { setWallet(null);setLedger([]);setUnlocks([]);setLoaded(false);setError(err.message) }
    finally { setLoading(false) }
  }
  async function buy() {
    setBusy(true);setError('')
    try { const created=await createCreditPayment();setPayment(created) }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function simulate(success) {
    setBusy(true);setError('')
    try { const result=await simulatePayment(payment.id,success);setPayment(result);if(result.status==='SUCCESS')await refresh() }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('BUYER SPACE')}</p><h1>{t('Credits and wallet')}</h1><p>View your credit wallet and ledger or simulate a credit-pack payment.</p></div>
    {!user?<div className="workflow-card"><h2>{t('Sign in to access your wallet')}</h2><Link className="button button-primary" to="/login">{t('Sign in')}</Link></div>:user.role!=='BUYER'?<div className="workflow-card"><h2>{t('Buyer account required')}</h2><p>{t('Wallet and credits are available to buyer accounts.')}</p></div>:<div className="wallet-toolbar"><div><b>{t(user.fullName)}</b><p className="helper-note">{t('Your secure buyer account')}</p></div><div className="button-row"><button className="button button-secondary" onClick={refresh} disabled={loading}>{loading?'Loading…':t('Load wallet')}</button><button className="button button-primary" onClick={buy} disabled={busy}>{t('Create credit-pack payment')}</button></div></div>}
    {error&&<ErrorState message={error} onRetry={refresh}/>}
    {loading&&<LoadingState label="Loading wallet…"/>}
    {loaded&&wallet&&<div className="wallet-balance"><span>{t('Available credits')}</span><b>{wallet.balance}</b><small>{t(user.fullName)}</small></div>}
    {payment&&<div className="payment-box"><div><p className="eyebrow">CREDIT PACK PAYMENT #{payment.id}</p><h2>{formatINR(paiseToRupees(payment.amountPaise))} · {payment.creditsToGrant} credits</h2><StatusBadge status={payment.status}/><p className="helper-note">Prototype simulation only; no real payment is collected.</p></div>{payment.status==='PENDING'&&<div className="button-row"><button disabled={busy} className="button button-primary" onClick={()=>simulate(true)}>Simulate success</button><button disabled={busy} className="button button-secondary" onClick={()=>simulate(false)}>Simulate failure</button></div>}</div>}
    <div className="section-heading compact-heading"><div><p className="eyebrow">CREDIT LEDGER</p><h2>{t('Wallet activity')}</h2></div></div>
    {loaded?(ledger.length?<div className="ledger-list">{ledger.map(entry=><div key={entry.id} className="ledger-row"><div><b>{t(entry.reason)}</b><small>Payment #{entry.paymentId} · {entry.createdAt?.replace('T',' ')}</small></div><strong>{entry.creditChange>0?'+':''}{entry.creditChange}</strong></div>)}</div>:<EmptyState title="No credit transactions" description="Credit activity will appear here after a successful purchase."/>):<p className="helper-note">Load a wallet to view its ledger.</p>}
    {loaded&&<><div className="section-heading compact-heading"><div><p className="eyebrow">LISTING ACCESS</p><h2>{t('Unlocked listings')}</h2></div></div>{unlocks.length?<div className="ledger-list">{unlocks.map(item=><div className="ledger-row" key={item.id}><div><b>{t(`Listing #${item.listingId}`)}</b><small>{item.unlockedAt?.replace('T',' ')}</small></div><Link className="text-link" to={`/listings/${item.listingId}`}>{t('View listing')}</Link></div>)}</div>:<EmptyState title="No unlocked listings" description="Unlock an approved listing with one credit to find it here."/>}</>}
    <div className="buyer-note"><b>{t('Credit unlocks are prototype functionality.')}</b><p>{t('Unlocking an approved listing uses one credit. Repeat access does not charge again.')}</p><Link to="/marketplace">{t('Browse approved listings')}</Link></div>
  </section>
}
