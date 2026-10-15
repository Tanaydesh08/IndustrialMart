import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getListing } from '../api/listingApi'
import StatusBadge from '../components/common/StatusBadge'
import { ErrorState, LoadingState } from '../components/common/States'
import { formatINR } from '../utils/money'

export default function ListingDetailsPage() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { setListing(await getListing(id)) } catch (err) { setError(err.message); setListing(null) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])
  if (loading) return <section className="section-wrap page-section"><LoadingState label="Loading listing…"/></section>
  if (error) return <section className="section-wrap page-section"><Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> Back to marketplace</Link><ErrorState message={error} onRetry={load}/></section>
  return <section className="section-wrap page-section">
    <Link className="back-link" to="/marketplace"><ArrowLeft size={16}/> Back to marketplace</Link>
    <article className="detail-layout"><div className="detail-illustration"><span>⚙</span></div><div className="detail-content"><div className="detail-top"><p className="eyebrow">{listing.categorySlug?.replaceAll('-',' ')}</p><StatusBadge status={listing.status}/></div><h1>{listing.title}</h1><p className="detail-price">{formatINR(listing.price)}</p><p className="detail-description">{listing.description}</p><dl className="detail-facts"><div><dt>Condition</dt><dd>{listing.condition}</dd></div><div><dt>Seller</dt><dd>{listing.sellerName}</dd></div><div><dt>Location</dt><dd><MapPin size={15}/>{listing.location}</dd></div><div><dt>Moderation status</dt><dd><StatusBadge status={listing.status}/></dd></div></dl><p className="helper-note">The backend does not currently expose a buyer contact or credit-unlock action.</p></div></article>
  </section>
}
