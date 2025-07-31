import { vec3, mat4, type Vec3 } from "wgpu-matrix";
import type { ECS } from "../types";
import { getComponentsOfType, getComponent } from "../types";
import type {
  Transform3DComponent,
  MeshComponent,
  VisibilityComponent,
  SelectableComponent,
  RaycastResult,
} from "../components";
import { COMPONENT_TYPES } from "../components";
import { CONFIG } from "../../config";

// Helper function to get mesh bounds
const getMeshBounds = (vertices: Float32Array) => {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (let i = 0; i < vertices.length; i += 9) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  
  const center = vec3.create((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  return { min: vec3.create(minX, minY, minZ), max: vec3.create(maxX, maxY, maxZ), center };
};

// Ray-line intersection
let debugCount = 0;
const rayLineIntersection = (
  rayOrigin: Vec3,
  rayDirection: Vec3,
  lineStart: Vec3,
  lineEnd: Vec3,
  lineThickness: number = 0.1,
): { hit: boolean; distance: number; point: Vec3; normal: Vec3 } => {
  // Debug logging for first few calls
  const shouldDebug = debugCount < 4;
  if (shouldDebug) debugCount++;
  const lineDir = vec3.subtract(lineEnd, lineStart);
  const lineLength = vec3.length(lineDir);
  const lineDirNormalized = vec3.normalize(lineDir);
  
  if (shouldDebug) {
      }
  
  // Find the closest point on the line to the ray
  const toLineStart = vec3.subtract(lineStart, rayOrigin);
  const projection = vec3.dot(toLineStart, lineDirNormalized);
  const closestPointOnLine = vec3.add(lineStart, vec3.scale(lineDirNormalized, projection));
  
  if (shouldDebug) {
      }
  
  // Check if closest point is within line segment
  const toClosest = vec3.subtract(closestPointOnLine, lineStart);
  const closestProjection = vec3.dot(toClosest, lineDirNormalized);
  
  if (shouldDebug) {
      }
  
  if (closestProjection < 0 || closestProjection > lineLength) {
    if (shouldDebug) {
          }
    return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
  }
  
  // Calculate distance from ray to line
  const toRay = vec3.subtract(closestPointOnLine, rayOrigin);
  const rayProjection = vec3.dot(toRay, rayDirection);
  
  if (rayProjection < 0) {
    return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
  }
  
  const rayPoint = vec3.add(rayOrigin, vec3.scale(rayDirection, rayProjection));
  const distanceToLine = vec3.distance(rayPoint, closestPointOnLine);
  
  if (shouldDebug) {
      }
  
  if (distanceToLine <= lineThickness) {
    return { 
      hit: true, 
      distance: rayProjection, 
      point: closestPointOnLine, 
      normal: vec3.normalize(vec3.subtract(rayPoint, closestPointOnLine))
    };
  }
  
  return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
};

// Ray-triangle intersection using Möller–Trumbore algorithm
const rayTriangleIntersection = (
  rayOrigin: Vec3,
  rayDirection: Vec3,
  v0: Vec3,
  v1: Vec3,
  v2: Vec3,
): { hit: boolean; distance: number; point: Vec3; normal: Vec3 } => {
  const epsilon = 1e-6;

  const edge1 = vec3.subtract(v1, v0);
  const edge2 = vec3.subtract(v2, v0);
  const h = vec3.cross(rayDirection, edge2);
  const a = vec3.dot(edge1, h);

  if (Math.abs(a) < epsilon) {
    return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
  }

  const f = 1.0 / a;
  const s = vec3.subtract(rayOrigin, v0);
  const u = f * vec3.dot(s, h);

  if (u < 0.0 || u > 1.0) {
    return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
  }

  const q = vec3.cross(s, edge1);
  const v = f * vec3.dot(rayDirection, q);

  if (v < 0.0 || u + v > 1.0) {
    return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
  }

  const t = f * vec3.dot(edge2, q);

  if (t > epsilon) {
    const point = vec3.add(rayOrigin, vec3.scale(rayDirection, t));
    const normal = vec3.normalize(vec3.cross(edge1, edge2));
    return { hit: true, distance: t, point, normal };
  }

  return { hit: false, distance: 0, point: vec3.create(0, 0, 0), normal: vec3.create(0, 0, 0) };
};

// Convert screen coordinates to world ray
export const screenToWorldRay = (
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  viewMatrix: Float32Array,
  projectionMatrix: Float32Array,
): { origin: Vec3; direction: Vec3 } => {
  // Convert screen coordinates to normalized device coordinates (-1 to 1)
  const ndcX = (2.0 * screenX) / canvasWidth - 1.0;
  const ndcY = 1.0 - (2.0 * screenY) / canvasHeight;

  // Create ray in clip space
  const rayClip = vec3.create(ndcX, ndcY, -1.0);

  // Transform to eye space
  const invProjection = mat4.inverse(projectionMatrix);
  const rayEye = vec3.transformMat4(rayClip, invProjection);
  rayEye[2] = -1.0; // Point into the screen
  rayEye[3] = 0.0; // Set w to 0 to make it a direction

  // Transform to world space
  const invView = mat4.inverse(viewMatrix);
  const rayWorld = vec3.transformMat4(rayEye, invView);
  const rayDirection = vec3.normalize(rayWorld);

  // Ray origin is camera position (extract from view matrix)
  const rayOrigin = vec3.create(-invView[12], -invView[13], -invView[14]);

    
  return { origin: rayOrigin, direction: rayDirection };
};

// Perform raycast against all selectable entities
export const performRaycast = (
  ecs: ECS,
  rayOrigin: Vec3,
  rayDirection: Vec3,
  maxDistance: number = 100.0, // Maximum ray distance
): RaycastResult | null => {
  const selectableEntities = getComponentsOfType<SelectableComponent>(
    ecs,
    COMPONENT_TYPES.SELECTABLE,
  );

  
  let closestHit: RaycastResult | null = null;
  let closestDistance = maxDistance; // Start with max distance instead of Infinity
  let gridHit: RaycastResult | null = null; // Track grid hits separately

  for (const [entityId, selectable] of selectableEntities) {
    if (!selectable.selectable) continue;

    
    // Check if entity has required components
    const transform = getComponent<Transform3DComponent>(
      ecs,
      entityId,
      COMPONENT_TYPES.TRANSFORM_3D,
    );
    const mesh = getComponent<MeshComponent>(ecs, entityId, COMPONENT_TYPES.MESH);
    const visibility = getComponent<VisibilityComponent>(
      ecs,
      entityId,
      COMPONENT_TYPES.VISIBILITY,
    );

    if (!transform || !mesh || (visibility && !visibility.visible)) {
            continue;
    }

    
    // Create transformation matrix using the same logic as rendering
    const modelMatrix = mat4.identity();
    
    // Apply translation
    mat4.translate(modelMatrix, transform.position, modelMatrix);
    
    // Apply rotation (assuming Euler angles in radians)
    mat4.rotateX(modelMatrix, transform.rotation[0], modelMatrix);
    mat4.rotateY(modelMatrix, transform.rotation[1], modelMatrix);
    mat4.rotateZ(modelMatrix, transform.rotation[2], modelMatrix);
    
    // Apply scale
    mat4.scale(modelMatrix, transform.scale, modelMatrix);

        
    // Transform ray to local space
    const invModelMatrix = mat4.inverse(modelMatrix);
    const localRayOrigin = vec3.transformMat4(rayOrigin, invModelMatrix);
    
    // Transform direction vector (should not include translation)
    const localRayDirection = vec3.normalize(vec3.transformMat4Upper3x3(rayDirection, invModelMatrix));

    // Test against mesh geometry
    const vertices = mesh.vertices;
    const indices = mesh.indices;
    const topology = mesh.topology || "triangle-list";

            
    // Simple bounds check - see if ray is anywhere near the object
    const bounds = getMeshBounds(vertices);
            
    // Check if ray intersects bounding box
    const rayDir = localRayDirection;
    const rayOrig = localRayOrigin;
    const tMin = (bounds.min[0] - rayOrig[0]) / rayDir[0];
    const tMax = (bounds.max[0] - rayOrig[0]) / rayDir[0];
    const t1 = Math.min(tMin, tMax);
    const t2 = Math.max(tMin, tMax);
        
    // Check if ray is pointing toward the object
    const toCenter = vec3.subtract(bounds.center, rayOrig);
    const dotProduct = vec3.dot(toCenter, rayDir);
    
    if (topology === "triangle-list") {
      // Test against triangles
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i] * 9; // 9 floats per vertex (pos + normal + color)
        const i1 = indices[i + 1] * 9;
        const i2 = indices[i + 2] * 9;

        const v0 = vec3.create(vertices[i0], vertices[i0 + 1], vertices[i0 + 2]);
        const v1 = vec3.create(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
        const v2 = vec3.create(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);

        if (i < 3) { // Only log first triangle for debugging
                  }

        const intersection = rayTriangleIntersection(
          localRayOrigin,
          localRayDirection,
          v0,
          v1,
          v2,
        );

        if (i < 3) { // Only log first few triangles for debugging
                    if (!intersection.hit) {
            // Log more details about why intersection failed
            const edge1 = vec3.subtract(v1, v0);
            const edge2 = vec3.subtract(v2, v0);
            const h = vec3.cross(localRayDirection, edge2);
            const a = vec3.dot(edge1, h);
                        
            // Check if ray is close to triangle plane
            const normal = vec3.normalize(vec3.cross(edge1, edge2));
            const planeDistance = vec3.dot(normal, v0);
            const rayDistance = vec3.dot(normal, localRayOrigin);
            const distanceToPlane = Math.abs(rayDistance - planeDistance);
                      }
        }

        if (intersection.hit && intersection.distance < closestDistance) {
                    // Transform intersection point back to world space
          const worldPoint = vec3.transformMat4(intersection.point, modelMatrix);
          const worldNormal = vec3.normalize(vec3.transformMat4(intersection.normal, modelMatrix));

          
          closestDistance = intersection.distance;
          closestHit = {
            entityId,
            distance: intersection.distance,
            point: worldPoint,
            normal: worldNormal,
          };
        }
      }
    } else if (topology === "line-list") {
      // For grid-like objects, first check if ray intersects the plane
      const gridNormal = vec3.create(0, 1, 0); // Grid is in XZ plane
      const gridPoint = vec3.create(0, 0, 0); // Grid center
      const planeDistance = vec3.dot(gridNormal, gridPoint);
      const rayDistance = vec3.dot(gridNormal, localRayOrigin);
      const rayDirDotNormal = vec3.dot(localRayDirection, gridNormal);
      
            
      // Test against lines
      for (let i = 0; i < indices.length; i += 2) {
        const i0 = indices[i] * 9; // 9 floats per vertex (pos + normal + color)
        const i1 = indices[i + 1] * 9;

        const v0 = vec3.create(vertices[i0], vertices[i0 + 1], vertices[i0 + 2]);
        const v1 = vec3.create(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);

        if (i < 4) { // Only log first few lines for debugging
                  }

        const intersection = rayLineIntersection(
          localRayOrigin,
          localRayDirection,
          v0,
          v1,
          5.0, // Increased line thickness for easier grid selection
        );

        if (i < 4) { // Only log first few lines for debugging
                    if (!intersection.hit) {
            // Debug line intersection
            const lineDir = vec3.subtract(v1, v0);
            const lineLength = vec3.length(lineDir);
            const toLineStart = vec3.subtract(v0, localRayOrigin);
            const projection = vec3.dot(toLineStart, vec3.normalize(lineDir));
                      }
        }

        if (intersection.hit && intersection.distance < maxDistance) {
                    // Transform intersection point back to world space
          const worldPoint = vec3.transformMat4(intersection.point, modelMatrix);
          const worldNormal = vec3.normalize(vec3.transformMat4(intersection.normal, modelMatrix));

          
          // Store grid hits separately
          if (!gridHit || intersection.distance < gridHit.distance) {
            gridHit = {
              entityId,
              distance: intersection.distance,
              point: worldPoint,
              normal: worldNormal,
            };
          }
        }
      }
    }
  }

  // Prioritize grid hits when they're within a reasonable distance of other objects
  if (gridHit && closestHit) {
    const distanceDiff = closestHit.distance - gridHit.distance;
    const gridPreferenceThreshold = 5.0; // Prefer grid if it's within 5 units of other objects
    
        
    if (distanceDiff < gridPreferenceThreshold) {
            closestHit = gridHit;
    }
  } else if (gridHit && !closestHit) {
    // Only grid hit found
        closestHit = gridHit;
  } else if (!gridHit) {
      }

  if (closestHit) {
      } else {
      }
  return closestHit;
};

// Raycast system that can be called from the main game loop
export const raycastSystem = (
  ecs: ECS,
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  viewMatrix: Float32Array,
  projectionMatrix: Float32Array,
  maxDistance: number = 50.0, // Reasonable max distance for selection
): RaycastResult | null => {
  if (!CONFIG.ENABLE_RAYCAST) {
    return null;
  }
  const ray = screenToWorldRay(mouseX, mouseY, canvasWidth, canvasHeight, viewMatrix, projectionMatrix);
      return performRaycast(ecs, ray.origin, ray.direction, maxDistance);
}; 