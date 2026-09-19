<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { IconName } from "./icons";

  let {
    name,
    title,
    onclick,
    pressed = false,
    class: className = "",
  }: {
    name: IconName;
    title: string;
    onclick: (event: MouseEvent) => void;
    pressed?: boolean;
    class?: string;
  } = $props();
</script>

<button
  type="button"
  class={["ui-icon-btn", pressed && "ui-icon-btn-active", className]}
  {title}
  {onclick}
  aria-pressed={pressed}
>
  <Icon {name} />
</button>
