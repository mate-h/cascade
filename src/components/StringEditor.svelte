<script lang="ts">
  let { 
    value, 
    onUpdate 
  }: {
    value: string;
    onUpdate: (newValue: string) => void;
  } = $props();

  let currentValue = $state(value);

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    currentValue = target.value;
    onUpdate(currentValue);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onUpdate(currentValue);
    }
  }
</script>

<div class="space-y-2">
  <div class="flex items-center gap-2">
    <label class="text-text-secondary text-xs font-medium min-w-12">Value:</label>
    <input
      type="text"
      bind:value={currentValue}
      oninput={handleInput}
      onkeydown={handleKeydown}
      class="flex-1 px-2 py-1 text-xs bg-bg-secondary border border-border-subtle rounded text-text-primary focus:border-accent-blue focus:outline-none"
      placeholder="Enter text..."
    />
  </div>

  <div class="text-xs text-text-muted">
    Length: {currentValue.length} characters
  </div>
</div> 