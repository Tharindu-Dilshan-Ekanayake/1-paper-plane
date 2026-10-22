import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Points,
  PointsMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three'

import { TROPHY_FIRST, TROPHY_SPACING, ZONES } from '@shared/balance'
import { formatNumber } from '@shared/format'
import { trophyValue, winsMultiplier, zoneIndexAt } from '@shared/logic'
import { mulberry32 } from '@shared/rng'
import { THROW_LINE_Z } from '@shared/world'

import { sfx } from '../../audio/sfx'
import { getGame } from '../../store/game'
import { getQuality, useQuality } from '../../store/quality'
import { iconUrl } from '../../ui/icons'
import { disposeBlocks, PropBuilder } from '../blocks'
import { spawnPopup } from '../fx/popups'
import { PAPER_PLANE } from '../geometry'
import { LabelBatch } from '../labels/LabelBatch'
import { createToyMaterial, sharedMaterials, STYLE } from '../materials'
import { planeColor } from '../planes'
import { runtime } from '../runtime'
import { FOG, SKY } from '../sceneStyle'
import { skyUniforms } from '../skyState'
import { flight } from './flightControl'
import { writeDistance } from './hudLink'
import { buildChunk, CHUNK, GATES, ZONE_THEMES, zAt } from './track'

/** Chunks kept behind the focus point, and how many may be built per frame. */
const BEHIND = 60
const MAX_BUILDS_PER_FRAME = 2
/** Chunks never thrown away: the stretch visible from the lobby. */
const PINNED_CHUNKS = 3
const CACHE_LIMIT = 14
const CRUISE_HEIGHT = 5.5
const MAX_TROPHIES = 16
const STREAKS = 36

const _m = new Matrix4()
const _q = new Quaternion()
const _p = new Vector3()
const _s = new Vector3()
const _v = new Vector3()
const _look = new Vector3()
const _forward = new Vector3(0, 0, 1)
const _dir = new Vector3()
const _prevPlane = new Vector3()
/** Stable vector for runtime.flightFocus (the scratch ones are reused mid-frame). */
const planeFocus = new Vector3()
const _skyTop = new Color()
const _skyHorizon = new Color()

const ZONE_SKIES = ZONES.map((z) => ZONE_THEMES[z.id].sky.map((c) => new Color(c)))
const DEFAULT_TOP = new Color(SKY.top)
const DEFAULT_HORIZON = new Color(SKY.horizon)

const ease = (t) => 1 - Math.pow(1 - t, 2.4)
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function createTrophyGeometry() {
  const p = new PropBuilder()
  const gold = '#ffcc1f'
  p.add(new CylinderGeometry(0.42, 0.24, 0.62, 12), { position: [0, 0.55, 0], color: gold, style: STYLE.GLOW })
  p.add(new TorusGeometry(0.2, 0.06, 6, 10, Math.PI), { position: [-0.42, 0.62, 0], rotation: [0, 0, Math.PI / 2], color: gold })
  p.add(new TorusGeometry(0.2, 0.06, 6, 10, Math.PI), { position: [0.42, 0.62, 0], rotation: [0, 0, -Math.PI / 2], color: gold })
  p.add(new CylinderGeometry(0.08, 0.08, 0.3, 6), { position: [0, 0.12, 0], color: gold })
  p.box(0, -0.05, 0, 0.5, 0.14, 0.5, '#ffb01e', STYLE.SMOOTH)
  return p.build()
}

/** Where the plane is at normalised time `t` (0-1) of the current flight. */
function planePosition(t, start, out) {
  const end = zAt(flight.distance)
  const s = ease(t)
  const z = start.z + (end - start.z) * s
  const travelled = start.z - z
  const rise = 1 - Math.exp(-travelled / 9)
  const landing = smoothstep(0.86, 1, t)
  const cruise = start.y + (CRUISE_HEIGHT - start.y) * rise + Math.sin(t * 9) * 0.3 * (1 - landing)
  const y = cruise + (0.35 - cruise) * landing
  const x = start.x * (1 - smoothstep(0, 0.25, t)) + Math.sin(travelled * 0.015) * 1.4 * (1 - landing)
  return out.set(x, y, z)
}

/**
 * Lazily loaded: the track, the flying plane and its chase camera. While nobody is
 * flying it still streams the first stretch of track, which is the street you see
 * leading out of the lobby.
 */
export default function Flight() {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const groupRef = useRef(null)
  const planeRef = useRef(null)
  const trophyRef = useRef(null)
  const streakRef = useRef(null)
  const starsRef = useRef(null)
  const cache = useRef(new Map())
  const flightStart = useRef(new Vector3())
  const startedFor = useRef(0)
  const collected = useRef(new Set())
  const wasActive = useRef(false)
  const streaks = useRef(null)
  const gatesRef = useRef(null)
  const speedLines = useQuality((s) => s.settings.speedLines)
  const particles = useQuality((s) => s.settings.particles)

  const assets = useMemo(() => {
    const trophyMaterial = createToyMaterial({ instanced: true, vertexColors: true })
    const trophies = new InstancedMesh(createTrophyGeometry(), trophyMaterial, MAX_TROPHIES)
    trophies.count = 0
    trophies.frustumCulled = false

    const planeMaterial = new MeshLambertMaterial({ side: DoubleSide, flatShading: true })

    const streakMaterial = new MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
    const streakMesh = new InstancedMesh(new BoxGeometry(0.035, 0.035, 1), streakMaterial, STREAKS)
    streakMesh.frustumCulled = false
    streakMesh.count = 0

    const rand = mulberry32(99)
    const starPositions = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i += 1) {
      _v.set(rand() * 2 - 1, rand() * 1.2 - 0.2, rand() * 2 - 1).normalize().multiplyScalar(140)
      starPositions.set([_v.x, _v.y, _v.z], i * 3)
    }
    const starGeometry = new BufferGeometry()
    starGeometry.setAttribute('position', new BufferAttribute(starPositions, 3))
    const stars = new Points(starGeometry, new PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }))
    stars.frustumCulled = false
    stars.visible = false

    return { trophies, trophyMaterial, planeMaterial, streakMesh, streakMaterial, stars }
  }, [])

  // Zone names over the gate arches: their own small label batch.
  useEffect(() => {
    const batch = new LabelBatch({ pageSize: Math.min(512, getQuality().maxTexture) })
    for (const g of GATES) {
      batch.add(`gate-${g.zone.id}`, [0, 16.4, zAt(g.meter)], { lines: [{ text: g.zone.name, size: 64, fill: '#ffffff' }], pxPerUnit: 26 }, { fade: 400 })
    }
    let cancelled = false
    batch.build().then((meshes) => {
      if (cancelled || !gatesRef.current) return
      for (const mesh of meshes) gatesRef.current.add(mesh)
    })
    return () => {
      cancelled = true
      batch.dispose()
    }
  }, [])

  useEffect(() => {
    const group = groupRef.current
    return () => {
      // The chunk meshes are exactly the track group's children.
      for (const mesh of [...(group?.children ?? [])]) disposeBlocks(mesh)
      assets.trophies.geometry.dispose()
      assets.trophyMaterial.dispose()
      assets.trophies.dispose()
      assets.planeMaterial.dispose()
      assets.streakMesh.geometry.dispose()
      assets.streakMaterial.dispose()
      assets.streakMesh.dispose()
      assets.stars.geometry.dispose()
      assets.stars.material.dispose()
      skyUniforms.topColor.value.copy(DEFAULT_TOP)
      skyUniforms.horizonColor.value.copy(DEFAULT_HORIZON)
    }
  }, [assets])

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const group = groupRef.current
    if (!group) return
    const settings = getQuality()
    const now = performance.now()

    // --- Plane --------------------------------------------------------------------
    let focus = Math.max(0, THROW_LINE_Z - runtime.player.position.z)
    let speed = 0
    const plane = planeRef.current
    if (flight.active) {
      if (startedFor.current !== flight.startedAt) {
        startedFor.current = flight.startedAt
        const p = runtime.player.position
        flightStart.current.set(p.x - Math.cos(runtime.player.yaw) * 0.45, p.y + 1.6, p.z)
        collected.current.clear()
        _prevPlane.copy(flightStart.current)
      }
      // Hold for the wind-up before the plane leaves the hand.
      const t = Math.min(1, Math.max(0, (now - flight.startedAt) / 1000 - 0.12) / flight.duration)
      planePosition(t, flightStart.current, _p)
      flight.meter = Math.max(0, Math.min(flight.distance, THROW_LINE_Z - _p.z))
      focus = flight.meter
      speed = _prevPlane.distanceTo(_p) / Math.max(delta, 1e-3)
      _dir.subVectors(_p, _prevPlane)
      if (_dir.lengthSq() > 1e-6) _q.setFromUnitVectors(_forward, _dir.normalize())
      _prevPlane.copy(_p)
      if (plane) {
        plane.visible = true
        plane.position.copy(_p)
        plane.quaternion.copy(_q)
        plane.rotateZ(Math.sin(now * 0.004) * 0.25 * (1 - t))
        plane.material.color.copy(planeColor(getGame().profile.equippedPlane))
      }
      runtime.flightFocus = planeFocus.copy(_p)
      writeDistance(flight.meter)

      // Chase camera: behind and above, looking down the track. Locked to the plane
      // along the track (at warp speed any lag leaves it hundreds of metres behind);
      // eased sideways and vertically so the bobbing stays smooth.
      if (runtime.camera.mode === 'flight') {
        const k = 1 - Math.exp(-6 * delta)
        camera.position.set(
          camera.position.x + (_p.x * 0.6 - camera.position.x) * k,
          camera.position.y + (_p.y + 2.3 - camera.position.y) * k,
          _p.z + 7.5,
        )
        _look.set(_p.x * 0.8, _p.y + 0.3, _p.z - 12)
        camera.lookAt(_look)
      }
    } else if (plane) {
      plane.visible = false
    }
    if (wasActive.current && !flight.active) {
      skyUniforms.topColor.value.copy(DEFAULT_TOP)
      skyUniforms.horizonColor.value.copy(DEFAULT_HORIZON)
      if (scene.fog) scene.fog.color.set(FOG.color)
    }
    wasActive.current = flight.active

    // --- Track chunks -------------------------------------------------------------
    const ahead = settings.viewDistance
    const first = Math.max(0, Math.floor((focus - BEHIND) / CHUNK))
    const last = Math.floor((focus + ahead) / CHUNK)
    const chunks = cache.current
    // Fewer props when screaming past at hundreds of metres a second.
    const density = settings.decorDensity * (speed > 300 ? 0.35 : speed > 120 ? 0.65 : 1)
    let built = 0
    for (let i = first; i <= last && built < MAX_BUILDS_PER_FRAME; i += 1) {
      if (chunks.has(i)) continue
      const mesh = buildChunk(i, { density }).build(sharedMaterials().blocks)
      mesh.receiveShadow = settings.shadows === 'realtime'
      chunks.set(i, mesh)
      group.add(mesh)
      built += 1
    }
    for (const [i, mesh] of chunks) {
      const inWindow = i >= first && i <= last
      mesh.visible = inWindow
      if (!inWindow && i >= PINNED_CHUNKS && chunks.size > CACHE_LIMIT) {
        group.remove(mesh)
        disposeBlocks(mesh)
        chunks.delete(i)
      }
    }

    // --- Trophies -----------------------------------------------------------------
    if (flight.active) {
      // Pop the ones just flown through. The Wins were granted with the throw; this
      // is the visual receipt.
      const multiplier = winsMultiplier(getGame().profile, Date.now())
      for (const m of flight.trophies) {
        if (m > flight.meter) break
        if (collected.current.has(m)) continue
        collected.current.add(m)
        spawnPopup(`+${formatNumber(Math.round(trophyValue(m) * multiplier))}`, { x: _prevPlane.x, y: _prevPlane.y + 1, z: _prevPlane.z - 2 }, { iconUrl: iconUrl('trophy'), scale: 1.2 })
        sfx.trophy()
      }
    }
    const trophies = trophyRef.current
    if (trophies) {
      const spin = now * 0.003
      let count = 0
      const k0 = Math.max(0, Math.ceil((focus - 10 - TROPHY_FIRST) / TROPHY_SPACING))
      for (let m = TROPHY_FIRST + k0 * TROPHY_SPACING; m < focus + ahead * 0.8 && count < MAX_TROPHIES; m += TROPHY_SPACING) {
        if (flight.active && m <= flight.meter) continue
        const height = flight.active ? CRUISE_HEIGHT : 1.8
        _p.set(Math.sin(m * 0.5) * 2.5, height + Math.sin(spin + m) * 0.25, zAt(m))
        _q.setFromAxisAngle(_v.set(0, 1, 0), spin + m)
        _s.setScalar(1.5)
        trophies.setMatrixAt(count, _m.compose(_p, _q, _s))
        count += 1
      }
      trophies.count = count
      trophies.instanceMatrix.needsUpdate = true
    }

    // --- Sky tint by zone ---------------------------------------------------------
    if (flight.active) {
      const zi = zoneIndexAt(flight.meter)
      const blend = smoothstep(ZONES[zi].start, ZONES[zi].start + 80, flight.meter)
      const prev = ZONE_SKIES[Math.max(0, zi - 1)]
      const cur = ZONE_SKIES[zi]
      _skyTop.copy(prev[0]).lerp(cur[0], zi === 0 ? 1 : blend)
      _skyHorizon.copy(prev[1]).lerp(cur[1], zi === 0 ? 1 : blend)
      skyUniforms.topColor.value.copy(_skyTop)
      skyUniforms.horizonColor.value.copy(_skyHorizon)
      if (scene.fog) scene.fog.color.copy(_skyHorizon)

      const stars = starsRef.current
      if (stars && particles) {
        const spaceBlend = zi === ZONES.length - 1 ? blend : 0
        stars.visible = spaceBlend > 0.01
        stars.material.opacity = spaceBlend
        stars.position.copy(camera.position)
      }
    } else if (starsRef.current) {
      starsRef.current.visible = false
    }

    // --- Speed lines --------------------------------------------------------------
    const lines = streakRef.current
    if (lines) {
      const active = flight.active && speedLines && speed > 25
      if (!active) {
        lines.count = 0
      } else {
        if (!streaks.current) {
          const r = mulberry32(5)
          streaks.current = Array.from({ length: STREAKS }, () => ({ a: r() * Math.PI * 2, r: 1.6 + r() * 3.2, z: -r() * 30 }))
        }
        const travel = Math.min(speed, 400) * delta * 0.6
        lines.count = STREAKS
        for (let i = 0; i < STREAKS; i += 1) {
          const st = streaks.current[i]
          st.z += travel
          if (st.z > 4) st.z -= 34
          _v.set(Math.cos(st.a) * st.r, Math.sin(st.a) * st.r * 0.7, st.z - 4)
          _v.applyQuaternion(camera.quaternion).add(camera.position)
          _q.copy(camera.quaternion)
          _s.set(1, 1, 2 + Math.min(speed, 400) * 0.02)
          lines.setMatrixAt(i, _m.compose(_v, _q, _s))
        }
        lines.instanceMatrix.needsUpdate = true
      }
    }
  })

  return (
    <group>
      <group ref={groupRef} />
      <group ref={gatesRef} />
      <mesh ref={planeRef} geometry={PAPER_PLANE} material={assets.planeMaterial} scale={2} visible={false} castShadow />
      <primitive ref={trophyRef} object={assets.trophies} />
      <primitive ref={streakRef} object={assets.streakMesh} />
      <primitive ref={starsRef} object={assets.stars} />
    </group>
  )
}
