<script>
  import EntityCard from './EntityCard.svelte'
  import { getECSStats, serializeECS } from '../utils/ecs'

  let { appState } = $props()

  let copyButtonText = $state('Copy as JSON')
  let isLoading = $state(false)
  let buttonIcon = $state('📋')

  const stats = $derived(getECSStats(appState.ecs))
  const sortedEntities = $derived(Array.from(appState.ecs.entities).sort((a, b) => a - b))

  async function copyECSAsJSON() {
    if (isLoading) return
    
    isLoading = true
    buttonIcon = '⏳'
    copyButtonText = 'Copying...'
    
    try {
      const serialized = serializeECS(appState.ecs)
      const jsonString = JSON.stringify(serialized, null, 2)
      
      await navigator.clipboard.writeText(jsonString)
      
      buttonIcon = '✅'
      copyButtonText = 'Copied!'
      
      setTimeout(() => {
        buttonIcon = '📋'
        copyButtonText = 'Copy as JSON'
        isLoading = false
      }, 2000)
    } catch (error) {
      console.error('Failed to copy ECS JSON:', error)
      
      buttonIcon = '❌'
      copyButtonText = 'Failed to copy'
      
      setTimeout(() => {
        buttonIcon = '📋'
        copyButtonText = 'Copy as JSON'
        isLoading = false
      }, 2000)
    }
  }
</script>

<div class="w-1/2 h-full panel-bg p-4 overflow-y-auto border-r border-gray-600">
  <h2 class="text-white mb-4 text-base font-semibold">ECS Tree</h2>
  
  <!-- Controls -->
  <div class="flex justify-between items-center mb-4 p-3 bg-dark-panel rounded border border-dark-border shadow-sm">
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
      <div class="text-gray-500 text-[10px] mt-0.5">
        Click entity references to highlight
      </div>
    </div>
  </div>

  <!-- Entity List -->
  {#if sortedEntities.length === 0}
    <div class="text-gray-500 italic">No entities in ECS</div>
  {:else}
    {#each sortedEntities as entityId (entityId)}
      <EntityCard {entityId} ecs={appState.ecs} />
    {/each}
  {/if}
</div> 