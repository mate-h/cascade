<script lang="ts">
  import { isEditableProperty } from "../utils/property-config";
  import type { PropertyConfig } from "./PropertyEditor.svelte";
  import type { AppState } from "../app";

  let {
    selectedProperty,
    onSelectProperty,
    appState,
    componentType,
    component,
  }: {
    selectedProperty: PropertyConfig | null;
    onSelectProperty: (componentType: string, propertyKey: string, value: any) => void;
    appState: AppState;
    componentType: string;
    component: any;
  } = $props();

  // Helper function to check if a property is selected
  const isPropertySelected = (componentType: string, propertyKey: string) =>
    selectedProperty?.componentType === componentType &&
    selectedProperty?.propertyKey === propertyKey;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "null";
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return `[${value.length} items]`;
    }

    if (typeof value === "object") {
      return `{${Object.keys(value).length} properties}`;
    }

    if (typeof value === "string") {
      return `"${value}"`;
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }

    return String(value);
  };

  const isEntityReference = (value: any, key: string, ecs: any): boolean => {
    if (typeof value !== "number" || !ecs.entities.has(value)) {
      return false;
    }

    const entityReferenceFields = [
      "inputs",
      "outputs",
      "dependencies",
      "targets",
      "sources",
    ];
    return entityReferenceFields.includes(key.toLowerCase());
  };
</script>

<div class="mb-3 bg-bg-elevated rounded border border-border-subtle overflow-hidden">
  <div class="px-2 py-1 bg-bg-panel border-b border-border-subtle">
    <h4 class="text-text-bright text-xs">
      {componentType}
    </h4>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-xs">
      <thead>
        <tr class="bg-bg-secondary">
          <th
            class="text-left p-1 text-text-secondary border-b border-border-subtle font-400"
            >Property</th
          >
          <th
            class="text-left p-1 text-text-secondary border-b border-border-subtle font-400"
            >Value</th
          >
          <th
            class="text-left p-1 text-text-secondary border-b border-border-subtle font-400"
            >Type</th
          >
        </tr>
      </thead>
      <tbody>
        {#each Object.entries(component) as [key, value]}
          <tr
            class:bg-accent-blue={isPropertySelected(componentType, key)}
            class:cursor-pointer={isEditableProperty(value, componentType, key)}
            class:hover:bg-opacity-80={isPropertySelected(componentType, key)}
            class:hover:bg-gray-900={!isPropertySelected(componentType, key)}
            onclick={() => onSelectProperty(componentType, key, value)}
          >
            <td
              class="p-1 font-mono"
              class:text-text-primary={isEditableProperty(value, componentType, key)}
              class:text-text-muted={!isEditableProperty(value, componentType, key)}
              class:text-white={isPropertySelected(componentType, key)}
            >
              <span
              >
                {key}
              </span>
            </td>
            <td class="p-1 font-mono">
              {#if isEntityReference(value, key, appState.ecs)}
                <span
                  class="cursor-pointer hover:underline"
                  class:text-accent-blue={!isPropertySelected(componentType, key)}
                  class:text-white={isPropertySelected(componentType, key)}
                >
                  Entity {value}
                </span>
              {:else if Array.isArray(value)}
                <div
                  class:text-text-muted={!isPropertySelected(componentType, key)}
                  class:text-white={isPropertySelected(componentType, key)}
                >
                  {#if value.length === 0}
                    <span
                      class:text-text-secondary={!isPropertySelected(componentType, key)}
                      class:text-white={isPropertySelected(componentType, key)}
                    >[]</span>
                  {:else}
                    <details class="cursor-pointer">
                      <summary
                        class:text-accent-yellow={!isPropertySelected(componentType, key)}
                        class:text-white={isPropertySelected(componentType, key)}
                        class:hover:text-accent-orange={!isPropertySelected(componentType, key)}
                      >
                        [{value.length} items]
                      </summary>
                      <div class="mt-1 pl-2 border-l border-border-muted">
                        {#each value as item, index}
                          <div
                            class="py-0.5"
                            class:text-text-primary={!isPropertySelected(componentType, key)}
                            class:text-white={isPropertySelected(componentType, key)}
                          >
                            <span
                              class:text-text-muted={!isPropertySelected(componentType, key)}
                              class:text-white={isPropertySelected(componentType, key)}
                            >{index}:</span>
                            {#if isEntityReference(item, key, appState.ecs)}
                              <span
                                class:text-accent-blue={!isPropertySelected(componentType, key)}
                                class:text-white={isPropertySelected(componentType, key)}
                              >Entity {item}</span>
                            {:else}
                              <span
                                class:text-text-primary={!isPropertySelected(componentType, key)}
                                class:text-white={isPropertySelected(componentType, key)}
                              >
                                {formatValue(item)}
                              </span>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    </details>
                  {/if}
                </div>
              {:else if typeof value === "object" && value !== null}
                <details class="cursor-pointer">
                  <summary
                    class:text-accent-yellow={!isPropertySelected(componentType, key)}
                    class:text-white={isPropertySelected(componentType, key)}
                    class:hover:text-accent-orange={!isPropertySelected(componentType, key)}
                  >
                    {Object.keys(value).length} properties
                  </summary>
                  <div class="mt-1 pl-2 border-l border-border-muted">
                    {#each Object.entries(value) as [subKey, subValue]}
                      <div class="py-0.5">
                        <span
                          class="font-mono"
                          class:text-accent-green={!isPropertySelected(componentType, key)}
                          class:text-white={isPropertySelected(componentType, key)}
                        >{subKey}:</span>
                        <span
                          class="ml-1"
                          class:text-text-primary={!isPropertySelected(componentType, key)}
                          class:text-white={isPropertySelected(componentType, key)}
                        >{formatValue(subValue)}</span>
                      </div>
                    {/each}
                  </div>
                </details>
              {:else}
                <span
                  class:text-text-primary={!isPropertySelected(componentType, key)}
                  class:text-white={isPropertySelected(componentType, key)}
                >{formatValue(value)}</span>
              {/if}
            </td>
            <td
              class="p-1"
              class:text-text-muted={!isPropertySelected(componentType, key)}
              class:text-white={isPropertySelected(componentType, key)}
            >
              {#if Array.isArray(value)}
                Array[{value.length}]
              {:else if typeof value === "object" && value !== null}
                Object
              {:else}
                {typeof value}
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div> 