/**
 * Archivo: vite-env.d.ts
 * Módulo: frontend
 * Descripción: Tipos de las variables de entorno de Vite.
 * Requerimientos: RDC02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend en producción, sin `/api` al final; vacía en desarrollo */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
