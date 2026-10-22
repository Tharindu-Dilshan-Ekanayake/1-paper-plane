import { useCallback, useState } from 'react'

import GameController from './GameController'
import GameScene from './game/GameScene'
import HatchOverlay from './ui/HatchOverlay'
import HUD from './ui/hud/HUD'
import LoadingScreen from './ui/LoadingScreen'
import Panels from './ui/panels/Panels'
import PopupLayer from './ui/PopupLayer'
import TouchControls from './ui/TouchControls'

function App() {
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <GameController />
      <GameScene onReady={handleReady} />
      <PopupLayer />
      <TouchControls />
      <HUD />
      <Panels />
      <HatchOverlay />
      <LoadingScreen done={ready} />
    </div>
  )
}

export default App
