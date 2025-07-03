<script lang="ts">
  import { onDestroy } from "svelte";
  import { worldToScreen } from "../utils/dom";
import type { AppState } from "../app";
import { COMPONENT_TYPES } from "../ecs/components";
import type { TextLabelComponent, Transform3DComponent, CameraComponent } from "../ecs/components";
import { activeCameraId } from "../stores/camera";
import { selectedEntityId } from "../stores/selection";
import { vec3 } from "wgpu-matrix";

  let { appState } = $props<{ appState: AppState }>();
  let textContainer: HTMLDivElement;
  let animationFrameId: number;

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

  function updateTextPositions() {
    if (!textContainer || !activeCamera) return;

    textContainer.innerHTML = '';

    for (const { entityId, textLabel, transform } of textLabels()) {
      const camera = activeCamera();
      if (!camera) continue;
      
      const worldPos = vec3.fromValues(
        transform.position[0] + textLabel.offset[0],
        transform.position[1] + textLabel.offset[1],
        transform.position[2] + textLabel.offset[2]
      );

      const screenPos = worldToScreen(worldPos, camera, textContainer.clientWidth, textContainer.clientHeight);
      if (!screenPos) continue;

      const [x, y] = screenPos;
      const textElement = document.createElement('div');
      
      // Check if this entity is selected
      const isSelected = $selectedEntityId === entityId;
      const displayText = textLabel.text;
      
      textElement.textContent = displayText;
      textElement.style.position = 'absolute';
      textElement.style.left = `${x}px`;
      textElement.style.top = `${y}px`;
      textElement.style.transform = 'translate(-50%, -50%)';
      textElement.style.fontSize = `${textLabel.fontSize}px`;
      textElement.style.color = textLabel.color;
      textElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // Always black background for contrast
      textElement.style.padding = `${textLabel.padding}px`;
      textElement.style.borderRadius = `${textLabel.borderRadius}px`;
      textElement.style.fontFamily = 'monospace';
      textElement.style.fontWeight = 'bold';
      textElement.style.whiteSpace = 'nowrap';
      textElement.style.pointerEvents = 'none';
      textElement.style.zIndex = '10';
      textElement.style.userSelect = 'none';
      textElement.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.8)';
      
      // Add selection indicator styling
      if (isSelected) {
        textElement.style.border = '2px solid #3b82f6';
        textElement.style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.5)';
      }

      textContainer.appendChild(textElement);
    }

    animationFrameId = requestAnimationFrame(updateTextPositions);
  }

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  $effect(() => {
    if ($activeCameraId !== null) {
      updateTextPositions();
    }
  });
</script>

<div bind:this={textContainer} style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;" /> 