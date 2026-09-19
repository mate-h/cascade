<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getEntityComponents } from "../utils/ecs";
  import { selectedEntityId } from "../stores/selection";
  import {
    getPropertyConfig,
    isEditableProperty,
  } from "../utils/property-config";
  import { type PropertyConfig } from "./PropertyEditor.svelte";
  import ComponentPropertiesCard from "./ComponentPropertiesCard.svelte";
  import { panelStore, createResizeHandler } from "../stores/panels";
  import type { AppState } from "../app";

  let { appState }: { appState: AppState } = $props();

  let panelWidth = $state(0);
  let isResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;
  let componentUpdateTrigger = $state(0);
  let selectedProperty: PropertyConfig | null = $state(null);
  let lastOpenedFor = $state<number | null>(null);

  $effect(() => {
    const unsubscribe = panelStore.subscribe((sizes) => {
      panelWidth = sizes.propertiesPanel.width;
    });
    return unsubscribe;
  });

  $effect(() => {
    if (resizeHandler) {
      const checkResize = () => {
        isResizing = resizeHandler?.isResizing || false;
        if (isResizing) {
          requestAnimationFrame(checkResize);
        }
      };
      requestAnimationFrame(checkResize);
    }
  });

  onMount(() => {
    resizeHandler = createResizeHandler("propertiesPanel", (width) => {
      panelWidth = width;
    });
  });

  onDestroy(() => {
    resizeHandler?.cleanup();
  });

  const isCollapsed = $derived($panelStore.propertiesPanel.isCollapsed);

  const selectedEntityComponents = $derived(
    $selectedEntityId !== null
      ? (() => {
          componentUpdateTrigger;
          return getEntityComponents($selectedEntityId, appState.ecs);
        })()
      : new Map(),
  );

  $effect(() => {
    const id = $selectedEntityId;
    if (id !== null && id !== lastOpenedFor && $panelStore.propertiesPanel.isCollapsed) {
      panelStore.setPanelCollapsed("propertiesPanel", false);
    }
    lastOpenedFor = id;
  });

  const selectProperty = (
    componentType: string,
    propertyKey: string,
    value: unknown,
  ) => {
    if (
      selectedProperty?.componentType === componentType &&
      selectedProperty?.propertyKey === propertyKey
    ) {
      selectedProperty = null;
      return;
    }

    if (
      !isEditableProperty(value, componentType, propertyKey) ||
      $selectedEntityId === null
    ) {
      return;
    }

    const config = getPropertyConfig(componentType, propertyKey, value);
    selectedProperty = {
      entityId: $selectedEntityId,
      componentType,
      propertyKey,
      value,
      type: config.type || typeof value,
      ...config,
    };
  };

  const updateProperty = (newValue: unknown) => {
    if (!selectedProperty || $selectedEntityId === null) return;

    const components = getEntityComponents($selectedEntityId, appState.ecs);
    const component = components.get(selectedProperty.componentType);
    if (component) {
      component[selectedProperty.propertyKey] = newValue;
      selectedProperty.value = newValue;
      componentUpdateTrigger++;
    }
  };

  $effect(() => {
    if (
      selectedProperty &&
      ($selectedEntityId === null || selectedProperty.entityId !== $selectedEntityId)
    ) {
      selectedProperty = null;
    }
  });

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && selectedProperty) {
      selectedProperty = null;
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !isCollapsed}
  <div
    class="ui-panel h-full flex flex-shrink-0 border-l overflow-hidden"
    style:width={`${panelWidth}px`}
  >
    <button
      type="button"
      aria-label="Resize panel"
      class={[
        "w-1 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-fg-accent focus:outline-none",
        isResizing && "bg-fg-accent",
      ]}
      onmousedown={(e) => resizeHandler?.startResize(e, panelWidth)}
      title="Drag to resize"
    ></button>

    <div class="flex flex-col h-full flex-1 min-w-0">
      <header class="flex items-center gap-2 h-10 px-2 border-b border-border-default">
        <span class="text-fg-default">Inspector</span>
        {#if $selectedEntityId !== null}
          <span class="ml-auto text-fg-muted">Entity {$selectedEntityId}</span>
        {/if}
      </header>

      <div class="flex-1 overflow-y-auto p-2">
        {#if $selectedEntityId === null}
          <div class="text-fg-muted px-2 py-6 text-center">
            Select an entity to inspect
          </div>
        {:else if selectedEntityComponents.size === 0}
          <div class="text-fg-muted px-2">No components</div>
        {:else}
          {#each Array.from(selectedEntityComponents) as [componentType, component] (componentType)}
            <ComponentPropertiesCard
              {appState}
              {componentType}
              {component}
              {selectedProperty}
              onSelectProperty={selectProperty}
              onUpdate={updateProperty}
            />
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
