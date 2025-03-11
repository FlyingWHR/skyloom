import { create } from 'zustand'
import { ElementType } from '../elements/elementTypes'

export interface BuildingState {
  isBuilding: boolean;
  selectedElement: ElementType;
  toggleBuilding: () => void;
  setSelectedElement: (element: ElementType) => void;
  selectElement: (element: ElementType) => void;
}

export const useBuildingStore = create<BuildingState>((set) => ({
  isBuilding: false,
  selectedElement: ElementType.WOOD,
  
  toggleBuilding: () => set((state) => ({ isBuilding: !state.isBuilding })),
  
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  selectElement: (element) => set({ selectedElement: element })
})) 