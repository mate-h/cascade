import { writable } from "svelte/store";

export const ecsUiRevision = writable(0);

export const bumpEcsUi = () => {
  ecsUiRevision.update((n) => n + 1);
};
