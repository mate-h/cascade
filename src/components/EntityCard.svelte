<script lang="ts">
  import { ContextMenu } from "bits-ui";
  import { getEntityComponents, getEntityLabel } from "../utils/ecs";
  import { COMPONENT_TYPES } from "../ecs";
  import type { ECS } from "../ecs";
  import { getActiveCameraId, setActiveCamera } from "../stores/camera";
  import { ecsUiRevision } from "../stores/ecs-ui";
  import Icon from "./ui/Icon.svelte";
  import WithTooltip from "./ui/WithTooltip.svelte";

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

  const copyEntityId = () => {
    void navigator.clipboard.writeText(String(entityId));
  };
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    {#snippet child({ props })}
      <div
        {...props}
        class={[
          "ui-row mb-0.5 cursor-pointer",
          isSelected && "ui-row-selected",
          isHighlighted && !isSelected && "ui-row-linked",
          props.class,
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
            <WithTooltip
              text={isActiveCamera ? "Active camera" : "Set as active camera"}
            >
              {#snippet children({ props })}
                <button
                  {...props}
                  type="button"
                  class={[
                    "ml-auto inline-flex items-center justify-center p-0 border-0 bg-transparent focus:outline-none",
                    isActiveCamera
                      ? "text-fg-accent"
                      : "text-fg-disabled hover:text-fg-default",
                    props.class,
                  ]}
                  aria-pressed={isActiveCamera}
                  onclick={activateCamera}
                >
                  <Icon name="camera" />
                </button>
              {/snippet}
            </WithTooltip>
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
    {/snippet}
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content class="ui-menu">
      <ContextMenu.Item
        class="ui-menu-item"
        onSelect={() => {
          if (!isSelected) onSelect?.();
        }}
      >
        Select
      </ContextMenu.Item>
      <ContextMenu.Item
        class="ui-menu-item"
        onSelect={() => {
          if (isSelected) onSelect?.();
        }}
      >
        Deselect
      </ContextMenu.Item>
      <ContextMenu.Separator class="my-1 h-px bg-border-muted" />
      <ContextMenu.Item class="ui-menu-item" onSelect={copyEntityId}>
        Copy ID
      </ContextMenu.Item>
      {#if isCamera}
        <ContextMenu.Item
          class="ui-menu-item"
          onSelect={() => {
            setActiveCamera(ecs as ECS, entityId);
            if (!isSelected) onSelect?.();
          }}
        >
          Set active camera
        </ContextMenu.Item>
      {/if}
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
