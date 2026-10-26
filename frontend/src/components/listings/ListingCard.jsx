import { useNavigate } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'
import { formatINR } from '../../utils/money'
import { useApp } from '../../context/AppContext'
import CategoryIcon from '../common/CategoryIcon'
import ProtectedImage from '../common/ProtectedImage'

export default function ListingCard({ listing }) {
  const { t } = useApp()
  const navigate = useNavigate()
  const open = () => navigate(`/listings/${listing.id}`)
  return <article className="listing-card listing-card-clickable" role="link" tabIndex={0} aria-label={`${t('Jaankari Dekhein')}: ${listing.title}`} onClick={open} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}}}>
    {listing.imageUrls?.[0] ? <div className="listing-art"><ProtectedImage className="listing-photo" src={listing.imageUrls[0]} alt={listing.title}/>{listing.status&&<StatusBadge status={listing.status}/>}</div> : <div className={`listing-art listing-art-${listing.categorySlug || 'default'}`}><span className="listing-art-emoji"><CategoryIcon slug={listing.categorySlug}/></span>{listing.status&&<StatusBadge status={listing.status}/>}</div>}
    <div className="listing-content">
      <p className="eyebrow">{t(listing.categorySlug?.replaceAll('-', ' ') || '')}</p>
      <h3>{listing.title}</h3>
      <div className="listing-meta"><span>{t(listing.condition)}</span></div>
      <div className="listing-price">{formatINR(listing.price)}</div>
    </div>
  </article>
}
