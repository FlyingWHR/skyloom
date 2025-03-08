import React from 'react'
import { useBuildingStore } from '../../systems/building/buildingState'
import '../../styles/OptionsMenu.css'

interface OptionsMenuProps {
  isVisible: boolean;
  onResume: () => void;
}

export const OptionsMenu = ({ isVisible, onResume }: OptionsMenuProps) => {
  const { isBuilding, toggleBuilding } = useBuildingStore()
  
  if (!isVisible) return null
  
  return (
    <div className="options-menu">
      <div className="menu-container">
        <h2>SkyLoom Options</h2>
        
        <button className="menu-button" onClick={onResume}>
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
          <p>WASD: Movement</p>
          <p>Mouse: Look around</p>
          <p>Space: Move Up</p>
          <p>Shift: Move Down</p>
          <p>F: Speed boost</p>
          <p>B: Toggle building mode</p>
          <p>ESC: Show this menu</p>
          {isBuilding && (
            <>
              <p>Left Click: Place block</p>
              <p>Right Click: Remove block</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 