import type { z } from 'zod'
import { AppError } from './errors.js'

/** Valida con Zod y convierte los fallos en un error 400 con los detalles */
export function parse<S extends z.ZodType>(schema: S, data: unknown, message = 'La solicitud no es válida.'): z.infer<S> {
  const result = schema.safeParse(data)
  if (!result.success) throw new AppError(400, 'validation-error', message, result.error.issues)
  return result.data
}
