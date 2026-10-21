import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getCategories } from '../api/categoryApi'
import { getListings, getRecentListings } from '../api/listingApi'
import ListingCard from '../components/listings/ListingCard'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { useApp } from '../context/AppContext'
import { formatINR } from '../utils/money'
import CategoryIcon from '../components/common/CategoryIcon'
import { getActiveSponsoredAds } from '../api/adminApi'

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const { user, t } = useApp()
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [recent, setRecent] = useState([])
  const [sponsored, setSponsored] = useState([])
  const [term, setTerm] = useState(params.get('search') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { setTerm(params.get('search') || ''); setCategory(params.get('category') || '') }, [params])
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const [categoryData, listingData, recentData, sponsoredData] = await Promise.all([
          getCategories(),
          user ? getListings({ search:term || undefined, category:category || undefined }, { signal:controller.signal }) : Promise.resolve([]),
          user ? getRecentListings().catch(()=>[]) : Promise.resolve([]),
          user ? getActiveSponsoredAds().catch(()=>[]) : Promise.resolve([]),
        ])
        setCategories(categoryData); setListings(listingData); setRecent(recentData); setSponsored(sponsoredData)
      } catch (err) { if (!controller.signal.aborted) setError(err.message) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [term, category, user?.token])
  function updateSearch(value) {
    setTerm(value)
    const next = new URLSearchParams(params)
    value ? next.set('search',value) : next.delete('search')
    setParams(next)
  }
  function selectCategory(slug) {
    setCategory(slug)
    const next = new URLSearchParams(params)
    slug ? next.set('category',slug) : next.delete('category')
    setParams(next)
  }
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">{t('Deals')}</p><h1>{t('Industrial listings')}</h1></div>
    {!!recent.length&&<section className="recent-strip"><h2>{t('Naye Ads')}</h2><div className="recent-track">{[...recent,...recent].map((item,index)=><Link key={`${item.id}-${index}`} to={`/listings/${item.id}`} className="recent-item"><b>{t(item.title)}</b><span>{t(item.categorySlug?.replaceAll('-',' ')||'')} · {formatINR(item.price)}</span></Link>)}</div></section>}
    {!!recent.length&&<section className="hot-deals"><div><p className="eyebrow">{t('Garma-Garam Deals')}</p><h2>{t('Naye approved ads')}</h2></div><div className="hot-grid">{recent.slice(0,3).map(item=><Link to={`/listings/${item.id}`} className="hot-card" key={item.id}>{item.imageUrls?.[0]?<img src={item.imageUrls[0]} alt=""/>:<span className="hot-placeholder"><CategoryIcon slug={item.categorySlug}/></span>}<b>{t(item.title)}</b><strong>{formatINR(item.price)}</strong></Link>)}</div></section>}
    {!!sponsored.length&&<section className="sponsored-grid" aria-label="Sponsored">{sponsored.map(ad=><a className="sponsored-card" href={ad.destinationUrl} target="_blank" rel="noreferrer" key={ad.id}><span>Sponsored</span><img src={ad.imageUrl} alt=""/><div><h2>{ad.title}</h2><p>{ad.description}</p></div></a>)}</section>}
    <div className="market-tools"><label className="search-field"><Search size={18}/><input value={term} onChange={e=>updateSearch(e.target.value)} placeholder={t('Search by title or description')} aria-label={t('Search listings')}/></label>
      <label className="select-field"><span>{t('Category')}</span><select value={category} onChange={e=>selectCategory(e.target.value)}><option value="">{t('All categories')}</option>{categories.map(item=><option key={item.id} value={item.slug}>{t(item.name)}</option>)}</select></label>
    </div>
    {!user?<div className="auth-required"><h2>{t('Sign in to browse live listings')}</h2><p>{t('The marketplace listings are available to authenticated accounts.')}</p><Link className="button button-primary" to="/login">{t('Sign in to continue')}</Link></div>:loading?<LoadingState label={t('Loading listings…')}/>:error?<ErrorState message={error}/>:listings.length?<div className="listing-grid">{listings.map(item=><ListingCard listing={item} key={item.id}/>)}</div>:<EmptyState title={t('No matching listings')} description={t('Try another search or category. The marketplace only shows approved listings.')}/>}
    <p className="helper-note">The API does not currently provide pagination, price filters, or location filters.</p>
  </section>
}
