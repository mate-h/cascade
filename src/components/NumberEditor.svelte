<script lang="ts">
  let { 
    value, 
    min = 0, 
    max = 100, 
    step = 1,
    onUpdate 
  }: {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onUpdate: (newValue: number) => void;
  } = $props();

  let currentValue = $state(value);
  let isInteger = $derived(step >= 1 || Number.isInteger(step));

  function handleSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    currentValue = newValue;
    onUpdate(newValue);
  }

  function handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    if (!isNaN(newValue)) {
      currentValue = Math.max(min, Math.min(max, newValue));
      onUpdate(currentValue);
    }
  }

  function formatValue(val: number): string {
    return isInteger ? val.toString() : val.toFixed(3);
  }

  // Generate a unique ID for the input to link with the label
  const inputId = `number-input-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class="space-y-2">
  <div class="flex items-center gap-2">
    <label for={inputId} class="text-text-secondary text-xs min-w-12">Value:</label>
    <input
      id={inputId}
      type="number"
      bind:value={currentValue}
      {min}
      {max}
      {step}
      oninput={handleInputChange}
      class="flex-1 px-2 py-1 text-xs bg-bg-secondary border border-border-subtle rounded text-text-primary focus:border-accent-blue focus:outline-none"
    />
  </div>

  <div class="space-y-1">
    <div class="flex justify-between text-xs text-text-muted">
      <span>{min}</span>
      <span class="text-text-primary">{formatValue(currentValue)}</span>
      <span>{max}</span>
    </div>
    <input
      type="range"
      bind:value={currentValue}
      {min}
      {max}
      {step}
      oninput={handleSliderChange}
      class="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer slider"
    />
  </div>

  <div class="text-xs text-text-muted">
    Range: {min} to {max} • Step: {step}
  </div>
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: rgb(var(--accent-blue));
    cursor: pointer;
    border: 2px solid rgb(var(--bg-primary));
    box-shadow: 0 0 0 1px rgb(var(--border-default));
  }

  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: rgb(var(--accent-blue));
    cursor: pointer;
    border: 2px solid rgb(var(--bg-primary));
    box-shadow: 0 0 0 1px rgb(var(--border-default));
  }

  .slider::-webkit-slider-track {
    background: rgb(var(--bg-panel));
    border: 1px solid rgb(var(--border-subtle));
    border-radius: 4px;
  }

  .slider::-moz-range-track {
    background: rgb(var(--bg-panel));
    border: 1px solid rgb(var(--border-subtle));
    border-radius: 4px;
  }
</style> 