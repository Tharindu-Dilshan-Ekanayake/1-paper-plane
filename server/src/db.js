import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

import { SPHINX_STOCK_DEFAULT } from '../../shared/balance.js'
import { normalizeProfile } from '../../shared/logic.js'

/**
 * Persistence: one SQLite file, using Node's built-in driver (no native build step).
 *
 * Profiles are stored whole as JSON, with the leaderboard columns copied out so the
 * boards are plain indexed queries. The driver is synchronous, which is exactly what
 * a save-on-leave wants: the write has finished before the next join can read it.
 */

const DB_PATH = process.env.DB_PATH || fileURLToPath(new URL('../data/game.db', import.meta.url))

let db = null

export function openDatabase(path = DB_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  db = new DatabaseSync(path)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      rebirths INTEGER NOT NULL DEFAULT 0,
      playtime REAL NOT NULL DEFAULT 0,
      best_power REAL NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS profiles_rebirths ON profiles (rebirths DESC);
    CREATE INDEX IF NOT EXISTS profiles_playtime ON profiles (playtime DESC);
    CREATE INDEX IF NOT EXISTS profiles_power ON profiles (best_power DESC);
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS purchases (
      transaction_id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `)
  return db
}

function requireDb() {
  if (!db) openDatabase()
  return db
}

/** Loads (or creates) the profile for `id`, normalised to the current shape. */
export function loadProfile(id, name) {
  const row = requireDb().prepare('SELECT data FROM profiles WHERE id = ?').get(id)
  let raw = null
  if (row) {
    try {
      raw = JSON.parse(row.data)
    } catch {
      console.warn(`[db] corrupt profile for ${id}, starting fresh`)
    }
  }
  return normalizeProfile(raw, id, name)
}

export function saveProfile(profile) {
  profile.lastSeen = Date.now()
  requireDb()
    .prepare(
      `INSERT INTO profiles (id, name, data, rebirths, playtime, best_power, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, data = excluded.data, rebirths = excluded.rebirths,
         playtime = excluded.playtime, best_power = excluded.best_power,
         updated_at = excluded.updated_at`,
    )
    .run(
      profile.id,
      profile.name,
      JSON.stringify(profile),
      profile.rebirths,
      profile.stats.playtime,
      profile.stats.bestPower,
      profile.lastSeen,
    )
}

const BOARDS = {
  rebirths: 'rebirths',
  playtime: 'playtime',
  power: 'best_power',
}

/** Top `limit` players per board: `{ rebirths: [{ name, value }], ... }`. */
export function topPlayers(limit = 10) {
  const out = {}
  for (const [board, column] of Object.entries(BOARDS)) {
    out[board] = requireDb()
      .prepare(`SELECT name, ${column} AS value FROM profiles ORDER BY ${column} DESC LIMIT ?`)
      .all(limit)
      .map((r) => ({ name: r.name, value: r.value }))
  }
  return out
}

export function getSphinxStock() {
  const row = requireDb().prepare("SELECT value FROM kv WHERE key = 'sphinxStock'").get()
  return row ? Number(row.value) : SPHINX_STOCK_DEFAULT
}

/** Takes one Sphinx from stock. Returns false when sold out. */
export function takeSphinx() {
  const stock = getSphinxStock()
  if (stock <= 0) return false
  requireDb()
    .prepare("INSERT INTO kv (key, value) VALUES ('sphinxStock', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(String(stock - 1))
  return true
}

/** Records a payment; false if this transaction was already processed. */
export function recordPurchase(transactionId, playerId, productId) {
  const result = requireDb()
    .prepare('INSERT OR IGNORE INTO purchases (transaction_id, player_id, product_id, created_at) VALUES (?, ?, ?, ?)')
    .run(transactionId, playerId, productId, Date.now())
  return result.changes > 0
}
