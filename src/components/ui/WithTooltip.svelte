<script lang="ts">
  import type { Snippet } from "svelte";
  import { Tooltip } from "bits-ui";

  let {
    text,
    children,
  }: {
    text: string;
    children: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      {@render children({ props })}
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content class="ui-tooltip" sideOffset={6}>
      {text}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
