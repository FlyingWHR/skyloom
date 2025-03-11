import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WorldManager } from '../../systems/building/chunkSystem'

interface WorldProps {
  renderDistance?: number;
  seed?: number;
}

export const World = ({ renderDistance = 2, seed = 12345 }: WorldProps) => {
  const { scene } = useThree();
  const worldManagerRef = useRef<WorldManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize world manager
  useEffect(() => {
    const worldManager = new WorldManager(scene, seed);
    worldManagerRef.current = worldManager;
    setIsInitialized(true);
    
    // Generate initial chunks
    worldManager.updateChunksAround(0, 0, renderDistance);
    
    // Clean up on unmount
    return () => {
      // Nothing to clean up for now
    };
  }, [scene, seed, renderDistance]);
  
  // Update chunks when the camera/player moves
  useFrame(({ camera }) => {
    if (!worldManagerRef.current || !isInitialized) return;
    
    // Update chunks around camera position
    worldManagerRef.current.updateChunksAround(
      camera.position.x,
      camera.position.z,
      renderDistance
    );
  });
  
  // Expose world manager to window for debugging
  useEffect(() => {
    if (worldManagerRef.current) {
      (window as any).worldManager = worldManagerRef.current;
    }
  }, [isInitialized]);
  
  return null; // No direct rendering, chunks are added to scene directly
} 