import { writable } from "svelte/store";

export const activeCameraId = writable<number | null>(null);
