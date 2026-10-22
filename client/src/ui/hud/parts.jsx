import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { GRADIENTS, u } from './style'

/** Red circular "!" attention badge. */
export function AlertBadge({ size = 44, style }) {
  return (
    <span
      className="pointer-events-none absolute flex items-center justify-center rounded-full"
      style={{
        width: u(size),
        height: u(size),
        background: 'radial-gradient(circle at 35% 30%, #ff7a7a, #ee1b2e 60%, #b80f1f)',
        border: `${u(3.5)} solid #fff`,
        boxShadow: `0 0 0 ${u(2.5)} #111`,
        fontSize: u(size * 0.62),
        ...style,
      }}
    >
      <StrokeText stroke={u(4)}>!</StrokeText>
    </span>
  )
}

/** Premium price: the Bux coin and the amount in green. */
export function Price({ amount, size = 34, className = '', style }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: u(4), fontSize: u(size), ...style }}>
      <Icon name="bux" size={u(size * 1.15)} />
      <StrokeText stroke={u(size * 0.22)} gradient={GRADIENTS.priceGreen}>
        {amount}
      </StrokeText>
    </span>
  )
}

/**
 * The game's standard chunky button: gradient face, black border, drop and a press
 * squish. Children are laid out centred.
 */
export function ChunkyButton({ onClick, gradient = GRADIENTS.goldButton, className = '', style, children, disabled, title, radius = 12, border = 4 }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`pp-btn pointer-events-auto relative flex items-center justify-center ${className}`}
      style={{
        background: gradient,
        borderRadius: u(radius),
        border: `${u(border)} solid #111`,
        boxShadow: `0 ${u(5)} 0 rgba(0,0,0,0.45), inset 0 ${u(4)} 0 rgba(255,255,255,0.45), inset 0 -${u(5)} 0 rgba(0,0,0,0.18)`,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
