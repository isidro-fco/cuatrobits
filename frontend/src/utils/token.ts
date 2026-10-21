/**
 * Token secreto del dispositivo (sección 4.3): 32 bytes al azar en base64url.
 * El servidor guarda solo su huella y lo pide para modificar los datos del jugador.
 */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
