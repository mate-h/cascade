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
  import {
    panelStore,
    createResizeHandler,
    createVerticalResizeHandler,
  } from "../stores/panels";
  import type { AppState } from "../app";

  let { appState }: { appState: AppState } = $props();

  // Use panel store for collapse state and dimensions
  let panelWidth = $state(0);
  let panelHeight = $state(0);
  let isResizing = $state(false);
  let isVerticalResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;
  let verticalResizeHandler: ReturnType<
    typeof createVerticalResizeHandler
  > | null = null;

  // Subscribe to panel store
  $effect(() => {
    const unsubscribe = panelStore.subscribe((sizes) => {
      panelWidth = sizes.propertiesPanel.width;
      panelHeight = sizes.propertiesPanel.height || 300;
    });
    return unsubscribe;
  });

  // Track resize state for styling
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
    verticalResizeHandler = createVerticalResizeHandler(
      "propertiesPanel",
      (height) => {
        panelHeight = height;
      },
    );
  });

  onDestroy(() => {
    resizeHandler?.cleanup();
    verticalResizeHandler?.cleanup();
  });

  const selectedEntityComponents = $derived(
    $selectedEntityId !== null
      ? getEntityComponents($selectedEntityId, appState.ecs)
      : new Map(),
  );

  // Property editing state
  let selectedProperty: PropertyConfig | null = $state(null);

  function togglePanel() {
    panelStore.togglePanel("propertiesPanel");
  }

  // Keyboard shortcut handler
  function handleKeydown(event: KeyboardEvent) {
    if (
      event.key.toLowerCase() === "t" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Only trigger if not typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        !target.isContentEditable
      ) {
        event.preventDefault();
        togglePanel();
      }
    }
    // ESC to cancel property editing
    if (event.key === "Escape" && selectedProperty) {
      selectedProperty = null;
    }
  }

  // Add global keydown listener
  $effect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  function selectProperty(
    componentType: string,
    propertyKey: string,
    value: any,
  ) {
    if (
      !isEditableProperty(value, componentType, propertyKey) ||
      $selectedEntityId === null
    )
      return;

    const config = getPropertyConfig(componentType, propertyKey, value);
    selectedProperty = {
      entityId: $selectedEntityId,
      componentType,
      propertyKey,
      value,
      type: typeof value,
      ...config,
    };
  }

  function updateProperty(newValue: any) {
    if (!selectedProperty || $selectedEntityId === null) return;

    // Update the component in the ECS
    const components = getEntityComponents($selectedEntityId, appState.ecs);
    const component = components.get(selectedProperty.componentType);
    if (component) {
      component[selectedProperty.propertyKey] = newValue;
      selectedProperty.value = newValue;
    }
  }

  function cancelPropertyEdit() {
    selectedProperty = null;
  }

  $effect(() => {
    if (
      selectedProperty &&
      ($selectedEntityId === null ||
        selectedProperty.entityId !== $selectedEntityId)
    ) {
      selectedProperty = null; // deselect editor
    }
  });
</script>

<!-- Toggle Button -->
<button
  class="fixed top-2 right-2 z-60 bg-bg-panel border border-border-default text-text-primary p-1 rounded shadow-lg hover:bg-bg-overlay size-6"
  onclick={togglePanel}
  title={$panelStore.propertiesPanel.isCollapsed
    ? "Show Properties Panel (T)"
    : "Hide Properties Panel (T)"}
>
  {$panelStore.propertiesPanel.isCollapsed ? "⚙️" : "×"}
</button>

<!-- Collapsible Properties Panel -->
<div
  class="fixed top-0 right-0 h-full bg-bg-primary/95 backdrop-blur-sm z-40 flex"
  style:width={$panelStore.propertiesPanel.isCollapsed
    ? "0px"
    : `${panelWidth}px`}
  class:overflow-hidden={$panelStore.propertiesPanel.isCollapsed}
>
  <!-- Resize Handle Border -->
  {#if !$panelStore.propertiesPanel.isCollapsed}
    <button
      type="button"
      aria-label="Resize panel"
      class="w-1 bg-border-default hover:bg-accent-blue cursor-col-resize transition-colors duration-150 ease-in-out flex-shrink-0 focus:outline-none"
      class:bg-accent-blue={isResizing}
      class:w-2={isResizing}
      onmousedown={(e) => resizeHandler?.startResize(e, panelWidth)}
      title="Drag to resize panel"
    ></button>
  {/if}

  <div
    class="flex flex-col h-full flex-1"
    class:opacity-0={$panelStore.propertiesPanel.isCollapsed}
    class:pointer-events-none={$panelStore.propertiesPanel.isCollapsed}
  >
    <!-- Top Section: Property List -->
    <div
      class="overflow-y-auto p-2"
      style:height={selectedProperty ? `${panelHeight}px` : "100%"}
    >
      <h2 class="text-text-bright mb-2 mt-8">Properties</h2>

      {#if $selectedEntityId === null}
        <div class="text-text-muted text-center py-4">
          Select an entity to view its properties
        </div>
      {:else}
        <div class="mb-2 p-2 bg-bg-panel rounded border border-border-subtle">
          <h3 class="text-accent-blue mb-1">
            Entity {$selectedEntityId}
          </h3>
          <div class="text-text-secondary text-xs">
            {selectedEntityComponents.size} components
          </div>
        </div>

        {#if selectedEntityComponents.size === 0}
          <div class="text-text-muted">No components found</div>
        {:else}
          {#each Array.from(selectedEntityComponents) as [componentType, component] (componentType)}
            <ComponentPropertiesCard
              appState={appState}
              componentType={componentType}
              component={component}
              selectedProperty={selectedProperty}
              onSelectProperty={selectProperty}
            />
          {/each}
        {/if}
      {/if}
    </div>

    <!-- Vertical Resize Handle -->
    {#if selectedProperty && !$panelStore.propertiesPanel.isCollapsed}
      <button
        type="button"
        aria-label="Resize editor"
        class="h-3 bg-border-default hover:bg-accent-blue cursor-row-resize transition-colors duration-150 ease-in-out flex-shrink-0 focus:outline-none relative border-y border-border-subtle"
        class:bg-accent-blue={isVerticalResizing}
        class:h-4={isVerticalResizing}
        onmousedown={(e) => verticalResizeHandler?.startResize(e, panelHeight)}
        title="Drag to resize editor"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-1 bg-border-subtle rounded-full"></div>
        </div>
      </button>
    {/if}

    <!-- Bottom Section: Property Editor -->
    {#if selectedProperty && !$panelStore.propertiesPanel.isCollapsed}
      <div class="flex-1 overflow-y-auto p-2">
        <PropertyEditor
          config={selectedProperty}
          onUpdate={updateProperty}
          onCancel={cancelPropertyEdit}
        />
      </div>
    {/if}
  </div>
</div>
