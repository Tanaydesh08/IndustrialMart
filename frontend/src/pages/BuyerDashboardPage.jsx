import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCreditLedger, getWallet } from '../api/walletApi'
import { createCreditPayment, simulatePayment } from '../api/paymentApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, EmptyState, LoadingState } from '../components/common/States'
import { formatINR, paiseToRupees } from '../utils/money'

export default function BuyerDashboardPage() {
  const [accountId,setAccountId]=useState('1')
  const [wallet,setWallet]=useState(null)
  const [ledger,setLedger]=useState([])
  const [payment,setPayment]=useState(null)
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [loaded,setLoaded]=useState(false)
  async function refresh() {
    if (!accountId || Number(accountId)<=0) { setError('Enter a positive account ID.'); return }
    setLoading(true);setError('')
    try { const [w,l]=await Promise.all([getWallet(Number(accountId)),getCreditLedger(Number(accountId))]);setWallet(w);setLedger(l);setLoaded(true) }
    catch(err) { setWallet(null);setLedger([]);setLoaded(false);setError(err.message) }
    finally { setLoading(false) }
  }
  async function buy() {
    setBusy(true);setError('')
    try { const created=await createCreditPayment(Number(accountId));setPayment(created) }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function simulate(success) {
    setBusy(true);setError('')
    try { const result=await simulatePayment(Number(accountId),payment.id,success);setPayment(result);if(result.status==='SUCCESS')await refresh() }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">BUYER SPACE</p><h1>Credits and wallet</h1><p>Use the backend prototype account ID to view the credit wallet and ledger or simulate a credit-pack payment.</p></div>
    <div className="wallet-toolbar"><label className="form-field"><span>Prototype account ID</span><input type="number" min="1" value={accountId} onChange={e=>{setAccountId(e.target.value);setWallet(null);setLedger([]);setLoaded(false);setPayment(null)}}/></label><div className="button-row"><button className="button button-secondary" onClick={refresh} disabled={loading}>{loading?'Loading…':'Load wallet'}</button><button className="button button-primary" onClick={buy} disabled={busy||!accountId}>Create credit-pack payment</button></div></div>
    {error&&<ErrorState message={error} onRetry={refresh}/>}
    {loading&&<LoadingState label="Loading wallet…"/>}
    {loaded&&wallet&&<div className="wallet-balance"><span>Available credits</span><b>{wallet.balance}</b><small>Account #{wallet.accountId}</small></div>}
    {payment&&<div className="payment-box"><div><p className="eyebrow">CREDIT PACK PAYMENT #{payment.id}</p><h2>{formatINR(paiseToRupees(payment.amountPaise))} · {payment.creditsToGrant} credits</h2><StatusBadge status={payment.status}/><p className="helper-note">Prototype simulation only; no real payment is collected.</p></div>{payment.status==='PENDING'&&<div className="button-row"><button disabled={busy} className="button button-primary" onClick={()=>simulate(true)}>Simulate success</button><button disabled={busy} className="button button-secondary" onClick={()=>simulate(false)}>Simulate failure</button></div>}</div>}
    <div className="section-heading compact-heading"><div><p className="eyebrow">CREDIT LEDGER</p><h2>Wallet activity</h2></div></div>
    {loaded?(ledger.length?<div className="ledger-list">{ledger.map(entry=><div key={entry.id} className="ledger-row"><div><b>{entry.reason}</b><small>Payment #{entry.paymentId} · {entry.createdAt?.replace('T',' ')}</small></div><strong>{entry.creditChange>0?'+':''}{entry.creditChange}</strong></div>)}</div>:<EmptyState title="No credit transactions" description="Credit activity will appear here after a successful purchase."/>):<p className="helper-note">Load a wallet to view its ledger.</p>}
    <div className="buyer-note"><b>Buyer listing unlocks are not implemented by the backend.</b><p>There is no unlock, protected-listing, or credit-deduction endpoint, so this client does not simulate unlocking items.</p><Link to="/marketplace">Browse approved listings</Link></div>
  </section>
}
