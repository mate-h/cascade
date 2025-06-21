export type EntityID = number;
export type ComponentType = string;

export interface ECS {
  entities: Set<EntityID>;
  components: Map<ComponentType, Map<EntityID, any>>;
  nextEntityId: number;
}

export const createECS = (): ECS => ({
  entities: new Set(),
  components: new Map(),
  nextEntityId: 0,
});

export const createEntity = (ecs: ECS): EntityID => {
  const id = ecs.nextEntityId++;
  ecs.entities.add(id);
  return id;
};

export const addComponent = <T>(
  ecs: ECS,
  entity: EntityID,
  type: ComponentType,
  data: T,
): void => {
  if (!ecs.components.has(type)) {
    ecs.components.set(type, new Map());
  }
  ecs.components.get(type)!.set(entity, data);
};

export const getComponent = <T>(
  ecs: ECS,
  entity: EntityID,
  type: ComponentType,
): T | undefined => {
  return ecs.components.get(type)?.get(entity);
};

export const getComponentsOfType = <T>(
  ecs: ECS,
  type: ComponentType,
): Map<EntityID, T> => {
  return ecs.components.get(type) || new Map();
};

export const hasComponent = (
  ecs: ECS,
  entity: EntityID,
  type: ComponentType,
): boolean => {
  return ecs.components.get(type)?.has(entity) || false;
};

export const removeComponent = (
  ecs: ECS,
  entity: EntityID,
  type: ComponentType,
): void => {
  ecs.components.get(type)?.delete(entity);
};

export const removeEntity = (ecs: ECS, entity: EntityID): void => {
  ecs.entities.delete(entity);
  for (const componentMap of ecs.components.values()) {
    componentMap.delete(entity);
  }
};
