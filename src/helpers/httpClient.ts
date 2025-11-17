import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import API_CONFIG from '@/config/api.config'

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
            if (!refreshToken) throw new Error('No refresh token available')

            const { data } = await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
              {},
              { headers: { Authorization: `Bearer ${refreshToken}`, accept: '*/*' } }
            )

            localStorage.setItem(API_CONFIG.TOKEN_KEY, data.accessToken)
            if (data.refreshToken) {
              localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, data.refreshToken)
            }

            this.failedQueue.forEach((promise) => promise.resolve())
            this.failedQueue = []

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
            }
            return this.axiosInstance(originalRequest)
          } catch {
            this.failedQueue.forEach((promise) => promise.reject())
            this.failedQueue = []
            this.removeTokens()
            window.location.href = '/auth/sign-in'
            return Promise.reject(error)
          } finally {
            this.isRefreshing = false
          }
        }
        return Promise.reject(error)
      }
    )
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
