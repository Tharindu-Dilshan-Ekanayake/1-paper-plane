import {
  HANGAR,
  HANGAR_STEP,
  LANE_COUNT,
  LANE_FAR_X,
  LANE_FLOOR_HEIGHT,
  LANE_NEAR_X,
  LANE_TARGET_X,
  LANE_WIDTH,
  laneCenterZ,
} from '@shared/world'

import { STYLE } from '../materials'
import { PALETTE } from '../sceneStyle'

/**
 * Static lobby structures, added as plain boxes to the world's shared BlockSet so they
 * render in the same single draw call as the hills.
 */

/** Per-lane look, in lane order (matches LANES in shared/balance.js). */
export const LANE_THEMES = [
  { floor: '#5d626e', edge: '#f4f6f9', style: STYLE.PLATE, text: '#ffffff' },
  { floor: '#1d9a2b', edge: '#82f540', style: STYLE.PLATE, text: '#8dff4f' },
  { floor: '#1f57e0', edge: '#46cbff', style: STYLE.PLATE, text: '#5fd6ff' },
  { floor: '#6b31d8', edge: '#b17cff', style: STYLE.PLATE, text: '#c69bff' },
  { floor: '#e5bf18', edge: '#fff16c', style: STYLE.PLATE, text: '#ffe45c' },
  { floor: '#ff7a1c', edge: '#ffa646', style: STYLE.LAVA, text: '#ff9a3c' },
  { floor: '#ff2b2b', edge: '#ff5c5c', style: STYLE.LAVA, text: '#ff5a5a' },
  { floor: '#ffffff', edge: '#ffffff', style: STYLE.RAINBOW, text: '#ffffff' },
  { floor: '#1b2266', edge: '#8a63ff', style: STYLE.GALAXY, text: '#a98bff' },
]

const EDGE = 0.6

/** Lane floors with raised rims, and the target pedestals at their west ends. */
export function buildLanes(blocks) {
  const length = LANE_NEAR_X - LANE_FAR_X
  const midX = (LANE_NEAR_X + LANE_FAR_X) / 2

  for (let i = 0; i < LANE_COUNT; i += 1) {
    const theme = LANE_THEMES[i]
    const cz = laneCenterZ(i)
    const h = LANE_FLOOR_HEIGHT

    blocks.addOn(midX, -0.1, cz, length - EDGE * 2, h + 0.1, LANE_WIDTH - EDGE * 2, theme.floor, theme.style)

    // Raised rim on all four sides.
    const rimH = h + 0.15
    const rimStyle = theme.style === STYLE.RAINBOW ? STYLE.RAINBOW : STYLE.STUDS
    blocks.addOn(midX, -0.1, cz - LANE_WIDTH / 2 + EDGE / 2, length, rimH, EDGE, theme.edge, rimStyle)
    blocks.addOn(midX, -0.1, cz + LANE_WIDTH / 2 - EDGE / 2, length, rimH, EDGE, theme.edge, rimStyle)
    blocks.addOn(LANE_NEAR_X - EDGE / 2, -0.1, cz, EDGE, rimH, LANE_WIDTH - EDGE * 2, theme.edge, rimStyle)
    blocks.addOn(LANE_FAR_X + EDGE / 2, -0.1, cz, EDGE, rimH, LANE_WIDTH - EDGE * 2, theme.edge, rimStyle)

    // Target pedestal; the board itself is a prop.
    blocks.addOn(LANE_TARGET_X, 0, cz, 1.8, 0.8, 3.2, theme.edge, rimStyle)
    blocks.addOn(LANE_TARGET_X, 0.8, cz, 1.2, 0.4, 2.4, theme.floor, theme.style === STYLE.PLATE ? STYLE.STUDS : theme.style)
  }
}

/**
 * The plane hangar: a white studded half-tube open to the west, with a blue frame
 * around the mouth, a stepped back wall and a raised back tier.
 */
export function buildHangar(blocks) {
  const midZ = (HANGAR.minZ + HANGAR.maxZ) / 2
  const radiusZ = (HANGAR.maxZ - HANGAR.minZ) / 2
  const radiusY = HANGAR.height
  const depth = HANGAR.maxX - HANGAR.minX
  const midX = (HANGAR.minX + HANGAR.maxX) / 2
  const segments = 16

  const point = (t) => ({
    z: midZ + Math.cos(t) * radiusZ,
    y: Math.sin(t) * radiusY,
  })

  for (let s = 0; s < segments; s += 1) {
    const a = point((s / segments) * Math.PI)
    const b = point(((s + 1) / segments) * Math.PI)
    const dz = b.z - a.z
    const dy = b.y - a.y
    const length = Math.hypot(dz, dy) + 0.25
    const tilt = -Math.atan2(dy, dz)
    const cz = (a.z + b.z) / 2
    const cy = (a.y + b.y) / 2

    // Shell.
    blocks.add(midX, cy, cz, depth, 0.8, length, PALETTE.white, STYLE.STUDS, 0, tilt)
    // Blue frame around the mouth, a little proud of the shell.
    blocks.add(HANGAR.minX - 0.2, cy, cz, 1.4, 1.6, length, '#2f7fe6', STYLE.STUDS, 0, tilt)
    // Light-blue stripe along the inside, like the reference's trim line.
    if (s === 3 || s === segments - 4) {
      blocks.add(midX, cy, cz, depth, 0.85, length * 0.6, '#3f8cf0', STYLE.SMOOTH, 0, tilt)
    }
  }

  // Back wall, stepped to fill the half-ellipse.
  for (let y = 0; y < radiusY; y += 1) {
    const t = Math.min(1, (y + 0.5) / radiusY)
    const width = 2 * radiusZ * Math.sqrt(Math.max(0, 1 - t * t))
    blocks.addOn(HANGAR.maxX + 0.5, y, midZ, 1, 1, width, '#dbe8f6')
  }

  // Raised tier for the back row, navy-fronted like the reference.
  const step = HANGAR_STEP
  blocks.addOn(
    (step.minX + step.maxX) / 2,
    -0.1,
    (step.minZ + step.maxZ) / 2,
    step.maxX - step.minX,
    step.height + 0.1,
    step.maxZ - step.minZ,
    '#e9f1fa',
  )
  blocks.addOn(step.minX + 0.3, -0.1, (step.minZ + step.maxZ) / 2, 0.6, step.height + 0.12, step.maxZ - step.minZ, '#1f3c96')
  // Navy display band along the back wall.
  blocks.addOn(HANGAR.maxX - 0.2, step.height, midZ, 0.4, 2.2, radiusZ * 1.6, '#1f3c96')
}
