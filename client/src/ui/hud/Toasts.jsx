import { useGame } from '../../store/game'
import Icon from '../Icon'
import { u } from './style'

const KIND_STYLE = {
  info: { icon: null, accent: '#ffffff' },
  success: { icon: 'check', accent: '#7dff5a' },
  error: { icon: 'close', accent: '#ff6b6b' },
  badge: { icon: 'trophy', accent: '#ffd52a' },
}

/**
 * Small notifications in the bottom-right corner, in the style of the platform's own
 * system toasts ("Badge Awarded", purchase results, errors).
 */
export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none absolute flex flex-col items-end" style={{ right: u(16), bottom: u(24), gap: u(8) }}>
      {toasts.map((t) => {
        const kind = KIND_STYLE[t.kind] || KIND_STYLE.info
        return (
          <div
            key={t.id}
            className="pp-toast flex items-center text-white"
            style={{
              maxWidth: u(460),
              minWidth: u(260),
              gap: u(12),
              padding: `${u(12)} ${u(16)}`,
              borderRadius: u(10),
              background: 'rgba(28, 32, 38, 0.86)',
              borderLeft: `${u(6)} solid ${kind.accent}`,
              fontSize: u(22),
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
            }}
          >
            {kind.icon && <Icon name={kind.icon} size={u(34)} />}
            <span>{t.text}</span>
          </div>
        )
      })}
    </div>
  )
}

export default Toasts
