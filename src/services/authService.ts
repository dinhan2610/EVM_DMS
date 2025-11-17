import httpClient from '@/helpers/httpClient'
import API_CONFIG from '@/config/api.config'
import type { AxiosResponse } from 'axios'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  userID: number
  fullName: string
  email: string
  role: string
  accessToken: string
  refreshToken?: string
}

export interface ApiErrorResponse {
  message?: string
  error?: string
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await httpClient.post(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials
    )

    if (response.data.accessToken) {
      httpClient.setAccessToken(response.data.accessToken)
      if (response.data.refreshToken) {
        localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, response.data.refreshToken)
      }
    }

    return response.data
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {})
    } finally {
      httpClient.removeTokens()
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(API_CONFIG.TOKEN_KEY)
  }

  clearAuthData(): void {
    httpClient.removeTokens()
  }
}

export default new AuthService()
