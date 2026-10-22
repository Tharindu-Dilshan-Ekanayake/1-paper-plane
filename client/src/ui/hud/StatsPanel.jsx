import { formatClock, formatNumber } from '@shared/format'
import { friendBoost } from '@shared/logic'

import { useGame } from '../../store/game'
import useNow from '../useNow'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { GRADIENTS, u } from './style'

function StatRow({ icon, value }) {
  return (
    <div className="relative flex items-center" style={{ height: u(84) }}>
      <div
        className="absolute"
        style={{
          left: u(34),
          width: u(210),
          height: u(66),
          background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)',
        }}
      />
      <Icon name={icon} size={u(84)} className="relative" />
      <span className="relative" style={{ fontSize: u(54), marginLeft: u(8) }}>
        <StrokeText stroke={u(10)} gradient={GRADIENTS.gold}>
          {value}
        </StrokeText>
      </span>
    </div>
  )
}

/** Active potion timers, shown above the stats while a boost runs. */
function Boosts() {
  const boosts = useGame((s) => s.profile.boosts)
  const now = useNow(1000)
  const active = [
    ['potionPower', boosts.power],
    ['potionWins', boosts.wins],
  ].filter(([, end]) => end > now)
  if (active.length === 0) return null
  return (
    <div className="flex" style={{ gap: u(10), marginBottom: u(6) }}>
      {active.map(([icon, end]) => (
        <div key={icon} className="flex items-center" style={{ fontSize: u(28) }}>
          <Icon name={icon} size={u(54)} />
          <StrokeText stroke={u(6)}>{formatClock(end - now)}</StrokeText>
        </div>
      ))}
    </div>
  )
}

/** Bottom-left: Wins and Rebirths with the Friend Boost line under them. */
export function StatsPanel() {
  const wins = useGame((s) => s.profile.wins - s.pendingWins)
  const rebirths = useGame((s) => s.profile.rebirths)
  const friends = useGame((s) => s.friends)
  const openPanel = useGame((s) => s.openPanel)

  return (
    <div className="pointer-events-none absolute flex flex-col" style={{ left: u(8), bottom: u(6) }}>
      <Boosts />
      <StatRow icon="trophy" value={formatNumber(wins)} />
      <StatRow icon="rebirth" value={formatNumber(rebirths)} />
      <div className="flex items-center" style={{ gap: u(10), marginTop: u(2) }}>
        <span style={{ fontSize: u(30) }}>
          <StrokeText stroke={u(7)} className="italic">
            Friend Boost: +{Math.round(friendBoost(friends) * 100)}%
          </StrokeText>
        </span>
        <button
          type="button"
          onClick={() => openPanel('lobby')}
          className="pp-btn pointer-events-auto flex items-center justify-center"
          style={{
            width: u(36),
            height: u(36),
            borderRadius: u(5),
            background: GRADIENTS.greenButton,
            border: `${u(3)} solid #111`,
            fontSize: u(32),
          }}
          aria-label="Invite friends"
        >
          <StrokeText stroke={u(5)}>+</StrokeText>
        </button>
      </div>
    </div>
  )
}

export default StatsPanel
