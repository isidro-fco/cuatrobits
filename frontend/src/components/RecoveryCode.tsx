/** Muestra el código secreto con letras grandes y fáciles de copiar */
export function RecoveryCode({ code }: { code: string }) {
  return (
    <p className="recovery-code" aria-label={`Código secreto: ${[...code].join(' ')}`}>
      {code}
    </p>
  )
}
