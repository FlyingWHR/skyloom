import { Canvas } from '@react-three/fiber'
import { Environment } from './Environment'
import { World } from './World'
import { Player } from './Player'
import { BuildingSystem } from './BuildingSystem'

interface SceneProps {
  setMenuOpen: (isOpen: boolean) => void;
  menuOpen: boolean;
}

export const Scene = ({ setMenuOpen, menuOpen }: SceneProps) => {
  return (
    <Canvas style={{ width: '100%', height: '100%' }}>
      {/* Strong lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      
      {/* Environment with stylized skybox */}
      <Environment />
      
      {/* Voxel world */}
      <World renderDistance={3} seed={12345} />
      
      {/* Building System */}
      <BuildingSystem />
      
      {/* Player controls */}
      <Player setMenuOpen={setMenuOpen} menuOpen={menuOpen} />
    </Canvas>
  )
} 