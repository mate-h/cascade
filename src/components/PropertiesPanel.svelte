<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getEntityComponents, getEntityLabel } from "../utils/ecs";
  import { selectedEntityId } from "../stores/selection";
  import {
    getPropertyConfig,
    isEditableProperty,
  } from "../utils/property-config";
  import { type PropertyConfig } from "./PropertyEditor.svelte";
  import ComponentPropertiesCard from "./ComponentPropertiesCard.svelte";
  import PanelSearch from "./ui/PanelSearch.svelte";
  import { panelStore, createResizeHandler } from "../stores/panels";
  import { bumpEcsUi, ecsUiRevision } from "../stores/ecs-ui";
  import type { AppState } from "../app";

  let { appState }: { appState: AppState } = $props();

  let panelWidth = $state(0);
  let isResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;
  let componentUpdateTrigger = $state(0);
  let search = $state("");
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

  const selectedEntityLabel = $derived.by(() => {
    componentUpdateTrigger;
    $ecsUiRevision;
    return $selectedEntityId !== null
      ? getEntityLabel(appState.ecs, $selectedEntityId)
      : null;
  });

  const selectedEntityComponents = $derived.by(() => {
    if ($selectedEntityId === null) return new Map();
    componentUpdateTrigger;
    $ecsUiRevision;
    return getEntityComponents($selectedEntityId, appState.ecs);
  });

  const visibleComponents = $derived.by(() => {
    const query = search.trim().toLowerCase();
    if (!query) return selectedEntityComponents;

    const next = new Map<string, Record<string, unknown>>();
    for (const [componentType, component] of selectedEntityComponents) {
      if (componentType.toLowerCase().includes(query)) {
        next.set(componentType, component);
        continue;
      }

      const matches = Object.fromEntries(
        Object.entries(component).filter(([key]) =>
          key.toLowerCase().includes(query),
        ),
      );
      if (Object.keys(matches).length > 0) {
        next.set(componentType, matches);
      }
    }
    return next;
  });

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
      bumpEcsUi();
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
      <header class="flex flex-col gap-1 px-2 py-2 border-b border-border-default">
        {#if selectedEntityLabel}
          <span class="text-fg-muted">{selectedEntityLabel}</span>
        {/if}
        <PanelSearch class="w-full" placeholder="Properties" bind:value={search} />
      </header>

      <div class="flex-1 overflow-y-auto p-2">
        {#if $selectedEntityId === null}
          <div class="text-fg-muted px-2 py-6 text-center">
            Select an entity
          </div>
        {:else if visibleComponents.size === 0}
          <div class="text-fg-muted px-2">
            {search.trim() ? "No matching properties" : "No components"}
          </div>
        {:else}
          {#each Array.from(visibleComponents) as [componentType, component] (componentType)}
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
