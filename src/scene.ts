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
  type VisibilityComponent,
  type ActiveCamera,
  type TextLabelComponent,
  type SelectableComponent,
  type TransformGizmoComponent,
} from "./ecs/components";
import { createCube, createGrid, createVertexBuffer } from "./utils/geometry";
import { activeCameraId } from "./stores/camera";
import { vec2, vec3 } from "wgpu-matrix";

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
      size: vec2.create(width, height),
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
      size: vec2.create(width, height),
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
      workgroups: vec3.create(Math.ceil(width / 8), Math.ceil(height / 8), 1),
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
  addComponent<CameraComponent>(ecs, camera, COMPONENT_TYPES.CAMERA, {
    fov: Math.PI / 4, // 45 degrees
    aspect: width / height,
    near: 0.1,
    far: 200,
    up: vec3.create(0, 1, 0),
    showGizmo: true,
    target: vec3.create(0, 0, 0),
  });

  // Add transform for camera position / rotation
  addComponent<Transform3DComponent>(
    ecs,
    camera,
    COMPONENT_TYPES.TRANSFORM_3D,
    {
      position: vec3.create(5, 3, 5),
      rotation: vec3.create(0, 0, 0),
      scale: vec3.create(1, 1, 1),
    },
  );

  // Mark as active camera
  addComponent<ActiveCamera>(ecs, camera, COMPONENT_TYPES.ACTIVE_CAMERA, {});

  activeCameraId.set(camera);

  // Add text label to main camera
  addComponent<TextLabelComponent>(ecs, camera, COMPONENT_TYPES.TEXT_LABEL, {
    text: "Main Camera",
    fontSize: 13,
    color: "#ffffff",
    padding: 3,
    borderRadius: 3,
    offset: vec3.create(0, 0.5, 0), // Slightly above camera
    alwaysVisible: true,
  });

  // Create orbit controls for the camera
  addComponent<OrbitControlsComponent>(
    ecs,
    camera,
    COMPONENT_TYPES.ORBIT_CONTROLS,
    {
      azimuth: Math.PI / 4, // 45 degrees
      elevation: Math.PI / 6, // 30 degrees
      distance: 8,
      target: vec3.create(0, 0, 0),
      minDistance: 1,
      maxDistance: 100,
      rotationSpeed: 0.01,
      zoomSpeed: 1.0,
      targetAzimuth: Math.PI / 4,
      targetElevation: Math.PI / 6,
      damping: 0.3,
    },
  );

  // Create second camera (game camera)
  const gameCam = createEntity(ecs);
  addComponent<CameraComponent>(ecs, gameCam, COMPONENT_TYPES.CAMERA, {
    fov: Math.PI / 3,
    aspect: width / height,
    near: 0.1,
    far: 100,
    up: vec3.create(0, 1, 0),
    showGizmo: true,
    target: vec3.create(0, 0, 0),
  });
  addComponent<Transform3DComponent>(
    ecs,
    gameCam,
    COMPONENT_TYPES.TRANSFORM_3D,
    {
      position: vec3.create(0, 6, 12),
      rotation: vec3.create(0, 0, 0),
      scale: vec3.create(1, 1, 1),
    },
  );

  // Add text label to game camera
  addComponent<TextLabelComponent>(ecs, gameCam, COMPONENT_TYPES.TEXT_LABEL, {
    text: "Game Camera",
    fontSize: 13,
    color: "#ffffff",
    padding: 3,
    borderRadius: 3,
    offset: vec3.create(0, 0.5, 0), // Slightly above camera
    alwaysVisible: true,
  });

  // Create cube entity
  const cube = createEntity(ecs);
  const cubeGeometry = createCube(2.0);
  const cubeVertexData = createVertexBuffer(cubeGeometry.vertices);

  addComponent<MeshComponent>(ecs, cube, COMPONENT_TYPES.MESH, {
    vertices: cubeVertexData,
    indices: new Uint32Array(cubeGeometry.indices),
    vertexCount: cubeGeometry.vertices.length,
    indexCount: cubeGeometry.indices.length,
  });

  addComponent<Transform3DComponent>(ecs, cube, COMPONENT_TYPES.TRANSFORM_3D, {
    position: vec3.create(0, 0, 0), // Elevated above grid (bottom face at Y=1)
    rotation: vec3.create(0, 0, 0),
    scale: vec3.create(1, 1, 1),
  });

  addComponent<MaterialComponent>(ecs, cube, COMPONENT_TYPES.MATERIAL, {
    color: vec3.create(0.8, 0.2, 0.2),
    shininess: 32,
  });

  // Add visibility component
  addComponent<VisibilityComponent>(ecs, cube, COMPONENT_TYPES.VISIBILITY, {
    visible: true,
  });

  // Add text label to cube
  addComponent<TextLabelComponent>(ecs, cube, COMPONENT_TYPES.TEXT_LABEL, {
    text: "Red Cube",
    fontSize: 13,
    color: "#ffffff",
    padding: 3,
    borderRadius: 4,
    offset: vec3.create(0, 2.5, 0), // Above the cube
    alwaysVisible: false,
  });

  // Make cube selectable and add transform gizmo
  addComponent<SelectableComponent>(ecs, cube, COMPONENT_TYPES.SELECTABLE, {
    selectable: true,
  });

  addComponent<TransformGizmoComponent>(ecs, cube, COMPONENT_TYPES.TRANSFORM_GIZMO, {
    enabled: true,
    mode: "translate",
    axis: "all",
    size: 1.0,
    snapToGrid: false,
    gridSize: 1.0,
  });

  // Create grid entity
  const grid = createEntity(ecs);
  const gridGeometry = createGrid(20, 20);
  const gridVertexData = createVertexBuffer(gridGeometry.vertices);

  addComponent<MeshComponent>(ecs, grid, COMPONENT_TYPES.MESH, {
    vertices: gridVertexData,
    indices: new Uint32Array(gridGeometry.indices),
    vertexCount: gridGeometry.vertices.length,
    indexCount: gridGeometry.indices.length,
    topology: "line-list",
  });

  addComponent<Transform3DComponent>(ecs, grid, COMPONENT_TYPES.TRANSFORM_3D, {
    position: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    scale: vec3.create(1, 1, 1),
  });

  addComponent<MaterialComponent>(ecs, grid, COMPONENT_TYPES.MATERIAL, {
    color: vec3.create(0.5, 0.5, 0.5),
    shininess: 1,
  });

  // Visibility for grid
  addComponent<VisibilityComponent>(ecs, grid, COMPONENT_TYPES.VISIBILITY, {
    visible: true,
  });

  // Add text label to grid
  addComponent<TextLabelComponent>(ecs, grid, COMPONENT_TYPES.TEXT_LABEL, {
    text: "Ground Grid",
    fontSize: 13,
    color: "#ffffff",
    padding: 3,
    borderRadius: 3,
    offset: vec3.create(0, 0.5, 0), // Slightly above the grid
    alwaysVisible: true,
  });

  // Make grid selectable
  addComponent<SelectableComponent>(ecs, grid, COMPONENT_TYPES.SELECTABLE, {
    selectable: true,
  });

  addComponent<TransformGizmoComponent>(ecs, grid, COMPONENT_TYPES.TRANSFORM_GIZMO, {
    enabled: true,
    mode: "translate",
    axis: "all",
    size: 1.0,
    snapToGrid: true,
    gridSize: 1.0,
  });

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
