import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from 'three'

import { THROW_LINE_Z } from '@shared/world'

import { remotePlayers } from '../../net/remotePlayers'
import { getQuality } from '../../store/quality'
import { PAPER_PLANE } from '../geometry'
import { createGlowInstances, disposeGlow } from '../glow'
import { planeColor, planeGlow } from '../planes'
import { runtime } from '../runtime'
import { hideNameplatesFrom, NAMEPLATE_POOL_SIZE, placeNameplate } from './nameplates'

/** Remote players are drawn this far in the past, so 10 Hz updates interpolate. */
const INTERP_DELAY_MS = 110
const MAX_REMOTES = 8
const PARTS = 6
const MAX_GHOSTS = 8
const S = 0.36

/** Classic blocky figure, in studs-scaled units: [x, y(pivot), size, hangs from pivot]. */
const PART_LAYOUT = [
  { key: 'head', pos: [0, 1.62, 0], size: [1.2 * S, 1 * S, 1 * S] },
  { key: 'torso', pos: [0, 1.08, 0], size: [2 * S, 2 * S, 1 * S] },
  { key: 'armL', pos: [-1.5 * S, 1.44, 0], size: [1 * S, 2 * S, 1 * S], swing: -1 },
  { key: 'armR', pos: [1.5 * S, 1.44, 0], size: [1 * S, 2 * S, 1 * S], swing: 1 },
  { key: 'legL', pos: [-0.5 * S, 0.72, 0], size: [1 * S, 2 * S, 1 * S], swing: 1 },
  { key: 'legR', pos: [0.5 * S, 0.72, 0], size: [1 * S, 2 * S, 1 * S], swing: -1 },
]

// Parsed once: setColorAt runs for every limb of every player, every frame.
const palette = (list) => list.map((c) => new Color(c))
const SHIRTS = palette(['#e8423a', '#2f7fe6', '#3ccf4e', '#9b4dff', '#ff9a1f', '#1d1f26', '#ffffff', '#ff5fa8'])
const PANTS = palette(['#2d3a5c', '#1d1f26', '#4a3a2a', '#3a3a46', '#2f5aa8'])
const SKINS = palette(['#f5cd47', '#e8b48a', '#c98a5a', '#8a5a3a', '#ffd9b3'])

function hashString(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const _m = new Matrix4()
const _base = new Matrix4()
const _local = new Matrix4()
const _rot = new Matrix4()
const _scale = new Matrix4()
const _q = new Quaternion()
const _p = new Vector3()
const _s = new Vector3()
const _v = new Vector3()
const _up = new Vector3(0, 1, 0)
const _forward = new Vector3(0, 0, 1)
const _target = new Vector3()
const _dir = new Vector3()
const _prev = new Vector3()
const _color = new Color()

function lerpAngle(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

/** Interpolates a remote player to `renderTime`. */
function interpolate(r, renderTime) {
  const snaps = r.snaps
  if (snaps.length === 0) return
  let i = snaps.length - 1
  while (i > 0 && snaps[i - 1].t > renderTime) i -= 1
  const b = snaps[i]
  const a = snaps[Math.max(0, i - 1)]
  const span = b.t - a.t
  const t = span > 0 ? Math.min(1, Math.max(0, (renderTime - a.t) / span)) : 1
  _prev.copy(r.position)
  r.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t)
  r.yaw = lerpAngle(a.r, b.r, t)
  // Drop snapshots we've moved past, keeping one to interpolate from.
  while (snaps.length > 2 && snaps[1].t < renderTime) snaps.shift()
}

/**
 * Everyone else in the lobby: blocky avatars (one InstancedMesh for every limb of every
 * player), name tags, their pets (handed to the shared pet renderer) and ghost planes
 * replaying their throws. Hidden past the preset's draw distance.
 */
export function RemotePlayers() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const bodyRef = useRef(null)
  const ghostRef = useRef(null)
  const ghostGlowRef = useRef(null)

  const assets = useMemo(() => {
    // Same material settings as the other instanced planes/pads: one shared program.
    const body = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial({ side: DoubleSide, flatShading: true }), MAX_REMOTES * PARTS)
    body.setColorAt(0, _color.set('#ffffff'))
    body.count = 0
    body.frustumCulled = false
    body.castShadow = true
    const ghostMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0.7, side: DoubleSide, depthWrite: false })
    const ghosts = new InstancedMesh(PAPER_PLANE, ghostMaterial, MAX_GHOSTS)
    ghosts.setColorAt(0, _color.set('#ffffff'))
    ghosts.count = 0
    ghosts.frustumCulled = false
    return { body, ghosts, ghostGlows: createGlowInstances(MAX_GHOSTS, 0.6) }
  }, [])

  useEffect(
    () => () => {
      assets.body.geometry.dispose()
      assets.body.material.dispose()
      assets.body.dispose()
      assets.ghosts.material.dispose()
      assets.ghosts.dispose()
      disposeGlow(assets.ghostGlows)
      hideNameplatesFrom(0)
    },
    [assets],
  )

  useFrame((state, rawDelta) => {
    const body = bodyRef.current
    const ghosts = ghostRef.current
    const ghostGlows = ghostGlowRef.current
    if (!body || !ghosts || !ghostGlows) return
    const delta = Math.min(rawDelta, 0.05)
    const settings = getQuality()
    const now = performance.now()
    const renderTime = now - INTERP_DELAY_MS
    const t = state.clock.elapsedTime

    let instance = 0
    let plate = 0
    runtime.remotePets.length = 0

    for (const r of remotePlayers.values()) {
      interpolate(r, renderTime)
      const moved = _prev.distanceTo(r.position)
      r.speed = r.speed * 0.8 + (moved / Math.max(delta, 1e-3)) * 0.2
      const distance = camera.position.distanceTo(r.position)
      const visible = distance < settings.remoteDrawDistance && runtime.camera.mode === 'follow'
      r.shadow.visible = visible

      if (visible && instance + PARTS <= MAX_REMOTES * PARTS) {
        const h = hashString(r.sessionId)
        const shirt = SHIRTS[h % SHIRTS.length]
        const pants = PANTS[(h >>> 8) % PANTS.length]
        const skin = SKINS[(h >>> 16) % SKINS.length]
        const walking = r.speed > 0.6
        if (walking) r.walkPhase += delta * (6 + Math.min(r.speed, 10) * 0.5)
        const swing = walking ? Math.sin(r.walkPhase) * 0.9 : 0
        const throwing = r.anim === 'throw'

        _q.setFromAxisAngle(_up, r.yaw)
        _base.compose(r.position, _q, _s.set(1, 1, 1))
        for (const part of PART_LAYOUT) {
          const hangs = part.swing !== undefined
          let angle = hangs ? swing * part.swing : 0
          if (throwing && part.key === 'armR') angle = -2.2 + Math.sin(t * 18) * 0.6
          _local.makeTranslation(part.pos[0], part.pos[1], part.pos[2])
          _rot.makeRotationX(angle)
          _scale.makeScale(part.size[0], part.size[1], part.size[2])
          // Limbs hang from their pivot; head and torso are centred on theirs.
          if (hangs) _scale.setPosition(0, -part.size[1] / 2, 0)
          _m.copy(_base).multiply(_local).multiply(_rot).multiply(_scale)
          body.setMatrixAt(instance, _m)
          // Classic look: shirt on the torso, trousers on the legs, bare arms and head.
          body.setColorAt(instance, part.key === 'torso' ? shirt : part.key.startsWith('leg') ? pants : skin)
          instance += 1
        }
      }

      // Name tag.
      if (plate < NAMEPLATE_POOL_SIZE) {
        if (visible && distance < settings.remoteNameDistance) {
          _v.set(r.position.x, r.position.y + 2.25, r.position.z).project(camera)
          if (_v.z < 1) {
            const fade = Math.min(1, (settings.remoteNameDistance - distance) / 6)
            placeNameplate(plate, r.name, (_v.x * 0.5 + 0.5) * size.width, (-_v.y * 0.5 + 0.5) * size.height, fade)
          } else {
            placeNameplate(plate, '', null)
          }
        } else {
          placeNameplate(plate, '', null)
        }
        plate += 1
      }

      // Their pets: follow in formation, drawn by the shared pet renderer.
      if (visible) {
        const sin = Math.sin(r.yaw)
        const cos = Math.cos(r.yaw)
        for (let i = 0; i < r.petIds.length && i < r.pets.length; i += 1) {
          const pet = r.pets[i]
          pet.id = r.petIds[i]
          const sx = i === 0 ? -1.5 : i === 1 ? 1.5 : 0
          const sz = i === 2 ? -2.5 : -1.3
          _target.set(r.position.x - cos * sx + sin * sz, r.position.y, r.position.z + sin * sx + cos * sz)
          _dir.copy(pet.position)
          pet.position.lerp(_target, 1 - Math.exp(-6 * delta))
          const stepped = _dir.distanceTo(pet.position)
          if (stepped > 0.005) pet.yaw = Math.atan2(pet.position.x - _dir.x, pet.position.z - _dir.z)
          pet.hop = Math.abs(Math.sin(t * 7 + i)) * (stepped > 0.01 ? 0.35 : 0.08)
          runtime.remotePets.push(pet)
        }
      }
    }
    hideNameplatesFrom(plate)
    body.count = instance
    body.instanceMatrix.needsUpdate = true
    if (body.instanceColor) body.instanceColor.needsUpdate = true

    // --- Ghost planes -------------------------------------------------------------
    let g = 0
    for (let i = runtime.ghostThrows.length - 1; i >= 0; i -= 1) {
      const throwInfo = runtime.ghostThrows[i]
      const p = (now - throwInfo.startedAt) / 1000 / throwInfo.duration
      if (p >= 1) {
        runtime.ghostThrows.splice(i, 1)
        continue
      }
      if (g >= MAX_GHOSTS) continue
      const eased = 1 - Math.pow(1 - p, 2.4)
      const endZ = THROW_LINE_Z - throwInfo.distance
      const z = throwInfo.z + (endZ - throwInfo.z) * eased
      const y = 1.6 + 3.9 * (1 - Math.exp(-(throwInfo.z - z) / 9)) - 5 * Math.max(0, p - 0.86) / 0.14
      _p.set(throwInfo.x * (1 - Math.min(1, p * 4)), Math.max(0.35, y), z)
      _dir.set(0, 0, -1)
      _q.setFromUnitVectors(_forward, _dir)
      ghosts.setMatrixAt(g, _m.compose(_p, _q, _s.set(2.2, 2.2, 2.2)))
      ghosts.setColorAt(g, planeColor(throwInfo.planeId))
      ghostGlows.setMatrixAt(g, _m.compose(_p, _q, _s.setScalar(3.2 * settings.planeGlow)))
      ghostGlows.setColorAt(g, planeGlow(throwInfo.planeId))
      g += 1
    }
    ghosts.count = g
    ghostGlows.count = g
    ghosts.instanceMatrix.needsUpdate = true
    ghostGlows.instanceMatrix.needsUpdate = true
    if (ghosts.instanceColor) ghosts.instanceColor.needsUpdate = true
    if (ghostGlows.instanceColor) ghostGlows.instanceColor.needsUpdate = true
  })

  return (
    <>
      <primitive ref={bodyRef} object={assets.body} />
      <primitive ref={ghostRef} object={assets.ghosts} />
      <primitive ref={ghostGlowRef} object={assets.ghostGlows} />
    </>
  )
}

export default RemotePlayers
