// Uso: pnpm db:migrate (desarrollo) o node dist/migrate.js (producción, antes de arrancar el servidor)
import { createDatabase, pgOptionsFromEnv } from './config/database.js'
import { env } from './config/env.js'
import { migrate } from './config/migrate.js'

const db = createDatabase(env.DATABASE_URL, pgOptionsFromEnv(env))
try {
  const applied = await migrate(db)
  console.log(applied.length > 0 ? `Migraciones aplicadas: ${applied.join(', ')}` : 'La base de datos ya estaba al día.')
} finally {
  await db.close()
}
