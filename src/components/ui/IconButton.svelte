<script lang="ts">
  import { Toggle } from "bits-ui";
  import Icon from "./Icon.svelte";
  import WithTooltip from "./WithTooltip.svelte";
  import type { IconName } from "./icons";

  let {
    name,
    tooltip,
    title,
    onclick,
    pressed,
    onPressedChange,
    class: className = "",
  }: {
    name: IconName;
    tooltip?: string;
    title?: string;
    onclick?: (event: MouseEvent) => void;
    pressed?: boolean;
    onPressedChange?: (next: boolean) => void;
    class?: string;
  } = $props();

  const label = $derived(tooltip ?? title ?? "");

  const buttonClass = $derived([
    "ui-icon-btn",
    !onPressedChange && pressed && "ui-icon-btn-active",
    className,
  ]);
</script>

{#snippet control(props: Record<string, unknown> = {})}
  {#if onPressedChange}
    <Toggle.Root
      {...props}
      {pressed}
      {onPressedChange}
      class={[buttonClass, props.class]}
    >
      <Icon {name} />
    </Toggle.Root>
  {:else}
    <button {...props} type="button" class={[buttonClass, props.class]} {onclick}>
      <Icon {name} />
    </button>
  {/if}
{/snippet}

{#if label}
  <WithTooltip text={label}>
    {#snippet children({ props })}
      {@render control(props)}
    {/snippet}
  </WithTooltip>
{:else}
  {@render control()}
{/if}
