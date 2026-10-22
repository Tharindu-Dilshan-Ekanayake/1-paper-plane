import { PRODUCTS } from '@shared/balance'

import { confirmPurchase, PREMIUM_MODE } from '../../net/premium'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { ChunkyButton, Price } from '../hud/parts'
import { GRADIENTS, u } from '../hud/style'
import Panel from './Panel'

const PRODUCT_ICONS = {
  autoThrow: 'autoThrow',
  x2Power: 'muscle',
  x2Wins: 'trophy',
  power100k: 'muscle',
  power1m: 'muscle',
  power10m: 'muscle',
  skipRebirth: 'rebirth',
  laneVeryOp: 'portal',
  laneBestOverall: 'portal',
  demonEgg: 'egg:demon',
  sphinx: 'pets',
}

/** "Buy X for N?" confirmation, the platform-style prompt in front of every purchase. */
export function PurchasePanel() {
  const productId = useGame((s) => s.panelData?.productId)
  const closePanel = useGame((s) => s.closePanel)
  const product = PRODUCTS[productId]
  if (!product) return null

  return (
    <Panel title="BUY" width={640}>
      <div className="flex flex-col items-center" style={{ gap: u(16) }}>
        <Icon name={PRODUCT_ICONS[productId] || 'store'} size={u(150)} />
        <div style={{ fontSize: u(54) }}>
          <StrokeText stroke={u(10)}>{product.name}</StrokeText>
        </div>
        <Price amount={product.price} size={56} />
        {PREMIUM_MODE === 'mock' && (
          <p className="m-0 text-center" style={{ fontSize: u(24) }}>
            <StrokeText stroke={u(5)} fill="#ffe45c">
              Test mode: purchases are free and instant.
            </StrokeText>
          </p>
        )}
        <div className="flex w-full" style={{ gap: u(16) }}>
          <ChunkyButton gradient={GRADIENTS.greyButton} onClick={closePanel} className="flex-1" style={{ height: u(96) }}>
            <span style={{ fontSize: u(46) }}>
              <StrokeText stroke={u(9)}>Cancel</StrokeText>
            </span>
          </ChunkyButton>
          <ChunkyButton gradient={GRADIENTS.greenButton} onClick={() => confirmPurchase(productId)} className="flex-1" style={{ height: u(96) }}>
            <span style={{ fontSize: u(46) }}>
              <StrokeText stroke={u(9)}>Buy</StrokeText>
            </span>
          </ChunkyButton>
        </div>
      </div>
    </Panel>
  )
}

export default PurchasePanel
