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
  type ECS 
} from "./ecs";

export interface AppState {
  ecs: ECS;
  gpu: MinimalWebGPUState;
  lastFrameTime: number;
  isRunning: boolean;
  resizeHandler?: () => void;
}

let gameLoopId: number | null = null;

const gameLoop = (appState: AppState): void => {
  if (!appState.isRunning) return;

  const currentTime = performance.now();
  const deltaTime = (currentTime - appState.lastFrameTime) / 1000;
  appState.lastFrameTime = currentTime;

  // Update ECS systems
  erosionSystem(appState.ecs, deltaTime);
  orbitControlsSystem(appState.ecs, appState.gpu.canvas);
  render3DSystem(appState.ecs, appState.gpu);

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

  // Set initial canvas size for fullscreen
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Initialize minimal WebGPU (device + context only)
  const gpu = await initializeMinimalWebGPU(canvas);

  // Create ECS with 3D scene
  const ecs = create3DScene(width, height);

  // Setup resize handling
  const handleResize = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    canvas.width = newWidth;
    canvas.height = newHeight;
    resize3DSystem(appState.ecs, appState.gpu, newWidth, newHeight);
    appState.ecs = create3DScene(newWidth, newHeight);
  };

  window.addEventListener("resize", handleResize);

  // Create app state
  const appState: AppState = {
    ecs,
    gpu,
    lastFrameTime: performance.now(),
    isRunning: true,
    resizeHandler: handleResize,
  };

  // Start game loop
  gameLoop(appState);

  console.log("Svelte + ECS + WebGPU initialized successfully!");

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

  console.log("App stopped and cleaned up");
};
