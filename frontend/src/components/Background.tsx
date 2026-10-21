// Fondo abstracto: manchas de color y mosaicos de píxeles en los márgenes (prototipo A7).
export function Background() {
  return (
    <div className="background" aria-hidden>
      <span className="blob blob--blue" />
      <span className="blob blob--lilac" />
      <span className="blob blob--mint" />
      <span className="blob blob--yellow" />
      <span className="pixels pixels--left">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <span className="pixels pixels--right">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </div>
  )
}
