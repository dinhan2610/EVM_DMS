/**
 * 🔔 TAX ERROR NOTIFICATION SERVICE
 * API Service for Tax Error Notification (Thông báo sai sót - Mẫu 04/SS-HĐĐT)
 * 
 * @service taxErrorNotificationService
 * @description Service xử lý API calls cho thông báo sai sót hóa đơn điện tử
 * 
 * Endpoints:
 * - POST /api/TaxErrorNotification/preview - Tạo preview XML/Hash
 * - POST /api/TaxErrorNotification/submit - Gửi thông báo đến CQT
 * 
 * @author EIMS Team
 * @created 2026-01-09
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'

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
 * Request payload cho preview
 */
export interface TaxErrorNotificationPreviewRequest {
  invoiceId: number
  place: string
  notificationType: ErrorNotificationType
  reason: string
}

/**
 * Response từ preview API
 */
export interface TaxErrorNotificationPreviewResponse {
  success: boolean
  message: string
  data: {
    notificationCode: string
    xml: string
    hash: string
    createdAt: string
  }
}

/**
 * Request payload cho submit
 */
export interface TaxErrorNotificationSubmitRequest {
  invoiceId: number
  notificationCode: string
  signature: string
  xml: string
}

/**
 * Response từ submit API
 */
export interface TaxErrorNotificationSubmitResponse {
  success: boolean
  message: string
  data: {
    notificationId: number
    notificationCode: string
    taxAuthorityResponse: string
    submittedAt: string
  }
}

// ==================== SERVICE ====================

const taxErrorNotificationService = {
  /**
   * STEP 1: Preview XML/Hash trước khi ký số
   * 
   * @param request - Preview request data
   * @returns Preview response với XML và Hash
   * 
   * @example
   * ```typescript
   * const preview = await taxErrorNotificationService.preview({
   *   invoiceId: 123,
   *   place: 'Hà Nội',
   *   notificationType: ErrorNotificationType.CANCEL,
   *   reason: 'Lỗi thông tin khách hàng'
   * })
   * ```
   */
  preview: async (
    request: TaxErrorNotificationPreviewRequest
  ): Promise<TaxErrorNotificationPreviewResponse> => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.post<TaxErrorNotificationPreviewResponse>(
        `${API_CONFIG.BASE_URL}/TaxErrorNotification/preview`,
        {
          invoiceId: request.invoiceId,
          place: request.place,
          notificationType: request.notificationType,
          reason: request.reason,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': '*/*',
          },
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể tạo preview thông báo')
      }

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
   * STEP 2: Submit thông báo sai sót đã ký số đến CQT
   * 
   * @param request - Submit request với signature
   * @returns Submit response từ CQT
   * 
   * @example
   * ```typescript
   * const result = await taxErrorNotificationService.submit({
   *   invoiceId: 123,
   *   notificationCode: 'TB04-0000001-1234567890',
   *   signature: 'ABC123...',
   *   xml: '<?xml version="1.0"?>...'
   * })
   * ```
   */
  submit: async (
    request: TaxErrorNotificationSubmitRequest
  ): Promise<TaxErrorNotificationSubmitResponse> => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.post<TaxErrorNotificationSubmitResponse>(
        `${API_CONFIG.BASE_URL}/TaxErrorNotification/submit`,
        {
          invoiceId: request.invoiceId,
          notificationCode: request.notificationCode,
          signature: request.signature,
          xml: request.xml,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': '*/*',
          },
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể gửi thông báo đến CQT')
      }

      return response.data
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Submit error:', error)
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Lỗi gửi CQT: ${errorMessage}`)
      }
      
      throw error
    }
  },

  /**
   * Lấy danh sách thông báo sai sót của 1 hóa đơn
   * 
   * @param invoiceId - ID hóa đơn
   * @returns Danh sách thông báo
   */
  getNotificationsByInvoice: async (invoiceId: number): Promise<unknown[]> => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/TaxErrorNotification/invoice/${invoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
          },
        }
      )

      return response.data.data || []
    } catch (error) {
      console.error('❌ [TaxErrorNotification] Get notifications error:', error)
      return []
    }
  },
}

export default taxErrorNotificationService
