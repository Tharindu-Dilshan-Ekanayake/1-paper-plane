import { PRODUCTS } from '@shared/balance'

import { purchase } from '../../net/premium'
import { useGame } from '../../store/game'
import Icon from '../Icon'
import PetIcon from '../PetIcon'
import StrokeText from '../StrokeText'
import { ChunkyButton, Price } from '../hud/parts'
import { GRADIENTS, u } from '../hud/style'
import Panel from './Panel'

const SECTIONS = [
  { title: 'Gamepasses', items: ['autoThrow', 'x2Power', 'x2Wins', 'laneVeryOp', 'laneBestOverall'] },
  { title: 'Power Packs', items: ['power100k', 'power1m', 'power10m'] },
  { title: 'Specials', items: ['skipRebirth', 'demonEgg', 'sphinx'] },
]

const ICONS = {
  autoThrow: 'autoThrow',
  x2Power: 'muscle',
  x2Wins: 'trophy',
  laneVeryOp: 'portal',
  laneBestOverall: 'portal',
  power100k: 'muscle',
  power1m: 'muscle',
  power10m: 'muscle',
  skipRebirth: 'rebirth',
  demonEgg: 'egg:demon',
}

const BLURBS = {
  autoThrow: 'Throws for you in the Throw Area',
  x2Power: 'Double Power from training, forever',
  x2Wins: 'Double Wins from every throw',
  laneVeryOp: 'Unlocks the x30 Rainbow lane',
  laneBestOverall: 'Unlocks the x100 Galaxy lane',
  power100k: 'Instant +100K Power',
  power1m: 'Instant +1M Power',
  power10m: 'Instant +10M Power',
  skipRebirth: 'Rebirth now and keep all stats',
  demonEgg: 'Hatch a Demon Egg pet',
  sphinx: 'Limited: 150x Power pet',
}

/** Every premium product, grouped, with what it does and whether you own it. */
export function StorePanel() {
  const passes = useGame((s) => s.profile.passes)
  return (
    <Panel title="STORE" width={1080}>
      <div className="flex flex-col" style={{ gap: u(18) }}>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div style={{ fontSize: u(40), marginBottom: u(8) }}>
              <StrokeText stroke={u(8)} gradient={GRADIENTS.gold}>
                {section.title}
              </StrokeText>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${u(200)}, 1fr))`, gap: u(12) }}>
              {section.items.map((id) => {
                const product = PRODUCTS[id]
                const owned = product.kind === 'pass' && passes[id]
                return (
                  <div
                    key={id}
                    className="flex flex-col items-center text-center"
                    style={{ padding: u(10), borderRadius: u(8), border: `${u(5)} solid #111`, background: owned ? GRADIENTS.greyButton : GRADIENTS.rewardCard }}
                  >
                    {id === 'sphinx' ? <PetIcon id="sphinx" size={u(96)} /> : <Icon name={ICONS[id]} size={u(96)} />}
                    <span style={{ fontSize: u(product.name.length > 12 ? 24 : 30), lineHeight: 1.1 }}>
                      <StrokeText stroke={u(6)} style={{ whiteSpace: 'normal' }}>
                        {product.name}
                      </StrokeText>
                    </span>
                    <span className="whitespace-normal" style={{ fontSize: u(18), minHeight: u(44), margin: `${u(4)} 0` }}>
                      <span style={{ color: '#3a2a10', fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}>{BLURBS[id]}</span>
                    </span>
                    <ChunkyButton
                      gradient={owned ? GRADIENTS.greyButton : GRADIENTS.greenButton}
                      disabled={owned}
                      onClick={() => purchase(id)}
                      className="w-full"
                      style={{ height: u(58) }}
                    >
                      {owned ? (
                        <span style={{ fontSize: u(30) }}>
                          <StrokeText stroke={u(6)}>Owned</StrokeText>
                        </span>
                      ) : (
                        <Price amount={product.price} size={32} />
                      )}
                    </ChunkyButton>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default StorePanel
