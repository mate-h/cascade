// Initialize WebGPU context and return the canvas context
export const initializeCanvas = (
  canvas: HTMLCanvasElement,
): GPUCanvasContext => {
  const context = canvas.getContext("webgpu") as GPUCanvasContext;

  if (!context) {
    throw new Error("WebGPU not supported in this browser");
  }

  return context;
};

// Request WebGPU adapter and device
export const initializeDevice = async (): Promise<GPUDevice> => {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found");
  }

  return await adapter.requestDevice();
};

// Configure canvas context with device
export const configureContext = (
  context: GPUCanvasContext,
  device: GPUDevice,
): void => {
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: canvasFormat,
  });
};
