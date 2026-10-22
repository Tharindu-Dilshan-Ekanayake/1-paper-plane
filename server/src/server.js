import cors from 'cors'
import express from 'express'
import { defineRoom, defineServer } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'

import { openDatabase } from './db.js'
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
console.log(`[server] listening on http://localhost:${PORT}`)
