@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  // Create a fullscreen triangle using vertex index
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(-1.0,  3.0),
    vec2f( 3.0, -1.0)
  );
  
  return vec4f(pos[vertexIndex], 0.0, 1.0);
} 