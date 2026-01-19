import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import API_CONFIG from '@/config/api.config'
import { deleteCookie } from 'cookies-next'

// Auth session cookie key (must match useAuthContext.tsx)
const AUTH_SESSION_KEY = '_REBACK_AUTH_KEY_'

// Event để thông báo cho AuthContext khi cần logout
export const AUTH_EVENTS = {
  TOKEN_EXPIRED: 'auth:token_expired',
  REFRESH_FAILED: 'auth:refresh_failed',
  FORCE_LOGOUT: 'auth:force_logout',
}

// Dispatch custom event khi cần logout
const dispatchAuthEvent = (eventName: string, detail?: unknown) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
  console.log(`🔐 [HttpClient] Dispatched event: ${eventName}`)
}

class HttpClient {
  private axiosInstance: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
  }> = []

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
    })
    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - Add access token to all requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => this.axiosInstance(originalRequest))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = localStorage.getItem(API_CONFIG.REFRESH_TOKEN_KEY)
            if (!refreshToken) {
              console.error('🔐 [HttpClient] No refresh token available - forcing logout')
              
              // Reject all queued requests
              this.failedQueue.forEach((promise) => 
                promise.reject(new Error('No refresh token'))
              )
              this.failedQueue = []
              
              // Force logout immediately
              this.forceLogout('Refresh token không tồn tại')
              
              throw new Error('No refresh token available')
            }

            // Call refresh token API with refreshToken in Authorization header
            // Retry up to 2 times for network errors (but not for 401/403)
            console.log('🔐 [HttpClient] Calling refreshTokenWithRetry...')
            const data = await this.refreshTokenWithRetry(refreshToken, 2)
            console.log('🔐 [HttpClient] Refresh success, received data:', {
              hasAccessToken: !!data.accessToken,
              hasRefreshToken: !!data.refreshToken,
              accessTokenPreview: data.accessToken?.substring(0, 20) + '...',
            })

            // Save new tokens
            if (data.accessToken) {
              localStorage.setItem(API_CONFIG.TOKEN_KEY, data.accessToken)
              console.log('✅ [HttpClient] Saved new access token')
            } else {
              console.warn('⚠️ [HttpClient] No accessToken in refresh response!')
            }
            if (data.refreshToken) {
              localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, data.refreshToken)
              console.log('✅ [HttpClient] Saved new refresh token')
            } else {
              console.warn('⚠️ [HttpClient] No refreshToken in refresh response!')
            }

            // Retry all queued requests with new token
            this.failedQueue.forEach((promise) => promise.resolve())
            this.failedQueue = []

            // Retry original request with new access token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
            }
            return this.axiosInstance(originalRequest)
            
          } catch (refreshError) {
            // Refresh token expired or invalid - FORCE LOGOUT
            console.error('🔐 [HttpClient] Refresh token failed:', refreshError)
            console.log('🔐 [HttpClient] Error details:', {
              isAxiosError: axios.isAxiosError(refreshError),
              status: axios.isAxiosError(refreshError) ? refreshError.response?.status : 'N/A',
              message: refreshError instanceof Error ? refreshError.message : String(refreshError),
            })
            
            this.failedQueue.forEach((promise) => promise.reject(refreshError))
            this.failedQueue = []
            console.log('🔐 [HttpClient] Failed queue cleared')
            
            // Only logout if we still have tokens (prevent duplicate logout)
            const hasToken = localStorage.getItem(API_CONFIG.TOKEN_KEY)
            console.log('🔐 [HttpClient] Checking for existing token:', { hasToken: !!hasToken })
            
            if (hasToken) {
              console.log('🔐 [HttpClient] Token exists, calling forceLogout...')
              this.forceLogout('Phiên đăng nhập hết hạn')
            } else {
              console.log('🔐 [HttpClient] Already logged out, skipping forceLogout')
            }
            
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Refresh token with retry logic
   * Retries on network errors but not on 401/403 (invalid token)
   */
  private async refreshTokenWithRetry(
    refreshToken: string, 
    maxRetries: number = 2
  ): Promise<any> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔐 [HttpClient] Refresh attempt ${attempt}/${maxRetries}`)
        
        const { data } = await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
          {}, // Empty body - backend expects no body
          { 
            headers: { 
              Authorization: `Bearer ${refreshToken}`,
              accept: '*/*',
              'Content-Type': 'application/json'
            },
            timeout: 10000  // 10 second timeout - fail fast
          }
        )
        
        return data  // Success - return immediately
        
      } catch (error) {
        lastError = error
        console.error('🔐 [HttpClient] Refresh attempt failed:', {
          attempt,
          status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
          message: axios.isAxiosError(error) ? error.message : String(error),
        })
        
        // Don't retry on 401/403 (invalid/expired token) - logout immediately
        if (axios.isAxiosError(error) && 
            (error.response?.status === 401 || error.response?.status === 403)) {
          console.log('🔐 [HttpClient] Invalid refresh token (401/403) - no retry, will logout')
          throw error  // Invalid token - no point retrying
        }
        
        // Retry on network errors or 5xx server errors
        if (attempt < maxRetries) {
          const delayMs = 1000 * attempt  // Exponential backoff: 1s, 2s
          console.log(`🔐 [HttpClient] Retry ${attempt} failed, waiting ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }
    
    // All retries failed
    console.error('🔐 [HttpClient] All refresh attempts failed')
    throw lastError
  }

  /**
   * Force logout - Clear all auth data and redirect to login
   * Called when refresh token fails or is expired
   */
  public forceLogout(reason: string = 'Session expired'): void {
    console.log(`🔐 [HttpClient] Force logout called: ${reason}`)
    console.log(`🔐 [HttpClient] Current location: ${window.location.pathname}`)
    
    // 1. Remove localStorage tokens
    this.removeTokens()
    console.log('🔐 [HttpClient] Tokens removed from localStorage')
    
    // 2. Remove auth cookie
    deleteCookie(AUTH_SESSION_KEY)
    console.log('🔐 [HttpClient] Auth cookie removed')
    
    // 3. Dispatch event to notify React AuthContext
    dispatchAuthEvent(AUTH_EVENTS.FORCE_LOGOUT, { reason })
    console.log('🔐 [HttpClient] Event dispatched')
    
    // 4. Redirect to login page (with slight delay to let event propagate)
    setTimeout(() => {
      if (window.location.pathname !== '/auth/sign-in') {
        const redirectUrl = `/auth/sign-in?expired=true&reason=${encodeURIComponent(reason)}`
        console.log(`🔐 [HttpClient] Redirecting to: ${redirectUrl}`)
        window.location.href = redirectUrl
      } else {
        console.log('🔐 [HttpClient] Already on sign-in page, skipping redirect')
      }
    }, 100)
  }

  public setAccessToken(token: string): void {
    localStorage.setItem(API_CONFIG.TOKEN_KEY, token)
  }



  public removeTokens(): void {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY)
    localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY)
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config)
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config)
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config)
  }
}

export default new HttpClient()
