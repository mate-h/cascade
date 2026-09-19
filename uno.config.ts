import { defineConfig, presetWind3 } from "unocss";
import { presetIcons } from "@unocss/preset-icons";
import { icons as lucideIcons } from "@iconify-json/lucide";

export default defineConfig({
  presets: [
    presetIcons({
      iconifyCollectionsNames: ["lucide"],
      collections: {
        lucide: () => lucideIcons,
      },
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
    presetWind3(),
  ],
  theme: {
    fontFamily: {
      mono: "Cascade Mono",
    },
    colors: {
      canvas: {
        default: "var(--bgColor-default)",
        muted: "var(--bgColor-muted)",
        inset: "var(--bgColor-inset)",
        emphasis: "var(--bgColor-emphasis)",
        disabled: "var(--bgColor-disabled)",
        overlay: "var(--overlay-bgColor)",
      },
      fg: {
        default: "var(--fgColor-default)",
        muted: "var(--fgColor-muted)",
        disabled: "var(--fgColor-disabled)",
        onEmphasis: "var(--fgColor-onEmphasis)",
        accent: "var(--fgColor-accent)",
        success: "var(--fgColor-success)",
        attention: "var(--fgColor-attention)",
        danger: "var(--fgColor-danger)",
        done: "var(--fgColor-done)",
      },
      border: {
        default: "var(--borderColor-default)",
        muted: "var(--borderColor-muted)",
        emphasis: "var(--borderColor-emphasis)",
        accent: "var(--borderColor-accent-emphasis)",
      },
      control: {
        rest: "var(--control-bgColor-rest)",
        hover: "var(--control-bgColor-hover)",
        active: "var(--control-bgColor-active)",
      },
      accent: {
        muted: "var(--bgColor-accent-muted)",
        emphasis: "var(--bgColor-accent-emphasis)",
      },
      success: {
        muted: "var(--bgColor-success-muted)",
      },
      attention: {
        muted: "var(--bgColor-attention-muted)",
      },
      danger: {
        muted: "var(--bgColor-danger-muted)",
      },
      neutral: {
        muted: "var(--bgColor-neutral-muted)",
      },
    },
    boxShadow: {
      float: "var(--shadow-floating-small)",
    },
    borderRadius: {
      sm: "var(--borderRadius-small)",
      md: "var(--borderRadius-medium)",
    },
  },
  shortcuts: {
    "ui-icon-btn":
      "inline-flex items-center justify-center size-7 rounded-md border border-border-default bg-canvas-muted text-fg-muted hover:bg-control-hover hover:text-fg-default transition-colors duration-100 data-[state=on]:bg-accent-muted data-[state=on]:text-fg-accent data-[state=on]:border-border-accent",
    "ui-icon-btn-active":
      "bg-accent-muted text-fg-accent border-border-accent",
    "ui-btn":
      "inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-border-default bg-canvas-muted text-fg-default hover:bg-control-hover transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed data-[state=on]:bg-accent-muted data-[state=on]:text-fg-accent data-[state=on]:border-border-accent",
    "ui-input":
      "h-7 px-2 bg-canvas-inset border border-border-default rounded-md text-fg-default placeholder:text-fg-disabled outline-none focus:border-border-accent",
    "ui-kbd":
      "inline-flex items-center h-5 px-1.5 rounded-sm border border-border-default bg-canvas-muted text-fg-muted",
    "ui-panel": "bg-canvas-default border-border-default",
    "ui-row":
      "rounded-md px-2 py-1.5 hover:bg-canvas-muted transition-colors duration-100",
    "ui-row-selected": "bg-accent-muted",
    "ui-row-linked": "bg-attention-muted",
    "entity-ref":
      "text-fg-accent cursor-pointer underline decoration-dotted decoration-border-emphasis hover:decoration-solid",
    "ui-dialog-overlay":
      "fixed inset-0 z-50 bg-[var(--overlay-backdrop-bgColor)]",
    "ui-dialog-content":
      "fixed left-1/2 top-24 z-50 w-[480px] max-w-[calc(100vw-2rem)] max-h-[60vh] -translate-x-1/2 overflow-hidden rounded-md border border-border-default bg-canvas-overlay shadow-float outline-none",
    "ui-menu":
      "z-50 min-w-40 overflow-hidden rounded-md border border-border-default bg-canvas-overlay p-1 shadow-float outline-none",
    "ui-menu-item":
      "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-fg-default outline-none data-[highlighted]:bg-accent-muted data-[state=checked]:text-fg-accent",
    "ui-tooltip":
      "z-50 rounded-md border border-border-default bg-canvas-overlay px-2 py-1 text-fg-default shadow-float",
    "ui-slider":
      "relative flex h-4 w-full touch-none select-none items-center",
    "ui-slider-track":
      "relative h-1 w-full grow rounded-full bg-border-default",
    "ui-slider-range":
      "absolute h-full rounded-full bg-fg-accent",
    "ui-slider-thumb":
      "block size-3 rounded-full border-2 border-canvas-default bg-fg-accent outline-none",
    "ui-checkbox":
      "inline-flex size-3.5 items-center justify-center rounded-sm border border-border-default bg-canvas-inset text-fg-accent data-[state=checked]:bg-accent-muted data-[state=checked]:border-border-accent",
  },
  safelist: [
    "i-lucide-boxes",
    "i-lucide-x",
    "i-lucide-copy",
    "i-lucide-check",
    "i-lucide-sliders-horizontal",
    "i-lucide-camera",
    "i-lucide-tag",
    "i-lucide-search",
    "i-lucide-rotate-ccw",
    "i-lucide-layers",
    "i-lucide-circle-alert",
    "i-lucide-chevron-down",
  ],
});
