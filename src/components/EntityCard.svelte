<script lang="ts">
  import ComponentCard from "./ComponentCard.svelte";
  import { getEntityComponents } from "../utils/ecs";

  let {
    entityId,
    ecs,
    isSelected = false,
    isHighlighted = false,
    onSelect,
  } = $props();

  const components = $derived(getEntityComponents(entityId, ecs));

  function handleClick() {
    if (onSelect) {
      onSelect();
    }
  }
</script>

<div
  class="entity-card cursor-pointer transition-all duration-200"
  class:entity-selected={isSelected}
  class:entity-highlighted={isHighlighted}
  class:hover:bg-bg-elevated={!isSelected}
  data-entity-id={entityId}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && handleClick()}
>
  <div
    class="text-accent-blue font-semibold mb-1 flex items-center justify-between"
  >
    <span>Entity {entityId}</span>
    {#if isSelected}
      <span class="text-xs text-accent-green">Selected</span>
    {:else if isHighlighted}
      <span class="text-xs text-accent-yellow">Dependency</span>
    {/if}
  </div>

  {#each Array.from(components) as [componentType] (componentType)}
    <ComponentCard {componentType} {entityId} {ecs} />
  {/each}
</div>
