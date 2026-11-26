import { LoaderCircle } from 'lucide-react'

export function LoadingStatus({ label, className = 'initializing' }: { label: string; className?: string }) {
  return <div className={className} role="status">
    <span className="loading-status"><LoaderCircle size={21} className="loading-spinner" aria-hidden="true" />{label}</span>
  </div>
}
