import { useState } from 'react'

import { isMuted, setMuted } from '../../audio/sfx'
import { useGame } from '../../store/game'
import { detectQuality, QUALITY_LEVELS, useQuality } from '../../store/quality'
import StrokeText from '../StrokeText'
import { ChunkyButton } from '../hud/parts'
import { GRADIENTS, u } from '../hud/style'
import Panel from './Panel'

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between" style={{ gap: u(12) }}>
      <span style={{ fontSize: u(38) }}>
        <StrokeText stroke={u(7)}>{label}</StrokeText>
      </span>
      <div className="flex flex-wrap" style={{ gap: u(10) }}>
        {children}
      </div>
    </div>
  )
}

function Choice({ active, onClick, children }) {
  return (
    <ChunkyButton gradient={active ? GRADIENTS.greenButton : GRADIENTS.greyButton} onClick={onClick} style={{ height: u(70), minWidth: u(140), padding: `0 ${u(18)}` }}>
      <span style={{ fontSize: u(30) }}>
        <StrokeText stroke={u(6)}>{children}</StrokeText>
      </span>
    </ChunkyButton>
  )
}

/** Graphics quality and sound. */
export function SettingsPanel() {
  const level = useQuality((s) => s.level)
  const manual = useQuality((s) => s.manual)
  const setLevel = useQuality((s) => s.setLevel)
  const toast = useGame((s) => s.toast)
  const [muted, setMutedState] = useState(isMuted)

  const pickAuto = () => {
    try {
      localStorage.removeItem('pp.quality')
    } catch {
      // ignore
    }
    setLevel(detectQuality(), false)
    useQuality.setState({ manual: false })
    toast('Graphics set to Auto', 'success')
  }

  return (
    <Panel title="SETTINGS" width={860}>
      <div className="flex flex-col" style={{ gap: u(22) }}>
        <Row label="Graphics">
          <Choice active={!manual} onClick={pickAuto}>
            Auto
          </Choice>
          {QUALITY_LEVELS.map((q) => (
            <Choice key={q} active={manual && level === q} onClick={() => setLevel(q)}>
              {q[0] + q.slice(1).toLowerCase()}
            </Choice>
          ))}
        </Row>
        <p className="m-0" style={{ fontSize: u(24) }}>
          <StrokeText stroke={u(5)} fill="#b8d4ff">
            Now running: {level}. Auto lowers quality by itself if the game gets slow.
          </StrokeText>
        </p>
        <Row label="Sound">
          <Choice
            active={!muted}
            onClick={() => {
              setMuted(false)
              setMutedState(false)
            }}
          >
            On
          </Choice>
          <Choice
            active={muted}
            onClick={() => {
              setMuted(true)
              setMutedState(true)
            }}
          >
            Off
          </Choice>
        </Row>
        <p className="m-0" style={{ fontSize: u(22) }}>
          <StrokeText stroke={u(5)} fill="#c8c8c8">
            Move: WASD / joystick · Jump: Space · Throw / Buy / Hatch: E · Camera: drag · Zoom: wheel / pinch
          </StrokeText>
        </p>
      </div>
    </Panel>
  )
}

export default SettingsPanel
