<script lang="ts">
  import { COMPONENT_TYPES } from "../ecs";
  import type { ECS } from "../ecs";
  import { getActiveCameraId, setActiveCamera } from "../stores/camera";
  import { ecsUiRevision } from "../stores/ecs-ui";
  import Icon from "./ui/Icon.svelte";

  let { componentType, entityId, ecs } = $props();

  const isCamera = $derived(componentType === COMPONENT_TYPES.CAMERA);
  const isActive = $derived.by(() => {
    $ecsUiRevision;
    return getActiveCameraId(ecs as ECS) === entityId;
  });

  const activateCamera = (event: MouseEvent) => {
    event.stopPropagation();
    setActiveCamera(ecs as ECS, entityId);
  };
</script>

<div class="flex items-center justify-between pl-2 py-0.5 text-fg-muted">
  <span>{componentType}</span>
  {#if isCamera}
    <button
      type="button"
      class={[
        "inline-flex items-center justify-center p-0 border-0 bg-transparent focus:outline-none",
        isActive ? "text-fg-accent" : "text-fg-disabled hover:text-fg-default",
      ]}
      title={isActive ? "Active camera" : "Set as active camera"}
      aria-pressed={isActive}
      onclick={activateCamera}
    >
      <Icon name="camera" />
    </button>
  {/if}
</div>
