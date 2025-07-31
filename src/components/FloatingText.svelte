<script lang="ts">
  import { onDestroy } from "svelte";
  import { worldToScreen } from "../utils/dom";
import type { AppState } from "../app";
import { COMPONENT_TYPES } from "../ecs/components";
import type { TextLabelComponent, Transform3DComponent, CameraComponent } from "../ecs/components";
import { activeCameraId } from "../stores/camera";
import { selectedEntityId } from "../stores/selection";
import { vec3, vec4 } from "wgpu-matrix";

  let { appState } = $props<{ appState: AppState }>();
  let textContainer: HTMLDivElement;
  let animationFrameId: number | null = null;
  let lastLabelState: string = "";

  const textLabels = $derived(() => {
    const labels: Array<{ entityId: number; textLabel: TextLabelComponent; transform: Transform3DComponent }> = [];
    const textComponents = appState.ecs.components.get(COMPONENT_TYPES.TEXT_LABEL) as Map<number, TextLabelComponent> | undefined;
    const transformComponents = appState.ecs.components.get(COMPONENT_TYPES.TRANSFORM_3D) as Map<number, Transform3DComponent> | undefined;

    if (textComponents && transformComponents) {
      for (const [entityId, textLabel] of textComponents) {
        const transform = transformComponents.get(entityId);
        if (transform) {
          labels.push({ entityId, textLabel, transform });
        }
      }
    }
    return labels;
  });

  const activeCamera = $derived(() => {
    if ($activeCameraId === null) return null;
    const cameraComponents = appState.ecs.components.get(COMPONENT_TYPES.CAMERA) as Map<number, CameraComponent> | undefined;
    return cameraComponents?.get($activeCameraId) || null;
  });

  // Helper: deep state snapshot for all label positions, text, selection
  function getLabelStateSnapshot(
    labels: Array<{ entityId: number; textLabel: TextLabelComponent; transform: Transform3DComponent }>,
    camera: CameraComponent,
    containerW: number,
    containerH: number,
    selectedId: number | null
  ): string {
    const arr = [];
    for (const { entityId, textLabel, transform } of labels) {
      const worldPos = vec3.fromValues(
        transform.position[0] + textLabel.offset[0],
        transform.position[1] + textLabel.offset[1],
        transform.position[2] + textLabel.offset[2]
      );
      const screenPos = worldToScreen(worldPos, camera, containerW, containerH);
      const isSelected = selectedId === entityId;
      const clipZ = calculateClipSpaceZ(worldPos, camera);
      arr.push({ entityId, text: textLabel.text, isSelected, screenPos, clipZ });
    }
    // Sort for stable comparison
    arr.sort((a, b) => a.entityId - b.entityId);
    return JSON.stringify(arr);
  }

  function updateTextPositions() {
    if (!textContainer || !activeCamera) return;
    const camera = activeCamera();
    if (!camera) {
      animationFrameId = requestAnimationFrame(updateTextPositions);
      return;
    }
    const containerW = textContainer.clientWidth;
    const containerH = textContainer.clientHeight;
    const selectedId = $selectedEntityId;
    const labels = textLabels();

    // Take a snapshot of the current label state
    const currentState = getLabelStateSnapshot(labels, camera, containerW, containerH, selectedId);
    if (currentState !== lastLabelState) {
      lastLabelState = currentState;
      textContainer.innerHTML = '';
      const textElements: Array<{
        element: HTMLDivElement;
        isSelected: boolean;
        clipZ: number;
        entityId: number;
      }> = [];

      for (const { entityId, textLabel, transform } of labels) {
        const worldPos = vec3.fromValues(
          transform.position[0] + textLabel.offset[0],
          transform.position[1] + textLabel.offset[1],
          transform.position[2] + textLabel.offset[2]
        );
        const screenPos = worldToScreen(worldPos, camera, containerW, containerH);
        if (!screenPos) continue;
        const [x, y] = screenPos;
        const textElement = document.createElement('div');
        const isSelected = selectedId === entityId;
        const displayText = textLabel.text;
        textElement.textContent = displayText;
        const style: Partial<CSSStyleDeclaration> = {
          position: 'absolute',
          transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
          willChange: 'transform',
          fontSize: `${textLabel.fontSize}px`,
          color: textLabel.color,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: `${textLabel.padding}px`,
          borderRadius: `${textLabel.borderRadius}px`,
          fontFamily: 'Cascade Mono',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
        };
        if (isSelected) {
          style.border = '2px solid #3b82f6';
          style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.5)';
        }
        Object.assign(textElement.style, style);
        const clipZ = calculateClipSpaceZ(worldPos, camera);
        textElements.push({ element: textElement, isSelected, clipZ, entityId });
      }
      // Sort: selected first, then by ascending clipZ (smaller z = closer)
      textElements.sort((a, b) => {
        if (a.isSelected && !b.isSelected) return -1;
        if (!a.isSelected && b.isSelected) return 1;
        return a.clipZ - b.clipZ;
      });
      for (let i = 0; i < textElements.length; i++) {
        const { element, isSelected } = textElements[i];
        element.style.zIndex = isSelected ? '1000' : (1000 - i).toString();
        textContainer.appendChild(element);
      }
    }
    animationFrameId = requestAnimationFrame(updateTextPositions);
  }

  function calculateClipSpaceZ(worldPos: Float32Array, camera: CameraComponent): number {
    if (!camera.viewMatrix || !camera.projectionMatrix) return 0;
    const worldPos4 = vec4.fromValues(worldPos[0], worldPos[1], worldPos[2], 1.0);
    const viewPos = vec4.transformMat4(worldPos4, camera.viewMatrix);
    const clipPos = vec4.transformMat4(viewPos, camera.projectionMatrix);
    return clipPos[2] / clipPos[3];
  }

  // Restart the loop on any relevant change
  $effect(() => {
    if (animationFrameId === null) {
      updateTextPositions();
      animationFrameId = requestAnimationFrame(updateTextPositions);
    }
  });

  // Also restart on destroy (cleanup)
  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
</script>

<div bind:this={textContainer} style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></div> 
