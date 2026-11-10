/**
 * Archivo: api.ts
 * Módulo: frontend / services
 * Descripción: Cliente de la API REST (sección 15). En desarrollo Vite redirige /api al backend; en
 *              producción VITE_API_URL indica dónde está (por ejemplo, el servicio de Render).
 * Requerimientos: RIE01, RF61
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Constantes ----------
const URL_API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// ---------- Servicio ----------
/**
 * El servidor respondió con un error
 * @see RF61, RIE01
 */
export class ErrorApi extends Error {
  /** Código HTTP de la respuesta */
  readonly estatus: number
  /** Código estable del error que envió el servidor, por ejemplo username-taken */
  readonly codigo: string

  /**
   * @param estatus Código HTTP de la respuesta
   * @param codigo Código del error que envió el servidor
   * @param mensaje Mensaje para el jugador
   * @see RF61
   */
  constructor(estatus: number, codigo: string, mensaje: string) {
    super(mensaje)
    this.estatus = estatus
    this.codigo = codigo
  }
}

/**
 * No hubo respuesta: sin conexión o servidor apagado
 * @see RF55, RNF11
 */
export class ErrorRed extends Error {}

/**
 * Envía una solicitud a la API REST y devuelve el cuerpo de la respuesta.
 * @param metodo Método HTTP
 * @param ruta Ruta de la API, por ejemplo /api/players
 * @param cuerpo Datos que se envían como JSON
 * @param token Token del dispositivo, para las rutas que modifican o consultan los datos de un
 *   jugador
 * @returns Cuerpo JSON de la respuesta
 * @see RIE01, RF61
 */
export async function solicitudApi<TipoDato>(
  metodo: 'GET' | 'POST',
  ruta: string,
  cuerpo?: unknown,
  token?: string,
): Promise<TipoDato> {
  const encabezados: Record<string, string> = {}
  if (cuerpo !== undefined) {
    encabezados['Content-Type'] = 'application/json'
  }
  if (token) {
    encabezados.Authorization = `Bearer ${token}`
  }
  let respuestaServidor: Response
  try {
    respuestaServidor = await fetch(URL_API + ruta, {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch (errorCapturado) {
    throw new ErrorRed(errorCapturado instanceof Error ? errorCapturado.message : 'Sin conexión')
  }
  const datos = await respuestaServidor.json().catch(() => null)
  if (!respuestaServidor.ok) {
    // Un proxy sin backend responde 5xx sin el formato de la API: se trata como falta de conexión
    if (respuestaServidor.status >= 500 && !datos?.error) {
      throw new ErrorRed(`HTTP ${respuestaServidor.status}`)
    }
    throw new ErrorApi(
      respuestaServidor.status,
      datos?.error ?? 'unknown',
      datos?.mensaje ?? `Error ${respuestaServidor.status}`,
    )
  }
  return datos as TipoDato
}
