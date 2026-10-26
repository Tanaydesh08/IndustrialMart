import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getMyListings } from '../api/listingApi'
import { useApp } from '../context/AppContext'
import StatusBadge from '../components/common/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { formatINR } from '../utils/money'

export default function SellerDashboardPage() {
  const { t, user } = useApp()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(() => { setLoading(true); setError(''); getMyListings().then(setListings).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  useEffect(() => { load() }, [load, user?.token])
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('SELLER SPACE')}</p><h1>{t('My Ads')}</h1><p>{t('Start a listing and follow its payment and moderation status.')}</p></div>
    {loading ? <LoadingState label={t('Loading listings…')} /> : error ? <ErrorState message={error} onRetry={load} /> : listings.length ? <div className="moderation-list">{listings.map(item => <article className="workflow-card" key={item.id}><div className="section-heading"><div><p className="eyebrow">#{item.id}</p><h2>{item.title}</h2></div><StatusBadge status={item.status} /></div><p>{formatINR(item.price)} · {t(item.categorySlug)}</p>{item.moderationReason && <p>{item.moderationReason}</p>}<Link className="button button-secondary" to={`/listings/${item.id}`}>{t('View Details')}</Link></article>)}</div> : <EmptyState title={t('No listings yet')} description={t('Create an ad and follow payment and moderation status here.')} />}
    <Link className="button button-primary" to="/create-listing"><Plus size={17} /> {t('Post an Ad')}</Link>
  </section>
}
