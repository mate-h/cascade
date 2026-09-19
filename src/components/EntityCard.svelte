<script lang="ts">
  import { getEntityComponents } from "../utils/ecs";
  import { COMPONENT_TYPES } from "../ecs";
  import type { ECS } from "../ecs";
  import { activeCameraId, setActiveCamera } from "../stores/camera";
  import Icon from "./ui/Icon.svelte";
  import IconButton from "./ui/IconButton.svelte";

  let {
    entityId,
    ecs,
    isSelected = false,
    isHighlighted = false,
    onSelect,
  } = $props();

  const components = $derived(getEntityComponents(entityId, ecs));
  const isCamera = $derived(components.has(COMPONENT_TYPES.CAMERA));
  const isActiveCamera = $derived($activeCameraId === entityId);

  const handleClick = () => {
    onSelect?.();
  };

  const activateCamera = (event: MouseEvent) => {
    event.stopPropagation();
    setActiveCamera(ecs as ECS, entityId);
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
      Entity {entityId}
    </span>
    <span class="text-fg-muted">{components.size}</span>
    {#if isCamera}
      {#if isActiveCamera}
        <span class="ml-auto text-fg-accent" title="Active camera">
          <Icon name="camera" />
        </span>
      {:else}
        <IconButton
          class="ml-auto"
          name="camera"
          title="Set as active camera"
          onclick={activateCamera}
        />
      {/if}
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
