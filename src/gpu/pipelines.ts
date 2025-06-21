import vertexShaderSource from "../shaders/vertex.wgsl?raw";
import fragmentShaderSource from "../shaders/fragment.wgsl?raw";
import computeShaderSource from "../shaders/compute.wgsl?raw";

// Create shader modules
export const createShaderModules = (device: GPUDevice) => {
  const vertexShaderModule = device.createShaderModule({
    label: "Vertex Shader",
    code: vertexShaderSource,
  });

  const fragmentShaderModule = device.createShaderModule({
    label: "Fragment Shader",
    code: fragmentShaderSource,
  });

  const computeShaderModule = device.createShaderModule({
    label: "Compute Shader",
    code: computeShaderSource,
  });

  return { vertexShaderModule, fragmentShaderModule, computeShaderModule };
};

// Create compute pipeline
export const createComputePipeline = (
  device: GPUDevice,
  computeShaderModule: GPUShaderModule,
): GPUComputePipeline => {
  return device.createComputePipeline({
    label: "Compute Pipeline",
    layout: "auto",
    compute: {
      module: computeShaderModule,
      entryPoint: "cs_main",
    },
  });
};

// Create render pipeline
export const createRenderPipeline = (
  device: GPUDevice,
  vertexShaderModule: GPUShaderModule,
  fragmentShaderModule: GPUShaderModule,
): GPURenderPipeline => {
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

  return device.createRenderPipeline({
    label: "Fullscreen Shader Pipeline",
    layout: "auto",
    vertex: {
      module: vertexShaderModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });
};
