import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingStore } from '../../systems/building/buildingState'
import { useBlockStore } from '../../systems/building/blockStore'
import { snapToGrid } from '../../systems/building/gridSystem'
import { ElementBlock } from './ElementBlock'
import { ElementType, ELEMENT_PROPERTIES } from '../../systems/elements/elementTypes'
import { Html } from '@react-three/drei'

// Custom shader for ghost blocks that includes fresnel effect for edge highlighting
const createGhostShaderMaterial = (color: string) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: 0.5 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Simple shading
        gl_FragColor = vec4(color, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
};

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
  
  // Create the custom shader material once
  const ghostMaterial = useMemo(() => {
    return createGhostShaderMaterial(ELEMENT_PROPERTIES[selectedElement].color)
  }, [selectedElement]);
  
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
  
  // Function to get the world manager from the window object (added by World component)
  const getWorldManager = () => {
    return (window as any).worldManager || null;
  }
  
  // Update ghost block position based on raycaster
  useFrame(() => {
    if (!isBuilding) return;
    
    // Skip if not enough time has passed since last update
    const now = performance.now();
    if (now - lastUpdateTime.current < 50) return;
    lastUpdateTime.current = now;
    
    // Get world manager
    const worldManager = getWorldManager();
    if (!worldManager) return;

    // Cast ray from camera
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    
    // Find intersections with objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Filter out intersections with ghost block
    const filteredIntersects = intersects.filter(intersect => {
      return !intersect.object.userData.isGhost;
    });
    
    if (filteredIntersects.length > 0) {
      const intersect = filteredIntersects[0];
      
      // Get intersection point
      const point = intersect.point.clone();
      
      // Offset based on normal for placement
      const norm = intersect.normal ? intersect.normal.clone() : new THREE.Vector3(0, 1, 0);
      
      // Calculate grid position for the block
      const pos = snapToGrid(point.add(norm.multiplyScalar(0.5)));
      
      // Create extended vector with userData
      const extendedPos = pos as ExtendedVector3;
      extendedPos.userData = { onIsland: true };
      
      // Store normal for placement
      lastNormal.current = intersect.normal ? intersect.normal.clone() : new THREE.Vector3(0, 1, 0);
      
      // Check if we can place a block here
      const blockAtPosition = worldManager.getBlockAt(pos.x, pos.y, pos.z);
      canPlace.current = blockAtPosition === null || blockAtPosition?.id === ElementType.WOOD;
      
      // Update ghost block position
      targetPosition.current = extendedPos;
      
      // Count stable position frames
      if (lastPosition.current && lastPosition.current.equals(pos)) {
        stableCounter.current++;
      } else {
        stableCounter.current = 0;
        lastPosition.current = pos.clone();
      }
      
      // Only update ghost position when stable for a few frames
      if (stableCounter.current > 2) {
        setGhostPosition(extendedPos);
      }
    } else {
      // No intersection, hide ghost block
      lastNormal.current = null;
      targetPosition.current = null;
      setGhostPosition(null);
    }
  });
  
  // Handle mouse clicks for block placement/removal
  useEffect(() => {
    if (!isBuilding) return;
    
    const handleMouseDown = (event: MouseEvent) => {
      // Skip if no position is selected
      if (!ghostPosition || !canPlace.current) return;
      
      // Get world manager
      const worldManager = getWorldManager();
      if (!worldManager) return;
      
      // Left click: Place block
      if (event.button === 0) {
        worldManager.setBlockAt(
          ghostPosition.x,
          ghostPosition.y,
          ghostPosition.z,
          selectedElement
        );
      }
      
      // Right click: Remove block
      if (event.button === 2 && lastNormal.current) {
        // Calculate position of the block we're looking at (not the ghost block)
        const blockPos = ghostPosition.clone().sub(lastNormal.current);
        
        worldManager.removeBlockAt(
          blockPos.x,
          blockPos.y,
          blockPos.z
        );
      }
    };
    
    // Prevent context menu on right click
    const handleContextMenu = (event: Event) => {
      event.preventDefault();
    };
    
    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);
    
    // Clean up
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isBuilding, ghostPosition, selectedElement, canPlace]);
  
  // Smooth the position updates for ghost block
  useEffect(() => {
    if (ghostPosition) {
      setSmoothPosition(ghostPosition.clone());
    } else {
      setSmoothPosition(null);
    }
  }, [ghostPosition]);
  
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
  
  // Update camera position in the shader uniforms
  useFrame(({ camera }) => {
    if (ghostMaterial && ghostMaterial.uniforms && isBuilding && smoothPosition) {
      ghostMaterial.uniforms.camPos.value.copy(camera.position);
    }
  });
  
  // Create efficient ghost block with minimal overhead
  const createEfficientGhostBlock = () => {
    // Skip if not building or no position
    if (!isBuilding || !smoothPosition) return null;
    
    const elementColor = ELEMENT_PROPERTIES[selectedElement].color;
    
    return (
      <group position={[smoothPosition.x, smoothPosition.y, smoothPosition.z]}>
        {/* Simple semi-transparent cube - basic approach */}
        <mesh>
          <boxGeometry args={[0.98, 0.98, 0.98]} />
          <meshStandardMaterial
            color={elementColor}
            opacity={0.5}
            transparent={true}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Wireframe outline for clarity */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
          <lineBasicMaterial
            color="#FFFFFF"
          />
        </lineSegments>
        
        {/* ONLY add extra elements for the problematic sides */}
        
        {/* Extra back face outline with high visibility */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                -0.51, -0.51, -0.51,  // back bottom-left
                0.51, -0.51, -0.51,   // back bottom-right
                0.51, 0.51, -0.51,    // back top-right
                -0.51, 0.51, -0.51,   // back top-left
                -0.51, -0.51, -0.51   // back to bottom-left to close
              ])}
              count={5}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#FFFFFF" />
        </line>
        
        {/* Extra left face outline with high visibility */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                -0.51, -0.51, -0.51,  // back bottom-left
                -0.51, 0.51, -0.51,   // back top-left
                -0.51, 0.51, 0.51,    // front top-left
                -0.51, -0.51, 0.51,   // front bottom-left
                -0.51, -0.51, -0.51   // back to bottom-left to close
              ])}
              count={5}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#FFFFFF" />
        </line>
      </group>
    );
  };
  
  // Render ghost block and actual blocks
  return (
    <>
      {/* Efficient ghost block */}
      {createEfficientGhostBlock()}
      
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