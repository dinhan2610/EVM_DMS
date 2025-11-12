import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'

import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import { AuthProvider } from '@/context/useAuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import type { ChildrenType } from '@/types/component-props'
import { HelmetProvider } from 'react-helmet-async'

const handleChangeTitle = () => {
  if (document.visibilityState == 'hidden') document.title = 'Please come back 🥺'
  else document.title = DEFAULT_PAGE_TITLE
}

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  useEffect(() => {
    document.addEventListener('visibilitychange', handleChangeTitle)
    return () => {
      document.removeEventListener('visibilitychange', handleChangeTitle)
    }
  }, [])

  return (
    <HelmetProvider>
      <AuthProvider>
        <LayoutProvider>
          <NotificationProvider>
            {children}
            <ToastContainer 
              position="top-left" 
              autoClose={3000} 
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              icon={false}
            />
          </NotificationProvider>
        </LayoutProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}
export default AppProvidersWrapper
