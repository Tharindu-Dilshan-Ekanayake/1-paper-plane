import { useEffect, useRef, useState } from 'react'

import { useBloxity } from './bloxity/BloxityContext'
import { startGameTicker } from './game/ticker'
import { startConnection, stopConnection } from './net/connection'

const GUEST_KEY = 'pp.guestId'
/** Don't hold the game hostage to a slow SDK script: play as guest after this. */
const SDK_GRACE_MS = 4000

/** A stable per-browser id for players who haven't logged in. */
function guestId() {
  try {
    let id = localStorage.getItem(GUEST_KEY)
    if (!id) {
      id = `guest-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
      localStorage.setItem(GUEST_KEY, id)
    }
    return id
  } catch {
    return `guest-${Math.random().toString(36).slice(2)}`
  }
}

/**
 * Non-visual: owns the game's long-running processes - the connection to the authority
 * and the 10 Hz zone ticker - for the lifetime of the app.
 *
 * Waits for the Bloxity SDK to settle (or fail) so the save is opened under the right
 * identity, then reconnects whenever the player logs in or out.
 */
export function GameController() {
  const { status, user, identity } = useBloxity()
  const [graceOver, setGraceOver] = useState(false)
  const settled = status === 'ready' || status === 'error' || graceOver
  const playerId = user?._id ? String(user._id) : null
  const name = identity?.displayName || identity?.username || 'Player'
  // A display-name change shouldn't reconnect; the next connection picks it up.
  const nameRef = useRef(name)
  useEffect(() => {
    nameRef.current = name
  }, [name])

  useEffect(() => {
    const id = setTimeout(() => setGraceOver(true), SDK_GRACE_MS)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const stop = startGameTicker()
    return stop
  }, [])

  useEffect(() => {
    if (!settled) return undefined
    startConnection({ id: playerId || guestId(), name: nameRef.current })
    return stopConnection
  }, [settled, playerId])

  return null
}

export default GameController
