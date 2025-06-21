<script lang="ts">
  import EntityCard from "./EntityCard.svelte";
  import { getECSStats, serializeECS } from "../utils/ecs";
  import { selectedEntityId, selectEntity } from "../stores/selection";

  let { appState } = $props();

  let copyButtonText = $state("Copy as JSON");
  let isLoading = $state(false);
  let buttonIcon = $state("📋");
  let highlightedEntities = $state(new Set<number>());
  let isCollapsed = $state(true);

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
    isCollapsed = !isCollapsed;
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
  title={isCollapsed ? "Show ECS Panel (N)" : "Hide ECS Panel (N)"}
>
  {isCollapsed ? "📊" : "✕"}
</button>

<!-- Collapsible Panel -->
<div
  class="fixed top-0 left-0 h-full bg-bg-primary/95 backdrop-blur-sm border-r border-border-default z-40"
  class:w-96={!isCollapsed}
  class:w-0={isCollapsed}
  class:overflow-hidden={isCollapsed}
>
  <div
    class="p-2 h-full overflow-y-auto"
    class:opacity-0={isCollapsed}
    class:pointer-events-none={isCollapsed}
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
</div>
