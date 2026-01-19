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
              throw new Error('No refresh token available')
            }

            // Call refresh token API with refreshToken in Authorization header
            const { data } = await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
              {}, // Empty body - backend expects no body
              { 
                headers: { 
                  Authorization: `Bearer ${refreshToken}`, 
                  accept: '*/*',
                  'Content-Type': 'application/json'
                } 
              }
            )

            // Save new tokens
            if (data.accessToken) {
              localStorage.setItem(API_CONFIG.TOKEN_KEY, data.accessToken)
            }
            if (data.refreshToken) {
              localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, data.refreshToken)
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
            
            this.failedQueue.forEach((promise) => promise.reject(refreshError))
            this.failedQueue = []
            
            // Clear ALL auth data (localStorage + cookies)
            this.forceLogout('Phiên đăng nhập hết hạn')
            
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
   * Force logout - Clear all auth data and redirect to login
   * Called when refresh token fails or is expired
   */
  public forceLogout(reason: string = 'Session expired'): void {
    console.log(`🔐 [HttpClient] Force logout: ${reason}`)
    
    // 1. Remove localStorage tokens
    this.removeTokens()
    
    // 2. Remove auth cookie
    deleteCookie(AUTH_SESSION_KEY)
    
    // 3. Dispatch event to notify React AuthContext
    dispatchAuthEvent(AUTH_EVENTS.FORCE_LOGOUT, { reason })
    
    // 4. Redirect to login page (with slight delay to let event propagate)
    setTimeout(() => {
      if (window.location.pathname !== '/auth/sign-in') {
        window.location.href = `/auth/sign-in?expired=true&reason=${encodeURIComponent(reason)}`
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
