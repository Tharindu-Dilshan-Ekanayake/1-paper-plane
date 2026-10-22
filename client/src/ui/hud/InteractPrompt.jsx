import { useEffect } from 'react'

import { PLANES } from '@shared/balance'
import { formatNumber } from '@shared/format'

import { padState } from '../../game/labels/lobbyLabels'
import { actions } from '../../net/actions'
import { useGame } from '../../store/game'
import { u } from './style'

/**
 * What standing on the current spot lets you do, if anything: { title, action, run }.
 * One prompt at a time; later systems (eggs, rewards) add their cases here.
 */
function usePrompt() {
  const pad = useGame((s) => s.zone.pad)
  const owned = useGame((s) => s.profile.ownedPlanes)
  const equipped = useGame((s) => s.profile.equippedPlane)
  const atFreeReward = useGame((s) => s.zone.freeReward)
  const freeTaken = useGame((s) => s.session.freeRewardTaken)

  if (atFreeReward) {
    return freeTaken
      ? { title: 'Free Reward', action: 'Come back next time!', run: null }
      : { title: 'Free Reward', action: 'Claim', run: () => actions.claimFreeReward() }
  }

  if (pad >= 0) {
    const plane = PLANES[pad]
    const state = padState({ ownedPlanes: owned, equippedPlane: equipped }, pad)
    if (state === 'equipped') return { title: plane.name, action: 'Equipped', run: null }
    if (state === 'owned') return { title: plane.name, action: 'Equip', run: () => actions.equipPlane(plane.id) }
    if (state === 'locked') return { title: plane.name, action: `Buy the ${PLANES[pad - 1].name} first`, run: null }
    return { title: plane.name, action: `Buy - ${formatNumber(plane.cost)} Wins`, run: () => actions.buyPlane(plane.id) }
  }
  return null
}

/**
 * Proximity prompt, styled like the platform's own: a dark box with the key to press.
 * E on keyboard; tap the box on touch screens.
 */
export function InteractPrompt() {
  const prompt = usePrompt()
  const busy = useGame((s) => Boolean(s.flight || s.panel))
  const run = !busy ? prompt?.run : null

  useEffect(() => {
    if (!run) return undefined
    const onKey = (e) => {
      if (e.code === 'KeyE' && !e.repeat) run()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  if (!prompt || busy) return null
  return (
    <button
      type="button"
      onClick={() => prompt.run?.()}
      className="pp-btn pointer-events-auto absolute flex items-center text-left text-white"
      style={{
        left: '53%',
        top: '50%',
        gap: u(14),
        padding: `${u(12)} ${u(20)} ${u(12)} ${u(12)}`,
        borderRadius: u(10),
        background: 'rgba(24, 26, 30, 0.78)',
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 600,
      }}
    >
      {prompt.run && (
        <span
          className="flex items-center justify-center rounded-full"
          style={{ width: u(54), height: u(54), border: `${u(3)} solid #fff`, fontSize: u(26) }}
        >
          E
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span style={{ fontSize: u(20), opacity: 0.75 }}>{prompt.title}</span>
        <span style={{ fontSize: u(28) }}>{prompt.action}</span>
      </span>
    </button>
  )
}

export default InteractPrompt
