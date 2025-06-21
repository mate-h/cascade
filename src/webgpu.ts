import vertexShaderSource from './shaders/vertex.wgsl?raw';
import fragmentShaderSource from './shaders/fragment.wgsl?raw';

// Types for our WebGPU state
export interface WebGPUState {
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    device: GPUDevice;
    renderPipeline: GPURenderPipeline;
}

// Initialize WebGPU context and return the canvas context
export const initializeCanvas = (canvas: HTMLCanvasElement): GPUCanvasContext => {
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    
    if (!context) {
        throw new Error('WebGPU not supported in this browser');
    }
    
    return context;
};

// Request WebGPU adapter and device
export const initializeDevice = async (): Promise<GPUDevice> => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error('No appropriate GPUAdapter found');
    }

    return await adapter.requestDevice();
};

// Configure canvas context with device
export const configureContext = (context: GPUCanvasContext, device: GPUDevice): void => {
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: canvasFormat,
    });
};

// Create shader modules
export const createShaderModules = (device: GPUDevice) => {
    const vertexShaderModule = device.createShaderModule({
        label: 'Vertex Shader',
        code: vertexShaderSource,
    });

    const fragmentShaderModule = device.createShaderModule({
        label: 'Fragment Shader',
        code: fragmentShaderSource,
    });

    return { vertexShaderModule, fragmentShaderModule };
};

// Create render pipeline
export const createRenderPipeline = (
    device: GPUDevice,
    vertexShaderModule: GPUShaderModule,
    fragmentShaderModule: GPUShaderModule
): GPURenderPipeline => {
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    
    return device.createRenderPipeline({
        label: 'Fullscreen Shader Pipeline',
        layout: 'auto',
        vertex: {
            module: vertexShaderModule,
            entryPoint: 'vs_main',
        },
        fragment: {
            module: fragmentShaderModule,
            entryPoint: 'fs_main',
            targets: [{
                format: canvasFormat,
            }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });
};

// Initialize complete WebGPU state
export const initializeWebGPU = async (canvas: HTMLCanvasElement): Promise<WebGPUState> => {
    const context = initializeCanvas(canvas);
    const device = await initializeDevice();
    
    configureContext(context, device);
    
    const { vertexShaderModule, fragmentShaderModule } = createShaderModules(device);
    const renderPipeline = createRenderPipeline(device, vertexShaderModule, fragmentShaderModule);

    return {
        canvas,
        context,
        device,
        renderPipeline,
    };
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
    renderPass.draw(3); // Draw the fullscreen triangle
    renderPass.end();

    state.device.queue.submit([commandEncoder.finish()]);
};

// Resize canvas
export const resizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number): void => {
    canvas.width = width;
    canvas.height = height;
};

// Create a render loop function
export const createRenderLoop = (state: WebGPUState) => {
    const loop = () => {
        render(state);
        requestAnimationFrame(loop);
    };
    return loop;
}; 