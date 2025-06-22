import { mat4, vec3, type Vec3 } from "wgpu-matrix";
import type { ECS } from "../types";
import type { MinimalWebGPUState } from "../../gpu/device-only";
import { COMPONENT_TYPES } from "../components";
import type {
  MeshComponent,
  CameraComponent,
  OrbitControlsComponent,
  VisibilityComponent,
  Transform3DComponent,
} from "../components";

// Import shaders
import sceneVertexShader from "../../shaders/scene-vertex.wgsl?raw";
import sceneFragmentShader from "../../shaders/scene-fragment.wgsl?raw";

interface RenderingResources {
  trianglePipeline?: GPURenderPipeline;
  linePipeline?: GPURenderPipeline;
  uniformBuffer?: GPUBuffer;
  triangleBindGroup?: GPUBindGroup;
  lineBindGroup?: GPUBindGroup;
  depthTexture?: GPUTexture;
  initialized: boolean;
}

const createRenderingResources = (): RenderingResources => ({
  trianglePipeline: undefined,
  linePipeline: undefined,
  uniformBuffer: undefined,
  triangleBindGroup: undefined,
  lineBindGroup: undefined,
  depthTexture: undefined,
  initialized: false,
});

let renderingResources: RenderingResources = createRenderingResources();

export const render3DSystem = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  try {
    if (!renderingResources.initialized) {
      initializeRenderingResources(ecs, gpu);
    }

    updateCamera(ecs, gpu);
    updateUniforms(ecs, gpu);
    render(ecs, gpu);
  } catch (error) {
    console.warn("WebGPU render error (possibly due to device loss):", error);
    // Reset resources to reinitialize on next frame
    renderingResources = createRenderingResources();
  }
};

const initializeRenderingResources = (
  ecs: ECS,
  gpu: MinimalWebGPUState,
): void => {
  renderingResources.depthTexture = createDepthTexture(gpu);
  renderingResources.uniformBuffer = createUniformBuffer(gpu);
  renderingResources.trianglePipeline = createRenderPipeline(
    gpu,
    "triangle-list",
  );
  renderingResources.linePipeline = createRenderPipeline(gpu, "line-list");
  renderingResources.triangleBindGroup = createBindGroups(
    gpu,
    renderingResources.trianglePipeline,
    renderingResources.uniformBuffer,
  );
  renderingResources.lineBindGroup = createBindGroups(
    gpu,
    renderingResources.linePipeline,
    renderingResources.uniformBuffer,
  );
  initializeMeshBuffers(ecs, gpu);

  renderingResources.initialized = true;
};

const createDepthTexture = (gpu: MinimalWebGPUState): GPUTexture => {
  return gpu.device.createTexture({
    size: [gpu.canvas.width, gpu.canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
};

const createUniformBuffer = (gpu: MinimalWebGPUState): GPUBuffer => {
  return gpu.device.createBuffer({
    size: 256, // Aligned uniform buffer size
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
};

const createRenderPipeline = (
  gpu: MinimalWebGPUState,
  topology: GPUPrimitiveTopology,
): GPURenderPipeline => {
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 9 * 4, // 9 floats per vertex (3 pos + 3 normal + 3 color)
    attributes: [
      { format: "float32x3", offset: 0, shaderLocation: 0 }, // position
      { format: "float32x3", offset: 12, shaderLocation: 1 }, // normal
      { format: "float32x3", offset: 24, shaderLocation: 2 }, // color
    ],
  };

  return gpu.device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: gpu.device.createShaderModule({ code: sceneVertexShader }),
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: gpu.device.createShaderModule({ code: sceneFragmentShader }),
      entryPoint: "fs_main",
      targets: [{ format: "bgra8unorm" }],
    },
    primitive: {
      topology: topology,
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });
};

const createBindGroups = (
  gpu: MinimalWebGPUState,
  renderPipeline: GPURenderPipeline,
  uniformBuffer: GPUBuffer,
): GPUBindGroup => {
  return gpu.device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });
};

const createMeshBuffers = (
  vertices: Float32Array,
  indices: Uint32Array,
  gpu: MinimalWebGPUState,
) => {
  // Create vertex buffer
  const vertexBuffer = gpu.device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

  // Create index buffer
  const indexBuffer = gpu.device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint32Array(indexBuffer.getMappedRange()).set(indices);
  indexBuffer.unmap();

  return { vertexBuffer, indexBuffer };
};

const initializeMeshBuffers = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  // Find all mesh components and create GPU buffers
  for (const [entityId, componentMap] of ecs.components) {
    if (entityId === COMPONENT_TYPES.MESH) {
      for (const [_, meshComponent] of componentMap as Map<
        number,
        MeshComponent
      >) {
        if (!meshComponent.gpuVertexBuffer) {
          const { vertexBuffer, indexBuffer } = createMeshBuffers(
            meshComponent.vertices,
            meshComponent.indices,
            gpu,
          );
          meshComponent.gpuVertexBuffer = vertexBuffer;
          meshComponent.gpuIndexBuffer = indexBuffer;
        }
      }
    }
  }
};

// Calculate the camera position in world-space for an orbit-controls style camera.
// wgpu-matrix represents vectors as `Float32Array` (`Vec3` type alias). Returning that
// directly ensures we can assign the result to `Transform3DComponent.position` without
// type assertions.
const calculateCameraPosition = (
  orbitControls: OrbitControlsComponent,
): Vec3 => {
  const x =
    orbitControls.distance *
    Math.cos(orbitControls.elevation) *
    Math.cos(orbitControls.azimuth);
  const y = orbitControls.distance * Math.sin(orbitControls.elevation);
  const z =
    orbitControls.distance *
    Math.cos(orbitControls.elevation) *
    Math.sin(orbitControls.azimuth);
  return vec3.fromValues(
    x + orbitControls.target[0],
    y + orbitControls.target[1],
    z + orbitControls.target[2],
  );
};

const updateCameraMatrices = (
  camera: CameraComponent,
  position: Vec3,
  gpu: MinimalWebGPUState,
): void => {
  camera.aspect = gpu.canvas.width / gpu.canvas.height;
  camera.projectionMatrix = mat4.perspective(
    camera.fov,
    camera.aspect,
    camera.near,
    camera.far,
  ) as Float32Array;
  camera.viewMatrix = mat4.lookAt(
    position,
    camera.target,
    camera.up,
  ) as Float32Array;
};

const updateCamera = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  const cameraComponents = ecs.components.get(COMPONENT_TYPES.CAMERA) as
    | Map<number, CameraComponent>
    | undefined;
  const orbitComponents = ecs.components.get(COMPONENT_TYPES.ORBIT_CONTROLS) as
    | Map<number, OrbitControlsComponent>
    | undefined;
  const transformComponents = ecs.components.get(
    COMPONENT_TYPES.TRANSFORM_3D,
  ) as Map<number, Transform3DComponent> | undefined;
  const activeCameras = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA) as
    | Map<number, {}>
    | undefined;

  if (!cameraComponents) return;

  for (const [entityId, camera] of cameraComponents) {
    if (activeCameras && !activeCameras.has(entityId)) continue; // skip non-active cameras if marker present

    const orbitControls = orbitComponents?.get(entityId);
    const transform = transformComponents?.get(entityId);

    if (orbitControls && transform) {
      const newPos = calculateCameraPosition(orbitControls);
      transform.position = newPos;
      camera.target = orbitControls.target;
      updateCameraMatrices(camera, newPos, gpu);
    } else if (transform) {
      updateCameraMatrices(camera, transform.position, gpu);
    }
  }
};

const createUniformData = (
  camera: CameraComponent,
  position: Vec3,
): Float32Array => {
  const viewProjectionMatrix = mat4.multiply(
    camera.projectionMatrix!,
    camera.viewMatrix!,
  );
  const time = Date.now() / 1000;
  const uniformData = new Float32Array(64); // 256 bytes / 4 = 64 floats

  // View-projection matrix (16 floats)
  uniformData.set(viewProjectionMatrix, 0);
  // View matrix (16 floats)
  uniformData.set(camera.viewMatrix!, 16);
  // Projection matrix (16 floats)
  uniformData.set(camera.projectionMatrix!, 32);
  // Camera position (3 floats, padded to 4)
  uniformData.set([position[0], position[1], position[2], 0], 48);
  // Time (1 float)
  uniformData[52] = time;

  return uniformData;
};

const updateUniforms = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  if (!renderingResources.uniformBuffer) return;

  const cameraComponents = ecs.components.get(COMPONENT_TYPES.CAMERA) as
    | Map<number, CameraComponent>
    | undefined;
  const transformComponents = ecs.components.get(
    COMPONENT_TYPES.TRANSFORM_3D,
  ) as Map<number, Transform3DComponent> | undefined;
  const activeCameras = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA) as
    | Map<number, {}>
    | undefined;
  if (!cameraComponents) return;

  for (const [entityId, camera] of cameraComponents) {
    if (activeCameras && !activeCameras.has(entityId)) continue;

    const transform = transformComponents?.get(entityId);
    if (!transform) continue;

    if (camera.viewMatrix && camera.projectionMatrix) {
      const uniformData = createUniformData(camera, transform.position);
      gpu.device.queue.writeBuffer(
        renderingResources.uniformBuffer,
        0,
        uniformData,
      );
      break; // Use first active camera found
    }
  }
};

const renderMeshesWithTopology = (
  renderPass: GPURenderPassEncoder,
  ecs: ECS,
  topology: "triangle-list" | "line-list",
): void => {
  const meshComponents = ecs.components.get(COMPONENT_TYPES.MESH) as
    | Map<number, MeshComponent>
    | undefined;
  const visibilityComponents = ecs.components.get(
    COMPONENT_TYPES.VISIBILITY,
  ) as Map<number, VisibilityComponent> | undefined;
  if (!meshComponents) return;

  for (const [entityId, mesh] of meshComponents) {
    // Check visibility
    if (visibilityComponents) {
      const vis = visibilityComponents.get(entityId);
      if (vis && vis.visible === false) {
        continue; // skip invisible meshes
      }
    }
    // Only render meshes with matching topology (default to triangle-list if not specified)
    const meshTopology = mesh.topology || "triangle-list";
    if (
      meshTopology === topology &&
      mesh.gpuVertexBuffer &&
      mesh.gpuIndexBuffer
    ) {
      renderPass.setVertexBuffer(0, mesh.gpuVertexBuffer);
      renderPass.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
      renderPass.drawIndexed(mesh.indexCount);
    }
  }
};

const createRenderPassDescriptor = (
  textureView: GPUTextureView,
  depthView: GPUTextureView,
): GPURenderPassDescriptor => ({
  colorAttachments: [
    {
      view: textureView,
      clearValue: { r: 0.051, g: 0.067, b: 0.09, a: 1.0 }, // #0D1117 (GitHub neutral-1) converted to RGB
      loadOp: "clear",
      storeOp: "store",
    },
  ],
  depthStencilAttachment: {
    view: depthView,
    depthClearValue: 1.0,
    depthLoadOp: "clear",
    depthStoreOp: "store",
  },
});

const COLOR_X: [number, number, number] = [0.973, 0.318, 0.286]; // red
const COLOR_Y: [number, number, number] = [0.247, 0.725, 0.314]; // green
const COLOR_Z: [number, number, number] = [0.345, 0.651, 1.0]; // blue
const COLOR_GOLD: [number, number, number] = [0.823, 0.6, 0.133];

const pushLine = (
  array: number[],
  a: Vec3,
  b: Vec3,
  col: [number, number, number],
) => {
  // position, normal (set to unit so that lighting uses vertex color), color
  array.push(a[0], a[1], a[2], 1, 1, 1, ...col);
  array.push(b[0], b[1], b[2], 1, 1, 1, ...col);
};

const drawCameraGizmos = (
  renderPass: GPURenderPassEncoder,
  ecs: ECS,
  gpu: MinimalWebGPUState,
): void => {
  const cams = ecs.components.get(COMPONENT_TYPES.CAMERA) as
    | Map<number, CameraComponent>
    | undefined;
  const transforms = ecs.components.get(COMPONENT_TYPES.TRANSFORM_3D) as
    | Map<number, Transform3DComponent>
    | undefined;
  if (!cams || !transforms) return;

  renderPass.setPipeline(renderingResources.linePipeline!);
  renderPass.setBindGroup(0, renderingResources.lineBindGroup!);

  cams.forEach((cam, id) => {
    if (!cam.showGizmo) return;
    // skip if the camera is active
    const activeCam = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA) as
      | Map<number, {}>
      | undefined;
    if (activeCam && activeCam.has(id)) return;

    const tr = transforms.get(id);
    if (!tr) return;

    const pos = tr.position as Vec3;
    const lines: number[] = [];

    // axes
    const size = 0.5;
    pushLine(lines, pos, vec3.add(pos, [size, 0, 0]), COLOR_X);
    pushLine(lines, pos, vec3.add(pos, [0, size, 0]), COLOR_Y);
    pushLine(lines, pos, vec3.add(pos, [0, 0, size]), COLOR_Z);

    // frustum lines
    const near = 1;
    const forward = vec3.normalize(vec3.subtract(cam.target as Vec3, pos));
    const right = vec3.normalize(vec3.cross(forward, cam.up as Vec3));
    const upv = vec3.cross(right, forward);
    const h = Math.tan(cam.fov * 0.5) * near;
    const w = h * cam.aspect;
    const center = vec3.add(pos, vec3.scale(forward, near));

    const cornerOffsets: Vec3[] = [
      vec3.add(vec3.scale(upv, h), vec3.scale(right, -w)),
      vec3.add(vec3.scale(upv, h), vec3.scale(right, w)),
      vec3.add(vec3.scale(upv, -h), vec3.scale(right, w)),
      vec3.add(vec3.scale(upv, -h), vec3.scale(right, -w)),
    ];
    const corners = cornerOffsets.map((off) => vec3.add(center, off));
    corners.forEach((c) => pushLine(lines, pos, c, COLOR_GOLD));
    for (let i = 0; i < 4; i++) {
      pushLine(lines, corners[i], corners[(i + 1) % 4], COLOR_GOLD);
    }

    const vertArray = new Float32Array(lines);
    const buf = gpu.device.createBuffer({
      size: vertArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(buf.getMappedRange()).set(vertArray);
    buf.unmap();
    renderPass.setVertexBuffer(0, buf);
    renderPass.draw(vertArray.length / 9);
  });
};

const render = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  if (
    !renderingResources.trianglePipeline ||
    !renderingResources.linePipeline ||
    !renderingResources.triangleBindGroup ||
    !renderingResources.lineBindGroup ||
    !renderingResources.depthTexture
  ) {
    return;
  }

  const commandEncoder = gpu.device.createCommandEncoder();
  const textureView = gpu.context.getCurrentTexture().createView();
  const depthView = renderingResources.depthTexture.createView();

  const renderPassDescriptor = createRenderPassDescriptor(
    textureView,
    depthView,
  );
  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

  // Render triangle meshes
  renderPass.setPipeline(renderingResources.trianglePipeline);
  renderPass.setBindGroup(0, renderingResources.triangleBindGroup);
  renderMeshesWithTopology(renderPass, ecs, "triangle-list");

  // Render line meshes
  renderPass.setPipeline(renderingResources.linePipeline);
  renderPass.setBindGroup(0, renderingResources.lineBindGroup);
  renderMeshesWithTopology(renderPass, ecs, "line-list");

  // Draw camera gizmos
  drawCameraGizmos(renderPass, ecs, gpu);

  renderPass.end();
  gpu.device.queue.submit([commandEncoder.finish()]);
};

export const resize3DSystem = (
  ecs: ECS,
  gpu: MinimalWebGPUState,
  width: number,
  height: number,
): void => {
  // Recreate depth texture
  if (renderingResources.depthTexture) {
    renderingResources.depthTexture.destroy();
    renderingResources.depthTexture = gpu.device.createTexture({
      size: [width, height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  // Update camera aspect ratio
  const cameraComponents = ecs.components.get(COMPONENT_TYPES.CAMERA) as
    | Map<number, CameraComponent>
    | undefined;
  if (cameraComponents) {
    for (const [, camera] of cameraComponents) {
      camera.aspect = width / height;
      camera.projectionMatrix = mat4.perspective(
        camera.fov,
        camera.aspect,
        camera.near,
        camera.far,
      ) as Float32Array;
    }
  }
};

export const cleanup3DSystem = (): void => {
  if (renderingResources.depthTexture) {
    renderingResources.depthTexture.destroy();
  }
  if (renderingResources.uniformBuffer) {
    renderingResources.uniformBuffer.destroy();
  }
  renderingResources = createRenderingResources();
};
