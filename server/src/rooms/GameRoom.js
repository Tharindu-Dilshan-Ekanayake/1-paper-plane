import { Room } from '@colyseus/core'

import { applyOfflineProgress } from '../../../shared/logic.js'
import { PlayerSession } from '../../../shared/session.js'
import { clampToWalkable, MAX_MOVE_SPEED, SPAWN } from '../../../shared/world.js'
import { getSphinxStock, loadProfile, saveProfile, takeSphinx } from '../db.js'
import { getLeaderboards } from '../leaderboards.js'
import { activePlayers, broadcastAll, liveRooms } from '../registry.js'
import { GameState, PlayerState } from './schema.js'

const MAX_CLIENTS = 8
const RECONNECT_SECONDS = 20
const AUTOSAVE_MS = 30_000
/** State patches to clients, and the training simulation, per second. */
const PATCH_HZ = 15
const SIM_HZ = 10
/** Allowance on top of max speed for a position update to be accepted. */
const MOVE_SLACK = 2.5
const MOCK_PURCHASES = process.env.PREMIUM_MOCK === '1'
/** Close code used when the same player joins somewhere else (4000-4010 are Colyseus's own). */
const DUPLICATE_LOGIN = 4100

/** Unambiguous characters for lobby codes people read out to each other. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const makeCode = (length = 5) =>
  Array.from({ length }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')

const cleanName = (name) =>
  String(name || 'Player')
    .replace(/[^\p{L}\p{N} _.-]/gu, '')
    .trim()
    .slice(0, 20) || 'Player'

/**
 * One lobby: up to 8 players sharing a world. All game rules run in each player's
 * PlayerSession; the room handles networking, position validation, persistence and
 * the small shared state other players render from.
 */
export class GameRoom extends Room {
  maxClients = MAX_CLIENTS
  autoDispose = true

  /** sessionId -> { session, playerId, lastPos, lastPosAt } */
  members = new Map()

  onCreate(options = {}) {
    this.setState(new GameState())
    if (options.private) {
      // A short code friends can type instead of the long generated room id.
      this.roomId = makeCode()
      this.state.code = this.roomId
      this.state.isPrivate = true
      this.setPrivate(true)
    }
    this.setPatchRate(1000 / PATCH_HZ)
    this.setSimulationInterval((dt) => this.tick(dt / 1000), 1000 / SIM_HZ)
    this.updateListing()
    liveRooms.add(this)

    // Everything the client can ask for goes through the player's session.
    this.onMessage('*', (client, type, payload) => {
      if (type === 'pos') return this.handlePosition(client, payload)
      const member = this.members.get(client.sessionId)
      if (!member) return
      member.session.handle(String(type), payload || {}, Date.now())
      this.syncPlayer(client.sessionId)
    })

    this.autosave = setInterval(() => this.saveAll(), AUTOSAVE_MS)
  }

  onAuth(_client, options) {
    // TODO: verify the Bloxity session token (options.token) against Bloxity before
    // trusting options.playerId - until then anyone can claim any id. Guests use a
    // random per-browser id, so they can only ever reach their own guest save.
    const playerId = String(options?.playerId || '').slice(0, 80)
    if (!playerId) throw new Error('Missing player id')
    return { playerId, name: cleanName(options?.name) }
  }

  onJoin(client, _options, auth) {
    const { playerId, name } = client.auth || auth

    // Same account joining again (new tab, refresh before the reconnect window
    // closed): the newest connection wins, the old one is saved and kicked.
    const existing = activePlayers.get(playerId)
    if (existing) existing.room.kick(existing.client, 'You joined from another window.')

    const now = Date.now()
    const profile = loadProfile(playerId, name)
    const offline = applyOfflineProgress(profile, now)

    const player = new PlayerState()
    const spawnX = SPAWN.x + (Math.random() - 0.5) * 6
    const spawnZ = SPAWN.z + (Math.random() - 0.5) * 4
    Object.assign(player, { name, x: spawnX, y: 0, z: spawnZ, rotY: Math.PI, anim: 'idle' })
    this.state.players.set(client.sessionId, player)

    const session = new PlayerSession(profile, {
      now,
      emit: (type, payload) => client.send(type, payload),
      getPosition: () => player,
      getFriends: () => (this.state.isPrivate ? this.clients.length - 1 : 0),
      mockPurchases: MOCK_PURCHASES,
      onPurchase: (productId) => {
        if (productId !== 'sphinx') return true
        const ok = takeSphinx()
        if (ok) broadcastAll('stock', { sphinx: getSphinxStock() })
        return ok
      },
      onThrow: (result) => {
        this.broadcast(
          'ghostThrow',
          { sid: client.sessionId, distance: result.distance, duration: result.duration, planeId: profile.equippedPlane, x: player.x, z: player.z },
          { except: client },
        )
      },
    })

    this.members.set(client.sessionId, { session, playerId, lastPos: { x: spawnX, z: spawnZ }, lastPosAt: now })
    activePlayers.set(playerId, { room: this, client })

    session.sendProfile()
    client.send('spawn', { x: spawnX, z: spawnZ })
    client.send('stock', { sphinx: getSphinxStock() })
    client.send('leaderboards', getLeaderboards())
    if (offline) client.send('offline', offline)
    this.syncPlayer(client.sessionId)
    this.updateListing()
  }

  /** Dropped without saying goodbye (mobile network blip): hold the seat. */
  async onDrop(client) {
    const member = this.members.get(client.sessionId)
    if (member?.kicked) return
    // Stop training while away; the seat stays warm for the reconnect.
    if (member) member.session.handle('leaveLane', {}, Date.now())
    try {
      await this.allowReconnection(client, RECONNECT_SECONDS)
    } catch {
      // Window expired; onLeave cleans up.
    }
  }

  onReconnect(client) {
    const member = this.members.get(client.sessionId)
    if (!member) return
    activePlayers.set(member.playerId, { room: this, client })
    member.session.emit = (type, payload) => client.send(type, payload)
    member.session.sendProfile()
  }

  onLeave(client) {
    const member = this.members.get(client.sessionId)
    if (member) {
      if (!member.kicked) saveProfile(member.session.profile)
      if (activePlayers.get(member.playerId)?.client === client) activePlayers.delete(member.playerId)
      this.members.delete(client.sessionId)
    }
    this.state.players.delete(client.sessionId)
    this.updateListing()
  }

  onDispose() {
    clearInterval(this.autosave)
    this.saveAll()
    liveRooms.delete(this)
  }

  // --- Helpers -----------------------------------------------------------------------

  /** Saves and removes a player who logged in elsewhere. */
  kick(client, reason) {
    const member = this.members.get(client.sessionId)
    if (member) {
      saveProfile(member.session.profile)
      member.kicked = true
    }
    client.send('kicked', { reason })
    client.leave(DUPLICATE_LOGIN)
  }

  /** Grants a paid product to whoever owns `playerId`, if they're in this room. */
  grantTo(playerId, productId) {
    for (const [sessionId, member] of this.members) {
      if (member.playerId !== playerId) continue
      member.session.grant(productId, Date.now())
      this.syncPlayer(sessionId)
      return true
    }
    return false
  }

  saveAll() {
    for (const member of this.members.values()) {
      try {
        saveProfile(member.session.profile)
      } catch (err) {
        console.error('[room] save failed', err)
      }
    }
  }

  updateListing() {
    this.setMetadata({
      players: this.clients.length,
      isPrivate: Boolean(this.state.isPrivate),
      region: process.env.REGION || 'default',
    })
  }

  /** Copies the public bits of a profile into the synced state (only what changed). */
  syncPlayer(sessionId) {
    const member = this.members.get(sessionId)
    const player = this.state.players.get(sessionId)
    if (!member || !player) return
    const p = member.session.profile
    if (player.power !== p.power) player.power = p.power
    if (player.wins !== p.wins) player.wins = p.wins
    if (player.rebirths !== p.rebirths) player.rebirths = p.rebirths
    if (player.level !== p.level) player.level = p.level
    if (player.planeId !== p.equippedPlane) player.planeId = p.equippedPlane
    const pets = p.equippedPets
      .map((uid) => p.pets.find((pet) => pet.uid === uid)?.id)
      .filter(Boolean)
    if (pets.join() !== [...player.petIds].join()) {
      player.petIds.clear()
      for (const id of pets) player.petIds.push(id)
    }
  }

  /**
   * Position reports, ~10 Hz from each client. Accepted if the move is physically
   * possible since the last accepted one; otherwise the client is snapped back.
   */
  handlePosition(client, msg) {
    const member = this.members.get(client.sessionId)
    const player = this.state.players.get(client.sessionId)
    if (!member || !player || !msg) return
    const x = Number(msg.x)
    const y = Number(msg.y)
    const z = Number(msg.z)
    if (![x, y, z].every(Number.isFinite)) return

    const now = Date.now()
    const dt = Math.max(0.05, (now - member.lastPosAt) / 1000)
    const dist = Math.hypot(x - member.lastPos.x, z - member.lastPos.z)
    if (dist > MAX_MOVE_SPEED * dt + MOVE_SLACK) {
      client.send('correct', { x: member.lastPos.x, y: player.y, z: member.lastPos.z })
      return
    }
    const clamped = clampToWalkable(x, z)
    member.lastPos = clamped
    member.lastPosAt = now
    player.x = clamped.x
    player.y = Math.max(0, Math.min(y, 6))
    player.z = clamped.z
    player.rotY = Number(msg.r) || 0
    player.anim = ['idle', 'walk', 'jump', 'throw'].includes(msg.a) ? msg.a : 'idle'
  }

  tick(dt) {
    const now = Date.now()
    for (const [sessionId, member] of this.members) {
      member.session.tick(dt, now)
      this.syncPlayer(sessionId)
    }
  }
}
