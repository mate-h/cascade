<script lang="ts">
  import NumberEditor from './NumberEditor.svelte';
  import StringEditor from './StringEditor.svelte';
  import BooleanEditor from './BooleanEditor.svelte';

  export interface PropertyConfig {
    entityId: number;
    componentType: string;
    propertyKey: string;
    value: any;
    type: string;
    // Number-specific config
    min?: number;
    max?: number;
    step?: number;
  }

  let { 
    config, 
    onUpdate,
    onCancel 
  }: {
    config: PropertyConfig;
    onUpdate: (newValue: any) => void;
    onCancel: () => void;
  } = $props();

  function handleUpdate(newValue: any) {
    onUpdate(newValue);
  }
</script>

<div class="bg-bg-elevated border border-border-default rounded p-3 mb-4">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-text-bright font-semibold text-sm">
      Editing: {config.componentType}.{config.propertyKey}
    </h3>
    <button
      class="text-text-muted hover:text-text-primary text-xs px-2 py-1 rounded bg-bg-secondary hover:bg-bg-panel border border-border-subtle"
      onclick={onCancel}
    >
      Cancel
    </button>
  </div>

  <div class="text-xs text-text-secondary mb-2">
    Entity {config.entityId} • Type: {config.type}
  </div>

  {#if config.type === 'number'}
    <NumberEditor 
      value={config.value}
      min={config.min}
      max={config.max}
      step={config.step}
      onUpdate={handleUpdate}
    />
  {:else if config.type === 'string'}
    <StringEditor 
      value={config.value}
      onUpdate={handleUpdate}
    />
  {:else if config.type === 'boolean'}
    <BooleanEditor 
      value={config.value}
      onUpdate={handleUpdate}
    />
  {:else}
    <div class="text-text-muted italic">
      Property type "{config.type}" is not editable
    </div>
  {/if}
</div> 