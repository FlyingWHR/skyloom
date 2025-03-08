import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerControls } from '../../hooks/usePlayerControls'
import { useBuildingStore } from '../../systems/building/buildingState'

export const Player = ({ setMenuOpen }: { setMenuOpen: (isOpen: boolean) => void }) => {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const position = useRef(new THREE.Vector3(0, 10, 20))
  const playerMeshRef = useRef<THREE.Group>(null)
  
  const keys = usePlayerControls()
  const { isBuilding } = useBuildingStore()
  
  // State to track if we should lock the pointer (not needed in building mode)
  const shouldLockPointer = useRef(!isBuilding)
  
  // Set up initial position
  useEffect(() => {
    camera.position.copy(position.current)
    camera.lookAt(0, 0, 0)
  }, [camera])
  
  // Update lock state when building mode changes
  useEffect(() => {
    shouldLockPointer.current = !isBuilding
    
    // If we're entering building mode, release the pointer lock
    if (isBuilding && document.pointerLockElement) {
      document.exitPointerLock()
    }
    // If we're exiting building mode, lock the pointer
    else if (!isBuilding && !document.pointerLockElement) {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.requestPointerLock()
      }
    }
  }, [isBuilding])
  
  // Set up mouse look controls and handle pointer lock
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    
    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    
    // Try to lock pointer immediately for non-building mode
    const tryLockPointer = () => {
      if (!document.pointerLockElement && canvas && shouldLockPointer.current) {
        canvas.requestPointerLock()
      }
    }
    
    const lockPointer = () => {
      // Only lock when not in building mode
      if (!document.pointerLockElement && shouldLockPointer.current) {
        canvas.requestPointerLock()
      }
    }
    
    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvas
      
      // Only show the menu if we're not in building mode and pointer is unlocked
      if (!isBuilding) {
        setMenuOpen(!isLocked)
      }
      
      // When menu is closed (pointer is locked), hide the menu
      if (isLocked) {
        setMenuOpen(false)
      }
    }
    
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return
      
      const sensitivity = 0.002
      euler.setFromQuaternion(camera.quaternion)
      
      euler.y -= event.movementX * sensitivity
      euler.x -= event.movementY * sensitivity
      
      // Limit vertical rotation to prevent flipping
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x))
      
      camera.quaternion.setFromEuler(euler)
    }
    
    // Try to lock immediately if not in building mode
    if (shouldLockPointer.current) {
      setTimeout(tryLockPointer, 1000)
    }
    
    // Set up event listeners
    canvas.addEventListener('click', lockPointer)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)
    
    return () => {
      canvas.removeEventListener('click', lockPointer)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [camera, setMenuOpen, isBuilding])
  
  // Handle keyboard movement
  useFrame((state, delta) => {
    // Skip movement when menu is open or when we're in building mode without pointer lock
    if (document.pointerLockElement === null && !isBuilding) return
    
    // Calculate movement direction
    const direction = new THREE.Vector3()
    
    // Forward/backward - follow exact camera direction including vertical component
    if (keys.forward) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      direction.add(forward.normalize())
    }
    if (keys.backward) {
      const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion)
      direction.add(backward.normalize())
    }
    
    // Left/right strafing - perpendicular to forward direction but keep on horizontal plane
    if (keys.left) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion)
      direction.add(left.normalize())
    }
    if (keys.right) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      direction.add(right.normalize())
    }
    
    // Add direct up/down movement
    if (keys.up) {
      direction.y += 1
    }
    if (keys.down) {
      direction.y -= 1
    }
    
    // Normalize for consistent speed in all directions
    if (direction.length() > 0) {
      direction.normalize()
    }
    
    // Apply speed and acceleration
    const speed = keys.boost ? 15 : 7
    const acceleration = 30 * delta
    
    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, direction.x * speed, acceleration)
    velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, direction.y * speed, acceleration)
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, direction.z * speed, acceleration)
    
    // Update position
    position.current.add(velocity.current.clone().multiplyScalar(delta))
    
    // Update camera
    camera.position.copy(position.current)
    
    // Update player mesh (visual representation)
    if (playerMeshRef.current) {
      // Position slightly in front of camera
      const forward = new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion)
      const playerPos = position.current.clone().add(forward)
      playerPos.y -= 1.5 // Adjust down to be visible but not block view
      
      playerMeshRef.current.position.copy(playerPos)
      playerMeshRef.current.rotation.copy(camera.rotation)
    }
  })
  
  return (
    <group ref={playerMeshRef}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color="#4FACFE"
          emissive="#4FACFE"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
} 