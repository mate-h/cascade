<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import ECSPanel from "./components/ECSPanel.svelte";
  import CanvasPanel from "./components/CanvasPanel.svelte";
  import PropertiesPanel from "./components/PropertiesPanel.svelte";
  import FloatingText from "./components/FloatingText.svelte";
  import { initializeApp, stopApp } from "./app";
  import type { AppState } from "./app";
  import { activeCameraId } from "./stores/camera";
  import { COMPONENT_TYPES, addComponent } from "./ecs";

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

  // Camera switching function
  function switchCamera(cameraEntityId: number) {
    if (!appState) return;

    // Remove existing active camera marker
    const activeMap = appState.ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA);
    if (activeMap) {
      for (const id of activeMap.keys()) {
        activeMap.delete(id);
      }
    }

    // Add active camera marker to the selected camera
    addComponent(appState.ecs, cameraEntityId, COMPONENT_TYPES.ACTIVE_CAMERA, {});
    activeCameraId.set(cameraEntityId);
  }

  // Keyboard event handler for camera switching
  function handleKeydown(event: KeyboardEvent) {
    if (!appState) return;

    // Only handle if not typing in an input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    // Get all camera entities
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
  }

  // Add global keydown listener
  $effect(() => {
    if (appState) {
      document.addEventListener("keydown", handleKeydown);
      return () => {
        document.removeEventListener("keydown", handleKeydown);
      };
    }
  });
</script>

<main
  class="relative w-screen h-screen bg-bg-primary font-mono text-[13px] leading-[1.4]"
>
  {#if error}
    <div class="flex justify-center items-center h-full w-full text-text-primary">
      <div class="text-center">
        <h1 class="text-2xl mb-4 text-text-bright">Initialization Failed</h1>
        <p class="text-text-secondary">{error}</p>
      </div>
    </div>
  {:else if appState}
    <!-- Fullscreen Canvas -->
    <CanvasPanel {appState} />
    <!-- Floating Text Labels -->
    <FloatingText {appState} />
    <!-- Collapsible Panel Overlay -->
    <ECSPanel {appState} />
    <!-- Properties Panel -->
    <PropertiesPanel {appState} />
    
    <!-- Camera Indicator Overlay -->
    <div class="fixed bottom-4 left-4 z-50 bg-bg-panel/90 backdrop-blur-sm border border-border-default rounded px-3 py-2 text-text-primary text-sm">
      <div class="flex items-center gap-2">
        <span class="text-accent-blue">Camera:</span>
        <span class="font-mono">
          {#if $activeCameraId !== null}
            {(() => {
              const cameraComponents = appState.ecs.components.get(COMPONENT_TYPES.CAMERA);
              if (cameraComponents) {
                const cameraIds = Array.from(cameraComponents.keys());
                const index = cameraIds.indexOf($activeCameraId);
                return index >= 0 ? index + 1 : "?";
              }
              return "?";
            })()}
          {:else}
            ?
          {/if}
        </span>
        <span class="text-text-secondary text-xs">(1, 2 to switch)</span>
      </div>
    </div>
  {:else}
    <div class="flex justify-center items-center h-full w-full text-text-primary">
      <div class="text-center">
        <h1 class="text-2xl mb-4 text-text-bright">Loading...</h1>
        <p class="text-text-secondary">Initializing WebGPU and ECS</p>
      </div>
    </div>
  {/if}
</main>
