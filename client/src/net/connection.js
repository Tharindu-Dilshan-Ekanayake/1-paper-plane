import { runtime } from '../game/runtime'
import { getGame } from '../store/game'
import { setTransport } from './actions'
import { handleServerEvent } from './events'
import { createLocalServer } from './localServer'
import { clearRemotePlayers, removeRemotePlayer, upsertRemotePlayer } from './remotePlayers'

/** Position reports per second (the server validates each against the last). */
const POSITION_HZ = 10
const JOIN_RETRIES = 4
const RETRY_DELAY_MS = 4000
/** Server code for "you joined from another window". */
const DUPLICATE_LOGIN = 4100

const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')

/**
 * Where the game server lives. `?offline` forces offline play; in development
 * `?server=` overrides; otherwise VITE_SERVER_URL, falling back to port 3000 on the
 * same host in dev. A production build without VITE_SERVER_URL plays offline.
 */
function serverUrl() {
  if (params.has('offline')) return null
  if (import.meta.env.DEV && params.get('server')) return params.get('server')
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL
  return import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:3000` : null
}

let active = null
let generation = 0
let lastIdentity = null
/** What our avatar wears, as last shared; sent again on every join. */
let localLook = null
/** Sends `look` to the room now, if there is one. */
let sendLook = () => {}

/**
 * Shares what our Bloxity avatar wears so other players can dress our character the
 * same. Kept and re-sent on every (re)join.
 */
export function shareLook(equipped, proportions) {
  localLook = { equipped: equipped || {}, proportions: proportions || {} }
  sendLook()
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function reachable(url) {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2500) })
    return res.ok
  } catch {
    return false
  }
}

function startLocal(identity, message) {
  const local = createLocalServer({ ...identity, onEvent: handleServerEvent })
  active = { kind: 'local', close: () => local.close() }
  setTransport(local)
  getGame().setNet({ mode: 'offline', players: 1, lobbyId: null, code: null, isPrivate: false, message })
}

function join(client, options, lobby) {
  if (lobby.mode === 'private') return client.create('game', { ...options, private: true })
  if (lobby.mode === 'join') return client.joinById(String(lobby.code).trim().toUpperCase(), options)
  return client.joinOrCreate('game', options)
}

/** Wires a joined room into the game: events, other players, position reports. */
function attachRoom(room, identity, Callbacks) {
  const callbacks = Callbacks.get(room)
  let leaving = false

  const syncLobby = () => {
    const players = room.state.players?.size ?? 1
    const isPrivate = Boolean(room.state.isPrivate)
    getGame().setNet({
      mode: 'online',
      lobbyId: room.roomId,
      code: isPrivate ? room.state.code : null,
      isPrivate,
      players,
      message: null,
    })
  }

  room.onMessage('*', (type, payload) => {
    switch (type) {
      case 'spawn':
        runtime.player.position.set(payload.x, 0, payload.z)
        break
      case 'correct':
        runtime.player.position.set(payload.x, payload.y, payload.z)
        break
      case 'stock':
        getGame().setSphinxStock(payload.sphinx)
        break
      case 'leaderboards':
        getGame().setLeaderboards(payload)
        break
      case 'ghostThrow':
        runtime.ghostThrows.push({ ...payload, startedAt: performance.now() })
        break
      case 'kicked':
        leaving = true
        break
      default:
        handleServerEvent(type, payload)
    }
  })

  callbacks.onAdd('players', (player, sessionId) => {
    if (sessionId !== room.sessionId) {
      upsertRemotePlayer(sessionId, player)
      callbacks.onChange(player, () => upsertRemotePlayer(sessionId, player))
    }
    syncLobby()
  })
  callbacks.onRemove('players', (_player, sessionId) => {
    removeRemotePlayer(sessionId)
    syncLobby()
  })
  callbacks.listen('isPrivate', syncLobby)

  sendLook = () => {
    if (localLook) room.send('look', localLook)
  }
  sendLook()

  // ~10 Hz position reports, skipped while standing still and not throwing. `n`
  // counts our throws, so others see each one.
  let last = { x: NaN, y: NaN, z: NaN, a: '', n: -1 }
  let lastSentAt = 0
  const posId = setInterval(() => {
    const p = runtime.player.position
    const a = runtime.player.anim
    const n = runtime.player.throwSeq
    const now = performance.now()
    const moved = Math.abs(p.x - last.x) + Math.abs(p.y - last.y) + Math.abs(p.z - last.z) > 0.03
    if (!moved && a === last.a && n === last.n && now - lastSentAt < 1000) return
    last = { x: p.x, y: p.y, z: p.z, a, n }
    lastSentAt = now
    room.send('pos', { x: p.x, y: p.y, z: p.z, r: runtime.player.yaw, a, n })
  }, 1000 / POSITION_HZ)

  room.onDrop(() => getGame().setNet({ mode: 'connecting', message: 'Reconnecting…' }))
  room.onReconnect(syncLobby)
  room.onLeave((code) => {
    clearInterval(posId)
    sendLook = () => {}
    clearRemotePlayers()
    if (leaving || code === DUPLICATE_LOGIN) {
      getGame().setNet({ mode: 'offline', message: 'Disconnected' })
      return
    }
    // Lost the room for good (server restart, reconnect window missed): rejoin.
    if (active?.room === room) {
      getGame().setNet({ mode: 'connecting', message: 'Reconnecting…' })
      setTimeout(() => startConnection(identity), 1500)
    }
  })

  active = {
    kind: 'online',
    room,
    close: () => {
      leaving = true
      clearInterval(posId)
      clearRemotePlayers()
      room.leave(true)
    },
  }
  setTransport({ send: (type, payload) => room.send(type, payload) })
  syncLobby()
}

/**
 * Connects `identity` ({ id, name }) to a lobby. `lobby.mode` is 'public' (matchmade,
 * the default), 'private' (a new private lobby) or 'join' (with `lobby.code`).
 * Falls back to offline play when no server is reachable.
 */
export async function startConnection(identity, lobby = { mode: 'public' }) {
  const gen = ++generation
  lastIdentity = identity
  stopConnection()
  const url = serverUrl()
  if (!url) {
    startLocal(identity, null)
    return
  }

  getGame().setNet({ mode: 'connecting', message: 'Connecting…' })
  if (!(await reachable(url))) {
    if (gen !== generation) return
    startLocal(identity, 'Server unreachable - playing offline')
    return
  }

  // Loaded on demand: offline play never downloads the networking code, and online play
  // fetches it in parallel with the lobby rather than in front of it.
  const { Client, Callbacks } = await import('@colyseus/sdk')
  if (gen !== generation) return
  const client = new Client(url)
  const options = { playerId: identity.id, name: identity.name }
  for (let attempt = 0; attempt <= JOIN_RETRIES; attempt += 1) {
    try {
      // After a failed private/join attempt, fall back to a public lobby.
      const room = await join(client, options, attempt === 0 ? lobby : { mode: 'public' })
      if (gen !== generation) {
        room.leave(true)
        return
      }
      attachRoom(room, identity, Callbacks)
      return
    } catch (err) {
      if (gen !== generation) return
      console.warn('[net] join failed', err)
      if (attempt >= 1) getGame().setNet({ mode: 'connecting', message: 'Server full, retrying…' })
      await wait(attempt === 0 ? 300 : RETRY_DELAY_MS)
      if (gen !== generation) return
    }
  }
  startLocal(identity, 'Could not join a lobby - playing offline')
}

/** Moves to another lobby with the same identity (from the lobby panel). */
export function switchLobby(lobby) {
  if (lastIdentity) startConnection(lastIdentity, lobby)
}

export function isOnline() {
  return active?.kind === 'online'
}

export function stopConnection() {
  if (!active) return
  setTransport(null)
  active.close()
  active = null
}
