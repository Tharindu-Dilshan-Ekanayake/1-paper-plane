import { useGame } from '../../store/game'
import DailyRewardsPanel from './DailyRewardsPanel'
import ItemsPanel from './ItemsPanel'
import LeaderboardsPanel from './LeaderboardsPanel'
import PetsPanel from './PetsPanel'
import RebirthPanel from './RebirthPanel'
import StorePanel from './StorePanel'
import WelcomeBackPanel from './WelcomeBackPanel'

const PANELS = {
  pets: PetsPanel,
  rebirth: RebirthPanel,
  daily: DailyRewardsPanel,
  items: ItemsPanel,
  offline: WelcomeBackPanel,
  store: StorePanel,
  leaderboards: LeaderboardsPanel,
}

/** Mounts whichever modal panel is open. Only one at a time, like the reference. */
export function Panels() {
  const panel = useGame((s) => s.panel)
  const Component = PANELS[panel]
  return Component ? <Component /> : null
}

export default Panels
