<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { IconName } from "./icons";

  let {
    name,
    title,
    onclick,
    class: className = "",
  }: {
    name: IconName;
    title: string;
    onclick: (event: MouseEvent) => void;
    class?: string;
  } = $props();
</script>

<button type="button" class={["ui-icon-btn", className]} {title} {onclick}>
  <Icon {name} />
</button>
