import {
  showError,
  checkWebGPUSupport,
  getCanvasElement,
  setCanvasSize,
} from "./utils/dom";
import { initializeWebGPU, createRenderLoop, resizeCanvas } from "./gpu";
import type { RenderLoopController } from "./gpu/types";

// Setup resize handler for canvas and WebGPU resources
const setupResizeHandler = (
  renderLoopController: RenderLoopController,
): void => {
  const handleResize = async () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const currentState = renderLoopController.getState();
    const newState = await resizeCanvas(currentState, width, height);
    renderLoopController.setState(newState);
  };

  // Initial resize
  handleResize();
  window.addEventListener("resize", handleResize);
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
    // Set initial canvas size
    setCanvasSize(canvas);

    // Initialize WebGPU
    const webgpuState = await initializeWebGPU(canvas);

    // Create render loop controller
    const renderLoopController = createRenderLoop(webgpuState);

    // Setup resize handling
    setupResizeHandler(renderLoopController);

    // Start render loop
    renderLoopController.loop();

    console.log("WebGPU initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize WebGPU:", error);
    showError("WebGPU Initialization Failed", `Error: ${error}`);
  }
};
