export interface PropertyMetadata {
  min?: number;
  max?: number;
  step?: number;
  editable?: boolean;
  type?: string;
  vectorSize?: number;
}

// Default configurations for common property types
const defaultConfigs: Record<string, PropertyMetadata> = {
  // Common position/transform properties
  "position.x": { min: -1000, max: 1000, step: 0.1 },
  "position.y": { min: -1000, max: 1000, step: 0.1 },
  "position.z": { min: -1000, max: 1000, step: 0.1 },
  "rotation.x": { min: -Math.PI, max: Math.PI, step: 0.01 },
  "rotation.y": { min: -Math.PI, max: Math.PI, step: 0.01 },
  "rotation.z": { min: -Math.PI, max: Math.PI, step: 0.01 },
  "scale.x": { min: 0.01, max: 10, step: 0.01 },
  "scale.y": { min: 0.01, max: 10, step: 0.01 },
  "scale.z": { min: 0.01, max: 10, step: 0.01 },

  // Orbit controls - read-only properties
  "orbitcontrols.azimuth": { editable: false },
  "orbitcontrols.elevation": { editable: false },

  // Common shader/material properties
  opacity: { min: 0, max: 1, step: 0.01 },
  metallic: { min: 0, max: 1, step: 0.01 },
  roughness: { min: 0, max: 1, step: 0.01 },
  intensity: { min: 0, max: 10, step: 0.1 },

  // Common physics properties
  mass: { min: 0.1, max: 100, step: 0.1 },
  friction: { min: 0, max: 1, step: 0.01 },
  restitution: { min: 0, max: 1, step: 0.01 },

  // Generic numeric ranges
  speed: { min: 0, max: 100, step: 0.1 },
  radius: { min: 0.1, max: 50, step: 0.1 },
  height: { min: 0.1, max: 100, step: 0.1 },
  width: { min: 0.1, max: 100, step: 0.1 },
  depth: { min: 0.1, max: 100, step: 0.1 },

  far: { min: 0.1, max: 1000, step: 0.1 },
};

export function getPropertyConfig(
  componentType: string,
  propertyKey: string,
  value: any,
): PropertyMetadata {
  // Check if value is a vector (Float32Array or array with 2-4 components)
  if (Array.isArray(value) || value instanceof Float32Array) {
    const length = value.length;
    if (length >= 2 && length <= 4) {
      const vectorType = `vec${length}`;
      
      // Vector-specific configurations
      if (propertyKey === 'position') {
        return { 
          type: vectorType, 
          vectorSize: length,
          min: -10, 
          max: 10, 
          step: 0.1 
        };
      } else if (propertyKey === 'rotation') {
        return { 
          type: vectorType, 
          vectorSize: length,
          min: -Math.PI, 
          max: Math.PI, 
          step: 0.01 
        };
      } else if (propertyKey === 'scale') {
        return { 
          type: vectorType, 
          vectorSize: length,
          min: 0.01, 
          max: 10, 
          step: 0.01 
        };
      } else {
        // Generic vector config
        return { 
          type: vectorType, 
          vectorSize: length,
          min: -10, 
          max: 10, 
          step: 0.1 
        };
      }
    }
  }

  // Try exact match first
  const exactKey = `${componentType.toLowerCase()}.${propertyKey.toLowerCase()}`;
  if (defaultConfigs[exactKey]) {
    return defaultConfigs[exactKey];
  }

  // Try property name match
  const propertyMatch = defaultConfigs[propertyKey.toLowerCase()];
  if (propertyMatch) {
    return propertyMatch;
  }

  // Fallback based on value type and range
  if (typeof value === "number") {
    // Smart defaults based on value magnitude
    const absValue = Math.abs(value);
    if (absValue <= 1) {
      return { min: -1, max: 1, step: 0.01 };
    } else if (absValue <= 10) {
      return { min: -10, max: 10, step: 0.1 };
    } else if (absValue <= 100) {
      return { min: -100, max: 100, step: 1 };
    } else {
      return { min: -1000, max: 1000, step: 1 };
    }
  }

  return { editable: true };
}

export function isEditableProperty(value: any, componentType?: string, propertyKey?: string): boolean {
  const type = typeof value;
  const isEditableType = type === "number" || type === "string" || type === "boolean";
  
  // Check if value is a vector (Float32Array or array with 2-4 components)
  const isVector = (Array.isArray(value) || value instanceof Float32Array) && 
                   value.length >= 2 && value.length <= 4;
  
  // If we have component and property info, check if it's explicitly marked as non-editable
  if (componentType && propertyKey && (isEditableType || isVector)) {
    const config = getPropertyConfig(componentType, propertyKey, value);
    if (config.editable === false) {
      return false;
    }
  }
  
  return isEditableType || isVector;
}
