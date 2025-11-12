/**
 * 🎨 UX/UI Optimization Demo
 * 
 * File này demo các cải tiến về menu visibility
 * Uncomment các section để test từng feature
 */

import { useLayoutContext } from '@/context/useLayoutContext'
import { Button, Stack, Typography, Box, Paper } from '@mui/material'

const MenuOptimizationDemo = () => {
  const {
    menu: { size, theme },
    changeMenu: { size: changeMenuSize, theme: changeMenuTheme },
  } = useLayoutContext()

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🎨 Menu UX/UI Optimization Demo
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Menu State
        </Typography>
        <Typography>
          <strong>Size:</strong> {size}
        </Typography>
        <Typography>
          <strong>Theme:</strong> {theme}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Test Menu Sizes
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant={size === 'default' ? 'contained' : 'outlined'}
            onClick={() => changeMenuSize('default')}
          >
            Default (Full Width) ✨
          </Button>
          <Button
            variant={size === 'sm-hover' ? 'contained' : 'outlined'}
            onClick={() => changeMenuSize('sm-hover')}
          >
            Small Hover
          </Button>
          <Button
            variant={size === 'sm-hover-active' ? 'contained' : 'outlined'}
            onClick={() => changeMenuSize('sm-hover-active')}
          >
            Small Hover Active
          </Button>
          <Button
            variant={size === 'condensed' ? 'contained' : 'outlined'}
            onClick={() => changeMenuSize('condensed')}
          >
            Condensed
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎨 Test Menu Themes
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant={theme === 'light' ? 'contained' : 'outlined'}
            onClick={() => changeMenuTheme('light')}
          >
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'contained' : 'outlined'}
            onClick={() => changeMenuTheme('dark')}
          >
            Dark
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          ✅ New Features
        </Typography>
        <ul>
          <li>Menu luôn hiển thị đầy đủ (default: 'default' size)</li>
          <li>Toggle button ở góc phải sidebar để thu nhỏ/mở rộng</li>
          <li>Smooth transitions với cubic-bezier easing</li>
          <li>Enhanced hover effects với shimmer animation</li>
          <li>Custom scrollbar 6px với hover effect</li>
          <li>Active state với gradient background</li>
          <li>Responsive: Hidden on mobile, visible on desktop</li>
          <li>Accessibility: Focus-visible, ARIA labels</li>
          <li>Dark mode optimization</li>
          <li>Print-friendly: Auto hide on print</li>
        </ul>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          📱 Responsive Breakpoints
        </Typography>
        <Typography>
          <strong>Desktop (≥992px):</strong> Menu visible, toggle available
        </Typography>
        <Typography>
          <strong>Tablet/Mobile (&lt;992px):</strong> Menu hidden, hamburger icon
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          💡 Tips
        </Typography>
        <ul>
          <li>Click toggle button (→/←) ở góc phải menu để test</li>
          <li>Hover vào menu items để xem animations</li>
          <li>Resize window để test responsive</li>
          <li>Enable dark mode để test dark theme</li>
          <li>Try keyboard navigation (Tab key)</li>
        </ul>
      </Paper>
    </Box>
  )
}

export default MenuOptimizationDemo
