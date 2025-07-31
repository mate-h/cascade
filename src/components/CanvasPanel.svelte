<script lang="ts">
  import { onMount } from "svelte";
  import { raycastSystem, setGizmoTarget, handleGizmoInteraction } from "../ecs";
  import { selectedEntityId, selectEntity } from "../stores/selection";
  import { getComponent } from "../ecs/types";
  import { COMPONENT_TYPES } from "../ecs/components";
  import type { CameraComponent } from "../ecs/components";
  import { CONFIG } from "../config";

  let { appState } = $props();
  let canvasContainer: HTMLDivElement;
  let isMouseDown = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let wasMouseDown = false;

  onMount(() => {
    // Canvas is already initialized in appState.gpu
    // Just need to append it to our container
    if (appState.gpu.canvas && canvasContainer) {
      // Clear container and append the WebGPU canvas
      canvasContainer.innerHTML = "";
      canvasContainer.appendChild(appState.gpu.canvas);

      // Apply styles to the canvas
      appState.gpu.canvas.className = "block w-full h-full cursor-crosshair";

      // Set up mouse event handlers
      const handleMouseMove = (event: MouseEvent) => {
        const rect = appState.gpu.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        // Handle gizmo interaction if we have a selected entity
        if ($selectedEntityId !== null && CONFIG.ENABLE_TRANSFORM_GIZMO) {
          // Get active camera for view and projection matrices
          const activeCamera = getActiveCamera();
          if (activeCamera && activeCamera.viewMatrix && activeCamera.projectionMatrix) {
            handleGizmoInteraction(
              appState.ecs,
              mouseX,
              mouseY,
              isMouseDown && !wasMouseDown, // mouse down
              !isMouseDown && wasMouseDown, // mouse up
            );
          }
        }
        
        wasMouseDown = isMouseDown;
      };

      const handleMouseDown = (event: MouseEvent) => {
                isMouseDown = true;
        handleMouseMove(event);
        
        // Perform raycast to select entity
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
              50.0 // Max distance of 50 units for selection
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
      
                      }
  });

  // Helper function to get the active camera
  function getActiveCamera() {
    // Find the entity with ActiveCamera component
    for (const [entityId, _] of appState.ecs.components.get(COMPONENT_TYPES.ACTIVE_CAMERA) || []) {
      const camera = getComponent<CameraComponent>(
        appState.ecs,
        entityId,
        COMPONENT_TYPES.CAMERA
      );
      if (camera) {
        return camera;
      }
    }
    return null;
  }
</script>

<div class="w-full h-full relative">
  <div bind:this={canvasContainer} class="w-full h-full"></div>
</div>
