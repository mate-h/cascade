<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import EntityCard from "./EntityCard.svelte";
  import { getECSStats, serializeECS } from "../utils/ecs";
  import { selectedEntityId, selectEntity } from "../stores/selection";
  import { panelStore, createResizeHandler } from "../stores/panels";

  let { appState } = $props();

  let copyButtonText = $state("Copy as JSON");
  let isLoading = $state(false);
  let buttonIcon = $state("📋");
  let highlightedEntities = $state(new Set<number>());
  
  // Use panel store for collapse state and width
  let panelWidth = $state(0);
  let isResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;

  // Subscribe to panel store
  $effect(() => {
    const unsubscribe = panelStore.subscribe(sizes => {
      panelWidth = sizes.ecsPanel.width;
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
    resizeHandler = createResizeHandler('ecsPanel', (width) => {
      panelWidth = width;
    });
  });

  onDestroy(() => {
    resizeHandler?.cleanup();
  });

  // Keyboard shortcut handler
  function handleKeydown(event: KeyboardEvent) {
    if (
      event.key.toLowerCase() === "n" &&
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
  }

  // Add global keydown listener
  $effect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  const stats = $derived(getECSStats(appState.ecs));
  const sortedEntities = $derived(
    [...appState.ecs.entities].sort((a, b) => a - b)
  );

  async function copyECSAsJSON() {
    if (isLoading) return;

    isLoading = true;
    buttonIcon = "⏳";
    copyButtonText = "Copying...";

    try {
      const serialized = serializeECS(appState.ecs);
      const jsonString = JSON.stringify(serialized, null, 2);

      await navigator.clipboard.writeText(jsonString);

      buttonIcon = "✅";
      copyButtonText = "Copied!";

      setTimeout(() => {
        buttonIcon = "📋";
        copyButtonText = "Copy as JSON";
        isLoading = false;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy ECS JSON:", error);

      buttonIcon = "❌";
      copyButtonText = "Failed to copy";

      setTimeout(() => {
        buttonIcon = "📋";
        copyButtonText = "Copy as JSON";
        isLoading = false;
      }, 2000);
    }
  }

  function togglePanel() {
    panelStore.togglePanel('ecsPanel');
  }

  function handleEntitySelect(entityId: number) {
    if ($selectedEntityId === entityId) {
      // Deselect if clicking the same entity
      selectEntity(null);
      highlightedEntities = new Set();
    } else {
      selectEntity(entityId);
      highlightedEntities = findEntityDependencies(entityId);
    }
  }

  function findEntityDependencies(entityId: number): Set<number> {
    const dependencies = new Set<number>();

    // Get all components for this entity
    const entityComponents = Array.from(appState.ecs.components.values())
      .map((componentMap) => (componentMap as Map<number, any>).get(entityId))
      .filter((component) => component !== undefined);

    // Look for entity references in component data
    entityComponents.forEach((component) => {
      if (component && typeof component === "object") {
        Object.entries(component).forEach(([key, value]) => {
          // Check if this field contains entity references
          const entityReferenceFields = [
            "inputs",
            "outputs",
            "dependencies",
            "targets",
            "sources",
          ];
          if (entityReferenceFields.includes(key.toLowerCase())) {
            if (Array.isArray(value)) {
              value.forEach((item) => {
                if (
                  typeof item === "number" &&
                  appState.ecs.entities.has(item)
                ) {
                  dependencies.add(item);
                }
              });
            } else if (
              typeof value === "number" &&
              appState.ecs.entities.has(value)
            ) {
              dependencies.add(value);
            }
          }
        });
      }
    });

    // Also find entities that reference this entity
    for (const [, componentMap] of appState.ecs.components) {
      for (const [otherEntityId, component] of componentMap as Map<
        number,
        any
      >) {
        if (
          otherEntityId !== entityId &&
          component &&
          typeof component === "object"
        ) {
          Object.entries(component).forEach(([key, value]) => {
            const entityReferenceFields = [
              "inputs",
              "outputs",
              "dependencies",
              "targets",
              "sources",
            ];
            if (entityReferenceFields.includes(key.toLowerCase())) {
              if (Array.isArray(value) && value.includes(entityId)) {
                dependencies.add(otherEntityId);
              } else if (value === entityId) {
                dependencies.add(otherEntityId);
              }
            }
          });
        }
      }
    }

    return dependencies;
  }
</script>

<!-- Toggle Button -->
<button
  class="fixed top-2 left-2 z-50 bg-bg-panel border border-border-default text-text-primary p-1 rounded shadow-lg hover:bg-bg-overlay size-6"
  onclick={togglePanel}
  title={$panelStore.ecsPanel.isCollapsed ? "Show ECS Panel (N)" : "Hide ECS Panel (N)"}
>
  {$panelStore.ecsPanel.isCollapsed ? "📊" : "✕"}
</button>

<!-- Collapsible Panel -->
<div
  class="fixed top-0 left-0 h-full bg-bg-primary/95 backdrop-blur-sm z-40 flex"
  style:width={$panelStore.ecsPanel.isCollapsed ? "0px" : `${panelWidth}px`}
  class:overflow-hidden={$panelStore.ecsPanel.isCollapsed}
>
  <div
    class="p-2 h-full overflow-y-auto flex-1"
    class:opacity-0={$panelStore.ecsPanel.isCollapsed}
    class:pointer-events-none={$panelStore.ecsPanel.isCollapsed}
  >
    <h2 class="text-text-bright mb-2 text-sm font-semibold mt-8">ECS Tree</h2>

    <!-- Controls -->
    <div class="mb-2 p-2 bg-bg-panel rounded border border-border-subtle">
      <button
        class="btn"
        class:opacity-75={isLoading}
        class:cursor-wait={isLoading}
        onclick={copyECSAsJSON}
        disabled={isLoading}
        title="Copy the entire ECS structure as JSON to clipboard"
      >
        <span class="text-sm">{buttonIcon}</span>
        <span>{copyButtonText}</span>
      </button>

      <div class="text-text-secondary italic mt-0.5">
        {stats.entities} entities, {stats.components} components
      </div>

      {#if $selectedEntityId !== null}
        <div class="text-accent-blue mt-0.5">
          Entity {$selectedEntityId} selected • {highlightedEntities.size} dependencies
        </div>
      {/if}
    </div>

    <!-- Entity List -->
    {#if sortedEntities.length === 0}
      <div class="text-text-muted italic">No entities in ECS</div>
    {:else}
      {#each sortedEntities as entityId (entityId)}
        <EntityCard
          {entityId}
          ecs={appState.ecs}
          isSelected={$selectedEntityId === entityId}
          isHighlighted={highlightedEntities.has(entityId)}
          onSelect={() => handleEntitySelect(entityId)}
        />
      {/each}
    {/if}
  </div>
  
  <!-- Resize Handle Border -->
  {#if !$panelStore.ecsPanel.isCollapsed}
    <div
      class="w-1 bg-border-default hover:bg-accent-blue cursor-col-resize transition-colors duration-150 ease-in-out flex-shrink-0"
      class:bg-accent-blue={isResizing}
      class:w-2={isResizing}
      onmousedown={(e) => resizeHandler?.startResize(e, panelWidth)}
      title="Drag to resize panel"
    ></div>
  {/if}
</div>
