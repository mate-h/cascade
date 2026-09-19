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

  const handleClick = () => {
    onSelect?.();
  };
</script>

<div
  class={[
    "ui-row mb-1 cursor-pointer",
    isSelected && "ui-row-selected",
    isHighlighted && !isSelected && "ui-row-linked",
  ]}
  data-entity-id={entityId}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && handleClick()}
>
  <div class="flex items-center justify-between mb-1">
    <span class={isSelected ? "text-fg-accent" : "text-fg-default"}>
      Entity {entityId}
    </span>
    {#if isSelected}
      <span class="text-fg-success">Selected</span>
    {:else if isHighlighted}
      <span class="text-fg-attention">Linked</span>
    {/if}
  </div>

  {#each Array.from(components) as [componentType] (componentType)}
    <ComponentCard {componentType} {entityId} {ecs} />
  {/each}
</div>
