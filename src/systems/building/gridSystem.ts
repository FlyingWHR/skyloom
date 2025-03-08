import * as THREE from 'three'

// Grid size for snapping
export const GRID_SIZE = 1

// Round to nearest grid position
export const snapToGrid = (position: THREE.Vector3): THREE.Vector3 => {
  return new THREE.Vector3(
    Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    Math.round(position.y / GRID_SIZE) * GRID_SIZE,
    Math.round(position.z / GRID_SIZE) * GRID_SIZE
  )
}

// Check if a position is valid for placement
export const isValidPlacement = (
  position: THREE.Vector3,
  existingBlocks: THREE.Vector3[]
): boolean => {
  // Check if position is already occupied
  const isOccupied = existingBlocks.some(blockPos => 
    blockPos.x === position.x && 
    blockPos.y === position.y && 
    blockPos.z === position.z
  )
  
  return !isOccupied
} 