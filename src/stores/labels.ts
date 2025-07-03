import { writable } from "svelte/store";

// Key used for localStorage persistence
const STORAGE_KEY = "cascade-show-floating-text";

function loadInitial(): boolean {
  if (typeof window === "undefined") return true; // default visible during SSR
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === "true";
}

function persist(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // ignore quota / security errors
  }
}

function createFloatingTextStore() {
  const { subscribe, set, update } = writable<boolean>(loadInitial());

  return {
    subscribe,
    /** Toggle the visibility */
    toggle() {
      update((prev) => {
        const next = !prev;
        persist(next);
        return next;
      });
    },
    /** Explicitly set the visibility */
    set(value: boolean) {
      persist(value);
      set(value);
    },
  } as const;
}

export const showFloatingText = createFloatingTextStore(); 