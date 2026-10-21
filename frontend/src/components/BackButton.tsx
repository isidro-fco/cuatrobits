import { Link } from 'react-router'
import { ArrowLeft } from './icons'

export function BackButton({ to = '/', label = 'Volver al lobby' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="btn btn--outline btn--small">
      <ArrowLeft />
      {label}
    </Link>
  )
}
