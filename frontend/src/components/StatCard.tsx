import type { CSSProperties, ReactNode } from 'react'

interface StatCardProps {
  value: ReactNode
  label: string
  color: string
  icon?: ReactNode
}

export function StatCard({ value, label, color, icon }: StatCardProps) {
  return (
    <div className="stat-card card" style={{ '--accent': color } as CSSProperties}>
      <span className="stat-card__dot" aria-hidden>
        {icon}
      </span>
      <span>
        <strong className="stat-card__value">{value}</strong>
        <span className="stat-card__label">{label}</span>
      </span>
    </div>
  )
}
