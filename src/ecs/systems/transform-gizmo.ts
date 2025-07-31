import { vec3, mat4, type Vec3 } from "wgpu-matrix";
import type { ECS } from "../types";
import { getComponent } from "../types";
import type {
  Transform3DComponent,
  TransformGizmoComponent,
  CameraComponent,
  ActiveCamera,
} from "../components";
import { COMPONENT_TYPES } from "../components";
import type { MinimalWebGPUState } from "../../gpu/device-only";
import { CONFIG } from "../../config";

interface GizmoState {
  isDragging: boolean;
  dragAxis: "x" | "y" | "z" | "all" | null;
  dragStartPoint: Vec3;
  dragStartPosition: Vec3;
  selectedEntityId: number | null;
}

let gizmoState: GizmoState = {
  isDragging: false,
  dragAxis: null,
  dragStartPoint: vec3.create(0, 0, 0),
  dragStartPosition: vec3.create(0, 0, 0),
  selectedEntityId: null,
};

// Create gizmo geometry (arrows for translation)
const createGizmoArrows = (size: number = 1.0) => {
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  // X-axis arrow (red)
  const xColor = [1.0, 0.0, 0.0];
  // Shaft
  vertices.push(0, 0, 0, size, 0, 0);
  colors.push(...xColor, ...xColor);
  indices.push(0, 1);
  // Arrow head
  const headSize = size * 0.2;
  vertices.push(size, 0, 0, size - headSize, headSize, 0, size - headSize, -headSize, 0);
  colors.push(...xColor, ...xColor, ...xColor);
  indices.push(1, 2, 1, 3);

  // Y-axis arrow (green)
  const yColor = [0.0, 1.0, 0.0];
  // Shaft
  vertices.push(0, 0, 0, 0, size, 0);
  colors.push(...yColor, ...yColor);
  indices.push(4, 5);
  // Arrow head
  vertices.push(0, size, 0, headSize, size - headSize, 0, -headSize, size - headSize, 0);
  colors.push(...yColor, ...yColor, ...yColor);
  indices.push(5, 6, 5, 7);

  // Z-axis arrow (blue)
  const zColor = [0.0, 0.0, 1.0];
  // Shaft
  vertices.push(0, 0, 0, 0, 0, size);
  colors.push(...zColor, ...zColor);
  indices.push(8, 9);
  // Arrow head
  vertices.push(0, 0, size, headSize, 0, size - headSize, -headSize, 0, size - headSize);
  colors.push(...zColor, ...zColor, ...zColor);
  indices.push(9, 10, 9, 11);

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    colors: new Float32Array(colors),
  };
};

// Create gizmo geometry for rotation (circles)
const createGizmoRings = (size: number = 1.0) => {
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  const segments = 32;
  const xColor = [1.0, 0.0, 0.0];
  const yColor = [0.0, 1.0, 0.0];
  const zColor = [0.0, 0.0, 1.0];

  // X-axis ring (YZ plane)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = 0;
    const y = Math.cos(angle) * size;
    const z = Math.sin(angle) * size;
    vertices.push(x, y, z);
    colors.push(...xColor);
    if (i > 0) {
      indices.push(vertices.length / 3 - 2, vertices.length / 3 - 1);
    }
  }

  // Y-axis ring (XZ plane)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = Math.cos(angle) * size;
    const y = 0;
    const z = Math.sin(angle) * size;
    vertices.push(x, y, z);
    colors.push(...yColor);
    if (i > 0) {
      indices.push(vertices.length / 3 - 2, vertices.length / 3 - 1);
    }
  }

  // Z-axis ring (XY plane)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    const z = 0;
    vertices.push(x, y, z);
    colors.push(...zColor);
    if (i > 0) {
      indices.push(vertices.length / 3 - 2, vertices.length / 3 - 1);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    colors: new Float32Array(colors),
  };
};

// Create gizmo geometry for scaling (boxes)
const createGizmoBoxes = (size: number = 1.0) => {
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  const boxSize = size * 0.1;
  const xColor = [1.0, 0.0, 0.0];
  const yColor = [0.0, 1.0, 0.0];
  const zColor = [0.0, 0.0, 1.0];

  // X-axis box
  const xBox = [
    size - boxSize, -boxSize, -boxSize,
    size + boxSize, -boxSize, -boxSize,
    size + boxSize, boxSize, -boxSize,
    size - boxSize, boxSize, -boxSize,
    size - boxSize, -boxSize, boxSize,
    size + boxSize, -boxSize, boxSize,
    size + boxSize, boxSize, boxSize,
    size - boxSize, boxSize, boxSize,
  ];
  vertices.push(...xBox);
  for (let i = 0; i < 8; i++) {
    colors.push(...xColor);
  }

  // Y-axis box
  const yBox = [
    -boxSize, size - boxSize, -boxSize,
    boxSize, size - boxSize, -boxSize,
    boxSize, size + boxSize, -boxSize,
    -boxSize, size + boxSize, -boxSize,
    -boxSize, size - boxSize, boxSize,
    boxSize, size - boxSize, boxSize,
    boxSize, size + boxSize, boxSize,
    -boxSize, size + boxSize, boxSize,
  ];
  vertices.push(...yBox);
  for (let i = 0; i < 8; i++) {
    colors.push(...yColor);
  }

  // Z-axis box
  const zBox = [
    -boxSize, -boxSize, size - boxSize,
    boxSize, -boxSize, size - boxSize,
    boxSize, boxSize, size - boxSize,
    -boxSize, boxSize, size - boxSize,
    -boxSize, -boxSize, size + boxSize,
    boxSize, -boxSize, size + boxSize,
    boxSize, boxSize, size + boxSize,
    -boxSize, boxSize, size + boxSize,
  ];
  vertices.push(...zBox);
  for (let i = 0; i < 8; i++) {
    colors.push(...zColor);
  }

  // Generate indices for boxes (simplified - just edges)
  const baseIndices = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
  
  // X-axis box indices
  for (const index of baseIndices) {
    indices.push(index);
  }
  
  // Y-axis box indices
  for (const index of baseIndices) {
    indices.push(index + 8);
  }
  
  // Z-axis box indices
  for (const index of baseIndices) {
    indices.push(index + 16);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    colors: new Float32Array(colors),
  };
};

// Render gizmo for a selected entity
export const renderGizmo = (
  ecs: ECS,
  gpu: MinimalWebGPUState,
  selectedEntityId: number | null,
): void => {
  if (!CONFIG.ENABLE_TRANSFORM_GIZMO) {
    return;
  }
  if (selectedEntityId === null) return;

  const transform = getComponent<Transform3DComponent>(
    ecs,
    selectedEntityId,
    COMPONENT_TYPES.TRANSFORM_3D,
  );
  const gizmo = getComponent<TransformGizmoComponent>(
    ecs,
    selectedEntityId,
    COMPONENT_TYPES.TRANSFORM_GIZMO,
  );

  if (!transform || !gizmo || !gizmo.enabled) return;

  // Get active camera for view matrix
  const activeCameraEntities = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA) as Map<number, ActiveCamera> | undefined;
  let activeCameraEntityId: number | undefined;
  
  if (activeCameraEntities) {
    for (const [entityId, _] of activeCameraEntities) {
      activeCameraEntityId = entityId;
      break; // Take the first active camera
    }
  }
  
  console.log("Active camera entity ID:", activeCameraEntityId);
  
  if (!activeCameraEntityId) {
    console.log("No active camera found, returning");
    return;
  }

  // Create gizmo geometry based on mode
  let gizmoGeometry: { vertices: Float32Array; indices: Uint32Array; colors: Float32Array };
  switch (gizmo.mode) {
    case "translate":
      gizmoGeometry = createGizmoArrows(gizmo.size);
      break;
    case "rotate":
      gizmoGeometry = createGizmoRings(gizmo.size);
      break;
    case "scale":
      gizmoGeometry = createGizmoBoxes(gizmo.size);
      break;
    default:
      return;
  }

  // Create transformation matrix for gizmo
  const gizmoMatrix = mat4.identity();
  mat4.translate(gizmoMatrix, transform.position, gizmoMatrix);

  // Create vertex buffer for gizmo geometry
  const vertexData = new Float32Array(gizmoGeometry.vertices.length);
  for (let i = 0; i < gizmoGeometry.vertices.length; i += 3) {
    // Position (3 floats)
    vertexData[i] = gizmoGeometry.vertices[i];
    vertexData[i + 1] = gizmoGeometry.vertices[i + 1];
    vertexData[i + 2] = gizmoGeometry.vertices[i + 2];
    // Normal (3 floats) - set to unit vector for consistent lighting
    vertexData[i + 3] = 1.0;
    vertexData[i + 4] = 1.0;
    vertexData[i + 5] = 1.0;
    // Color (3 floats)
    vertexData[i + 6] = gizmoGeometry.colors[i];
    vertexData[i + 7] = gizmoGeometry.colors[i + 1];
    vertexData[i + 8] = gizmoGeometry.colors[i + 2];
  }

  // Create GPU buffers for gizmo
  const gizmoVertexBuffer = gpu.device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  gpu.device.queue.writeBuffer(gizmoVertexBuffer, 0, vertexData);

  const gizmoIndexBuffer = gpu.device.createBuffer({
    size: gizmoGeometry.indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  gpu.device.queue.writeBuffer(gizmoIndexBuffer, 0, gizmoGeometry.indices);

  // Create uniform buffer for gizmo
  const gizmoUniformBuffer = gpu.device.createBuffer({
    size: 288, // Same size as other uniform buffers
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Get active camera for view/projection matrices
  const cameraComponents = ecs.components.get(COMPONENT_TYPES.CAMERA) as Map<number, CameraComponent> | undefined;
  
  let gizmoCamera: CameraComponent | undefined;
  if (activeCameraEntityId && cameraComponents) {
    gizmoCamera = cameraComponents.get(activeCameraEntityId);
  }

  if (!gizmoCamera) {
    console.log("No gizmo camera found for entity", activeCameraEntityId, "returning");
    return;
  }
  console.log("Found gizmo camera:", gizmoCamera);

  // Create uniform data for gizmo
  const viewProjectionMatrix = mat4.multiply(gizmoCamera.projectionMatrix!, gizmoCamera.viewMatrix!);
  const time = Date.now() / 1000;
  const uniformData = new Float32Array(72);

  // Layout: view_projection, view, projection, model, camera_position, time
  uniformData.set(viewProjectionMatrix, 0);
  uniformData.set(gizmoCamera.viewMatrix!, 16);
  uniformData.set(gizmoCamera.projectionMatrix!, 32);
  uniformData.set(gizmoMatrix, 48);
  uniformData.set([0, 0, 0, 0], 64); // camera_position (not used for gizmo)
  uniformData[68] = time;

  gpu.device.queue.writeBuffer(gizmoUniformBuffer, 0, uniformData);

  // Create bind group for gizmo
  const gizmoBindGroup = gpu.device.createBindGroup({
    layout: gpu.device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }]
    }),
    entries: [{ binding: 0, resource: { buffer: gizmoUniformBuffer } }],
  });

  // Render gizmo using line pipeline
  const commandEncoder = gpu.device.createCommandEncoder();
  const textureView = gpu.context.getCurrentTexture().createView();
  
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [{
      view: textureView,
      loadOp: "load", // Don't clear, render over existing content
      storeOp: "store",
    }],
  };

  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
  
  // Set pipeline and bind group
  renderPass.setPipeline(gpu.device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: gpu.device.createShaderModule({ 
        code: `
          struct Uniforms {
            view_projection: mat4x4f,
            view: mat4x4f,
            projection: mat4x4f,
            model: mat4x4f,
            camera_position: vec4f,
            time: f32,
          }
          
          struct VertexInput {
            @location(0) position: vec3f,
            @location(1) normal: vec3f,
            @location(2) color: vec3f,
          }
          
          struct VertexOutput {
            @builtin(position) clip_position: vec4f,
            @location(0) world_position: vec3f,
            @location(1) normal: vec3f,
            @location(2) color: vec3f,
            @location(3) view_position: vec3f,
          }
          
          @group(0) @binding(0) var<uniform> uniforms: Uniforms;
          
          @vertex
          fn vs_main(input: VertexInput) -> VertexOutput {
            var output: VertexOutput;
            let world_position = uniforms.model * vec4f(input.position, 1.0);
            output.world_position = world_position.xyz;
            output.clip_position = uniforms.view_projection * world_position;
            output.normal = input.normal;
            output.color = input.color;
            let view_position = uniforms.view * world_position;
            output.view_position = view_position.xyz;
            return output;
          }
        `
      }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 9 * 4,
        attributes: [
          { format: "float32x3", offset: 0, shaderLocation: 0 },
          { format: "float32x3", offset: 12, shaderLocation: 1 },
          { format: "float32x3", offset: 24, shaderLocation: 2 },
        ],
      }],
    },
    fragment: {
      module: gpu.device.createShaderModule({ 
        code: `
          struct VertexOutput {
            @builtin(position) clip_position: vec4f,
            @location(0) world_position: vec3f,
            @location(1) normal: vec3f,
            @location(2) color: vec3f,
            @location(3) view_position: vec3f,
          }
          
          @fragment
          fn fs_main(input: VertexOutput) -> @location(0) vec4f {
            return vec4f(input.color, 1.0);
          }
        `
      }),
      entryPoint: "fs_main",
      targets: [{ format: "bgra8unorm" }],
    },
    primitive: {
      topology: "line-list",
    },
  }));
  
  renderPass.setBindGroup(0, gizmoBindGroup);
  renderPass.setVertexBuffer(0, gizmoVertexBuffer);
  renderPass.setIndexBuffer(gizmoIndexBuffer, "uint32");
  renderPass.drawIndexed(gizmoGeometry.indices.length);
  
  renderPass.end();
  gpu.device.queue.submit([commandEncoder.finish()]);

  // Clean up temporary buffers
  gizmoVertexBuffer.destroy();
  gizmoIndexBuffer.destroy();
  gizmoUniformBuffer.destroy();
};

// Handle mouse interaction with gizmo
export const handleGizmoInteraction = (
  ecs: ECS,
  mouseX: number,
  mouseY: number,
  isMouseDown: boolean,
  isMouseUp: boolean,
): void => {
  if (!CONFIG.ENABLE_TRANSFORM_GIZMO) {
    return;
  }
  if (gizmoState.selectedEntityId === null) return;

  const transform = getComponent<Transform3DComponent>(
    ecs,
    gizmoState.selectedEntityId,
    COMPONENT_TYPES.TRANSFORM_3D,
  );
  const gizmo = getComponent<TransformGizmoComponent>(
    ecs,
    gizmoState.selectedEntityId,
    COMPONENT_TYPES.TRANSFORM_GIZMO,
  );

  if (!transform || !gizmo) return;

  if (isMouseDown && !gizmoState.isDragging) {
    // Start dragging
    gizmoState.isDragging = true;
    gizmoState.dragStartPoint = vec3.create(mouseX, mouseY, 0);
    gizmoState.dragStartPosition = vec3.clone(transform.position);
    
    // TODO: Determine which axis was clicked
    gizmoState.dragAxis = gizmo.axis;
  } else if (isMouseUp && gizmoState.isDragging) {
    // Stop dragging
    gizmoState.isDragging = false;
    gizmoState.dragAxis = null;
  } else if (gizmoState.isDragging) {
    // Update position based on drag
    const deltaX = mouseX - gizmoState.dragStartPoint[0];
    const deltaY = mouseY - gizmoState.dragStartPoint[1];
    
    // TODO: Convert screen delta to world space movement
    // This would involve ray-plane intersection calculations
    
    // For now, just move in a simple way
    const sensitivity = 0.01;
    const newPosition = vec3.clone(gizmoState.dragStartPosition);
    
    if (gizmoState.dragAxis === "x" || gizmoState.dragAxis === "all") {
      newPosition[0] += deltaX * sensitivity;
    }
    if (gizmoState.dragAxis === "y" || gizmoState.dragAxis === "all") {
      newPosition[1] -= deltaY * sensitivity; // Invert Y for screen coordinates
    }
    if (gizmoState.dragAxis === "z" || gizmoState.dragAxis === "all") {
      newPosition[2] += (deltaX + deltaY) * sensitivity * 0.5;
    }
    
    // Apply snapping if enabled
    if (gizmo.snapToGrid) {
      newPosition[0] = Math.round(newPosition[0] / gizmo.gridSize) * gizmo.gridSize;
      newPosition[1] = Math.round(newPosition[1] / gizmo.gridSize) * gizmo.gridSize;
      newPosition[2] = Math.round(newPosition[2] / gizmo.gridSize) * gizmo.gridSize;
    }
    
    transform.position = newPosition;
  }
};

// Set selected entity for gizmo
export const setGizmoTarget = (entityId: number | null): void => {
  gizmoState.selectedEntityId = entityId;
  gizmoState.isDragging = false;
  gizmoState.dragAxis = null;
};

// Get current gizmo state
export const getGizmoState = (): GizmoState => gizmoState; 