import { get, writable } from "svelte/store";
import { addComponent, COMPONENT_TYPES, type ECS } from "../ecs";

export const activeCameraId = writable<number | null>(null);

export const setActiveCamera = (ecs: ECS, cameraEntityId: number) => {
  const activeMap = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
  if (activeMap) {
    for (const id of activeMap.keys()) {
      activeMap.delete(id);
    }
  }
  addComponent(ecs, cameraEntityId, COMPONENT_TYPES.ACTIVE_CAMERA, {});
  activeCameraId.set(cameraEntityId);
};

export const getCameraIds = (ecs: ECS): number[] => {
  const cameras = ecs.components.get(COMPONENT_TYPES.CAMERA);
  return cameras ? Array.from(cameras.keys()) : [];
};

export const cycleActiveCamera = (ecs: ECS) => {
  const cameraIds = getCameraIds(ecs);
  if (cameraIds.length === 0) return;

  const current = get(activeCameraId);
  const currentIndex = current === null ? -1 : cameraIds.indexOf(current);
  const nextIndex = (currentIndex + 1) % cameraIds.length;
  setActiveCamera(ecs, cameraIds[nextIndex]);
};
