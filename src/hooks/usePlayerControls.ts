import { useEffect, useState } from 'react'
import { useBuildingStore } from '../systems/building/buildingState'

export const usePlayerControls = () => {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false
  })
  
  const { toggleBuilding } = useBuildingStore()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(keys => ({ ...keys, forward: true }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys(keys => ({ ...keys, backward: true }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(keys => ({ ...keys, left: true }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys(keys => ({ ...keys, right: true }))
          break
        case 'Space':
          setKeys(keys => ({ ...keys, up: true }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys(keys => ({ ...keys, down: true }))
          break
        case 'KeyF':
          setKeys(keys => ({ ...keys, boost: true }))
          break
        case 'KeyB':
          // Toggle building mode on B keypress
          toggleBuilding()
          break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(keys => ({ ...keys, forward: false }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys(keys => ({ ...keys, backward: false }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(keys => ({ ...keys, left: false }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys(keys => ({ ...keys, right: false }))
          break
        case 'Space':
          setKeys(keys => ({ ...keys, up: false }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys(keys => ({ ...keys, down: false }))
          break
        case 'KeyF':
          setKeys(keys => ({ ...keys, boost: false }))
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [toggleBuilding])
  
  return keys
} 