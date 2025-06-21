export interface Vertex {
  position: [number, number, number];
  normal: [number, number, number];
  color: [number, number, number];
}

export interface Mesh {
  vertices: Vertex[];
  indices: number[];
}

export const createCube = (size: number = 1.0): Mesh => {
  const half = size / 2;
  const vertices: Vertex[] = [
    // Front face (red)
    { position: [-half, -half,  half], normal: [0, 0, 1], color: [1, 0.2, 0.2] },
    { position: [ half, -half,  half], normal: [0, 0, 1], color: [1, 0.2, 0.2] },
    { position: [ half,  half,  half], normal: [0, 0, 1], color: [1, 0.2, 0.2] },
    { position: [-half,  half,  half], normal: [0, 0, 1], color: [1, 0.2, 0.2] },

    // Back face (green)
    { position: [-half, -half, -half], normal: [0, 0, -1], color: [0.2, 1, 0.2] },
    { position: [-half,  half, -half], normal: [0, 0, -1], color: [0.2, 1, 0.2] },
    { position: [ half,  half, -half], normal: [0, 0, -1], color: [0.2, 1, 0.2] },
    { position: [ half, -half, -half], normal: [0, 0, -1], color: [0.2, 1, 0.2] },

    // Left face (blue)
    { position: [-half, -half, -half], normal: [-1, 0, 0], color: [0.2, 0.2, 1] },
    { position: [-half, -half,  half], normal: [-1, 0, 0], color: [0.2, 0.2, 1] },
    { position: [-half,  half,  half], normal: [-1, 0, 0], color: [0.2, 0.2, 1] },
    { position: [-half,  half, -half], normal: [-1, 0, 0], color: [0.2, 0.2, 1] },

    // Right face (yellow)
    { position: [ half, -half, -half], normal: [1, 0, 0], color: [1, 1, 0.2] },
    { position: [ half,  half, -half], normal: [1, 0, 0], color: [1, 1, 0.2] },
    { position: [ half,  half,  half], normal: [1, 0, 0], color: [1, 1, 0.2] },
    { position: [ half, -half,  half], normal: [1, 0, 0], color: [1, 1, 0.2] },

    // Top face (magenta)
    { position: [-half,  half, -half], normal: [0, 1, 0], color: [1, 0.2, 1] },
    { position: [-half,  half,  half], normal: [0, 1, 0], color: [1, 0.2, 1] },
    { position: [ half,  half,  half], normal: [0, 1, 0], color: [1, 0.2, 1] },
    { position: [ half,  half, -half], normal: [0, 1, 0], color: [1, 0.2, 1] },

    // Bottom face (cyan)
    { position: [-half, -half, -half], normal: [0, -1, 0], color: [0.2, 1, 1] },
    { position: [ half, -half, -half], normal: [0, -1, 0], color: [0.2, 1, 1] },
    { position: [ half, -half,  half], normal: [0, -1, 0], color: [0.2, 1, 1] },
    { position: [-half, -half,  half], normal: [0, -1, 0], color: [0.2, 1, 1] },
  ];

  const indices = [
    0,  1,  2,    0,  2,  3,    // front
    4,  5,  6,    4,  6,  7,    // back
    8,  9,  10,   8,  10, 11,   // left
    12, 13, 14,   12, 14, 15,   // right
    16, 17, 18,   16, 18, 19,   // top
    20, 21, 22,   20, 22, 23,   // bottom
  ];

  return { vertices, indices };
};

export const createGrid = (size: number = 10, divisions: number = 10): Mesh => {
  const vertices: Vertex[] = [];
  const indices: number[] = [];
  
  const step = size / divisions;
  const halfSize = size / 2;
  
  // Create grid lines in X direction
  for (let i = 0; i <= divisions; i++) {
    const x = -halfSize + i * step;
    const color: [number, number, number] = i === divisions / 2 ? [0.8, 0.2, 0.2] : [0.5, 0.5, 0.5]; // Red center line
    
    vertices.push(
      { position: [x, 0, -halfSize], normal: [0, 1, 0], color },
      { position: [x, 0,  halfSize], normal: [0, 1, 0], color }
    );
    
    const baseIndex = vertices.length - 2;
    indices.push(baseIndex, baseIndex + 1);
  }
  
  // Create grid lines in Z direction
  for (let i = 0; i <= divisions; i++) {
    const z = -halfSize + i * step;
    const color: [number, number, number] = i === divisions / 2 ? [0.2, 0.2, 0.8] : [0.5, 0.5, 0.5]; // Blue center line
    
    vertices.push(
      { position: [-halfSize, 0, z], normal: [0, 1, 0], color },
      { position: [ halfSize, 0, z], normal: [0, 1, 0], color }
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