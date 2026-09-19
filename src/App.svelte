<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import ECSPanel from "./components/ECSPanel.svelte";
  import CanvasPanel from "./components/CanvasPanel.svelte";
  import PropertiesPanel from "./components/PropertiesPanel.svelte";
  import FloatingText from "./components/FloatingText.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import CommandPalette from "./components/CommandPalette.svelte";
  import Icon from "./components/ui/Icon.svelte";
  import { initializeApp, stopApp } from "./app";
  import type { AppState } from "./app";
  import { activeCameraId } from "./stores/camera";
  import { COMPONENT_TYPES, addComponent } from "./ecs";
  import { showFloatingText } from "./stores/labels";
  import { commandPaletteOpen } from "./commands";

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

  const switchCamera = (cameraEntityId: number) => {
    if (!appState) return;

    const activeMap = appState.ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
    if (activeMap) {
      for (const id of activeMap.keys()) {
        activeMap.delete(id);
      }
    }

    addComponent(appState.ecs, cameraEntityId, COMPONENT_TYPES.ACTIVE_CAMERA, {});
    activeCameraId.set(cameraEntityId);
  };

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!appState || isTypingTarget(event.target)) return;

    if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      commandPaletteOpen.set(true);
      return;
    }

    if (
      event.key.toLowerCase() === "l" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      showFloatingText.toggle();
      return;
    }

    const cameraComponents = appState.ecs.components.get(COMPONENT_TYPES.CAMERA);
    if (!cameraComponents) return;

    const cameraIds = Array.from(cameraComponents.keys());
    if (event.key === "1" && cameraIds.length >= 1) {
      event.preventDefault();
      switchCamera(cameraIds[0]);
    } else if (event.key === "2" && cameraIds.length >= 2) {
      event.preventDefault();
      switchCamera(cameraIds[1]);
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="relative w-screen h-screen bg-canvas-default font-mono text-[13px] leading-[1.4] text-fg-default">
  {#if error}
    <div class="flex justify-center items-center h-full w-full">
      <div class="flex flex-col items-center gap-2 text-center">
        <span class="text-fg-danger"><Icon name="circle-alert" /></span>
        <p>Initialization failed</p>
        <p class="text-fg-muted">{error}</p>
      </div>
    </div>
  {:else if appState}
    <CanvasPanel {appState} />
    {#if $showFloatingText}
      <FloatingText {appState} />
    {/if}
    <CommandPalette />
    <ECSPanel {appState} />
    <PropertiesPanel {appState} />
    <StatusBar {appState} />
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
