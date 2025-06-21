import type { ECS, EntityID } from "../types";
import { getComponentsOfType, getComponent, hasComponent } from "../types";
import {
  COMPONENT_TYPES,
  type ComputePassComponent,
  type RenderPassComponent,
  type DependencyComponent,
  type ResourceComponent,
  type ErosionParamsComponent,
} from "../components";
import type { MinimalWebGPUState } from "../../gpu/device-only";

import erosionShaderSource from "../../shaders/erosion.wgsl?raw";
import vertexShaderSource from "../../shaders/vertex.wgsl?raw";
import fragmentShaderSource from "../../shaders/fragment.wgsl?raw";

interface PassNode {
  entity: EntityID;
  type: "compute" | "render";
  inputs: EntityID[];
  outputs: EntityID[];
}

interface GPUResources {
  pipelines: Map<EntityID, GPUComputePipeline | GPURenderPipeline>;
  bindGroups: Map<EntityID, GPUBindGroup>;
  textures: Map<EntityID, GPUTexture>;
  samplers: Map<EntityID, GPUSampler>;
  buffers: Map<EntityID, GPUBuffer>;
}

const topologicalSort = (nodes: PassNode[]): PassNode[] => {
  const sorted: PassNode[] = [];
  const visited = new Set<EntityID>();
  const visiting = new Set<EntityID>();

  const visit = (node: PassNode) => {
    if (visiting.has(node.entity)) {
      throw new Error("Circular dependency detected in render graph");
    }
    if (visited.has(node.entity)) return;

    visiting.add(node.entity);

    for (const inputId of node.inputs) {
      const inputNode = nodes.find((n) => n.outputs.includes(inputId));
      if (inputNode) visit(inputNode);
    }

    visiting.delete(node.entity);
    visited.add(node.entity);
    sorted.push(node);
  };

  for (const node of nodes) {
    if (!visited.has(node.entity)) {
      visit(node);
    }
  }

  return sorted;
};

const createGPUResources = (
  ecs: ECS,
  gpu: MinimalWebGPUState,
): GPUResources => {
  const resources: GPUResources = {
    pipelines: new Map(),
    bindGroups: new Map(),
    textures: new Map(),
    samplers: new Map(),
    buffers: new Map(),
  };

  const resourceComponents = getComponentsOfType<ResourceComponent>(
    ecs,
    COMPONENT_TYPES.RESOURCE,
  );
  for (const [entity, resource] of resourceComponents) {
    if (resource.type === "texture") {
      const texture = gpu.device.createTexture({
        size: { width: resource.size![0], height: resource.size![1] },
        format: resource.format as GPUTextureFormat,
        usage:
          resource.usage ||
          GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
      });
      resources.textures.set(entity, texture);
    } else if (resource.type === "sampler") {
      const sampler = gpu.device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
      });
      resources.samplers.set(entity, sampler);
    }
  }

  const erosionParams = getComponentsOfType<ErosionParamsComponent>(
    ecs,
    COMPONENT_TYPES.EROSION_PARAMS,
  );
  for (const [entity, params] of erosionParams) {
    const paramsArray = new Float32Array([
      params.rainRate,
      params.evaporationRate,
      params.sedimentCapacity,
      params.minSlope,
      params.gravity,
      params.iterations,
    ]);

    const buffer = gpu.device.createBuffer({
      size: paramsArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    gpu.device.queue.writeBuffer(buffer, 0, paramsArray);
    resources.buffers.set(entity, buffer);
  }

  const computePasses = getComponentsOfType<ComputePassComponent>(
    ecs,
    COMPONENT_TYPES.COMPUTE_PASS,
  );
  for (const [entity, pass] of computePasses) {
    if (pass.shader === "erosion.wgsl") {
      const shaderModule = gpu.device.createShaderModule({
        code: erosionShaderSource,
      });
      const pipeline = gpu.device.createComputePipeline({
        layout: "auto",
        compute: {
          module: shaderModule,
          entryPoint: "cs_main",
        },
      });
      resources.pipelines.set(entity, pipeline);

      const deps = getComponent<DependencyComponent>(
        ecs,
        entity,
        COMPONENT_TYPES.DEPENDENCY,
      );
      const erosionParamsEntities = Array.from(
        getComponentsOfType<ErosionParamsComponent>(
          ecs,
          COMPONENT_TYPES.EROSION_PARAMS,
        ).keys(),
      );

      if (
        deps &&
        deps.inputs.length >= 1 &&
        deps.outputs.length >= 1 &&
        erosionParamsEntities.length > 0
      ) {
        const inputTexture = resources.textures.get(deps.inputs[0]);
        const outputTexture = resources.textures.get(deps.outputs[0]);
        const paramsBuffer = resources.buffers.get(erosionParamsEntities[0]);

        if (inputTexture && outputTexture && paramsBuffer) {
          const bindGroup = gpu.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: inputTexture.createView(),
              },
              {
                binding: 1,
                resource: outputTexture.createView(),
              },
              {
                binding: 2,
                resource: {
                  buffer: paramsBuffer,
                },
              },
            ],
          });
          resources.bindGroups.set(entity, bindGroup);
        }
      }
    }
  }

  const renderPasses = getComponentsOfType<RenderPassComponent>(
    ecs,
    COMPONENT_TYPES.RENDER_PASS,
  );
  for (const [entity, pass] of renderPasses) {
    const vertexModule = gpu.device.createShaderModule({
      code: vertexShaderSource,
    });
    const fragmentModule = gpu.device.createShaderModule({
      code: fragmentShaderSource,
    });

    const bindGroupLayout = gpu.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "unfilterable-float",
            viewDimension: "2d",
          },
        },
      ],
    });

    const pipelineLayout = gpu.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    const pipeline = gpu.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexModule,
        entryPoint: "vs_main",
      },
      fragment: {
        module: fragmentModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
    resources.pipelines.set(entity, pipeline);

    const deps = getComponent<DependencyComponent>(
      ecs,
      entity,
      COMPONENT_TYPES.DEPENDENCY,
    );
    if (deps && deps.inputs.length >= 1) {
      const texture = resources.textures.get(deps.inputs[0]);

      if (texture) {
        const bindGroup = gpu.device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: texture.createView(),
            },
          ],
        });
        resources.bindGroups.set(entity, bindGroup);
      }
    }
  }

  return resources;
};

const buildRenderGraph = (ecs: ECS): PassNode[] => {
  const nodes: PassNode[] = [];

  const computePasses = getComponentsOfType<ComputePassComponent>(
    ecs,
    COMPONENT_TYPES.COMPUTE_PASS,
  );
  const renderPasses = getComponentsOfType<RenderPassComponent>(
    ecs,
    COMPONENT_TYPES.RENDER_PASS,
  );

  for (const [entity] of computePasses) {
    const deps = getComponent<DependencyComponent>(
      ecs,
      entity,
      COMPONENT_TYPES.DEPENDENCY,
    );
    nodes.push({
      entity,
      type: "compute",
      inputs: deps?.inputs || [],
      outputs: deps?.outputs || [],
    });
  }

  for (const [entity] of renderPasses) {
    const deps = getComponent<DependencyComponent>(
      ecs,
      entity,
      COMPONENT_TYPES.DEPENDENCY,
    );
    nodes.push({
      entity,
      type: "render",
      inputs: deps?.inputs || [],
      outputs: deps?.outputs || [],
    });
  }

  return topologicalSort(nodes);
};

const executeComputePass = (
  ecs: ECS,
  entity: EntityID,
  gpu: MinimalWebGPUState,
  resources: GPUResources,
): void => {
  const pass = getComponent<ComputePassComponent>(
    ecs,
    entity,
    COMPONENT_TYPES.COMPUTE_PASS,
  );
  const pipeline = resources.pipelines.get(entity) as GPUComputePipeline;
  const bindGroup = resources.bindGroups.get(entity);
  if (!pass || !pipeline || !bindGroup) return;

  const commandEncoder = gpu.device.createCommandEncoder();
  const computePass = commandEncoder.beginComputePass();

  computePass.setPipeline(pipeline);
  computePass.setBindGroup(0, bindGroup);
  computePass.dispatchWorkgroups(
    pass.workgroups[0],
    pass.workgroups[1],
    pass.workgroups[2],
  );
  computePass.end();

  gpu.device.queue.submit([commandEncoder.finish()]);
};

const executeRenderPass = (
  ecs: ECS,
  entity: EntityID,
  gpu: MinimalWebGPUState,
  resources: GPUResources,
): void => {
  const pass = getComponent<RenderPassComponent>(
    ecs,
    entity,
    COMPONENT_TYPES.RENDER_PASS,
  );
  const pipeline = resources.pipelines.get(entity) as GPURenderPipeline;
  const bindGroup = resources.bindGroups.get(entity);
  if (!pass || !pipeline || !bindGroup) return;

  const commandEncoder = gpu.device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: gpu.context.getCurrentTexture().createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.draw(pass.vertexCount || 3);
  renderPass.end();

  gpu.device.queue.submit([commandEncoder.finish()]);
};

export const renderGraphSystem = (ecs: ECS, gpu: MinimalWebGPUState): void => {
  const resources = createGPUResources(ecs, gpu);
  const graph = buildRenderGraph(ecs);

  for (const node of graph) {
    if (node.type === "compute") {
      executeComputePass(ecs, node.entity, gpu, resources);
    } else {
      executeRenderPass(ecs, node.entity, gpu, resources);
    }
  }
};
