import type { EntityID } from "./types";

export interface ComputePassComponent {
  shader: string;
  workgroups: [number, number, number];
  bindGroupLayout?: number;
}

export interface RenderPassComponent {
  vertexShader: string;
  fragmentShader: string;
  topology?: "triangle-list" | "triangle-strip";
  vertexCount?: number;
}

export interface ResourceComponent {
  type: "texture" | "buffer" | "sampler";
  format?: string;
  size?: [number, number];
  usage?: number;
  data?: ArrayBuffer;
  gpuResource?: GPUTexture | GPUBuffer | GPUSampler;
}

export interface DependencyComponent {
  inputs: EntityID[];
  outputs: EntityID[];
}

export interface ErosionParamsComponent {
  rainRate: number;
  evaporationRate: number;
  sedimentCapacity: number;
  minSlope: number;
  gravity: number;
  iterations: number;
}

export interface TransformComponent {
  width: number;
  height: number;
  scale: number;
}

// 3D Rendering Components
export interface Transform3DComponent {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface MeshComponent {
  vertices: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  indexCount: number;
  gpuVertexBuffer?: GPUBuffer;
  gpuIndexBuffer?: GPUBuffer;
}

export interface CameraComponent {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
  aspect: number;
  near: number;
  far: number;
  viewMatrix?: Float32Array;
  projectionMatrix?: Float32Array;
}

export interface MaterialComponent {
  color: [number, number, number];
  shininess: number;
}

export interface OrbitControlsComponent {
  azimuth: number;
  elevation: number;
  distance: number;
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
  rotationSpeed: number;
  zoomSpeed: number;
}

export const COMPONENT_TYPES = {
  COMPUTE_PASS: "ComputePass",
  RENDER_PASS: "RenderPass",
  RESOURCE: "Resource",
  DEPENDENCY: "Dependency",
  EROSION_PARAMS: "ErosionParams",
  TRANSFORM: "Transform",
  // 3D Components
  TRANSFORM_3D: "Transform3D",
  MESH: "Mesh",
  CAMERA: "Camera",
  MATERIAL: "Material",
  ORBIT_CONTROLS: "OrbitControls",
} as const;
