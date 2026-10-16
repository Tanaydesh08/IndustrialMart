import { Link } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SellerDashboardPage() {
  const { user, t } = useApp()
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('SELLER SPACE')}</p><h1>{t('Seller dashboard')}</h1><p>{t('Start a listing and follow its payment and moderation status.')}</p></div>
    {!user?<div className="workflow-card dashboard-limitation"><h2>{t('Sign in as a seller to continue')}</h2><Link className="button button-primary" to="/login">{t('Sign in')}</Link></div>:user.role!=='SELLER'?<div className="workflow-card dashboard-limitation"><h2>{t('Seller account required')}</h2><Link className="button button-secondary" to="/register">{t('Create seller account')}</Link></div>:<div className="workflow-card dashboard-limitation"><ClipboardList size={28}/><h2>{t('Seller-owned listing history is not available yet')}</h2><p>{t('The backend does not provide an endpoint for listing a seller’s own records yet.')}</p><Link className="button button-primary" to="/create-listing"><Plus size={17}/> {t('Create a listing')}</Link></div>}
  </section>
}
