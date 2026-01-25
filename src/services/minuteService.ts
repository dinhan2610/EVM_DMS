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
 * Update file PDF cho minute đã tồn tại
 * API: PUT /api/Minute/{minuteId}/file
 * 
 * Dùng khi cần upload/cập nhật file PDF cho minute đã được tạo
 * Tối ưu hơn uploadMinute vì không cần gửi lại metadata
 * 
 * @param minuteId - ID của minute cần update file
 * @param file - File PDF mới
 * @returns Promise<void>
 */
export const updateMinuteFile = async (minuteId: number, file: File): Promise<void> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    if (import.meta.env.DEV) {
      console.log('[updateMinuteFile] Updating file for minute:', {
        minuteId,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      })
    }

    await axios.put(
      `${API_BASE_URL}/Minute/${minuteId}/file`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    if (import.meta.env.DEV) {
      console.log('[updateMinuteFile] ✅ Success')
    }
  } catch (error) {
    console.error('[updateMinuteFile] ❌ Error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('[updateMinuteFile] Response status:', error.response?.status)
      console.error('[updateMinuteFile] Response data:', error.response?.data)
      
      const status = error.response?.status
      const responseData = error.response?.data
      
      let errorMessage = ''
      if (typeof responseData === 'string') {
        errorMessage = responseData
      } else if (responseData?.message) {
        errorMessage = responseData.message
      } else if (responseData?.title) {
        errorMessage = responseData.title
      }
      
      if (status === 400) {
        throw new Error(errorMessage || 'File không hợp lệ')
      }
      if (status === 404) {
        throw new Error(errorMessage || 'Không tìm thấy biên bản')
      }
      if (status === 403) {
        throw new Error(errorMessage || 'Bạn không có quyền cập nhật biên bản này')
      }
      
      throw new Error(errorMessage || 'Không thể cập nhật file biên bản')
    }
    
    throw new Error('Lỗi không xác định khi cập nhật file biên bản')
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

/**
 * Ký số biên bản (Bên bán)
 * API: POST /api/Minute/sign-seller/{minuteId}
 * 
 * @param minuteId - ID của biên bản cần ký
 * @returns Promise<void>
 */
export const signMinuteSeller = async (minuteId: number): Promise<void> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[signMinuteSeller] Signing minute:', minuteId)
    }

    await axios.post(
      `${API_BASE_URL}/Minute/sign-seller/${minuteId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    )

    if (import.meta.env.DEV) {
      console.log('[signMinuteSeller] ✅ Success')
    }
  } catch (error) {
    console.error('[signMinuteSeller] ❌ Error:', error)
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const responseData = error.response?.data
      
      // Log chi tiết response để debug
      console.error('[signMinuteSeller] Response status:', status)
      console.error('[signMinuteSeller] Response data:', responseData)
      
      // Trích xuất error message từ nhiều format khác nhau
      let errorMessage = ''
      if (typeof responseData === 'string') {
        errorMessage = responseData
      } else if (responseData?.message) {
        errorMessage = responseData.message
      } else if (responseData?.title) {
        errorMessage = responseData.title
      } else if (responseData?.errors) {
        // Xử lý validation errors
        const errors = responseData.errors
        if (Array.isArray(errors)) {
          errorMessage = errors.join(', ')
        } else if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ')
        }
      }
      
      if (status === 400) {
        throw new Error(errorMessage || 'Biên bản không hợp lệ hoặc đã được ký')
      }
      if (status === 404) {
        throw new Error(errorMessage || 'Không tìm thấy biên bản')
      }
      if (status === 403) {
        throw new Error(errorMessage || 'Bạn không có quyền ký biên bản này')
      }
      
      throw new Error(errorMessage || 'Không thể ký biên bản')
    }
    
    throw new Error('Lỗi không xác định khi ký biên bản')
  }
}

/**
 * Xác nhận hoàn thành biên bản (Người mua đã xác nhận)
 * API: PUT /api/Minute/{minuteId}/complete
 * 
 * @param minuteId - ID của biên bản cần xác nhận
 * @returns Promise<void>
 */
export const completeMinute = async (minuteId: number): Promise<void> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[completeMinute] Completing minute:', minuteId)
    }

    await axios.put(
      `${API_BASE_URL}/Minute/${minuteId}/complete`,
      {},
      {
        headers: getAuthHeaders(),
      }
    )

    if (import.meta.env.DEV) {
      console.log('[completeMinute] ✅ Success')
    }
  } catch (error) {
    console.error('[completeMinute] ❌ Error:', error)
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const responseData = error.response?.data
      
      console.error('[completeMinute] Response status:', status)
      console.error('[completeMinute] Response data:', responseData)
      
      let errorMessage = ''
      if (typeof responseData === 'string') {
        errorMessage = responseData
      } else if (responseData?.message) {
        errorMessage = responseData.message
      } else if (responseData?.title) {
        errorMessage = responseData.title
      } else if (responseData?.errors) {
        const errors = responseData.errors
        if (Array.isArray(errors)) {
          errorMessage = errors.join(', ')
        } else if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ')
        }
      }
      
      if (status === 400) {
        throw new Error(errorMessage || 'Biên bản không hợp lệ hoặc chưa đủ điều kiện hoàn thành')
      }
      if (status === 404) {
        throw new Error(errorMessage || 'Không tìm thấy biên bản')
      }
      if (status === 403) {
        throw new Error(errorMessage || 'Bạn không có quyền xác nhận biên bản này')
      }
      
      throw new Error(errorMessage || 'Không thể xác nhận biên bản')
    }
    
    throw new Error('Lỗi không xác định khi xác nhận biên bản')
  }
}

// ============================================================
// 🔍 MINUTE STATUS CONSTANTS
// ============================================================

/**
 * Trạng thái biên bản theo backend EMinuteStatus
 * API trả về dạng STRING, không phải number
 */
export const MINUTE_STATUS = {
  PENDING: 'Pending',       // Chờ ký
  SIGNED: 'Signed',         // Đã ký đầy đủ
  SENT: 'Sent',             // Đã gửi
  COMPLETE: 'Complete',     // Hai bên đồng thuận ✅
  CANCELLED: 'Cancelled',   // Đã hủy
} as const

/**
 * Loại biên bản
 */
export const MINUTE_TYPE = {
  ADJUSTMENT: 1,   // Biên bản điều chỉnh
  REPLACEMENT: 2,  // Biên bản thay thế
} as const

// ============================================================
// 🔍 GET MINUTES BY INVOICE ID
// ============================================================

/**
 * Lấy danh sách biên bản theo Invoice ID gốc
 * Filter từ API getMinutes theo invoiceId
 * 
 * @param invoiceId - ID hóa đơn gốc
 * @returns Promise<MinuteRecord[]> - Danh sách biên bản của hóa đơn
 */
export const getMinutesByInvoiceId = async (invoiceId: number): Promise<MinuteRecord[]> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[getMinutesByInvoiceId] Fetching minutes for invoice:', invoiceId)
    }

    // Lấy tất cả minutes rồi filter theo invoiceId
    const response = await getMinutes(1, 1000)
    
    const filteredMinutes = response.items.filter(minute => minute.invoiceId === invoiceId)
    
    if (import.meta.env.DEV) {
      console.log('[getMinutesByInvoiceId] ✅ Found minutes:', filteredMinutes.length)
    }

    return filteredMinutes
  } catch (error) {
    console.error('[getMinutesByInvoiceId] ❌ Error:', error)
    throw error
  }
}

/**
 * Kiểm tra xem hóa đơn có biên bản điều chỉnh đã được 2 bên thỏa thuận hay không
 * 
 * @param invoiceId - ID hóa đơn gốc
 * @returns Promise<{ hasValidMinute: boolean, minute: MinuteRecord | null, reason: string }>
 */
export const checkAdjustmentMinuteStatus = async (invoiceId: number): Promise<{
  hasValidMinute: boolean
  minute: MinuteRecord | null
  reason: string
}> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[checkAdjustmentMinuteStatus] Checking for invoice:', invoiceId)
    }

    const minutes = await getMinutesByInvoiceId(invoiceId)
    
    // Tìm biên bản điều chỉnh (Adjustment)
    const adjustmentMinutes = minutes.filter(m => m.minuteType === 'Adjustment')
    
    if (adjustmentMinutes.length === 0) {
      return {
        hasValidMinute: false,
        minute: null,
        reason: 'Chưa có biên bản điều chỉnh. Vui lòng tạo biên bản điều chỉnh trước.',
      }
    }
    
    // Tìm biên bản đã được 2 bên thỏa thuận (status = "Complete")
    const completedMinute = adjustmentMinutes.find(m => m.status === MINUTE_STATUS.COMPLETE)
    
    if (completedMinute) {
      return {
        hasValidMinute: true,
        minute: completedMinute,
        reason: `Biên bản ${completedMinute.minuteCode} đã được 2 bên thỏa thuận.`,
      }
    }
    
    // Có biên bản nhưng chưa Complete
    const latestMinute = adjustmentMinutes[0]
    
    let statusText = 'chưa xác định'
    if (latestMinute.status === MINUTE_STATUS.PENDING) statusText = 'đang chờ ký'
    else if (latestMinute.status === MINUTE_STATUS.SIGNED) statusText = 'đã ký nhưng chưa hoàn thành'
    else if (latestMinute.status === MINUTE_STATUS.SENT) statusText = 'đã gửi nhưng chưa được xác nhận'
    else if (latestMinute.status === MINUTE_STATUS.CANCELLED) statusText = 'đã bị hủy'
    
    return {
      hasValidMinute: false,
      minute: latestMinute,
      reason: `Biên bản ${latestMinute.minuteCode} ${statusText}. Cần 2 bên thỏa thuận xong mới được tạo HĐ điều chỉnh.`,
    }
  } catch (error) {
    console.error('[checkAdjustmentMinuteStatus] ❌ Error:', error)
    return {
      hasValidMinute: false,
      minute: null,
      reason: 'Không thể kiểm tra trạng thái biên bản. Vui lòng thử lại.',
    }
  }
}

/**
 * Kiểm tra xem hóa đơn có biên bản thay thế đã được 2 bên thỏa thuận hay không
 * 
 * @param invoiceId - ID hóa đơn gốc
 * @returns Promise<{ hasValidMinute: boolean, minute: MinuteRecord | null, reason: string }>
 */
export const checkReplacementMinuteStatus = async (invoiceId: number): Promise<{
  hasValidMinute: boolean
  minute: MinuteRecord | null
  reason: string
}> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[checkReplacementMinuteStatus] Checking for invoice:', invoiceId)
    }

    const minutes = await getMinutesByInvoiceId(invoiceId)
    
    // Tìm biên bản thay thế (Replacement)
    const replacementMinutes = minutes.filter(m => m.minuteType === 'Replacement')
    
    if (replacementMinutes.length === 0) {
      return {
        hasValidMinute: false,
        minute: null,
        reason: 'Chưa có biên bản thay thế. Vui lòng tạo biên bản thay thế trước.',
      }
    }
    
    // Tìm biên bản đã được 2 bên thỏa thuận (status = "Complete")
    const completedMinute = replacementMinutes.find(m => m.status === MINUTE_STATUS.COMPLETE)
    
    if (completedMinute) {
      return {
        hasValidMinute: true,
        minute: completedMinute,
        reason: `Biên bản ${completedMinute.minuteCode} đã được 2 bên thỏa thuận.`,
      }
    }
    
    // Có biên bản nhưng chưa Complete
    const latestMinute = replacementMinutes[0]
    
    let statusText = 'chưa xác định'
    if (latestMinute.status === MINUTE_STATUS.PENDING) statusText = 'đang chờ ký'
    else if (latestMinute.status === MINUTE_STATUS.SIGNED) statusText = 'đã ký nhưng chưa hoàn thành'
    else if (latestMinute.status === MINUTE_STATUS.SENT) statusText = 'đã gửi nhưng chưa được xác nhận'
    else if (latestMinute.status === MINUTE_STATUS.CANCELLED) statusText = 'đã bị hủy'
    
    return {
      hasValidMinute: false,
      minute: latestMinute,
      reason: `Biên bản ${latestMinute.minuteCode} ${statusText}. Cần 2 bên thỏa thuận xong mới được tạo HĐ thay thế.`,
    }
  } catch (error) {
    console.error('[checkReplacementMinuteStatus] ❌ Error:', error)
    return {
      hasValidMinute: false,
      minute: null,
      reason: 'Không thể kiểm tra trạng thái biên bản. Vui lòng thử lại.',
    }
  }
}

export default {
  uploadMinute,
  validatePdfFile,
  signMinuteSeller,
  completeMinute,
  getMinutesByInvoiceId,
  checkAdjustmentMinuteStatus,
  checkReplacementMinuteStatus,
  MINUTE_STATUS,
  MINUTE_TYPE,
}
