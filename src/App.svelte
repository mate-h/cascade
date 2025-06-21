<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import ECSPanel from "./components/ECSPanel.svelte";
  import CanvasPanel from "./components/CanvasPanel.svelte";
  import { initializeApp, stopApp } from "./app";
  import type { AppState } from "./app";

  let appState = $state<AppState | null>(null);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      appState = await initializeApp();
    } catch (err) {
      error = `Failed to initialize: ${err}`;
      console.error("App initialization failed:", err);
    }
  });

  onDestroy(() => {
    if (appState) {
      stopApp(appState);
      appState = null;
    }
  });
</script>

<main
  class="relative w-screen h-screen bg-black font-mono text-[13px] leading-[1.4]"
>
  {#if error}
    <div class="flex justify-center items-center h-full w-full text-white">
      <div class="text-center">
        <h1 class="text-2xl mb-4">Initialization Failed</h1>
        <p class="text-gray-400">{error}</p>
      </div>
    </div>
  {:else if appState}
    <!-- Fullscreen Canvas -->
    <CanvasPanel {appState} />
    <!-- Collapsible Panel Overlay -->
    <ECSPanel {appState} />
  {:else}
    <div class="flex justify-center items-center h-full w-full text-white">
      <div class="text-center">
        <h1 class="text-2xl mb-4">Loading...</h1>
        <p class="text-gray-400">Initializing WebGPU and ECS</p>
      </div>
    </div>
  {/if}
</main>
