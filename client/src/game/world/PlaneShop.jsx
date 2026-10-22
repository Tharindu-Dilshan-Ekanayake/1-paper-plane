import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, InstancedMesh, Matrix4, MeshLambertMaterial, Quaternion, Vector3 } from 'three'

import { PLANES } from '@shared/balance'
import { PAD_SIZE, PLANE_PADS } from '@shared/world'

import { useGame } from '../../store/game'
import { getQuality } from '../../store/quality'
import { BlockSet, disposeBlocks } from '../blocks'
import { PAPER_PLANE, PLANE_TRIM } from '../geometry'
import { createGlowInstances, disposeGlow } from '../glow'
import { padLabelSpec, padState } from '../labels/lobbyLabels'
import { updateWorldLabel } from '../labels/registry'
import { sharedMaterials, STYLE } from '../materials'
import { PLANE_STYLES, planeGlow } from '../planes'

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
const _s = new Vector3(2.4, 2.4, 2.4)
const _up = new Vector3(0, 1, 0)
const _glow = new Vector3()

/**
 * The hangar's ten pads and the planes hovering over them. Pads recolour and their
 * labels rewrite as you buy and equip; the planes spin slowly. Three draw calls: pads,
 * plane bodies, plane trims.
 */
export function PlaneShop() {
  const owned = useGame((s) => s.profile.ownedPlanes)
  const equipped = useGame((s) => s.profile.equippedPlane)
  const padsRef = useRef(null)
  const bodiesRef = useRef(null)
  const trimsRef = useRef(null)
  const glowRef = useRef(null)

  const assets = useMemo(() => {
    const set = new BlockSet()
    for (const pad of PLANE_PADS) {
      set.addOn(pad.x, pad.y - 0.1, pad.z, PAD_SIZE - 0.4, 0.3, PAD_SIZE - 0.4, '#ffffff', STYLE.STUDS)
    }
    const pads = set.build(sharedMaterials().blocks)

    const bodyMaterial = new MeshLambertMaterial({ side: DoubleSide, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.15 })
    const trimMaterial = new MeshLambertMaterial({ side: DoubleSide, flatShading: true })
    const bodies = new InstancedMesh(PAPER_PLANE, bodyMaterial, PLANES.length)
    const trims = new InstancedMesh(PLANE_TRIM, trimMaterial, PLANES.length)
    const color = new Color()
    PLANES.forEach((plane, i) => {
      const style = PLANE_STYLES[plane.id]
      bodies.setColorAt(i, color.set(style.color))
      trims.setColorAt(i, color.set(style.trim))
    })
    for (const mesh of [bodies, trims]) {
      mesh.frustumCulled = false
      mesh.instanceColor.needsUpdate = true
    }
    // Each display plane glows in its own colour.
    const glows = createGlowInstances(PLANES.length, 0.8)
    PLANES.forEach((plane, i) => glows.setColorAt(i, planeGlow(plane.id)))
    glows.count = PLANES.length
    glows.instanceColor.needsUpdate = true
    return { pads, bodies, trims, glows, bodyMaterial, trimMaterial }
  }, [])

  useEffect(
    () => () => {
      disposeBlocks(assets.pads)
      assets.bodyMaterial.dispose()
      assets.trimMaterial.dispose()
      assets.bodies.dispose()
      assets.trims.dispose()
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
    const bodies = bodiesRef.current
    const trims = trimsRef.current
    const glows = glowRef.current
    if (!bodies || !trims || !glows) return
    const t = state.clock.elapsedTime
    const glowSize = 4.2 * getQuality().planeGlow
    for (const pad of PLANE_PADS) {
      _p.set(pad.x, pad.y + 3.1 + Math.sin(t * 1.6 + pad.index) * 0.18, pad.z)
      _q.setFromAxisAngle(_up, t * 0.6 + pad.index * 0.7)
      _m.compose(_p, _q, _s)
      bodies.setMatrixAt(pad.index, _m)
      trims.setMatrixAt(pad.index, _m)
      glows.setMatrixAt(pad.index, _m.compose(_p, _q, _glow.setScalar(glowSize)))
    }
    bodies.instanceMatrix.needsUpdate = true
    trims.instanceMatrix.needsUpdate = true
    glows.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <primitive ref={padsRef} object={assets.pads} />
      <primitive ref={bodiesRef} object={assets.bodies} />
      <primitive ref={trimsRef} object={assets.trims} />
      <primitive ref={glowRef} object={assets.glows} />
    </>
  )
}

export default PlaneShop
