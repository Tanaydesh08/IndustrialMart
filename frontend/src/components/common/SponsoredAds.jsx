import { useEffect, useState } from 'react'
import { getActiveSponsoredAds } from '../../api/adminApi'
import { useApp } from '../../context/AppContext'
import ProtectedImage from './ProtectedImage'

export default function SponsoredAds({ className = '' }) {
  const { t } = useApp()
  const [ads, setAds] = useState([])
  useEffect(() => {
    let active = true
    getActiveSponsoredAds().then(items => { if (active) setAds(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  if (!ads.length) return null
  return <section className={`sponsored-grid ${className}`.trim()} aria-label={t('Sponsored')}>
    {ads.map(ad => <article className="sponsored-card" key={ad.id}>
      <span>{t('Sponsored')}</span>
      {ad.imageUrl?.startsWith('/api/sponsored-ads/images/')
        ? <ProtectedImage src={ad.imageUrl} alt={ad.title}/>
        : <img src={ad.imageUrl} alt={ad.title}/>}
      <div><h2>{ad.title}</h2>{ad.description && <p>{ad.description}</p>}</div>
    </article>)}
  </section>
}
