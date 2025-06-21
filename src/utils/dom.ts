// Display error messages in the DOM
export const showError = (title: string, message: string): void => {
  document.body.innerHTML = /*html*/ `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
                <h1>${title}</h1>
                <p>${message}</p>
            </div>
        </div>
    `;
};

// Check WebGPU browser support
export const checkWebGPUSupport = (): boolean => {
  return !!navigator.gpu;
};

// Get canvas element from DOM
export const getCanvasElement = (): HTMLCanvasElement | null => {
  return document.querySelector<HTMLCanvasElement>("#canvas");
};

// Set canvas to fullscreen size
export const setCanvasSize = (canvas: HTMLCanvasElement): void => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
