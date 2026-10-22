import { useCallback, useState } from 'react'

import GameScene from './game/GameScene'
import HUD from './ui/hud/HUD'
import LoadingScreen from './ui/LoadingScreen'
import TouchControls from './ui/TouchControls'

function App() {
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <GameScene onReady={handleReady} />
      <TouchControls />
      <HUD />
      <LoadingScreen done={ready} />
    </div>
  )
}

export default App
