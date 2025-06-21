@group(0) @binding(0) var compute_texture: texture_2d<f32>;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  // Get texture dimensions and convert coordinates to integers
  let texture_size = textureDimensions(compute_texture);
  let texel_coord = vec2i(fragCoord.xy);
  
  // Load directly from the compute texture (no filtering for RGBA32Float)
  let sampled_color = textureLoad(compute_texture, texel_coord, 0);
  
  // Visualize the heightmap data
  let height = sampled_color.r;
  let water = sampled_color.g;
  
  // Create a terrain-like visualization
  let terrain_color = vec3f(
    height * 0.8 + 0.2,
    height * 0.6 + water * 0.4,
    height * 0.4 + water * 0.8
  );
  
  return vec4f(terrain_color, 1.0);
} 