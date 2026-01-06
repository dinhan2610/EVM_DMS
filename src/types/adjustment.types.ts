/**
 * @fileoverview Invoice Adjustment & Replacement Types and Enums
 * @description Định nghĩa types cho nghiệp vụ điều chỉnh và thay thế hóa đơn
 * Tuân thủ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC
 */

// ============================================================================
// ADJUSTMENT TYPES (Hóa đơn Điều chỉnh)
// ============================================================================

/**
 * Loại điều chỉnh hóa đơn
 * Backend sử dụng enum số (0, 1)
 * 
 * 🔍 PHÂN TÍCH ENUM MAPPING:
 * 
 * Có 2 khả năng:
 * 
 * **Option 1: INCREASE = 0, DECREASE = 1** ✅ KHUYẾN NGHỊ
 * - Lý do: Điều chỉnh TĂNG là case phổ biến hơn trong thực tế
 *   (thiếu hàng, sót items, quên tính phí)
 * - Convention: Value default/common case thường là 0
 * - Logic business: Positive action trước, negative sau
 * 
 * **Option 2: DECREASE = 0, INCREASE = 1**
 * - Lý do: Theo thứ tự alphabet (D trước I)
 * - Ít phổ biến hơn trong business logic
 * 
 * 📌 IMPLEMENTATION: Dùng Option 1 (INCREASE=0) cho đến khi backend confirm khác
 * Nếu backend mapping ngược lại, chỉ cần đổi giá trị enum, logic không đổi.
 */
export enum AdjustmentType {
  /**
   * Điều chỉnh TĂNG giá trị
   * Value: 0 (default/most common case)
   * 
   * Use cases:
   * - Thiếu sản phẩm trong hóa đơn gốc
   * - Tăng số lượng do nhầm lẫn
   * - Tăng đơn giá do thỏa thuận sau
   * - Thêm phí phát sinh (vận chuyển, lắp đặt, bảo hành)
   * - Bổ sung dịch vụ kèm theo
   */
  INCREASE = 0,
  
  /**
   * Điều chỉnh GIẢM giá trị
   * Value: 1
   * 
   * Use cases:
   * - Nhập nhầm số lượng (nhiều hơn thực tế)
   * - Giảm giá sau khi phát hành
   * - Chiết khấu bổ sung
   * - Trả lại hàng một phần
   * - Điều chỉnh đơn giá sai
   */
  DECREASE = 1,
}

/**
 * Label hiển thị cho từng loại điều chỉnh
 */
export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  [AdjustmentType.INCREASE]: 'Điều chỉnh TĂNG giá trị',
  [AdjustmentType.DECREASE]: 'Điều chỉnh GIẢM giá trị',
}

/**
 * Icon cho từng loại điều chỉnh (MUI icon name)
 */
export const ADJUSTMENT_TYPE_ICONS: Record<AdjustmentType, string> = {
  [AdjustmentType.INCREASE]: 'TrendingUp',
  [AdjustmentType.DECREASE]: 'TrendingDown',
}

/**
 * Color cho từng loại điều chỉnh
 */
export const ADJUSTMENT_TYPE_COLORS: Record<AdjustmentType, 'success' | 'error'> = {
  [AdjustmentType.INCREASE]: 'success',
  [AdjustmentType.DECREASE]: 'error',
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Adjustment Item - Dòng sản phẩm điều chỉnh
 */
export interface AdjustmentItemRequest {
  productID: number
  quantity: number        // Có thể âm nếu giảm
  unitPrice: number
  overrideVATRate?: number // Optional: Ghi đè thuế suất VAT
}

/**
 * Adjustment Request - Payload gửi lên backend
 */
export interface AdjustmentInvoiceRequest {
  originalInvoiceId: number
  performedBy: number         // User ID thực hiện điều chỉnh
  adjustmentType: AdjustmentType // 0 = INCREASE, 1 = DECREASE
  adjustmentReason: string
  adjustmentItems: AdjustmentItemRequest[]
}

/**
 * Adjustment Response - Kết quả trả về từ backend
 */
export interface AdjustmentInvoiceResponse {
  success: boolean
  data: {
    adjustmentId: number
    adjustmentNumber: string        // VD: "INV-001-ADJ-001"
    originalInvoiceId: number
    originalInvoiceNumber: string
    adjustmentType: AdjustmentType
    
    // Financial summary
    originalSubtotal: number
    originalVatAmount: number
    originalTotalAmount: number
    
    adjustmentSubtotal: number
    adjustmentVatAmount: number
    adjustmentTotalAmount: number
    
    finalSubtotal: number
    finalVatAmount: number
    finalTotalAmount: number
    
    createdAt: string
  }
  message?: string
}

// ============================================================================
// REPLACEMENT TYPES (Hóa đơn Thay thế)
// ============================================================================

/**
 * Replacement Item - Dòng sản phẩm trong hóa đơn thay thế
 */
export interface ReplacementItemRequest {
  productID: number
  quantity: number
  unitPrice: number
  overrideVATRate?: number
}

/**
 * Replacement Request - Payload gửi lên backend
 */
export interface ReplacementInvoiceRequest {
  originalInvoiceId: number
  performedBy: number
  reason: string
  customerId: number          // Cho phép đổi khách hàng
  note: string
  items: ReplacementItemRequest[]
}

/**
 * Replacement Response - Kết quả trả về từ backend
 */
export interface ReplacementInvoiceResponse {
  success: boolean
  data: {
    newInvoiceId: number
    newInvoiceNumber: string
    originalInvoiceId: number
    originalInvoiceNumber: string
    originalInvoiceStatus: 'CANCELLED' // Hóa đơn gốc bị hủy
    createdAt: string
  }
  message?: string
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Lấy label hiển thị cho adjustment type
 */
export const getAdjustmentTypeLabel = (type: AdjustmentType): string => {
  return ADJUSTMENT_TYPE_LABELS[type]
}

/**
 * Lấy color cho adjustment type
 */
export const getAdjustmentTypeColor = (type: AdjustmentType): 'success' | 'error' => {
  return ADJUSTMENT_TYPE_COLORS[type]
}

/**
 * Format số tiền điều chỉnh với dấu +/-
 */
export const formatAdjustmentAmount = (amount: number, type: AdjustmentType): string => {
  const prefix = type === AdjustmentType.INCREASE ? '+' : '-'
  const absAmount = Math.abs(amount)
  return `${prefix}${absAmount.toLocaleString('vi-VN')} ₫`
}

/**
 * Kiểm tra hóa đơn có thể điều chỉnh không
 */
export const canAdjustInvoice = (invoiceStatus: string): boolean => {
  // Chỉ điều chỉnh được hóa đơn đã phát hành
  return invoiceStatus === 'ISSUED' || invoiceStatus === 'Đã phát hành'
}

/**
 * Kiểm tra hóa đơn có thể thay thế không
 */
export const canReplaceInvoice = (invoiceStatus: string, isReplaced: boolean): boolean => {
  // Chỉ thay thế được hóa đơn đã phát hành và chưa bị thay thế
  const isIssued = invoiceStatus === 'ISSUED' || invoiceStatus === 'Đã phát hành'
  return isIssued && !isReplaced
}
