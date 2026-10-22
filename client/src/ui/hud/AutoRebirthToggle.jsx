import { actions } from '../../net/actions'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import { u } from './style'

/**
 * The little rebirth switch above the level bar: when on, the server rebirths you the
 * moment you hit max level, so you can stay in a lane and keep climbing.
 */
export function AutoRebirthToggle() {
  const on = useGame((s) => Boolean(s.profile.settings.autoRebirth))
  const visible = useGame((s) => s.profile.stats.trains > 0)
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => actions.setSetting('autoRebirth', !on)}
      title={on ? 'Auto Rebirth: ON' : 'Auto Rebirth: OFF'}
      aria-pressed={on}
      className="pp-btn pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center"
      style={{ bottom: u(200), gap: u(4) }}
    >
      <Icon name="rebirth" size={u(48)} />
      <span
        className="relative block"
        style={{
          width: u(92),
          height: u(40),
          borderRadius: u(8),
          border: `${u(3)} solid #111`,
          background: on ? 'linear-gradient(180deg,#7dff5a,#2fbf2f)' : 'linear-gradient(180deg,#ff7a6b,#d8243a)',
        }}
      >
        <span
          className="absolute transition-[left] duration-150"
          style={{
            top: u(3),
            left: on ? u(48) : u(4),
            width: u(34),
            height: u(28),
            borderRadius: u(5),
            background: '#ffe9c9',
            boxShadow: `inset 0 -${u(3)} 0 rgba(0,0,0,0.15)`,
          }}
        />
      </span>
    </button>
  )
}

export default AutoRebirthToggle
