import { PLAYTIME_REWARDS } from '@shared/balance'
import { formatClock } from '@shared/format'
import { playtimeStatus } from '@shared/logic'

import { actions } from '../../net/actions'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import RewardIcon from '../RewardIcon'
import StrokeText from '../StrokeText'
import useNow from '../useNow'
import { GRADIENTS, u } from '../hud/style'
import Panel from './Panel'

/** Playtime gifts: claimable after N minutes in this session. */
export function RewardsPanel() {
  const session = useGame((s) => s.session)
  const now = useNow(1000)
  const status = playtimeStatus(session, now)

  return (
    <Panel title="REWARDS" width={980}>
      <p className="m-0 text-center" style={{ fontSize: u(30), marginBottom: u(14) }}>
        <StrokeText stroke={u(6)}>Keep playing to unlock free gifts!</StrokeText>
      </p>
      <div className="grid grid-cols-3" style={{ gap: u(14) }}>
        {PLAYTIME_REWARDS.map((reward, i) => {
          const s = status[i]
          return (
            <div
              key={reward.minutes}
              className="flex flex-col items-center"
              style={{
                padding: u(10),
                borderRadius: u(6),
                border: `${u(5)} solid #111`,
                background: s.state === 'claimed' ? GRADIENTS.greyButton : GRADIENTS.rewardCard,
                boxShadow: `inset 0 ${u(5)} 0 rgba(255,255,255,0.45)`,
              }}
            >
              <span style={{ fontSize: u(34) }}>
                <StrokeText stroke={u(7)}>{reward.minutes} min</StrokeText>
              </span>
              <RewardIcon icon={reward.icon} size={u(110)} />
              <span style={{ fontSize: u(34), margin: `${u(2)} 0 ${u(8)}` }}>
                <StrokeText stroke={u(7)}>{reward.label}</StrokeText>
              </span>
              {s.state === 'ready' ? (
                <button
                  type="button"
                  onClick={() => actions.claimPlaytime(i)}
                  className="pp-btn w-full"
                  style={{ height: u(58), borderRadius: u(5), background: GRADIENTS.greenButton, border: `${u(4)} solid #111`, fontSize: u(38) }}
                >
                  <StrokeText stroke={u(8)}>Claim!</StrokeText>
                </button>
              ) : (
                <div
                  className="flex w-full items-center justify-center"
                  style={{ height: u(58), borderRadius: u(5), background: 'rgba(0,0,0,0.35)', border: `${u(4)} solid #111`, fontSize: u(36), gap: u(6) }}
                >
                  {s.state === 'claimed' && <Icon name="check" size={u(36)} />}
                  <StrokeText stroke={u(7)}>{s.state === 'claimed' ? 'Claimed' : formatClock(s.unlocksIn)}</StrokeText>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export default RewardsPanel
