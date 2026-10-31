import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Factory, Search } from 'lucide-react'
import { getCategories } from '../api/categoryApi'
import { getListings } from '../api/listingApi'
import ListingCard from '../components/listings/ListingCard'
import { ErrorState, LoadingState } from '../components/common/States'
import { useApp } from '../context/AppContext'
import CategoryIcon from '../components/common/CategoryIcon'
import SponsoredAds from '../components/common/SponsoredAds'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, t } = useApp()
  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    Promise.all([getCategories(), getListings()]).then(([categoryData, listingData]) => {
      setCategories(categoryData); setListings(listingData.slice(0, 6))
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [user?.token])
  return <div>
    <section className="home-hero"><div className="hero-copy"><p className="eyebrow">{t('INDUSTRIAL SUPPLY DEALS')}</p><h1>{t('Find the equipment')}<br />{t('that keeps work moving.')}</h1><p>{t('Browse machinery, spare parts and industrial services from live Deals.')}</p>
      <form className="hero-search" onSubmit={e => { e.preventDefault(); navigate(`/marketplace?search=${encodeURIComponent(query)}`) }}><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Search listings by name or description')} aria-label={t('Search listings')} /><button className="button button-primary">{t('Search')}</button></form>
      <div className="hero-actions"><Link className="button button-primary" to="/marketplace">{t('Browse Deals')} <ArrowRight size={16} /></Link><Link className="button button-secondary" to="/create-listing">{t('Create a listing')}</Link></div>
    </div><div className="hero-visual" aria-hidden="true"><div className="hero-machine"><span>IM</span><i /><i /><i /></div><div className="visual-label">{t('Industrial supply')}<br /><b>{t('Built around real listings')}</b></div></div></section>
    <SponsoredAds className="home-sponsored section-wrap"/>
    {user&&<section className="section-wrap"><div className="section-heading"><div><p className="eyebrow">{t('BROWSE BY CATEGORY')}</p><h2>{t('Find your part of the market')}</h2></div><Link to="/marketplace" className="text-link">{t('All listings')} <ArrowRight size={15} /></Link></div>
      {loading ? <LoadingState label={t('Loading categories…')} /> : error ? <ErrorState message={error} /> : categories.length ? <div className="category-grid">{categories.map(category => <Link to={`/marketplace?category=${encodeURIComponent(category.slug)}`} className="category-tile" key={category.id}><span className={`category-icon category-icon-art category-icon-${category.slug}`}><CategoryIcon slug={category.slug} /></span><b>{t(category.name)}</b><small>{t(category.description)}</small></Link>)}</div> : <p className="inline-empty">{t('No categories are available yet.')}</p>}
    </section>}
    {user&&<section className="section-wrap"><div className="section-heading"><div><p className="eyebrow">{t('LIVE FROM THE API')}</p><h2>{t('Available listings')}</h2></div><Link to="/marketplace" className="text-link">{t('Browse Deals')} <ArrowRight size={15} /></Link></div>
      {loading ? <LoadingState label={t('Loading listings…')} /> : error ? <ErrorState message={error} /> : listings.length ? <div className="listing-grid">{listings.map(item => <ListingCard listing={item} key={item.id} />)}</div> : <p className="inline-empty">{t('No approved listings are available yet.')}</p>}
    </section>}
    {user&&<section className="seller-callout"><div><p className="eyebrow">{t('FOR SELLERS')}</p><h2>{t('Bring your equipment to Deals.')}</h2><p>{t('Create a listing and follow its fee and moderation status through the prototype workflow.')}</p></div><Link className="button button-light" to="/create-listing">{t('Start a listing')} <ArrowRight size={16} /></Link></section>}
  </div>
}
