<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  let {
    placeholder,
    value = $bindable(""),
    class: className = "flex-1",
  }: {
    placeholder: string;
    value: string;
    class?: ClassValue;
  } = $props();
</script>

<input
  type="search"
  class={["ui-input min-w-0", className]}
  {placeholder}
  bind:value
  aria-label={placeholder}
  spellcheck="false"
  autocomplete="off"
/>
