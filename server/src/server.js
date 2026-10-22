import cors from 'cors'
import express from 'express'
import { defineRoom, defineServer } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'

import { PRODUCTS } from '../../shared/balance.js'
import { grantProduct, normalizeProfile } from '../../shared/logic.js'
import { loadProfile, openDatabase, recordPurchase, saveProfile } from './db.js'
import { startLeaderboards } from './leaderboards.js'
import { activePlayers } from './registry.js'
import { GameRoom } from './rooms/GameRoom.js'

const PORT = Number(process.env.PORT || 3000)

// Vite's dev server origin. Add the production origin(s) via CLIENT_ORIGINS.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
]

/** HTTP endpoints next to the Colyseus matchmaker on the same port. */
function routes(app) {
  app.use('/api', cors({ origin: ALLOWED_ORIGINS, credentials: true }))
  app.use('/api', express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, players: activePlayers.size })
  })

  /**
   * Auth passthrough for the Bloxity SDK: the frontend POSTs `{ token, user }` from
   * `Legion.SDK.auth.authenticateWithServer('/api/legion-auth')`.
   */
  app.post('/api/legion-auth', (req, res) => {
    // TODO: verify the Bloxity JWT here before trusting req.body.user. Until then
    // `req.body.user` is attacker-controlled - anyone can POST any legionId. Verify
    // `req.body.token` against Bloxity's public key / introspection endpoint and
    // derive the user from the *verified* claims, not from the body.
    res.json({ accessToken: 'stub', user: { legionId: req.body?.user?._id } })
  })

  /**
   * Bux purchase webhook. Responds 200 immediately - the platform retries anything
   * else - and grants the product to the player, live if they're online, otherwise
   * straight into their save.
   *
   * Expected body: `{ transactionId, userId, productId }`.
   * TODO: confirm field names against Bloxity's webhook docs.
   */
  app.post('/api/legion-webhook', (req, res) => {
    const secret = process.env.LEGION_WEBHOOK_SECRET
    if (secret && req.get('x-legion-webhook-secret') !== secret) {
      res.sendStatus(401)
      return
    }
    res.sendStatus(200)

    const { transactionId, userId, productId } = req.body || {}
    if (!transactionId || !userId || !PRODUCTS[productId]) {
      console.warn('[webhook] ignoring malformed payload', req.body)
      return
    }
    const playerId = String(userId)
    if (!recordPurchase(String(transactionId), playerId, productId)) return // duplicate delivery

    const active = activePlayers.get(playerId)
    if (active && active.room.grantTo(playerId, productId)) return
    const profile = normalizeProfile(loadProfile(playerId, 'Player'), playerId, null)
    const result = grantProduct(profile, productId)
    if (result.ok) saveProfile(profile)
    else console.warn(`[webhook] could not grant ${productId} to ${playerId}: ${result.error}`)
  })
}

openDatabase()

const server = defineServer({
  transport: new WebSocketTransport(),
  rooms: {
    game: defineRoom(GameRoom).enableRealtimeListing(),
  },
  express: routes,
  greet: false,
})

await server.listen(PORT)
startLeaderboards()
console.log(`[server] listening on http://localhost:${PORT} (mock purchases: ${process.env.PREMIUM_MOCK === '1' ? 'on' : 'off'})`)
