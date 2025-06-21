import type { WebGPUState, RenderLoopController } from './types';

// Compute pass function with ping-pong
export const runComputePass = (state: WebGPUState): void => {
    const commandEncoder = state.device.createCommandEncoder({
        label: 'Compute Commands',
    });

    const computePass = commandEncoder.beginComputePass({
        label: 'Compute Pass',
    });

    computePass.setPipeline(state.computePipeline);
    
    // Alternate between bind groups for ping-pong effect
    const bindGroup = (state.currentFrame % 2 === 0) ? state.computeBindGroupA : state.computeBindGroupB;
    computePass.setBindGroup(0, bindGroup);
    
    // Dispatch compute shader with workgroups covering the texture
    const workgroupsX = Math.ceil(state.textureWidth / 8);
    const workgroupsY = Math.ceil(state.textureHeight / 8);
    computePass.dispatchWorkgroups(workgroupsX, workgroupsY);
    
    computePass.end();

    state.device.queue.submit([commandEncoder.finish()]);
};

// Render function
export const render = (state: WebGPUState): void => {
    const commandEncoder = state.device.createCommandEncoder({
        label: 'Render Commands',
    });

    const renderPass = commandEncoder.beginRenderPass({
        label: 'Fullscreen Render Pass',
        colorAttachments: [{
            view: state.context.getCurrentTexture().createView(),
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });

    renderPass.setPipeline(state.renderPipeline);
    renderPass.setBindGroup(0, state.renderBindGroup);
    renderPass.draw(3); // Draw the fullscreen triangle
    renderPass.end();

    state.device.queue.submit([commandEncoder.finish()]);
};

// Create a render loop function with frame counting
export const createRenderLoop = (initialState: WebGPUState): RenderLoopController => {
    let state = initialState;
    
    const loop = () => {
        // Run compute pass first
        runComputePass(state);
        
        // Then render
        render(state);
        
        // Increment frame counter for ping-pong
        state.currentFrame++;
        
        requestAnimationFrame(loop);
    };
    
    return { 
        loop, 
        getState: () => state, 
        setState: (newState: WebGPUState) => { state = newState; } 
    };
}; 