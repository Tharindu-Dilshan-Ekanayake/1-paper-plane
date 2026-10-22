import { LANES, PRODUCTS } from '@shared/balance'
import { LANE_TARGET_Z, laneCenterX } from '@shared/world'

import { LANE_THEMES } from '../world/structures'

/**
 * Text styles, as gradients top-to-bottom, matching the reference signage.
 */
export const TEXT = {
  gold: ['#fffaa8', '#ffd52a', '#ff9c00'],
  green: ['#e6ffb0', '#8dff4f', '#2fd12f'],
  price: ['#d9ff9a', '#7dff4a', '#2fd12f'],
  white: ['#ffffff', '#ffffff', '#dfe7f0'],
  red: ['#ffb0a8', '#ff4a3b', '#d4142a'],
  blue: ['#e0faff', '#7fe2ff', '#2fa8ff'],
}

const tint = (hex) => ['#ffffff', hex, hex]

/** "FREE / x1 Power", "1 Rebirth / x2 Power", "VERY OP! / 45 / x30 Power"... */
export function laneLabelSpec(index) {
  const lane = LANES[index]
  const theme = LANE_THEMES[index]
  const lines = []
  if (lane.product) {
    lines.push({ text: lane.tag, size: 50, rainbow: true })
    lines.push({ text: String(PRODUCTS[lane.product].price), size: 44, icon: 'bux', gradient: TEXT.price })
  } else if (lane.rebirths === 0) {
    lines.push({ text: 'FREE', size: 50, gradient: TEXT.green })
  } else {
    const word = lane.rebirths === 1 ? 'Rebirth' : 'Rebirths'
    lines.push({ text: `${lane.rebirths} ${word}`, size: 46, icon: 'rebirth', gradient: tint(theme.text) })
  }
  lines.push({ text: `x${lane.mult} Power`, size: 50, icon: 'muscle', gradient: TEXT.gold })
  return { lines, pxPerUnit: 50 }
}

export function laneLabels() {
  return LANES.map((lane, i) => ({
    id: `lane-${i}`,
    position: [laneCenterX(i), lane.product ? 7.9 : 7.0, LANE_TARGET_Z],
    spec: laneLabelSpec(i),
    fade: 150,
  }))
}

/** Every static label in the lobby. Areas add theirs as their phases land. */
export function lobbyLabels() {
  return [...laneLabels()]
}
