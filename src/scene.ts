import { createECS, createEntity, addComponent, type ECS } from "./ecs";
import {
  COMPONENT_TYPES,
  type ComputePassComponent,
  type RenderPassComponent,
  type ResourceComponent,
  type DependencyComponent,
  type ErosionParamsComponent,
  type TransformComponent,
} from "./ecs/components";

export const createErosionScene = (width: number, height: number): ECS => {
  const ecs = createECS();

  const heightmapTextureA = createEntity(ecs);
  addComponent<ResourceComponent>(
    ecs,
    heightmapTextureA,
    COMPONENT_TYPES.RESOURCE,
    {
      type: "texture",
      format: "rgba32float",
      size: [width, height],
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    },
  );

  const heightmapTextureB = createEntity(ecs);
  addComponent<ResourceComponent>(
    ecs,
    heightmapTextureB,
    COMPONENT_TYPES.RESOURCE,
    {
      type: "texture",
      format: "rgba32float",
      size: [width, height],
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    },
  );

  const erosionParams = createEntity(ecs);
  addComponent<ErosionParamsComponent>(
    ecs,
    erosionParams,
    COMPONENT_TYPES.EROSION_PARAMS,
    {
      rainRate: 0.01,
      evaporationRate: 0.01,
      sedimentCapacity: 4.0,
      minSlope: 0.01,
      gravity: 4.0,
      iterations: 0,
    },
  );
  addComponent<TransformComponent>(
    ecs,
    erosionParams,
    COMPONENT_TYPES.TRANSFORM,
    {
      width,
      height,
      scale: 1.0,
    },
  );

  const erosionPass = createEntity(ecs);
  addComponent<ComputePassComponent>(
    ecs,
    erosionPass,
    COMPONENT_TYPES.COMPUTE_PASS,
    {
      shader: "erosion.wgsl",
      workgroups: [Math.ceil(width / 8), Math.ceil(height / 8), 1],
    },
  );
  addComponent<DependencyComponent>(
    ecs,
    erosionPass,
    COMPONENT_TYPES.DEPENDENCY,
    {
      inputs: [heightmapTextureA],
      outputs: [heightmapTextureB],
    },
  );

  const renderPass = createEntity(ecs);
  addComponent<RenderPassComponent>(
    ecs,
    renderPass,
    COMPONENT_TYPES.RENDER_PASS,
    {
      vertexShader: "vertex.wgsl",
      fragmentShader: "fragment.wgsl",
      topology: "triangle-list",
      vertexCount: 3,
    },
  );
  addComponent<DependencyComponent>(
    ecs,
    renderPass,
    COMPONENT_TYPES.DEPENDENCY,
    {
      inputs: [heightmapTextureB],
      outputs: [],
    },
  );

  return ecs;
};
