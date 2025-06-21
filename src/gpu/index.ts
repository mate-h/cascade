import { initializeCanvas, initializeDevice, configureContext } from "./device";
import {
  createComputeTexture,
  createSampler,
  createBindGroups,
} from "./resources";
import {
  createShaderModules,
  createComputePipeline,
  createRenderPipeline,
} from "./pipelines";
import type { WebGPUState } from "./types";

// Initialize complete WebGPU state
export const initializeWebGPU = async (
  canvas: HTMLCanvasElement,
): Promise<WebGPUState> => {
  const context = initializeCanvas(canvas);
  const device = await initializeDevice();

  configureContext(context, device);

  // Get canvas dimensions for texture size
  const textureWidth = canvas.width;
  const textureHeight = canvas.height;

  // Create ping-pong textures
  const textureA = createComputeTexture(device, textureWidth, textureHeight);
  const textureB = createComputeTexture(device, textureWidth, textureHeight);
  const sampler = createSampler(device);

  // Create shader modules
  const { vertexShaderModule, fragmentShaderModule, computeShaderModule } =
    createShaderModules(device);

  // Create pipelines
  const computePipeline = createComputePipeline(device, computeShaderModule);
  const renderPipeline = createRenderPipeline(
    device,
    vertexShaderModule,
    fragmentShaderModule,
  );

  // Create bind groups
  const { computeBindGroupA, computeBindGroupB, renderBindGroup } =
    createBindGroups(
      device,
      computePipeline,
      renderPipeline,
      textureA,
      textureB,
      sampler,
    );

  return {
    canvas,
    context,
    device,
    renderPipeline,
    computePipeline,
    textureA,
    textureB,
    sampler,
    renderBindGroup,
    computeBindGroupA,
    computeBindGroupB,
    textureWidth,
    textureHeight,
    currentFrame: 0,
  };
};

// Resize canvas and recreate textures
export const resizeCanvas = async (
  state: WebGPUState,
  width: number,
  height: number,
): Promise<WebGPUState> => {
  state.canvas.width = width;
  state.canvas.height = height;

  // If dimensions changed, recreate textures and bind groups
  if (width !== state.textureWidth || height !== state.textureHeight) {
    // Create new textures
    const textureA = createComputeTexture(state.device, width, height);
    const textureB = createComputeTexture(state.device, width, height);

    // Recreate bind groups with new textures
    const { computeBindGroupA, computeBindGroupB, renderBindGroup } =
      createBindGroups(
        state.device,
        state.computePipeline,
        state.renderPipeline,
        textureA,
        textureB,
        state.sampler,
      );

    return {
      ...state,
      textureA,
      textureB,
      renderBindGroup,
      computeBindGroupA,
      computeBindGroupB,
      textureWidth: width,
      textureHeight: height,
    };
  }

  return state;
};

// Re-export the render loop
export { createRenderLoop } from "./renderer";
