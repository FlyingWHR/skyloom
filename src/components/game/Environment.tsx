import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import * as THREE from 'three'

export const Environment = () => {
  return (
    <>
      {/* Stylized sky */}
      <Sky 
        distance={450000} 
        sunPosition={[1, 0.1, -1]} 
        inclination={0.2}
        azimuth={0.25}
      />
      
      {/* Stars for decoration */}
      <Stars 
        radius={100} 
        depth={50} 
        count={1000} 
        factor={4} 
        fade
      />
      
      {/* Atmospheric fog */}
      <fog attach="fog" args={['#e78b5a', 30, 120]} />
    </>
  )
} 