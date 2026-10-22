import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
} from 'three'

/**
 * Shared geometry factories. Anything used by more than one mesh is created once at
 * module level and reused; factories here are for the one-off merges.
 */

/** A flat disc facing +Z (a cylinder turned on its side). */
export function disc(radius, depth = 0.1, segments = 32) {
  const g = new CylinderGeometry(radius, radius, depth, segments)
  g.rotateX(Math.PI / 2)
  return g
}

/** An n-pointed star facing +Z, extruded `depth`. */
export function star(points, outer, inner, depth = 0.25) {
  const shape = new Shape()
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 })
  g.translate(0, 0, -depth / 2)
  return g
}

/** Builds a non-indexed, flat-shaded geometry from a list of triangles. */
function trianglesToGeometry(tris) {
  const positions = new Float32Array(tris.length * 9)
  tris.forEach((tri, i) => tri.forEach((v, k) => positions.set(v, i * 9 + k * 3)))
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(positions, 3))
  g.computeVertexNormals()
  return g
}

// The dart's key points, nose along +Z, about 1 unit long.
const NOSE = [0, 0, 0.55]
const SPINE = [0, 0.03, -0.5]
const KEEL = [0, -0.17, -0.44]
/** Fold line on each wing, and the wing tips with their upturned winglets. */
const fold = (side) => [side * 0.15, 0.05, -0.5]
const tip = (side) => [side * 0.4, 0.11, -0.5]
const tipFront = (side) => [side * 0.36, 0.1, -0.2]
const winglet = (side) => [side * 0.43, 0.27, -0.5]

/**
 * The classic folded dart: each wing in two panels either side of a crease, upturned
 * winglets at the tips, and the folded keel underneath. 8 triangles, drawn
 * double-sided by its materials (it's paper).
 */
export function createPaperPlaneGeometry() {
  const tris = []
  for (const side of [-1, 1]) {
    tris.push([NOSE, SPINE, fold(side)])
    tris.push([NOSE, fold(side), tip(side)])
    tris.push([tipFront(side), tip(side), winglet(side)])
  }
  tris.push([NOSE, SPINE, KEEL], [NOSE, KEEL, SPINE])
  return trianglesToGeometry(tris)
}

/**
 * Coloured stripes along the outer wing panels, drawn on top of the plane in its trim
 * colour, so planes differ by more than tint.
 */
export function createPlaneTrimGeometry() {
  const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
  const lift = (v) => [v[0], v[1] + 0.012, v[2]]
  const tris = []
  for (const side of [-1, 1]) {
    const a = lerp(NOSE, fold(side), 0.55)
    const b = lerp(NOSE, tip(side), 0.55)
    const c = lerp(NOSE, tip(side), 0.72)
    const d = lerp(NOSE, fold(side), 0.72)
    tris.push([lift(a), lift(b), lift(c)], [lift(a), lift(c), lift(d)])
    // Winglets in the trim colour too, nudged outward off the near-vertical face.
    const out = (v) => [v[0] + side * 0.012, v[1], v[2]]
    tris.push([out(tipFront(side)), out(tip(side)), out(winglet(side))])
  }
  return trianglesToGeometry(tris)
}

/** Shared instances, for every paper plane in the game. */
export const PAPER_PLANE = createPaperPlaneGeometry()
export const PLANE_TRIM = createPlaneTrimGeometry()
