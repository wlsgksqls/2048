import { useState } from 'react'
import { SettingsProvider } from './context/SettingsContext'
import Lobby from './screens/Lobby'
import Game from './screens/Game'
import Settings from './screens/Settings'

export default function App() {
  const [screen, setScreen] = useState('lobby') // 'lobby' | 'game' | 'settings'

  return (
    <SettingsProvider>
      <div className="app">
        {screen === 'lobby' && <Lobby onNavigate={setScreen} />}
        {screen === 'game' && <Game onNavigate={setScreen} />}
        {screen === 'settings' && <Settings onNavigate={setScreen} />}
      </div>
    </SettingsProvider>
  )
}
