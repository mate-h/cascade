import { writable } from 'svelte/store';

// Store for the currently selected entity ID
export const selectedEntityId = writable<number | null>(null);

// Helper function to select an entity
export const selectEntity = (entityId: number | null) => {
  selectedEntityId.set(entityId);
};

// Helper function to clear selection
export const clearSelection = () => {
  selectedEntityId.set(null);
}; 