/**
 * Archivo: errores.ts
 * Módulo: backend / models
 * Descripción: Error de la aplicación con un código estable que el cliente puede interpretar.
 * Requerimientos: RF61
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Funciones ----------
/**
 * Error de la aplicación con un código estable que el cliente puede interpretar.
 * @see RF61
 */
export class ErrorAplicacion extends Error {
  /**
   * @param statusCode Código HTTP de la respuesta; conserva el nombre que usa Fastify en sus
   * errores
   * @param codigo Código estable del error, por ejemplo username-taken
   * @param mensaje Mensaje que verá el cliente
   * @param detalles Información adicional, como los problemas de validación
   * @see RF61
   */
  constructor(
    readonly statusCode: number,
    readonly codigo: string,
    mensaje: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje)
  }
}

/**
 * Error 404 con el código not-found.
 * @param mensaje Mensaje que verá el cliente
 * @returns Error listo para lanzarse
 * @see RF61
 */
export const noEncontrado = (mensaje: string) => new ErrorAplicacion(404, 'not-found', mensaje)
