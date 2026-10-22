import { Color } from 'three'

/**
 * Plane looks, by plane id (stats live in shared/balance.js). `color` tints the paper,
 * `trim` is the wing stripes and hangar decorations, `glow` the halo every plane of
 * that kind carries - each plane has its own.
 */
export const PLANE_STYLES = {
  paper: { color: '#ffffff', trim: '#cfdcec', glow: '#9fe8ff' },
  sky: { color: '#9fdcff', trim: '#2f9bff', glow: '#4fc3ff' },
  newspaper: { color: '#d8d2c2', trim: '#6b6b6b', glow: '#fff3c4' },
  cardboard: { color: '#c99357', trim: '#8a5a2b', glow: '#ffb347' },
  racer: { color: '#ff4040', trim: '#ffffff', glow: '#ff5a3b' },
  ocean: { color: '#2f7fe6', trim: '#7fe2ff', glow: '#2fa8ff' },
  jungle: { color: '#3ccf4e', trim: '#1c7a2a', glow: '#5cff6a' },
  royal: { color: '#9b4dff', trim: '#ffd52a', glow: '#c77dff' },
  crystal: { color: '#8ff4ff', trim: '#ffffff', glow: '#7ff6ff' },
  golden: { color: '#ffcc1f', trim: '#ff8a00', glow: '#ffd21f' },
}

// Parsed once here, so frame code can look colours up without allocating.
const parse = (key) =>
  Object.fromEntries(Object.entries(PLANE_STYLES).map(([id, s]) => [id, new Color(s[key])]))
const COLORS = parse('color')
const TRIMS = parse('trim')
const GLOWS = parse('glow')

export function planeColor(id) {
  return COLORS[id] || COLORS.paper
}

export function planeTrim(id) {
  return TRIMS[id] || TRIMS.paper
}

export function planeGlow(id) {
  return GLOWS[id] || GLOWS.paper
}
