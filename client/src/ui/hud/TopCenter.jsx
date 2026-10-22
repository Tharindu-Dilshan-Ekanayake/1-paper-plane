import { PRODUCTS, TUTORIAL } from '@shared/balance'
import { isMaxLevel, rebirthProgress } from '@shared/logic'

import { actions } from '../../net/actions'
import { purchase } from '../../net/premium'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { Price } from './parts'
import { GRADIENTS, u } from './style'

function AutoThrowButton() {
  const owned = useGame((s) => Boolean(s.profile.passes.autoThrow))
  const on = useGame((s) => Boolean(s.profile.settings.autoThrow))

  const onClick = () => {
    if (!owned) purchase('autoThrow')
    else actions.setSetting('autoThrow', !on)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="pp-btn pointer-events-auto relative flex flex-col items-center justify-center"
      style={{
        width: u(362),
        height: u(88),
        borderRadius: u(8),
        background: GRADIENTS.autoThrow,
        border: `${u(5)} solid #0b1f3a`,
        boxShadow: `0 ${u(5)} 0 rgba(0,0,0,0.4), inset 0 ${u(4)} 0 rgba(255,255,255,0.5)`,
      }}
      title={PRODUCTS.autoThrow.name}
    >
      <Icon name="autoThrow" size={u(108)} className="absolute" style={{ opacity: 0.85, top: u(-14) }} />
      <span className="relative" style={{ fontSize: u(42), lineHeight: 1, marginTop: u(-6) }}>
        <StrokeText stroke={u(8)}>Auto Throw</StrokeText>
      </span>
      <span className="relative" style={{ fontSize: u(32), lineHeight: 1, marginTop: u(2) }}>
        <StrokeText stroke={u(7)} fill={on ? '#5cff5c' : '#ff3b30'}>
          {on ? 'ON' : 'OFF'}
        </StrokeText>
      </span>
      {!owned && <Price amount={PRODUCTS.autoThrow.price} size={30} className="absolute" style={{ right: u(2), bottom: u(-10) }} />}
    </button>
  )
}

/** The tutorial line under Auto Throw, with a progress bar on the rebirth step. */
function TutorialBanner() {
  const step = useGame((s) => s.profile.tutorialStep)
  const inThrowArea = useGame((s) => s.zone.throwArea)
  const flying = useGame((s) => Boolean(s.flight))
  const progress = useGame((s) => rebirthProgress(s.profile))
  const maxed = useGame((s) => isMaxLevel(s.profile))

  const current = TUTORIAL[step]
  if (!current || flying) return null
  let text = current.text
  if (current.event === 'throw' && inThrowArea) text = 'Press on the Throw button'

  return (
    <div className="flex flex-col items-center" style={{ marginTop: u(14) }}>
      <div
        style={{
          padding: `${u(4)} ${u(22)}`,
          background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.32) 15%, rgba(0,0,0,0.32) 85%, rgba(0,0,0,0) 100%)',
          fontSize: u(46),
        }}
      >
        <StrokeText stroke={u(9)}>{text}</StrokeText>
      </div>
      {current.event === 'rebirth' && (
        <div
          className="relative overflow-hidden"
          style={{ width: u(770), height: u(36), border: `${u(3)} solid #111`, background: 'rgba(0,0,0,0.45)', marginTop: u(6) }}
        >
          <div className="absolute inset-y-0 left-0" style={{ width: `${progress * 100}%`, background: GRADIENTS.barFill }} />
          <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: u(20) }}>
            <StrokeText stroke={u(5)}>{maxed ? 'MAX LEVEL - REBIRTH!' : `${Math.floor(progress * 100)}% TO MAX LEVEL`}</StrokeText>
          </div>
        </div>
      )}
    </div>
  )
}

export function TopCenter() {
  return (
    <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ top: u(10) }}>
      <AutoThrowButton />
      <TutorialBanner />
    </div>
  )
}

export default TopCenter
