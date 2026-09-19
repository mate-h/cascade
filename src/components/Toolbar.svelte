<script lang="ts">
  import { DropdownMenu, Separator, Toggle, Toolbar } from "bits-ui";
  import IconButton from "./ui/IconButton.svelte";
  import Icon from "./ui/Icon.svelte";
  import Kbd from "./ui/Kbd.svelte";
  import WithTooltip from "./ui/WithTooltip.svelte";
  import type { AppState } from "../app";
  import { panelStore } from "../stores/panels";
  import {
    getActiveCameraId,
    getCameraIds,
    setActiveCamera,
  } from "../stores/camera";
  import { ecsUiRevision } from "../stores/ecs-ui";
  import { getEntityLabel } from "../utils/ecs";
  import { showFloatingText } from "../stores/labels";
  import { commandPaletteOpen } from "../commands";
  import { copyECSToClipboard } from "../utils/ecs";

  let { appState }: { appState: AppState } = $props();

  let copied = $state(false);
  let copyFailed = $state(false);

  const cameraIds = $derived.by(() => {
    $ecsUiRevision;
    return getCameraIds(appState.ecs);
  });

  const activeCameraId = $derived.by(() => {
    $ecsUiRevision;
    return getActiveCameraId(appState.ecs);
  });

  const cameraIndex = $derived.by(() => {
    if (activeCameraId === null) return null;
    const index = cameraIds.indexOf(activeCameraId);
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

<Toolbar.Root
  class="flex items-center gap-2 h-10 px-2 flex-shrink-0 border-b border-border-default bg-canvas-default"
>
  <IconButton
    name="boxes"
    tooltip="Toggle entity list (N)"
    pressed={!$panelStore.ecsPanel.isCollapsed}
    onPressedChange={() => panelStore.togglePanel("ecsPanel")}
  />
  <IconButton
    name="sliders-horizontal"
    tooltip="Toggle properties (T)"
    pressed={!$panelStore.propertiesPanel.isCollapsed}
    onPressedChange={() => panelStore.togglePanel("propertiesPanel")}
  />

  <Separator.Root
    orientation="vertical"
    decorative
    class="w-px h-4 bg-border-default"
  />

  <DropdownMenu.Root>
    <WithTooltip text="Select camera (1, 2)">
      {#snippet children({ props })}
        <DropdownMenu.Trigger {...props} class="ui-btn">
          <Icon name="camera" />
          <span>{cameraIndex ?? "—"}</span>
          <Icon name="chevron-down" />
          <Kbd>1</Kbd>
          <Kbd>2</Kbd>
        </DropdownMenu.Trigger>
      {/snippet}
    </WithTooltip>
    <DropdownMenu.Portal>
      <DropdownMenu.Content class="ui-menu" sideOffset={6} align="start">
        {#if cameraIds.length === 0}
          <div class="px-2 py-1.5 text-fg-muted">No cameras</div>
        {:else}
          <DropdownMenu.RadioGroup
            value={activeCameraId === null ? "" : String(activeCameraId)}
            onValueChange={(id) => setActiveCamera(appState.ecs, Number(id))}
          >
            {#each cameraIds as cameraId (cameraId)}
              <DropdownMenu.RadioItem value={String(cameraId)} class="ui-menu-item">
                {#snippet children({ checked })}
                  <span class={checked ? "text-fg-accent" : "text-fg-muted"}>
                    <Icon name={checked ? "check" : "camera"} />
                  </span>
                  <span>{getEntityLabel(appState.ecs, cameraId)}</span>
                {/snippet}
              </DropdownMenu.RadioItem>
            {/each}
          </DropdownMenu.RadioGroup>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>

  <WithTooltip text="Toggle labels (L)">
    {#snippet children({ props })}
      <Toggle.Root
        {...props}
        pressed={$showFloatingText}
        onPressedChange={() => showFloatingText.toggle()}
        class="ui-btn"
      >
        <Icon name="tag" />
        <span>{$showFloatingText ? "On" : "Off"}</span>
        <Kbd>L</Kbd>
      </Toggle.Root>
    {/snippet}
  </WithTooltip>

  <WithTooltip text="Copy ECS as JSON">
    {#snippet children({ props })}
      <Toolbar.Button {...props} class="ui-btn" onclick={copyJSON}>
        <Icon name={copied ? "check" : "copy"} />
        <span>{copyFailed ? "Failed" : copied ? "Copied" : "JSON"}</span>
      </Toolbar.Button>
    {/snippet}
  </WithTooltip>

  <WithTooltip text="Command palette ({paletteShortcut})">
    {#snippet children({ props })}
      <Toolbar.Button
        {...props}
        class="ui-btn ml-auto"
        onclick={() => commandPaletteOpen.set(true)}
      >
        <Icon name="search" />
        <Kbd>{paletteShortcut}</Kbd>
      </Toolbar.Button>
    {/snippet}
  </WithTooltip>
</Toolbar.Root>
