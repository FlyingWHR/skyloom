import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export const Island = () => {
  const islandRef = useRef<THREE.Group>(null)

  // Mark the island for identification
  useEffect(() => {
    if (islandRef.current) {
      islandRef.current.name = 'island';
      islandRef.current.userData = { 
        ...islandRef.current.userData,
        type: 'island'
      };
    }
  }, []);

  // Extremely subtle animation - practically imperceptible but still provides some movement
  useFrame(({ clock }) => {
    if (islandRef.current) {
      // Extremely small amplitude and very slow frequency
      islandRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;
    }
  })

  return (
    <group ref={islandRef} position={[0, 0, 0]}>
      {/* Base island */}
      <mesh receiveShadow castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[8, 10, 2, 6]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Green top surface */}
      <mesh receiveShadow castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[10, 10, 0.5, 6]} />
        <meshStandardMaterial color="#90EE90" roughness={1} />
      </mesh>
      
      {/* Center glowing element */}
      <mesh position={[0, 2, 0]}>
        <torusKnotGeometry args={[1, 0.3, 64, 8, 2, 3]} />
        <meshStandardMaterial 
          color="#4FACFE" 
          emissive="#4FACFE"
          emissiveIntensity={0.5}
          roughness={0.3} 
          metalness={0.7} 
        />
      </mesh>
    </group>
  )
} 