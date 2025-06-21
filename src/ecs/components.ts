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

export const COMPONENT_TYPES = {
  COMPUTE_PASS: "ComputePass",
  RENDER_PASS: "RenderPass",
  RESOURCE: "Resource",
  DEPENDENCY: "Dependency",
  EROSION_PARAMS: "ErosionParams",
  TRANSFORM: "Transform",
} as const;
