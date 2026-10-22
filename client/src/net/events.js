import { beginFlight } from '../game/flight/flightControl'
import { queueTrainFx } from '../game/fx/fxQueue'
import { getGame } from '../store/game'

/**
 * Applies one authority event to the client: updates the store and kicks off any
 * visual effect. The same handler serves the Colyseus connection and offline mode.
 */
export function handleServerEvent(type, payload) {
  const game = getGame()
  switch (type) {
    case 'profile':
      game.setProfile(payload.profile, payload.session)
      break

    case 'train':
      game.patchProfile({
        power: payload.power,
        level: payload.level,
        levelProgress: payload.levelProgress,
        lastLane: payload.lane,
      })
      queueTrainFx(payload)
      break

    case 'throw':
      beginFlight(payload)
      break

    case 'hatch':
      game.setHatch({ eggId: payload.eggId, pets: payload.pets, id: Date.now() })
      break

    case 'offline':
      game.openPanel('offline', payload)
      break

    case 'toast':
      game.toast(payload.text, payload.kind)
      break

    case 'badge':
      game.toast(`Badge Awarded! You won the "${payload.name}" badge!`, 'badge', 5000)
      break

    default:
      break
  }
}
