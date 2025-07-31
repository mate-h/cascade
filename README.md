<img src="./public/cascade-logo.svg" alt="Cascade Engine Logo" width="100" height="100" />

# Cascade Engine

A modern 3D web application built with **WebGPU**, **Entity Component System (ECS)** architecture, and **Svelte 5**. Features a functional programming approach with real-time 3D rendering, orbit controls, and an interactive ECS entity inspector.

## Features

- 🎮 **Real-time 3D Rendering** - WebGPU-powered graphics with depth testing and lighting
- 🏗️ **ECS Architecture** - Clean separation of data (components) and logic (systems)
- 🎯 **Orbit Controls** - Mouse-driven camera controls (drag to rotate, scroll to zoom)
- 🔍 **Entity Inspector** - Collapsible panel showing ECS structure with entity selection
- 🖼️ **Render Graph** - Node-based system orchestrating GPU compute and render passes
- 🌧️ **Procedural Erosion** - GPU-accelerated terrain erosion simulation
- 🌟 **Physically Based Rendering** - PBR materials with metallic-roughness workflow
- 🌍 **Image Based Lighting** - HDR environment maps for realistic reflections and ambient lighting
- ☁️ **Volumetric Rendering** - Raymarching-based fog, clouds, and atmospheric effects
- ⚡ **Functional Programming** - Pure functions, immutable patterns, and closures
- 🔄 **Hot Module Reload** - Development-friendly with proper resource cleanup
- 🎨 **Modern UI** - Dark theme with Cascade Mono typography and UnoCSS styling

## Demo Scene

The application displays:
- A colorful floating cube with different colored faces
- A wireframe grid ground plane
- Interactive orbit camera controls
- Real-time ECS entity/component visualization
- PBR materials with realistic lighting and reflections
- Atmospheric volumetric effects using raymarching
- HDR environment-based lighting for enhanced realism

## Tech Stack

### Core Technologies
- **[Svelte 5](https://svelte.dev/)** - UI framework with runes syntax
- **[WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)** - Modern graphics API
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience

### Graphics & Math
- **[wgpu-matrix](https://github.com/greggman/wgpu-matrix)** - WebGPU-optimized matrix operations
- **WGSL** - WebGPU Shading Language for vertex/fragment shaders
- **PBR Materials** - Physically based rendering with metallic-roughness workflow
- **HDR Environment Maps** - High dynamic range lighting for realistic reflections
- **Raymarching** - GPU-accelerated volumetric rendering for atmospheric effects

### Styling & Build
- **[UnoCSS](https://unocss.dev/)** - Utility-first CSS with Tailwind preset
- **[Vite](https://vitejs.dev/)** - Fast build tool with HMR support
- **[pnpm](https://pnpm.io/)** - Efficient package manager

## Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) or npm/yarn
- **Modern Browser** with WebGPU support:
  - Chrome/Edge 113+
  - Firefox with WebGPU enabled
  - Safari Technology Preview

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cascade
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### 4. Interact with the Scene

- **Mouse drag** - Rotate camera around the scene
- **Mouse wheel** - Zoom in/out
- **Toggle button** (top-left) - Show/hide ECS inspector panel
- **Click entities** in the panel to select and highlight dependencies

## Build Commands

### Development
```bash
pnpm dev          # Start development server with HMR
```

### Production Build
```bash
pnpm build        # Build for production
pnpm preview      # Preview production build locally
```

### Type Checking
```bash
pnpm exec tsc --noEmit       # Strict compile-time type checking
```

## Project Structure

```
├── docs/
│   └── styleguide.md      # Comprehensive style guide
├── public/                # Static assets
├── src/
│   ├── components/        # Svelte UI components
│   │   ├── CanvasPanel.svelte
│   │   ├── ECSPanel.svelte
│   │   ├── PropertiesPanel.svelte
│   │   ├── FloatingText.svelte
│   │   ├── EntityCard.svelte
│   │   ├── ComponentCard.svelte
│   │   ├── PropertyEditor.svelte
│   │   ├── BooleanEditor.svelte
│   │   ├── NumberEditor.svelte
│   │   └── StringEditor.svelte
│   ├── ecs/              # Entity Component System
│   │   ├── components.ts  # Component definitions
│   │   ├── systems/       # System implementations
│   │   └── types.ts       # ECS types
│   ├── gpu/              # WebGPU utilities
│   ├── shaders/          # WGSL shader files
│   ├── utils/            # Helper functions
│   ├── app.ts            # Main application logic
│   ├── main.ts           # Entry point
│   └── scene.ts          # 3D scene setup
├── package.json
└── README.md
```

## Architecture Overview

The application follows a **functional ECS architecture**:

- **Entities** - Unique IDs representing objects in the scene
- **Components** - Pure data containers (Transform, Mesh, Camera, etc.)
- **Systems** - Pure functions that process components (Render, OrbitControls, etc.)

### Key Systems

- **`render3DSystem`** - Forward rendering pipeline for scene geometry
- **`orbitControlsSystem`** - Mouse-based camera controls
- **`renderGraphSystem`** - Modular render graph orchestrating compute & render passes
- **`erosionSystem`** - Procedural terrain erosion simulation example
- **`pbrSystem`** - Physically based rendering with material management
- **`iblSystem`** - Image based lighting with environment map processing
- **`volumetricSystem`** - Raymarching-based atmospheric and volumetric effects

### WebGPU Integration

- Minimal device initialization focused on ECS integration
- Proper resource cleanup for development (HMR-safe)
- Error handling and recovery for device loss scenarios

## Development Guidelines

This project follows strict **functional programming** and **ECS patterns**. Please refer to the comprehensive style guide for detailed conventions:

**📖 [Style Guide](./docs/styleguide.md)**

Key principles:
- Functional programming over classes
- Pure functions and immutable data
- Proper resource cleanup
- ECS architecture consistency
- TypeScript strict mode

## Browser Compatibility

### WebGPU Support Status

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 113+ | ✅ Stable | Full support |
| Edge 113+ | ✅ Stable | Full support |
| Firefox | 🔄 Experimental | Enable `dom.webgpu.enabled` in `about:config` |
| Safari | 🔄 Preview | Safari Technology Preview only |

### Enabling WebGPU in Firefox

1. Open `about:config`
2. Search for `dom.webgpu.enabled`
3. Set to `true`
4. Restart Firefox

## Troubleshooting

### Common Issues

**"WebGPU not supported" Error**
- Ensure you're using a compatible browser version
- Check if WebGPU is enabled in browser settings

**HMR Errors in Development**
- The app includes proper cleanup for Hot Module Reload
- If you see WebGPU device errors, refresh the page

**Performance Issues**
- WebGPU requires a discrete GPU for optimal performance
- Integrated graphics may have limited performance

### Development Tips

- Use browser DevTools to monitor WebGPU resource usage
- The ECS inspector helps debug entity/component relationships
- Console logs provide detailed initialization and error information

## Contributing

1. Follow the [Style Guide](./docs/styleguide.md) for coding conventions
2. Maintain functional programming patterns
3. Ensure proper resource cleanup in new systems
4. Test HMR scenarios during development
5. Use TypeScript strictly (no `any` types)

## License

[Add your license here]

---

**Happy coding! 🚀**

For detailed development patterns and conventions, see the [Style Guide](./docs/styleguide.md). 