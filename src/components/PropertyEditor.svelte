<script lang="ts">
  import NumberEditor from "./NumberEditor.svelte";
  import StringEditor from "./StringEditor.svelte";
  import BooleanEditor from "./BooleanEditor.svelte";
  import VectorEditor from "./VectorEditor.svelte";
  import IconButton from "./ui/IconButton.svelte";

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
    onCancel,
  }: {
    config: PropertyConfig;
    onUpdate: (newValue: unknown) => void;
    onCancel: () => void;
  } = $props();
</script>

<div class="rounded-md border border-border-default bg-canvas-muted p-2">
  <div class="flex items-center justify-between mb-2">
    <div>
      <div class="text-fg-default">{config.componentType}.{config.propertyKey}</div>
      <div class="text-fg-muted">Entity {config.entityId} · {config.type}</div>
    </div>
    <IconButton name="x" title="Cancel" onclick={onCancel} />
  </div>

  {#if config.type === "number"}
    <NumberEditor
      value={config.value as number}
      min={config.min}
      max={config.max}
      step={config.step}
      onUpdate={onUpdate}
    />
  {:else if config.type === "string"}
    <StringEditor value={config.value as string} onUpdate={onUpdate} />
  {:else if config.type === "boolean"}
    <BooleanEditor value={config.value as boolean} onUpdate={onUpdate} />
  {:else if config.type === "vec2" || config.type === "vec3" || config.type === "vec4"}
    <VectorEditor
      value={config.value as number[] | Float32Array}
      min={config.min}
      max={config.max}
      step={config.step}
      resetValue={config.propertyKey === "scale" ? 1 : 0}
      onUpdate={onUpdate}
    />
  {:else}
    <div class="text-fg-muted">Property type "{config.type}" is not editable</div>
  {/if}
</div>
