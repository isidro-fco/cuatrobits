/**
 * Archivo: migrar.ts
 * Módulo: backend
 * Descripción: Script de línea de comandos que aplica las migraciones pendientes. Uso: pnpm
 *              db:migrate (desarrollo) o node dist/migrar.js (producción, antes de arrancar el
 *              servidor).
 * Requerimientos: RIE02, RDC07
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { crearBaseDatos, opcionesPgDesdeEntorno } from './config/baseDatos.js'
import { entorno } from './config/entorno.js'
import { migrar } from './config/migraciones.js'

// ---------- Arranque ----------
const baseDatos = crearBaseDatos(entorno.DATABASE_URL, opcionesPgDesdeEntorno(entorno))
try {
  const aplicadas = await migrar(baseDatos)
  console.log(
    aplicadas.length > 0
      ? `Migraciones aplicadas: ${aplicadas.join(', ')}`
      : 'La base de datos ya estaba al día.',
  )
} finally {
  await baseDatos.cerrar()
}
