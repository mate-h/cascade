<script lang="ts">
  import { isEditableProperty } from "../utils/property-config";
  import type { PropertyConfig } from "./PropertyEditor.svelte";
  import type { AppState } from "../app";
  import { CONFIG } from "../config";

  let {
    selectedProperty,
    onSelectProperty,
    appState,
    componentType,
    component,
  }: {
    selectedProperty: PropertyConfig | null;
    onSelectProperty: (componentType: string, propertyKey: string, value: unknown) => void;
    appState: AppState;
    componentType: string;
    component: Record<string, unknown>;
  } = $props();

  const isPropertySelected = (key: string) =>
    selectedProperty?.componentType === componentType &&
    selectedProperty?.propertyKey === key;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";

    if (
      (Array.isArray(value) || value instanceof Float32Array) &&
      value.length >= 2 &&
      value.length <= 4
    ) {
      const div = 10 ** CONFIG.DECIMAL_PRECISION;
      return `[${Array.from(value)
        .map((v) => Math.round(v * div) / div)
        .join(", ")}]`;
    }

    if (Array.isArray(value)) {
      return value.length === 0 ? "[]" : `[${value.length} items]`;
    }

    if (typeof value === "object") {
      return `{${Object.keys(value).length} properties}`;
    }

    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "boolean") return value ? "true" : "false";
    return String(value);
  };

  const typeLabel = (value: unknown): string => {
    if (
      (Array.isArray(value) || value instanceof Float32Array) &&
      value.length >= 2 &&
      value.length <= 4
    ) {
      return `vec${value.length}`;
    }
    if (Array.isArray(value)) return `Array[${value.length}]`;
    if (typeof value === "object" && value !== null) return "Object";
    return typeof value;
  };

  const isEntityReference = (value: unknown, key: string): boolean => {
    if (typeof value !== "number" || !appState.ecs.entities.has(value)) return false;
    return ["inputs", "outputs", "dependencies", "targets", "sources"].includes(
      key.toLowerCase(),
    );
  };
</script>

<div class="mb-2 rounded-md border border-border-muted overflow-hidden">
  <div class="px-2 py-1.5 border-b border-border-muted bg-canvas-muted text-fg-default">
    {componentType}
  </div>

  <table class="w-full">
    <thead>
      <tr class="text-fg-muted text-left">
        <th class="p-1.5 font-400">Property</th>
        <th class="p-1.5 font-400">Value</th>
        <th class="p-1.5 font-400">Type</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.entries(component) as [key, value] (key)}
        {@const selected = isPropertySelected(key)}
        {@const editable = isEditableProperty(value, componentType, key)}
        <tr
          class={[
            selected && "bg-accent-muted",
            editable && "cursor-pointer hover:bg-canvas-muted",
          ]}
          onclick={() => onSelectProperty(componentType, key, value)}
        >
          <td class={["p-1.5", editable ? "text-fg-default" : "text-fg-muted"]}>
            {key}
          </td>
          <td class="p-1.5">
            {#if isEntityReference(value, key)}
              <span class="entity-ref">Entity {value}</span>
            {:else if Array.isArray(value) && value.length > 4}
              <details>
                <summary class="text-fg-attention cursor-pointer">[{value.length} items]</summary>
                <div class="mt-1 pl-2 border-l border-border-muted">
                  {#each value as item, index (`${key}-${index}`)}
                    <div class="py-0.5 text-fg-default">
                      <span class="text-fg-muted">{index}:</span>
                      {#if isEntityReference(item, key)}
                        <span class="entity-ref">Entity {item}</span>
                      {:else}
                        {formatValue(item)}
                      {/if}
                    </div>
                  {/each}
                </div>
              </details>
            {:else if typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Float32Array)}
              <details>
                <summary class="text-fg-attention cursor-pointer">
                  {Object.keys(value).length} properties
                </summary>
                <div class="mt-1 pl-2 border-l border-border-muted">
                  {#each Object.entries(value) as [subKey, subValue] (subKey)}
                    <div class="py-0.5">
                      <span class="text-fg-success">{subKey}:</span>
                      <span class="ml-1 text-fg-default">{formatValue(subValue)}</span>
                    </div>
                  {/each}
                </div>
              </details>
            {:else}
              <span class="text-fg-default">{formatValue(value)}</span>
            {/if}
          </td>
          <td class="p-1.5 text-fg-muted">{typeLabel(value)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
