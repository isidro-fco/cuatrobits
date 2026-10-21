import { buildApp } from './app.js'
import { createDatabase, pgOptionsFromEnv } from './config/database.js'
import { env } from './config/env.js'

const db = createDatabase(env.DATABASE_URL, pgOptionsFromEnv(env))
const app = buildApp({ db })
app.addHook('onClose', () => db.close())

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void app.close())
}

try {
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
