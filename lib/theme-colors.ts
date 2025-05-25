/**
 * Utility functions to get theme colors from CSS variables
 * This allows canvas rendering to use the same professional color scheme
 */

/**
 * Get color from CSS variable
 */
function getCSSColor(variable: string): string {
  if (typeof window === 'undefined') return '#110043' // SSR fallback
  
  const root = document.documentElement
  const value = getComputedStyle(root).getPropertyValue(variable).trim()
  
  if (value.startsWith('hsl(')) {
    return value
  }
  
  // Convert HSL values to proper HSL string
  if (value) {
    return `hsl(${value})`
  }
  
  return '#110043' // Fallback
}

/**
 * Professional color palette following the design system
 */
export const themeColors = {
  // Primary colors
  darkNavy: '#110043',
  lightGray: '#f1f5f9', 
  electricBlue: '#3700ff',
  cyanAccent: '#42eedc',
  neutralGray: '#d4d4d8',
  successGreen: '#a2ff00',
  dangerRed: '#ff3f19',
  
  // Dynamic colors that adapt to theme
  background: () => getCSSColor('--background'),
  foreground: () => getCSSColor('--foreground'),
  primary: () => getCSSColor('--primary'),
  accent: () => getCSSColor('--accent'),
  destructive: () => getCSSColor('--destructive'),
  success: () => getCSSColor('--success'),
  
  // Canvas-specific colors with better contrast
  canvas: {
    // Background gradients for different map styles
    standard: {
      start: '#0c0030',
      end: '#1a0063'
    },
    satellite: {
      start: '#0f172a',
      end: '#1e293b'  
    },
    terrain: {
      start: '#064e3b',
      end: '#065f46'
    },
    
    // Route colors based on algorithm
    routes: {
      nearestNeighbor: {
        start: '#3700ff',
        middle: '#42eedc', 
        end: '#a2ff00'
      },
      genetic: {
        start: '#7928CA',
        middle: '#FF0080',
        end: '#FF4D4D'
      },
      twoOpt: {
        start: '#004D40',
        middle: '#00BFA5',
        end: '#64FFDA'
      },
      aStar: {
        start: '#1A237E',
        middle: '#3D5AFE', 
        end: '#8C9EFF'
      }
    },
    
    // Point colors
    points: {
      start: {
        light: '#c4ff65',
        dark: '#a2ff00'
      },
      end: {
        light: '#ff6347',
        dark: '#ff3f19'
      },
      waypoint: {
        light: '#7df9e9',
        dark: '#42eedc'
      },
      selected: {
        light: '#ffffff',
        dark: '#f1f5f9'
      },
      hovered: {
        light: '#ff6347',
        dark: '#ff3f19'
      }
    },
    
    // UI elements
    compass: {
      background: '#110043',
      accent: '#42eedc',
      text: '#f1f5f9'
    },
    
    scale: {
      gradient: {
        start: '#3700ff',
        middle: '#42eedc',
        end: '#a2ff00'
      },
      text: '#f1f5f9'
    },
    
    // Text and borders
    text: '#f1f5f9',
    textDark: '#110043',
    border: '#42eedc',
    glow: '#42eedc'
  }
}

/**
 * Get route color scheme based on optimization method
 */
export function getRouteColorScheme(method: string) {
  switch (method) {
    case 'nearest-neighbor':
      return themeColors.canvas.routes.nearestNeighbor
    case 'genetic-algorithm':
      return themeColors.canvas.routes.genetic
    case '2-opt':
      return themeColors.canvas.routes.twoOpt
    case 'a-star':
      return themeColors.canvas.routes.aStar
    default:
      return themeColors.canvas.routes.nearestNeighbor
  }
}

/**
 * Convert HSL to hex for canvas compatibility
 */
export function hslToHex(hsl: string): string {
  if (hsl.startsWith('#')) return hsl
  
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return '#110043'
  
  const h = parseInt(match[1])
  const s = parseInt(match[2]) / 100
  const l = parseInt(match[3]) / 100
  
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  
  let r = 0, g = 0, b = 0
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }
  
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
