import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../config/database.js'
import { authorize } from '../middleware/auth.js'
import { buyItemSchema, createPlayerSchema, historyQuerySchema, idSchema, recoverSchema } from '../models/schemas.js'
import { parse } from '../models/validate.js'
import { buyItem, createPlayer, getHistory, getPlayer, getStats } from '../services/playerService.js'
import { AttemptLimiter, createRecoveryCode, recoverPlayer } from '../services/recoveryService.js'

const paramsSchema = z.object({ id: idSchema })

export function playerRoutes(db: Database, limiter = new AttemptLimiter()) {
  return async (app: FastifyInstance) => {
    // Las rutas con `:id` exigen el token del jugador: 401 sin token válido · 403 token de otro jugador
    app.post('/api/players', async (request, reply) => {
      const { created, player } = await createPlayer(db, parse(createPlayerSchema, request.body))
      return reply.status(created ? 201 : 200).send(player)
    })

    // Recupera un perfil con su nombre y código secreto · 401 datos incorrectos · 429 demasiados intentos
    app.post('/api/players/recover', async (request) => {
      return recoverPlayer(db, limiter, parse(recoverSchema, request.body))
    })

    // Código para perfiles creados antes de existir la recuperación · 409 si ya tiene uno
    app.post('/api/players/:id/recovery-code', async (request, reply) => {
      const { id } = parse(paramsSchema, request.params)
      await authorize(db, request, id)
      return reply.status(201).send({ recoveryCode: await createRecoveryCode(db, id) })
    })

    app.get('/api/players/:id', async (request) => {
      const { id } = parse(paramsSchema, request.params)
      await authorize(db, request, id)
      return getPlayer(db, id)
    })

    app.get('/api/players/:id/history', async (request) => {
      const { id } = parse(paramsSchema, request.params)
      await authorize(db, request, id)
      const { limit, offset } = parse(historyQuerySchema, request.query)
      return getHistory(db, id, limit, offset)
    })

    app.get('/api/players/:id/stats', async (request) => {
      const { id } = parse(paramsSchema, request.params)
      await authorize(db, request, id)
      return getStats(db, id)
    })

    // 201 comprado · 200 ya lo tenía · 409 sin Bits suficientes
    app.post('/api/players/:id/items', async (request, reply) => {
      const { id } = parse(paramsSchema, request.params)
      await authorize(db, request, id)
      const { itemId } = parse(buyItemSchema, request.body)
      const result = await buyItem(db, id, itemId)
      return reply.status(result.status === 'created' ? 201 : 200).send(result)
    })
  }
}
