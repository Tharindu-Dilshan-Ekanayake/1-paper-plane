import { PRODUCTS } from '@shared/balance'

import { getGame } from '../store/game'
import { actions } from './actions'

/**
 * The single entry point for every premium (Bux) purchase.
 *
 * Modes, from VITE_PREMIUM_MODE:
 * - 'mock'     : instant grant, no payment. Default in dev. The server only honours
 *                these when it runs with PREMIUM_MOCK=1, so a mock client can't
 *                mint items on a real server.
 * - 'disabled' : shows "coming soon". Default in production until the Bloxity
 *                payment flow is wired up: the platform charges the player and calls
 *                the server's /api/legion-webhook, which grants the product
 *                server-side - the client never grants anything itself.
 */
export const PREMIUM_MODE = import.meta.env.VITE_PREMIUM_MODE || (import.meta.env.DEV ? 'mock' : 'disabled')

export function purchase(productId) {
  const product = PRODUCTS[productId]
  if (!product) return
  const { profile, toast, openPanel } = getGame()
  if (product.kind === 'pass' && profile.passes[productId]) {
    toast(`You already own ${product.name}!`, 'info')
    return
  }
  if (PREMIUM_MODE === 'mock') {
    openPanel('purchase', { productId })
    return
  }
  toast('Purchases are coming soon!', 'info')
}

/** Called by the purchase prompt's confirm button. */
export function confirmPurchase(productId) {
  actions.purchase(productId)
  getGame().closePanel()
}
