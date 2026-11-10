/**
 * Archivo: servidor.ts
 * Módulo: backend
 * Descripción: Punto de entrada del backend: conecta con la base de datos y arranca el servidor
 *              HTTP. Las migraciones se aplican antes con pnpm db:migrate.
 * Requerimientos: RF57, RF58, RF59, RDC06
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { construirAplicacion } from './aplicacion.js'
import { crearBaseDatos, opcionesPgDesdeEntorno } from './config/baseDatos.js'
import { entorno } from './config/entorno.js'

// ---------- Arranque ----------
// Conexión y aplicación únicas del proceso
const baseDatos = crearBaseDatos(entorno.DATABASE_URL, opcionesPgDesdeEntorno(entorno))
const aplicacion = construirAplicacion({ baseDatos })
aplicacion.addHook('onClose', () => baseDatos.cerrar())

for (const senal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(senal, () => void aplicacion.close())
}

try {
  await aplicacion.listen({ port: entorno.PORT, host: entorno.HOST })
} catch (errorCapturado) {
  aplicacion.log.error(errorCapturado)
  process.exit(1)
}
