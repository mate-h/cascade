/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

declare module "*.svelte" {
  import type { ComponentType } from "svelte";
  const component: ComponentType;
  export default component;
}
