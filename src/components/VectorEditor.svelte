<script lang="ts">
  import NumberEditor from './NumberEditor.svelte';
  import { CONFIG } from '../config';

  let { 
    value, 
    min = -100, 
    max = 100, 
    step = 0.1,
    onUpdate,
    resetValue = 0
  }: {
    value: number[] | Float32Array;
    min?: number;
    max?: number;
    step?: number;
    onUpdate: (newValue: number[] | Float32Array) => void;
    resetValue?: number;
  } = $props();

  // Convert to array and ensure we have the right number of components
  let vectorArray = $state([...value]);
  let componentCount = vectorArray.length;
  let originalType = $state(value instanceof Float32Array ? 'Float32Array' : 'Array');

  // Update vectorArray when the value prop changes (e.g., when switching properties)
  $effect(() => {
    // Only update if the values are actually different
    const newArray = [...value];
    const hasChanged = newArray.length !== vectorArray.length || 
                      newArray.some((v, i) => v !== vectorArray[i]);
    
    if (hasChanged) {
      vectorArray = newArray;
      componentCount = vectorArray.length;
      originalType = value instanceof Float32Array ? 'Float32Array' : 'Array';
    }
  });
  
  // Component labels for different vector types
  const componentLabels = ['X', 'Y', 'Z', 'W'];

  function handleComponentUpdate(index: number, newValue: number) {
    vectorArray[index] = newValue;
    // Preserve the original type (Float32Array or Array)
    const updatedValue = originalType === 'Float32Array' 
      ? new Float32Array(vectorArray)
      : [...vectorArray];
    onUpdate(updatedValue);
  }

  function resetToDefault() {
    vectorArray = new Array(componentCount).fill(resetValue);
    // Preserve the original type (Float32Array or Array)
    const updatedValue = originalType === 'Float32Array' 
      ? new Float32Array(vectorArray)
      : [...vectorArray];
    onUpdate(updatedValue);
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <div class="text-xs text-text-secondary">
      Vector ({componentCount} components)
    </div>
    <div class="flex gap-1">
      <button
        onclick={resetToDefault}
        class="text-xs px-2 py-1 bg-bg-secondary hover:bg-bg-panel border border-border-subtle rounded text-text-muted hover:text-text-primary"
        title="Reset to {resetValue}"
      >
        {resetValue}
      </button>
    </div>
  </div>

  <div class="space-y-2">
    {#each vectorArray as component, index}
      <div class="border-l-2 border-border-subtle pl-3">
        <NumberEditor
          value={component}
          label={componentLabels[index]}
          {min}
          {max}
          {step}
          onUpdate={(newValue) => handleComponentUpdate(index, newValue)}
          showRange={false}
        />
      </div>
    {/each}
  </div>

  <!-- Vector preview -->
  <div class="text-xs text-text-muted bg-bg-secondary p-2 rounded border border-border-subtle">
    <div class="font-mono">
      [{vectorArray.map(v => v.toFixed(CONFIG.DECIMAL_PRECISION)).join(', ')}]
    </div>
  </div>
</div> 