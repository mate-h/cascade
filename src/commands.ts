import { writable } from "svelte/store";
import { showFloatingText } from "./stores/labels";
import { panelStore } from "./stores/panels";

export interface Command {
  id: string;
  title: string;
  /** Example: "L" or "Ctrl+K" for display only */
  shortcut?: string;
  /** Space-separated keywords to help fuzzy search */
  keywords?: string;
  action: () => void;
}

export const COMMAND_IDS = {
  TOGGLE_LABELS: "toggle-labels",
  TOGGLE_ECS_PANEL: "toggle-ecs-panel",
  TOGGLE_PROPERTIES_PANEL: "toggle-properties-panel",
} as const;

// Central command list
export const commandList: Command[] = [
  {
    id: COMMAND_IDS.TOGGLE_LABELS,
    title: "Toggle Floating Labels",
    shortcut: "L",
    keywords: "text labels overlay", // search helpers
    action: () => showFloatingText.toggle(),
  },
  {
    id: COMMAND_IDS.TOGGLE_ECS_PANEL,
    title: "Toggle ECS Panel",
    shortcut: "N",
    keywords: "entity component system panel sidebar",
    action: () => panelStore.togglePanel("ecsPanel"),
  },
  {
    id: COMMAND_IDS.TOGGLE_PROPERTIES_PANEL,
    title: "Toggle Properties Panel",
    shortcut: "T",
    keywords: "inspector properties sidebar",
    action: () => panelStore.togglePanel("propertiesPanel"),
  },
];

export function executeCommand(id: string) {
  const cmd = commandList.find((c) => c.id === id);
  cmd?.action();
}

// Optional: a map of (lowercase key char) -> command id for simple shortcuts without modifiers
export const keyBindingMap: Record<string, string> = {
  l: COMMAND_IDS.TOGGLE_LABELS,
  n: COMMAND_IDS.TOGGLE_ECS_PANEL,
  t: COMMAND_IDS.TOGGLE_PROPERTIES_PANEL,
};

// Store controlling palette visibility
export const commandPaletteOpen = writable(false); 