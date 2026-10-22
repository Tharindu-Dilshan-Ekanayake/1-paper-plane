import { useGame } from '../../store/game'
import PurchasePanel from './PurchasePanel'
import RebirthPanel from './RebirthPanel'

const PANELS = {
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
