import { Canvas } from '@react-three/fiber'
import { Environment } from './Environment'
import { Island } from './Island'
import { Player } from './Player'
import { BuildingSystem } from './BuildingSystem'

interface SceneProps {
  setMenuOpen: (isOpen: boolean) => void
}

export const Scene = ({ setMenuOpen }: SceneProps) => {
  return (
    <Canvas style={{ width: '100%', height: '100%' }}>
      {/* Strong lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      
      {/* Environment with stylized skybox */}
      <Environment />
      
      {/* Floating island */}
      <Island />
      
      {/* Building System */}
      <BuildingSystem />
      
      {/* Player controls */}
      <Player setMenuOpen={setMenuOpen} />
    </Canvas>
  )
} 