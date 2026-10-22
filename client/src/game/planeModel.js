import { DoubleSide, Group, Mesh, MeshLambertMaterial } from 'three'

import { PAPER_PLANE, PLANE_TRIM } from './geometry'
import { createGlow, disposeGlow } from './glow'
import { planeColor, planeGlow, planeTrim } from './planes'

/** How strongly a plane's own paper glows in its glow colour. */
const SELF_GLOW = 0.35

/**
 * One paper plane: the folded body, its trim stripes and a soft halo in the plane's
 * own glow colour. `setPlane(id)` restyles it; `dispose()` frees its materials (the
 * geometries are shared).
 *
 * @param {{ glowSize?: number, glowIntensity?: number }} options halo diameter relative
 *   to the plane's length, and brightness
 */
export function createPlaneModel({ glowSize = 1.7, glowIntensity = 0.9 } = {}) {
  const bodyMaterial = new MeshLambertMaterial({ side: DoubleSide, flatShading: true })
  const trimMaterial = new MeshLambertMaterial({ side: DoubleSide, flatShading: true })
  const body = new Mesh(PAPER_PLANE, bodyMaterial)
  const trim = new Mesh(PLANE_TRIM, trimMaterial)
  body.castShadow = true
  const glow = createGlow('#9fe8ff', glowIntensity)
  glow.scale.setScalar(glowSize)

  const group = new Group()
  group.add(glow, body, trim)
  let current = null

  group.setPlane = (id) => {
    if (id === current) return
    current = id
    bodyMaterial.color.copy(planeColor(id))
    bodyMaterial.emissive.copy(planeGlow(id)).multiplyScalar(SELF_GLOW)
    trimMaterial.color.copy(planeTrim(id))
    trimMaterial.emissive.copy(planeGlow(id)).multiplyScalar(SELF_GLOW * 0.6)
    glow.material.uniforms.uColor.value.copy(planeGlow(id))
  }

  /** Halo size multiplier, e.g. from the quality preset. */
  group.setGlowSize = (size) => glow.scale.setScalar(size)

  group.dispose = () => {
    bodyMaterial.dispose()
    trimMaterial.dispose()
    disposeGlow(glow)
  }

  group.setPlane('paper')
  return group
}
