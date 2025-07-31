import { writable } from "svelte/store";

// Panel resize constants
const PANEL_HEIGHT_MIN = 50;
const PANEL_HEIGHT_PAD = 100;
const PANEL_WIDTH_MIN = 200;
const PANEL_WIDTH_MAX = 800;

// Export constants for use in components
export const PANEL_CONSTANTS = {
  HEIGHT_MIN: PANEL_HEIGHT_MIN,
  HEIGHT_PAD: PANEL_HEIGHT_PAD,
  WIDTH_MIN: PANEL_WIDTH_MIN,
  WIDTH_MAX: PANEL_WIDTH_MAX,
} as const;

export interface PanelState {
  isCollapsed: boolean;
  width: number;
  height?: number; // For future use if we need resizable height
}

export interface PanelSizes {
  ecsPanel: PanelState;
  propertiesPanel: PanelState;
}

// Default panel sizes
const DEFAULT_PANEL_SIZES: PanelSizes = {
  ecsPanel: {
    isCollapsed: true,
    width: 384, // 24rem in pixels (w-96)
  },
  propertiesPanel: {
    isCollapsed: true,
    width: 320, // 20rem in pixels (w-80)
    height: 300, // Default height for split panel (more reasonable default)
  },
};

// Load saved panel sizes from localStorage
function loadPanelSizes(): PanelSizes {
  if (typeof window === "undefined") return DEFAULT_PANEL_SIZES;

  try {
    const saved = localStorage.getItem("cascade-panel-sizes");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all properties exist
      return {
        ecsPanel: { ...DEFAULT_PANEL_SIZES.ecsPanel, ...parsed.ecsPanel },
        propertiesPanel: {
          ...DEFAULT_PANEL_SIZES.propertiesPanel,
          ...parsed.propertiesPanel,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to load panel sizes from localStorage:", error);
  }

  return DEFAULT_PANEL_SIZES;
}

// Save panel sizes to localStorage
function savePanelSizes(sizes: PanelSizes): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("cascade-panel-sizes", JSON.stringify(sizes));
  } catch (error) {
    console.warn("Failed to save panel sizes to localStorage:", error);
  }
}

// Create the store
function createPanelStore() {
  const { subscribe, set, update } = writable<PanelSizes>(loadPanelSizes());

  return {
    subscribe,

    // Toggle panel collapsed state
    togglePanel(panelKey: keyof PanelSizes) {
      update((sizes) => {
        const newSizes = {
          ...sizes,
          [panelKey]: {
            ...sizes[panelKey],
            isCollapsed: !sizes[panelKey].isCollapsed,
          },
        };
        savePanelSizes(newSizes);
        return newSizes;
      });
    },

    // Set panel width
    setPanelWidth(panelKey: keyof PanelSizes, width: number) {
      update((sizes) => {
        const newSizes = {
          ...sizes,
          [panelKey]: {
            ...sizes[panelKey],
            width: Math.max(PANEL_WIDTH_MIN, Math.min(PANEL_WIDTH_MAX, width)), // Clamp between min and max
          },
        };
        savePanelSizes(newSizes);
        return newSizes;
      });
    },

    // Set panel height
    setPanelHeight(panelKey: keyof PanelSizes, height: number) {
      update((sizes) => {
        const newSizes = {
          ...sizes,
          [panelKey]: {
            ...sizes[panelKey],
            height: Math.max(PANEL_HEIGHT_MIN, Math.min(window.innerHeight - PANEL_HEIGHT_PAD, height)), // Clamp between min and max
          },
        };
        savePanelSizes(newSizes);
        return newSizes;
      });
    },

    // Set panel collapsed state
    setPanelCollapsed(panelKey: keyof PanelSizes, isCollapsed: boolean) {
      update((sizes) => {
        const newSizes = {
          ...sizes,
          [panelKey]: {
            ...sizes[panelKey],
            isCollapsed,
          },
        };
        savePanelSizes(newSizes);
        return newSizes;
      });
    },

    // Reset to defaults
    reset() {
      const newSizes = DEFAULT_PANEL_SIZES;
      savePanelSizes(newSizes);
      set(newSizes);
    },
  };
}

export const panelStore = createPanelStore();

// Resize utility functions
export interface ResizeState {
  isResizing: boolean;
  startX: number;
  startWidth: number;
}

export interface VerticalResizeState {
  isResizing: boolean;
  startY: number;
  startHeight: number;
}

export function createResizeHandler(
  panelKey: keyof PanelSizes,
  onResize?: (width: number) => void,
) {
  let resizeState: ResizeState = {
    isResizing: false,
    startX: 0,
    startWidth: 0,
  };

  function startResize(event: MouseEvent, currentWidth: number) {
    resizeState.isResizing = true;
    resizeState.startX = event.clientX;
    resizeState.startWidth = currentWidth;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    event.preventDefault();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!resizeState.isResizing) return;

    const deltaX = event.clientX - resizeState.startX;
    const newWidth =
      panelKey === "ecsPanel"
        ? resizeState.startWidth + deltaX // ECS panel grows to the right
        : resizeState.startWidth - deltaX; // Properties panel grows to the left

    const clampedWidth = Math.max(PANEL_WIDTH_MIN, Math.min(PANEL_WIDTH_MAX, newWidth));

    onResize?.(clampedWidth);
    panelStore.setPanelWidth(panelKey, clampedWidth);
  }

  function stopResize() {
    if (!resizeState.isResizing) return;

    resizeState.isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  // Set up global event listeners
  if (typeof window !== "undefined") {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResize);
    document.addEventListener("mouseleave", stopResize);
  }

  return {
    get isResizing() {
      return resizeState.isResizing;
    },
    startResize,
    cleanup() {
      if (typeof window !== "undefined") {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
        document.removeEventListener("mouseleave", stopResize);
      }
    },
  };
}

export function createVerticalResizeHandler(
  panelKey: keyof PanelSizes,
  onResize?: (height: number) => void,
) {
  let resizeState: VerticalResizeState = {
    isResizing: false,
    startY: 0,
    startHeight: 0,
  };

  function startResize(event: MouseEvent, currentHeight: number) {
    resizeState.isResizing = true;
    resizeState.startY = event.clientY;
    resizeState.startHeight = currentHeight;

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    event.preventDefault();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!resizeState.isResizing) return;

    const deltaY = event.clientY - resizeState.startY;
    // Invert the logic: when dragging down (positive deltaY), increase the height
    const newHeight = resizeState.startHeight + deltaY;

    // Clamp the height to reasonable bounds
    const clampedHeight = Math.max(PANEL_HEIGHT_MIN, Math.min(window.innerHeight - PANEL_HEIGHT_PAD, newHeight));

    onResize?.(clampedHeight);
    panelStore.setPanelHeight(panelKey, clampedHeight);
  }

  function stopResize() {
    if (!resizeState.isResizing) return;

    resizeState.isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  // Set up global event listeners
  if (typeof window !== "undefined") {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResize);
    document.addEventListener("mouseleave", stopResize);
  }

  return {
    get isResizing() {
      return resizeState.isResizing;
    },
    startResize,
    cleanup() {
      if (typeof window !== "undefined") {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
        document.removeEventListener("mouseleave", stopResize);
      }
    },
  };
}
