<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { raycastSystem, setGizmoTarget, handleGizmoInteraction } from "../ecs";
  import { selectedEntityId, selectEntity } from "../stores/selection";
  import { getComponent } from "../ecs/types";
  import { COMPONENT_TYPES } from "../ecs/components";
  import type { CameraComponent } from "../ecs/components";
  import { CONFIG } from "../config";
  import { resizeApp } from "../app";
  import { showFloatingText } from "../stores/labels";
  import FloatingText from "./FloatingText.svelte";

  let { appState } = $props();
  let canvasContainer: HTMLDivElement;
  let isMouseDown = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let wasMouseDown = false;
  let resizeObserver: ResizeObserver | null = null;

  onMount(() => {
    if (appState.gpu.canvas && canvasContainer) {
      canvasContainer.innerHTML = "";
      canvasContainer.appendChild(appState.gpu.canvas);
      appState.gpu.canvas.className = "block w-full h-full cursor-crosshair";

      const handleMouseMove = (event: MouseEvent) => {
        const rect = appState.gpu.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        lastMouseX = mouseX;
        lastMouseY = mouseY;

        if ($selectedEntityId !== null && CONFIG.ENABLE_TRANSFORM_GIZMO) {
          const activeCamera = getActiveCamera();
          if (activeCamera && activeCamera.viewMatrix && activeCamera.projectionMatrix) {
            handleGizmoInteraction(
              appState.ecs,
              mouseX,
              mouseY,
              isMouseDown && !wasMouseDown,
              !isMouseDown && wasMouseDown,
            );
          }
        }

        wasMouseDown = isMouseDown;
      };

      const handleMouseDown = (event: MouseEvent) => {
        isMouseDown = true;
        handleMouseMove(event);

        if (CONFIG.ENABLE_RAYCAST) {
          const activeCamera = getActiveCamera();
          if (activeCamera && activeCamera.viewMatrix && activeCamera.projectionMatrix) {
            const raycastResult = raycastSystem(
              appState.ecs,
              lastMouseX,
              lastMouseY,
              appState.gpu.canvas.width,
              appState.gpu.canvas.height,
              activeCamera.viewMatrix,
              activeCamera.projectionMatrix,
              50.0,
            );

            if (raycastResult) {
              selectEntity(raycastResult.entityId);
              if (CONFIG.ENABLE_TRANSFORM_GIZMO) {
                setGizmoTarget(raycastResult.entityId);
              }
            } else {
              selectEntity(null);
              if (CONFIG.ENABLE_TRANSFORM_GIZMO) {
                setGizmoTarget(null);
              }
            }
          }
        }
      };

      const handleMouseUp = (event: MouseEvent) => {
        isMouseDown = false;
        handleMouseMove(event);
      };

      appState.gpu.canvas.addEventListener("mousemove", handleMouseMove);
      appState.gpu.canvas.addEventListener("mousedown", handleMouseDown);
      appState.gpu.canvas.addEventListener("mouseup", handleMouseUp);

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        resizeApp(appState, width, height);
      });
      resizeObserver.observe(canvasContainer);
    }
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });

  function getActiveCamera() {
    for (const [entityId] of appState.ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA) || []) {
      const camera = getComponent<CameraComponent>(
        appState.ecs,
        entityId,
        COMPONENT_TYPES.CAMERA,
      );
      if (camera) {
        return camera;
      }
    }
    return null;
  }
</script>

<div class="relative w-full h-full min-w-0 min-h-0">
  <div bind:this={canvasContainer} class="w-full h-full"></div>
  {#if $showFloatingText}
    <FloatingText {appState} />
  {/if}
</div>
