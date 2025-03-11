import * as THREE from 'three';
import { WorldManager } from '../building/chunkSystem';
import { ElementType } from '../elements/elementTypes';

// Configuration for player physics
export interface PhysicsConfig {
  gravity: number;
  jumpSpeed: number;
  friction: number;
  maxFallSpeed: number;
}

// Default physics configuration
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 20,
  jumpSpeed: 8,
  friction: 0.8,
  maxFallSpeed: 30
};

// Class to handle collision detection and physics
export class CollisionSystem {
  private worldManager: WorldManager;
  private config: PhysicsConfig;
  
  // Player properties
  private playerRadius: number = 0.3;
  private playerHeight: number = 1.7;
  
  constructor(worldManager: WorldManager, config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {
    this.worldManager = worldManager;
    this.config = config;
  }
  
  // Update physics with delta time
  update(dt: number, position: THREE.Vector3, velocity: THREE.Vector3, isFlying: boolean = false): { 
    newPosition: THREE.Vector3, 
    newVelocity: THREE.Vector3,
    onGround: boolean
  } {
    // Apply gravity if not flying
    if (!isFlying) {
      velocity.y -= this.config.gravity * dt;
      
      // Limit max fall speed
      if (velocity.y < -this.config.maxFallSpeed) {
        velocity.y = -this.config.maxFallSpeed;
      }
    }
    
    // Calculate new position based on velocity
    const newPosition = position.clone().add(velocity.clone().multiplyScalar(dt));
    
    // Check for collisions and adjust position
    const collisionResult = this.handleCollisions(position, newPosition, velocity, isFlying);
    
    // Apply friction when on ground
    if (collisionResult.onGround && !isFlying) {
      velocity.x *= this.config.friction;
      velocity.z *= this.config.friction;
      
      // Reset vertical velocity when on ground
      if (velocity.y < 0) {
        velocity.y = 0;
      }
    }
    
    return {
      newPosition: collisionResult.newPosition,
      newVelocity: velocity,
      onGround: collisionResult.onGround
    };
  }
  
  // Check if a position has a solid block at a given offset
  private hasSolidBlockAt(position: THREE.Vector3, offsetX: number, offsetY: number, offsetZ: number): boolean {
    const block = this.worldManager.getBlockAt(
      Math.floor(position.x + offsetX),
      Math.floor(position.y + offsetY),
      Math.floor(position.z + offsetZ)
    );
    return !!(block && block.id !== ElementType.WOOD);
  }
  
  // Handle collisions between player and blocks
  private handleCollisions(oldPosition: THREE.Vector3, newPosition: THREE.Vector3, velocity: THREE.Vector3, isFlying: boolean): {
    newPosition: THREE.Vector3,
    onGround: boolean
  } {
    // Clone position for modifications
    const adjustedPosition = newPosition.clone();
    let onGround = false;
    
    // Skip collision detection if in flying mode
    if (isFlying) {
      // Still check if we're on ground for UI purposes (even in flying mode)
      onGround = this.hasSolidBlockAt(adjustedPosition, 0, -0.1, 0);
      return { newPosition: adjustedPosition, onGround };
    }
    
    // We'll use a simple bounding cylinder for the player
    // First check vertical movement (Y-axis)
    const headPosition = adjustedPosition.clone().add(new THREE.Vector3(0, this.playerHeight, 0));
    const footPosition = adjustedPosition.clone();
    
    // Check for ground - do a more thorough check with multiple points
    const checkRadius = this.playerRadius * 0.8;
    const groundPoints = [
      new THREE.Vector3(0, -0.1, 0),                   // center
      new THREE.Vector3(checkRadius, -0.1, 0),         // +x
      new THREE.Vector3(-checkRadius, -0.1, 0),        // -x
      new THREE.Vector3(0, -0.1, checkRadius),         // +z
      new THREE.Vector3(0, -0.1, -checkRadius),        // -z
      new THREE.Vector3(checkRadius, -0.1, checkRadius),  // +x +z
      new THREE.Vector3(-checkRadius, -0.1, -checkRadius), // -x -z
      new THREE.Vector3(checkRadius, -0.1, -checkRadius),  // +x -z
      new THREE.Vector3(-checkRadius, -0.1, checkRadius)   // -x +z
    ];
    
    // Check all ground points
    for (const point of groundPoints) {
      if (this.hasSolidBlockAt(footPosition, point.x, point.y, point.z)) {
        onGround = true;
        // Adjust position to top of block
        adjustedPosition.y = Math.ceil(footPosition.y);
        break;
      }
    }
    
    // Check block at head
    if (this.hasSolidBlockAt(headPosition, 0, 0, 0)) {
      // Adjust position to bottom of block minus player height
      adjustedPosition.y = Math.floor(headPosition.y) - this.playerHeight;
      
      // If moving upward, stop vertical movement
      if (velocity.y > 0) {
        velocity.y = 0;
      }
    }
    
    // Now check horizontal movement by iterating surrounding blocks
    const playerMin = new THREE.Vector3(
      adjustedPosition.x - this.playerRadius,
      adjustedPosition.y,
      adjustedPosition.z - this.playerRadius
    );
    const playerMax = new THREE.Vector3(
      adjustedPosition.x + this.playerRadius,
      adjustedPosition.y + this.playerHeight,
      adjustedPosition.z + this.playerRadius
    );
    
    // Get integer bounds
    const minX = Math.floor(playerMin.x);
    const minY = Math.floor(playerMin.y);
    const minZ = Math.floor(playerMin.z);
    const maxX = Math.ceil(playerMax.x);
    const maxY = Math.ceil(playerMax.y);
    const maxZ = Math.ceil(playerMax.z);
    
    // Check each block in the bounds
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          // Skip if this is the player's position
          if (y === Math.floor(adjustedPosition.y) && 
              x === Math.floor(adjustedPosition.x) && 
              z === Math.floor(adjustedPosition.z)) {
            continue;
          }
          
          // Check for solid block
          const block = this.worldManager.getBlockAt(x, y, z);
          if (!block || block.id === ElementType.WOOD) continue;
          
          // Block is solid, check for collision
          const blockMin = new THREE.Vector3(x, y, z);
          const blockMax = new THREE.Vector3(x + 1, y + 1, z + 1);
          
          // Calculate closest point on block to player cylinder center
          const closestPoint = new THREE.Vector3(
            Math.max(blockMin.x, Math.min(adjustedPosition.x, blockMax.x)),
            Math.max(blockMin.y, Math.min(adjustedPosition.y + this.playerHeight / 2, blockMax.y)),
            Math.max(blockMin.z, Math.min(adjustedPosition.z, blockMax.z))
          );
          
          // Calculate horizontal distance squared
          const dx = closestPoint.x - adjustedPosition.x;
          const dz = closestPoint.z - adjustedPosition.z;
          const distSq = dx * dx + dz * dz;
          
          // If distance is less than radius, we have a collision
          if (distSq < this.playerRadius * this.playerRadius) {
            // Calculate penetration depth
            const penetration = this.playerRadius - Math.sqrt(distSq);
            
            // Calculate normal direction
            const normal = new THREE.Vector3(dx, 0, dz).normalize();
            
            // Move player out of collision
            adjustedPosition.add(normal.multiplyScalar(penetration));
          }
        }
      }
    }
    
    return {
      newPosition: adjustedPosition,
      onGround
    };
  }
} 