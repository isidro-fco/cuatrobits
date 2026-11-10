/**
 * Archivo: validacion.ts
 * Módulo: backend / models
 * Descripción: Valida datos con un esquema Zod y convierte los fallos en un error 400 con los
 *              detalles.
 * Requerimientos: RF60, RF61
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { z } from 'zod'

// ---------- Módulos internos ----------
import { ErrorAplicacion } from './errores.js'

// ---------- Funciones ----------
/**
 * Valida con Zod y convierte los fallos en un error 400 con los detalles
 * @param esquema Esquema Zod que deben cumplir
 * @param datos Datos recibidos
 * @param mensaje Mensaje que verá el cliente
 * @returns Datos validados y con su tipo
 * @see RF60, RF61
 */
export function analizar<TipoEsquema extends z.ZodType>(
  esquema: TipoEsquema,
  datos: unknown,
  mensaje = 'La solicitud no es válida.',
): z.infer<TipoEsquema> {
  const resultado = esquema.safeParse(datos)
  if (!resultado.success) {
    throw new ErrorAplicacion(400, 'validation-error', mensaje, resultado.error.issues)
  }
  return resultado.data
}
