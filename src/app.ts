import { checkWebGPUSupport } from "./utils/dom";
import {
  initializeMinimalWebGPU,
  type MinimalWebGPUState,
} from "./gpu/device-only";
import { create3DScene } from "./scene";
import {
  erosionSystem,
  render3DSystem,
  resize3DSystem,
  orbitControlsSystem,
  cleanupOrbitControls,
  cleanup3DSystem,
  raycastSystem,
  renderGizmo,
  handleGizmoInteraction,
  setGizmoTarget,
  type ECS,
} from "./ecs";
import { selectedEntityId } from "./stores/selection";

// Helper function to get current selected entity
let currentSelectedEntity: number | null = null;
selectedEntityId.subscribe(value => {
  currentSelectedEntity = value;
});

export interface AppState {
  ecs: ECS;
  gpu: MinimalWebGPUState;
  lastFrameTime: number;
  isRunning: boolean;
  resizeHandler?: () => void;
}

interface CanvasDimensions {
  displayWidth: number;
  displayHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  devicePixelRatio: number;
}

let gameLoopId: number | null = null;

// HiDPI helper functions following functional programming patterns
const getDevicePixelRatio = (): number => window.devicePixelRatio || 1;

const calculateCanvasDimensions = (
  displayWidth: number,
  displayHeight: number,
): CanvasDimensions => {
  const devicePixelRatio = getDevicePixelRatio();
  return {
    displayWidth,
    displayHeight,
    canvasWidth: Math.floor(displayWidth * devicePixelRatio),
    canvasHeight: Math.floor(displayHeight * devicePixelRatio),
    devicePixelRatio,
  };
};

const configureCanvasForHiDPI = (
  canvas: HTMLCanvasElement,
  dimensions: CanvasDimensions,
): void => {
  // Set the canvas buffer size to the actual pixels we want to draw
  canvas.width = dimensions.canvasWidth;
  canvas.height = dimensions.canvasHeight;

  // Set the canvas display size via CSS
  canvas.style.width = `${dimensions.displayWidth}px`;
  canvas.style.height = `${dimensions.displayHeight}px`;
};

const gameLoop = (appState: AppState): void => {
  if (!appState.isRunning) return;

  const currentTime = performance.now();
  const deltaTime = (currentTime - appState.lastFrameTime) / 1000;
  appState.lastFrameTime = currentTime;

  // Update ECS systems
  erosionSystem(appState.ecs, deltaTime);
  orbitControlsSystem(appState.ecs, appState.gpu.canvas);
  render3DSystem(appState.ecs, appState.gpu);
  
  // Render gizmo for selected entity
  renderGizmo(appState.ecs, appState.gpu, currentSelectedEntity);

  gameLoopId = requestAnimationFrame(() => gameLoop(appState));
};

// Initialize and start the application
export const initializeApp = async (): Promise<AppState> => {
  // Check WebGPU support
  if (!checkWebGPUSupport()) {
    throw new Error(
      "WebGPU not supported. Please use Chrome/Edge 113+ or Firefox with WebGPU enabled.",
    );
  }

  // Create a canvas element
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";

  // Calculate HiDPI dimensions for initial canvas size
  const initialDimensions = calculateCanvasDimensions(
    window.innerWidth,
    window.innerHeight,
  );
  configureCanvasForHiDPI(canvas, initialDimensions);

  // Initialize minimal WebGPU (device + context only)
  const gpu = await initializeMinimalWebGPU(canvas);

  // Create ECS with 3D scene using canvas buffer dimensions
  const ecs = create3DScene(
    initialDimensions.canvasWidth,
    initialDimensions.canvasHeight,
  );

  // Add canvas to DOM
  document.body.appendChild(canvas);

  // Create app state first
  const appState: AppState = {
    ecs,
    gpu,
    lastFrameTime: performance.now(),
    isRunning: true,
  };



  // Setup resize handling with HiDPI support
  const handleResize = () => {
    const newDimensions = calculateCanvasDimensions(
      window.innerWidth,
      window.innerHeight,
    );
    configureCanvasForHiDPI(canvas, newDimensions);

    // Reconfigure WebGPU context after canvas resize
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    appState.gpu.context.configure({
      device: appState.gpu.device,
      format: canvasFormat,
    });

    // Only update camera and depth texture, don't recreate the scene
    resize3DSystem(
      appState.ecs,
      appState.gpu,
      newDimensions.canvasWidth,
      newDimensions.canvasHeight,
    );
  };

  window.addEventListener("resize", handleResize);
  appState.resizeHandler = handleResize;

  // Start game loop
  gameLoop(appState);

  return appState;
};

export const stopApp = (appState: AppState): void => {
  appState.isRunning = false;

  // Cancel animation frame
  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }

  // Remove event listeners
  if (appState.resizeHandler) {
    window.removeEventListener("resize", appState.resizeHandler);
  }

  // Clean up orbit controls
  cleanupOrbitControls(appState.gpu.canvas);

  // Clean up 3D rendering resources
  cleanup3DSystem();

  // Clean up canvas
  const canvas = appState.gpu.canvas;
  if (canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
};
