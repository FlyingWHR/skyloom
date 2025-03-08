import { create } from 'zustand'
import { ElementType } from '../elements/elementTypes'

interface BuildingState {
  isBuilding: boolean;
  selectedElement: ElementType;
  setBuilding: (isBuilding: boolean) => void;
  setSelectedElement: (element: ElementType) => void;
  toggleBuilding: () => void;
}

export const useBuildingStore = create<BuildingState>((set) => ({
  isBuilding: false,
  selectedElement: ElementType.EARTH,
  setBuilding: (isBuilding) => set({ isBuilding }),
  setSelectedElement: (element) => set({ selectedElement: element }),
  toggleBuilding: () => set((state) => ({ isBuilding: !state.isBuilding })),
})) 