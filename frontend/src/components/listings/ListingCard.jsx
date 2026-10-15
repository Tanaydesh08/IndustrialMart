import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatINR } from '../../utils/money'

const iconFor = slug => ({
  'rice-milling-machinery': '⚙️',
  'complete-rice-mill-plants': '🏭',
  'spare-parts-components': '🔩',
  'material-handling-equipment': '🚜',
  'sorting-grading-packaging': '📦',
  'electrical-automation': '⚡',
  'industrial-services': '🧰',
}[slug] || '▦')

export default function ListingCard({ listing }) {
  return <article className="listing-card">
    <div className="listing-art"><span>{iconFor(listing.categorySlug)}</span>{listing.status&&<StatusBadge status={listing.status}/>}</div>
    <div className="listing-content">
      <p className="eyebrow">{listing.categorySlug?.replaceAll('-', ' ')}</p>
      <h3><Link to={`/listings/${listing.id}`}>{listing.title}<ArrowUpRight size={16}/></Link></h3>
      <p className="listing-description">{listing.description}</p>
      <div className="listing-meta"><span><MapPin size={14}/>{listing.location}</span><span>{listing.condition}</span></div>
      <div className="listing-price">{formatINR(listing.price)}</div>
      <p className="seller-line">Listed by {listing.sellerName}</p>
    </div>
  </article>
}
