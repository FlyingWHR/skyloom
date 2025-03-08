// Define element types
export enum ElementType {
  WOOD = 'wood',
  FIRE = 'fire',
  EARTH = 'earth',
  METAL = 'metal',
  WATER = 'water'
}

// Properties for each element
export interface ElementProperties {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  name: string;
}

// Define properties for each element type
export const ELEMENT_PROPERTIES: Record<ElementType, ElementProperties> = {
  [ElementType.WOOD]: {
    color: '#5d8c3a',
    emissive: '#3a5c25',
    emissiveIntensity: 0.2,
    roughness: 0.8,
    metalness: 0.1,
    name: '木 (Wood)'
  },
  [ElementType.FIRE]: {
    color: '#f5734d',
    emissive: '#ff5722',
    emissiveIntensity: 0.8,
    roughness: 0.4,
    metalness: 0.0,
    name: '火 (Fire)'
  },
  [ElementType.EARTH]: {
    color: '#c2934a',
    emissive: '#9b7b3d',
    emissiveIntensity: 0.1,
    roughness: 1.0,
    metalness: 0.0,
    name: '土 (Earth)'
  },
  [ElementType.METAL]: {
    color: '#a8b6c0',
    emissive: '#7a8590',
    emissiveIntensity: 0.3,
    roughness: 0.2,
    metalness: 0.9,
    name: '金 (Metal)'
  },
  [ElementType.WATER]: {
    color: '#4a80c2',
    emissive: '#3064a0',
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.2,
    name: '水 (Water)'
  }
} 