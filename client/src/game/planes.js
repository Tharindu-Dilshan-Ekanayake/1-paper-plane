import { Color } from 'three'

/**
 * Plane looks, by plane id (stats live in shared/balance.js). `color` tints the paper,
 * `trim` is used for the hangar pad decorations and icons.
 */
export const PLANE_STYLES = {
  paper: { color: '#ffffff', trim: '#cfdcec' },
  sky: { color: '#9fdcff', trim: '#2f9bff' },
  newspaper: { color: '#d8d2c2', trim: '#6b6b6b' },
  cardboard: { color: '#c99357', trim: '#8a5a2b' },
  racer: { color: '#ff4040', trim: '#ffffff' },
  ocean: { color: '#2f7fe6', trim: '#7fe2ff' },
  jungle: { color: '#3ccf4e', trim: '#1c7a2a' },
  royal: { color: '#9b4dff', trim: '#ffd52a' },
  crystal: { color: '#8ff4ff', trim: '#ffffff' },
  golden: { color: '#ffcc1f', trim: '#ff8a00' },
}

const colorCache = {}
export function planeColor(id) {
  if (!colorCache[id]) colorCache[id] = new Color((PLANE_STYLES[id] || PLANE_STYLES.paper).color)
  return colorCache[id]
}
