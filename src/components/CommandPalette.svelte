<script lang="ts">
  import { onMount } from "svelte";
  import {
    commandList,
    commandPaletteOpen,
    executeCommand,
  } from "../commands";

  let search = $state("");
  let inputEl = $state<HTMLInputElement>();

  const filtered = $derived(() => {
    const q = search.trim().toLowerCase();
    if (!q) return commandList;
    return commandList.filter((cmd) => {
      const haystack = `${cmd.title} ${cmd.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  });

  onMount(() => {
    inputEl?.focus();
  });

  // Focus input each time palette becomes visible
  $effect(() => {
    if ($commandPaletteOpen) {
      // wait next tick to ensure element exists
      Promise.resolve().then(() => inputEl?.focus());
    }
  });

  function closePalette() {
    commandPaletteOpen.set(false);
    search = ""; // reset query
  }

  function select(cmdId: string) {
    executeCommand(cmdId);
    closePalette();
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const list = filtered();
      if (list.length > 0) {
        select(list[0].id);
      }
    }
  }
</script>

{#if $commandPaletteOpen}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
    onclick={closePalette}
    tabindex="0"
    role="button"
    onkeydown={handleKey}
  >
    <div
      class="bg-bg-primary/95 border border-border-default rounded shadow-lg w-80 max-h-[60vh] overflow-hidden"
      role="button"
      tabindex="0"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKey}
    >
      <input
        bind:this={inputEl}
        bind:value={search}
        onkeydown={handleKey}
        class="w-full py-2 px-3 bg-transparent outline-none border-b border-border-subtle text-text-primary placeholder:text-text-muted"
        placeholder="Type a command..."
        autocomplete="off"
      />
      <ul class="max-h-[50vh] overflow-y-auto divide-y divide-border-subtle">
        {#if filtered().length === 0}
          <li class="p-3 text-text-muted">No commands</li>
        {:else}
          {#each filtered() as cmd (cmd.id)}
            <li>
              <button
                type="button"
                class="w-full flex justify-between items-center p-3 text-left hover:bg-bg-overlay focus:outline-none"
                onclick={() => select(cmd.id)}
              >
                <span class="text-text-bright">{cmd.title}</span>
                {#if cmd.shortcut}
                  <span class="text-text-secondary text-xs border border-border-subtle rounded px-1 py-0.5">
                    {cmd.shortcut}
                  </span>
                {/if}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>
{/if} 