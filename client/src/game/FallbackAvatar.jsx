import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'

import { createBoxInstances, disposeBlocks } from './blocks'
import { sharedMaterials, STYLE } from './materials'

/** Classic 5-stud figure scaled to the 1.8-unit player: one stud = S world units. */
const S = 0.36

/**
 * Parts as [pivot x, pivot y, width, height, depth, colour, swing]: limbs hang from
 * their pivot and swing by `swing` times the walk cycle; head and torso are centred.
 */
const PARTS = [
  [0, 4.5, 1.2, 1, 1, '#f5cd47', null],
  [0, 3, 2, 2, 1, '#1c1f26', null],
  [-1.5, 4, 1, 2, 1, '#f5cd47', -1],
  [1.5, 4, 1, 2, 1, '#f5cd47', 'throw'],
  [-0.5, 2, 1, 2, 1, '#2d3a5c', 1],
  [0.5, 2, 1, 2, 1, '#2d3a5c', -1],
].map(([x, y, w, h, d, color, swing]) => ({ x: x * S, y: y * S, w: w * S, h: h * S, d: d * S, color: new Color(color), swing }))

const _m = new Matrix4()
const _pivot = new Matrix4()
const _rot = new Matrix4()
const _q = new Quaternion()
const _e = new Euler()
const _p = new Vector3()
const _s = new Vector3()

/**
 * A classic blocky character, shown while the Bloxity avatar downloads (and instead of
 * it if it can't load), so the player is never invisible. Six boxes in one instanced
 * draw call through the shared toy material - no extra shader program.
 *
 * @param {{ motionRef: React.MutableRefObject<object>, onReady?: () => void }} props
 */
export function FallbackAvatar({ motionRef, onReady }) {
  const ref = useRef(null)
  const mesh = useMemo(() => {
    const m = createBoxInstances(PARTS.length, sharedMaterials().toy, STYLE.SMOOTH)
    PARTS.forEach((part, i) => m.setColorAt(i, part.color))
    m.count = PARTS.length
    m.castShadow = true
    return m
  }, [])

  useEffect(() => () => disposeBlocks(mesh), [mesh])

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useFrame(() => {
    const instanced = ref.current
    if (!instanced) return
    const m = motionRef.current
    const ratio = Math.min(1, m.speed / Math.max(m.maxSpeed, 0.001))
    const swing = Math.sin(m.time * (6 + ratio * 5)) * 0.9 * ratio
    PARTS.forEach((part, i) => {
      let angle = 0
      if (part.swing === 'throw') {
        // Throw: wind back then snap forward over the throw timer.
        angle = m.throwT > 0 ? -2.6 + (1 - m.throwT / 0.35) * 3.2 : swing
      } else if (part.swing !== null) {
        angle = swing * part.swing
      }
      const hangs = part.swing !== null
      _pivot.makeTranslation(part.x, part.y, 0)
      _rot.makeRotationFromQuaternion(_q.setFromEuler(_e.set(angle, 0, 0)))
      _p.set(0, hangs ? -part.h / 2 : 0, 0)
      _s.set(part.w, part.h, part.d)
      _m.compose(_p, _q.identity(), _s)
      instanced.setMatrixAt(i, _pivot.multiply(_rot).multiply(_m))
    })
    instanced.instanceMatrix.needsUpdate = true
  })

  return <primitive ref={ref} object={mesh} />
}

export default FallbackAvatar
