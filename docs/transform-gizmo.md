# TransformGizmo System

The TransformGizmo system allows you to select and manipulate entities directly in the 3D viewport using raycast-based selection and visual gizmos.

## Features

- **Raycast Selection**: Click on entities in the viewport to select them
- **Transform Gizmos**: Visual handles for translating, rotating, and scaling entities
- **Grid Snapping**: Optional grid snapping for precise positioning
- **Multi-axis Support**: Support for X, Y, Z, and all-axis manipulation

## Components

### SelectableComponent
Marks an entity as selectable via raycast.

```typescript
interface SelectableComponent {
  selectable: boolean;
}
```

### TransformGizmoComponent
Controls the gizmo behavior for an entity.

```typescript
interface TransformGizmoComponent {
  enabled: boolean;
  mode: "translate" | "rotate" | "scale";
  axis: "x" | "y" | "z" | "all";
  size: number;
  snapToGrid: boolean;
  gridSize: number;
}
```

## Usage

### 1. Making an Entity Selectable

Add the `SelectableComponent` to any entity you want to be selectable:

```typescript
addComponent<SelectableComponent>(ecs, entityId, COMPONENT_TYPES.SELECTABLE, {
  selectable: true,
});
```

### 2. Adding Transform Gizmo

Add the `TransformGizmoComponent` to enable manipulation:

```typescript
addComponent<TransformGizmoComponent>(ecs, entityId, COMPONENT_TYPES.TRANSFORM_GIZMO, {
  enabled: true,
  mode: "translate", // or "rotate", "scale"
  axis: "all", // or "x", "y", "z"
  size: 1.0,
  snapToGrid: false,
  gridSize: 1.0,
});
```

### 3. Selection and Manipulation

1. **Click** on an entity in the viewport to select it
2. **Drag** the gizmo handles to manipulate the entity
3. **Click** in empty space to deselect

## Systems

### Raycast System
- `raycastSystem()`: Performs raycast from screen coordinates
- `performRaycast()`: Core raycast logic against selectable entities
- `screenToWorldRay()`: Converts screen coordinates to world ray

### Transform Gizmo System
- `renderGizmo()`: Renders the gizmo for selected entities
- `handleGizmoInteraction()`: Handles mouse interaction with gizmos
- `setGizmoTarget()`: Sets the target entity for gizmo manipulation

## Integration

The system is automatically integrated into the main game loop and CanvasPanel component. The selection state is managed through the `selectedEntityId` store.

## Example Scene Setup

```typescript
// Create a cube entity
const cube = createEntity(ecs);

// Add required components
addComponent<Transform3DComponent>(ecs, cube, COMPONENT_TYPES.TRANSFORM_3D, {
  position: vec3.create(0, 1, 0),
  rotation: vec3.create(0, 0, 0),
  scale: vec3.create(1, 1, 1),
});

addComponent<MeshComponent>(ecs, cube, COMPONENT_TYPES.MESH, {
  // ... mesh data
});

// Make it selectable and manipulatable
addComponent<SelectableComponent>(ecs, cube, COMPONENT_TYPES.SELECTABLE, {
  selectable: true,
});

addComponent<TransformGizmoComponent>(ecs, cube, COMPONENT_TYPES.TRANSFORM_GIZMO, {
  enabled: true,
  mode: "translate",
  axis: "all",
  size: 1.0,
  snapToGrid: true,
  gridSize: 0.5,
});
```

## Future Enhancements

- [ ] Gizmo rendering using WebGPU
- [ ] Rotation gizmo implementation
- [ ] Scale gizmo implementation
- [ ] Multi-selection support
- [ ] Undo/redo functionality
- [ ] Custom gizmo shapes 