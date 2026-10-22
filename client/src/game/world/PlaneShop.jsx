import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Matrix4, Quaternion, Vector3 } from 'three'

import { PLANES } from '@shared/balance'
import { PAD_SIZE, PLANE_PADS } from '@shared/world'

import { useGame } from '../../store/game'
import { getQuality } from '../../store/quality'
import { BlockSet, disposeBlocks } from '../blocks'
import { createFrisbeeMesh, disposeFrisbeeMesh, frisbeeGlow, frisbeeOrientation } from '../frisbee'
import { createGlowInstances, disposeGlow } from '../glow'
import { padLabelSpec, padState } from '../labels/lobbyLabels'
import { updateWorldLabel } from '../labels/registry'
import { sharedMaterials, STYLE } from '../materials'

/** Pad colours by state, as in the reference: green owned, yellow equipped, red not. */
const PAD_COLORS = {
  equipped: new Color('#ffd21f'),
  owned: new Color('#3fdc4a'),
  buy: new Color('#ff3b3b'),
  locked: new Color('#b0262b'),
}

const _m = new Matrix4()
const _q = new Quaternion()
const _p = new Vector3()
const _s = new Vector3(2.2, 2.2, 2.2)
const _glow = new Vector3()

/**
 * The frisbee shop: ten pads with a frisbee hovering over each. Pads recolour and their
 * labels rewrite as you buy and equip; the frisbees spin slowly. Three draw calls:
 * pads, frisbees, halos.
 */
export function PlaneShop() {
  const owned = useGame((s) => s.profile.ownedPlanes)
  const equipped = useGame((s) => s.profile.equippedPlane)
  const padsRef = useRef(null)
  const discsRef = useRef(null)
  const glowRef = useRef(null)

  const assets = useMemo(() => {
    const set = new BlockSet()
    for (const pad of PLANE_PADS) {
      set.addOn(pad.x, pad.y - 0.1, pad.z, PAD_SIZE - 0.4, 0.3, PAD_SIZE - 0.4, '#ffffff', STYLE.STUDS)
    }
    const pads = set.build(sharedMaterials().blocks)

    // All ten frisbees, each in its own design, in one draw call.
    const discs = createFrisbeeMesh(PLANES.length)
    PLANES.forEach((frisbee, i) => discs.setStyle(i, frisbee.id))
    discs.count = PLANES.length
    // Each one glows in its own colour.
    const glows = createGlowInstances(PLANES.length, 0.8)
    PLANES.forEach((frisbee, i) => glows.setColorAt(i, frisbeeGlow(frisbee.id)))
    glows.count = PLANES.length
    glows.instanceColor.needsUpdate = true
    return { pads, discs, glows }
  }, [])

  useEffect(
    () => () => {
      disposeBlocks(assets.pads)
      disposeFrisbeeMesh(assets.discs)
      disposeGlow(assets.glows)
    },
    [assets],
  )

  // Recolour pads and rewrite their labels whenever ownership changes.
  useEffect(() => {
    const pads = padsRef.current
    const profile = { ownedPlanes: owned, equippedPlane: equipped }
    for (const pad of PLANE_PADS) {
      const state = padState(profile, pad.index)
      pads?.setColorAt(pad.index, PAD_COLORS[state])
      updateWorldLabel(`pad-${pad.index}`, padLabelSpec(pad.index, state))
    }
    if (pads?.instanceColor) pads.instanceColor.needsUpdate = true
  }, [owned, equipped])

  useFrame((state) => {
    const discs = discsRef.current
    const glows = glowRef.current
    if (!discs || !glows) return
    const t = state.clock.elapsedTime
    const glowSize = 3.6 * getQuality().frisbeeGlow
    for (const pad of PLANE_PADS) {
      _p.set(pad.x, pad.y + 2.6 + Math.sin(t * 1.6 + pad.index) * 0.18, pad.z)
      // Stood up on edge facing the shop entrance (west) so the design shows, slowly
      // spinning about its own axis and rocking a little.
      frisbeeOrientation(_q, t * 0.8 + pad.index * 0.7, Math.sin(t + pad.index) * 0.12, 1.15)
      discs.setMatrixAt(pad.index, _m.compose(_p, _q, _s))
      glows.setMatrixAt(pad.index, _m.compose(_p, _q, _glow.setScalar(glowSize)))
    }
    discs.instanceMatrix.needsUpdate = true
    glows.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <primitive ref={padsRef} object={assets.pads} />
      <primitive ref={discsRef} object={assets.discs} />
      <primitive ref={glowRef} object={assets.glows} />
    </>
  )
}

export default PlaneShop
