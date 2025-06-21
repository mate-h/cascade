import type { ECS } from "../types";
import { getComponentsOfType, getComponent } from "../types";
import {
  COMPONENT_TYPES,
  type ErosionParamsComponent,
  type TransformComponent,
} from "../components";

export const erosionSystem = (ecs: ECS, deltaTime: number): void => {
  const erosionParams = getComponentsOfType<ErosionParamsComponent>(
    ecs,
    COMPONENT_TYPES.EROSION_PARAMS,
  );

  for (const [entity, params] of erosionParams) {
    const transform = getComponent<TransformComponent>(
      ecs,
      entity,
      COMPONENT_TYPES.TRANSFORM,
    );
    if (!transform) continue;

    params.iterations += 1;

    if (params.iterations > 1000) {
      params.iterations = 0;
      params.rainRate = Math.random() * 0.01;
      params.evaporationRate = 0.01 + Math.random() * 0.02;
    }
  }
};
