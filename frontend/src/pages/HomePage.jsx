import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { getCategories } from '../api/categoryApi'
import { getListings } from '../api/listingApi'
import ListingCard from '../components/listings/ListingCard'
import { ErrorState, LoadingState } from '../components/common/States'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  async function load() {
    setLoading(true); setError('')
    try {
      const [categoryData, listingData] = await Promise.all([getCategories(), getListings()])
      setCategories(categoryData); setListings(listingData.slice(0, 6))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  return <div>
    <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow">INDUSTRIAL SUPPLY MARKETPLACE</p><h1>Find the equipment<br/>that keeps work moving.</h1><p>Browse rice mill machinery, plant equipment, spare parts and industrial services from live marketplace listings.</p>
        <form className="hero-search" onSubmit={e=>{e.preventDefault();navigate(`/marketplace?search=${encodeURIComponent(query)}`)}}><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search listings by name or description" aria-label="Search listings"/><button className="button button-primary">Search</button></form>
        <div className="hero-actions"><Link className="button button-primary" to="/marketplace">Explore marketplace <ArrowRight size={16}/></Link><Link className="button button-secondary" to="/create-listing">Create a listing</Link></div>
      </div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-machine"><span>IM</span><i/><i/><i/></div><div className="visual-label">Industrial supply<br/><b>Built around real listings</b></div></div>
    </section>
    <section className="section-wrap">
      <div className="section-heading"><div><p className="eyebrow">BROWSE BY CATEGORY</p><h2>Find your part of the market</h2></div><Link to="/marketplace" className="text-link">All listings <ArrowRight size={15}/></Link></div>
      {loading?<LoadingState label="Loading categories…"/>:error?<ErrorState message={error} onRetry={load}/>:<div className="category-grid">{categories.map((category,index)=><Link to={`/marketplace?category=${encodeURIComponent(category.slug)}`} className="category-tile" key={category.id}><span className="category-icon">{['⚙️','🏭','🔩','🚜','📦','⚡','🧰'][index]||'▦'}</span><b>{category.name}</b><small>{category.description}</small></Link>)}</div>}
    </section>
    <section className="section-wrap">
      <div className="section-heading"><div><p className="eyebrow">LIVE FROM THE API</p><h2>Available listings</h2></div><Link to="/marketplace" className="text-link">View marketplace <ArrowRight size={15}/></Link></div>
      {loading?<LoadingState label="Loading listings…"/>:error?<ErrorState message={error} onRetry={load}/>:listings.length?<div className="listing-grid">{listings.map(item=><ListingCard listing={item} key={item.id}/>)}</div>:<p className="inline-empty">No approved listings are available yet.</p>}
    </section>
    <section className="seller-callout"><div><p className="eyebrow">FOR SELLERS</p><h2>Bring your equipment to the marketplace.</h2><p>Create a listing and follow its fee and moderation status through the prototype workflow.</p></div><Link className="button button-light" to="/create-listing">Start a listing <ArrowRight size={16}/></Link></section>
  </div>
}
