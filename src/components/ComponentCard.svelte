<script lang="ts">
  import { COMPONENT_TYPES, addComponent } from "../ecs";
  import type { ECS } from "../ecs";
  import { activeCameraId } from "../stores/camera";

  let { componentType, entityId, ecs } = $props();

  const isCamera = componentType === COMPONENT_TYPES.CAMERA;

  const isActive = $derived($activeCameraId === entityId);

  function setActiveCamera() {
    // Remove existing active marker
    const activeMap = ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
    if (activeMap) {
      for (const id of activeMap.keys()) activeMap.delete(id);
    }
    addComponent(ecs as ECS, entityId, COMPONENT_TYPES.ACTIVE_CAMERA, {});
    activeCameraId.set(entityId);
  }
</script>

<div class="component-card flex items-center justify-between">
  <span class="text-text-bright font-medium">{componentType}</span>
  {#if isCamera}
    <button
      class="text-xs text-white bg-bg-secondary border border-border-subtle rounded px-1 py-0.5 hover:bg-accent-blue/20"
      onclick={setActiveCamera}
      title={isActive ? "Currently active" : "Set as active camera"}
      disabled={isActive}
    >
      {#if isActive}
        <i class="i-material-symbols:photo-camera-outline-rounded text-white size-4"></i>
      {:else}
        Set Active
      {/if}
    </button>
  {/if}
</div>


