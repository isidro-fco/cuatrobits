import cors from '@fastify/cors'
import Fastify from 'fastify'
import type { Database } from './config/database.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { gameRoutes } from './routes/games.js'
import { healthRoutes } from './routes/health.js'
import { playerRoutes } from './routes/players.js'

export interface AppOptions {
  db: Database
  logger?: boolean
}

export function buildApp({ db, logger = process.env.NODE_ENV !== 'test' }: AppOptions) {
  const app = Fastify({ logger })

  app.register(cors, { origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/$/, '')) })
  app.setErrorHandler(errorHandler)
  app.register(healthRoutes(db))
  app.register(playerRoutes(db))
  app.register(gameRoutes(db))

  return app
}
