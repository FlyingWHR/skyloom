import React, { useState, useEffect } from 'react'
import { useBuildingStore } from '../../systems/building/buildingState'
import * as THREE from 'three'
import '../../styles/HUD.css'

// Access player motion state from window (populated by Player component)
interface PlayerMotionState {
  isFlying: boolean;
  flyTransition: number;
  onGround: boolean;
  speed: number;
  position: THREE.Vector3;
}

export const HUD = () => {
  const { isBuilding } = useBuildingStore()
  const [showControls, setShowControls] = useState(true)
  const [playerState, setPlayerState] = useState<PlayerMotionState | null>(null)
  
  // Get player motion state from window
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // @ts-ignore - Access from window, added by Player component
      if (window.playerMotionState) {
        // @ts-ignore
        setPlayerState(window.playerMotionState)
      }
    }, 100) // Update every 100ms
    
    return () => clearInterval(updateInterval)
  }, [])
  
  // Allow toggling controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev)
  }
  
  // Format position for display
  const formatPosition = (pos?: {x: number, y: number, z: number}) => {
    if (!pos) return 'Unknown'
    return `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}`
  }
  
  return (
    <div className="hud">
      {/* Game status information */}
      <div className="status-info">
        <p>Position: {formatPosition(playerState?.position)}</p>
        <p>Mode: {playerState?.isFlying ? 'Flying' : 'Walking'}</p>
        {!playerState?.isFlying && <p>On Ground: {playerState?.onGround ? 'Yes' : 'No'}</p>}
        <p>Speed: {playerState?.speed ? Math.round(playerState.speed * 10) / 10 : 0}</p>
        <button className="toggle-controls" onClick={toggleControls}>
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>
      
      {showControls && (
        <div className="controls-guide">
          <h3>Controls</h3>
          <p>WASD: Move</p>
          <p>Mouse: Look</p>
          <p><strong>F: Toggle Fly/Walk</strong></p>
          
          {playerState?.isFlying ? (
            <>
              <p>E/Space: Move Up</p>
              <p>Q/Ctrl: Move Down</p>
            </>
          ) : (
            <p>Space: Jump</p>
          )}
          
          <p>B: Toggle Building</p>
          <p>ESC: Menu</p>
          
          {isBuilding && (
            <>
              <h4>Building Mode</h4>
              <p>Left Click: Place</p>
              <p>Right Click: Remove</p>
            </>
          )}
        </div>
      )}
    </div>
  )
} 