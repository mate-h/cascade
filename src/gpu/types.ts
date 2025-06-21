// Types for our WebGPU state
export interface WebGPUState {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
  renderPipeline: GPURenderPipeline;
  computePipeline: GPUComputePipeline;
  textureA: GPUTexture;
  textureB: GPUTexture;
  sampler: GPUSampler;
  renderBindGroup: GPUBindGroup;
  computeBindGroupA: GPUBindGroup;
  computeBindGroupB: GPUBindGroup;
  textureWidth: number;
  textureHeight: number;
  currentFrame: number;
}

export interface RenderLoopController {
  loop: () => void;
  getState: () => WebGPUState;
  setState: (state: WebGPUState) => void;
}
