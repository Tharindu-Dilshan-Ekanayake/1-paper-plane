import { topPlayers } from './db.js'
import { activePlayers, broadcastAll } from './registry.js'
import { saveProfile } from './db.js'

const REFRESH_MS = 60_000
let cached = { rebirths: [], playtime: [], power: [], updatedAt: 0 }

/** Latest top-10 boards (Total Rebirths, Total Playtime, Top Power). */
export function getLeaderboards() {
  return cached
}

function refresh() {
  // Fold in progress from people still playing, so the boards aren't a save behind.
  for (const { room, client } of activePlayers.values()) {
    const member = room.members.get(client.sessionId)
    if (member) saveProfile(member.session.profile)
  }
  cached = { ...topPlayers(10), updatedAt: Date.now() }
  broadcastAll('leaderboards', cached)
}

export function startLeaderboards() {
  refresh()
  const id = setInterval(refresh, REFRESH_MS)
  return () => clearInterval(id)
}
