import { levelCap, PRODUCTS, rebirthMultiplier } from '@shared/balance'
import { isMaxLevel, rebirthProgress } from '@shared/logic'

import { actions } from '../../net/actions'
import { purchase } from '../../net/premium'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { Price } from '../hud/parts'
import { GRADIENTS, u } from '../hud/style'
import Panel from './Panel'

function StatCard({ icon, text, size = 58 }) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        height: u(118),
        borderRadius: u(6),
        background: GRADIENTS.rewardCard,
        border: `${u(5)} solid #111`,
        boxShadow: `inset 0 ${u(4)} 0 rgba(255,255,255,0.5), inset 0 -${u(5)} 0 rgba(0,0,0,0.15)`,
      }}
    >
      <Icon name={icon} size={u(120)} className="absolute" style={{ opacity: 0.95 }} />
      <span className="relative" style={{ fontSize: u(size) }}>
        <StrokeText stroke={u(size * 0.19)}>{text}</StrokeText>
      </span>
    </div>
  )
}

/**
 * Rebirth: what you have now vs. after the next rebirth, progress to the level cap,
 * and the two ways to rebirth (earn it, or skip for Bux and keep everything).
 */
export function RebirthPanel() {
  const rebirths = useGame((s) => s.profile.rebirths)
  const progress = useGame((s) => rebirthProgress(s.profile))
  const ready = useGame((s) => isMaxLevel(s.profile))
  const cap = levelCap(rebirths)

  const footer = (
    <p className="m-0 text-center" style={{ fontSize: u(36), marginTop: u(14) }}>
      <StrokeText stroke={u(8)} fill="#ff3b30">
        Rebirth resets Power &amp; Levels. Wins and Frisbees stay!
      </StrokeText>
    </p>
  )

  return (
    <Panel title="REBIRTH" width={900} footer={footer}>
      <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr', columnGap: u(22), rowGap: u(18) }}>
        <div className="text-center" style={{ fontSize: u(56) }}>
          <StrokeText stroke={u(10)}>Rebirth {rebirths}:</StrokeText>
        </div>
        <div />
        <div className="text-center" style={{ fontSize: u(56) }}>
          <StrokeText stroke={u(10)}>Rebirth {rebirths + 1}:</StrokeText>
        </div>

        <StatCard icon="muscle" text={`X${rebirthMultiplier(rebirths)} Power`} />
        <Icon name="fastForward" size={u(86)} />
        <StatCard icon="muscle" text={`X${rebirthMultiplier(rebirths + 1)} Power`} />

        <StatCard icon="starGold" text={`MAX Level ${cap}`} size={48} />
        <Icon name="fastForward" size={u(86)} />
        <StatCard icon="starGold" text={`MAX Level ${levelCap(rebirths + 1)}`} size={48} />
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          marginTop: u(22),
          height: u(76),
          borderRadius: u(4),
          border: `${u(4)} solid #111`,
          background: '#16181c',
        }}
      >
        <div className="absolute inset-y-0 left-0" style={{ width: `${progress * 100}%`, background: GRADIENTS.barFill }} />
        <div className="absolute inset-0 flex items-center justify-center" style={{ gap: u(12), fontSize: u(50) }}>
          <Icon name="starGold" size={u(60)} />
          <StrokeText stroke={u(9)}>
            {ready ? 'MAX LEVEL - READY!' : `Complete Level ${cap} · ${Math.floor(progress * 100)}%`}
          </StrokeText>
        </div>
      </div>

      <div className="flex" style={{ gap: u(18), marginTop: u(22) }}>
        <button
          type="button"
          onClick={() => purchase('skipRebirth')}
          className="pp-btn relative flex flex-1 items-center justify-center"
          style={{
            height: u(130),
            borderRadius: u(6),
            background: GRADIENTS.rainbow,
            border: `${u(5)} solid #111`,
            boxShadow: `inset 0 ${u(5)} 0 rgba(255,255,255,0.45), 0 ${u(5)} 0 rgba(0,0,0,0.4)`,
          }}
        >
          <span style={{ fontSize: u(62), marginTop: u(-18) }}>
            <StrokeText stroke={u(11)}>SKIP REBIRTH</StrokeText>
          </span>
          <Price amount={PRODUCTS.skipRebirth.price} size={40} className="absolute" style={{ left: u(10), bottom: u(-8) }} />
          <span className="absolute" style={{ right: u(10), bottom: u(-6), fontSize: u(32) }}>
            <StrokeText stroke={u(7)} gradient={GRADIENTS.gold}>
              KEEP ALL STATS!
            </StrokeText>
          </span>
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => actions.rebirth()}
          className="pp-btn relative flex flex-1 items-center justify-center"
          style={{
            height: u(130),
            borderRadius: u(6),
            background: ready ? GRADIENTS.greenButton : GRADIENTS.greyButton,
            border: `${u(5)} solid #111`,
            boxShadow: `inset 0 ${u(5)} 0 rgba(255,255,255,0.45), 0 ${u(5)} 0 rgba(0,0,0,0.4)`,
          }}
        >
          <span style={{ fontSize: u(84) }}>
            <StrokeText stroke={u(13)}>REBIRTH</StrokeText>
          </span>
        </button>
      </div>
    </Panel>
  )
}

export default RebirthPanel
