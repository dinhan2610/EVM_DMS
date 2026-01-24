import { ToastContainer } from 'react-toastify'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { AuthProvider } from '@/context/useAuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { appTheme } from '@/theme/muiTheme'
import type { ChildrenType } from '@/types/component-props'
import { HelmetProvider } from 'react-helmet-async'

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
