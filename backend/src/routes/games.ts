import type { FastifyInstance } from 'fastify'
import type { Database } from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { syncSchema } from '../models/schemas.js'
import { parse } from '../models/validate.js'
import { saveGame, syncGames } from '../services/gameService.js'

export function gameRoutes(db: Database) {
  return async (app: FastifyInstance) => {
    // 201 si se guardó; 200 si ya estaba registrada · 401 sin token · 403 partida de otro jugador
    app.post('/api/games', async (request, reply) => {
      const result = await saveGame(db, request.body, await authenticate(db, request))
      return reply.status(result.status === 'created' ? 201 : 200).send(result)
    })

    // Confirma qué partidas pendientes quedaron almacenadas (sección 13.4)
    app.post('/api/games/sync', async (request) => {
      const ownerId = await authenticate(db, request)
      const { games } = parse(syncSchema, request.body)
      return { results: await syncGames(db, games, ownerId) }
    })
  }
}
