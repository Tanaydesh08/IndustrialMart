import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBuyerUnlocks } from '../api/unlockApi'
import { getListing } from '../api/listingApi'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { useApp } from '../context/AppContext'

export default function BuyerDashboardPage() {
  const { user, t } = useApp()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (user?.role !== 'BUYER') return
    Promise.all([getBuyerUnlocks()]).then(([unlocks]) => Promise.all(unlocks.map(item => getListing(item.listingId))))
      .then(setListings).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [user?.token])
  if (user?.role !== 'BUYER') return <section className="section-wrap page-section"><div className="workflow-card"><h1>{t('Buyer account required')}</h1><Link className="button button-primary" to="/login">Login</Link></div></section>
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">Industrial Mart</p><h1>{t('Buyer Panel')}</h1><p>{t('Your unlocked listings are here.')}</p></div>
    {loading?<LoadingState label={t('Loading listings…')}/>:error?<ErrorState message={error}/>:listings.length?<div className="listing-grid">{listings.map(item=><article className="listing-card" key={item.id}><div className="listing-content"><h2>{item.title}</h2><Link className="button button-primary" to={`/listings/${item.id}`}>{t('View Details')}</Link></div></article>)}</div>:<EmptyState title={t('No unlocked ads yet')} description={t('Choose an ad in Deals; payment and details are available there.')}/>}
    <Link className="button button-secondary" to="/marketplace">{t('Deals Dekhein')}</Link>
  </section>
}
