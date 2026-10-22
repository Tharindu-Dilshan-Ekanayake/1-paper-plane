import { MAX_EQUIPPED_PETS } from '@shared/balance'
import { rebirthProgress } from '@shared/logic'

import { useGame } from '../../store/game'
import Icon from '../Icon'
import StrokeText from '../StrokeText'
import { AlertBadge } from './parts'
import { u } from './style'

function MenuTile({ icon, label, onClick, alert, top }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pp-btn pointer-events-auto relative flex flex-col items-center"
      style={{
        width: u(116),
        height: u(116),
        borderRadius: u(8),
        border: `${u(3)} solid #111`,
        background: 'linear-gradient(180deg, rgba(74,86,44,0.72), rgba(44,52,26,0.72))',
        boxShadow: `inset 0 0 0 ${u(2)} rgba(255,255,255,0.12)`,
      }}
    >
      <Icon name={icon} size={u(92)} style={{ marginTop: u(2) }} />
      <span className="absolute" style={{ bottom: u(-14), fontSize: u(34) }}>
        <StrokeText stroke={u(7)}>{label}</StrokeText>
      </span>
      {top && (
        <span className="absolute" style={{ top: u(-20), fontSize: u(32) }}>
          <StrokeText stroke={u(7)} className="italic">
            {top}
          </StrokeText>
        </span>
      )}
      {alert && <AlertBadge size={44} style={{ top: u(-12), right: u(-16) }} />}
    </button>
  )
}

/** The 2x2 menu on the left: Pets, Rebirth (with % to next), Items, Store. */
export function LeftMenu() {
  const togglePanel = useGame((s) => s.togglePanel)
  const rebirthPct = useGame((s) => Math.floor(rebirthProgress(s.profile) * 100))
  const petAlert = useGame((s) => s.profile.equippedPets.length < Math.min(MAX_EQUIPPED_PETS, s.profile.pets.length))
  const itemAlert = useGame((s) => Object.values(s.profile.items).some((n) => n > 0))

  return (
    <div
      className="pointer-events-none absolute grid grid-cols-2"
      style={{ left: u(16), top: '41.5%', gap: u(8), rowGap: u(10) }}
    >
      <MenuTile icon="pets" label="Pets" alert={petAlert} onClick={() => togglePanel('pets')} />
      <MenuTile
        icon="rebirth"
        label="Rebirth"
        top={`${rebirthPct}%`}
        alert={rebirthPct >= 100}
        onClick={() => togglePanel('rebirth')}
      />
      <MenuTile icon="items" label="Items" alert={itemAlert} onClick={() => togglePanel('items')} />
      <MenuTile icon="store" label="Store" alert onClick={() => togglePanel('store')} />
    </div>
  )
}

export default LeftMenu
