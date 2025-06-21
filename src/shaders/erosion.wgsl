@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var output_texture: texture_storage_2d<rgba32float, write>;

struct ErosionParams {
  rainRate: f32,
  evaporationRate: f32,
  sedimentCapacity: f32,
  minSlope: f32,
  gravity: f32,
  iterations: f32,
}

@group(0) @binding(2) var<uniform> params: ErosionParams;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) global_id: vec3u) {
  let texel_coord = vec2i(global_id.xy);
  let texture_size = textureDimensions(output_texture);
  
  if (texel_coord.x >= i32(texture_size.x) || texel_coord.y >= i32(texture_size.y)) {
    return;
  }
  
  let uv = vec2f(texel_coord) / vec2f(texture_size);
  let current = textureLoad(input_texture, texel_coord, 0);
  
  let height = current.r;
  let water = current.g;
  let velocity_x = current.b;
  let velocity_y = current.a;
  
  let new_water = water + params.rainRate;
  let evaporated_water = new_water * (1.0 - params.evaporationRate);
  
  let new_height = height + (new_water - evaporated_water) * 0.01;
  
  let result = vec4f(new_height, evaporated_water, velocity_x * 0.99, velocity_y * 0.99);
  textureStore(output_texture, texel_coord, result);
} 