import { ToastContainer } from 'react-toastify'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useEffect } from 'react'

import { AuthProvider, useAuthContext } from '@/context/useAuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { appTheme } from '@/theme/muiTheme'
import type { ChildrenType } from '@/types/component-props'
import { HelmetProvider } from 'react-helmet-async'
import { signalRService } from '@/services/signalrService'

/**
 * SignalR Initializer Component
 * Khởi tạo SignalR connection khi user đã authenticated
 */
const SignalRInitializer = () => {
  const { isAuthenticated } = useAuthContext()

  useEffect(() => {
    if (isAuthenticated) {
      // Khởi tạo SignalR connection sau khi login
      console.log('🔵 [App] User authenticated, initializing SignalR...')
      signalRService.initialize().catch((error) => {
        console.error('❌ [App] Failed to initialize SignalR:', error)
      })
    } else {
      // Disconnect khi logout
      console.log('🔴 [App] User logged out, disconnecting SignalR...')
      signalRService.disconnect().catch(console.error)
    }

    // Cleanup on unmount
    return () => {
      signalRService.disconnect().catch(console.error)
    }
  }, [isAuthenticated])

  return null
}

/**
 * AppProvidersWrapper
 * 
 * Wrap toàn bộ app với các providers cần thiết.
 * - HelmetProvider: Quản lý document head
 * - AuthProvider: Quản lý authentication
 * - LayoutProvider: Quản lý layout settings (Bootstrap theme)
 * - ThemeProvider: Quản lý MUI theme (Material-UI)
 * - NotificationProvider: Quản lý notifications
 * 
 * Note: Title management được xử lý bởi usePageTitle hook trong từng page component.
 */
const AppProvidersWrapper = ({ children }: ChildrenType) => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SignalRInitializer />
        <LayoutProvider>
          <NotificationProvider>
            <ThemeProvider theme={appTheme}>
              <CssBaseline />
              {children}
              <ToastContainer theme="colored" />
            </ThemeProvider>
          </NotificationProvider>
        </LayoutProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}
export default AppProvidersWrapper
