import { useState, useEffect } from 'react'
import { Scene } from './components/game/Scene'
import { HUD } from './components/ui/HUD'
import { ElementSelector } from './components/ui/ElementSelector'
import { OptionsMenu } from './components/ui/OptionsMenu'
import './App.css'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  const handleResumeGame = () => {
    // Close menu and request pointer lock
    setMenuOpen(false)
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.requestPointerLock()
    }
  }
  
  // Add keyboard listener for ESC to resume game when menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && menuOpen) {
        // Prevent default ESC behavior
        e.preventDefault()
        // Resume game
        handleResumeGame()
      }
    }
    
    // Only add listener when menu is open
    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])
  
  return (
    <div className="game-container">
      <Scene setMenuOpen={setMenuOpen} />
      
      {/* UI elements */}
      {!menuOpen && <HUD />}
      {!menuOpen && <ElementSelector />}
      
      {/* Options menu */}
      <OptionsMenu isVisible={menuOpen} onResume={handleResumeGame} />
    </div>
  )
}

export default App
