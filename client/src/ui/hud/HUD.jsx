import { useGame } from '../../store/game'
import AutoRebirthToggle from './AutoRebirthToggle'
import LeftMenu from './LeftMenu'
import PowerBar from './PowerBar'
import RightButtons from './RightButtons'
import StatsPanel from './StatsPanel'
import Toasts from './Toasts'
import TopBar from './TopBar'
import TopCenter from './TopCenter'

/**
 * The heads-up display, laid out like the reference: menu tiles on the left, stats
 * bottom-left, power and level bottom-centre, rewards and passes on the right.
 *
 * The root ignores pointer events so the canvas and joystick underneath keep working;
 * only the buttons themselves opt back in. While a panel is open the HUD steps aside,
 * as in the reference, leaving only toasts.
 */
export function HUD() {
  const panelOpen = useGame((s) => s.panel !== null)
  return (
    <div className="pp-font pointer-events-none absolute inset-0 z-20 select-none">
      <div className="absolute inset-0 transition-opacity duration-150" style={{ opacity: panelOpen ? 0 : 1, visibility: panelOpen ? 'hidden' : 'visible' }}>
        <TopBar />
        <TopCenter />
        <LeftMenu />
        <RightButtons />
        <StatsPanel />
        <PowerBar />
        <AutoRebirthToggle />
      </div>
      <Toasts />
    </div>
  )
}

export default HUD
