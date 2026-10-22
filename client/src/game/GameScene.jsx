import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { useBloxity } from '../bloxity/BloxityContext'
import { useQuality } from '../store/quality'
import ErrorBoundary from '../ui/ErrorBoundary'
import BlobShadows from './BlobShadows'
import FollowCamera from './FollowCamera'
import TrainingFX from './fx/TrainingFX'
import WorldLabels from './labels/WorldLabels'
import Lighting from './Lighting'
import PerfProbe from './PerfProbe'
import Player from './Player'
import { FOG, SKY } from './sceneStyle'
import Sky from './Sky'
import World from './world/World'

// r3f-perf is a dev-only overlay (?perf in the URL). The DEV check is static, so the
// import and the package are dropped from production builds entirely.
const DevPerf = import.meta.env.DEV
  ? lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))
  : null
const showDevPerf = import.meta.env.DEV && new URLSearchParams(window.location.search).has('perf')

// The track and flight are their own chunk, fetched once the lobby is on screen so they
// never delay time-to-playable.
const Flight = lazy(() => import('./flight/Flight'))

/**
 * Fires `onFirstFrame` after the renderer has actually drawn once.
 * "Ready" should mean "the player can see the game", not "React mounted".
 */
function FirstFrameSignal({ onFirstFrame }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    // Deferred: never update React state from inside the frame loop.
    setTimeout(onFirstFrame, 0)
  })
  return null
}

/** Keeps the camera's far plane in step with the preset's view distance. */
function ViewDistance({ far }) {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const { camera } = get()
    camera.far = far
    camera.updateProjectionMatrix()
  }, [get, far])
  return null
}

/**
 * The 3D view. Owns the renderer lifecycle: quality-driven settings, automatic preset
 * drops when FPS falls under budget, and recovery from a lost WebGL context.
 *
 * @param {{ onReady?: () => void }} props called once the avatar is in and a frame
 *   has been drawn
 */
export function GameScene({ onReady }) {
  const { game } = useBloxity()
  const settings = useQuality((s) => s.settings)
  const antialias = useQuality((s) => s.antialias)
  const degrade = useQuality((s) => s.degrade)

  const [avatarReady, setAvatarReady] = useState(false)
  const [firstFrame, setFirstFrame] = useState(false)
  const [contextKey, setContextKey] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const readySent = useRef(false)

  const handleAvatarReady = useCallback(() => setAvatarReady(true), [])
  const handleFirstFrame = useCallback(() => setFirstFrame(true), [])

  useEffect(() => {
    game.loadingStep('Preparing scene…')
  }, [game])

  useEffect(() => {
    if (!avatarReady || !firstFrame || readySent.current) return
    readySent.current = true
    game.loadingEnd()
    onReady?.()
  }, [avatarReady, firstFrame, game, onReady])

  // A lost context (GPU reset, too many tabs, backgrounded on mobile) is recovered by
  // remounting the canvas, which builds a fresh context and re-uploads everything.
  // Game state lives in stores, so nothing is lost but a moment of rendering.
  const handleCreated = useCallback(({ gl }) => {
    gl.setClearColor(SKY.horizon)
    const canvas = gl.domElement
    let remountTimer = null
    const remount = () => {
      clearTimeout(remountTimer)
      setContextLost(false)
      setContextKey((k) => k + 1)
    }
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      setContextLost(true)
      // Don't wait forever for a 'restored' that may never come.
      remountTimer = setTimeout(remount, 1500)
    })
    canvas.addEventListener('webglcontextrestored', remount)
  }, [])

  // Never set state from the monitor's frame callback directly.
  const handleDecline = useCallback(() => setTimeout(degrade, 0), [degrade])

  const dpr = Math.min(settings.dpr, window.devicePixelRatio || 1)

  return (
    <>
      <Canvas
        key={contextKey}
        dpr={dpr}
        gl={{ antialias, powerPreference: 'high-performance', stencil: false }}
        // PCF, not R3F's default "soft": three r18x removed PCFSoftShadowMap.
        shadows={settings.shadows === 'realtime' ? 'percentage' : false}
        // No tone mapping. The default (ACES) desaturates the toy colours; the palette
        // and light levels in sceneStyle.js are chosen to look right without it.
        flat
        camera={{ position: [0, 6, 26], fov: 60, near: 0.3, far: settings.viewDistance }}
        onCreated={handleCreated}
      >
        <fog attach="fog" args={[FOG.color, settings.fogNear, settings.viewDistance * 0.95]} />
        <ViewDistance far={settings.viewDistance} />
        <PerformanceMonitor bounds={() => [45, Infinity]} onDecline={handleDecline} />

        <Sky />
        <Lighting />
        <World />
        <WorldLabels />
        <Player onAvatarReady={handleAvatarReady} />
        <BlobShadows />
        <TrainingFX />
        {avatarReady && firstFrame && (
          <Suspense fallback={null}>
            <Flight />
          </Suspense>
        )}

        <FollowCamera />
        <FirstFrameSignal onFirstFrame={handleFirstFrame} />
        <PerfProbe />
        {showDevPerf && DevPerf && (
          <ErrorBoundary>
            <Suspense fallback={null}>
              <DevPerf position="bottom-right" minimal />
            </Suspense>
          </ErrorBoundary>
        )}
      </Canvas>

      {contextLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-sky-400/80 text-2xl text-white">
          <span className="pp-stroke">Reloading graphics…</span>
        </div>
      )}
    </>
  )
}

export default GameScene
