import { LEVEL_STEPS, PRODUCTS } from '@shared/balance'
import { formatMultiplier, formatNumber } from '@shared/format'
import { hudMultiplier, isMaxLevel } from '@shared/logic'

import { purchase } from '../../net/premium'
import { useGame } from '../../store/game'
import useNow from '../useNow'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { ChunkyButton, Price } from './parts'
import { GRADIENTS, u } from './style'

const BUY_BUTTONS = [
  { product: 'power100k', label: '+100K', gradient: GRADIENTS.goldButton },
  { product: 'power1m', label: '+1M', gradient: GRADIENTS.blueButton },
  { product: 'power10m', label: '+10M', gradient: GRADIENTS.purpleButton },
]

function LevelBar() {
  const level = useGame((s) => s.profile.level)
  const progress = useGame((s) => s.profile.levelProgress)
  const maxed = useGame((s) => isMaxLevel(s.profile))
  const fill = maxed ? 1 : progress / LEVEL_STEPS

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: u(600),
        height: u(50),
        borderRadius: u(6),
        border: `${u(4)} solid #111`,
        background: 'rgba(40, 40, 40, 0.55)',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out"
        style={{ width: `${fill * 100}%`, background: GRADIENTS.barFill }}
      />
      <div className="absolute inset-0 flex items-center justify-between" style={{ padding: `0 ${u(10)}`, fontSize: u(34) }}>
        <StrokeText stroke={u(7)}>LEVEL {level}</StrokeText>
        <StrokeText stroke={u(7)}>{maxed ? 'MAX LEVEL' : `${progress} / ${LEVEL_STEPS}`}</StrokeText>
      </div>
    </div>
  )
}

/** Bottom centre: Power and Multiplier, the level bar, and the power packs. */
export function PowerBar() {
  const power = useGame((s) => s.profile.power)
  const lane = useGame((s) => s.zone.lane)
  const friends = useGame((s) => s.friends)
  const profile = useGame((s) => s.profile)
  const now = useNow(1000)
  const multiplier = hudMultiplier(profile, lane, now, friends)

  return (
    <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ bottom: u(14) }}>
      <div className="flex w-full items-end justify-between" style={{ fontSize: u(40), marginBottom: u(-2), padding: `0 ${u(2)}` }}>
        <StrokeText stroke={u(8)} gradient={GRADIENTS.gold}>
          Power: {formatNumber(power)}
        </StrokeText>
        <StrokeText stroke={u(8)} gradient={GRADIENTS.gold}>
          Multiplier: {formatMultiplier(multiplier)}
        </StrokeText>
      </div>
      <LevelBar />
      <div className="flex" style={{ gap: u(22), marginTop: u(10) }}>
        {BUY_BUTTONS.map((b) => (
          <div key={b.product} className="relative flex flex-col items-center">
            <ChunkyButton
              gradient={b.gradient}
              onClick={() => purchase(b.product)}
              style={{ width: u(168), height: u(56), paddingLeft: u(34) }}
              radius={8}
              title={PRODUCTS[b.product].name}
            >
              <Icon name="muscle" size={u(74)} className="absolute" style={{ left: u(-14), top: u(-18) }} />
              <span style={{ fontSize: u(40) }}>
                <StrokeText stroke={u(8)}>{b.label}</StrokeText>
              </span>
            </ChunkyButton>
            <Price amount={PRODUCTS[b.product].price} size={28} style={{ marginTop: u(-10) }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PowerBar
