import { useEffect, useState } from 'react'
import { getActiveSponsoredAds } from '../../api/adminApi'
import { useApp } from '../../context/AppContext'
import ProtectedImage from './ProtectedImage'

export default function SponsoredAds({ className = '', showEmptyState = false }) {
  const { t, tError } = useApp()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let requestId = 0
    const load = (initial = false) => {
      const currentRequest = ++requestId
      if (initial) setLoading(true)
      setError('')
      getActiveSponsoredAds()
        .then(items => { if (active && currentRequest === requestId) setAds(items) })
        .catch(err => { if (active && currentRequest === requestId) setError(err.message) })
        .finally(() => { if (active && currentRequest === requestId) setLoading(false) })
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    load(true)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  if (!ads.length && !showEmptyState) return null
  return <section className={`sponsored-grid ${className}`.trim()} aria-label={t('Sponsored')}>
    {showEmptyState && <h2 className="sponsored-heading">{t('Sponsored Ads')}</h2>}
    {loading && showEmptyState && <p className="sponsored-state">{t('Loading sponsored ads...')}</p>}
    {!loading && error && showEmptyState && <p className="sponsored-state" role="status">{tError(error)}</p>}
    {!loading && !error && !ads.length && showEmptyState && <p className="sponsored-state">{t('No active sponsored ads right now.')}</p>}
    {ads.map(ad => <article className="sponsored-card" key={ad.id}>
      <span>{t('Sponsored')}</span>
      {ad.imageUrl?.startsWith('/api/sponsored-ads/images/')
        ? <ProtectedImage src={ad.imageUrl} alt={ad.title}/>
        : <img src={ad.imageUrl} alt={ad.title}/>}
      <div><h2>{ad.title}</h2>{ad.description && <p>{ad.description}</p>}</div>
    </article>)}
  </section>
}
