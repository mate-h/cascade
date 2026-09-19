<script lang="ts">
  import { getEntityComponents, getEntityLabel } from "../utils/ecs";
  import { COMPONENT_TYPES } from "../ecs";
  import type { ECS } from "../ecs";
  import { getActiveCameraId, setActiveCamera } from "../stores/camera";
  import { ecsUiRevision } from "../stores/ecs-ui";
  import Icon from "./ui/Icon.svelte";

  let {
    entityId,
    ecs,
    isSelected = false,
    isHighlighted = false,
    onSelect,
  } = $props();

  const components = $derived.by(() => {
    $ecsUiRevision;
    return getEntityComponents(entityId, ecs);
  });
  const label = $derived.by(() => {
    $ecsUiRevision;
    return getEntityLabel(ecs, entityId);
  });
  const isCamera = $derived(components.has(COMPONENT_TYPES.CAMERA));
  const isActiveCamera = $derived.by(() => {
    $ecsUiRevision;
    return getActiveCameraId(ecs as ECS) === entityId;
  });

  const handleClick = () => {
    onSelect?.();
  };

  const activateCamera = (event: MouseEvent) => {
    event.stopPropagation();
    setActiveCamera(ecs as ECS, entityId);
    if (!isSelected) onSelect?.();
  };
</script>

<div
  class={[
    "ui-row mb-0.5 cursor-pointer",
    isSelected && "ui-row-selected",
    isHighlighted && !isSelected && "ui-row-linked",
  ]}
  data-entity-id={entityId}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && handleClick()}
>
  <div class="flex items-center gap-2">
    <span class={isSelected ? "text-fg-accent" : "text-fg-default"}>
      {label}
    </span>
    <span class="text-fg-muted">{components.size}</span>
    {#if isCamera}
      <button
        type="button"
        class={[
          "ml-auto inline-flex items-center justify-center p-0 border-0 bg-transparent focus:outline-none",
          isActiveCamera
            ? "text-fg-accent"
            : "text-fg-disabled hover:text-fg-default",
        ]}
        title={isActiveCamera ? "Active camera" : "Set as active camera"}
        aria-pressed={isActiveCamera}
        onclick={activateCamera}
      >
        <Icon name="camera" />
      </button>
    {/if}
  </div>

  {#if isSelected}
    <div class="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-fg-muted">
      {#each Array.from(components.keys()) as componentType (componentType)}
        <span>{componentType}</span>
      {/each}
    </div>
  {/if}
</div>
