<script lang="ts">
  import IconButton from "./ui/IconButton.svelte";
  import Icon from "./ui/Icon.svelte";
  import Kbd from "./ui/Kbd.svelte";
  import type { AppState } from "../app";
  import { panelStore } from "../stores/panels";
  import {
    activeCameraId,
    cycleActiveCamera,
    getCameraIds,
  } from "../stores/camera";
  import { showFloatingText } from "../stores/labels";
  import { commandPaletteOpen } from "../commands";
  import { copyECSToClipboard } from "../utils/ecs";

  let { appState }: { appState: AppState } = $props();

  let copied = $state(false);
  let copyFailed = $state(false);

  const cameraIndex = $derived.by(() => {
    if ($activeCameraId === null) return null;
    const index = getCameraIds(appState.ecs).indexOf($activeCameraId);
    return index >= 0 ? index + 1 : null;
  });

  const paletteShortcut = $derived(
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform)
      ? "⌘K"
      : "Ctrl+K",
  );

  const copyJSON = async () => {
    try {
      await copyECSToClipboard(appState.ecs);
      copied = true;
      copyFailed = false;
    } catch (error) {
      console.error("Failed to copy ECS JSON:", error);
      copied = false;
      copyFailed = true;
    }
    setTimeout(() => {
      copied = false;
      copyFailed = false;
    }, 2000);
  };
</script>

<header
  class="flex items-center gap-2 h-10 px-2 flex-shrink-0 border-b border-border-default bg-canvas-default"
>
  <IconButton
    name="boxes"
    title="Toggle entity list (N)"
    pressed={!$panelStore.ecsPanel.isCollapsed}
    onclick={() => panelStore.togglePanel("ecsPanel")}
  />
  <IconButton
    name="sliders-horizontal"
    title="Toggle inspector (T)"
    pressed={!$panelStore.propertiesPanel.isCollapsed}
    onclick={() => panelStore.togglePanel("propertiesPanel")}
  />

  <span class="w-px h-4 bg-border-default"></span>

  <button
    type="button"
    class="ui-btn"
    title="Cycle camera (1, 2)"
    onclick={() => cycleActiveCamera(appState.ecs)}
  >
    <Icon name="camera" />
    <span>{cameraIndex ?? "—"}</span>
    <Kbd>1</Kbd>
    <Kbd>2</Kbd>
  </button>

  <button
    type="button"
    class={["ui-btn", $showFloatingText && "ui-icon-btn-active"]}
    title="Toggle labels (L)"
    onclick={() => showFloatingText.toggle()}
  >
    <Icon name="tag" />
    <span>{$showFloatingText ? "On" : "Off"}</span>
    <Kbd>L</Kbd>
  </button>

  <button
    type="button"
    class="ui-btn"
    title="Copy ECS as JSON"
    onclick={copyJSON}
  >
    <Icon name={copied ? "check" : "copy"} />
    <span>{copyFailed ? "Failed" : copied ? "Copied" : "JSON"}</span>
  </button>

  <button
    type="button"
    class="ui-btn ml-auto"
    title="Command palette ({paletteShortcut})"
    onclick={() => commandPaletteOpen.set(true)}
  >
    <Icon name="search" />
    <Kbd>{paletteShortcut}</Kbd>
  </button>
</header>
