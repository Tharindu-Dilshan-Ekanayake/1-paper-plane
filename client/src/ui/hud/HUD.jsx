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
 * only the buttons themselves opt back in.
 */
export function HUD() {
  return (
    <div className="pp-font pointer-events-none absolute inset-0 z-20 select-none">
      <TopBar />
      <TopCenter />
      <LeftMenu />
      <RightButtons />
      <StatsPanel />
      <PowerBar />
      <Toasts />
    </div>
  )
}

export default HUD
