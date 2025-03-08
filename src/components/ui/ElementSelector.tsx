import React from 'react'
import { ElementType, ELEMENT_PROPERTIES } from '../../systems/elements/elementTypes'
import { useBuildingStore } from '../../systems/building/buildingState'
import '../../styles/ElementSelector.css'

export const ElementSelector = () => {
  const { isBuilding, selectedElement, setSelectedElement, toggleBuilding } = useBuildingStore()
  
  // Function to lock pointer for building
  const lockPointerForBuilding = () => {
    const canvas = document.querySelector('canvas')
    if (canvas && !document.pointerLockElement) {
      canvas.requestPointerLock()
    }
  }
  
  return (
    <div className={`element-selector ${isBuilding ? 'active' : ''}`}>
      <button 
        className={`toggle-building ${isBuilding ? 'active' : ''}`}
        onClick={toggleBuilding}
      >
        {isBuilding ? 'Exit Building Mode' : 'Enter Building Mode'}
      </button>
      
      {isBuilding && (
        <>
          <div className="elements-container">
            {Object.values(ElementType).map((element) => (
              <div
                key={element}
                className={`element-item ${selectedElement === element ? 'selected' : ''}`}
                onClick={() => setSelectedElement(element)}
                style={{
                  backgroundColor: ELEMENT_PROPERTIES[element].color,
                  boxShadow: `0 0 10px ${ELEMENT_PROPERTIES[element].emissive}`
                }}
              >
                <span className="element-name">{ELEMENT_PROPERTIES[element].name}</span>
              </div>
            ))}
          </div>
          
          <button 
            className="lock-pointer"
            onClick={lockPointerForBuilding}
          >
            Lock View (Click to Build)
          </button>
          
          <div className="building-hint">
            <p>• Select an element above</p>
            <p>• Click "Lock View" to build</p>
            <p>• Press ESC to edit elements</p>
          </div>
        </>
      )}
    </div>
  )
} 