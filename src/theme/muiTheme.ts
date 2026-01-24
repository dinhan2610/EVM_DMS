import { createTheme } from '@mui/material/styles'

/**
 * MUI Theme cho dự án EIMS
 * Sync với Bootstrap theme variables
 * Chỉ support Light Mode
 */
export const createAppTheme = () => {
  return createTheme({
    palette: {
      mode: 'light',
      
      // Background colors
      background: {
        default: '#f5f5f5',    // Page background
        paper: '#ffffff',       // Card/Paper background
      },
      
      // Text colors
      text: {
        primary: '#1a1a1a',     // Main text
        secondary: '#666666',   // Secondary text
        disabled: '#9e9e9e',    // Disabled text
      },
      
      // Primary color (blue)
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#fff',
      },
      
      // Secondary color
      secondary: {
        main: '#dc004e',
        light: '#f73378',
        dark: '#9a0036',
        contrastText: '#fff',
      },
      
      // Success color (green)
      success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
        contrastText: '#fff',
      },
      
      // Warning color (orange)
      warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#fff',
      },
      
      // Error color (red)
      error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
        contrastText: '#fff',
      },
      
      // Info color
      info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#fff',
      },
      
      // Divider
      divider: '#e0e0e0',
      
      // Grey shades
      grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
    },
    
    // Typography
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 700,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.66,
      },
    },
    
    // Component overrides
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          },
        },
      },
      
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
    },
    
    // Spacing
    spacing: 8, // Base spacing unit (8px)
    
    // Shape
    shape: {
      borderRadius: 8,
    },
  })
}

export const appTheme = createAppTheme()
