/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend en producción, sin `/api` al final; vacía en desarrollo */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
