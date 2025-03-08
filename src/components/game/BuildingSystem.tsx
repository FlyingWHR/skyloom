import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingStore } from '../../systems/building/buildingState'
import { useBlockStore } from '../../systems/building/blockStore'
import { snapToGrid } from '../../systems/building/gridSystem'
import { ElementBlock } from './ElementBlock'
import { ElementType, ELEMENT_PROPERTIES } from '../../systems/elements/elementTypes'

// Extended Vector3 type with userData
interface ExtendedVector3 extends THREE.Vector3 {
  userData?: {
    onIsland?: boolean;
    [key: string]: any;
  };
}

export const BuildingSystem = () => {
  const { camera, raycaster, scene } = useThree()
  const { isBuilding, selectedElement } = useBuildingStore()
  const { blocks, addBlock, removeBlockAtPosition } = useBlockStore()
  const [ghostPosition, setGhostPosition] = useState<ExtendedVector3 | null>(null)
  const lastUpdateTime = useRef(0)
  const lastPosition = useRef<ExtendedVector3 | null>(null)
  const targetPosition = useRef<ExtendedVector3 | null>(null)
  const lastNormal = useRef<THREE.Vector3 | null>(null)
  const canPlace = useRef(true)
  const stableCounter = useRef(0)
  const islandRef = useRef<THREE.Object3D | null>(null)
  const baseIslandY = useRef(0) // Base Y position of the island without animation
  
  // Keep track of which object we're facing
  const lastIntersectedObject = useRef<THREE.Object3D | null>(null)
  
  // Visual rendering position (smoothed)
  const [smoothPosition, setSmoothPosition] = useState<ExtendedVector3 | null>(null)
  
  // Find and store reference to the island
  useEffect(() => {
    // Find the island in the scene
    const findIsland = () => {
      const island = scene.children.find(child => 
        child.name === 'island' || 
        child.userData?.type === 'island'
      );
      
      if (island) {
        islandRef.current = island;
        // Store the base Y position (mid-point of animation)
        baseIslandY.current = island.position.y;
        console.log('Island found and referenced');
      } else {
        // Try to find by looking for a group with cylinders (island shape)
        const groups = scene.children.filter(child => child.type === 'Group');
        for (const group of groups) {
          // Check if any child has a cylinder geometry
          const hasCylinder = group.children.some(c => {
            if (c.type !== 'Mesh') return false;
            const mesh = c as THREE.Mesh;
            return mesh.geometry instanceof THREE.CylinderGeometry;
          });
          
          if (hasCylinder) {
            islandRef.current = group;
            baseIslandY.current = group.position.y;
            console.log('Island found by shape');
            break;
          }
        }
      }
    };
    
    findIsland();
    
    // If not found immediately, try again in a second
    if (!islandRef.current) {
      const timeout = setTimeout(findIsland, 1000);
      return () => clearTimeout(timeout);
    }
  }, [scene]);
  
  // Handle mouse events for building
  useEffect(() => {
    if (!isBuilding) return
    
    const handleClick = () => {
      // Use the stable position for placing blocks
      // Only place blocks when pointer is locked to avoid conflict with UI interactions
      if (targetPosition.current && canPlace.current && document.pointerLockElement && stableCounter.current > 5) {
        // If placing on the island, compensate for island animation
        let placementPosition = targetPosition.current.clone() as ExtendedVector3;
        
        // Add the block using the compensated position
        addBlock(placementPosition, selectedElement)
        
        // Add cooldown to prevent multiple placements
        canPlace.current = false
        setTimeout(() => {
          canPlace.current = true
        }, 250)
      }
    }
    
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      // Check if we're hitting an existing block and remove it
      if (isBuilding && document.pointerLockElement) {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
        const intersects = raycaster.intersectObjects(scene.children, true)
        
        if (intersects.length > 0) {
          const point = intersects[0].point
          const snappedPoint = snapToGrid(point)
          removeBlockAtPosition(snappedPoint)
          
          // Reset state after removal to prevent glitching
          lastIntersectedObject.current = null;
          lastNormal.current = null;
          stableCounter.current = 0;
        }
      }
    }
    
    window.addEventListener('click', handleClick)
    window.addEventListener('contextmenu', handleRightClick)
    
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('contextmenu', handleRightClick)
    }
  }, [isBuilding, selectedElement, addBlock, removeBlockAtPosition, camera, raycaster, scene])
  
  // Get the current island Y-offset from animation
  const getIslandYOffset = () => {
    if (!islandRef.current) return 0;
    return islandRef.current.position.y - baseIslandY.current;
  };
  
  // Helper to get a stable normal from an intersection
  const getStableNormal = (intersection: THREE.Intersection): THREE.Vector3 => {
    // If this is the same object as last time, reuse the normal to prevent jitter
    if (lastIntersectedObject.current === intersection.object && lastNormal.current) {
      return lastNormal.current;
    }
    
    // Get the face normal
    const normal = intersection.face?.normal.clone() || new THREE.Vector3(0, 1, 0);
    
    // Transform it to world space
    normal.transformDirection(intersection.object.matrixWorld);
    
    // Normalize and round the normal components to prevent tiny variations
    normal.normalize();
    normal.x = Math.round(normal.x * 10) / 10;
    normal.y = Math.round(normal.y * 10) / 10;
    normal.z = Math.round(normal.z * 10) / 10;
    normal.normalize();
    
    // Store for next time
    lastIntersectedObject.current = intersection.object;
    lastNormal.current = normal;
    
    return normal;
  };
  
  // Update ghost block position based on raycasting
  useFrame(({ clock }) => {
    // Only show ghost in building mode
    if (!isBuilding) {
      setGhostPosition(null)
      setSmoothPosition(null)
      targetPosition.current = null;
      lastPosition.current = null;
      lastIntersectedObject.current = null;
      lastNormal.current = null;
      stableCounter.current = 0;
      return
    }
    
    // In building mode, we can raycast even without pointer lock
    // Only skip raycasting if not in building mode and pointer isn't locked
    if (!isBuilding && !document.pointerLockElement) return
    
    // In building mode without pointer lock, we'll use a ray from the center of the screen
    // regardless of where the mouse is (UI interactions are handled separately)
    
    const currentTime = clock.getElapsedTime()
    // Limit update frequency to reduce flickering (debounce)
    if (currentTime - lastUpdateTime.current < 0.1) {
      // Still update smooth position even during debounce
      if (targetPosition.current && smoothPosition) {
        // Get current animation offset
        const yOffset = getIslandYOffset();
        
        // If we have a non-null target position, add the current island Y-offset
        const adjustedTarget = targetPosition.current.clone() as ExtendedVector3;
        if (isIslandChild(targetPosition.current)) {
          adjustedTarget.y += yOffset;
        }
        
        const newSmoothPos = smoothPosition.clone().lerp(adjustedTarget, 0.3) as ExtendedVector3;
        setSmoothPosition(newSmoothPos);
      }
      return;
    }
    
    // Cast ray from center of screen
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    
    // First check if we hit any existing blocks
    const allObjects = scene.children;
    
    // Get all objects that are marked as element blocks
    const elementBlocks = allObjects.filter(obj => 
      obj.userData?.type === 'elementBlock'
    );
    
    const blocks = scene.children.filter(obj => 
      obj.userData?.type === 'elementBlock' || 
      (obj.userData?.type === 'island') ||
      obj === islandRef.current
    );
    
    const intersects = raycaster.intersectObjects(blocks.length > 0 ? blocks : allObjects, true);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      
      // Don't place blocks too far away
      if (intersection.distance > 30) {
        if (ghostPosition) {
          setGhostPosition(null);
          setSmoothPosition(null);
          targetPosition.current = null;
          stableCounter.current = 0;
        }
        return;
      }
      
      // Get a stable normal
      const normal = getStableNormal(intersection);
      
      // Position offset by normal with a slightly smaller offset to reduce floating
      const position = intersection.point.clone().add(normal.multiplyScalar(0.5));
      const snappedPosition = snapToGrid(position) as ExtendedVector3;
      
      // Check if we're intersecting with the island or a child of the island
      const isTargetOnIsland = isIslandIntersection(intersection);
      
      // Store if the target is on the island for later use
      if (isTargetOnIsland) {
        // Initialize userData if it doesn't exist
        if (!snappedPosition.userData) {
          snappedPosition.userData = {};
        }
        snappedPosition.userData.onIsland = true;
      }
      
      // Calculate position in island local space to stabilize it
      let stablePosition = snappedPosition.clone() as ExtendedVector3;
      if (isTargetOnIsland && islandRef.current) {
        // Subtract current island animation offset to get a stable position
        const yOffset = getIslandYOffset();
        stablePosition.y -= yOffset;
      }
      
      // Check if position has changed significantly (using the stable position)
      if (!lastPosition.current || 
          lastPosition.current.distanceTo(stablePosition) > 0.1) {
        
        stableCounter.current = 0;
        
        // Check if position is already occupied
        const isOccupied = blocks.some(block => 
          block.userData?.type === 'elementBlock' &&
          Math.abs(block.position.x - stablePosition.x) < 0.1 && 
          Math.abs(block.position.y - stablePosition.y) < 0.1 && 
          Math.abs(block.position.z - stablePosition.z) < 0.1
        );
        
        if (!isOccupied) {
          // Store the stable position as target
          targetPosition.current = stablePosition.clone() as ExtendedVector3;
          lastPosition.current = stablePosition.clone() as ExtendedVector3;
          lastUpdateTime.current = currentTime;
          
          // Initialize smooth position if not set
          if (!smoothPosition) {
            setSmoothPosition(snappedPosition.clone() as ExtendedVector3);
          }
          
          // Only update the actual ghost position when we're stable
          setGhostPosition(stablePosition);
        } else {
          if (ghostPosition) {
            setGhostPosition(null);
            setSmoothPosition(null);
            targetPosition.current = null;
          }
        }
      } else {
        // Position is stable
        stableCounter.current++;
        
        // Gradually update smooth position to match target + current island offset
        if (targetPosition.current && smoothPosition) {
          // Get current animation offset
          const yOffset = getIslandYOffset();
          
          // If we have a non-null target position, add the current island Y-offset
          const adjustedTarget = targetPosition.current.clone() as ExtendedVector3;
          if (isIslandChild(targetPosition.current)) {
            adjustedTarget.y += yOffset;
          }
          
          const newSmoothPos = smoothPosition.clone().lerp(adjustedTarget, 0.3) as ExtendedVector3;
          setSmoothPosition(newSmoothPos);
        }
      }
    } else {
      // Only clear if we had a position before
      if (ghostPosition) {
        setGhostPosition(null);
        setSmoothPosition(null);
        targetPosition.current = null;
        stableCounter.current = 0;
      }
    }
  })
  
  // Helper function to check if a position is on the island
  const isIslandChild = (position: ExtendedVector3) => {
    return position.userData?.onIsland === true;
  };
  
  // Helper function to check if an intersection is with the island or its children
  const isIslandIntersection = (intersection: THREE.Intersection) => {
    if (!islandRef.current) return false;
    
    // Check if the object or any of its parents is the island
    let currentObj = intersection.object;
    while (currentObj) {
      if (currentObj === islandRef.current) {
        return true;
      }
      currentObj = currentObj.parent as THREE.Object3D;
    }
    
    return false;
  };
  
  // Render ghost block and actual blocks
  return (
    <>
      {/* Ghost block - using smooth position for visual rendering */}
      {isBuilding && smoothPosition && (
        <mesh
          position={[smoothPosition.x, smoothPosition.y, smoothPosition.z]}
          renderOrder={1} // Ensure ghost renders on top
        >
          <boxGeometry args={[0.98, 0.98, 0.98]} /> {/* Slightly smaller to avoid z-fighting */}
          <meshStandardMaterial
            color={ELEMENT_PROPERTIES[selectedElement].color}
            emissive={ELEMENT_PROPERTIES[selectedElement].emissive}
            emissiveIntensity={0.5}
            transparent={true}
            opacity={0.7}
            depthTest={true}
            depthWrite={false} // Prevent depth fighting
            side={THREE.FrontSide}
          />
        </mesh>
      )}
      
      {/* Actual blocks */}
      {blocks.map((block) => (
        <ElementBlock
          key={block.id}
          position={[block.position.x, block.position.y, block.position.z]}
          type={block.type}
        />
      ))}
    </>
  )
} 