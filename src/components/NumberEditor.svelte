<script lang="ts">
  let {
    value,
    label = "Value",
    min = 0,
    max = 100,
    step = 1,
    onUpdate,
    showRange = true,
    showSlider = true,
  }: {
    value: number;
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    onUpdate: (newValue: number) => void;
    showRange?: boolean;
    showSlider?: boolean;
  } = $props();

  let currentValue = $derived(value);
  const isInteger = $derived(step >= 1 || Number.isInteger(step));
  const inputId = `number-input-${Math.random().toString(36).slice(2, 9)}`;

  const commit = (next: number) => {
    if (Number.isNaN(next)) return;
    currentValue = Math.max(min, Math.min(max, next));
    onUpdate(currentValue);
  };

  const handleSliderChange = (event: Event) => {
    commit(parseFloat((event.target as HTMLInputElement).value));
  };

  const handleInputChange = (event: Event) => {
    commit(parseFloat((event.target as HTMLInputElement).value));
  };

  const formatValue = (val: number): string =>
    isInteger ? val.toString() : val.toFixed(3);
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <label for={inputId} class="text-fg-muted min-w-12">{label}</label>
    <input
      id={inputId}
      type="number"
      bind:value={currentValue}
      {min}
      {max}
      {step}
      oninput={handleInputChange}
      class="ui-input flex-1"
    />
  </div>

  {#if showSlider}
    <div class="flex flex-col gap-1">
      {#if showRange}
        <div class="flex justify-between text-fg-muted">
          <span>{min}</span>
          <span class="text-fg-default">{formatValue(currentValue)}</span>
          <span>{max}</span>
        </div>
      {/if}
      <input
        type="range"
        bind:value={currentValue}
        {min}
        {max}
        {step}
        oninput={handleSliderChange}
      />
    </div>
  {/if}
</div>
