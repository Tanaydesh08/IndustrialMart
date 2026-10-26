import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createListing, updateListing, uploadListingImages } from '../api/listingApi'
import { getCategories } from '../api/categoryApi'
import { createListingFeePayment, simulatePayment } from '../api/paymentApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, LoadingState, Notice } from '../components/common/States'
import { formatINR, paiseToRupees } from '../utils/money'
import { useApp } from '../context/AppContext'

const emptyForm = { title:'', description:'', categorySlug:'', sellerName:'', location:'', price:'', condition:'NEW' }

export default function CreateListingPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [listing, setListing] = useState(null)
  const [pendingPhotoListing, setPendingPhotoListing] = useState(null)
  const [payment, setPayment] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
  const [photos, setPhotos] = useState([])
  const { user, t } = useApp()
  useEffect(() => { getCategories().then(setCategories).catch(err=>setCategoriesError(err.message)) }, [])

  function validate() {
    const errors = {}
    for (const name of ['title','description','categorySlug','sellerName','location','condition']) if (!String(form[name]||'').trim()) errors[name] = 'This field is required.'
    if (!photos.length) errors.photos = 'Upload at least one photo.'
    if (form.description.length > 5000) errors.description = 'Description must be 5000 characters or fewer.'
    if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) errors.price = 'Enter a valid price of zero or more.'
    setFieldErrors(errors)
    return !Object.keys(errors).length
  }
  async function handleCreate(e) {
    e.preventDefault()
    if (!validate()) return
    setBusy(true); setError(''); setNotice('')
    let created = pendingPhotoListing
    try {
      const payload = { ...form, price:Number(form.price) }
      created = created
        ? await updateListing(created.id, payload)
        : await createListing(payload)
      setPendingPhotoListing(created)
      created = await uploadListingImages(created.id, photos)
      setListing(created); setPayment(null); setNotice(t('Listing created. It is pending moderation and is not public yet.'))
      setPendingPhotoListing(null)
    } catch (err) {
      if (created) {
        setPendingPhotoListing(created)
        setNotice(t('Listing is saved. Upload at least one photo before continuing.'))
      }
      setError(err.message)
    }
    finally { setBusy(false) }
  }
  async function startFee() {
    if (!listing) return
    setBusy(true); setError('')
    try { setPayment(await createListingFeePayment(listing.id)); setNotice('Fee transaction created. Choose a simulation outcome to continue.') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function finishPayment(success) {
    if (!payment) return
    setBusy(true); setError('')
    try {
      const result = await simulatePayment(payment.id, success)
      setPayment(result)
      setNotice(result.status === 'SUCCESS' ? 'Payment is successful. The listing still needs moderation approval.' : 'Payment failed. Create a new fee transaction to retry.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function retryFee() { setPayment(null); await startFee() }
  function startAnotherListing() {
    setListing(null)
    setPendingPhotoListing(null)
    setPayment(null)
    setForm(emptyForm)
    setPhotos([])
    setFieldErrors({})
    setError('')
    setNotice('')
  }
  const update = e => setForm(current=>({...current,[e.target.name]:e.target.value}))
  return <section className="section-wrap page-section narrow-section">
    <div className="page-heading"><p className="eyebrow">{t('SELLER WORKFLOW')}</p><h1>{t('Create a listing')}</h1><p>{t('Submit the listing details, then follow its listing-fee payment status.')}</p></div>
    {categoriesError&&<ErrorState message={categoriesError} onRetry={()=>getCategories().then(setCategories).catch(err=>setCategoriesError(err.message))}/>}
    {notice&&<Notice>{notice}</Notice>}
    {error&&<ErrorState message={error}/>}
    {!user?<div className="workflow-card"><h2>{t('Sign in as a seller to create listings')}</h2><p>{t('Your seller account is used to associate the listing and its fee with you.')}</p><Link className="button button-primary" to="/login">{t('Sign in')}</Link></div>:user.role!=='SELLER'?<div className="workflow-card"><h2>{t('Seller account required')}</h2><p>{t('Sign in with a seller account to submit a listing.')}</p><Link className="button button-secondary" to="/register">{t('Create seller account')}</Link></div>:!listing&&<form className="form-card" onSubmit={handleCreate} noValidate>
      <Field name="title" label={t('Listing title')} value={form.title} update={update} error={fieldErrors.title} required placeholder={t('Industrial rice whitener')}/>
      <Field name="description" label={t('Description')} value={form.description} update={update} error={fieldErrors.description} required multiline placeholder={t('Describe the item accurately.')}/>
      <label className="form-field"><span>{t('Category')} <b>*</b></span><select name="categorySlug" value={form.categorySlug} onChange={update}><option value="">{t('Select category')}</option>{categories.map(category=><option key={category.id} value={category.slug}>{t(category.name)}</option>)}</select>{fieldErrors.categorySlug&&<small>{fieldErrors.categorySlug}</small>}</label>
      <div className="form-grid"><Field name="sellerName" label={t('Seller / business name')} value={form.sellerName} update={update} error={fieldErrors.sellerName} required/><Field name="location" label={t('Location')} value={form.location} update={update} error={fieldErrors.location} required/></div>
      <div className="form-grid"><Field name="price" label={t('Price (INR)')} value={form.price} update={update} error={fieldErrors.price} required type="number" min="0" step="0.01"/><Field name="condition" label={t('Condition')} value={form.condition} update={update} error={fieldErrors.condition} required placeholder={t('For example, NEW')}/></div>
      <label className="form-field"><span>{t('Listing photos')} <b>*</b></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple required aria-invalid={Boolean(fieldErrors.photos)} onChange={event=>{const chosen=Array.from(event.target.files||[]);const invalid=chosen.find(file=>file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type));if(invalid){setError(t('Photos must be JPG, PNG, or WEBP and 5 MB or smaller.'));event.target.value='';return}if(photos.length+chosen.length>8){setError(t('A listing can have up to 8 photos.'));event.target.value='';return}setError('');setFieldErrors(current=>({...current,photos:''}));setPhotos(current=>[...current,...chosen])}}/>{fieldErrors.photos&&<small role="alert">{t(fieldErrors.photos)}</small>}<small>{t('Upload at least one photo. Up to 8 photos, 5 MB each.')}</small></label>
      {!!photos.length&&<div className="photo-previews">{photos.map((file,index)=><div key={`${file.name}-${index}`}><img src={URL.createObjectURL(file)} alt={file.name}/><button type="button" className="button button-quiet" onClick={()=>{if(photos.length===1)setFieldErrors(current=>({...current,photos:'Upload at least one photo.'}));setPhotos(current=>current.filter((_,i)=>i!==index))}}>{t('Remove')}</button></div>)}</div>}
      <button className="button button-primary" disabled={busy}>{busy?t('Saving…'):t(pendingPhotoListing?'Retry photo upload':'Naya Ad Daalein')}</button>
    </form>}
    {listing&&<div className="workflow-card"><div className="section-heading"><div><p className="eyebrow">{t('LISTING')} #{listing.id}</p><h2>{listing.title}</h2></div><StatusBadge status={listing.status}/></div><p>{listing.description}</p><p className="listing-price">{formatINR(listing.price)}</p><p className="helper-note">{t('A new listing stays pending review and is not public until approved.')}</p>
      {!payment&&<button className="button button-primary" disabled={busy} onClick={startFee}>{t('Initiate listing fee')}</button>}
      {payment&&<div className="payment-box"><div><p className="eyebrow">{t('PAYMENT')} #{payment.id}</p><h3>{formatINR(paiseToRupees(payment.amountPaise))}</h3><StatusBadge status={payment.status}/><p className="helper-note">{t('Simulation only. No payment gateway or real charge is used.')}</p></div>{payment.status==='PENDING'&&<div className="button-row"><button disabled={busy} className="button button-primary" onClick={()=>finishPayment(true)}>{t('Simulate success')}</button><button disabled={busy} className="button button-secondary" onClick={()=>finishPayment(false)}>{t('Simulate failure')}</button></div>}{payment.status==='FAILED'&&<button disabled={busy} className="button button-secondary" onClick={retryFee}>{t('Create a new fee transaction')}</button>}</div>}
      <div className="button-row"><Link className="button button-secondary" to={`/listings/${listing.id}`}>{t('View listing')}</Link><button className="button button-quiet" onClick={startAnotherListing}>{t('Create another')}</button></div>
    </div>}
  </section>
}

function Field({name,label,value,update,error,required=false,multiline=false,...props}) {
  const { t } = useApp()
  const Control=multiline?'textarea':'input'
  return <label className="form-field"><span>{label} {required&&<b>*</b>}</span><Control name={name} value={value} onChange={update} required={required} {...props}/>{error&&<small>{t(error)}</small>}</label>
}
