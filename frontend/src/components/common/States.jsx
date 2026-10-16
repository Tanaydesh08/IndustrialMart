import { AlertCircle, LoaderCircle, PackageOpen } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function LoadingState({ label = 'Loading…' }) {
  const { t } = useApp()
  return <div className="state-card" role="status"><LoaderCircle className="animate-spin" size={20}/><span>{t(label)}</span></div>
}
export function ErrorState({ message, onRetry }) {
  const { t } = useApp()
  return <div className="state-card state-error" role="alert"><AlertCircle size={20}/><span>{t(message)}</span>{onRetry&&<button className="button button-secondary ml-auto" onClick={onRetry}>{t('Try again')}</button>}</div>
}
export function EmptyState({ title, description }) {
  const { t } = useApp()
  return <div className="empty-state"><PackageOpen size={30}/><h3>{t(title)}</h3><p>{t(description)}</p></div>
}
export function Notice({ children, kind = 'success', onClose }) {
  const { t } = useApp()
  return <div className={`notice notice-${kind}`} role="status">{t(children)}{onClose&&<button aria-label={t('Dismiss')} onClick={onClose}>×</button>}</div>
}
