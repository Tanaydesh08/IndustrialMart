import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ProtectedImage from '../common/ProtectedImage'

export default function ListingCard({ listing }) {
  const { t } = useApp()
  const navigate = useNavigate()
  const open = () => navigate(`/listings/${listing.id}`)
  return <article className="listing-card listing-card-clickable buyer-listing-card" role="link" tabIndex={0} aria-label={`${t('Jaankari Dekhein')}: ${listing.title}`} onClick={open} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}}}>
    {listing.imageUrls?.[0] ? <div className="listing-art"><ProtectedImage className="listing-photo" src={listing.imageUrls[0]} alt={listing.title}/></div> : <div className="listing-art listing-art-empty" aria-label={t('No image available')} />}
    <div className="listing-content"><h3>{listing.title}</h3></div>
  </article>
}
