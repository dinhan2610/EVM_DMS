import httpClient from '@/helpers/httpClient'
import API_CONFIG from '@/config/api.config'

// API Response Interface
export interface UserApiResponse {
  userID: number
  fullName: string
  email: string
  phoneNumber: string
  roleName: string
  isActive: boolean
  status: number
  evidenceStoragePath: string | null
  createdAt: string
}

export interface UsersListResponse {
  items: UserApiResponse[]
  pageNumber?: number
  pageSize?: number
  totalCount?: number
}

// Create User Request
export interface CreateUserRequest {
  fullName: string
  email: string
  phoneNumber: string
  roleName: string
}

// Deactivate User Request
export interface DeactivateUserRequest {
  adminNotes: string
}

// Profile Interfaces
export interface UserProfile {
  userID: number
  fullName: string
  email: string
  phoneNumber: string
  roleName: string
  isActive: boolean
  status: number
  evidenceStoragePath: string | null
  createdAt: string
}

export interface UpdateProfileRequest {
  fullName: string
  phoneNumber: string
  evidenceStoragePath?: string | null
}

// Error Response Interface
export interface ApiErrorResponse {
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

// Handle API errors
const handleApiError = (error: any): string => {
  if (error.response) {
    const { status, data } = error.response

    // Handle specific status codes
    switch (status) {
      case 400:
        if (data?.errors) {
          // Validation errors
          const errorMessages = Object.values(data.errors).flat()
          return errorMessages.join(', ')
        }
        return data?.message || data?.error || 'Dữ liệu không hợp lệ'
      case 401:
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại'
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này'
      case 404:
        return 'Không tìm thấy người dùng'
      case 409:
        return 'Email đã tồn tại trong hệ thống'
      case 500:
        return data?.message || 'Lỗi hệ thống. Vui lòng thử lại sau'
      default:
        return data?.message || data?.error || 'Đã có lỗi xảy ra'
    }
  } else if (error.request) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng'
  }

  return error.message || 'Lỗi không xác định'
}

const userService = {
  // Get all users
  async getUsers(pageNumber = 1, pageSize = 100): Promise<UsersListResponse> {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USER.USERS, {
        params: { PageNumber: pageNumber, PageSize: pageSize }
      })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Get active users only
  async getActiveUsers(pageNumber = 1, pageSize = 100): Promise<UsersListResponse> {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USER.ACTIVE_USERS, {
        params: { pageNumber, pageSize }
      })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Get inactive users only
  async getInactiveUsers(pageNumber = 1, pageSize = 100): Promise<UsersListResponse> {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USER.INACTIVE_USERS, {
        params: { pageNumber, pageSize }
      })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Get user detail by ID
  async getUserDetail(userId: number): Promise<UserApiResponse> {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USER.USER_DETAIL(userId))
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Create new user
  async createUser(data: CreateUserRequest): Promise<UserApiResponse> {
    try {
      const response = await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Activate user
  async activateUser(userId: number): Promise<void> {
    try {
      await httpClient.put(API_CONFIG.ENDPOINTS.USER.ACTIVATE(userId), {})
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Deactivate user
  async deactivateUser(userId: number, adminNotes: string): Promise<void> {
    try {
      await httpClient.put(API_CONFIG.ENDPOINTS.USER.DEACTIVATE(userId), { adminNotes })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  /**
   * Get current user's profile
   * GET /api/User/profile
   * Headers: Authorization Bearer token (auto-added by httpClient)
   * Response: UserProfile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USER.PROFILE)
      return response.data
    } catch (error: unknown) {
      throw new Error(handleApiError(error))
    }
  },

  /**
   * Update current user's profile
   * PUT /api/User/profile
   * Headers: Authorization Bearer token (auto-added by httpClient)
   * Body: {fullName, phoneNumber, evidenceStoragePath?}
   * 
   * Note: Email, role, and other fields are READ-ONLY and managed by admin
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await httpClient.put(API_CONFIG.ENDPOINTS.USER.PROFILE, data)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  /**
   * Reset password for user by email
   * PUT /api/Auth/reset
   * Body: { email: string }
   * 
   * Sends password reset email to the user
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await httpClient.put('/Auth/reset', { email })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export default userService

