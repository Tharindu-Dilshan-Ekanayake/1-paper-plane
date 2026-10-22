/**
 * Lobby layout: every gameplay-relevant position and trigger area.
 *
 * Shared by the client (which renders it) and the server (which validates positions
 * against it), so the two can never disagree about where a lane or the throw area is.
 *
 * Units are roughly metres - the avatar is 1.8 tall. +X is east, -Z is north, which is
 * "forward" from spawn and the direction planes are thrown.
 *
 * Rects are `{ minX, maxX, minZ, maxZ }` on the ground plane.
 */

export const SPAWN = { x: 0, z: 12 }

/** The flat, walkable plaza. Hills surround it on every side but the throw road. */
export const PLAZA = { minX: -86, maxX: 62, minZ: -46, maxZ: 46 }

/** Track metre `m` is at world z = THROW_LINE_Z - m. */
export const THROW_LINE_Z = -28
export const TRACK_HALF_WIDTH = 9

/** Painted "THROW AREA": standing in it shows the THROW button. */
export const THROW_AREA = { minX: -7.5, maxX: 7.5, minZ: -28, maxZ: -19 }

/** Walkable ground as a union of rects; the controller clamps the player into it. */
export const WALKABLE = [PLAZA, { minX: -9, maxX: 9, minZ: -58, maxZ: -46 }]

// --- Training lanes -----------------------------------------------------------------

export const LANE_COUNT = 9
export const LANE_WIDTH = 6
export const LANE_PITCH = 7.6
/** Entrance edge (south) and target edge (north) of every lane floor. */
export const LANE_NEAR_Z = -22
export const LANE_FAR_Z = -40
/** Where the target board stands, just past the far edge. */
export const LANE_TARGET_Z = -42.4
export const LANE_FLOOR_HEIGHT = 0.15

export const laneCenterX = (index) => -17 - index * LANE_PITCH

export function laneRect(index) {
  const cx = laneCenterX(index)
  return {
    minX: cx - LANE_WIDTH / 2,
    maxX: cx + LANE_WIDTH / 2,
    minZ: LANE_FAR_Z,
    maxZ: LANE_NEAR_Z,
  }
}

// --- Plane hangar -------------------------------------------------------------------

/** Open on its west side, facing the plaza. */
export const HANGAR = { minX: 34, maxX: 58, minZ: -30, maxZ: 4, height: 11 }
/** Raised back tier holding planes 6-10. */
export const HANGAR_STEP = { minX: 45, maxX: 57.5, minZ: -29.5, maxZ: 3.5, height: 1 }
export const PAD_SIZE = 4

export const PLANE_PADS = Array.from({ length: 10 }, (_, i) => {
  const back = i >= 5
  return {
    index: i,
    x: back ? 51 : 39.5,
    z: -25 + (i % 5) * 6.5,
    y: back ? HANGAR_STEP.height : 0,
  }
})

export const padRect = (pad) => ({
  minX: pad.x - PAD_SIZE / 2,
  maxX: pad.x + PAD_SIZE / 2,
  minZ: pad.z - PAD_SIZE / 2,
  maxZ: pad.z + PAD_SIZE / 2,
})

// --- Eggs, showcases, boards --------------------------------------------------------

export const EGG_STANDS = [
  { eggId: 'basic', x: 12, z: 30 },
  { eggId: 'meadow', x: 21, z: 30 },
  { eggId: 'sunset', x: 30, z: 30 },
  { eggId: 'unicorn', x: 39, z: 30 },
  { eggId: 'demon', x: -12, z: -6, big: true },
]
export const EGG_TRIGGER_RADIUS = 4.4

/** Limited premium pet on display. */
export const SPHINX_STAND = { x: 52, z: 31 }

export const LEADERBOARDS = [
  { id: 'rebirths', x: 14, z: 43.5 },
  { id: 'playtime', x: 27, z: 43.5 },
  { id: 'power', x: 40, z: 43.5 },
]

export const PORTAL = { x: 22, z: -40, radius: 3.4 }
export const FREE_REWARD = { x: 17, z: 6, radius: 3 }
export const WATERFALL = { x: 44, z: -46 }

// --- Collision ----------------------------------------------------------------------

const box = (x, z, halfX, halfZ) => ({
  minX: x - halfX,
  maxX: x + halfX,
  minZ: z - halfZ,
  maxZ: z + halfZ,
})

/** Solid, never-changing obstacles. Locked lanes add their own walls at runtime. */
export const STATIC_COLLIDERS = [
  // Hangar walls (north, south, back). The west side is the open entrance.
  { minX: HANGAR.minX, maxX: HANGAR.maxX + 1, minZ: HANGAR.minZ - 1, maxZ: HANGAR.minZ },
  { minX: HANGAR.minX, maxX: HANGAR.maxX + 1, minZ: HANGAR.maxZ, maxZ: HANGAR.maxZ + 1 },
  { minX: HANGAR.maxX, maxX: HANGAR.maxX + 1, minZ: HANGAR.minZ, maxZ: HANGAR.maxZ },
  // Egg pedestals.
  ...EGG_STANDS.map((s) => box(s.x, s.z, s.big ? 2.1 : 1.6, s.big ? 2.1 : 1.6)),
  box(SPHINX_STAND.x, SPHINX_STAND.z, 3, 3),
  ...LEADERBOARDS.map((b) => box(b.x, b.z, 4.6, 0.5)),
  box(FREE_REWARD.x, FREE_REWARD.z, 1.4, 1.4),
  // The portal ring's base; the swirl itself is walk-through.
  box(PORTAL.x - PORTAL.radius, PORTAL.z, 0.6, 0.8),
  box(PORTAL.x + PORTAL.radius, PORTAL.z, 0.6, 0.8),
  // Target pedestals at the far end of each lane.
  ...Array.from({ length: LANE_COUNT }, (_, i) => box(laneCenterX(i), LANE_TARGET_Z, 1.6, 0.9)),
]

/** Raised floors the player stands on, as rects with a height. */
export const PLATFORMS = [
  { ...HANGAR_STEP },
  ...Array.from({ length: LANE_COUNT }, (_, i) => ({ ...laneRect(i), height: LANE_FLOOR_HEIGHT })),
]

// --- Helpers ------------------------------------------------------------------------

export const inRect = (r, x, z, margin = 0) =>
  x >= r.minX - margin && x <= r.maxX + margin && z >= r.minZ - margin && z <= r.maxZ + margin

/** Index of the lane whose floor contains (x, z), or -1. */
export function laneAt(x, z, margin = 0) {
  for (let i = 0; i < LANE_COUNT; i += 1) {
    if (inRect(laneRect(i), x, z, margin)) return i
  }
  return -1
}

export const inThrowArea = (x, z, margin = 0) => inRect(THROW_AREA, x, z, margin)

/** Index of the plane pad under (x, z), or -1. */
export function padAt(x, z) {
  for (const pad of PLANE_PADS) {
    if (inRect(padRect(pad), x, z)) return pad.index
  }
  return -1
}

/** The egg stand within reach of (x, z), or null. */
export function eggStandNear(x, z) {
  for (const stand of EGG_STANDS) {
    const reach = EGG_TRIGGER_RADIUS + (stand.big ? 1 : 0)
    if (Math.hypot(stand.x - x, stand.z - z) <= reach) return stand
  }
  return null
}

/** Height of the floor at (x, z): raised platforms, else the ground at 0. */
export function groundHeightAt(x, z) {
  let h = 0
  for (const p of PLATFORMS) {
    if (p.height > h && inRect(p, x, z)) h = p.height
  }
  return h
}

/** Clamps (x, z) into the walkable union, returning the nearest walkable point. */
export function clampToWalkable(x, z, out = { x: 0, z: 0 }) {
  let best = Infinity
  for (const r of WALKABLE) {
    const cx = Math.min(r.maxX, Math.max(r.minX, x))
    const cz = Math.min(r.maxZ, Math.max(r.minZ, z))
    const d = (cx - x) ** 2 + (cz - z) ** 2
    if (d < best) {
      best = d
      out.x = cx
      out.z = cz
      if (d === 0) break
    }
  }
  return out
}

/** Fastest a player can legitimately move, for the server's anti-teleport check. */
export const MAX_MOVE_SPEED = 14
