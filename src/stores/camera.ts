import {
  addComponent,
  removeComponent,
  COMPONENT_TYPES,
  type ECS,
} from "../ecs";
import { bumpEcsUi } from "./ecs-ui";

export const getActiveCameraId = (ecs: ECS): number | null => {
  const activeMap = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
  if (!activeMap || activeMap.size === 0) return null;
  return activeMap.keys().next().value ?? null;
};

export const setActiveCamera = (ecs: ECS, cameraEntityId: number) => {
  if (!ecs.components.get(COMPONENT_TYPES.CAMERA)?.has(cameraEntityId)) return;
  if (getActiveCameraId(ecs) === cameraEntityId) return;

  const activeMap = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
  if (activeMap) {
    for (const id of [...activeMap.keys()]) {
      removeComponent(ecs, id, COMPONENT_TYPES.ACTIVE_CAMERA);
    }
  }

  addComponent(ecs, cameraEntityId, COMPONENT_TYPES.ACTIVE_CAMERA, {});
  bumpEcsUi();
};

export const getCameraIds = (ecs: ECS): number[] => {
  const cameras = ecs.components.get(COMPONENT_TYPES.CAMERA);
  return cameras ? Array.from(cameras.keys()) : [];
};

export const cycleActiveCamera = (ecs: ECS) => {
  const cameraIds = getCameraIds(ecs);
  if (cameraIds.length === 0) return;

  const current = getActiveCameraId(ecs);
  const currentIndex = current === null ? -1 : cameraIds.indexOf(current);
  const nextIndex = (currentIndex + 1) % cameraIds.length;
  setActiveCamera(ecs, cameraIds[nextIndex]);
};
