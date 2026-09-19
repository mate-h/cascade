<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getEntityComponents } from "../utils/ecs";
  import { selectedEntityId } from "../stores/selection";
  import {
    getPropertyConfig,
    isEditableProperty,
  } from "../utils/property-config";
  import PropertyEditor, { type PropertyConfig } from "./PropertyEditor.svelte";
  import ComponentPropertiesCard from "./ComponentPropertiesCard.svelte";
  import IconButton from "./ui/IconButton.svelte";
  import Kbd from "./ui/Kbd.svelte";
  import {
    panelStore,
    createResizeHandler,
    createVerticalResizeHandler,
  } from "../stores/panels";
  import type { AppState } from "../app";

  let { appState }: { appState: AppState } = $props();

  let panelWidth = $state(0);
  let panelHeight = $state(0);
  let isResizing = $state(false);
  let isVerticalResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;
  let verticalResizeHandler: ReturnType<typeof createVerticalResizeHandler> | null = null;
  let componentUpdateTrigger = $state(0);
  let selectedProperty: PropertyConfig | null = $state(null);

  $effect(() => {
    const unsubscribe = panelStore.subscribe((sizes) => {
      panelWidth = sizes.propertiesPanel.width;
      panelHeight = sizes.propertiesPanel.height || 300;
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

  $effect(() => {
    if (verticalResizeHandler) {
      const checkVerticalResize = () => {
        isVerticalResizing = verticalResizeHandler?.isResizing || false;
        if (isVerticalResizing) {
          requestAnimationFrame(checkVerticalResize);
        }
      };
      requestAnimationFrame(checkVerticalResize);
    }
  });

  onMount(() => {
    resizeHandler = createResizeHandler("propertiesPanel", (width) => {
      panelWidth = width;
    });
    verticalResizeHandler = createVerticalResizeHandler("propertiesPanel", (height) => {
      panelHeight = height;
    });
  });

  onDestroy(() => {
    resizeHandler?.cleanup();
    verticalResizeHandler?.cleanup();
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

  const togglePanel = () => {
    panelStore.togglePanel("propertiesPanel");
  };

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (
      event.key.toLowerCase() === "t" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !isTypingTarget(event.target)
    ) {
      event.preventDefault();
      togglePanel();
    }
    if (event.key === "Escape" && selectedProperty) {
      selectedProperty = null;
    }
  };

  const selectProperty = (
    componentType: string,
    propertyKey: string,
    value: unknown,
  ) => {
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

  const cancelPropertyEdit = () => {
    selectedProperty = null;
  };

  $effect(() => {
    if (
      selectedProperty &&
      ($selectedEntityId === null || selectedProperty.entityId !== $selectedEntityId)
    ) {
      selectedProperty = null;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isCollapsed}
  <IconButton
    class="fixed top-3 right-3 z-[60]"
    name="sliders-horizontal"
    title="Show properties panel (T)"
    onclick={togglePanel}
  />
{/if}

<div
  class="ui-panel fixed top-0 right-0 h-full z-40 flex border-l"
  class:overflow-hidden={isCollapsed}
  style:width={isCollapsed ? "0px" : `${panelWidth}px`}
>
  {#if !isCollapsed}
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
  {/if}

  <div
    class={["flex flex-col h-full flex-1", isCollapsed && "opacity-0 pointer-events-none"]}
  >
    <header class="flex items-center gap-2 h-10 px-2 border-b border-border-default">
      <span class="text-fg-default">Properties</span>
      <Kbd>T</Kbd>
      <IconButton
        class="ml-auto"
        name="x"
        title="Hide properties panel (T)"
        onclick={togglePanel}
      />
    </header>

    <div
      class="overflow-y-auto p-2"
      style:height={selectedProperty ? `${panelHeight}px` : "100%"}
    >
      {#if $selectedEntityId === null}
        <div class="text-fg-muted px-2 py-6 text-center">
          Select an entity to view its properties
        </div>
      {:else}
        <div class="mb-2 px-2 py-1.5 rounded-md border border-border-muted bg-canvas-muted">
          <div class="text-fg-accent">Entity {$selectedEntityId}</div>
          <div class="text-fg-muted">{selectedEntityComponents.size} components</div>
        </div>

        {#if selectedEntityComponents.size === 0}
          <div class="text-fg-muted px-2">No components</div>
        {:else}
          {#each Array.from(selectedEntityComponents) as [componentType, component] (componentType)}
            <ComponentPropertiesCard
              {appState}
              {componentType}
              {component}
              {selectedProperty}
              onSelectProperty={selectProperty}
            />
          {/each}
        {/if}
      {/if}
    </div>

    {#if selectedProperty && !isCollapsed}
      <button
        type="button"
        aria-label="Resize editor"
        class={[
          "h-1 flex-shrink-0 cursor-row-resize bg-transparent hover:bg-fg-accent focus:outline-none",
          isVerticalResizing && "bg-fg-accent",
        ]}
        onmousedown={(e) => verticalResizeHandler?.startResize(e, panelHeight)}
        title="Drag to resize editor"
      ></button>

      <div class="flex-1 overflow-y-auto p-2 border-t border-border-muted">
        <PropertyEditor
          config={selectedProperty}
          onUpdate={updateProperty}
          onCancel={cancelPropertyEdit}
        />
      </div>
    {/if}
  </div>
</div>
