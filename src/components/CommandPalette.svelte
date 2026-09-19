<script lang="ts">
  import {
    commandList,
    commandPaletteOpen,
    executeCommand,
  } from "../commands";
  import Kbd from "./ui/Kbd.svelte";
  import Icon from "./ui/Icon.svelte";

  let search = $state("");
  let inputEl = $state<HTMLInputElement>();
  let activeIndex = $state(0);

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return commandList;
    return commandList.filter((cmd) => {
      const haystack = `${cmd.title} ${cmd.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  });

  $effect(() => {
    if ($commandPaletteOpen) {
      Promise.resolve().then(() => inputEl?.focus());
    }
  });

  const closePalette = () => {
    commandPaletteOpen.set(false);
    search = "";
    activeIndex = 0;
  };

  const select = (cmdId: string) => {
    executeCommand(cmdId);
    closePalette();
  };

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, Math.max(filtered.length - 1, 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) select(cmd.id);
    }
  };
</script>

{#if $commandPaletteOpen}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-[var(--overlay-backdrop-bgColor)]"
    onclick={closePalette}
    onkeydown={handleKey}
    role="presentation"
  >
    <div
      class="w-[480px] max-h-[60vh] overflow-hidden rounded-md border border-border-default bg-canvas-overlay shadow-float"
      role="dialog"
      aria-label="Command palette"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKey}
    >
      <div class="flex items-center gap-2 px-3 border-b border-border-muted">
        <span class="text-fg-muted"><Icon name="search" /></span>
        <input
          bind:this={inputEl}
          bind:value={search}
          oninput={() => {
            activeIndex = 0;
          }}
          onkeydown={handleKey}
          class="w-full h-10 bg-transparent outline-none text-fg-default placeholder:text-fg-disabled"
          placeholder="Type a command"
          autocomplete="off"
        />
      </div>
      <ul class="max-h-[50vh] overflow-y-auto p-1">
        {#if filtered.length === 0}
          <li class="px-2 py-3 text-fg-muted">No commands</li>
        {:else}
          {#each filtered as cmd, index (cmd.id)}
            <li>
              <button
                type="button"
                class={[
                  "w-full flex justify-between items-center gap-3 px-2 py-1.5 rounded-md text-left",
                  index === activeIndex ? "bg-accent-muted" : "hover:bg-canvas-muted",
                ]}
                onclick={() => select(cmd.id)}
              >
                <span class="flex items-center gap-2 text-fg-default">
                  <span class="text-fg-muted"><Icon name={cmd.icon} /></span>
                  {cmd.title}
                </span>
                {#if cmd.shortcut}
                  <Kbd>{cmd.shortcut}</Kbd>
                {/if}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>
{/if}
