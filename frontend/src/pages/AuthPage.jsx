import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Factory, ShieldCheck } from 'lucide-react'
import { login, register } from '../api/authApi'
import { useApp } from '../context/AppContext'
import { ErrorState } from '../components/common/States'
import { useSearchParams } from 'react-router-dom'
import { getActiveSponsoredAds } from '../api/adminApi'
import ProtectedImage from '../components/common/ProtectedImage'

export default function AuthPage({ register: isRegister = false }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'BUYER' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, t } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sponsoredAds, setSponsoredAds] = useState([])
  useEffect(() => {
    if (isRegister) return
    let active = true
    getActiveSponsoredAds().then(ads => { if (active) setSponsoredAds(ads) }).catch(() => {})
    return () => { active = false }
  }, [isRegister])
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const session = isRegister ? await register(form) : await login({ email: form.email, password: form.password })
      signIn(session)
      const returnTo = searchParams.get('returnTo')
      const home = session.role === 'ADMIN' ? '/admin' : session.role === 'SELLER' ? '/seller' : '/buyer'
      const requested = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : ''
      const allowed = requested.startsWith('/marketplace') || requested.startsWith('/listings/') || session.role === 'ADMIN' && requested.startsWith('/admin') || session.role === 'SELLER' && (requested.startsWith('/seller') || requested.startsWith('/create-listing')) || session.role === 'BUYER' && requested.startsWith('/buyer')
      navigate(allowed ? requested : home, { replace:true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <section className="auth-page">
    <div className="auth-intro"><div className="auth-brand"><span className="brand-mark"><Factory size={22}/></span><span>Industrial <b>Mart</b></span></div><p className="eyebrow">{t('INDUSTRIAL TRADE, MADE SIMPLE')}</p><h1>{t('Join Industrial Mart')}</h1><p>{t('Connect with buyers and sellers across India’s industrial supply network.')}</p><div className="auth-trust"><ShieldCheck size={18}/> {t('Secure access powered by your account')}</div></div>
    <div className="auth-login-stack"><form className="form-card auth-card" onSubmit={submit}>
      <div><p className="eyebrow">{isRegister ? t('Create account') : t('Sign in')}</p><h2>{isRegister ? t('Create account') : t('Sign in')}</h2><p className="auth-subtitle">{isRegister ? t('Start exploring Deals today.') : t('Welcome back to Industrial Mart.')}</p></div>
      {error && <ErrorState message={error}/>}
      {isRegister && <label className="form-field"><span>{t('Full name')}</span><input required maxLength="120" autoComplete="name" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label>}
      <label className="form-field"><span>{t('Email')}</span><input required type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label className="form-field"><span>{t('Password')}</span><input required type="password" minLength={isRegister?8:1} maxLength="72" autoComplete={isRegister?'new-password':'current-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>{isRegister&&<small>{t('Use at least 8 characters.')}</small>}</label>
      {isRegister&&<label className="form-field"><span>{t('Account type')}</span><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="BUYER">{t('Buyer account')}</option><option value="SELLER">{t('Seller account')}</option></select></label>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy?'Please wait…':isRegister?t('Create account'):t('Sign in')}</button>
      <p className="auth-switch">{isRegister?t('Already have an account?'):t('New here?')} <Link to={isRegister?'/login':'/register'}>{isRegister?t('Sign in'):t('Create account')}</Link></p>
    </form>{!isRegister&&!!sponsoredAds.length&&<section className="sponsored-grid login-sponsored" aria-label={t('Sponsored')}>{sponsoredAds.map(ad=><article className="sponsored-card" key={ad.id}><span>{t('Sponsored')}</span>{ad.imageUrl?.startsWith('/api/sponsored-ads/images/')?<ProtectedImage src={ad.imageUrl} alt={ad.title}/>:<img src={ad.imageUrl} alt={ad.title}/>}<div><h2>{ad.title}</h2>{ad.description&&<p>{ad.description}</p>}</div></article>)}</section>}</div>
  </section>
}
