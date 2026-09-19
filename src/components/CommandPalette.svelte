<script lang="ts">
  import { Command, Dialog } from "bits-ui";
  import {
    commandList,
    commandPaletteOpen,
    executeCommand,
  } from "../commands";
  import Kbd from "./ui/Kbd.svelte";
  import Icon from "./ui/Icon.svelte";

  const select = (cmdId: string) => {
    executeCommand(cmdId);
    commandPaletteOpen.set(false);
  };
</script>

<Dialog.Root
  open={$commandPaletteOpen}
  onOpenChange={(open) => commandPaletteOpen.set(open)}
>
  <Dialog.Portal>
    <Dialog.Overlay class="ui-dialog-overlay" />
    <Dialog.Content class="ui-dialog-content">
      <Dialog.Title class="sr-only">Command palette</Dialog.Title>
      <Command.Root label="Command palette" loop>
        <div class="flex items-center gap-2 px-3 border-b border-border-muted">
          <span class="text-fg-muted"><Icon name="search" /></span>
          <Command.Input
            class="ui-input w-full border-0 bg-transparent"
            placeholder="Type a command"
            autocomplete="off"
          />
        </div>
        <Command.List class="max-h-[50vh] overflow-y-auto p-1">
          <Command.Viewport>
            <Command.Empty class="px-2 py-3 text-fg-muted">No commands</Command.Empty>
            {#each commandList as cmd (cmd.id)}
              <Command.Item
                value={cmd.title}
                keywords={(cmd.keywords ?? "").split(/\s+/).filter(Boolean)}
                onSelect={() => select(cmd.id)}
                class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 outline-none data-[selected]:bg-accent-muted hover:bg-canvas-muted"
              >
                <span class="flex items-center gap-2 text-fg-default">
                  <span class="text-fg-muted"><Icon name={cmd.icon} /></span>
                  {cmd.title}
                </span>
                {#if cmd.shortcut}
                  <Kbd>{cmd.shortcut}</Kbd>
                {/if}
              </Command.Item>
            {/each}
          </Command.Viewport>
        </Command.List>
      </Command.Root>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
