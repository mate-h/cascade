<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getEntityComponents } from "../utils/ecs";
  import { selectedEntityId } from "../stores/selection";
  import {
    getPropertyConfig,
    isEditableProperty,
  } from "../utils/property-config";
  import PropertyEditor, { type PropertyConfig } from "./PropertyEditor.svelte";
  import { panelStore, createResizeHandler } from "../stores/panels";

  let { appState } = $props();

  // Use panel store for collapse state and width
  let panelWidth = $state(0);
  let isResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;

  // Subscribe to panel store
  $effect(() => {
    const unsubscribe = panelStore.subscribe(sizes => {
      panelWidth = sizes.propertiesPanel.width;
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

  onMount(() => {
    resizeHandler = createResizeHandler('propertiesPanel', (width) => {
      panelWidth = width;
    });
  });

  onDestroy(() => {
    resizeHandler?.cleanup();
  });

  const selectedEntityComponents = $derived(
    $selectedEntityId !== null
      ? getEntityComponents($selectedEntityId, appState.ecs)
      : new Map()
  );

  // Property editing state
  let selectedProperty: PropertyConfig | null = $state(null);

  function togglePanel() {
    panelStore.togglePanel('propertiesPanel');
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
    value: any
  ) {
    if (!isEditableProperty(value) || $selectedEntityId === null) return;

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

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "null";
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return `[${value.length} items]`;
    }

    if (typeof value === "object") {
      return `{${Object.keys(value).length} properties}`;
    }

    if (typeof value === "string") {
      return `"${value}"`;
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }

    return String(value);
  };

  const isEntityReference = (value: any, key: string, ecs: any): boolean => {
    if (typeof value !== "number" || !ecs.entities.has(value)) {
      return false;
    }

    const entityReferenceFields = [
      "inputs",
      "outputs",
      "dependencies",
      "targets",
      "sources",
    ];
    return entityReferenceFields.includes(key.toLowerCase());
  };

  $effect(() => {
    if (
      selectedProperty &&
      ($selectedEntityId === null || selectedProperty.entityId !== $selectedEntityId)
    ) {
      selectedProperty = null; // deselect editor
    }
  });
</script>

<!-- Toggle Button -->
<button
  class="fixed top-2 right-2 z-50 bg-bg-panel border border-border-default text-text-primary p-1 rounded shadow-lg hover:bg-bg-overlay size-6"
  onclick={togglePanel}
  title={$panelStore.propertiesPanel.isCollapsed
    ? "Show Properties Panel (T)"
    : "Hide Properties Panel (T)"}
>
  {$panelStore.propertiesPanel.isCollapsed ? "⚙️" : "✕"}
</button>

<!-- Collapsible Properties Panel -->
<div
  class="fixed top-0 right-0 h-full bg-bg-primary/95 backdrop-blur-sm z-40 flex"
  style:width={$panelStore.propertiesPanel.isCollapsed ? "0px" : `${panelWidth}px`}
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
    class="p-2 h-full overflow-y-auto flex-1"
    class:opacity-0={$panelStore.propertiesPanel.isCollapsed}
    class:pointer-events-none={$panelStore.propertiesPanel.isCollapsed}
  >
    <h2 class="text-text-bright mb-2 text-sm font-semibold mt-8">Properties</h2>

    {#if $selectedEntityId === null}
      <div class="text-text-muted italic text-center py-4">
        Select an entity to view its properties
      </div>
    {:else}
      <!-- Property Editor -->
      {#if selectedProperty}
        <PropertyEditor
          config={selectedProperty}
          onUpdate={updateProperty}
          onCancel={cancelPropertyEdit}
        />
      {/if}
      <div class="mb-2 p-2 bg-bg-panel rounded border border-border-subtle">
        <h3 class="text-accent-blue font-semibold mb-1">
          Entity {$selectedEntityId}
        </h3>
        <div class="text-text-secondary text-xs">
          {selectedEntityComponents.size} components
        </div>
      </div>

      {#if selectedEntityComponents.size === 0}
        <div class="text-text-muted italic">No components found</div>
      {:else}
        {#each Array.from(selectedEntityComponents) as [componentType, component] (componentType)}
          <div
            class="mb-3 bg-bg-elevated rounded border border-border-subtle overflow-hidden"
          >
            <div class="px-2 py-1 bg-bg-panel border-b border-border-subtle">
              <h4 class="text-text-bright font-medium text-xs">
                {componentType}
              </h4>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-bg-secondary">
                    <th
                      class="text-left p-1 text-text-secondary font-medium border-b border-border-subtle"
                      >Property</th
                    >
                    <th
                      class="text-left p-1 text-text-secondary font-medium border-b border-border-subtle"
                      >Value</th
                    >
                    <th
                      class="text-left p-1 text-text-secondary font-medium border-b border-border-subtle"
                      >Type</th
                    >
                  </tr>
                </thead>
                <tbody>
                  {#each Object.entries(component) as [key, value]}
                    <tr
                      class="border-b border-border-subtle hover:bg-bg-secondary/50"
                      class:cursor-pointer={isEditableProperty(value)}
                      class:bg-accent-blue={selectedProperty?.componentType ===
                        componentType && selectedProperty?.propertyKey === key}
                      onclick={() => selectProperty(componentType, key, value)}
                    >
                      <td
                        class="p-1 font-mono"
                        class:text-accent-green={!(
                          selectedProperty?.componentType === componentType &&
                          selectedProperty?.propertyKey === key
                        )}
                        class:text-white={selectedProperty?.componentType ===
                          componentType &&
                          selectedProperty?.propertyKey === key}
                      >
                        <span
                          class:underline={isEditableProperty(value) &&
                            !(
                              selectedProperty?.componentType ===
                                componentType &&
                              selectedProperty?.propertyKey === key
                            )}
                        >
                          {key}
                        </span>
                        {#if isEditableProperty(value) && !(selectedProperty?.componentType === componentType && selectedProperty?.propertyKey === key)}
                          <span class="text-accent-blue/60 ml-1 text-[10px]"
                            >●</span
                          >
                        {/if}
                      </td>
                      <td class="p-1 font-mono">
                        {#if isEntityReference(value, key, appState.ecs)}
                          <span
                            class="cursor-pointer hover:underline"
                            class:text-accent-blue={!(
                              selectedProperty?.componentType ===
                                componentType &&
                              selectedProperty?.propertyKey === key
                            )}
                            class:text-white={selectedProperty?.componentType ===
                              componentType &&
                              selectedProperty?.propertyKey === key}
                          >
                            Entity {value}
                          </span>
                        {:else if Array.isArray(value)}
                          <div
                            class:text-text-muted={!(
                              selectedProperty?.componentType ===
                                componentType &&
                              selectedProperty?.propertyKey === key
                            )}
                            class:text-white={selectedProperty?.componentType ===
                              componentType &&
                              selectedProperty?.propertyKey === key}
                          >
                            {#if value.length === 0}
                              <span
                                class:text-text-secondary={!(
                                  selectedProperty?.componentType ===
                                    componentType &&
                                  selectedProperty?.propertyKey === key
                                )}
                                class:text-white={selectedProperty?.componentType ===
                                  componentType &&
                                  selectedProperty?.propertyKey === key}
                                >[]</span
                              >
                            {:else}
                              <details class="cursor-pointer">
                                <summary
                                  class:text-accent-yellow={!(
                                    selectedProperty?.componentType ===
                                      componentType &&
                                    selectedProperty?.propertyKey === key
                                  )}
                                  class:text-white={selectedProperty?.componentType ===
                                    componentType &&
                                    selectedProperty?.propertyKey === key}
                                  class:hover:text-accent-orange={!(
                                    selectedProperty?.componentType ===
                                      componentType &&
                                    selectedProperty?.propertyKey === key
                                  )}>[{value.length} items]</summary
                                >
                                <div
                                  class="mt-1 pl-2 border-l border-border-muted"
                                >
                                  {#each value as item, index}
                                    <div
                                      class="py-0.5"
                                      class:text-text-primary={!(
                                        selectedProperty?.componentType ===
                                          componentType &&
                                        selectedProperty?.propertyKey === key
                                      )}
                                      class:text-white={selectedProperty?.componentType ===
                                        componentType &&
                                        selectedProperty?.propertyKey === key}
                                    >
                                      <span
                                        class:text-text-muted={!(
                                          selectedProperty?.componentType ===
                                            componentType &&
                                          selectedProperty?.propertyKey === key
                                        )}
                                        class:text-white={selectedProperty?.componentType ===
                                          componentType &&
                                          selectedProperty?.propertyKey === key}
                                        >{index}:</span
                                      >
                                      {#if isEntityReference(item, key, appState.ecs)}
                                        <span
                                          class:text-accent-blue={!(
                                            selectedProperty?.componentType ===
                                              componentType &&
                                            selectedProperty?.propertyKey ===
                                              key
                                          )}
                                          class:text-white={selectedProperty?.componentType ===
                                            componentType &&
                                            selectedProperty?.propertyKey ===
                                              key}>Entity {item}</span
                                        >
                                      {:else}
                                        <span
                                          class:text-text-primary={!(
                                            selectedProperty?.componentType ===
                                              componentType &&
                                            selectedProperty?.propertyKey ===
                                              key
                                          )}
                                          class:text-white={selectedProperty?.componentType ===
                                            componentType &&
                                            selectedProperty?.propertyKey ===
                                              key}>{formatValue(item)}</span
                                        >
                                      {/if}
                                    </div>
                                  {/each}
                                </div>
                              </details>
                            {/if}
                          </div>
                        {:else if typeof value === "object" && value !== null}
                          <details class="cursor-pointer">
                            <summary
                              class:text-accent-yellow={!(
                                selectedProperty?.componentType ===
                                  componentType &&
                                selectedProperty?.propertyKey === key
                              )}
                              class:text-white={selectedProperty?.componentType ===
                                componentType &&
                                selectedProperty?.propertyKey === key}
                              class:hover:text-accent-orange={!(
                                selectedProperty?.componentType ===
                                  componentType &&
                                selectedProperty?.propertyKey === key
                              )}>{Object.keys(value).length} properties</summary
                            >
                            <div class="mt-1 pl-2 border-l border-border-muted">
                              {#each Object.entries(value) as [subKey, subValue]}
                                <div class="py-0.5">
                                  <span
                                    class="font-mono"
                                    class:text-accent-green={!(
                                      selectedProperty?.componentType ===
                                        componentType &&
                                      selectedProperty?.propertyKey === key
                                    )}
                                    class:text-white={selectedProperty?.componentType ===
                                      componentType &&
                                      selectedProperty?.propertyKey === key}
                                    >{subKey}:</span
                                  >
                                  <span
                                    class="ml-1"
                                    class:text-text-primary={!(
                                      selectedProperty?.componentType ===
                                        componentType &&
                                      selectedProperty?.propertyKey === key
                                    )}
                                    class:text-white={selectedProperty?.componentType ===
                                      componentType &&
                                      selectedProperty?.propertyKey === key}
                                    >{formatValue(subValue)}</span
                                  >
                                </div>
                              {/each}
                            </div>
                          </details>
                        {:else}
                          <span
                            class:text-text-primary={!(
                              selectedProperty?.componentType ===
                                componentType &&
                              selectedProperty?.propertyKey === key
                            )}
                            class:text-white={selectedProperty?.componentType ===
                              componentType &&
                              selectedProperty?.propertyKey === key}
                            >{formatValue(value)}</span
                          >
                        {/if}
                      </td>
                      <td class="p-1" 
                          class:text-text-muted={!(selectedProperty?.componentType === componentType && selectedProperty?.propertyKey === key)}
                          class:text-white={selectedProperty?.componentType === componentType && selectedProperty?.propertyKey === key}>
                        {#if Array.isArray(value)}
                          Array[{value.length}]
                        {:else if typeof value === "object" && value !== null}
                          Object
                        {:else}
                          {typeof value}
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>
