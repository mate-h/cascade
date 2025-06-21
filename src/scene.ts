import { createECS, createEntity, addComponent, type ECS } from "./ecs";
import {
  COMPONENT_TYPES,
  type ComputePassComponent,
  type RenderPassComponent,
  type ResourceComponent,
  type DependencyComponent,
  type ErosionParamsComponent,
  type TransformComponent,
  // 3D Components
  type Transform3DComponent,
  type MeshComponent,
  type CameraComponent,
  type MaterialComponent,
  type OrbitControlsComponent,
} from "./ecs/components";
import { createCube, createGrid, createVertexBuffer } from "./utils/geometry";

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

export const create3DScene = (width: number, height: number): ECS => {
  const ecs = createECS();

  // Create camera entity
  const camera = createEntity(ecs);
  addComponent<CameraComponent>(
    ecs,
    camera,
    COMPONENT_TYPES.CAMERA,
    {
      position: [5, 3, 5],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fov: Math.PI / 4, // 45 degrees
      aspect: width / height,
      near: 0.1,
      far: 100,
    },
  );

  // Create orbit controls for the camera
  addComponent<OrbitControlsComponent>(
    ecs,
    camera,
    COMPONENT_TYPES.ORBIT_CONTROLS,
    {
      azimuth: Math.PI / 4, // 45 degrees
      elevation: Math.PI / 6, // 30 degrees
      distance: 8,
      target: [0, 0, 0],
      minDistance: 1,
      maxDistance: 50,
      rotationSpeed: 0.01,
      zoomSpeed: 0.1,
    },
  );

  // Create cube entity
  const cube = createEntity(ecs);
  const cubeGeometry = createCube(2.0);
  const cubeVertexData = createVertexBuffer(cubeGeometry.vertices);
  
  addComponent<MeshComponent>(
    ecs,
    cube,
    COMPONENT_TYPES.MESH,
    {
      vertices: cubeVertexData,
      indices: new Uint32Array(cubeGeometry.indices),
      vertexCount: cubeGeometry.vertices.length,
      indexCount: cubeGeometry.indices.length,
    },
  );

  addComponent<Transform3DComponent>(
    ecs,
    cube,
    COMPONENT_TYPES.TRANSFORM_3D,
    {
      position: [0, 1, 0], // Elevated above ground
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  );

  addComponent<MaterialComponent>(
    ecs,
    cube,
    COMPONENT_TYPES.MATERIAL,
    {
      color: [0.8, 0.2, 0.2],
      shininess: 32,
    },
  );

  // Create grid entity
  const grid = createEntity(ecs);
  const gridGeometry = createGrid(20, 20);
  const gridVertexData = createVertexBuffer(gridGeometry.vertices);
  
  addComponent<MeshComponent>(
    ecs,
    grid,
    COMPONENT_TYPES.MESH,
    {
      vertices: gridVertexData,
      indices: new Uint32Array(gridGeometry.indices),
      vertexCount: gridGeometry.vertices.length,
      indexCount: gridGeometry.indices.length,
      topology: 'line-list',
    },
  );

  addComponent<Transform3DComponent>(
    ecs,
    grid,
    COMPONENT_TYPES.TRANSFORM_3D,
    {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  );

  addComponent<MaterialComponent>(
    ecs,
    grid,
    COMPONENT_TYPES.MATERIAL,
    {
      color: [0.5, 0.5, 0.5],
      shininess: 1,
    },
  );

  // Keep the erosion params for the UI
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

  return ecs;
};
