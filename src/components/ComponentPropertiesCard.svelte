<script lang="ts">
  import { Collapsible } from "bits-ui";
  import { isEditableProperty } from "../utils/property-config";
  import type { PropertyConfig } from "./PropertyEditor.svelte";
  import PropertyEditor from "./PropertyEditor.svelte";
  import type { AppState } from "../app";
  import { CONFIG } from "../config";
  import Icon from "./ui/Icon.svelte";

  let {
    selectedProperty,
    onSelectProperty,
    onUpdate,
    appState,
    componentType,
    component,
  }: {
    selectedProperty: PropertyConfig | null;
    onSelectProperty: (componentType: string, propertyKey: string, value: unknown) => void;
    onUpdate: (newValue: unknown) => void;
    appState: AppState;
    componentType: string;
    component: Record<string, unknown>;
  } = $props();

  let open = $state(true);

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

  const isEntityReference = (value: unknown, key: string): boolean => {
    if (typeof value !== "number" || !appState.ecs.entities.has(value)) return false;
    return ["inputs", "outputs", "dependencies", "targets", "sources"].includes(
      key.toLowerCase(),
    );
  };
</script>

<Collapsible.Root bind:open class="mb-2 rounded-md border border-border-muted overflow-hidden">
  <Collapsible.Trigger
    class={[
      "flex w-full items-center justify-between gap-2 px-2 py-2 bg-canvas-muted text-fg-accent text-left",
      open && "border-b border-border-default",
    ]}
  >
    <span>{componentType}</span>
    <span class={["text-fg-muted transition-transform duration-100", open && "rotate-180"]}>
      <Icon name="chevron-down" />
    </span>
  </Collapsible.Trigger>

  <Collapsible.Content>
    <div>
    {#each Object.entries(component) as [key, value] (key)}
      {@const selected = isPropertySelected(key)}
      {@const editable = isEditableProperty(value, componentType, key)}
      <div class={["border-b border-border-muted last:border-b-0", selected && "bg-accent-muted"]}>
        <button
          type="button"
          class={[
            "w-full flex items-start justify-between gap-3 px-2 py-1.5 text-left",
            editable ? "cursor-pointer hover:bg-canvas-muted" : "cursor-default",
          ]}
          onclick={() => onSelectProperty(componentType, key, value)}
          disabled={!editable}
        >
          <span class={editable ? "text-fg-default" : "text-fg-muted"}>{key}</span>
          <span class={["min-w-0 text-right", selected ? "text-fg-default" : "text-fg-muted"]}>
            {#if isEntityReference(value, key)}
              <span class="entity-ref">Entity {value}</span>
            {:else if Array.isArray(value) && value.length > 4}
              [{value.length} items]
            {:else if typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Float32Array)}
              {Object.keys(value).length} properties
            {:else}
              {formatValue(value)}
            {/if}
          </span>
        </button>

        {#if selected && selectedProperty}
          <div class="px-2 pb-2">
            <PropertyEditor config={selectedProperty} {onUpdate} />
          </div>
        {/if}
      </div>
    {/each}
    </div>
  </Collapsible.Content>
</Collapsible.Root>
