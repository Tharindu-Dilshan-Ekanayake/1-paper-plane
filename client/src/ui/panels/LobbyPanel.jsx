import { useState } from 'react'

import { FRIEND_BOOST_PER_FRIEND } from '@shared/balance'

import { switchLobby } from '../../net/connection'
import { remotePlayers } from '../../net/remotePlayers'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { ChunkyButton } from '../hud/parts'
import { GRADIENTS, u } from '../hud/style'
import Panel from './Panel'

function copy(text) {
  try {
    navigator.clipboard?.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Lobbies: who's here, the private-lobby code to share, and switching between the
 * public matchmaker, a new private lobby or a friend's lobby by code.
 */
export function LobbyPanel() {
  const net = useGame((s) => s.net)
  const toast = useGame((s) => s.toast)
  const closePanel = useGame((s) => s.closePanel)
  const name = useGame((s) => s.profile.name)
  const [code, setCode] = useState('')

  // Read when the player count changes (this panel re-renders with net.players).
  const others = [...remotePlayers.values()].map((r) => r.name)

  const go = (lobby) => {
    closePanel()
    switchLobby(lobby)
  }

  const status =
    net.mode === 'online'
      ? `${net.isPrivate ? 'Private' : 'Public'} lobby · ${net.players}/${net.maxPlayers} players`
      : net.mode === 'connecting'
        ? net.message || 'Connecting…'
        : net.message || 'Offline - progress saves on this device'

  return (
    <Panel title="LOBBY" width={820}>
      <div className="flex flex-col" style={{ gap: u(16) }}>
        <div className="flex items-center" style={{ gap: u(12), fontSize: u(34) }}>
          <Icon name="users" size={u(54)} />
          <StrokeText stroke={u(7)}>{status}</StrokeText>
        </div>

        {net.isPrivate && net.code && (
          <div className="flex flex-wrap items-center" style={{ gap: u(14) }}>
            <span style={{ fontSize: u(34) }}>
              <StrokeText stroke={u(7)}>Lobby code:</StrokeText>
            </span>
            <span
              className="tracking-[0.2em]"
              style={{ fontSize: u(60), padding: `${u(2)} ${u(18)}`, borderRadius: u(10), background: 'rgba(255,255,255,0.1)' }}
            >
              <StrokeText stroke={u(11)} gradient={GRADIENTS.gold}>
                {net.code}
              </StrokeText>
            </span>
            <ChunkyButton
              gradient={GRADIENTS.blueButton}
              onClick={() => toast(copy(net.code) ? 'Code copied - send it to your friends!' : `Your code is ${net.code}`, 'success')}
              style={{ height: u(70), padding: `0 ${u(22)}` }}
            >
              <span style={{ fontSize: u(34) }}>
                <StrokeText stroke={u(7)}>Copy</StrokeText>
              </span>
            </ChunkyButton>
          </div>
        )}

        {net.mode === 'online' && (
          <div className="flex flex-wrap" style={{ gap: u(10) }}>
            {[`${name} (you)`, ...others].map((n, i) => (
              <span key={`${n}-${i}`} style={{ fontSize: u(28), padding: `${u(6)} ${u(14)}`, borderRadius: u(30), background: 'rgba(255,255,255,0.08)' }}>
                <StrokeText stroke={u(5)}>{n}</StrokeText>
              </span>
            ))}
          </div>
        )}

        <p className="m-0" style={{ fontSize: u(26) }}>
          <StrokeText stroke={u(5)} fill="#b8ff8a">
            Friend Boost: +{Math.round(FRIEND_BOOST_PER_FRIEND * 100)}% Power for every friend in your private lobby!
          </StrokeText>
        </p>

        <div className="flex flex-wrap" style={{ gap: u(14) }}>
          <ChunkyButton gradient={GRADIENTS.greenButton} onClick={() => go({ mode: 'private' })} style={{ height: u(84), padding: `0 ${u(26)}` }}>
            <span style={{ fontSize: u(36) }}>
              <StrokeText stroke={u(7)}>Create Private Lobby</StrokeText>
            </span>
          </ChunkyButton>
          <ChunkyButton gradient={GRADIENTS.goldButton} onClick={() => go({ mode: 'public' })} style={{ height: u(84), padding: `0 ${u(26)}` }}>
            <span style={{ fontSize: u(36) }}>
              <StrokeText stroke={u(7)}>{net.mode === 'online' && !net.isPrivate ? 'New Public Lobby' : 'Public Lobby'}</StrokeText>
            </span>
          </ChunkyButton>
        </div>

        <form
          className="flex flex-wrap items-center"
          style={{ gap: u(12) }}
          onSubmit={(e) => {
            e.preventDefault()
            if (code.trim().length >= 4) go({ mode: 'join', code })
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9))}
            placeholder="FRIEND'S CODE"
            aria-label="Friend's lobby code"
            className="pp-font text-center uppercase tracking-[0.15em] text-white outline-none placeholder:text-white/40"
            style={{ height: u(78), width: u(320), fontSize: u(38), borderRadius: u(10), border: `${u(4)} solid #111`, background: 'rgba(255,255,255,0.12)' }}
          />
          <ChunkyButton gradient={GRADIENTS.purpleButton} onClick={() => code.trim().length >= 4 && go({ mode: 'join', code })} style={{ height: u(78), padding: `0 ${u(26)}` }}>
            <span style={{ fontSize: u(36) }}>
              <StrokeText stroke={u(7)}>Join</StrokeText>
            </span>
          </ChunkyButton>
        </form>
      </div>
    </Panel>
  )
}

export default LobbyPanel
