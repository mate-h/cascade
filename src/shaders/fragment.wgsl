@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  // Normalize screen coordinates
  let resolution = vec2f(800.0, 600.0); // Will be updated from uniform later
  let uv = fragCoord.xy / resolution;
  
  // Create a simple gradient effect
  let color = vec3f(uv.x, uv.y, 0.5 + 0.5 * sin(uv.x * 10.0));
  
  return vec4f(uv.xy, 0.0, 1.0);
} 