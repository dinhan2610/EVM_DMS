import type { UserType } from '@/types/auth'
import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next'
import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChildrenType } from '../types/component-props'
import authService from '@/services/authService'

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

  const getSession = (): UserType | undefined => {
    const fetchedCookie = getCookie(authSessionKey)?.toString()
    return fetchedCookie ? JSON.parse(fetchedCookie) : undefined
  }

  const [user, setUser] = useState<UserType | undefined>(getSession())

  const saveSession = (user: UserType) => {
    setCookie(authSessionKey, JSON.stringify(user))
    setUser(user)
    if (user.token) {
      localStorage.setItem('eims_access_token', user.token)
      if (user.refreshToken) {
        localStorage.setItem('eims_refresh_token', user.refreshToken)
      }
    }
  }

  // Check if both cookie and localStorage token exist
  const checkAuthentication = (): boolean => {
    return hasCookie(authSessionKey) && !!localStorage.getItem('eims_access_token')
  }

  const removeSession = () => {
    deleteCookie(authSessionKey)
    authService.clearAuthData()
    setUser(undefined)
    navigate('/auth/sign-in')
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error (continuing anyway):', error)
    } finally {
      removeSession()
    }
  }

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
