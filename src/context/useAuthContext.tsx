import type { UserType } from '@/types/auth'
import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ChildrenType } from '../types/component-props'
import authService from '@/services/authService'
import { AUTH_EVENTS } from '@/helpers/httpClient'

export type AuthContextType = {
  user: UserType | undefined
  isAuthenticated: boolean
  saveSession: (session: UserType) => void
  removeSession: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

const authSessionKey = '_REBACK_AUTH_KEY_'

export function AuthProvider({ children }: ChildrenType) {
  const navigate = useNavigate()
  const location = useLocation()

  const getSession = (): UserType | undefined => {
    const fetchedCookie = getCookie(authSessionKey)?.toString()
    return fetchedCookie ? JSON.parse(fetchedCookie) : undefined
  }

  const [user, setUser] = useState<UserType | undefined>(getSession())

  const saveSession = (user: UserType) => {
    // Use accessToken if available, fallback to token for backward compatibility
    const tokenToSave = user.accessToken || user.token
    
    // Update user object to ensure token and accessToken are in sync
    const syncedUser = {
      ...user,
      token: tokenToSave,
      accessToken: tokenToSave
    }
    
    setCookie(authSessionKey, JSON.stringify(syncedUser))
    setUser(syncedUser)
    
    if (tokenToSave) {
      localStorage.setItem('eims_access_token', tokenToSave)
      if (user.refreshToken) {
        localStorage.setItem('eims_refresh_token', user.refreshToken)
      }
    }
  }

  // Check if both cookie and localStorage token exist
  const checkAuthentication = (): boolean => {
    return hasCookie(authSessionKey) && !!localStorage.getItem('eims_access_token')
  }

  const removeSession = useCallback(() => {
    deleteCookie(authSessionKey)
    authService.clearAuthData()
    setUser(undefined)
    
    // Only navigate if not already on sign-in page
    if (location.pathname !== '/auth/sign-in') {
      navigate('/auth/sign-in')
    }
  }, [navigate, location.pathname])

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error (continuing anyway):', error)
    } finally {
      removeSession()
    }
  }

  // 🔐 Listen for force logout events from httpClient (token expired)
  useEffect(() => {
    const handleForceLogout = (event: CustomEvent<{ reason?: string }>) => {
      console.log('🔐 [AuthContext] Received force logout event:', event.detail)
      
      // Clear React state
      deleteCookie(authSessionKey)
      setUser(undefined)
      
      // Note: httpClient already handles redirect, but we update React state
    }

    // Add event listener
    window.addEventListener(AUTH_EVENTS.FORCE_LOGOUT, handleForceLogout as EventListener)
    
    // Cleanup
    return () => {
      window.removeEventListener(AUTH_EVENTS.FORCE_LOGOUT, handleForceLogout as EventListener)
    }
  }, [])

  // 🔐 Check token validity on mount and when tab becomes visible
  useEffect(() => {
    const checkTokenValidity = () => {
      const hasToken = !!localStorage.getItem('eims_access_token')
      const hasCookieSession = hasCookie(authSessionKey)
      
      // If we have user state but no tokens → force logout state update
      if (user && (!hasToken || !hasCookieSession)) {
        console.log('🔐 [AuthContext] Token missing, clearing user state')
        setUser(undefined)
      }
    }

    // Check on mount
    checkTokenValidity()

    // Check when tab becomes visible (user came back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenValidity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: checkAuthentication(),
        saveSession,
        removeSession,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  )
}
