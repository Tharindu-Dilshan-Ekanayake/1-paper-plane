import { SphereGeometry } from 'three'

import { EGG_STANDS, FREE_REWARD, SPHINX_STAND } from '@shared/world'

import { EGG_COLORS } from '../../ui/icons'
import { STYLE } from '../materials'

/**
 * Egg stands: a blue-and-white pedestal with the egg floating above it, plus the big
 * premium Demon Egg on its dark plinth and the Sphinx showcase. Pedestals are blocks,
 * eggs are merged props - both ride along in the world's existing draw calls.
 */

const EGG = new SphereGeometry(1, 22, 16)
const SPOT = new SphereGeometry(1, 10, 8)

/** Height of an egg's centre above the ground. */
export const eggHeight = (stand) => (stand.big ? 3.4 : 2.6)

function egg(props, x, y, z, scale, [base, , spot], style = STYLE.SMOOTH) {
  props.add(EGG, { position: [x, y, z], scale: [scale, scale * 1.28, scale], color: base, style })
  const spots = [
    [0.55, 0.2, 0.62, 0.3],
    [-0.62, 0.45, 0.42, 0.24],
    [0.1, -0.35, 0.95, 0.26],
    [-0.35, -0.2, 0.86, 0.2],
    [0.8, -0.5, 0.15, 0.22],
  ]
  for (const [sx, sy, sz, r] of spots) {
    const len = Math.hypot(sx, sy / 1.28, sz)
    props.add(SPOT, {
      position: [x + (sx / len) * scale * 0.97, y + (sy / len) * scale * 1.28 * 0.97, z + (sz / len) * scale * 0.97],
      scale: [r * scale, r * scale, r * scale * 0.35],
      rotation: [0, Math.atan2(sx, sz), 0],
      color: spot,
      style: style === STYLE.LAVA ? STYLE.GLOW : STYLE.SMOOTH,
    })
  }
}

export function buildEggStands(blocks, props) {
  for (const stand of EGG_STANDS) {
    const colors = EGG_COLORS[stand.eggId]
    if (stand.big) {
      // Demon Egg: dark stepped plinth with a glowing rim, horns and bat wings.
      blocks.addOn(stand.x, 0, stand.z, 4.2, 0.7, 4.2, '#24141f')
      blocks.addOn(stand.x, 0.7, stand.z, 3.6, 0.35, 3.6, '#ff3b1e', STYLE.LAVA)
      blocks.addOn(stand.x, 1.05, stand.z, 3.2, 0.3, 3.2, '#3a1a2a')
      const y = eggHeight(stand)
      egg(props, stand.x, y, stand.z, 1.5, ['#ff3b1e', null, '#ffb347'], STYLE.LAVA)
      for (const side of [-1, 1]) {
        props.box(stand.x + side * 0.7, y + 1.95, stand.z, 0.35, 1.1, 0.35, '#1d1d24', STYLE.SMOOTH, [0, 0, side * -0.45])
        props.box(stand.x + side * 1.85, y + 0.5, stand.z - 0.3, 1.6, 0.9, 0.12, '#a8162a', STYLE.STUDS, [0, side * 0.3, side * 0.45])
        props.box(stand.x + side * 2.45, y + 1.05, stand.z - 0.45, 1.0, 0.6, 0.12, '#7a0f1f', STYLE.STUDS, [0, side * 0.3, side * 0.8])
      }
      continue
    }
    blocks.addOn(stand.x, 0, stand.z, 3.2, 0.55, 3.2, '#2f7fe6')
    blocks.addOn(stand.x, 0.55, stand.z, 2.8, 0.35, 2.8, '#f4f7fb')
    blocks.addOn(stand.x, 0.9, stand.z + 1.2, 1, 0.08, 0.4, '#ffd21f', STYLE.GLOW)
    egg(props, stand.x, eggHeight(stand), stand.z, 1.05, colors)
    if (stand.eggId === 'unicorn') {
      props.box(stand.x, eggHeight(stand) + 1.55, stand.z, 0.22, 0.75, 0.22, '#ffd23a', STYLE.GLOW, [0.25, 0, 0])
    }
  }

  // Free Reward stand by spawn; its crab is drawn by RewardCrab.
  blocks.addOn(FREE_REWARD.x, 0, FREE_REWARD.z, 3, 0.6, 3, '#6a1420')
  blocks.addOn(FREE_REWARD.x, 0.6, FREE_REWARD.z, 2.6, 0.3, 2.6, '#ff3b3b', STYLE.GLOW)
  blocks.addOn(FREE_REWARD.x, 0.9, FREE_REWARD.z, 2.2, 0.2, 2.2, '#f4f7fb')

  // Sphinx showcase plinth: gold-trimmed and taller, the pet itself is added by Showcase.
  const { x, z } = SPHINX_STAND
  blocks.addOn(x, 0, z, 5.6, 0.8, 5.6, '#2f6fe0')
  blocks.addOn(x, 0.8, z, 5, 0.5, 5, '#ffcf3a', STYLE.GLOW)
  blocks.addOn(x, 1.3, z, 4.4, 0.4, 4.4, '#f4f7fb')
}
