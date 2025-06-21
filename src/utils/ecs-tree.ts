import type { ECS, EntityID, ComponentType } from "../ecs/types";

let highlightedEntityId: EntityID | null = null;

// Get a human-readable component type name
const getComponentTypeName = (type: ComponentType): string => {
  // Component types are already human-readable strings
  return type;
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

// Convert ECS to a serializable JSON structure
const serializeECS = (ecs: ECS): any => {
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

// Copy ECS structure as JSON to clipboard
const copyECSAsJSON = async (ecs: ECS): Promise<void> => {
  try {
    const serialized = serializeECS(ecs);
    const jsonString = JSON.stringify(serialized, null, 2);
    
    await navigator.clipboard.writeText(jsonString);
    
    // Show temporary success message
    const button = document.getElementById("copy-ecs-json") as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.style.background = "#28a745";
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "";
      }, 2000);
    }
  } catch (error) {
    console.error("Failed to copy ECS JSON:", error);
    
    // Show error message
    const button = document.getElementById("copy-ecs-json") as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = "Failed to copy";
      button.style.background = "#dc3545";
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "";
      }, 2000);
    }
  }
};

// Format component data for display with clickable entity references
const formatComponentData = (component: any, ecs: ECS): string => {
  if (!component || typeof component !== "object") {
    return String(component);
  }

  const formatValue = (value: any, key: string = ""): string => {
    if (Array.isArray(value)) {
      const formattedItems = value.map((item) => {
        if (isEntityReference(item, key, ecs)) {
          return `<span class="ecs-entity-ref" data-entity-id="${item}">Entity ${item}</span>`;
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
      return `<span class="ecs-entity-ref" data-entity-id="${value}">Entity ${value}</span>`;
    }
    return String(value);
  };

  const entries = Object.entries(component)
    .slice(0, 5) // Limit to first 5 properties
    .map(
      ([key, value]) =>
        `<span class="ecs-property">${key}</span>: <span class="ecs-value">${formatValue(value, key)}</span>`,
    )
    .join(", ");

  const hasMore = Object.keys(component).length > 5;
  return entries + (hasMore ? ", ..." : "");
};

// Get all components for a specific entity
const getEntityComponents = (
  entityId: EntityID,
  ecs: ECS,
): Map<ComponentType, any> => {
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

// Create HTML for a single entity
const createEntityHTML = (entityId: EntityID, ecs: ECS): string => {
  const components = getEntityComponents(entityId, ecs);
  const isHighlighted = highlightedEntityId === entityId;
  const highlightClass = isHighlighted ? " ecs-entity-highlighted" : "";

  let html = `
    <div class="ecs-entity${highlightClass}" data-entity-id="${entityId}">
      <div class="ecs-entity-header">Entity ${entityId}</div>
  `;

  for (const [componentType, component] of components) {
    const typeName = getComponentTypeName(componentType);
    const data = formatComponentData(component, ecs);

    html += `
      <div class="ecs-component">
        <span class="ecs-component-name">${typeName}</span>
        <div class="ecs-component-data">${data}</div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
};

// Handle entity reference clicks
const handleEntityRefClick = (event: Event): void => {
  const target = event.target as HTMLElement;
  if (target.classList.contains("ecs-entity-ref")) {
    const entityId = parseInt(target.getAttribute("data-entity-id") || "0", 10);
    highlightEntity(entityId);
  }
};

// Handle copy JSON button click
const handleCopyJSONClick = (ecs: ECS) => (event: Event): void => {
  event.preventDefault();
  copyECSAsJSON(ecs);
};

// Highlight an entity and scroll to it
const highlightEntity = (entityId: EntityID): void => {
  // Remove previous highlighting
  const previousHighlighted = document.querySelector(".ecs-entity-highlighted");
  if (previousHighlighted) {
    previousHighlighted.classList.remove("ecs-entity-highlighted");
  }

  // Set new highlighted entity
  highlightedEntityId = entityId;

  // Add highlighting to the target entity
  const targetEntity = document.querySelector(
    `[data-entity-id="${entityId}"].ecs-entity`,
  );
  if (targetEntity) {
    targetEntity.classList.add("ecs-entity-highlighted");

    // Scroll to the highlighted entity
    targetEntity.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Clear highlight after 3 seconds
    setTimeout(() => {
      if (highlightedEntityId === entityId) {
        targetEntity.classList.remove("ecs-entity-highlighted");
        highlightedEntityId = null;
      }
    }, 3000);
  }
};

// Update the ECS tree visualization
export const updateECSTree = (ecs: ECS): void => {
  const treeElement = document.getElementById("ecs-tree");
  if (!treeElement) return;

  let html = "";

  // Add copy JSON button at the top
  const stats = getECSStats(ecs);
  html += `
    <div class="ecs-controls">
      <button id="copy-ecs-json" class="ecs-copy-button">
        📋 Copy as JSON
      </button>
      <span class="ecs-stats">
        ${stats.entities} entities, ${stats.components} components
      </span>
    </div>
  `;

  // Sort entities by ID for consistent display
  const sortedEntities = Array.from(ecs.entities).sort((a, b) => a - b);

  for (const entityId of sortedEntities) {
    html += createEntityHTML(entityId, ecs);
  }

  if (sortedEntities.length === 0) {
    html +=
      '<div style="color: #666; font-style: italic;">No entities in ECS</div>';
  }

  treeElement.innerHTML = html;

  // Add click event listeners
  treeElement.removeEventListener("click", handleEntityRefClick);
  treeElement.addEventListener("click", handleEntityRefClick);

  // Add copy JSON button listener
  const copyButton = document.getElementById("copy-ecs-json");
  if (copyButton) {
    copyButton.addEventListener("click", handleCopyJSONClick(ecs));
  }
};

// Get ECS statistics
export const getECSStats = (
  ecs: ECS,
): { entities: number; components: number } => {
  let totalComponents = 0;
  for (const componentMap of ecs.components.values()) {
    totalComponents += componentMap.size;
  }

  return {
    entities: ecs.entities.size,
    components: totalComponents,
  };
};
