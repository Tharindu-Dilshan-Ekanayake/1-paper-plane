import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, InstancedMesh, Matrix4, MeshLambertMaterial, Quaternion, Vector3 } from 'three'

import { formatNumber } from '@shared/format'

import { sfx } from '../../audio/sfx'
import { getGame } from '../../store/game'
import { getQuality } from '../../store/quality'
import { iconUrl } from '../../ui/icons'
import { PAPER_PLANE } from '../geometry'
import { createGlowInstances, disposeGlow } from '../glow'
import { planeColor, planeGlow } from '../planes'
import { runtime } from '../runtime'
import { targetPoint } from '../world/targets'
import { drainTrainFx } from './fxQueue'
import { spawnPopup, updatePopups } from './popups'

const MAX_SHOTS = 8
/** Wind-up before the plane leaves the hand. */
const RELEASE_DELAY = 0.12
const FLIGHT_TIME = 0.42
const ARC_HEIGHT = 0.9
/** How long the throw swing lasts; Player and the avatar read this. */
export const THROW_ANIM = 0.35

const _m = new Matrix4()
const _q = new Quaternion()
const _p = new Vector3()
const _prev = new Vector3()
const _dir = new Vector3()
const _s = new Vector3(0.7, 0.7, 0.7)
const _forward = new Vector3(0, 0, 1)
const _popupAt = new Vector3()
const _glowScale = new Vector3()

const LEVEL_GRADIENT = 'linear-gradient(180deg, #e0faff 0%, #7fe2ff 45%, #2fa8ff 100%)'

/**
 * Training feedback: the character's throw, the plane flying into the target, and the
 * "+N POWER" popup when it hits. Shots come from a fixed pool in one InstancedMesh.
 */
export function TrainingFX() {
  const size = useThree((s) => s.size)
  const meshRef = useRef(null)
  const glowRef = useRef(null)
  const shots = useRef(
    Array.from({ length: MAX_SHOTS }, () => ({
      active: false,
      t: 0,
      gain: 0,
      leveledUp: false,
      from: new Vector3(),
      to: new Vector3(),
    })),
  )

  const mesh = useMemo(() => {
    const material = new MeshLambertMaterial({ side: DoubleSide, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.2 })
    const instanced = new InstancedMesh(PAPER_PLANE, material, MAX_SHOTS)
    // Create the colour buffer up front so the first shot doesn't trigger a recompile.
    instanced.setColorAt(0, planeColor('paper'))
    instanced.count = 0
    instanced.frustumCulled = false
    return instanced
  }, [])

  const glow = useMemo(() => createGlowInstances(MAX_SHOTS), [])

  useEffect(
    () => () => {
      mesh.material.dispose()
      mesh.dispose()
      disposeGlow(glow)
    },
    [mesh, glow],
  )

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const instanced = meshRef.current
    const halos = glowRef.current
    if (!instanced || !halos) return
    const player = runtime.player

    drainTrainFx((event) => {
      player.throwTimer = THROW_ANIM
      const shot = shots.current.find((s) => !s.active) || shots.current[0]
      shot.to.fromArray(targetPoint(event.lane))
      // Face the target while training, unless walking somewhere.
      if (player.speed < 0.5) player.yaw = Math.atan2(shot.to.x - player.position.x, shot.to.z - player.position.z)
      shot.active = true
      shot.t = 0
      shot.gain = event.gain
      shot.leveledUp = event.leveledUp
      const side = 0.45
      shot.from.set(
        player.position.x - Math.cos(player.yaw) * side,
        player.position.y + 1.55,
        player.position.z + Math.sin(player.yaw) * side,
      )
    })

    const planeId = getGame().profile.equippedPlane
    const color = planeColor(planeId)
    const glowColor = planeGlow(planeId)
    const glowSize = 1.5 * getQuality().planeGlow
    let count = 0
    for (const shot of shots.current) {
      if (!shot.active) continue
      shot.t += delta
      const flight = (shot.t - RELEASE_DELAY) / FLIGHT_TIME
      if (flight < 0) continue
      if (flight >= 1) {
        shot.active = false
        _popupAt.set(
          player.position.x + (Math.random() - 0.5) * 3,
          player.position.y + 0.6 + Math.random() * 1.4,
          player.position.z + (Math.random() - 0.5) * 1.5,
        )
        spawnPopup(`+${formatNumber(shot.gain)} POWER`, _popupAt, { iconUrl: iconUrl('muscle') })
        sfx.power()
        if (shot.leveledUp) {
          _popupAt.set(player.position.x, player.position.y + 2.6, player.position.z)
          spawnPopup('LEVEL UP!', _popupAt, { gradient: LEVEL_GRADIENT, scale: 1.5, life: 1600 })
        }
        continue
      }
      const arc = Math.sin(flight * Math.PI) * ARC_HEIGHT
      _prev.lerpVectors(shot.from, shot.to, Math.max(0, flight - 0.05))
      _prev.y += Math.sin(Math.max(0, flight - 0.05) * Math.PI) * ARC_HEIGHT
      _p.lerpVectors(shot.from, shot.to, flight)
      _p.y += arc
      _dir.subVectors(_p, _prev).normalize()
      _q.setFromUnitVectors(_forward, _dir)
      instanced.setMatrixAt(count, _m.compose(_p, _q, _s))
      instanced.setColorAt(count, color)
      halos.setMatrixAt(count, _m.compose(_p, _q, _glowScale.setScalar(glowSize)))
      halos.setColorAt(count, glowColor)
      count += 1
    }
    instanced.count = count
    halos.count = count
    instanced.instanceMatrix.needsUpdate = true
    halos.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
    if (halos.instanceColor) halos.instanceColor.needsUpdate = true

    updatePopups(state.camera, size.width, size.height)
  })

  return (
    <>
      <primitive ref={glowRef} object={glow} />
      <primitive ref={meshRef} object={mesh} />
    </>
  )
}

export default TrainingFX
