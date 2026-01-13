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

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
  success: boolean
}

export interface ApiErrorResponse {
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

class AuthService {
  /**
   * Login user with email and password
   * POST /api/Auth/login
   * Body: {email: string, password: string}
   * Response: {accessToken, refreshToken, userID, fullName, email, role}
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await httpClient.post(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials
    )

    // Save tokens to localStorage
    if (response.data.accessToken) {
      httpClient.setAccessToken(response.data.accessToken)
    }
    if (response.data.refreshToken) {
      localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, response.data.refreshToken)
    }

    return response.data
  }

  /**
   * Logout user
   * POST /api/Auth/logout
   * Headers: Authorization: Bearer {accessToken}
   * Body: {} (empty)
   */
  async logout(): Promise<void> {
    try {
      // Call logout API (httpClient auto adds Bearer token)
      await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {})
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue to remove tokens even if API fails
    } finally {
      // Always remove tokens from localStorage
      httpClient.removeTokens()
    }
  }

  /**
   * Change user password (Action - Not Idempotent)
   * POST /api/Auth/change-password
   * Body: {currentPassword: string, newPassword: string}
   * Headers: Authorization: Bearer {accessToken}
   * 
   * Why POST instead of PUT?
   * - Change password is an ACTION, not a resource update
   * - POST is more secure for sensitive data (better logging behavior)
   * - Not idempotent: Second call will fail (currentPassword changed)
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const response: AxiosResponse<ChangePasswordResponse> = await httpClient.post(
        API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data
      )
      return response.data
    } catch (error: unknown) {
      // Handle specific error messages from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data: ApiErrorResponse } }
        
        if (axiosError.response) {
          const errorData = axiosError.response.data
          
          // Backend validation errors
          if (errorData?.errors) {
            const errorMessages = Object.values(errorData.errors).flat()
            throw new Error(errorMessages.join(', '))
          }
          
          // Common error messages
          if (axiosError.response.status === 400) {
            throw new Error(errorData?.message || 'Mật khẩu hiện tại không đúng')
          }
          if (axiosError.response.status === 401) {
            throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
          }
          if (axiosError.response.status === 403) {
            throw new Error('Bạn không có quyền thay đổi mật khẩu')
          }
          
          throw new Error(errorData?.message || errorData?.error || 'Không thể đổi mật khẩu')
        }
      }
      
      throw new Error('Lỗi kết nối. Vui lòng thử lại')
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
