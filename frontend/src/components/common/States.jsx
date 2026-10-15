import { AlertCircle, LoaderCircle, PackageOpen } from 'lucide-react'

export function LoadingState({ label = 'Loading…' }) {
  return <div className="state-card" role="status"><LoaderCircle className="animate-spin" size={20}/><span>{label}</span></div>
}
export function ErrorState({ message, onRetry }) {
  return <div className="state-card state-error" role="alert"><AlertCircle size={20}/><span>{message}</span>{onRetry&&<button className="button button-secondary ml-auto" onClick={onRetry}>Try again</button>}</div>
}
export function EmptyState({ title, description }) {
  return <div className="empty-state"><PackageOpen size={30}/><h3>{title}</h3><p>{description}</p></div>
}
export function Notice({ children, kind = 'success', onClose }) {
  return <div className={`notice notice-${kind}`} role="status">{children}{onClose&&<button aria-label="Dismiss" onClick={onClose}>×</button>}</div>
}
