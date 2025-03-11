import React, { useRef, useEffect } from 'react'
import { useBuildingStore } from '../../systems/building/buildingState'
import '../../styles/OptionsMenu.css'

interface OptionsMenuProps {
  isVisible: boolean;
  onResume: () => void;
}

export const OptionsMenu = ({ isVisible, onResume }: OptionsMenuProps) => {
  const { isBuilding, toggleBuilding } = useBuildingStore()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  
  // Handle clicks outside menu container
  useEffect(() => {
    if (!isVisible) return
    
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        onResume()
      }
    }
    
    // Add listener with a slight delay to prevent immediate triggering
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onResume])
  
  // Handle resume button click
  const handleResumeClick = (e: React.MouseEvent) => {
    onResume()
  }
  
  if (!isVisible) return null
  
  return (
    <div className="options-menu">
      <div className="menu-container" ref={menuContainerRef}>
        <h2>SkyLoom Options</h2>
        
        <button className="menu-button" onClick={handleResumeClick}>
          Resume Game
        </button>
        
        <button 
          className={`menu-button ${isBuilding ? 'active' : ''}`} 
          onClick={toggleBuilding}
        >
          {isBuilding ? 'Exit Building Mode' : 'Enter Building Mode'}
        </button>
        
        <div className="controls-help">
          <h3>Controls</h3>
          <p>WASD: Move in current direction</p>
          <p>Mouse: Look around</p>
          <p>F: Toggle Fly/Walk Mode</p>
          <p>Space: Jump (in walk mode)</p>
          <p>Shift+WASD: Run faster</p>
          
          <h4>Flying Controls</h4>
          <p>E or Space: Move Up</p>
          <p>Q or Ctrl: Move Down</p>
          <p>Hold movement keys to accelerate</p>
          
          <h4>Building</h4>
          <p>B: Toggle building mode</p>
          <p>1-9: Select element type</p>
          <p>ESC: Show this menu</p>
          
          {isBuilding && (
            <>
              <h4>Building Actions</h4>
              <p>Left Click: Place block</p>
              <p>Right Click: Remove block</p>
              <p>Mouse Wheel: Change selected element</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 