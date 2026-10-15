import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createListing } from '../api/listingApi'
import { getCategories } from '../api/categoryApi'
import { createListingFeePayment, simulatePayment } from '../api/paymentApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, LoadingState, Notice } from '../components/common/States'
import { formatINR, paiseToRupees } from '../utils/money'

const emptyForm = { title:'', description:'', categorySlug:'', sellerName:'', location:'', price:'', condition:'NEW' }

export default function CreateListingPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [accountId, setAccountId] = useState('1')
  const [listing, setListing] = useState(null)
  const [payment, setPayment] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
  useEffect(() => { getCategories().then(setCategories).catch(err=>setCategoriesError(err.message)) }, [])

  function validate() {
    const errors = {}
    for (const name of ['title','description','categorySlug','sellerName','location','condition']) if (!String(form[name]||'').trim()) errors[name] = 'This field is required.'
    if (form.description.length > 5000) errors.description = 'Description must be 5000 characters or fewer.'
    if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) errors.price = 'Enter a valid price of zero or more.'
    if (!accountId || Number(accountId) <= 0) errors.accountId = 'Enter a positive prototype account ID.'
    setFieldErrors(errors)
    return !Object.keys(errors).length
  }
  async function handleCreate(e) {
    e.preventDefault()
    if (!validate()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const created = await createListing({ ...form, price:Number(form.price) })
      setListing(created); setPayment(null); setNotice('Listing created. It is pending moderation and is not public yet.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function startFee() {
    if (!listing || !Number(accountId)) return
    setBusy(true); setError('')
    try { setPayment(await createListingFeePayment(Number(accountId), listing.id)); setNotice('Fee transaction created. Choose a simulation outcome to continue.') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function finishPayment(success) {
    if (!payment) return
    setBusy(true); setError('')
    try {
      const result = await simulatePayment(Number(accountId), payment.id, success)
      setPayment(result)
      setNotice(result.status === 'SUCCESS' ? 'Payment is successful. The listing still needs moderation approval.' : 'Payment failed. Create a new fee transaction to retry.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function retryFee() { setPayment(null); await startFee() }
  const update = e => setForm(current=>({...current,[e.target.name]:e.target.value}))
  return <section className="section-wrap page-section narrow-section">
    <div className="page-heading"><p className="eyebrow">SELLER WORKFLOW</p><h1>Create a listing</h1><p>Submit the backend listing fields, then initiate and simulate its listing-fee transaction.</p></div>
    {categoriesError&&<ErrorState message={categoriesError} onRetry={()=>getCategories().then(setCategories).catch(err=>setCategoriesError(err.message))}/>}
    {notice&&<Notice>{notice}</Notice>}
    {error&&<ErrorState message={error}/>}
    {!listing&&<form className="form-card" onSubmit={handleCreate} noValidate>
      <Field name="title" label="Listing title" value={form.title} update={update} error={fieldErrors.title} required placeholder="Industrial rice whitener"/>
      <Field name="description" label="Description" value={form.description} update={update} error={fieldErrors.description} required multiline placeholder="Describe the item accurately."/>
      <label className="form-field"><span>Category <b>*</b></span><select name="categorySlug" value={form.categorySlug} onChange={update}><option value="">Select category</option>{categories.map(category=><option key={category.id} value={category.slug}>{category.name}</option>)}</select>{fieldErrors.categorySlug&&<small>{fieldErrors.categorySlug}</small>}</label>
      <div className="form-grid"><Field name="sellerName" label="Seller / business name" value={form.sellerName} update={update} error={fieldErrors.sellerName} required/><Field name="location" label="Location" value={form.location} update={update} error={fieldErrors.location} required/></div>
      <div className="form-grid"><Field name="price" label="Price (INR)" value={form.price} update={update} error={fieldErrors.price} required type="number" min="0" step="0.01"/><Field name="condition" label="Condition" value={form.condition} update={update} error={fieldErrors.condition} required placeholder="e.g. NEW"/></div>
      <label className="form-field"><span>Prototype account ID for fee payment <b>*</b></span><input type="number" min="1" value={accountId} onChange={e=>setAccountId(e.target.value)}/><small>There is no login or seller-to-listing ownership API yet.</small>{fieldErrors.accountId&&<small>{fieldErrors.accountId}</small>}</label>
      <button className="button button-primary" disabled={busy}>{busy?'Saving…':'Create listing'}</button>
    </form>}
    {listing&&<div className="workflow-card"><div className="section-heading"><div><p className="eyebrow">LISTING #{listing.id}</p><h2>{listing.title}</h2></div><StatusBadge status={listing.status}/></div><p>{listing.description}</p><p className="listing-price">{formatINR(listing.price)}</p><p className="helper-note">A newly created listing remains pending review and is not shown in the approved marketplace.</p>
      {!payment&&<button className="button button-primary" disabled={busy} onClick={startFee}>Initiate listing fee</button>}
      {payment&&<div className="payment-box"><div><p className="eyebrow">PAYMENT #{payment.id}</p><h3>{formatINR(paiseToRupees(payment.amountPaise))}</h3><StatusBadge status={payment.status}/><p className="helper-note">Simulation only. No payment gateway or real charge is used.</p></div>{payment.status==='PENDING'&&<div className="button-row"><button disabled={busy} className="button button-primary" onClick={()=>finishPayment(true)}>Simulate success</button><button disabled={busy} className="button button-secondary" onClick={()=>finishPayment(false)}>Simulate failure</button></div>}{payment.status==='FAILED'&&<button disabled={busy} className="button button-secondary" onClick={retryFee}>Create a new fee transaction</button>}</div>}
      <div className="button-row"><Link className="button button-secondary" to={`/listings/${listing.id}`}>View listing</Link><button className="button button-quiet" onClick={()=>{setListing(null);setPayment(null);setForm(emptyForm)}}>Create another</button></div>
    </div>}
  </section>
}

function Field({name,label,value,update,error,required=false,multiline=false,...props}) {
  const Control=multiline?'textarea':'input'
  return <label className="form-field"><span>{label} {required&&<b>*</b>}</span><Control name={name} value={value} onChange={update} required={required} {...props}/>{error&&<small>{error}</small>}</label>
}
