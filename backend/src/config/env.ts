import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  /**
   * Cadena de conexión de PostgreSQL. Para desarrollar sin un servidor se puede usar
   * PGlite (PostgreSQL en WebAssembly): `pglite://ruta/a/carpeta` o `pglite://memory`.
   */
  DATABASE_URL: z.string().default('postgres://cuatrobits:cuatrobits@localhost:5432/cuatrobits'),
  /** Uno o varios orígenes del frontend separados por comas, por ejemplo el dominio de Vercel */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  /**
   * Cifrado de la conexión con PostgreSQL. `off`: sin TLS (desarrollo local).
   * `verify`: TLS verificando el certificado del servidor con `DATABASE_CA_CERT` (Supabase).
   * `no-verify`: TLS sin verificar el certificado; solo si no se puede obtener el certificado.
   */
  DATABASE_SSL: z.enum(['off', 'verify', 'no-verify']).default('off'),
  /** Certificado raíz en formato PEM, necesario con `DATABASE_SSL=verify` */
  DATABASE_CA_CERT: z.string().optional(),
  /** Conexiones simultáneas; el plan gratuito de Supabase admite pocas */
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(5),
})

export const env = envSchema.parse(process.env)
