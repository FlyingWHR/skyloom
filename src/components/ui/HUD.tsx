import React from 'react'
import { useBuildingStore } from '../../systems/building/buildingState'
import '../../styles/HUD.css'

export const HUD = () => {
  const { isBuilding } = useBuildingStore()
  
  return (
    <div className="hud">
      <div className="controls-guide">
        <h3>Controls</h3>
        <p>Mouse: Look around</p>
        <p>W/↑: Forward</p>
        <p>S/↓: Backward</p>
        <p>A/←: Left</p>
        <p>D/→: Right</p>
        <p>Space: Up</p>
        <p>Shift: Down</p>
        <p>F: Boost Speed</p>
        <p>B: Toggle Building</p>
        <p>ESC: Menu</p>
        
        {isBuilding && (
          <>
            <h4>Building Mode</h4>
            <p>Left Click: Place block</p>
            <p>Right Click: Remove block</p>
            <p>Use selector to change element type</p>
          </>
        )}
      </div>
    </div>
  )
} 