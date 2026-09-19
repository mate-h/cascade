<script lang="ts">
  import NumberEditor from "./NumberEditor.svelte";
  import Icon from "./ui/Icon.svelte";
  import { CONFIG } from "../config";

  let {
    value,
    min = -100,
    max = 100,
    step = 0.1,
    onUpdate,
    resetValue = 0,
  }: {
    value: number[] | Float32Array;
    min?: number;
    max?: number;
    step?: number;
    onUpdate: (newValue: number[] | Float32Array) => void;
    resetValue?: number;
  } = $props();

  let vectorArray = $derived([...value]);
  const originalType = $derived(value instanceof Float32Array ? "Float32Array" : "Array");
  const componentCount = $derived(vectorArray.length);
  const componentLabels = ["X", "Y", "Z", "W"];

  const emit = (next: number[]) => {
    vectorArray = next;
    onUpdate(originalType === "Float32Array" ? new Float32Array(next) : [...next]);
  };

  const handleComponentUpdate = (index: number, newValue: number) => {
    const next = [...vectorArray];
    next[index] = newValue;
    emit(next);
  };

  const resetToDefault = () => {
    emit(Array.from({ length: componentCount }, () => resetValue));
  };
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <span class="text-fg-muted">Vector ({componentCount})</span>
    <button
      type="button"
      onclick={resetToDefault}
      class="ui-btn"
      title="Reset to {resetValue}"
    >
      <Icon name="rotate-ccw" />
      <span>{resetValue}</span>
    </button>
  </div>

  {#each vectorArray as component, index (index)}
    <NumberEditor
      value={component}
      label={componentLabels[index]}
      {min}
      {max}
      {step}
      onUpdate={(newValue) => handleComponentUpdate(index, newValue)}
      showRange={false}
    />
  {/each}

  <div class="px-2 py-1.5 rounded-md border border-border-muted bg-canvas-inset text-fg-muted">
    [{vectorArray.map((v) => v.toFixed(CONFIG.DECIMAL_PRECISION)).join(", ")}]
  </div>
</div>
