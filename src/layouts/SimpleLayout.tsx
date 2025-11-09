import { Suspense, type ReactNode } from 'react'
import { Box } from '@mui/material'
import Preloader from '@/components/Preloader'

interface SimpleLayoutProps {
  children: ReactNode
}

const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        overflow: 'auto',
      }}
    >
      <Suspense fallback={<Preloader />}>
        {children}
      </Suspense>
    </Box>
  )
}

export default SimpleLayout
