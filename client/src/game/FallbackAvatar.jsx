import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { DoubleSide } from 'three'

/**
 * A classic blocky character, used when the Bloxity avatar can't be loaded (offline,
 * CDN down) so the player is never invisible. Proportions follow the classic 5-stud
 * figure scaled to the 1.8-unit player height.
 *
 * Materials match the held plane's (double-sided, flat) so they share its compiled
 * shader program instead of adding one.
 *
 * @param {{ motionRef: React.MutableRefObject<object>, onReady?: () => void }} props
 */
export function FallbackAvatar({ motionRef, onReady }) {
  const armL = useRef(null)
  const armR = useRef(null)
  const legL = useRef(null)
  const legR = useRef(null)

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useFrame(() => {
    const m = motionRef.current
    const ratio = Math.min(1, m.speed / Math.max(m.maxSpeed, 0.001))
    const swing = Math.sin(m.time * (6 + ratio * 5)) * 0.9 * ratio
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
    if (armL.current) armL.current.rotation.x = -swing
    if (armR.current) {
      // Throw: wind back then snap forward over the throw timer.
      armR.current.rotation.x = m.throwT > 0 ? -2.6 + (1 - m.throwT / 0.35) * 3.2 : swing
    }
  })

  const s = 0.36
  return (
    <group>
      <mesh position={[0, 4.5 * s, 0]} castShadow>
        <boxGeometry args={[1.2 * s, 1 * s, 1 * s]} />
        <meshLambertMaterial side={DoubleSide} flatShading color="#f5cd47" />
      </mesh>
      <mesh position={[0, 3 * s, 0]} castShadow>
        <boxGeometry args={[2 * s, 2 * s, 1 * s]} />
        <meshLambertMaterial side={DoubleSide} flatShading color="#1c1f26" />
      </mesh>
      {[
        [armL, -1.5, '#f5cd47'],
        [armR, 1.5, '#f5cd47'],
      ].map(([ref, x, color]) => (
        <group key={x} ref={ref} position={[x * s, 4 * s, 0]}>
          <mesh position={[0, -1 * s, 0]} castShadow>
            <boxGeometry args={[1 * s, 2 * s, 1 * s]} />
            <meshLambertMaterial side={DoubleSide} flatShading color={color} />
          </mesh>
        </group>
      ))}
      {[
        [legL, -0.5],
        [legR, 0.5],
      ].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x * s, 2 * s, 0]}>
          <mesh position={[0, -1 * s, 0]} castShadow>
            <boxGeometry args={[1 * s, 2 * s, 1 * s]} />
            <meshLambertMaterial side={DoubleSide} flatShading color="#2d3a5c" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default FallbackAvatar
