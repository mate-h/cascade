<script lang="ts">
  import { Slider } from "bits-ui";

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

  const isInteger = $derived(step >= 1 || Number.isInteger(step));
  const inputId = $props.id();

  const commit = (next: number) => {
    if (Number.isNaN(next)) return;
    onUpdate(Math.max(min, Math.min(max, next)));
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
      value={value}
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
          <span class="text-fg-default">{formatValue(value)}</span>
          <span>{max}</span>
        </div>
      {/if}
      <Slider.Root
        type="single"
        {value}
        {min}
        {max}
        {step}
        onValueChange={commit}
        class="ui-slider"
      >
        {#snippet children({ thumbItems })}
          <span class="ui-slider-track">
            <Slider.Range class="ui-slider-range" />
          </span>
          {#each thumbItems as thumb (thumb.index)}
            <Slider.Thumb index={thumb.index} class="ui-slider-thumb" />
          {/each}
        {/snippet}
      </Slider.Root>
    </div>
  {/if}
</div>
