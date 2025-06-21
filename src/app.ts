import {
  showError,
  checkWebGPUSupport,
  getCanvasElement,
  setCanvasSize,
} from "./utils/dom";
import {
  initializeMinimalWebGPU,
  type MinimalWebGPUState,
} from "./gpu/device-only";
import { createErosionScene } from "./scene";
import { renderGraphSystem, erosionSystem, type ECS } from "./ecs";
import { updateECSTree } from "./utils/ecs-tree";

interface AppState {
  ecs: ECS;
  gpu: MinimalWebGPUState;
  lastFrameTime: number;
}

// Setup resize handler for canvas and WebGPU resources
const setupResizeHandler = (appState: {
  ecs: ECS;
  gpu: MinimalWebGPUState;
}): void => {
  const handleResize = async () => {
    const width = Math.floor(window.innerWidth * 0.5); // Half width for canvas panel
    const height = window.innerHeight;

    setCanvasSize(appState.gpu.canvas, width, height);
    appState.ecs = createErosionScene(width, height);
    updateECSTree(appState.ecs);
  };

  // Initial resize
  handleResize();
  window.addEventListener("resize", handleResize);
};

const gameLoop = (appState: AppState): void => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - appState.lastFrameTime) / 1000;
  appState.lastFrameTime = currentTime;

  erosionSystem(appState.ecs, deltaTime);

  renderGraphSystem(appState.ecs, appState.gpu);

  // Update ECS tree visualization every few frames to avoid performance issues
  if (Math.floor(currentTime / 100) % 10 === 0) {
    updateECSTree(appState.ecs);
  }

  requestAnimationFrame(() => gameLoop(appState));
};

// Initialize and start the application
export const initializeApp = async (): Promise<void> => {
  // Check WebGPU support
  if (!checkWebGPUSupport()) {
    showError(
      "WebGPU Not Supported",
      "Your browser doesn't support WebGPU. Please use Chrome/Edge 113+ or Firefox with WebGPU enabled.",
    );
    return;
  }

  // Get canvas element
  const canvas = getCanvasElement();
  if (!canvas) {
    showError("Canvas Not Found", "Canvas element not found");
    return;
  }

  try {
    // Set initial canvas size (half width for split view)
    const width = Math.floor(window.innerWidth * 0.5);
    const height = window.innerHeight;
    setCanvasSize(canvas, width, height);

    // Initialize minimal WebGPU (device + context only)
    const gpu = await initializeMinimalWebGPU(canvas);

    // Create ECS
    const ecs = createErosionScene(width, height);

    // Initial ECS tree update
    updateECSTree(ecs);

    // Create app state
    const appState: AppState = {
      ecs,
      gpu,
      lastFrameTime: performance.now(),
    };

    // Setup resize handling
    setupResizeHandler(appState);

    // Start game loop
    gameLoop(appState);

    console.log("ECS + WebGPU initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize:", error);
    showError("Initialization Failed", `Error: ${error}`);
  }
};
