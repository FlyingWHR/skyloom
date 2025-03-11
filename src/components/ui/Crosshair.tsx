import { useEffect, useState } from 'react';
import { useBuildingStore } from '../../systems/building/buildingState';
import './Crosshair.css';

export const Crosshair = () => {
  const { isBuilding } = useBuildingStore();
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  
  // Check pointer lock state
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };
    
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    handlePointerLockChange(); // Initial check
    
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);
  
  // Only show crosshair when pointer is locked or in building mode
  if (!isPointerLocked && !isBuilding) return null;
  
  return (
    <div className="crosshair">
      <div className="crosshair-circle"></div>
    </div>
  );
}; 