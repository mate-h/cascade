// Check WebGPU browser support
export const checkWebGPUSupport = (): boolean => {
  return !!navigator.gpu;
};

import { vec4, type Vec3 } from "wgpu-matrix";
import type { CameraComponent } from "../ecs/components";

/**
 * Transforms a world position to screen coordinates
 * @param worldPosition - The 3D world position
 * @param camera - The camera component with view and projection matrices
 * @param canvasWidth - Width of the canvas
 * @param canvasHeight - Height of the canvas
 * @returns Screen coordinates [x, y] in pixels, or null if behind camera
 */
export function worldToScreen(
  worldPosition: Vec3,
  camera: CameraComponent,
  canvasWidth: number,
  canvasHeight: number
): [number, number] | null {
  if (!camera.viewMatrix || !camera.projectionMatrix) {
    return null;
  }

  // Create homogeneous world position
  const worldPos = vec4.fromValues(worldPosition[0], worldPosition[1], worldPosition[2], 1.0);

  // Transform to view space
  const viewPos = vec4.transformMat4(worldPos, camera.viewMatrix);

  // Check if behind camera
  if (viewPos[2] > 0) {
    return null;
  }

  // Transform to clip space
  const clipPos = vec4.transformMat4(viewPos, camera.projectionMatrix);

  // Perspective divide
  const ndcPos = vec4.scale(clipPos, 1.0 / clipPos[3]);

  // Transform to screen coordinates
  const screenX = ((ndcPos[0] + 1.0) / 2.0) * canvasWidth;
  const screenY = ((1.0 - ndcPos[1]) / 2.0) * canvasHeight;

  return [screenX, screenY];
}

/**
 * Checks if a world position is visible on screen
 * @param worldPosition - The 3D world position
 * @param camera - The camera component with view and projection matrices
 * @param canvasWidth - Width of the canvas
 * @param canvasHeight - Height of the canvas
 * @returns True if the position is visible on screen
 */
export function isWorldPositionVisible(
  worldPosition: Vec3,
  camera: CameraComponent,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const screenPos = worldToScreen(worldPosition, camera, canvasWidth, canvasHeight);
  if (!screenPos) return false;

  const [x, y] = screenPos;
  return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
}
