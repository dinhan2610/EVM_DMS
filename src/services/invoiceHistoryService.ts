// src/services/invoiceHistoryService.ts

import axios from 'axios'
import API_CONFIG from '@/config/api.config'

// ============================
// INTERFACES
// ============================

export interface InvoiceHistory {
  historyID: number
  invoiceID: number
  actionType: string
  date: string
  performedBy: number | null
  performerName: string
  referenceInvoiceID: number | null
  referenceInvoiceNumber: string | null
}

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  if (!token) {
    throw new Error('No authentication token found. Please login again.')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Handle API errors consistently
 */
const handleApiError = (error: unknown, context: string): never => {
  console.error(`[${context}] Error:`, error)

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.detail || error.response?.data?.message || error.message

    if (status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY)
      window.location.href = '/auth/sign-in'
      throw new Error('Session expired. Please login again.')
    }

    throw new Error(`${context}: ${message}`)
  }

  throw error
}

/**
 * Map action type to Vietnamese label
 */
export const getActionTypeLabel = (actionType: string): string => {
  const labels: Record<string, string> = {
    Created: 'Tạo hóa đơn',
    Issued: 'Phát hành',
    Signed: 'Ký số',
    CqtAccepted: 'CQT chấp nhận',
    CqtRejected: 'CQT từ chối',
    Replaced: 'Thay thế',
    Adjusted: 'Điều chỉnh',
    Cancelled: 'Hủy',
    SentForApproval: 'Gửi duyệt',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối duyệt',
    'Manual Status Update': 'Cập nhật trạng thái',
    EmailSent: 'Gửi email',
  }
  return labels[actionType] || actionType
}

/**
 * Get action type color
 */
export const getActionTypeColor = (actionType: string): 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'grey' => {
  const colors: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'grey'> = {
    Created: 'info',
    Issued: 'success',
    Signed: 'success',
    CqtAccepted: 'success',
    CqtRejected: 'error',
    Replaced: 'warning',
    Adjusted: 'warning',
    Cancelled: 'error',
    SentForApproval: 'info',
    Approved: 'success',
    Rejected: 'error',
    'Manual Status Update': 'grey',
    EmailSent: 'info',
  }
  return colors[actionType] || 'grey'
}

/**
 * Map performer name to Vietnamese
 * Xử lý các trường hợp tên hệ thống tự động
 */
export const getPerformerNameVietnamese = (performerName: string | null | undefined): string => {
  if (!performerName) return 'Hệ thống'

  const systemNames: Record<string, string> = {
    'System/Auto': 'Hệ thống tự động',
    System: 'Hệ thống',
    Auto: 'Tự động',
    system: 'Hệ thống',
    auto: 'Tự động',
    SYSTEM: 'Hệ thống',
    AUTO: 'Tự động',
    'System/auto': 'Hệ thống tự động',
    'system/auto': 'Hệ thống tự động',
    'N/A': 'Không xác định',
    Unknown: 'Không xác định',
    null: 'Hệ thống',
    '': 'Hệ thống',
  }

  // Kiểm tra exact match trước
  if (systemNames[performerName]) {
    return systemNames[performerName]
  }

  // Kiểm tra nếu chứa System hoặc Auto (case insensitive)
  const lowerName = performerName.toLowerCase().trim()
  if (lowerName.includes('system') && lowerName.includes('auto')) {
    return 'Hệ thống tự động'
  }
  if (lowerName === 'system' || lowerName.startsWith('system/') || lowerName.startsWith('system ')) {
    return 'Hệ thống'
  }
  if (lowerName === 'auto' || lowerName.startsWith('auto/') || lowerName.startsWith('auto ')) {
    return 'Tự động'
  }

  // Trả về tên gốc nếu không phải tên hệ thống
  return performerName
}

// ============================
// API FUNCTIONS
// ============================

/**
 * Get invoice history by invoice ID
 * GET /api/InvoiceHistory/by-invoice/{invoiceId}
 */
export const getInvoiceHistory = async (invoiceId: number): Promise<InvoiceHistory[]> => {
  try {
    console.log('[getInvoiceHistory] Fetching history for invoice:', invoiceId)

    const response = await axios.get<InvoiceHistory[]>(`/api/InvoiceHistory/by-invoice/${invoiceId}`, { headers: getAuthHeaders() })

    console.log('[getInvoiceHistory] Success:', response.data)
    return response.data
  } catch (error) {
    return handleApiError(error, 'getInvoiceHistory')
  }
}

// ============================
// EXPORT DEFAULT SERVICE
// ============================

const invoiceHistoryService = {
  getInvoiceHistory,
  getActionTypeLabel,
  getActionTypeColor,
  getPerformerNameVietnamese,
}

export default invoiceHistoryService
