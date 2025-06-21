<script lang="ts">
  import { onMount } from "svelte";

  let { appState } = $props();
  let canvasContainer: HTMLDivElement;

  onMount(() => {
    // Canvas is already initialized in appState.gpu
    // Just need to append it to our container
    if (appState.gpu.canvas && canvasContainer) {
      // Clear container and append the WebGPU canvas
      canvasContainer.innerHTML = "";
      canvasContainer.appendChild(appState.gpu.canvas);

      // Apply styles to the canvas
      appState.gpu.canvas.className = "block w-full h-full cursor-crosshair";
    }
  });
</script>

<div class="w-full h-full relative">
  <div bind:this={canvasContainer} class="w-full h-full"></div>
</div>
