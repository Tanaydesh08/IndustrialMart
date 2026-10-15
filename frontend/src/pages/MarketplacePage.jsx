import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getCategories } from '../api/categoryApi'
import { getListings } from '../api/listingApi'
import ListingCard from '../components/listings/ListingCard'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
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
        const [categoryData, listingData] = await Promise.all([
          getCategories(),
          getListings({ search:term || undefined, category:category || undefined }, { signal:controller.signal }),
        ])
        setCategories(categoryData); setListings(listingData)
      } catch (err) { if (!controller.signal.aborted) setError(err.message) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [term, category])
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
    <div className="page-heading"><p className="eyebrow">MARKETPLACE</p><h1>Industrial listings</h1><p>Search approved listings using the backend's title, description, and category filters.</p></div>
    <div className="market-tools"><label className="search-field"><Search size={18}/><input value={term} onChange={e=>updateSearch(e.target.value)} placeholder="Search by title or description" aria-label="Search listings"/></label>
      <label className="select-field"><span>Category</span><select value={category} onChange={e=>selectCategory(e.target.value)}><option value="">All categories</option>{categories.map(item=><option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
    </div>
    {loading?<LoadingState label="Loading listings…"/>:error?<ErrorState message={error}/>:listings.length?<div className="listing-grid">{listings.map(item=><ListingCard listing={item} key={item.id}/>)}</div>:<EmptyState title="No matching listings" description="Try another search or category. The marketplace only shows approved listings."/>}
    <p className="helper-note">The API does not currently provide pagination, price filters, or location filters.</p>
  </section>
}