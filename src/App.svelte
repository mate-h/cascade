<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import ECSPanel from "./components/ECSPanel.svelte";
  import CanvasPanel from "./components/CanvasPanel.svelte";
  import PropertiesPanel from "./components/PropertiesPanel.svelte";
  import CommandPalette from "./components/CommandPalette.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import Icon from "./components/ui/Icon.svelte";
  import { initializeApp, stopApp } from "./app";
  import type { AppState } from "./app";
  import { getCameraIds, setActiveCamera } from "./stores/camera";
  import { showFloatingText } from "./stores/labels";
  import { commandPaletteOpen } from "./commands";
  import { panelStore } from "./stores/panels";
  import { Tooltip } from "bits-ui";

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

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      target.getAttribute("role") === "combobox"
    );
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!appState || isTypingTarget(event.target)) return;

    if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      commandPaletteOpen.set(true);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === "l") {
      event.preventDefault();
      showFloatingText.toggle();
      return;
    }
    if (key === "n") {
      event.preventDefault();
      panelStore.togglePanel("ecsPanel");
      return;
    }
    if (key === "t") {
      event.preventDefault();
      panelStore.togglePanel("propertiesPanel");
      return;
    }

    const cameraIds = getCameraIds(appState.ecs);
    if (event.key === "1" && cameraIds.length >= 1) {
      event.preventDefault();
      setActiveCamera(appState.ecs, cameraIds[0]);
    } else if (event.key === "2" && cameraIds.length >= 2) {
      event.preventDefault();
      setActiveCamera(appState.ecs, cameraIds[1]);
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<Tooltip.Provider delayDuration={400}>
<main class="flex flex-col w-screen h-screen bg-canvas-default font-mono text-[13px] leading-[1.4] text-fg-default">
  {#if error}
    <div class="flex justify-center items-center h-full w-full">
      <div class="flex flex-col items-center gap-2 text-center">
        <span class="text-fg-danger"><Icon name="circle-alert" /></span>
        <p>Initialization failed</p>
        <p class="text-fg-muted">{error}</p>
      </div>
    </div>
  {:else if appState}
    <Toolbar {appState} />
    <div class="flex flex-1 min-h-0 min-w-0">
      <ECSPanel {appState} />
      <div class="relative flex-1 min-w-0 min-h-0">
        <CanvasPanel {appState} />
      </div>
      <PropertiesPanel {appState} />
    </div>
    <CommandPalette />
  {:else}
    <div class="flex justify-center items-center h-full w-full">
      <div class="flex flex-col items-center gap-2 text-center">
        <span class="text-fg-muted"><Icon name="layers" /></span>
        <p>Loading</p>
        <p class="text-fg-muted">Initializing WebGPU and ECS</p>
      </div>
    </div>
  {/if}
</main>
</Tooltip.Provider>
