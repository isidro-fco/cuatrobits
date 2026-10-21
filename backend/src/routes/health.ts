import type { FastifyInstance } from 'fastify'
import type { Database } from '../config/database.js'

export function healthRoutes(db: Database) {
  return async (app: FastifyInstance) => {
    app.get('/api/health', async (_request, reply) => {
      try {
        await db.query('SELECT 1')
        return { status: 'ok', database: 'ok' }
      } catch {
        return reply.status(503).send({ status: 'error', database: 'unavailable' })
      }
    })
  }
}
