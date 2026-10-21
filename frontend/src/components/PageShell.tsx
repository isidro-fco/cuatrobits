import type { ReactNode } from 'react'
import { Background } from './Background'
import { Logo } from './Logo'

interface PageShellProps {
  /** Contenido del lado derecho del encabezado (botones de navegación) */
  actions?: ReactNode
  children: ReactNode
  width?: 'narrow' | 'medium' | 'wide'
}

export function PageShell({ actions, children, width = 'wide' }: PageShellProps) {
  return (
    <div className="shell">
      <Background />
      <header className="shell__header">
        <Logo />
        {actions && <div className="shell__actions">{actions}</div>}
      </header>
      <main className={`shell__main shell__main--${width}`}>{children}</main>
    </div>
  )
}
