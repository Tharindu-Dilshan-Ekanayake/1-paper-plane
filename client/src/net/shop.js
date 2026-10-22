import { SHOP } from '@shared/balance'
import { formatNumber } from '@shared/format'

import { getGame } from '../store/game'
import { actions } from './actions'

/**
 * Buys a shop item with Wins. The authority checks and charges; this only spares a
 * round trip when the answer is obviously no.
 */
export function buy(productId) {
  const item = SHOP[productId]
  if (!item) return
  const { profile, toast } = getGame()
  if (item.kind === 'pass' && profile.passes[productId]) {
    toast(`You already own ${item.name}!`, 'info')
    return
  }
  if (profile.wins < item.price) {
    toast(`You need ${formatNumber(item.price)} Wins!`, 'error')
    return
  }
  actions.purchase(productId)
}
