<script lang="ts">
  import { COMPONENT_TYPES, addComponent } from "../ecs";
  import type { ECS } from "../ecs";
  import { activeCameraId } from "../stores/camera";
  import IconButton from "./ui/IconButton.svelte";
  import Icon from "./ui/Icon.svelte";

  let { componentType, entityId, ecs } = $props();

  const isCamera = $derived(componentType === COMPONENT_TYPES.CAMERA);
  const isActive = $derived($activeCameraId === entityId);

  const setActiveCamera = (event: MouseEvent) => {
    event.stopPropagation();
    const activeMap = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
    if (activeMap) {
      for (const id of activeMap.keys()) activeMap.delete(id);
    }
    addComponent(ecs as ECS, entityId, COMPONENT_TYPES.ACTIVE_CAMERA, {});
    activeCameraId.set(entityId);
  };
</script>

<div class="flex items-center justify-between pl-2 py-0.5 text-fg-muted">
  <span>{componentType}</span>
  {#if isCamera}
    {#if isActive}
      <span class="text-fg-accent" title="Active camera"><Icon name="camera" /></span>
    {:else}
      <IconButton
        name="camera"
        title="Set as active camera"
        onclick={setActiveCamera}
      />
    {/if}
  {/if}
</div>
