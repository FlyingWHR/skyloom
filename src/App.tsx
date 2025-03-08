import { useState, useEffect, useRef } from 'react'
import { Scene } from './components/game/Scene'
import { HUD } from './components/ui/HUD'
import { ElementSelector } from './components/ui/ElementSelector'
import { OptionsMenu } from './components/ui/OptionsMenu'
import './App.css'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const escTimeoutRef = useRef<number | null>(null)
  const escLockRef = useRef(false)
  
  const handleResumeGame = () => {
    // Just close menu - the Player component will handle pointer lock
    setMenuOpen(false)
    
    // Prevent ESC from toggling menu too quickly
    escLockRef.current = true
    if (escTimeoutRef.current) clearTimeout(escTimeoutRef.current)
    escTimeoutRef.current = setTimeout(() => {
      escLockRef.current = false
    }, 500) // 500ms cooldown before ESC can toggle menu again
  }
  
  // Add keyboard listener for ESC to resume game when menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && menuOpen && !escLockRef.current) {
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
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (escTimeoutRef.current) {
        clearTimeout(escTimeoutRef.current)
      }
    }
  }, [])
  
  return (
    <div className="game-container">
      <Scene setMenuOpen={setMenuOpen} menuOpen={menuOpen} />
      
      {/* UI elements */}
      {!menuOpen && <HUD />}
      {!menuOpen && <ElementSelector />}
      
      {/* Options menu */}
      <OptionsMenu isVisible={menuOpen} onResume={handleResumeGame} />
    </div>
  )
}

export default App
