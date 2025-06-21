@group(0) @binding(0) var compute_texture: texture_2d<f32>;
@group(0) @binding(1) var texture_sampler: sampler;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  // Get texture dimensions and normalize coordinates
  let texture_size = textureDimensions(compute_texture);
  let uv = fragCoord.xy / vec2f(texture_size);

  // Sample from the compute texture with linear filtering
  let sampled_color = textureSample(compute_texture, texture_sampler, uv);

  // Return the full RGBA channels
  return sampled_color;
} 