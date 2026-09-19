<script lang="ts">
  let {
    value,
    onUpdate,
  }: {
    value: string;
    onUpdate: (newValue: string) => void;
  } = $props();

  let currentValue = $derived(value);
  const inputId = `string-input-${Math.random().toString(36).slice(2, 9)}`;

  const handleInput = (event: Event) => {
    currentValue = (event.target as HTMLInputElement).value;
    onUpdate(currentValue);
  };
</script>

<div class="flex items-center gap-2">
  <label for={inputId} class="text-fg-muted min-w-12">Value</label>
  <input
    id={inputId}
    type="text"
    bind:value={currentValue}
    oninput={handleInput}
    class="ui-input flex-1"
    placeholder="Enter text"
  />
</div>
