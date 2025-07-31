import { defineConfig, presetWind3 } from 'unocss'
import { presetIcons } from '@unocss/preset-icons'

// GitHub Dark theme colors extracted from the provided JSON5 data
const githubDarkColors = {
  // Base colors
  black: '#010409',
  white: '#ffffff',
  
  // Neutral scale (backgrounds, text, borders)
  neutral: {
    0: '#010409',   // black
    1: '#0D1117',   // darkest bg
    2: '#151B23',   // darker bg
    3: '#212830',   // dark bg
    4: '#262C36',   // medium dark bg
    5: '#2A313C',   // medium bg
    6: '#2F3742',   // lighter bg
    7: '#3D444D',   // border
    8: '#656C76',   // muted text
    9: '#9198A1',   // secondary text
    10: '#B7BDC8',  // primary text
    11: '#D1D7E0',  // bright text
    12: '#F0F6FC',  // brightest text
    13: '#ffffff',  // white
  },
  
  // Accent colors
  blue: {
    0: '#cae8ff',
    1: '#a5d6ff',
    2: '#79c0ff',
    3: '#58a6ff',
    4: '#388bfd',
    5: '#1f6feb',
    6: '#1158c7',
    7: '#0d419d',
    8: '#0c2d6b',
    9: '#051d4d',
  },
  
  green: {
    0: '#aff5b4',
    1: '#7ee787',
    2: '#56d364',
    3: '#3fb950',
    4: '#2ea043',
    5: '#238636',
    6: '#196c2e',
    7: '#0f5323',
    8: '#033a16',
    9: '#04260f',
  },
  
  red: {
    0: '#ffdcd7',
    1: '#ffc1ba',
    2: '#ffa198',
    3: '#ff7b72',
    4: '#f85149',
    5: '#da3633',
    6: '#b62324',
    7: '#8e1519',
    8: '#67060c',
    9: '#490202',
  },
  
  yellow: {
    0: '#f8e3a1',
    1: '#f2cc60',
    2: '#e3b341',
    3: '#d29922',
    4: '#bb8009',
    5: '#9e6a03',
    6: '#845306',
    7: '#693e00',
    8: '#4d2d00',
    9: '#3b2300',
  },
  
  purple: {
    0: '#eddeff',
    1: '#e2c5ff',
    2: '#d2a8ff',
    3: '#BE8FFF',
    4: '#AB7DF8',
    5: '#8957e5',
    6: '#6e40c9',
    7: '#553098',
    8: '#3c1e70',
    9: '#271052',
  },
  
  orange: {
    0: '#ffdfb6',
    1: '#ffc680',
    2: '#ffab40',
    3: '#fb8500',
    4: '#e16f24',
    5: '#bc4c00',
    6: '#a04100',
    7: '#762d0a',
    8: '#5a1e02',
    9: '#3d1300',
  },
}

export default defineConfig({
  presets: [
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWind3(),
  ],
  theme: {
    fontFamily: {
      mono: 'Cascade Mono',
    },
    colors: {
      // GitHub theme colors
      github: githubDarkColors,
      
      // Semantic color aliases for easier use
      bg: {
        primary: githubDarkColors.neutral[1],    // #0D1117
        secondary: githubDarkColors.neutral[2],  // #151B23
        tertiary: githubDarkColors.neutral[3],   // #212830
        elevated: githubDarkColors.neutral[4],   // #262C36
        panel: githubDarkColors.neutral[5],      // #2A313C
        overlay: githubDarkColors.neutral[6],    // #2F3742
      },
      
      border: {
        default: githubDarkColors.neutral[7],    // #3D444D
        muted: githubDarkColors.neutral[6],      // #2F3742
        subtle: githubDarkColors.neutral[5],     // #2A313C
      },
      
      text: {
        primary: githubDarkColors.neutral[10],   // #B7BDC8
        secondary: githubDarkColors.neutral[9],  // #9198A1
        muted: githubDarkColors.neutral[8],      // #656C76
        bright: githubDarkColors.neutral[11],    // #D1D7E0
        inverse: githubDarkColors.neutral[1],    // #0D1117
      },
      
      // Accent colors
      accent: {
        blue: githubDarkColors.blue[5],          // #1f6feb
        green: githubDarkColors.green[4],        // #2ea043
        red: githubDarkColors.red[4],            // #f85149
        yellow: githubDarkColors.yellow[3],      // #d29922
        purple: githubDarkColors.purple[5],      // #8957e5
        orange: githubDarkColors.orange[3],      // #fb8500
      },
      
      // Grid and rendering colors
      grid: {
        primary: githubDarkColors.neutral[8],    // #656C76 - subtle grid lines
        secondary: githubDarkColors.neutral[7],  // #3D444D - axis lines
        x: githubDarkColors.red[5],              // #da3633 - X axis
        z: githubDarkColors.blue[5],             // #1f6feb - Z axis
      },
    }
  },
  shortcuts: {
    // Updated shortcuts using GitHub theme
    'panel-bg': 'bg-bg-primary text-text-primary',
    'panel-secondary': 'bg-bg-secondary text-text-primary',
    'panel-elevated': 'bg-bg-elevated text-text-primary',
    
    'entity-card': 'bg-bg-panel rounded border-l-3 border-accent-blue p-2 mb-3 transition-all duration-300',
    'entity-selected': 'bg-accent-blue/10 border-accent-blue shadow-accent-blue/30 shadow-lg ring-1 ring-accent-blue/40',
    'entity-highlighted': 'bg-accent-yellow/10 border-accent-yellow shadow-accent-yellow/30 shadow-lg transform scale-[1.01]',
    
    'component-card': 'bg-bg-overlay rounded-sm border-l-2 border-accent-green p-1 ml-4 mb-1',
    
    'entity-ref': 'text-accent-blue cursor-pointer underline decoration-dotted transition-all duration-200 px-1 py-0.5 rounded-sm hover:bg-accent-blue/20 hover:text-github-blue-2 hover:decoration-solid hover:shadow-sm active:bg-accent-blue/40 active:scale-95 active:shadow-md',
    
    'btn': 'bg-accent-blue text-github-white border-none px-4 py-2 rounded-md font-mono cursor-pointer transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center hover:bg-github-blue-4 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    
    'btn-secondary': 'bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md font-mono cursor-pointer transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center hover:bg-bg-overlay hover:border-border-muted hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm',
  }
}) 