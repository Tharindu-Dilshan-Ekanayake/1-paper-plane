import {
  BufferAttribute,
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearMipmapLinearFilter,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three'

import {
  FREE_REWARD,
  HANGAR,
  LANE_FAR_Z,
  laneCenterX,
  LANE_COUNT,
  LANE_NEAR_Z,
  LANE_WIDTH,
  PLAZA,
  PORTAL,
  THROW_AREA,
  THROW_LINE_Z,
  TRACK_HALF_WIDTH,
} from '@shared/world'

import { PALETTE } from '../sceneStyle'

/**
 * The plaza floor: one big plane whose colours come from a tiny "ground map" texture
 * painted at one texel per world unit. Paths, aprons and pads are rectangles painted
 * into it, so their edges always fall on the stud-tile seams, and the whole floor is a
 * single draw call regardless of how many painted regions it has.
 */

const MAP = { minX: -100, maxX: 80, minZ: -60, maxZ: 60 }
const MAP_W = MAP.maxX - MAP.minX
const MAP_H = MAP.maxZ - MAP.minZ

/** Where the ground plane ends to the north: the track's own floor takes over there. */
export const GROUND_NORTH_EDGE = -58

function painter(ctx) {
  const rect = (r, color) => {
    ctx.fillStyle = color
    ctx.fillRect(
      Math.round(r.minX - MAP.minX),
      Math.round(r.minZ - MAP.minZ),
      Math.round(r.maxX - r.minX),
      Math.round(r.maxZ - r.minZ),
    )
  }
  const bordered = (r, fill, edge) => {
    rect(r, edge)
    rect({ minX: r.minX + 1, maxX: r.maxX - 1, minZ: r.minZ + 1, maxZ: r.maxZ - 1 }, fill)
  }
  const disc = (x, z, radius, color) => {
    ctx.fillStyle = color
    for (let dz = -radius; dz < radius; dz += 1) {
      for (let dx = -radius; dx < radius; dx += 1) {
        if ((dx + 0.5) ** 2 + (dz + 0.5) ** 2 <= radius * radius) {
          ctx.fillRect(Math.floor(x + dx - MAP.minX), Math.floor(z + dz - MAP.minZ), 1, 1)
        }
      }
    }
  }
  return { rect, bordered, disc }
}

export function createGroundMap(maxTexture) {
  const canvas = document.createElement('canvas')
  canvas.width = MAP_W
  canvas.height = MAP_H
  const ctx = canvas.getContext('2d')
  const { rect, bordered, disc } = painter(ctx)

  rect(MAP, PALETTE.plaza)

  // Lane apron, behind the lane floors.
  const lanesMinX = laneCenterX(LANE_COUNT - 1) - LANE_WIDTH / 2 - 3
  const lanesMaxX = laneCenterX(0) + LANE_WIDTH / 2 + 3
  bordered(
    { minX: lanesMinX, maxX: lanesMaxX, minZ: PLAZA.minZ, maxZ: LANE_NEAR_Z + 3 },
    PALETTE.apron,
    PALETTE.apronEdge,
  )

  // Paths: spawn square, north to the throw area, west along the lanes, east to the
  // hangar, south-east to the eggs, and a spur to the portal.
  const paths = [
    { minX: -5, maxX: 5, minZ: THROW_AREA.maxZ, maxZ: 18 },
    { minX: lanesMinX, maxX: -4, minZ: LANE_NEAR_Z + 3, maxZ: LANE_NEAR_Z + 8 },
    { minX: 4, maxX: HANGAR.minX + 1, minZ: -15, maxZ: -9 },
    { minX: 7, maxX: 56, minZ: 12, maxZ: 17 },
    { minX: 19, maxX: 25, minZ: PORTAL.z + 3, maxZ: -14 },
  ]
  for (const p of paths) bordered(p, PALETTE.path, PALETTE.pathEdge)
  // Paths overlap; repaint the interiors so crossings don't show edges.
  for (const p of paths) {
    rect({ minX: p.minX + 1, maxX: p.maxX - 1, minZ: p.minZ + 1, maxZ: p.maxZ - 1 }, PALETTE.path)
  }
  bordered({ minX: -9, maxX: 9, minZ: 5, maxZ: 21 }, PALETTE.path, PALETTE.pathEdge)

  // Egg plaza and the hangar floor.
  bordered({ minX: 6, maxX: 59, minZ: 22, maxZ: 40 }, PALETTE.apron, PALETTE.apronEdge)
  rect({ minX: HANGAR.minX, maxX: HANGAR.maxX, minZ: HANGAR.minZ, maxZ: HANGAR.maxZ }, PALETTE.hangarFloor)

  disc(PORTAL.x, PORTAL.z, 6, PALETTE.apronEdge)
  disc(PORTAL.x, PORTAL.z, 5, PALETTE.apron)
  disc(FREE_REWARD.x, FREE_REWARD.z, 4, PALETTE.apronEdge)

  // The throw area, then the first stretch of lawn and pavement down the track.
  bordered(THROW_AREA, PALETTE.path, PALETTE.pathEdge)
  rect({ minX: -TRACK_HALF_WIDTH, maxX: TRACK_HALF_WIDTH, minZ: MAP.minZ, maxZ: THROW_LINE_Z }, PALETTE.sidewalk)
  rect({ minX: -TRACK_HALF_WIDTH + 2, maxX: TRACK_HALF_WIDTH - 2, minZ: MAP.minZ, maxZ: THROW_LINE_Z }, PALETTE.lawn)

  // Waterfall pool at the foot of the north cliff.
  rect({ minX: 38, maxX: 50, minZ: LANE_FAR_Z - 6, maxZ: LANE_FAR_Z - 1 }, PALETTE.water)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = maxTexture > 512 ? 4 : 1
  return texture
}

/**
 * The ground plane, with UVs computed from world position so the map lands exactly
 * on the world grid. Outside the map, clamp-to-edge repeats the plaza colour.
 */
export function createGroundGeometry() {
  const minX = -280
  const maxX = 280
  const minZ = GROUND_NORTH_EDGE
  const maxZ = 280
  const geometry = new PlaneGeometry(maxX - minX, maxZ - minZ)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate((minX + maxX) / 2, 0, (minZ + maxZ) / 2)

  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    uv.setXY(i, (x - MAP.minX) / MAP_W, 1 - (z - MAP.minZ) / MAP_H)
  }
  uv.needsUpdate = true
  geometry.setAttribute('aStyle', new BufferAttribute(new Float32Array(position.count), 1))
  return geometry
}
