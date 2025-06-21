// Minimal WebGPU device initialization for ECS system
export interface MinimalWebGPUState {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
}

export const initializeCanvas = (
  canvas: HTMLCanvasElement,
): GPUCanvasContext => {
  const context = canvas.getContext("webgpu") as GPUCanvasContext;

  if (!context) {
    throw new Error("WebGPU not supported in this browser");
  }

  return context;
};

export const initializeDevice = async (): Promise<GPUDevice> => {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found");
  }

  return await adapter.requestDevice();
};

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

export const initializeMinimalWebGPU = async (
  canvas: HTMLCanvasElement,
): Promise<MinimalWebGPUState> => {
  const context = initializeCanvas(canvas);
  const device = await initializeDevice();

  configureContext(context, device);

  return {
    canvas,
    context,
    device,
  };
};
