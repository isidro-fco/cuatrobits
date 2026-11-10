/**
 * Archivo: formato.ts
 * Módulo: frontend / utils
 * Descripción: Formato de duraciones, fechas y números para la interfaz.
 * Requerimientos: RF50, RF53
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Funciones ----------
/**
 * Da formato mm:ss (o h:mm:ss) a una duración.
 * @param milisegundos Duración en milisegundos
 * @returns Duración con formato
 * @see RF50, RF53
 */
export function formatearDuracion(milisegundos: number): string {
  const segundosTotales = Math.max(0, Math.round(milisegundos / 1000))
  const minutos = Math.floor(segundosTotales / 60)
  const segundos = segundosTotales % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

/**
 * Da formato dd/mm/aaaa a una fecha.
 * @param fechaIso Fecha en formato ISO 8601
 * @returns Fecha con formato
 * @see RF50
 */
export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Da formato con separador de miles a un número.
 * @param valor Número que se muestra
 * @returns Número con formato
 * @see RF06, RF51
 */
export function formatearNumero(valor: number): string {
  return valor.toLocaleString('es-MX')
}
