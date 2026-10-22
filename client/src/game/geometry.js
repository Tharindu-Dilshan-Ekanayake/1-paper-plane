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

/**
 * The classic dart paper plane, nose along +Z, about 1 unit long. Two wings with a
 * slight dihedral and a folded keel underneath. Non-indexed, flat normals, and drawn
 * double-sided by its materials (it's paper).
 */
export function createPaperPlaneGeometry() {
  const nose = [0, 0, 0.5]
  const tailTop = [0, 0.02, -0.5]
  const keel = [0, -0.14, -0.42]
  const leftTip = [-0.36, 0.09, -0.5]
  const rightTip = [0.36, 0.09, -0.5]
  const tris = [
    // Wings.
    [nose, leftTip, tailTop],
    [nose, tailTop, rightTip],
    // Keel fold, both sides.
    [nose, tailTop, keel],
    [nose, keel, tailTop],
  ]
  const positions = new Float32Array(tris.length * 9)
  tris.forEach((tri, i) => tri.forEach((v, k) => positions.set(v, i * 9 + k * 3)))
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(positions, 3))
  g.computeVertexNormals()
  return g
}

/** Shared instance, for every paper plane in the game. */
export const PAPER_PLANE = createPaperPlaneGeometry()
