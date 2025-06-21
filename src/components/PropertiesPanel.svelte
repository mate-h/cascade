<script lang="ts">
  import { getEntityComponents } from "../utils/ecs";
  import { selectedEntityId } from "../stores/selection";

  let { appState, isCollapsed = true } = $props();

  const selectedEntityComponents = $derived(
    $selectedEntityId !== null ? getEntityComponents($selectedEntityId, appState.ecs) : new Map()
  );

  function togglePanel() {
    isCollapsed = !isCollapsed;
  }

  // Keyboard shortcut handler
  function handleKeydown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Only trigger if not typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
        event.preventDefault();
        togglePanel();
      }
    }
  }

  // Add global keydown listener
  $effect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  const formatValue = (value: any, ecs: any): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return `[${value.length} items]`;
    }
    
    if (typeof value === 'object') {
      return `{${Object.keys(value).length} properties}`;
    }
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    if (typeof value === 'number') {
      // Check if it might be an entity reference
      if (ecs.entities.has(value)) {
        return `${value} (Entity)`;
      }
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    return String(value);
  };

  const isEntityReference = (value: any, key: string, ecs: any): boolean => {
    if (typeof value !== "number" || !ecs.entities.has(value)) {
      return false;
    }
    
    const entityReferenceFields = [
      "inputs", "outputs", "dependencies", "targets", "sources"
    ];
    return entityReferenceFields.includes(key.toLowerCase());
  };
</script>

<!-- Toggle Button -->
<button
  class="fixed top-2 right-2 z-50 bg-bg-panel border border-border-default text-text-primary p-1 rounded shadow-lg hover:bg-bg-overlay size-6"
  onclick={togglePanel}
  title={isCollapsed ? "Show Properties Panel (T)" : "Hide Properties Panel (T)"}
>
  {isCollapsed ? "⚙️" : "✕"}
</button>

<!-- Collapsible Properties Panel -->
<div
  class="fixed top-0 right-0 h-full bg-bg-primary/95 backdrop-blur-sm border-l border-border-default z-40"
  class:w-80={!isCollapsed}
  class:w-0={isCollapsed}
  class:overflow-hidden={isCollapsed}
>
  <div
    class="p-2 h-full overflow-y-auto"
    class:opacity-0={isCollapsed}
    class:pointer-events-none={isCollapsed}
  >
    <h2 class="text-text-bright mb-2 text-sm font-semibold mt-8">Properties</h2>

    {#if $selectedEntityId === null}
      <div class="text-text-muted italic text-center py-4">
        Select an entity to view its properties
      </div>
    {:else}
      <div class="mb-2 p-2 bg-bg-panel rounded border border-border-subtle">
        <h3 class="text-accent-blue font-semibold mb-1">Entity {$selectedEntityId}</h3>
        <div class="text-text-secondary text-xs">
          {selectedEntityComponents.size} components
        </div>
      </div>

      {#if selectedEntityComponents.size === 0}
        <div class="text-text-muted italic">No components found</div>
      {:else}
        {#each Array.from(selectedEntityComponents) as [componentType, component] (componentType)}
          <div class="mb-3 bg-bg-elevated rounded border border-border-subtle overflow-hidden">
            <div class="px-2 py-1 bg-bg-panel border-b border-border-subtle">
              <h4 class="text-text-bright font-medium text-xs">{componentType}</h4>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-bg-secondary">
                    <th class="text-left p-1 text-text-secondary font-medium border-b border-border-subtle">Property</th>
                    <th class="text-left p-1 text-text-secondary font-medium border-b border-border-subtle">Value</th>
                    <th class="text-left p-1 text-text-secondary font-medium border-b border-border-subtle">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Object.entries(component) as [key, value]}
                    <tr class="border-b border-border-subtle hover:bg-bg-secondary/50">
                      <td class="p-1 text-accent-green font-mono">{key}</td>
                      <td class="p-1 font-mono">
                        {#if isEntityReference(value, key, appState.ecs)}
                          <span class="text-accent-blue cursor-pointer hover:underline">
                            Entity {value}
                          </span>
                        {:else if Array.isArray(value)}
                          <div class="text-text-muted">
                            {#if value.length === 0}
                              <span class="text-text-secondary">[]</span>
                            {:else}
                                                             <details class="cursor-pointer">
                                 <summary class="text-accent-yellow hover:text-accent-orange">[{value.length} items]</summary>
                                 <div class="mt-1 pl-2 border-l border-border-muted">
                                   {#each value as item, index}
                                     <div class="py-0.5 text-text-primary">
                                       <span class="text-text-muted">{index}:</span>
                                       {#if isEntityReference(item, key, appState.ecs)}
                                         <span class="text-accent-blue">Entity {item}</span>
                                       {:else}
                                         <span class="text-text-primary">{formatValue(item, appState.ecs)}</span>
                                       {/if}
                                     </div>
                                   {/each}
                                 </div>
                               </details>
                            {/if}
                          </div>
                                                 {:else if typeof value === 'object' && value !== null}
                           <details class="cursor-pointer">
                             <summary class="text-accent-yellow hover:text-accent-orange">{Object.keys(value).length} properties</summary>
                             <div class="mt-1 pl-2 border-l border-border-muted">
                               {#each Object.entries(value) as [subKey, subValue]}
                                 <div class="py-0.5">
                                   <span class="text-accent-green font-mono">{subKey}:</span>
                                   <span class="text-text-primary ml-1">{formatValue(subValue, appState.ecs)}</span>
                                 </div>
                               {/each}
                             </div>
                           </details>
                         {:else}
                           <span class="text-text-primary">{formatValue(value, appState.ecs)}</span>
                         {/if}
                       </td>
                       <td class="p-1 text-text-muted">
                        {#if Array.isArray(value)}
                          Array[{value.length}]
                        {:else if typeof value === 'object' && value !== null}
                          Object
                        {:else}
                          {typeof value}
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div> 