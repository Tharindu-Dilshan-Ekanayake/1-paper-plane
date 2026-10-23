import { useEffect, useRef } from 'react'

import { NAMEPLATE_POOL_SIZE, registerNameplateElements } from '../game/remote/nameplates'

const SLOTS = Array.from({ length: NAMEPLATE_POOL_SIZE }, (_, i) => i)

/** DOM side of the other players' name tags; positioned by the 3D frame loop. */
export function NameplateLayer() {
  const refs = useRef([])
  useEffect(() => {
    registerNameplateElements(refs.current)
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0 z-[14] overflow-hidden">
      {SLOTS.map((i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="absolute left-0 top-0 whitespace-nowrap text-white"
          style={{
            display: 'none',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 'max(11px, calc(var(--px) * 20))',
            textShadow: '0 1px 2px rgba(0,0,0,0.85)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

export default NameplateLayer
