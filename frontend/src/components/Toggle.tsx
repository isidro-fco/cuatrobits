interface ToggleProps {
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <span>
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} className="visually-hidden" />
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}
