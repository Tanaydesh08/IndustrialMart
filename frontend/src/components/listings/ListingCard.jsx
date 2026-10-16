import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatINR } from '../../utils/money'
import { useApp } from '../../context/AppContext'
import CategoryIcon from '../common/CategoryIcon'

export default function ListingCard({ listing }) {
  const { t } = useApp()
  return <article className="listing-card">
    <div className={`listing-art listing-art-${listing.categorySlug || 'default'}`}><span className="listing-art-emoji"><CategoryIcon slug={listing.categorySlug}/></span>{listing.status&&<StatusBadge status={listing.status}/>}</div>
    <div className="listing-content">
      <p className="eyebrow">{t(listing.categorySlug?.replaceAll('-', ' ') || '')}</p>
      <h3><Link to={`/listings/${listing.id}`}>{t(listing.title)}<ArrowUpRight size={16}/></Link></h3>
      <p className="listing-description">{t(listing.description)}</p>
      <div className="listing-meta"><span><MapPin size={14}/>{t(listing.location)}</span><span>{t(listing.condition)}</span></div>
      <div className="listing-price">{formatINR(listing.price)}</div>
      <p className="seller-line">{t('Listed by')} {t(listing.sellerName)}</p>
    </div>
  </article>
}
