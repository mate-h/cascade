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
      "inline-flex items-center justify-center size-7 rounded-md border border-border-default bg-canvas-muted text-fg-muted hover:bg-control-hover hover:text-fg-default transition-colors duration-100",
    "ui-btn":
      "inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-border-default bg-canvas-muted text-fg-default hover:bg-control-hover transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed",
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
  ],
});
