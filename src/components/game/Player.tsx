import { useRef, useEffect, useCallback, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerControls } from '../../hooks/usePlayerControls'
import { useBuildingStore } from '../../systems/building/buildingState'
import { CollisionSystem, DEFAULT_PHYSICS_CONFIG } from '../../systems/physics/collisionSystem'
import { WorldManager } from '../../systems/building/chunkSystem'

// Extend window to include worldManager property
declare global {
  interface Window {
    worldManager?: WorldManager;
  }
}

// Player motion state for UI/HUD updates
export interface PlayerMotionState {
  isFlying: boolean;
  flyTransition: number; // 0-1 value
  onGround: boolean;
  speed: number;
  position: THREE.Vector3;
}

export const Player = ({ setMenuOpen, menuOpen }: { setMenuOpen: (isOpen: boolean) => void, menuOpen: boolean }) => {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  // Start at a safer position
  const position = useRef(new THREE.Vector3(0, 40, 0)) 
  const playerMeshRef = useRef<THREE.Group>(null)
  const menuJustClosedRef = useRef(false)
  const isManuallyClosingMenuRef = useRef(false)
  const onGround = useRef(false)
  const jumpCooldown = useRef(false)
  
  // Camera rotation euler
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  
  // Mode switching
  const [flyMode, setFlyMode] = useState(true)
  const flyTransitionRef = useRef(1) // Start in fly mode (1) instead of 0
  const flyAccelerationRef = useRef(0) // Current fly acceleration
  const MAX_FLY_ACCELERATION = 40
  const FLY_TRANSITION_SPEED = 1.5 // Speed of transition between modes
  
  // Track movement acceleration in all directions
  const movementAccelerationRef = useRef(0)
  
  // Player motion state for UI updates
  const [motionState, setMotionState] = useState<PlayerMotionState>({
    isFlying: true,
    flyTransition: 1,
    onGround: false,
    speed: 0,
    position: new THREE.Vector3(0, 40, 0)
  })
  
  const keys = usePlayerControls()
  const { isBuilding } = useBuildingStore()
  
  // State to track if we should lock the pointer (not needed in building mode)
  const shouldLockPointer = useRef(!isBuilding)
  
  // Reference to the collision system
  const collisionSystemRef = useRef<CollisionSystem | null>(null)
  
  // Effect to setup pointer lock events
  useEffect(() => {
    // Set initial position safely above ground
    position.current.set(0, 40, 0);
    
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    
    const onPointerLockChange = () => {
      if (document.pointerLockElement === canvas) {
        if (menuJustClosedRef.current) {
          menuJustClosedRef.current = false
        }
      } else if (!isManuallyClosingMenuRef.current) {
        setMenuOpen(true)
      }
      isManuallyClosingMenuRef.current = false
    }
    
    document.addEventListener('pointerlockchange', onPointerLockChange)
    
    if (!menuOpen && shouldLockPointer.current) {
      canvas.requestPointerLock()
    }
    
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [menuOpen, setMenuOpen])
  
  // Effect to track building mode changes
  useEffect(() => {
    shouldLockPointer.current = !isBuilding
    
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    
    if (isBuilding) {
      if (document.pointerLockElement === canvas) {
        isManuallyClosingMenuRef.current = true
        document.exitPointerLock()
      }
    } else {
      if (!menuOpen) {
        canvas.requestPointerLock()
      }
    }
  }, [isBuilding, menuOpen])
  
  // Effect to react to menu closing
  useEffect(() => {
    if (!menuOpen) {
      menuJustClosedRef.current = true
      
      const canvas = document.querySelector('canvas')
      if (canvas && shouldLockPointer.current) {
        canvas.requestPointerLock()
      }
    }
  }, [menuOpen])
  
  // Handle mouse movement for camera rotation
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = document.querySelector('canvas')
      if (document.pointerLockElement !== canvas) return
      
      // Adjust sensitivity based on your preference
      const sensitivity = 0.002
      
      // Update the euler rotation
      euler.current.y -= event.movementX * sensitivity
      euler.current.x -= event.movementY * sensitivity
      
      // Clamp the vertical rotation to prevent flipping
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x))
      
      // Apply the rotation to the camera
      camera.quaternion.setFromEuler(euler.current)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [camera])
  
  // Handle jumping with a cooldown
  const handleJump = useCallback(() => {
    if (onGround.current && !jumpCooldown.current) {
      // Apply jump velocity using default config
      velocity.current.y = DEFAULT_PHYSICS_CONFIG.jumpSpeed;
      
      // Start cooldown to prevent jump spam
      jumpCooldown.current = true;
      setTimeout(() => {
        jumpCooldown.current = false;
      }, 250);
    }
  }, []);
  
  // Effect to handle keyboard/mouse events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle fly mode with F key
      if (e.code === 'KeyF' && !e.repeat) {
        setFlyMode(prev => !prev)
        // Add a sound effect for mode toggle
        const audio = new Audio();
        audio.src = flyMode ? '/sounds/land.mp3' : '/sounds/whoosh.mp3';
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Error playing sound:', e));
      }
      
      // Toggle menu with Escape key
      if (e.code === 'Escape' && !menuOpen) {
        setMenuOpen(true)
      }
      
      // Jump with Space
      if (e.code === 'Space' && !e.repeat && !flyMode) {
        handleJump()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setMenuOpen, menuOpen, handleJump, flyMode]);
  
  // Calculate movement acceleration
  const updateMovementAcceleration = useCallback((delta: number, isMoving: boolean) => {
    if (isMoving) {
      // When moving, increase acceleration
      movementAccelerationRef.current = Math.min(
        movementAccelerationRef.current + delta * 40,
        MAX_FLY_ACCELERATION
      );
    } else {
      // When not moving, decrease acceleration
      movementAccelerationRef.current = Math.max(
        movementAccelerationRef.current - delta * 80,
        0
      );
    }
  }, []);
  
  // Call the building system tick method each frame
  useFrame((state, delta) => {
    if (menuOpen) return
    
    // Initialize collision system if not yet created
    if (!collisionSystemRef.current && window.worldManager) {
      collisionSystemRef.current = new CollisionSystem(window.worldManager)
    }
    
    // Update fly transition (smooth transition between modes)
    const targetTransition = flyMode ? 1 : 0
    flyTransitionRef.current = THREE.MathUtils.lerp(
      flyTransitionRef.current,
      targetTransition,
      delta * FLY_TRANSITION_SPEED
    )
    
    // Create movement direction vector
    const direction = new THREE.Vector3(0, 0, 0)
    
    // Apply movement relative to current camera view direction
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    
    // For directional movement, flatten vectors in walking mode
    const walkingFactor = Math.max(0, 1 - flyTransitionRef.current);
    
    if (walkingFactor > 0.5) {
      // In walking mode, flatten directions to be horizontal
      forward.y = 0;
      forward.normalize();
      right.y = 0;
      right.normalize();
    }
    
    // Track if player is moving for acceleration
    let isMoving = false;
    
    // Handle horizontal movement
    if (keys.forward) {
      direction.add(forward);
      isMoving = true;
    }
    if (keys.backward) {
      direction.sub(forward);
      isMoving = true;
    }
    if (keys.left) {
      direction.sub(right);
      isMoving = true;
    }
    if (keys.right) {
      direction.add(right);
      isMoving = true;
    }
    
    // Update directional movement acceleration
    updateMovementAcceleration(delta, isMoving);
    
    // Normalize direction for consistent speed in all directions
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Track vertical movement for acceleration
    let isMovingVertically = false;
    
    // Only apply vertical movement in fly mode
    if (flyTransitionRef.current > 0.1) {
      if (keys.up) {
        direction.y += 1;
        isMovingVertically = true;
      } else if (keys.down) {
        direction.y -= 1;
        isMovingVertically = true;
      }
      
      // Update vertical acceleration
      if (isMovingVertically) {
        flyAccelerationRef.current = Math.min(
          flyAccelerationRef.current + delta * 40, 
          MAX_FLY_ACCELERATION
        );
      } else {
        flyAccelerationRef.current = Math.max(
          flyAccelerationRef.current - delta * 80, 
          0
        );
      }
    }
    
    // Re-normalize if needed
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Base movement speed
    const baseSpeed = 5; 
    
    // Apply acceleration to both horizontal and vertical movement
    const horizontalAccelerationFactor = 1 + (movementAccelerationRef.current / MAX_FLY_ACCELERATION);
    const verticalAccelerationFactor = 1 + (flyAccelerationRef.current / MAX_FLY_ACCELERATION);
    
    // Calculate fly modifier - higher max acceleration and more responsive
    const flyModifier = flyTransitionRef.current * 2;
    
    // Adjust horizontal speed with fly modifier and acceleration
    const horizontalSpeed = baseSpeed * 
      (1 + (flyModifier * horizontalAccelerationFactor));
    
    // Adjust vertical speed (only in fly mode)
    const verticalSpeed = flyTransitionRef.current > 0.1 ? 
      baseSpeed * (1 + (flyModifier * verticalAccelerationFactor)) : 0;
    
    // More responsive acceleration in both flying and walking modes
    const acceleration = 15 * delta;
    
    // Apply velocity changes with smoother acceleration
    velocity.current.x = THREE.MathUtils.lerp(
      velocity.current.x, 
      direction.x * horizontalSpeed, 
      acceleration
    );
    
    velocity.current.z = THREE.MathUtils.lerp(
      velocity.current.z, 
      direction.z * horizontalSpeed, 
      acceleration
    );
    
    // Only apply vertical velocity in fly mode
    if (flyTransitionRef.current > 0.1) {
      velocity.current.y = THREE.MathUtils.lerp(
        velocity.current.y, 
        direction.y * verticalSpeed, 
        acceleration
      );
    }
    
    // Apply physics simulation if collision system is ready
    if (collisionSystemRef.current) {
      // Apply physics with appropriate flying state
      const physics = collisionSystemRef.current.update(
        delta,
        position.current,
        velocity.current,
        flyTransitionRef.current > 0.5 // Flying if transition is more than halfway
      );
      
      // Update position and velocity
      position.current.copy(physics.newPosition);
      velocity.current.copy(physics.newVelocity);
      onGround.current = physics.onGround;
      
      // Update visual feedback based on ground state
      if (onGround.current && !flyMode) {
        // Apply stronger friction when on ground and walking
        velocity.current.x *= 0.8;
        velocity.current.z *= 0.8;
      }
      
      // If in mostly fly mode, stop vertical movement when not pressing up/down
      if (flyTransitionRef.current > 0.8 && !isMovingVertically) {
        velocity.current.y *= 0.9; // Gradual slowdown
      }
      
      // Force player above the ground if falling through
      if (!flyMode && position.current.y < 0) {
        position.current.y = 40; // Reset to starting height
        velocity.current.y = 0;
      }
    } else {
      // Fallback without collision (keep old flying behavior)
      position.current.add(velocity.current.clone().multiplyScalar(delta));
    }
    
    // Update camera
    camera.position.copy(position.current);
    
    // Update player mesh (visual representation)
    if (playerMeshRef.current) {
      // Position slightly in front of camera
      const forward = new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion);
      const playerPos = position.current.clone().add(forward);
      playerPos.y -= 1.5; // Adjust down to be visible but not block view
      
      playerMeshRef.current.position.copy(playerPos);
      playerMeshRef.current.rotation.copy(camera.rotation);
    }
    
    // Update motion state for UI
    setMotionState({
      isFlying: flyMode,
      flyTransition: flyTransitionRef.current,
      onGround: onGround.current,
      speed: velocity.current.length(),
      position: position.current.clone()
    });
  });
  
  // Make motion state available to other components
  useEffect(() => {
    // @ts-ignore - Add to window for debugging and other components to access
    window.playerMotionState = motionState;
  }, [motionState]);
  
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
  );
}; 