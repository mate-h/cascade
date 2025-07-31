# WebGPU + ECS + Svelte Style Guide

This document outlines the architectural patterns, coding conventions, and best practices established for this WebGPU-based 3D application using Entity Component System (ECS) architecture with Svelte.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Functional Programming Style](#functional-programming-style)
- [ECS Patterns](#ecs-patterns)
- [WebGPU Integration](#webgpu-integration)
- [File Organization](#file-organization)
- [Component Patterns](#component-patterns)
- [Error Handling](#error-handling)
- [Resource Management](#resource-management)
- [UI/UX Guidelines](#uiux-guidelines)

## Architecture Overview

### Core Principles

1. **Functional Programming First**: Prefer pure functions, immutable data, and function composition over classes and mutable state
2. **ECS Architecture**: All game/simulation logic organized around entities, components, and systems
3. **Separation of Concerns**: Clear boundaries between WebGPU rendering, ECS logic, and UI components
4. **Resource Safety**: Proper cleanup and resource management for WebGPU and event listeners

### System Architecture

```
App (Svelte)
├── ECS Core (Entity Component System)
│   ├── Components (Data containers)
│   ├── Systems (Logic processors)
│   └── Scene Builder (Entity creation)
├── WebGPU Layer (Minimal device management)
├── UI Components (Svelte components)
└── Utilities (Helper functions)
```

## Functional Programming Style

### Function Declarations

**✅ Preferred: Arrow Functions**
```typescript
const updateOrbitControls = (deltaX: number, deltaY: number): void => {
  // Implementation
};

const createMeshBuffers = (vertices: Float32Array, indices: Uint32Array, gpu: MinimalWebGPUState) => {
  // Implementation
  return { vertexBuffer, indexBuffer };
};
```

**❌ Avoid: Function Declarations**
```typescript
// Don't use this style
function updateOrbitControls(deltaX: number, deltaY: number): void {
  // Implementation
}
```

### State Management

**✅ Preferred: Functional Closures**
```typescript
const createOrbitControlHandlers = (ecs: ECS): OrbitControlHandlers => {
  const mouseState = createMouseState();

  const onMouseDown = (event: MouseEvent): void => {
    // Access mouseState through closure
  };

  return { onMouseDown, onMouseMove, onMouseUp };
};
```

**❌ Avoid: Classes with Mutable State**
```typescript
// Don't use this pattern
class OrbitControls {
  private mouseState: MouseState;
  
  constructor() {
    this.mouseState = createMouseState();
  }
}
```

### Data Immutability

**✅ Preferred: Immutable Updates**
```typescript
const updateCamera = (camera: CameraComponent, newPosition: [number, number, number]): CameraComponent => ({
  ...camera,
  position: newPosition,
});
```

**❌ Avoid: Direct Mutation (except for performance-critical ECS components)**
```typescript
// Only acceptable for ECS component updates
orbitControls.azimuth -= deltaX * orbitControls.rotationSpeed;
```

## ECS Patterns

### Component Definition

```typescript
export interface Transform3DComponent {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface MeshComponent {
  vertices: Float32Array;
  indices: Uint32Array;
  indexCount: number;
  gpuVertexBuffer?: GPUBuffer;
  gpuIndexBuffer?: GPUBuffer;
}
```

### System Implementation

```typescript
export const render3DSystem = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  try {
    if (!renderingResources.initialized) {
      initializeRenderingResources(ecs, gpu);
    }

    updateCamera(ecs, gpu);
    updateUniforms(ecs, gpu);
    render(ecs, gpu);
  } catch (error) {
    console.warn('WebGPU render error (possibly due to device loss):', error);
    renderingResources = createRenderingResources();
  }
};
```

### Entity Creation

```typescript
const createCubeEntity = (ecs: ECS, entityId: number): void => {
  addComponent(ecs, entityId, COMPONENT_TYPES.TRANSFORM_3D, {
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  });

  addComponent(ecs, entityId, COMPONENT_TYPES.MESH, {
    vertices: cubeVertices,
    indices: cubeIndices,
    indexCount: cubeIndices.length,
  });
};
```

## WebGPU Integration

### Minimal Device Setup

Keep WebGPU initialization minimal and focused:

```typescript
export interface MinimalWebGPUState {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
}

export const initializeMinimalWebGPU = async (
  canvas: HTMLCanvasElement,
): Promise<MinimalWebGPUState> => {
  const context = initializeCanvas(canvas);
  const device = await initializeDevice();
  configureContext(context, device);

  return { canvas, context, device };
};
```

### Resource Management

Always implement proper cleanup:

```typescript
export const cleanup3DSystem = (): void => {
  if (renderingResources.depthTexture) {
    renderingResources.depthTexture.destroy();
  }
  if (renderingResources.uniformBuffer) {
    renderingResources.uniformBuffer.destroy();
  }
  renderingResources = createRenderingResources();
};
```

### Error Handling

Wrap WebGPU operations in try-catch blocks:

```typescript
export const render3DSystem = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  try {
    // WebGPU operations
  } catch (error) {
    console.warn('WebGPU render error (possibly due to device loss):', error);
    // Reset resources for recovery
    renderingResources = createRenderingResources();
  }
};
```

## File Organization

### Directory Structure

```
src/
├── components/           # Svelte UI components
│   ├── CanvasPanel.svelte
│   ├── ECSPanel.svelte
│   ├── PropertiesPanel.svelte
│   ├── FloatingText.svelte
│   ├── EntityCard.svelte
│   ├── ComponentCard.svelte
│   ├── PropertyEditor.svelte
│   ├── BooleanEditor.svelte
│   ├── NumberEditor.svelte
│   └── StringEditor.svelte
├── ecs/                 # Entity Component System
│   ├── components.ts    # Component definitions
│   ├── index.ts        # ECS exports
│   ├── systems/        # System implementations
│   └── types.ts        # ECS type definitions
├── gpu/                # WebGPU utilities
│   ├── device-only.ts  # Minimal device setup
│   └── device.ts       # Canvas + device helpers
├── shaders/            # WGSL shader files
├── utils/              # Helper functions
│   ├── dom.ts
│   ├── ecs.ts
│   └── geometry.ts
├── app.ts              # Main application logic
├── main.ts             # Entry point
└── scene.ts            # Scene/entity creation
```

### Import Organization

```typescript
// External libraries first
import { mat4, vec3 } from 'wgpu-matrix';

// Internal imports by category
import type { ECS } from '../types';
import type { MinimalWebGPUState } from '../../gpu/device-only';
import { COMPONENT_TYPES } from '../components';

// Shader imports last
import sceneVertexShader from '../../shaders/scene-vertex.wgsl?raw';
import sceneFragmentShader from '../../shaders/scene-fragment.wgsl?raw';
```

## Component Patterns

### Svelte Component Structure

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  
  // Props and state
  let appState = $state<AppState | null>(null);
  let error = $state<string | null>(null);

  // Lifecycle management
  onMount(async () => {
    // Initialization
  });

  onDestroy(() => {
    // Cleanup
  });
</script>

<!-- Template with UnoCSS classes -->
<main class="relative w-screen h-screen bg-black font-mono text-[13px]">
  <!-- Content -->
</main>
```

### Event Handler Patterns

**✅ Preferred: Proper Event Options**
```typescript
canvas.addEventListener('wheel', handlers.onWheel, { passive: false });
```

**✅ Preferred: Cleanup Tracking**
```typescript
const canvasHandlers = new WeakMap<HTMLCanvasElement, OrbitControlHandlers>();

export const cleanupOrbitControls = (canvas: HTMLCanvasElement): void => {
  const handlers = canvasHandlers.get(canvas);
  if (handlers) {
    canvas.removeEventListener('mousedown', handlers.onMouseDown);
    // ... remove all listeners
    canvasHandlers.delete(canvas);
  }
};
```

## Error Handling

### Console Logging Standards

```typescript
// Success messages
console.log("Svelte + ECS + WebGPU initialized successfully!");

// Warnings for recoverable errors
console.warn('WebGPU render error (possibly due to device loss):', error);

// Errors for critical failures
console.error("App initialization failed:", err);
```

### Graceful Degradation

```typescript
const orbitControlsSystem = (ecs: ECS, canvas: HTMLCanvasElement): void => {
  // Guard clauses for missing dependencies
  const orbitComponents = ecs.components.get(COMPONENT_TYPES.ORBIT_CONTROLS);
  if (!orbitComponents) return;

  // Safe initialization check
  if (!initializedCanvases.has(canvas)) {
    const handlers = initializeCanvasControls(canvas, ecs);
    canvasHandlers.set(canvas, handlers);
    initializedCanvases.add(canvas);
  }
};
```

## Resource Management

### HMR (Hot Module Reload) Safety

Always implement proper cleanup for development:

```typescript
// In Svelte components
onDestroy(() => {
  if (appState) {
    stopApp(appState);
    appState = null;
  }
});

// In application logic
export const stopApp = (appState: AppState): void => {
  // Stop animation loops
  appState.isRunning = false;
  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
  }

  // Remove event listeners
  if (appState.resizeHandler) {
    window.removeEventListener("resize", appState.resizeHandler);
  }

  // Clean up WebGPU resources
  cleanup3DSystem();
  cleanupOrbitControls(appState.gpu.canvas);
};
```

### Memory Management

- Use `WeakMap` and `WeakSet` for object associations
- Destroy WebGPU resources explicitly
- Remove event listeners on cleanup
- Reset module-level state on HMR

## UI/UX Guidelines

### Typography and Spacing

- Font: Cascade Mono at 13px (`font-mono text-[13px]`)
- Line height: 1.4 (`leading-[1.4]`)
- Consistent spacing using Tailwind/UnoCSS classes

### Color Scheme

```css
/* Dark theme with subtle highlights */
background: black (#000000)
text: white (#ffffff)
secondary: gray-400 (#9ca3af)
highlight: subtle accent colors for selection states
```

### Layout Patterns

```svelte
<!-- Fullscreen with overlay -->
<main class="relative w-screen h-screen bg-black">
  <!-- Fullscreen canvas -->
  <CanvasPanel {appState} />
  
  <!-- Collapsible overlay panel -->
  <ECSPanel {appState} />
</main>
```

### Interactive Elements

- Cursor states: `cursor-grab` / `cursor-grabbing`
- Selection highlighting with color changes
- Collapsible panels with smooth transitions

## Dependencies and Tools

### Core Dependencies

- **Svelte 5**: UI framework with runes syntax
- **WebGPU**: Graphics API
- **wgpu-matrix**: WebGPU-optimized matrix operations
- **UnoCSS**: Utility-first CSS with Tailwind preset
- **TypeScript**: Type safety

### Development Tools

- **Vite**: Build tool with HMR
- **WGSL**: WebGPU Shading Language
- **Raw imports**: `import shader from './file.wgsl?raw'`

## Best Practices Summary

1. **Always use functional programming patterns**
2. **Implement proper resource cleanup**
3. **Handle WebGPU errors gracefully**
4. **Use ECS architecture consistently**
5. **Maintain clear separation of concerns**
6. **Write self-documenting code with good naming**
7. **Test HMR scenarios during development**
8. **Use TypeScript strictly (no `any` types)**
9. **Follow consistent import organization**
10. **Implement proper error boundaries**

---

This style guide should be updated as the project evolves and new patterns emerge.