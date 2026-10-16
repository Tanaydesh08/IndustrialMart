import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, Factory, ShieldCheck } from 'lucide-react'
import { getCategories } from '../api/categoryApi'
import { getListings } from '../api/listingApi'
import ListingCard from '../components/listings/ListingCard'
import { ErrorState, LoadingState } from '../components/common/States'
import { useApp } from '../context/AppContext'
import { login as loginUser, register as registerUser } from '../api/authApi'
import CategoryIcon from '../components/common/CategoryIcon'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryError, setCategoryError] = useState('')
  const [listingError, setListingError] = useState('')
  const [query, setQuery] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ fullName:'', email:'', password:'', role:'BUYER' })
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const navigate = useNavigate()
  const { user, t, signIn } = useApp()
  async function load() {
    if (!user) return
    setLoading(true); setCategoryError(''); setListingError('')
    const [categoryResult, listingResult] = await Promise.allSettled([getCategories(), getListings()])
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value)
    else { setCategories([]); setCategoryError(categoryResult.reason.message) }
    if (listingResult.status === 'fulfilled') setListings(listingResult.value.slice(0, 6))
    else { setListings([]); setListingError(listingResult.reason.message) }
    setLoading(false)
  }
  useEffect(() => { if (user) load(); else { setCategories([]); setListings([]); setLoading(false) } }, [user?.token])
  async function submitAuth(event) {
    event.preventDefault(); setAuthBusy(true); setAuthError('')
    try {
      const session = authMode === 'register' ? await registerUser(authForm) : await loginUser({ email:authForm.email, password:authForm.password })
      signIn(session)
    } catch (err) { setAuthError(err.message) } finally { setAuthBusy(false) }
  }
  if (!user) return <section className="home-auth">
    <div className="home-auth-copy"><span className="brand-mark"><Factory size={23}/></span><p className="eyebrow">{t('INDUSTRIAL SUPPLY MARKETPLACE')}</p><h1>{t('Find the equipment')}<br/>{t('that keeps work moving.')}</h1><p>{t('Browse rice mill machinery, plant equipment, spare parts and industrial services from live marketplace listings.')}</p><div className="auth-trust"><ShieldCheck size={18}/>{t('Secure access powered by your account')}</div></div>
    <form className="form-card auth-card home-auth-card" onSubmit={submitAuth}>
      <div><p className="eyebrow">{authMode==='login'?t('WELCOME BACK'):t('GET STARTED')}</p><h2>{authMode==='login'?t('Sign in'):t('Create account')}</h2><p className="auth-subtitle">{authMode==='login'?t('Sign in to access the marketplace and listings.'):t('Create an account to browse and list industrial equipment.')}</p></div>
      {authError&&<ErrorState message={authError}/>}
      {authMode==='register'&&<label className="form-field"><span>{t('Full name')}</span><input required maxLength="120" autoComplete="name" value={authForm.fullName} onChange={e=>setAuthForm({...authForm,fullName:e.target.value})}/></label>}
      <label className="form-field"><span>{t('Email')}</span><input required type="email" autoComplete="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/></label>
      <label className="form-field"><span>{t('Password')}</span><input required type="password" minLength={authMode==='register'?8:1} maxLength="72" autoComplete={authMode==='register'?'new-password':'current-password'} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})}/>{authMode==='register'&&<small>{t('Use at least 8 characters.')}</small>}</label>
      {authMode==='register'&&<label className="form-field"><span>{t('Account type')}</span><select value={authForm.role} onChange={e=>setAuthForm({...authForm,role:e.target.value})}><option value="BUYER">{t('Buyer account')}</option><option value="SELLER">{t('Seller account')}</option></select></label>}
      <button className="button button-primary auth-submit" disabled={authBusy}>{authBusy?t('Please wait…'):authMode==='login'?t('Sign in'):t('Create account')}</button>
      <p className="auth-switch">{authMode==='login'?t('New here?'):t('Already have an account?')} <button type="button" className="inline-action" onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setAuthError('')}}>{authMode==='login'?t('Create account'):t('Sign in')}</button></p>
    </form>
  </section>
  return <div>
    <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow">{t('INDUSTRIAL SUPPLY MARKETPLACE')}</p><h1>{t('Find the equipment')}<br/>{t('that keeps work moving.')}</h1><p>{t('Browse rice mill machinery, plant equipment, spare parts and industrial services from live marketplace listings.')}</p>
        <form className="hero-search" onSubmit={e=>{e.preventDefault();navigate(`/marketplace?search=${encodeURIComponent(query)}`)}}><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Search listings by name or description')} aria-label="Search listings"/><button className="button button-primary">{t('Search')}</button></form>
        <div className="hero-actions"><Link className="button button-primary" to="/marketplace">{t('Explore marketplace')} <ArrowRight size={16}/></Link><Link className="button button-secondary" to="/create-listing">{t('Create a listing')}</Link></div>
      </div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-machine"><span>IM</span><i/><i/><i/></div><div className="visual-label">Industrial supply<br/><b>Built around real listings</b></div></div>
    </section>
    <section className="section-wrap">
      <div className="section-heading"><div><p className="eyebrow">{t('BROWSE BY CATEGORY')}</p><h2>{t('Find your part of the market')}</h2></div><Link to="/marketplace" className="text-link">{t('All listings')} <ArrowRight size={15}/></Link></div>
      {loading?<LoadingState label="Loading categories…"/>:categoryError?<ErrorState message={categoryError} onRetry={load}/>:categories.length?<div className="category-grid">{categories.map(category=><Link to={`/marketplace?category=${encodeURIComponent(category.slug)}`} className="category-tile" key={category.id}><span className={`category-icon category-icon-art category-icon-${category.slug}`}><CategoryIcon slug={category.slug}/></span><b>{t(category.name)}</b><small>{t(category.description)}</small></Link>)}</div>:<p className="inline-empty">No categories are available yet.</p>}
    </section>
    <section className="section-wrap">
      <div className="section-heading"><div><p className="eyebrow">LIVE FROM THE API</p><h2>Available listings</h2></div><Link to="/marketplace" className="text-link">View marketplace <ArrowRight size={15}/></Link></div>
      {loading?<LoadingState label="Loading listings…"/>:listingError?<ErrorState message={listingError} onRetry={load}/>:listings.length?<div className="listing-grid">{listings.map(item=><ListingCard listing={item} key={item.id}/>)}</div>:<p className="inline-empty">No approved listings are available yet.</p>}
    </section>
    <section className="seller-callout"><div><p className="eyebrow">FOR SELLERS</p><h2>Bring your equipment to the marketplace.</h2><p>Create a listing and follow its fee and moderation status through the prototype workflow.</p></div><Link className="button button-light" to="/create-listing">Start a listing <ArrowRight size={16}/></Link></section>
  </div>
}
