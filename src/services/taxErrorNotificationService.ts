/**
 * 🔔 TAX ERROR NOTIFICATION SERVICE
 * API Service for Tax Error Notification (Thông báo sai sót - Mẫu 04/SS-HĐĐT)
 * 
 * @service taxErrorNotificationService
 * @description Service xử lý API calls cho thông báo sai sót hóa đơn điện tử
 * 
 * Backend Endpoints (REAL):
 * - POST /api/Tax/Create-Form04SS-Draft - Tạo draft thông báo
 * - GET /api/Tax/{id}/preview - Preview XML/HTML
 * - POST /api/Tax/{id}/send-form-to-CQT - Gửi lên CQT
 * - GET /api/Tax/{id}/pdf - Export PDF
 * 
 * @author EIMS Team
 * @updated 2026-01-15 - Match với backend thực tế
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'
import dayjs from 'dayjs'

// ==================== TYPES ====================

/**
 * Tính chất sai sót
 */
export enum ErrorNotificationType {
  CANCEL = 1,      // Hủy hóa đơn
  ADJUST = 2,      // Điều chỉnh
  REPLACE = 3,     // Thay thế
  EXPLAIN = 4,     // Giải trình
}

/**
 * Request payload cho Create Draft
 */
export interface CreateDraftRequest {
  notificationType: number  // 1-4: CANCEL, ADJUST, REPLACE, EXPLAIN
  notificationNumber: string
  taxAuthority: string
  taxCode: string  // Mã số thuế người nộp thuế (required at top level)
  createdDate: string
  place: string
  errorItems: Array<{
    invoiceId: number
    errorType: number
    reason: string
    taxpayerName: string
    taxCode: string
  }>
}

/**
 * Response từ Create Draft API
 */
export interface CreateDraftResponse {
  success?: boolean
  message?: string
  data?: {
    notificationId: number
    notificationNumber: string
    status: string
    createdAt: string
    createdBy: number
  }
  // Fallback nếu BE trả về format khác
  notificationId?: number
  id?: number
}

/**
 * Response từ Preview API
 */
export interface PreviewResponse {
  success?: boolean
  data?: {
    xml?: string
    html?: string
    hash?: string
  }
  // Fallback
  xml?: string
  html?: string
}

/**
 * Response từ Send to CQT API
 */
export interface SendToCQTResponse {
  success?: boolean
  message?: string
  data?: {
    cqtResponse?: string
    sentAt?: string
  }
}

/**
 * Notification List Item (từ GET /api/InvoiceErrorNotifications)
 * Backend API response với đầy đủ invoice fields (updated 15/01/2026)
 */
export interface NotificationListItem {
  id: number
  notificationNumber: string
  notificationType: string
  notificationTypeCode: number  // 0-4: 0=chưa set, 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
  taxAuthorityName: string
  createdDate: string
  status: string
  statusCode: number  // 1=Nháp, 2=Đã ký, 3=Đã gửi T-VAN, 4=CQT Tiếp nhận, 5=CQT Từ chối
  mtDiep: string
  xmlPath: string | null
  taxResponsePath: string | null
  place: string | null
  // Invoice fields (added by backend)
  invoiceSerial: string
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  totalAmount: number
  details: null  // Không có trong list response (set null for performance)
}

/**
 * Notification Detail Item (từ GET /api/InvoiceErrorNotifications/{id})
 * Includes full details array with invoice error items
 */
export interface NotificationDetail {
  id: number
  notificationNumber: string
  notificationType: string
  notificationTypeCode: number  // 0-4: Should be populated from details[0].errorType
  taxAuthorityName: string
  createdDate: string
  status: string
  statusCode: number
  mtDiep: string
  xmlPath: string | null
  place: string | null
  details: Array<{
    invoiceId: number
    invoiceSerial: string
    invoiceNumber: string
    invoiceDate: string
    errorType: number
    errorTypeName: string
    reason: string
  }>
}

/**
 * Paginated response từ list API
 */
export interface PaginatedNotificationResponse {
  items: NotificationListItem[]
  pageIndex: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// ==================== HELPER FUNCTIONS ====================

const getAuthToken = (): string => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY) || localStorage.getItem('token')
  if (!token) {
    throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.')
  }
  return token
}

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
  'accept': '*/*',
})

/**
 * Generate notification number
 * Format: TB-DDMMYYYY_HHMM
 */
const generateNotificationNumber = (): string => {
  return `TB-${dayjs().format('DDMMYYYY_HHmm')}`
}

/**
 * Get notification type label
 */
const getNotificationTypeLabel = (errorType: ErrorNotificationType): string => {
  const labels: Record<ErrorNotificationType, string> = {
    [ErrorNotificationType.CANCEL]: 'Thông báo hủy hóa đơn',
    [ErrorNotificationType.ADJUST]: 'Thông báo điều chỉnh hóa đơn',
    [ErrorNotificationType.REPLACE]: 'Thông báo thay thế hóa đơn',
    [ErrorNotificationType.EXPLAIN]: 'Thông báo giải trình hóa đơn',
  }
  return labels[errorType] || 'Thông báo sai sót hóa đơn điện tử'
}

// ==================== SERVICE ====================

const taxErrorNotificationService = {
  /**
   * STEP 1: Tạo draft thông báo sai sót
   * 
   * @param request - Request data với invoice info
   * @returns Response với notificationId
   * 
   * @example
   * ```typescript
   * const result = await taxErrorNotificationService.createDraft({
   *   notificationType: 'Thông báo hủy hóa đơn',
   *   notificationNumber: 'TB-15012026_1430',
   *   taxAuthority: '100395',
   *   createdDate: '2026-01-15',
   *   place: 'Hà Nội',
   *   errorItems: [{
   *     invoiceId: 148,
   *     errorType: 1,
   *     reason: 'Lý do sai sót...',
   *     taxpayerName: 'Công ty ABC',
   *     taxCode: '0316882091'
   *   }]
   * })
   * ```
   */
  createDraft: async (request: CreateDraftRequest): Promise<CreateDraftResponse> => {
    try {
      console.log('[TaxErrorNotification] Creating draft:', request)
      
      const response = await axios.post<CreateDraftResponse>(
        `${API_CONFIG.BASE_URL}/Tax/Create-Form04SS-Draft`,
        request,
        { headers: getAuthHeaders() }
      )

      console.log('[TaxErrorNotification] ✅ Draft created:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Create draft error:', error)
      
      if (axios.isAxiosError(error)) {
        console.error('❌ Response status:', error.response?.status)
        console.error('❌ Response data:', error.response?.data)
        
        // Log validation errors in detail
        if (error.response?.data?.errors) {
          console.error('❌ VALIDATION ERRORS:', JSON.stringify(error.response.data.errors, null, 2))
        }
        
        console.error('❌ Request payload:', JSON.stringify(request, null, 2))
        
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.title
          || error.response?.data?.errors
          || error.message
        throw new Error(`Lỗi tạo thông báo: ${JSON.stringify(errorMessage)}`)
      }
      
      throw error
    }
  },

  /**
   * STEP 2: Preview nội dung thông báo (XML/HTML)
   * 
   * @param notificationId - ID của thông báo đã tạo
   * @returns XML/HTML content
   * 
   * @example
   * ```typescript
   * const preview = await taxErrorNotificationService.preview(113)
   * ```
   */
  preview: async (notificationId: number): Promise<PreviewResponse> => {
    try {
      console.log(`[TaxErrorNotification] Previewing notification ${notificationId}...`)
      
      const response = await axios.get<PreviewResponse>(
        `${API_CONFIG.BASE_URL}/Tax/${notificationId}/preview`,
        { headers: getAuthHeaders() }
      )

      console.log('[TaxErrorNotification] ✅ Preview loaded')
      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Preview error:', error)
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Lỗi preview: ${errorMessage}`)
      }
      
      throw error
    }
  },

  /**
   * STEP 3: Gửi thông báo lên CQT
   * 
   * @param notificationId - ID của thông báo
   * @param signature - Digital signature (optional)
   * @returns Response từ CQT
   * 
   * @example
   * ```typescript
   * const result = await taxErrorNotificationService.sendToCQT(113)
   * ```
   */
  sendToCQT: async (
    notificationId: number,
    signature?: string
  ): Promise<SendToCQTResponse> => {
    try {
      console.log(`[TaxErrorNotification] Sending notification ${notificationId} to CQT...`)
      
      const response = await axios.post<SendToCQTResponse>(
        `${API_CONFIG.BASE_URL}/Tax/${notificationId}/send-form-to-CQT`,
        signature ? { signature } : {},
        { headers: getAuthHeaders() }
      )

      console.log('[TaxErrorNotification] ✅ Sent to CQT successfully')
      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Send to CQT error:', error)
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Lỗi gửi CQT: ${errorMessage}`)
      }
      
      throw error
    }
  },

  /**
   * STEP 4: Export PDF
   * 
   * @param notificationId - ID của thông báo
   * @returns PDF blob
   * 
   * @example
   * ```typescript
   * const pdfBlob = await taxErrorNotificationService.exportPDF(113)
   * // Download file
   * const url = window.URL.createObjectURL(pdfBlob)
   * const link = document.createElement('a')
   * link.href = url
   * link.download = 'ThongBaoSaiSot_113.pdf'
   * link.click()
   * ```
   */
  exportPDF: async (notificationId: number): Promise<Blob> => {
    try {
      console.log(`[TaxErrorNotification] Exporting PDF for notification ${notificationId}...`)
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/Tax/${notificationId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'accept': 'application/pdf',
          },
          responseType: 'blob',
        }
      )

      console.log('[TaxErrorNotification] ✅ PDF exported')
      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Export PDF error:', error)
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Lỗi export PDF: ${errorMessage}`)
      }
      
      throw error
    }
  },

  /**
   * GET LIST: Lấy danh sách thông báo sai sót (paginated)
   * 
   * @param pageIndex - Page number (1-based)
   * @param pageSize - Items per page
   * @returns Paginated list of notifications
   * 
   * @example
   * ```typescript
   * const list = await taxErrorNotificationService.getNotifications(1, 10)
   * console.log(list.items)  // Array of notifications
   * console.log(list.totalCount)  // Total notifications
   * ```
   */
  getNotifications: async (
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedNotificationResponse> => {
    try {
      console.log(`[TaxErrorNotification] Fetching notifications page ${pageIndex}...`)
      
      const response = await axios.get<PaginatedNotificationResponse>(
        `${API_CONFIG.BASE_URL}/InvoiceErrorNotifications`,
        {
          headers: getAuthHeaders(),
          params: { pageIndex, pageSize },
        }
      )

      console.log('[TaxErrorNotification] ✅ Notifications loaded:', response.data.items.length, 'items')
      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Get notifications error:', error)
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Lỗi tải danh sách: ${errorMessage}`)
      }
      
      throw error
    }
  },

  /**
   * GET DETAIL: Lấy chi tiết thông báo sai sót
   * 
   * @param notificationId - ID của thông báo
   * @returns Notification detail with invoice items
   * 
   * @example
   * ```typescript
   * const detail = await taxErrorNotificationService.getNotificationById(1)
   * console.log(detail.details)  // Array of invoice items
   * ```
   */
  getNotificationById: async (notificationId: number): Promise<NotificationDetail> => {
    try {
      console.log(`[TaxErrorNotification] Fetching notification detail ${notificationId}...`)
      
      const response = await axios.get<NotificationDetail>(
        `${API_CONFIG.BASE_URL}/InvoiceErrorNotifications/${notificationId}`,
        { headers: getAuthHeaders() }
      )

      console.log('[TaxErrorNotification] ✅ Notification detail loaded')
      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Get notification detail error:', error)
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Lỗi tải chi tiết: ${errorMessage}`)
      }
      
      throw error
    }
  },

  // ==================== HELPERS ====================

  generateNotificationNumber,
  getNotificationTypeLabel,
}

export default taxErrorNotificationService
