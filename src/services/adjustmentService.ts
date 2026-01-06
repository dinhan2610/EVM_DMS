/**
 * @fileoverview Adjustment & Replacement Service
 * @description API calls cho nghiệp vụ điều chỉnh và thay thế hóa đơn
 * Tuân thủ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'
import type {
  AdjustmentInvoiceRequest,
  AdjustmentInvoiceResponse,
  ReplacementInvoiceRequest,
  ReplacementInvoiceResponse,
} from '@/types/adjustment.types'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getAuthToken = (): string | null => {
  return localStorage.getItem(API_CONFIG.TOKEN_KEY)
}

const getAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('No authentication token found. Please login again.')
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

const handleApiError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const errorData = error.response?.data

    console.error(`[${context}] API Error:`, {
      status,
      statusText: error.response?.statusText,
      data: errorData,
    })

    // Xử lý các lỗi phổ biến
    if (status === 400) {
      const message = errorData?.message || errorData?.title || 'Yêu cầu không hợp lệ'
      const errors = errorData?.errors || []
      
      if (Array.isArray(errors) && errors.length > 0) {
        throw new Error(`${message}: ${errors.join(', ')}`)
      }
      throw new Error(message)
    }
    if (status === 401) {
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
    }
    if (status === 403) {
      throw new Error('Bạn không có quyền thực hiện thao tác này.')
    }
    if (status === 404) {
      throw new Error('Không tìm thấy hóa đơn.')
    }
    if (status === 409) {
      throw new Error('Hóa đơn không ở trạng thái cho phép điều chỉnh/thay thế.')
    }
    if (status === 500) {
      throw new Error('Lỗi hệ thống. Vui lòng thử lại sau.')
    }

    throw new Error(errorData?.message || `${context} thất bại`)
  }

  // Non-axios error
  if (error instanceof Error) {
    throw error
  }

  throw new Error(`${context} thất bại`)
}

// ============================================================================
// ADJUSTMENT API (Hóa đơn Điều chỉnh)
// ============================================================================

/**
 * Tạo hóa đơn điều chỉnh
 * API: POST /api/Invoice/adjustment
 * 
 * ⚠️ QUY TẮC NGHIỆP VỤ:
 * 1. Chỉ điều chỉnh được hóa đơn đã phát hành (status = ISSUED)
 * 2. KHÔNG ĐƯỢC thay đổi thông tin khách hàng
 * 3. Chỉ điều chỉnh: Số lượng, Đơn giá, Thuế suất
 * 4. Hóa đơn gốc VẪN CÓ HIỆU LỰC
 * 5. Giá trị cuối = Hóa đơn gốc + Hóa đơn điều chỉnh
 * 
 * @param request - Dữ liệu điều chỉnh
 * @returns Response chứa thông tin hóa đơn điều chỉnh mới
 */
export const createAdjustmentInvoice = async (
  request: AdjustmentInvoiceRequest
): Promise<AdjustmentInvoiceResponse> => {
  try {
    console.log('[createAdjustmentInvoice] Request:', JSON.stringify(request, null, 2))

    // Validation
    if (!request.adjustmentReason || request.adjustmentReason.trim().length < 10) {
      throw new Error('Lý do điều chỉnh phải có ít nhất 10 ký tự')
    }

    if (!request.adjustmentItems || request.adjustmentItems.length === 0) {
      throw new Error('Phải có ít nhất 1 sản phẩm điều chỉnh')
    }

    // Call API
    const response = await axios.post<AdjustmentInvoiceResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE.ADJUSTMENT}`,
      request,
      { headers: getAuthHeaders() }
    )

    console.log('[createAdjustmentInvoice] ✅ Success:', response.data)
    return response.data
  } catch (error) {
    return handleApiError(error, 'Tạo hóa đơn điều chỉnh')
  }
}

/**
 * Lấy danh sách hóa đơn điều chỉnh của một hóa đơn gốc
 * API: GET /api/Invoice/{id}/adjustments (giả định)
 * 
 * @param originalInvoiceId - ID hóa đơn gốc
 * @returns Danh sách các hóa đơn điều chỉnh
 */
export const getAdjustmentsByInvoice = async (
  originalInvoiceId: number
): Promise<AdjustmentInvoiceResponse[]> => {
  try {
    console.log(`[getAdjustmentsByInvoice] Getting adjustments for invoice ${originalInvoiceId}`)

    const response = await axios.get<AdjustmentInvoiceResponse[]>(
      `${API_CONFIG.BASE_URL}/api/Invoice/${originalInvoiceId}/adjustments`,
      { headers: getAuthHeaders() }
    )

    console.log(`[getAdjustmentsByInvoice] ✅ Found ${response.data.length} adjustments`)
    return response.data
  } catch (error) {
    // Nếu 404, trả về mảng rỗng (chưa có điều chỉnh)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('[getAdjustmentsByInvoice] No adjustments found')
      return []
    }
    return handleApiError(error, 'Lấy danh sách hóa đơn điều chỉnh')
  }
}

// ============================================================================
// REPLACEMENT API (Hóa đơn Thay thế)
// ============================================================================

/**
 * Tạo hóa đơn thay thế
 * API: POST /api/Invoice/replacement
 * 
 * ⚠️ QUY TẮC NGHIỆP VỤ:
 * 1. Chỉ thay thế được hóa đơn đã phát hành (status = ISSUED)
 * 2. Hóa đơn gốc chưa được thay thế trước đó
 * 3. CHO PHÉP thay đổi toàn bộ thông tin (khách hàng, items, giá trị)
 * 4. Hóa đơn gốc BỊ HỦY BỎ (không còn hiệu lực)
 * 5. Hóa đơn thay thế là hóa đơn MỚI hoàn toàn
 * 
 * @param request - Dữ liệu thay thế
 * @returns Response chứa thông tin hóa đơn thay thế mới
 */
export const createReplacementInvoice = async (
  request: ReplacementInvoiceRequest
): Promise<ReplacementInvoiceResponse> => {
  try {
    console.log('[createReplacementInvoice] Request:', JSON.stringify(request, null, 2))

    // Validation
    if (!request.reason || request.reason.trim().length < 20) {
      throw new Error('Lý do thay thế phải có ít nhất 20 ký tự')
    }

    if (!request.items || request.items.length === 0) {
      throw new Error('Phải có ít nhất 1 sản phẩm trong hóa đơn thay thế')
    }

    if (!request.customerId) {
      throw new Error('Phải chọn khách hàng cho hóa đơn thay thế')
    }

    // Call API
    const response = await axios.post<ReplacementInvoiceResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE.REPLACEMENT}`,
      request,
      { headers: getAuthHeaders() }
    )

    console.log('[createReplacementInvoice] ✅ Success:', response.data)
    return response.data
  } catch (error) {
    return handleApiError(error, 'Tạo hóa đơn thay thế')
  }
}

/**
 * Kiểm tra hóa đơn đã được thay thế chưa
 * API: GET /api/Invoice/{id}/replacement-status (giả định)
 * 
 * @param originalInvoiceId - ID hóa đơn gốc
 * @returns Thông tin thay thế nếu có
 */
export const getReplacementStatus = async (
  originalInvoiceId: number
): Promise<ReplacementInvoiceResponse | null> => {
  try {
    console.log(`[getReplacementStatus] Checking replacement status for invoice ${originalInvoiceId}`)

    const response = await axios.get<ReplacementInvoiceResponse>(
      `${API_CONFIG.BASE_URL}/api/Invoice/${originalInvoiceId}/replacement-status`,
      { headers: getAuthHeaders() }
    )

    console.log('[getReplacementStatus] ✅ Replacement found:', response.data)
    return response.data
  } catch (error) {
    // Nếu 404, trả về null (chưa bị thay thế)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('[getReplacementStatus] Invoice not replaced')
      return null
    }
    return handleApiError(error, 'Kiểm tra trạng thái thay thế')
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const adjustmentService = {
  // Adjustment APIs
  createAdjustmentInvoice,
  getAdjustmentsByInvoice,

  // Replacement APIs
  createReplacementInvoice,
  getReplacementStatus,
}

export default adjustmentService
