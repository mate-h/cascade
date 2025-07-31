import "@unocss/reset/tailwind.css";
import "./style.css";
import App from "./App.svelte";
import { mount } from "svelte";
import "./cascade-mono.css";

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
