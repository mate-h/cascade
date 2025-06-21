import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
  ],
  theme: {
    fontFamily: {
      mono: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, monospace',
    },
    colors: {
      dark: {
        bg: '#1a1a1a',
        panel: '#2a2a2a',
        component: '#333',
        border: '#444',
      },
      entity: {
        primary: '#4a9eff',
        secondary: '#ff9f40',
        success: '#60d394',
        warning: '#f39c12',
        highlight: '#ffff00',
      }
    }
  },
  shortcuts: {
    'panel-bg': 'bg-dark-bg text-gray-200',
    'entity-card': 'bg-dark-panel rounded border-l-3 border-entity-primary p-2 mb-3 transition-all duration-300',
    'entity-highlighted': 'bg-yellow-900/20 border-entity-highlight shadow-yellow-400/30 shadow-lg transform scale-[1.02]',
    'component-card': 'bg-dark-component rounded-sm border-l-2 border-entity-secondary p-1 ml-4 mb-1',
    'entity-ref': 'text-entity-primary cursor-pointer underline decoration-dotted transition-all duration-200 px-1 py-0.5 rounded-sm hover:bg-entity-primary/20 hover:text-blue-300 hover:decoration-solid hover:shadow-sm active:bg-entity-primary/40 active:scale-95 active:shadow-md',
    'btn': 'bg-blue-500 text-white border-none px-4 py-2 rounded-md font-mono text-[12px] font-medium cursor-pointer transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center hover:bg-blue-600 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
  }
}) 