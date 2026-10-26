import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function NotFoundPage() {
  const { t } = useApp()
  return <section className="section-wrap page-section not-found"><p className="eyebrow">404 · {t('PAGE NOT FOUND')}</p><h1>{t('This page isn’t here.')}</h1><p>{t('Browse Deals to find available industrial listings.')}</p><Link className="button button-primary" to="/marketplace">{t('Browse Deals')}</Link></section>
}
