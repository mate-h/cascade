<script lang="ts">
  import EntityCard from "./EntityCard.svelte";
  import { getECSStats, serializeECS } from "../utils/ecs";

  let { appState } = $props();

  let copyButtonText = $state("Copy as JSON");
  let isLoading = $state(false);
  let buttonIcon = $state("📋");
  let selectedEntityId = $state<number | null>(null);
  let highlightedEntities = $state(new Set<number>());
  let isCollapsed = $state(true);

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
    isCollapsed = !isCollapsed;
  }

  function selectEntity(entityId: number) {
    if (selectedEntityId === entityId) {
      // Deselect if clicking the same entity
      selectedEntityId = null;
      highlightedEntities = new Set();
    } else {
      selectedEntityId = entityId;
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
  class="fixed top-4 left-4 z-50 bg-dark-panel border border-gray-600 text-white p-2 rounded-md shadow-lg hover:bg-dark-component"
  onclick={togglePanel}
  title={isCollapsed ? "Show ECS Panel" : "Hide ECS Panel"}
>
  {isCollapsed ? "📊" : "✕"}
</button>

<!-- Collapsible Panel -->
<div
  class="fixed top-0 left-0 h-full bg-dark-bg/95 backdrop-blur-sm border-r border-gray-600 z-40"
  class:w-120={!isCollapsed}
  class:w-0={isCollapsed}
  class:overflow-hidden={isCollapsed}
>
  <div
    class="p-4 h-full overflow-y-auto"
    class:opacity-0={isCollapsed}
    class:pointer-events-none={isCollapsed}
  >
    <h2 class="text-white mb-4 text-base font-semibold mt-12">ECS Tree</h2>

    <!-- Controls -->
    <div
      class="flex justify-between items-center mb-4 p-3 bg-dark-panel rounded border border-dark-border shadow-sm"
    >
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
      <div class="text-right">
        <div class="text-gray-400 text-[11px] italic">
          {stats.entities} entities, {stats.components} components
        </div>
        {#if selectedEntityId !== null}
          <div class="text-entity-primary text-[10px] mt-0.5">
            Entity {selectedEntityId} selected • {highlightedEntities.size} dependencies
          </div>
        {/if}
      </div>
    </div>

    <!-- Entity List -->
    {#if sortedEntities.length === 0}
      <div class="text-gray-500 italic">No entities in ECS</div>
    {:else}
      {#each sortedEntities as entityId (entityId)}
        <EntityCard
          {entityId}
          ecs={appState.ecs}
          isSelected={selectedEntityId === entityId}
          isHighlighted={highlightedEntities.has(entityId)}
          onSelect={() => selectEntity(entityId)}
        />
      {/each}
    {/if}
  </div>
</div>
