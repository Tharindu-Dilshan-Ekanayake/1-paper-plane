import { dailyStatus } from '@shared/logic'

import { useGame } from '../../store/game'
import AuthHUD from '../AuthHUD'
import useNow from '../useNow'
import Icon from '../Icon'
import { AlertBadge, ChunkyButton } from './parts'
import { GRADIENTS, u } from './style'

function RoundButton({ icon, label, onClick, alert, iconSize = 38 }) {
  return (
    <ChunkyButton gradient={GRADIENTS.slate} onClick={onClick} title={label} radius={32} style={{ width: u(64), height: u(64) }}>
      <Icon name={icon} size={u(iconSize)} />
      {alert && <AlertBadge size={26} style={{ top: u(-8), right: u(-8) }} />}
    </ChunkyButton>
  )
}

/**
 * The top-right corner: daily rewards, leaderboards and your name tag. The top-left
 * is deliberately left clear for the game's logo.
 */
export function TopBar() {
  const openPanel = useGame((s) => s.openPanel)
  const daily = useGame((s) => s.profile.daily)
  const profile = useGame((s) => s.profile)
  const now = useNow(10000)
  const dailyReady = dailyStatus({ ...profile, daily }, now).some((d) => d.state === 'ready')

  return (
    <div className="pointer-events-none absolute flex items-center" style={{ right: u(16), top: u(14), gap: u(12) }}>
      <RoundButton icon="calendar" label="Daily Rewards" alert={dailyReady} onClick={() => openPanel('daily')} />
      <RoundButton icon="star" label="Leaderboards" onClick={() => openPanel('leaderboards')} iconSize={34} />
      <AuthHUD />
    </div>
  )
}

export default TopBar
