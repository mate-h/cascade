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
  class:hover:bg-dark-panel={!isSelected}
  data-entity-id={entityId}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && handleClick()}
>
  <div
    class="text-entity-primary font-semibold mb-1 flex items-center justify-between"
  >
    <span>Entity {entityId}</span>
    {#if isSelected}
      <span class="text-xs text-entity-success">Selected</span>
    {:else if isHighlighted}
      <span class="text-xs text-entity-warning">Dependency</span>
    {/if}
  </div>

  {#each Array.from(components) as [componentType, component] (componentType)}
    <ComponentCard
      {componentType}
      {component}
      {ecs}
      onEntitySelect={onSelect}
    />
  {/each}
</div>
