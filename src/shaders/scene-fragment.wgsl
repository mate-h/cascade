struct Uniforms {
  view_projection: mat4x4f,
  view: mat4x4f,
  projection: mat4x4f,
  camera_position: vec3f,
  time: f32,
}

struct VertexOutput {
  @builtin(position) clip_position: vec4f,
  @location(0) world_position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) view_position: vec3f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  // Normalize the normal vector
  let normal = normalize(input.normal);
  
  // Simple directional lighting
  let light_dir = normalize(vec3f(1.0, 1.0, 1.0));
  let light_color = vec3f(1.0, 1.0, 1.0);
  let ambient = vec3f(0.2, 0.2, 0.2);
  
  // Calculate diffuse lighting
  let diffuse_strength = max(dot(normal, light_dir), 0.0);
  let diffuse = diffuse_strength * light_color;
  
  // Calculate specular lighting (Blinn-Phong)
  let view_dir = normalize(uniforms.camera_position - input.world_position);
  let halfway_dir = normalize(light_dir + view_dir);
  let spec_strength = pow(max(dot(normal, halfway_dir), 0.0), 32.0);
  let specular = spec_strength * light_color * 0.5;
  
  // Combine lighting with vertex color
  let final_color = (ambient + diffuse + specular) * input.color;
  
  // Add some fog based on distance from camera
  let distance = length(input.view_position);
  let fog_factor = exp(-distance * 0.02);
  let fog_color = vec3f(0.1, 0.1, 0.15);
  let color_with_fog = mix(fog_color, final_color, fog_factor);
  
  return vec4f(input.color, 1.0);
} 