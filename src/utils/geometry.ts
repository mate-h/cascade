import { cube } from "primitive-geometry";
import { vec3, type Vec3 } from "wgpu-matrix";

export interface Vertex {
  position: Vec3;
  normal: Vec3;
  color: Vec3;
}

export interface Mesh {
  vertices: Vertex[];
  indices: number[];
}

export const createCube = (size: number = 1.0): Mesh => {
  // Generate geometry using primitive-geometry
  const g = cube({ sx: size, sy: size, sz: size });

  const positions = g.positions;
  const normals = g.normals;
  const cells = g.cells as Uint8Array | Uint16Array | Uint32Array;

  const vertices: Vertex[] = [];
  const defaultColor: [number, number, number] = [0.8, 0.8, 0.8];

  for (let i = 0; i < positions.length; i += 3) {
    const pos: [number, number, number] = [
      positions[i],
      positions[i + 1],
      positions[i + 2],
    ];
    const norm: [number, number, number] = normals
      ? [normals[i], normals[i + 1], normals[i + 2]]
      : [0, 0, 0];

    // Simple coloring based on normal direction (abs value gives nice RGB per face)
    const color: [number, number, number] = [
      Math.abs(norm[0]) || defaultColor[0],
      Math.abs(norm[1]) || defaultColor[1],
      Math.abs(norm[2]) || defaultColor[2],
    ];

    vertices.push({
      position: vec3.create(...pos),
      normal: vec3.create(...norm),
      color: vec3.create(...color),
    });
  }

  // Flatten index buffer to number[] for compatibility with rest of pipeline
  const indices: number[] = Array.from(cells as Iterable<number>);

  return { vertices, indices };
};

export const createGrid = (size: number = 10, divisions: number = 10): Mesh => {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  const step = size / divisions;
  const halfSize = size / 2;

  // GitHub theme colors for grid
  const gridColor: [number, number, number] = [0.396, 0.427, 0.471]; // #656C76 (neutral-8) converted to RGB
  const xAxisColor: [number, number, number] = [0.854, 0.212, 0.2]; // #da3633 (red-5) converted to RGB
  const zAxisColor: [number, number, number] = [0.122, 0.435, 0.922]; // #1f6feb (blue-5) converted to RGB

  // Create grid lines in X direction
  for (let i = 0; i <= divisions; i++) {
    const x = -halfSize + i * step;
    const color: [number, number, number] =
      i === divisions / 2 ? xAxisColor : gridColor; // X-axis line in red

    vertices.push(
      {
        position: vec3.create(x, 0, -halfSize),
        normal: vec3.create(0, 1, 0),
        color: vec3.create(...color),
      },
      {
        position: vec3.create(x, 0, halfSize),
        normal: vec3.create(0, 1, 0),
        color: vec3.create(...color),
      },
    );

    const baseIndex = vertices.length - 2;
    indices.push(baseIndex, baseIndex + 1);
  }

  // Create grid lines in Z direction
  for (let i = 0; i <= divisions; i++) {
    const z = -halfSize + i * step;
    const color: [number, number, number] =
      i === divisions / 2 ? zAxisColor : gridColor; // Z-axis line in blue

    vertices.push(
      {
        position: vec3.create(-halfSize, 0, z),
        normal: vec3.create(0, 1, 0),
        color: vec3.create(...color),
      },
      {
        position: vec3.create(halfSize, 0, z),
        normal: vec3.create(0, 1, 0),
        color: vec3.create(...color),
      },
    );

    const baseIndex = vertices.length - 2;
    indices.push(baseIndex, baseIndex + 1);
  }

  return { vertices, indices };
};

export const createVertexBuffer = (vertices: Vertex[]): Float32Array => {
  const buffer = new Float32Array(vertices.length * 9); // 3 pos + 3 normal + 3 color

  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    const offset = i * 9;

    // Position
    buffer[offset + 0] = vertex.position[0];
    buffer[offset + 1] = vertex.position[1];
    buffer[offset + 2] = vertex.position[2];

    // Normal
    buffer[offset + 3] = vertex.normal[0];
    buffer[offset + 4] = vertex.normal[1];
    buffer[offset + 5] = vertex.normal[2];

    // Color
    buffer[offset + 6] = vertex.color[0];
    buffer[offset + 7] = vertex.color[1];
    buffer[offset + 8] = vertex.color[2];
  }

  return buffer;
};
