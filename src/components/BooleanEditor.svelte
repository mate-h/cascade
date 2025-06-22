<script lang="ts">
  let { 
    value, 
    onUpdate 
  }: {
    value: boolean;
    onUpdate: (newValue: boolean) => void;
  } = $props();

  let currentValue = $state(value);

  function handleToggle() {
    onUpdate(currentValue);
  }
</script>

<div class="space-y-2">
  <div class="flex items-center gap-2">
    <span class="text-text-secondary text-xs font-medium min-w-12">Value:</span>
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        bind:checked={currentValue}
        onchange={handleToggle}
        class="w-4 h-4 rounded border-2 border-border-default bg-bg-secondary checked:bg-accent-blue checked:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
      />
      <span class="text-xs font-mono" class:text-accent-green={currentValue} class:text-text-muted={!currentValue}>
        {currentValue ? 'true' : 'false'}
      </span>
    </label>
  </div>

  <div class="text-xs text-text-muted">
    Click to toggle between true/false
  </div>
</div> 