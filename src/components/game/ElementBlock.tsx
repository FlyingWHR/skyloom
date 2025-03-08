import React, { useRef, useEffect } from 'react'
import { ElementType, ELEMENT_PROPERTIES } from '../../systems/elements/elementTypes'
import * as THREE from 'three'

interface ElementBlockProps {
  position: [number, number, number];
  type: ElementType;
  size?: number;
}

export const ElementBlock = ({ position, type, size = 1 }: ElementBlockProps) => {
  const properties = ELEMENT_PROPERTIES[type]
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Mark this as an element block for raycasting identification
  useEffect(() => {
    if (meshRef.current) {
      // Set identifying properties
      meshRef.current.userData = { 
        type: 'elementBlock', 
        elementType: type,
        position: [...position]
      }
      
      // Ensure geometry has computed face normals
      if (meshRef.current.geometry) {
        meshRef.current.geometry.computeVertexNormals();
        meshRef.current.geometry.computeBoundingSphere();
      }
      
      // Set name for easier debugging
      meshRef.current.name = `block-${type}-${position.join(',')}`;
    }
  }, [type, position])
  
  return (
    <mesh 
      ref={meshRef}
      position={position} 
      castShadow 
      receiveShadow
    >
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={properties.color}
        emissive={properties.emissive}
        emissiveIntensity={properties.emissiveIntensity}
        roughness={properties.roughness}
        metalness={properties.metalness}
      />
    </mesh>
  )
} 