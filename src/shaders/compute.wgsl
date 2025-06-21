@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var output_texture: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) global_id: vec3u) {
    let texel_coord = vec2i(global_id.xy);
    let texture_size = textureDimensions(output_texture);
    
    // Bounds check
    if (texel_coord.x >= i32(texture_size.x) || texel_coord.y >= i32(texture_size.y)) {
        return;
    }
    
    // Normalize coordinates
    let uv = vec2f(texel_coord) / vec2f(texture_size);
    
    // Read current value from input texture
    let current_value = textureLoad(input_texture, texel_coord, 0);
    
    // Create some animated pattern
    let time = 0.0; // Will be passed as uniform later
    let wave1 = sin(uv.x * 10.0 + time) * 0.5 + 0.5;
    let wave2 = cos(uv.y * 8.0 + time * 0.7) * 0.5 + 0.5;
    let wave3 = sin(uv.x * 6.0 + uv.y * 4.0 + time * 1.2) * 0.5 + 0.5;
    let wave4 = cos(length(uv - 0.5) * 20.0 + time * 2.0) * 0.5 + 0.5;
    
    // Mix with previous value for temporal effects
    let new_value = vec4f(
        mix(current_value.r, wave1, 0.1),
        mix(current_value.g, wave2, 0.1),
        mix(current_value.b, wave3, 0.1),
        mix(current_value.a, wave4, 0.1)
    );
    
    // Write to output texture
    textureStore(output_texture, texel_coord, new_value);
} 