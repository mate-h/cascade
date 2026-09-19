<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import EntityCard from "./EntityCard.svelte";
  import { getECSStats, getEntityLabel } from "../utils/ecs";
  import { selectedEntityId, selectEntity } from "../stores/selection";
  import { panelStore, createResizeHandler } from "../stores/panels";
  import { ecsUiRevision } from "../stores/ecs-ui";
  import PanelSearch from "./ui/PanelSearch.svelte";

  let { appState } = $props();

  let highlightedEntities = $state(new Set<number>());
  let search = $state("");
  let panelWidth = $state(0);
  let isResizing = $state(false);
  let resizeHandler: ReturnType<typeof createResizeHandler> | null = null;

  $effect(() => {
    const unsubscribe = panelStore.subscribe((sizes) => {
      panelWidth = sizes.ecsPanel.width;
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
    resizeHandler = createResizeHandler("ecsPanel", (width) => {
      panelWidth = width;
    });
  });

  onDestroy(() => {
    resizeHandler?.cleanup();
  });

  const stats = $derived(getECSStats(appState.ecs));
  const visibleEntities = $derived.by(() => {
    $ecsUiRevision;
    const query = search.trim().toLowerCase();
    const ids = [...appState.ecs.entities].sort((a, b) => a - b);
    if (!query) return ids;
    return ids.filter((id) =>
      getEntityLabel(appState.ecs, id).toLowerCase().includes(query),
    );
  });
  const isCollapsed = $derived($panelStore.ecsPanel.isCollapsed);

  const handleEntitySelect = (entityId: number) => {
    if ($selectedEntityId === entityId) {
      selectEntity(null);
      highlightedEntities = new Set();
    } else {
      selectEntity(entityId);
      highlightedEntities = findEntityDependencies(entityId);
    }
  };

  const findEntityDependencies = (entityId: number): Set<number> => {
    const dependencies = new Set<number>();
    const entityReferenceFields = ["inputs", "outputs", "dependencies", "targets", "sources"];

    const entityComponents = Array.from(appState.ecs.components.values())
      .map((componentMap) => (componentMap as Map<number, unknown>).get(entityId))
      .filter((component) => component !== undefined);

    entityComponents.forEach((component) => {
      if (component && typeof component === "object") {
        Object.entries(component).forEach(([key, value]) => {
          if (!entityReferenceFields.includes(key.toLowerCase())) return;
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (typeof item === "number" && appState.ecs.entities.has(item)) {
                dependencies.add(item);
              }
            });
          } else if (typeof value === "number" && appState.ecs.entities.has(value)) {
            dependencies.add(value);
          }
        });
      }
    });

    for (const [, componentMap] of appState.ecs.components) {
      for (const [otherEntityId, component] of componentMap as Map<number, unknown>) {
        if (otherEntityId === entityId || !component || typeof component !== "object") continue;
        Object.entries(component).forEach(([key, value]) => {
          if (!entityReferenceFields.includes(key.toLowerCase())) return;
          if (Array.isArray(value) && value.includes(entityId)) {
            dependencies.add(otherEntityId);
          } else if (value === entityId) {
            dependencies.add(otherEntityId);
          }
        });
      }
    }

    return dependencies;
  };
</script>

{#if !isCollapsed}
  <div
    class="ui-panel h-full flex flex-shrink-0 border-r overflow-hidden"
    style:width={`${panelWidth}px`}
  >
    <div class="flex flex-col h-full flex-1 min-w-0">
      <header class="flex items-center gap-2 h-10 px-2 border-b border-border-default">
        <PanelSearch placeholder="Entities" bind:value={search} />
        <span class="text-fg-muted">{search.trim() ? visibleEntities.length : stats.entities}</span>
      </header>

      <div class="flex-1 overflow-y-auto p-1">
        {#if visibleEntities.length === 0}
          <div class="text-fg-muted px-2 py-6 text-center">
            {search.trim() ? "No matching entities" : "No entities"}
          </div>
        {:else}
          {#each visibleEntities as entityId (entityId)}
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
  </div>
{/if}
