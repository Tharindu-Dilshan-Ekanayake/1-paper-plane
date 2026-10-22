import { useGame } from '../../store/game'
import DailyRewardsPanel from './DailyRewardsPanel'
import ItemsPanel from './ItemsPanel'
import LeaderboardsPanel from './LeaderboardsPanel'
import LobbyPanel from './LobbyPanel'
import PetsPanel from './PetsPanel'
import PurchasePanel from './PurchasePanel'
import RebirthPanel from './RebirthPanel'
import RewardsPanel from './RewardsPanel'
import SettingsPanel from './SettingsPanel'
import StorePanel from './StorePanel'
import WelcomeBackPanel from './WelcomeBackPanel'

const PANELS = {
  pets: PetsPanel,
  rebirth: RebirthPanel,
  purchase: PurchasePanel,
  daily: DailyRewardsPanel,
  rewards: RewardsPanel,
  items: ItemsPanel,
  offline: WelcomeBackPanel,
  lobby: LobbyPanel,
  store: StorePanel,
  settings: SettingsPanel,
  leaderboards: LeaderboardsPanel,
}

/** Mounts whichever modal panel is open. Only one at a time, like the reference. */
export function Panels() {
  const panel = useGame((s) => s.panel)
  const Component = PANELS[panel]
  return Component ? <Component /> : null
}

export default Panels
