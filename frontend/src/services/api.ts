// Cliente de la API REST (sección 15). En desarrollo Vite redirige /api al backend; en producción
// `VITE_API_URL` indica dónde está (por ejemplo, el servicio de Render).

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** El servidor respondió con un error */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** No hubo respuesta: sin conexión o servidor apagado */
export class NetworkError extends Error {}

/** `token`: el del dispositivo, para las rutas que modifican o consultan los datos de un jugador */
export async function apiRequest<T>(method: 'GET' | 'POST', path: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  let response: Response
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    throw new NetworkError(err instanceof Error ? err.message : 'Sin conexión')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    // Un proxy sin backend responde 5xx sin el formato de la API: se trata como falta de conexión
    if (response.status >= 500 && !data?.error) throw new NetworkError(`HTTP ${response.status}`)
    throw new ApiError(response.status, data?.error ?? 'unknown', data?.message ?? `Error ${response.status}`)
  }
  return data as T
}
