import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, InstancedMesh, Matrix4, MeshLambertMaterial, Quaternion, Vector3 } from 'three'

import { formatNumber } from '@shared/format'

import { getGame } from '../../store/game'
import { iconUrl } from '../../ui/icons'
import { PAPER_PLANE } from '../geometry'
import { planeColor } from '../planes'
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

const LEVEL_GRADIENT = 'linear-gradient(180deg, #e0faff 0%, #7fe2ff 45%, #2fa8ff 100%)'

/**
 * Training feedback: the character's throw, the plane flying into the target, and the
 * "+N POWER" popup when it hits. Shots come from a fixed pool in one InstancedMesh.
 */
export function TrainingFX() {
  const size = useThree((s) => s.size)
  const meshRef = useRef(null)
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
    const material = new MeshLambertMaterial({ side: DoubleSide, flatShading: true })
    const instanced = new InstancedMesh(PAPER_PLANE, material, MAX_SHOTS)
    // Create the colour buffer up front so the first shot doesn't trigger a recompile.
    instanced.setColorAt(0, planeColor('paper'))
    instanced.count = 0
    instanced.frustumCulled = false
    return instanced
  }, [])

  useEffect(
    () => () => {
      mesh.material.dispose()
      mesh.dispose()
    },
    [mesh],
  )

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const instanced = meshRef.current
    if (!instanced) return
    const player = runtime.player

    drainTrainFx((event) => {
      player.throwTimer = THROW_ANIM
      // Face the target while training, unless walking somewhere.
      if (player.speed < 0.5) player.yaw = Math.PI
      const shot = shots.current.find((s) => !s.active) || shots.current[0]
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
      shot.to.fromArray(targetPoint(event.lane))
    })

    const color = planeColor(getGame().profile.equippedPlane)
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
      count += 1
    }
    instanced.count = count
    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true

    updatePopups(state.camera, size.width, size.height)
  })

  return <primitive ref={meshRef} object={mesh} />
}

export default TrainingFX
