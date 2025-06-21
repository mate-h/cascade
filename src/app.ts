import {
  checkWebGPUSupport,
} from "./utils/dom";
import { initializeMinimalWebGPU, type MinimalWebGPUState } from "./gpu/device-only";
import { createErosionScene } from "./scene";
import { renderGraphSystem, erosionSystem, type ECS } from "./ecs";

export interface AppState {
  ecs: ECS;
  gpu: MinimalWebGPUState;
  lastFrameTime: number;
  isRunning: boolean;
}

let gameLoopId: number | null = null;

const gameLoop = (appState: AppState): void => {
  if (!appState.isRunning) return;
  
  const currentTime = performance.now();
  const deltaTime = (currentTime - appState.lastFrameTime) / 1000;
  appState.lastFrameTime = currentTime;
  
  erosionSystem(appState.ecs, deltaTime);
  renderGraphSystem(appState.ecs, appState.gpu);
  
  gameLoopId = requestAnimationFrame(() => gameLoop(appState));
};

// Initialize and start the application
export const initializeApp = async (): Promise<AppState> => {
  // Check WebGPU support
  if (!checkWebGPUSupport()) {
    throw new Error("WebGPU not supported. Please use Chrome/Edge 113+ or Firefox with WebGPU enabled.");
  }

  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  
  // Set initial canvas size (half width for split view)
  const width = Math.floor(window.innerWidth * 0.5);
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Initialize minimal WebGPU (device + context only)
  const gpu = await initializeMinimalWebGPU(canvas);

  // Create ECS
  const ecs = createErosionScene(width, height);

  // Create app state
  const appState: AppState = {
    ecs,
    gpu,
    lastFrameTime: performance.now(),
    isRunning: true,
  };

  // Setup resize handling
  const handleResize = () => {
    const newWidth = Math.floor(window.innerWidth * 0.5);
    const newHeight = window.innerHeight;
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    appState.ecs = createErosionScene(newWidth, newHeight);
  };

  window.addEventListener("resize", handleResize);

  // Start game loop
  gameLoop(appState);

  console.log("Svelte + ECS + WebGPU initialized successfully!");
  
  return appState;
};

export const stopApp = (appState: AppState): void => {
  appState.isRunning = false;
  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}; 