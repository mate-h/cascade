<script lang="ts">
  import { Checkbox } from "bits-ui";
  import Icon from "./ui/Icon.svelte";

  let {
    value,
    onUpdate,
  }: {
    value: boolean;
    onUpdate: (newValue: boolean) => void;
  } = $props();
</script>

<label class="flex items-center gap-2 cursor-pointer">
  <span class="text-fg-muted min-w-12">Value</span>
  <Checkbox.Root
    checked={value}
    onCheckedChange={onUpdate}
    class="ui-checkbox"
  >
    {#snippet children({ checked })}
      {#if checked}
        <Icon name="check" />
      {/if}
    {/snippet}
  </Checkbox.Root>
  <span class={value ? "text-fg-success" : "text-fg-muted"}>
    {value ? "true" : "false"}
  </span>
</label>
