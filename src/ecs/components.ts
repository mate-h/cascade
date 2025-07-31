import type { Vec2, Vec3 } from "wgpu-matrix";
import type { EntityID } from "./types";

export interface ComputePassComponent {
  shader: string;
  workgroups: Vec3;
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
  size?: Vec2;
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
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface MeshComponent {
  vertices: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  indexCount: number;
  topology?: "triangle-list" | "line-list";
  gpuVertexBuffer?: GPUBuffer;
  gpuIndexBuffer?: GPUBuffer;
}

// Camera properties excluding transform information (handled by Transform3D)
export interface CameraComponent {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  target: Vec3;
  up: Vec3;
  viewMatrix?: Float32Array;
  projectionMatrix?: Float32Array;
  showGizmo: boolean;
}

// Marker component to denote which camera is used for rendering
export type ActiveCamera = Record<string, never>;

export interface MaterialComponent {
  color: Vec3;
  shininess: number;
}

export interface OrbitControlsComponent {
  azimuth: number;
  elevation: number;
  distance: number;
  target: Vec3;
  minDistance: number;
  maxDistance: number;
  rotationSpeed: number;
  zoomSpeed: number;
  targetAzimuth?: number;
  targetElevation?: number;
  damping?: number;
}

export interface VisibilityComponent {
  visible: boolean;
}

// Text label component for 3D floating text
export interface TextLabelComponent {
  text: string;
  fontSize: number;
  color: string;
  padding: number;
  borderRadius: number;
  offset: Vec3; // Offset from the transform position
  alwaysVisible: boolean; // Whether to show even when behind objects
}

// Raycast and selection components
export interface SelectableComponent {
  selectable: boolean;
}

export interface TransformGizmoComponent {
  enabled: boolean;
  mode: "translate" | "rotate" | "scale";
  axis: "x" | "y" | "z" | "all";
  size: number;
  snapToGrid: boolean;
  gridSize: number;
}

export interface RaycastResult {
  entityId: EntityID;
  distance: number;
  point: Vec3;
  normal: Vec3;
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
  ACTIVE_CAMERA: "ActiveCamera",
  VISIBILITY: "Visibility",
  TEXT_LABEL: "TextLabel",
  // Selection and manipulation components
  SELECTABLE: "Selectable",
  TRANSFORM_GIZMO: "TransformGizmo",
} as const;
