struct Uniforms {
  view_projection: mat4x4f,
  view: mat4x4f,
  projection: mat4x4f,
  model: mat4x4f,
  camera_position: vec4f,
  time: f32,
}

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
}

struct VertexOutput {
  @builtin(position) clip_position: vec4f,
  @location(0) world_position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) view_position: vec3f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  // Apply model transformation to world position first
  let world_position = uniforms.model * vec4f(input.position, 1.0);
  output.world_position = world_position.xyz;
  output.clip_position = uniforms.view_projection * world_position;
  
  // Debug: Check if model matrix is identity
  // If model matrix is identity, world_position should equal input.position
  
  // Transform normal (simplified for now)
  output.normal = input.normal;
  
  output.color = input.color;
  
  // Calculate view space position for depth-based effects
  let view_position = uniforms.view * world_position;
  output.view_position = view_position.xyz;
  
  return output;
}