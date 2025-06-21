<script>
  import ComponentCard from './ComponentCard.svelte'
  import { getEntityComponents } from '../utils/ecs'

  let { entityId, ecs } = $props()

  let isHighlighted = $state(false)
  
  const components = $derived(getEntityComponents(entityId, ecs))

  export function highlight() {
    isHighlighted = true
    setTimeout(() => {
      isHighlighted = false
    }, 3000)
  }
</script>

<div 
  class="entity-card {isHighlighted ? 'entity-highlighted' : ''}"
  data-entity-id={entityId}
>
  <div class="text-entity-primary font-semibold mb-1">
    Entity {entityId}
  </div>
  
  {#each Array.from(components) as [componentType, component] (componentType)}
    <ComponentCard {componentType} {component} {ecs} />
  {/each}
</div> 