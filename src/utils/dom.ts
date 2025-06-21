// Check WebGPU browser support
export const checkWebGPUSupport = (): boolean => {
  return !!navigator.gpu;
};