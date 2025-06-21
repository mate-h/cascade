import './style.css'
import { initializeWebGPU, createRenderLoop, resizeCanvas } from './webgpu'

const showError = (title: string, message: string) => {
    document.body.innerHTML = /*html*/`
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
                <h1>${title}</h1>
                <p>${message}</p>
            </div>
        </div>
    `
}

const checkWebGPUSupport = (): boolean => {
    return !!(navigator.gpu)
}

const getCanvasElement = (): HTMLCanvasElement | null => {
    return document.querySelector<HTMLCanvasElement>('#canvas')
}

const setupResizeHandler = (canvas: HTMLCanvasElement) => {
    const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        resizeCanvas(canvas, width, height)
    }

    // Initial resize
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return handleResize
}

async function main() {
    // Check WebGPU support
    if (!checkWebGPUSupport()) {
        showError(
            'WebGPU Not Supported',
            'Your browser doesn\'t support WebGPU. Please use Chrome/Edge 113+ or Firefox with WebGPU enabled.'
        )
        return
    }

    // Get canvas element
    const canvas = getCanvasElement()
    if (!canvas) {
        showError('Canvas Not Found', 'Canvas element not found')
        return
    }

    try {
        // Initialize WebGPU
        const webgpuState = await initializeWebGPU(canvas)
        
        // Setup resize handling
        setupResizeHandler(canvas)
        
        // Start render loop
        const renderLoop = createRenderLoop(webgpuState)
        renderLoop()
        
        console.log('WebGPU initialized successfully!')
    } catch (error) {
        console.error('Failed to initialize WebGPU:', error)
        showError('WebGPU Initialization Failed', `Error: ${error}`)
    }
}

main()
