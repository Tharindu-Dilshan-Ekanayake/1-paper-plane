import { LANES, PLANES, PRODUCTS } from '@shared/balance'
import { formatNumber } from '@shared/format'
import { LANE_TARGET_Z, laneCenterX, PLANE_PADS } from '@shared/world'

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

/** Ownership state of each hangar pad: 'equipped' | 'owned' | 'buy' | 'locked'. */
export function padState(profile, index) {
  const plane = PLANES[index]
  if (profile.equippedPlane === plane.id) return 'equipped'
  if (profile.ownedPlanes.includes(plane.id)) return 'owned'
  const previous = PLANES[index - 1]
  return !previous || profile.ownedPlanes.includes(previous.id) ? 'buy' : 'locked'
}

/** "+5 / Power" over "28 Wins", "OWNED" or "EQUIPPED". */
export function padLabelSpec(index, state) {
  const plane = PLANES[index]
  const status =
    state === 'equipped'
      ? { text: 'EQUIPPED', size: 40, gradient: TEXT.gold }
      : state === 'owned'
        ? { text: 'OWNED', size: 40, gradient: TEXT.green }
        : { text: `${formatNumber(plane.cost)} Wins`, size: 40, icon: 'trophy', gradient: state === 'locked' ? TEXT.red : TEXT.gold }
  return {
    lines: [{ text: `+${formatNumber(plane.power)} / Power`, size: 38, icon: 'plane', fill: '#ffffff' }, status],
    pxPerUnit: 70,
  }
}

/** Largest a pad label can get, so its atlas slot fits every state. */
const padReserve = (index) => ({
  lines: [
    { text: `+${formatNumber(PLANES[index].power)} / Power`, size: 38, icon: 'plane' },
    { text: `${formatNumber(PLANES[index].cost)} Wins`, size: 40, icon: 'trophy' },
  ],
})

export function padLabels(profile) {
  return PLANE_PADS.map((pad) => ({
    id: `pad-${pad.index}`,
    // Back-row labels ride higher so they clear the front row seen from the entrance.
    position: [pad.x, pad.y + (pad.y > 0 ? 6.4 : 4.6), pad.z],
    spec: padLabelSpec(pad.index, padState(profile, pad.index)),
    reserve: padReserve(pad.index),
    fade: 70,
  }))
}

/** Every label in the lobby. Areas add theirs as their phases land. */
export function lobbyLabels(profile) {
  return [...laneLabels(), ...padLabels(profile)]
}
