import type { ECS } from '../types';
import { COMPONENT_TYPES } from '../components';
import type { OrbitControlsComponent } from '../components';

interface MouseState {
  isDown: boolean;
  lastX: number;
  lastY: number;
}

interface OrbitControlHandlers {
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: (event: MouseEvent) => void;
  onWheel: (event: WheelEvent) => void;
  onContextMenu: (event: Event) => void;
}

const createMouseState = (): MouseState => ({
  isDown: false,
  lastX: 0,
  lastY: 0,
});

const createOrbitControlHandlers = (ecs: ECS): OrbitControlHandlers => {
  const mouseState = createMouseState();

  const updateOrbitControls = (deltaX: number, deltaY: number): void => {
    const orbitComponents = ecs.components.get(COMPONENT_TYPES.ORBIT_CONTROLS) as Map<number, OrbitControlsComponent> | undefined;
    if (!orbitComponents) return;

    for (const [, orbitControls] of orbitComponents) {
      orbitControls.azimuth -= deltaX * orbitControls.rotationSpeed;
      orbitControls.elevation = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, orbitControls.elevation - deltaY * orbitControls.rotationSpeed)
      );
    }
  };

  const updateOrbitControlsZoom = (delta: number): void => {
    const orbitComponents = ecs.components.get(COMPONENT_TYPES.ORBIT_CONTROLS) as Map<number, OrbitControlsComponent> | undefined;
    if (!orbitComponents) return;

    for (const [, orbitControls] of orbitComponents) {
      orbitControls.distance = Math.max(
        orbitControls.minDistance,
        Math.min(orbitControls.maxDistance, orbitControls.distance + delta * orbitControls.zoomSpeed)
      );
    }
  };

  const onMouseDown = (event: MouseEvent): void => {
    mouseState.isDown = true;
    mouseState.lastX = event.clientX;
    mouseState.lastY = event.clientY;
    
    const canvas = event.target as HTMLCanvasElement;
    canvas.style.cursor = 'grabbing';
  };

  const onMouseMove = (event: MouseEvent): void => {
    if (!mouseState.isDown) return;

    const deltaX = event.clientX - mouseState.lastX;
    const deltaY = event.clientY - mouseState.lastY;

    updateOrbitControls(-deltaX, -deltaY); 

    mouseState.lastX = event.clientX;
    mouseState.lastY = event.clientY;
  };

  const onMouseUp = (event: MouseEvent): void => {
    mouseState.isDown = false;
    
    const canvas = event.target as HTMLCanvasElement;
    canvas.style.cursor = 'grab';
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    
    const delta = event.deltaY * 0.01;
    updateOrbitControlsZoom(delta);
  };

  const onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  return { onMouseDown, onMouseMove, onMouseUp, onWheel, onContextMenu };
};

const initializeCanvasControls = (canvas: HTMLCanvasElement, ecs: ECS): OrbitControlHandlers => {
  const handlers = createOrbitControlHandlers(ecs);
  
  canvas.addEventListener('mousedown', handlers.onMouseDown);
  canvas.addEventListener('mousemove', handlers.onMouseMove);
  canvas.addEventListener('mouseup', handlers.onMouseUp);
  canvas.addEventListener('wheel', handlers.onWheel, { passive: false });
  canvas.addEventListener('contextmenu', handlers.onContextMenu);
  
  canvas.style.cursor = 'grab';

  return handlers;
};

// Store handlers for cleanup
const canvasHandlers = new WeakMap<HTMLCanvasElement, OrbitControlHandlers>();
const initializedCanvases = new WeakSet<HTMLCanvasElement>();

export const orbitControlsSystem = (ecs: ECS, canvas: HTMLCanvasElement): void => {
  if (!initializedCanvases.has(canvas)) {
    const handlers = initializeCanvasControls(canvas, ecs);
    canvasHandlers.set(canvas, handlers);
    initializedCanvases.add(canvas);
  }
};

export const cleanupOrbitControls = (canvas: HTMLCanvasElement): void => {
  const handlers = canvasHandlers.get(canvas);
  if (handlers) {
    canvas.removeEventListener('mousedown', handlers.onMouseDown);
    canvas.removeEventListener('mousemove', handlers.onMouseMove);
    canvas.removeEventListener('mouseup', handlers.onMouseUp);
    canvas.removeEventListener('wheel', handlers.onWheel);
    canvas.removeEventListener('contextmenu', handlers.onContextMenu);
    
    canvasHandlers.delete(canvas);
    initializedCanvases.delete(canvas);
  }
}; 