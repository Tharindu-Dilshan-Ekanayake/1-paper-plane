import { getGame } from '../store/game'
import { setTransport } from './actions'
import { handleServerEvent } from './events'
import { createLocalServer } from './localServer'

let active = null

/**
 * Starts the connection for `identity` ({ id, name }). Replaces any previous one.
 */
export function startConnection(identity) {
  stopConnection()
  const local = createLocalServer({ ...identity, onEvent: handleServerEvent })
  active = local
  setTransport(local)
  getGame().setNet({ mode: 'offline', players: 1, lobbyId: null, code: null })
}

export function stopConnection() {
  if (!active) return
  setTransport(null)
  active.close()
  active = null
}
