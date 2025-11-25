import axios, { AxiosError } from 'axios'
import API_CONFIG from '@/config/api.config'

// Get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'accept': '*/*'
  }
}

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

// Error Response Interface
export interface ApiErrorResponse {
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

// Handle API errors
const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    
    if (axiosError.response) {
      const { status, data } = axiosError.response
      
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
          return 'Lỗi hệ thống. Vui lòng thử lại sau'
        default:
          return data?.message || data?.error || 'Đã có lỗi xảy ra'
      }
    } else if (axiosError.request) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng'
    }
  }
  
  return 'Lỗi không xác định'
}

const userService = {
  // Get all users
  async getUsers(pageNumber = 1, pageSize = 100): Promise<UsersListResponse> {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.USERS}`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Get active users only
  async getActiveUsers(pageNumber = 1, pageSize = 100): Promise<UsersListResponse> {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.ACTIVE_USERS}`, {
        params: { pageNumber, pageSize },
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Get inactive users only
  async getInactiveUsers(pageNumber = 1, pageSize = 100): Promise<UsersListResponse> {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.INACTIVE_USERS}`, {
        params: { pageNumber, pageSize },
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Get user detail by ID
  async getUserDetail(userId: number): Promise<UserApiResponse> {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.USER_DETAIL(userId)}`,
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Create new user
  async createUser(data: CreateUserRequest): Promise<UserApiResponse> {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`,
        data,
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Activate user
  async activateUser(userId: number): Promise<void> {
    try {
      await axios.put(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.ACTIVATE(userId)}`,
        {},
        { headers: getAuthHeaders() }
      )
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Deactivate user
  async deactivateUser(userId: number, adminNotes: string): Promise<void> {
    try {
      await axios.put(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.DEACTIVATE(userId)}`,
        { adminNotes },
        { headers: getAuthHeaders() }
      )
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export default userService

