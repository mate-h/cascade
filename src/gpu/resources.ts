// Create rgba16float texture with proper usage flags
export const createComputeTexture = (
  device: GPUDevice,
  width: number,
  height: number,
): GPUTexture => {
  return device.createTexture({
    label: "Compute Texture",
    size: { width, height },
    format: "rgba16float",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
  });
};

// Create sampler with linear filtering
export const createSampler = (device: GPUDevice): GPUSampler => {
  return device.createSampler({
    label: "Texture Sampler",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });
};

// Create bind groups for ping-pong rendering
export const createBindGroups = (
  device: GPUDevice,
  computePipeline: GPUComputePipeline,
  renderPipeline: GPURenderPipeline,
  textureA: GPUTexture,
  textureB: GPUTexture,
  sampler: GPUSampler,
) => {
  // Compute bind group A: reads from A, writes to B
  const computeBindGroupA = device.createBindGroup({
    label: "Compute Bind Group A",
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: textureA.createView(),
      },
      {
        binding: 1,
        resource: textureB.createView(),
      },
    ],
  });

  // Compute bind group B: reads from B, writes to A
  const computeBindGroupB = device.createBindGroup({
    label: "Compute Bind Group B",
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: textureB.createView(),
      },
      {
        binding: 1,
        resource: textureA.createView(),
      },
    ],
  });

  // Render bind group: always reads from texture A for display
  const renderBindGroup = device.createBindGroup({
    label: "Render Bind Group",
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: textureA.createView(),
      },
      {
        binding: 1,
        resource: sampler,
      },
    ],
  });

  return { computeBindGroupA, computeBindGroupB, renderBindGroup };
};
