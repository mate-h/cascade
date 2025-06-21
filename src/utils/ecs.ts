import type { ECS, EntityID, ComponentType } from '../ecs/types';

// Get ECS statistics
export const getECSStats = (ecs: ECS): { entities: number; components: number } => {
  let totalComponents = 0;
  for (const componentMap of ecs.components.values()) {
    totalComponents += componentMap.size;
  }
  
  return {
    entities: ecs.entities.size,
    components: totalComponents,
  };
};

// Convert ECS to a serializable JSON structure
export const serializeECS = (ecs: ECS): any => {
  const serialized = {
    entities: Array.from(ecs.entities).sort((a, b) => a - b),
    components: {} as any,
    nextEntityId: ecs.nextEntityId,
  };

  // Convert components map to a more readable structure
  for (const [componentType, componentMap] of ecs.components) {
    serialized.components[componentType] = {};
    for (const [entityId, component] of componentMap) {
      serialized.components[componentType][entityId] = component;
    }
  }

  return serialized;
};

// Get all components for a specific entity
export const getEntityComponents = (entityId: EntityID, ecs: ECS): Map<ComponentType, any> => {
  const entityComponents = new Map<ComponentType, any>();
  
  // Iterate through all component types
  for (const [componentType, componentMap] of ecs.components) {
    const component = componentMap.get(entityId);
    if (component !== undefined) {
      entityComponents.set(componentType, component);
    }
  }
  
  return entityComponents;
};

// Check if a value is an entity ID in a specific context (dependency fields)
const isEntityReference = (value: any, key: string, ecs: ECS): boolean => {
  if (typeof value !== "number" || !ecs.entities.has(value)) {
    return false;
  }

  // Only treat numbers as entity references in these specific fields
  const entityReferenceFields = [
    "inputs",
    "outputs", 
    "dependencies",
    "targets",
    "sources",
  ];
  return entityReferenceFields.includes(key.toLowerCase());
};

// Format component data for display with clickable entity references
export const formatComponentData = (component: any, ecs: ECS): string => {
  if (!component || typeof component !== "object") {
    return String(component);
  }

  const formatValue = (value: any, key: string = ""): string => {
    if (Array.isArray(value)) {
      const formattedItems = value.map((item) => {
        if (isEntityReference(item, key, ecs)) {
          return `<span class="entity-ref" data-entity-id="${item}">Entity ${item}</span>`;
        }
        return String(item);
      });
      return `[${formattedItems.join(", ")}]`;
    }
    if (typeof value === "object" && value !== null) {
      return `{${Object.keys(value).length} props}`;
    }
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (isEntityReference(value, key, ecs)) {
      return `<span class="entity-ref" data-entity-id="${value}">Entity ${value}</span>`;
    }
    return String(value);
  };

  const entries = Object.entries(component)
    .slice(0, 5) // Limit to first 5 properties
    .map(
      ([key, value]) =>
        `<span class="text-entity-success">${key}</span>: <span class="text-entity-warning">${formatValue(value, key)}</span>`,
    )
    .join(", ");

  const hasMore = Object.keys(component).length > 5;
  return entries + (hasMore ? ", ..." : "");
}; 