import { ToastContainer } from 'react-toastify'

import { AuthProvider } from '@/context/useAuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import type { ChildrenType } from '@/types/component-props'
import { HelmetProvider } from 'react-helmet-async'

/**
 * AppProvidersWrapper
 * 
 * Wrap toàn bộ app với các providers cần thiết.
 * Note: Title management được xử lý bởi usePageTitle hook trong từng page component.
 */
const AppProvidersWrapper = ({ children }: ChildrenType) => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <LayoutProvider>
          <NotificationProvider>
            {children}
            <ToastContainer theme="colored" />
          </NotificationProvider>
        </LayoutProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}
export default AppProvidersWrapper
