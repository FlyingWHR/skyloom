import { useState, useEffect } from 'react'
import { useBuildingStore } from '../../systems/building/buildingState'
import { ElementType, ELEMENT_PROPERTIES } from '../../systems/elements/elementTypes'
import '../../styles/ElementSelector.css'

export const ElementSelector = () => {
  const { isBuilding, selectedElement, selectElement } = useBuildingStore()
  const [activeHotbarSlot, setActiveHotbarSlot] = useState(0)
  
  // Map hotbar slots to element types
  const hotbarElements = [
    ElementType.WOOD,
    ElementType.EARTH,
    ElementType.METAL,
    ElementType.FIRE,
    ElementType.WATER
  ]
  
  // Handle keyboard number keys for hotbar selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '5') {
        const slot = parseInt(e.key) - 1
        setActiveHotbarSlot(slot)
        selectElement(hotbarElements[slot])
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotbarElements, selectElement])
  
  // If not in building mode, don't show the selector
  if (!isBuilding) return null
  
  return (
    <div className="element-selector-container">
      {/* Minecraft-style hotbar */}
      <div className="hotbar">
        {hotbarElements.map((element, index) => {
          const properties = ELEMENT_PROPERTIES[element]
          return (
            <div 
              key={element} 
              className={`hotbar-slot ${index === activeHotbarSlot ? 'active' : ''}`}
              onClick={() => {
                setActiveHotbarSlot(index)
                selectElement(element)
              }}
              style={{
                borderColor: index === activeHotbarSlot ? properties.color : undefined
              }}
            >
              <div 
                className="element-block" 
                style={{
                  backgroundColor: properties.color,
                  boxShadow: `inset 0 0 15px ${properties.emissive}` 
                }}
              ></div>
              <span className="slot-number">{index + 1}</span>
            </div>
          )
        })}
      </div>
      
      <div className="element-info">
        <h3>{ELEMENT_PROPERTIES[selectedElement].name}</h3>
      </div>
    </div>
  )
} 