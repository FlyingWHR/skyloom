import { create } from 'zustand'
import { ElementType } from '../elements/elementTypes'
import * as THREE from 'three'

export interface Block {
  id: string;
  position: THREE.Vector3;
  type: ElementType;
}

interface BlockState {
  blocks: Block[];
  addBlock: (position: THREE.Vector3, type: ElementType) => void;
  removeBlock: (id: string) => void;
  removeBlockAtPosition: (position: THREE.Vector3) => void;
  getBlockAtPosition: (position: THREE.Vector3) => Block | undefined;
}

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blocks: [],
  
  addBlock: (position, type) => {
    // Check if a block already exists at this position
    const existingBlock = get().getBlockAtPosition(position);
    if (existingBlock) return; // Don't add if already exists
    
    const id = generateId();
    const block = { id, position, type };
    
    set((state) => ({
      blocks: [...state.blocks, block]
    }));
    
    // Debug logging
    console.log(`Added block: ${type} at position: ${position.x}, ${position.y}, ${position.z}`);
    console.log(`Total blocks: ${get().blocks.length}`);
  },
  
  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter(block => block.id !== id)
    }))
  },
  
  removeBlockAtPosition: (position) => {
    set((state) => ({
      blocks: state.blocks.filter(block => 
        !(Math.abs(block.position.x - position.x) < 0.1 && 
          Math.abs(block.position.y - position.y) < 0.1 && 
          Math.abs(block.position.z - position.z) < 0.1)
      )
    }))
  },
  
  getBlockAtPosition: (position) => {
    return get().blocks.find(block => 
      Math.abs(block.position.x - position.x) < 0.1 && 
      Math.abs(block.position.y - position.y) < 0.1 && 
      Math.abs(block.position.z - position.z) < 0.1
    )
  },
})) 