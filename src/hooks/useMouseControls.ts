import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export const useMouseControls = () => {
  const { camera, gl } = useThree()
  const [isLocked, setIsLocked] = useState(false)
  
  useEffect(() => {
    const canvas = gl.domElement
    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    let isMouseDown = false
    
    // Mouse sensitivity
    const sensitivity = 0.002
    
    // Handle mouse movement for camera rotation
    const onMouseMove = (event: MouseEvent) => {
      if (!isLocked && !isMouseDown) return
      
      // Update camera rotation based on mouse movement
      euler.setFromQuaternion(camera.quaternion)
      
      // Adjust yaw (left/right)
      euler.y -= event.movementX * sensitivity
      
      // Adjust pitch (up/down) with limits to prevent flipping
      euler.x -= event.movementY * sensitivity
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x))
      
      camera.quaternion.setFromEuler(euler)
    }
    
    // Toggle pointer lock with mouse down/up
    const onMouseDown = () => {
      isMouseDown = true
    }
    
    const onMouseUp = () => {
      isMouseDown = false
    }
    
    // Lock pointer on click for proper FPS controls
    const requestPointerLock = () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock()
      }
    }
    
    // Handle pointer lock state changes
    const onPointerLockChange = () => {
      setIsLocked(document.pointerLockElement === canvas)
    }
    
    // Set up event listeners
    document.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('click', requestPointerLock)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('click', requestPointerLock)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [camera, gl])
  
  return isLocked
} 