<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import EntityCard from "./EntityCard.svelte";
  import IconButton from "./ui/IconButton.svelte";
  import Icon from "./ui/Icon.svelte";
  import Kbd from "./ui/Kbd.svelte";
  import { getECSStats, serializeECS } from "../utils/ecs";
  import { selectedEntityId, selectEntity } from "../stores/selection";
  import { panelStore, createResizeHandler } from "../stores/panels";

  let { appState } = $props();

  let copyButtonText = $state("Copy JSON");
  let copied = $state(false);
  let isLoading = $state(false);
  let highlightedEntities = $state(new Set<number>());
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

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "n" || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (isTypingTarget(event.target)) return;
    event.preventDefault();
    togglePanel();
  };

  const stats = $derived(getECSStats(appState.ecs));
  const sortedEntities = $derived([...appState.ecs.entities].sort((a, b) => a - b));
  const isCollapsed = $derived($panelStore.ecsPanel.isCollapsed);

  const copyECSAsJSON = async () => {
    if (isLoading) return;

    isLoading = true;
    copyButtonText = "Copying";

    try {
      const serialized = serializeECS(appState.ecs);
      await navigator.clipboard.writeText(JSON.stringify(serialized, null, 2));
      copied = true;
      copyButtonText = "Copied";
    } catch (error) {
      console.error("Failed to copy ECS JSON:", error);
      copied = false;
      copyButtonText = "Failed";
    }

    setTimeout(() => {
      copyButtonText = "Copy JSON";
      copied = false;
      isLoading = false;
    }, 2000);
  };

  const togglePanel = () => {
    panelStore.togglePanel("ecsPanel");
  };

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

<svelte:window onkeydown={handleKeydown} />

{#if isCollapsed}
  <IconButton
    class="fixed top-3 left-3 z-[60]"
    name="boxes"
    title="Show ECS panel (N)"
    onclick={togglePanel}
  />
{/if}

<div
  class="ui-panel fixed top-0 left-0 h-full z-40 flex border-r"
  class:overflow-hidden={isCollapsed}
  style:width={isCollapsed ? "0px" : `${panelWidth}px`}
>
  <div
    class={["flex flex-col h-full flex-1", isCollapsed && "opacity-0 pointer-events-none"]}
  >
    <header class="flex items-center gap-2 h-10 px-2 border-b border-border-default">
      <IconButton name="x" title="Hide ECS panel (N)" onclick={togglePanel} />
      <span class="text-fg-default">ECS</span>
      <Kbd>N</Kbd>
      <span class="ml-auto text-fg-muted">{stats.entities}</span>
    </header>

    <div class="flex items-center gap-2 px-2 py-2 border-b border-border-muted">
      <button
        type="button"
        class="ui-btn"
        class:cursor-wait={isLoading}
        onclick={copyECSAsJSON}
        disabled={isLoading}
        title="Copy the entire ECS structure as JSON"
      >
        <Icon name={copied ? "check" : "copy"} />
        <span>{copyButtonText}</span>
      </button>
      <span class="text-fg-muted">{stats.components} components</span>
    </div>

    {#if $selectedEntityId !== null}
      <div class="px-2 py-1.5 text-fg-accent border-b border-border-muted">
        Entity {$selectedEntityId} · {highlightedEntities.size} linked
      </div>
    {/if}

    <div class="flex-1 overflow-y-auto p-2">
      {#if sortedEntities.length === 0}
        <div class="text-fg-muted px-2 py-6 text-center">No entities</div>
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
</div>
