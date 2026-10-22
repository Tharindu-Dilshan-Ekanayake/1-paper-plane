import { PRODUCTS } from '@shared/balance'
import { playtimeStatus } from '@shared/logic'

import { purchase } from '../../net/premium'
import { useGame } from '../../store/game'
import useNow from '../useNow'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { AlertBadge, ChunkyButton, Price } from './parts'
import { GRADIENTS, u } from './style'

function PassButton({ product, icon, label }) {
  const owned = useGame((s) => Boolean(s.profile.passes[product]))
  return (
    <div className="relative flex flex-col items-center" style={{ marginTop: u(28) }}>
      <ChunkyButton
        onClick={() => purchase(product)}
        style={{ width: u(236), height: u(70) }}
        radius={6}
        title={PRODUCTS[product].name}
      >
        <Icon name={icon} size={u(64)} className="absolute" style={{ top: u(-34), left: '50%', transform: 'translateX(-50%)' }} />
        <span className="relative" style={{ fontSize: u(42) }}>
          <StrokeText stroke={u(8)}>{label}</StrokeText>
        </span>
      </ChunkyButton>
      {owned ? (
        <span style={{ fontSize: u(26), marginTop: u(-10) }}>
          <StrokeText stroke={u(6)} gradient={GRADIENTS.priceGreen}>
            OWNED
          </StrokeText>
        </span>
      ) : (
        <Price amount={PRODUCTS[product].price} size={32} style={{ marginTop: u(-12) }} />
      )}
    </div>
  )
}

/** Right side: playtime Rewards gift, and the x2 Power / x2 Wins passes. */
export function RightButtons() {
  const openPanel = useGame((s) => s.openPanel)
  const session = useGame((s) => s.session)
  const now = useNow(5000)
  const rewardReady = playtimeStatus(session, now).some((r) => r.state === 'ready')

  return (
    <div className="pointer-events-none absolute flex flex-col items-center" style={{ right: u(16), top: '37%' }}>
      <button
        type="button"
        onClick={() => openPanel('rewards')}
        className="pp-btn pointer-events-auto relative flex flex-col items-center"
        aria-label="Rewards"
      >
        <Icon name="gift" size={u(118)} />
        <span style={{ fontSize: u(36), marginTop: u(-24) }}>
          <StrokeText stroke={u(8)}>Rewards</StrokeText>
        </span>
        {rewardReady && <AlertBadge size={46} style={{ top: u(-4), right: u(-8) }} />}
      </button>
      <PassButton product="x2Power" icon="muscle" label="x2 Power" />
      <PassButton product="x2Wins" icon="trophy" label="x2 Wins" />
    </div>
  )
}

export default RightButtons
