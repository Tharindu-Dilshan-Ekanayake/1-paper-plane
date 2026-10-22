import { useGame } from '../../store/game'
import PetsPanel from './PetsPanel'
import PurchasePanel from './PurchasePanel'
import RebirthPanel from './RebirthPanel'

const PANELS = {
  pets: PetsPanel,
  rebirth: RebirthPanel,
  purchase: PurchasePanel,
}

/** Mounts whichever modal panel is open. Only one at a time, like the reference. */
export function Panels() {
  const panel = useGame((s) => s.panel)
  const Component = PANELS[panel]
  return Component ? <Component /> : null
}

export default Panels
