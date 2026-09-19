<script lang="ts">
  let {
    value,
    onUpdate,
  }: {
    value: boolean;
    onUpdate: (newValue: boolean) => void;
  } = $props();

  let currentValue = $derived(value);

  const handleToggle = () => {
    onUpdate(currentValue);
  };
</script>

<label class="flex items-center gap-2 cursor-pointer">
  <span class="text-fg-muted min-w-12">Value</span>
  <input
    type="checkbox"
    bind:checked={currentValue}
    onchange={handleToggle}
    class="size-3.5 rounded-sm border border-border-default bg-canvas-inset"
  />
  <span class={currentValue ? "text-fg-success" : "text-fg-muted"}>
    {currentValue ? "true" : "false"}
  </span>
</label>
