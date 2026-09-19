<script lang="ts">
  import NumberEditor from "./NumberEditor.svelte";
  import StringEditor from "./StringEditor.svelte";
  import BooleanEditor from "./BooleanEditor.svelte";
  import VectorEditor from "./VectorEditor.svelte";

  export interface PropertyConfig {
    entityId: number;
    componentType: string;
    propertyKey: string;
    value: unknown;
    type: string;
    min?: number;
    max?: number;
    step?: number;
    vectorSize?: number;
  }

  let {
    config,
    onUpdate,
  }: {
    config: PropertyConfig;
    onUpdate: (newValue: unknown) => void;
  } = $props();
</script>

{#if config.type === "number"}
  <NumberEditor
    value={config.value as number}
    min={config.min}
    max={config.max}
    step={config.step}
    {onUpdate}
  />
{:else if config.type === "string"}
  <StringEditor value={config.value as string} {onUpdate} />
{:else if config.type === "boolean"}
  <BooleanEditor value={config.value as boolean} {onUpdate} />
{:else if config.type === "vec2" || config.type === "vec3" || config.type === "vec4"}
  <VectorEditor
    value={config.value as number[] | Float32Array}
    min={config.min}
    max={config.max}
    step={config.step}
    resetValue={config.propertyKey === "scale" ? 1 : 0}
    {onUpdate}
  />
{:else}
  <div class="text-fg-muted">Property type "{config.type}" is not editable</div>
{/if}
