import axios from 'axios'
import { API_CONFIG } from '@/config/api.config'

const API_BASE_URL = API_CONFIG.BASE_URL

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem(API_CONFIG.TOKEN_KEY)
}

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('No authentication token found. Please login again.')
  }
  return {
    'Authorization': `Bearer ${token}`,
  }
}

/**
 * ⚠️ Service for managing Minutes (Biên bản điều chỉnh/thay thế hóa đơn)
 * 
 * API Endpoint: POST /api/Minute
 * Content-Type: multipart/form-data
 */

// ============================================================
// 📋 INTERFACES
// ============================================================

/**
 * Payload for uploading minute
 */
export interface UploadMinuteRequest {
  invoiceId: number
  minuteType: number  // 1: Điều chỉnh, 2: Thay thế
  description: string
  pdfFile: File
}

/**
 * Response from upload minute API
 */
export interface UploadMinuteResponse {
  minuteId: number
  invoiceId: number
  minuteType: number
  description: string
  filePath: string
  uploadedAt: string
}

/**
 * Minute record from API
 */
export interface MinuteRecord {
  minuteInvoiceId: number
  invoiceId: number
  minuteCode: string
  invoiceNo: string | null
  customerName: string
  minuteType: 'Adjustment' | 'Replacement'
  status: string
  description: string
  filePath: string
  createdAt: string
  createdByName: string
  isSellerSigned: boolean
  isBuyerSigned: boolean
}

/**
 * Response from GET /api/Minute
 */
export interface MinuteListResponse {
  items: MinuteRecord[]
  pageIndex: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// ============================================================
// 🛠️ API FUNCTIONS
// ============================================================

/**
 * Get list of minutes with pagination
 * 
 * @param pageIndex - Page number (default: 1)
 * @param pageSize - Items per page (default: 10)
 * @returns Promise<MinuteListResponse>
 */
export const getMinutes = async (pageIndex: number = 1, pageSize: number = 1000): Promise<MinuteListResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[getMinutes] Fetching minutes list:', { pageIndex, pageSize })
    }

    const response = await axios.get<MinuteListResponse>(
      `${API_BASE_URL}/Minute`,
      {
        params: { pageIndex, pageSize },
        headers: getAuthHeaders(),
      }
    )

    if (import.meta.env.DEV) {
      console.log('[getMinutes] ✅ Success:', {
        totalCount: response.data.totalCount,
        itemsCount: response.data.items.length,
      })
    }

    return response.data
  } catch (error) {
    console.error('[getMinutes] ❌ Error:', error)
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title ||
                          error.message
      throw new Error(errorMessage || 'Không thể tải danh sách biên bản')
    }
    
    throw error
  }
}

/**
 * Get minute detail by ID
 * 
 * @param minuteId - Minute invoice ID
 * @returns Promise<MinuteRecord>
 */
export const getMinuteById = async (minuteId: number): Promise<MinuteRecord> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[getMinuteById] Fetching minute:', minuteId)
    }

    const response = await axios.get<MinuteRecord>(
      `${API_BASE_URL}/Minute/${minuteId}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (import.meta.env.DEV) {
      console.log('[getMinuteById] ✅ Success:', response.data)
    }

    return response.data
  } catch (error) {
    console.error('[getMinuteById] ❌ Error:', error)
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title ||
                          error.message
      throw new Error(errorMessage || 'Không thể tải thông tin biên bản')
    }
    
    throw error
  }
}

/**
 * Upload minute PDF file with metadata
 * 
 * @param data - Upload request data
 * @returns Promise<UploadMinuteResponse>
 */
export const uploadMinute = async (data: UploadMinuteRequest): Promise<UploadMinuteResponse> => {
  try {
    const formData = new FormData()
    formData.append('InvoiceId', data.invoiceId.toString())
    formData.append('MinuteType', data.minuteType.toString())
    formData.append('Description', data.description)
    formData.append('PdfFile', data.pdfFile)

    if (import.meta.env.DEV) {
      console.log('[uploadMinute] Uploading:', {
        invoiceId: data.invoiceId,
        minuteType: data.minuteType,
        description: data.description,
        fileName: data.pdfFile.name,
        fileSize: `${(data.pdfFile.size / 1024).toFixed(2)} KB`,
      })
      
      // Log FormData contents for debugging
      console.log('[uploadMinute] FormData entries:')
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, { name: value.name, size: value.size, type: value.type })
        } else {
          console.log(`  ${key}:`, value)
        }
      }
    }

    const response = await axios.post<UploadMinuteResponse>(
      `${API_BASE_URL}/Minute`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    if (import.meta.env.DEV) {
      console.log('[uploadMinute] ✅ Success:', response.data)
    }

    return response.data
  } catch (error) {
    console.error('[uploadMinute] ❌ Error:', error)
    
    if (axios.isAxiosError(error)) {
      // Log detailed error info
      console.error('[uploadMinute] Response status:', error.response?.status)
      console.error('[uploadMinute] Response data:', error.response?.data)
      console.error('[uploadMinute] Request URL:', error.config?.url)
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title ||
                          error.response?.data?.error ||
                          error.message
      
      throw new Error(errorMessage || 'Không thể upload biên bản')
    }
    
    throw new Error('Lỗi không xác định khi upload biên bản')
  }
}

/**
 * Validate PDF file before upload
 * 
 * @param file - File to validate
 * @returns Error message or null if valid
 */
export const validatePdfFile = (file: File): string | null => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return 'Chỉ chấp nhận file PDF'
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return `Kích thước file vượt quá ${(maxSize / 1024 / 1024).toFixed(0)}MB`
  }

  // Check file name
  if (!file.name || file.name.length > 255) {
    return 'Tên file không hợp lệ'
  }

  return null
}

export default {
  uploadMinute,
  validatePdfFile,
}
