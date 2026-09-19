<script lang="ts">
  import type { IconName } from "./icons";

  let { name }: { name: IconName } = $props();
</script>

{#if name === "boxes"}
  <i class="i-lucide-boxes size-3.5"></i>
{:else if name === "x"}
  <i class="i-lucide-x size-3.5"></i>
{:else if name === "copy"}
  <i class="i-lucide-copy size-3.5"></i>
{:else if name === "check"}
  <i class="i-lucide-check size-3.5"></i>
{:else if name === "sliders-horizontal"}
  <i class="i-lucide-sliders-horizontal size-3.5"></i>
{:else if name === "camera"}
  <i class="i-lucide-camera size-3.5"></i>
{:else if name === "tag"}
  <i class="i-lucide-tag size-3.5"></i>
{:else if name === "search"}
  <i class="i-lucide-search size-3.5"></i>
{:else if name === "rotate-ccw"}
  <i class="i-lucide-rotate-ccw size-3.5"></i>
{:else if name === "layers"}
  <i class="i-lucide-layers size-3.5"></i>
{:else if name === "circle-alert"}
  <i class="i-lucide-circle-alert size-3.5"></i>
{:else if name === "chevron-down"}
  <i class="i-lucide-chevron-down size-3.5"></i>
{/if}
