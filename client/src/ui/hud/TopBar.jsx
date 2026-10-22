import { dailyStatus } from '@shared/logic'

import { useGame } from '../../store/game'
import AuthHUD from '../AuthHUD'
import useNow from '../useNow'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { AlertBadge } from './parts'
import { u } from './style'

function RoundButton({ icon, label, onClick, alert, iconSize = 34 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="pp-btn pointer-events-auto relative flex items-center justify-center rounded-full bg-black/55"
      style={{ width: u(56), height: u(56) }}
    >
      <Icon name={icon} size={u(iconSize)} />
      {alert && <AlertBadge size={26} style={{ top: u(-6), right: u(-6) }} />}
    </button>
  )
}

function LobbyBadge() {
  const net = useGame((s) => s.net)
  const openPanel = useGame((s) => s.openPanel)
  const label =
    net.mode === 'online'
      ? `Lobby ${net.players}/${net.maxPlayers}`
      : net.mode === 'connecting'
        ? 'Connecting…'
        : 'Offline'
  return (
    <button
      type="button"
      onClick={() => openPanel('lobby')}
      className="pp-btn pointer-events-auto flex items-center rounded-full bg-black/55"
      style={{ height: u(56), padding: `0 ${u(14)} 0 ${u(8)}`, gap: u(8), fontSize: u(22) }}
    >
      <Icon name="users" size={u(36)} />
      <StrokeText stroke={u(5)}>{label}</StrokeText>
      {net.mode === 'online' && (
        <span className="rounded-full" style={{ background: '#57e83a', border: `${u(2)} solid #111`, padding: `${u(1)} ${u(10)}`, fontSize: u(18) }}>
          <StrokeText stroke={u(4)}>Invite</StrokeText>
        </span>
      )}
    </button>
  )
}

/** Top corners: settings, lobby and identity on the left; daily rewards and boards on the right. */
export function TopBar() {
  const openPanel = useGame((s) => s.openPanel)
  const daily = useGame((s) => s.profile.daily)
  const profile = useGame((s) => s.profile)
  const now = useNow(10000)
  const dailyReady = dailyStatus({ ...profile, daily }, now).some((d) => d.state === 'ready')

  return (
    <>
      <div className="pointer-events-none absolute flex items-center" style={{ left: u(16), top: u(12), gap: u(10) }}>
        <RoundButton icon="gear" label="Settings" onClick={() => openPanel('settings')} />
        <LobbyBadge />
        <AuthHUD />
      </div>
      <div className="pointer-events-none absolute flex items-center" style={{ right: u(16), top: u(12), gap: u(10) }}>
        <RoundButton icon="calendar" label="Daily Rewards" alert={dailyReady} onClick={() => openPanel('daily')} />
        <RoundButton icon="star" label="Leaderboards" onClick={() => openPanel('leaderboards')} iconSize={30} />
      </div>
    </>
  )
}

export default TopBar
