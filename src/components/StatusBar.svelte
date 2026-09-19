<script lang="ts">
  import { COMPONENT_TYPES } from "../ecs";
  import { activeCameraId } from "../stores/camera";
  import { showFloatingText } from "../stores/labels";
  import type { AppState } from "../app";
  import Kbd from "./ui/Kbd.svelte";
  import Icon from "./ui/Icon.svelte";

  let { appState }: { appState: AppState } = $props();

  const cameraIndex = $derived.by(() => {
    if ($activeCameraId === null) return null;
    const cameras = appState.ecs.components.get(COMPONENT_TYPES.CAMERA);
    if (!cameras) return null;
    const index = Array.from(cameras.keys()).indexOf($activeCameraId);
    return index >= 0 ? index + 1 : null;
  });
</script>

<div
  class="fixed bottom-3 left-3 z-50 flex items-center gap-3 h-8 px-2.5 rounded-md border border-border-default bg-canvas-muted text-fg-default shadow-float"
>
  <div class="flex items-center gap-1.5" title="Switch camera with 1 or 2">
    <span class="text-fg-muted"><Icon name="camera" /></span>
    <span>{cameraIndex ?? "—"}</span>
    <Kbd>1</Kbd>
    <Kbd>2</Kbd>
  </div>
  <span class="w-px h-4 bg-border-default"></span>
  <button
    type="button"
    class="flex items-center gap-1.5 text-fg-default hover:text-fg-accent"
    onclick={() => showFloatingText.toggle()}
    title="Toggle labels (L)"
  >
    <span class="text-fg-muted"><Icon name="tag" /></span>
    <span>{$showFloatingText ? "On" : "Off"}</span>
    <Kbd>L</Kbd>
  </button>
</div>
