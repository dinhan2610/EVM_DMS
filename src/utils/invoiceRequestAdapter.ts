/**
 * Invoice Request Adapter
 * 
 * Chuyển đổi giữa frontend InvoiceRequest types và backend API payload
 * 
 * ✅ Backend API yêu cầu 17 fields (không có requiredDate/priority)
 * ⚠️ salesID: Frontend gửi 0, backend OVERRIDE từ JWT token
 * ⚠️ accountantId: Frontend gửi null, backend set null
 */

import type { InvoiceRequest, InvoiceRequestItem } from '@/types/invoiceRequest.types'
import type { 
  BackendInvoiceRequestPayload, 
  BackendInvoiceRequestItem 
} from '@/services/invoiceService'

// ==================== FRONTEND TO BACKEND ====================

/**
 * Convert frontend InvoiceRequest to backend API payload
 * 
 * @param request - Frontend invoice request data
 * @returns Backend API payload (17 fields)
 * 
 * @example
 * const frontendData = {
 *   customer: { customerID: 123, ... },
 *   items: [{ itemName: 'Product A', ... }],
 *   totalAmount: 10000000
 * }
 * 
 * const payload = mapFrontendRequestToBackendPayload(frontendData)
 * // => { customerID: 123, salesID: 0, accountantId: null, items: [...], ... }
 */
export const mapFrontendRequestToBackendPayload = (
  request: Partial<InvoiceRequest>
): BackendInvoiceRequestPayload => {
  // Map items
  const backendItems: BackendInvoiceRequestItem[] = (request.items || []).map(item => ({
    productId: 0,                        // Default 0 nếu không có ID sản phẩm
    productName: item.itemName,
    unit: item.unit,
    quantity: item.quantity,
    amount: item.amount,                 // Thành tiền chưa VAT
    vatAmount: item.taxAmount,           // Tiền VAT
  }))

  // Build payload - 17 fields (salesID auto from backend token)
  return {
    accountantId: null,                  // NULL = chưa assign accountant
    // ❌ REMOVED: salesID - Backend tự extract từ JWT token claim "sub"
    customerID: request.customer?.customerID || 0,
    taxCode: request.customer?.taxCode || '',
    customerName: request.customer?.customerName || '',
    address: request.customer?.address || '',
    notes: request.notes || '',
    paymentMethod: request.customer?.paymentMethod || 'Tiền mặt',
    items: backendItems,
    amount: request.subtotal || 0,       // Tổng chưa VAT
    taxAmount: request.totalTax || 0,    // Tổng VAT
    totalAmount: request.totalAmount || 0, // Tổng thanh toán
    invoiceCustomerType: 2,              // ✅ Default: 2=Business/Doanh nghiệp (B2B)
    minRows: 5,                          // Default 5 dòng trống
    contactEmail: request.customer?.email || '',
    contactPerson: request.customer?.contactPerson || '',
    contactPhone: request.customer?.phone || '',
    companyID: 1,                        // Default companyID = 1
  }
}

/**
 * Validate backend payload before sending
 * 
 * @param payload - Backend API payload
 * @returns { isValid: boolean, errors: string[] }
 */
export const validateBackendPayload = (
  payload: BackendInvoiceRequestPayload
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Required fields validation
  if (!payload.customerName || payload.customerName.trim() === '') {
    errors.push('Tên khách hàng không được để trống')
  }

  if (!payload.taxCode || payload.taxCode.trim() === '') {
    errors.push('Mã số thuế không được để trống')
  }

  if (!payload.address || payload.address.trim() === '') {
    errors.push('Địa chỉ không được để trống')
  }

  if (!payload.items || payload.items.length === 0) {
    errors.push('Phải có ít nhất 1 sản phẩm/dịch vụ')
  }

  // Amounts validation
  if (payload.totalAmount <= 0) {
    errors.push('Tổng tiền phải lớn hơn 0')
  }

  if (payload.amount < 0) {
    errors.push('Tổng tiền hàng không được âm')
  }

  if (payload.taxAmount < 0) {
    errors.push('Tiền thuế không được âm')
  }

  // Check totals match
  const calculatedTotal = payload.amount + payload.taxAmount
  if (Math.abs(calculatedTotal - payload.totalAmount) > 1) { // Allow 1 VND rounding difference
    errors.push(`Tổng tiền không khớp: ${payload.amount} + ${payload.taxAmount} ≠ ${payload.totalAmount}`)
  }

  // Items validation
  payload.items.forEach((item, index) => {
    if (!item.productName || item.productName.trim() === '') {
      errors.push(`Sản phẩm ${index + 1}: Tên không được để trống`)
    }

    if (item.quantity <= 0) {
      errors.push(`Sản phẩm ${index + 1}: Số lượng phải lớn hơn 0`)
    }

    if (item.amount < 0) {
      errors.push(`Sản phẩm ${index + 1}: Thành tiền không được âm`)
    }

    if (item.vatAmount < 0) {
      errors.push(`Sản phẩm ${index + 1}: Tiền VAT không được âm`)
    }
  })

  // Critical checks
  if (payload.salesID !== 0) {
    errors.push('⚠️ salesID phải = 0 (backend sẽ override từ JWT)')
  }

  if (payload.accountantId !== null) {
    errors.push('⚠️ accountantId phải = null (chưa assign)')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate item totals (amount + VAT)
 * 
 * @param items - Frontend invoice request items
 * @returns { subtotal, totalTax, totalAmount }
 */
export const calculateRequestTotals = (items: InvoiceRequestItem[]): {
  subtotal: number
  totalTax: number
  totalAmount: number
} => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0)
  const totalAmount = subtotal + totalTax

  return {
    subtotal,
    totalTax,
    totalAmount,
  }
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format date for display
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Format datetime for display
 */
export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  
  try {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

// ==================== EXAMPLE USAGE ====================

/*
// Create new invoice request
const newRequest: Partial<InvoiceRequest> = {
  customer: {
    customerID: 123,
    customerName: 'Công ty ABC',
    taxCode: '0123456789',
    address: 'Hà Nội',
    email: 'abc@example.com',
    phone: '0901234567',
    contactPerson: 'Nguyễn Văn A',
    paymentMethod: 'Chuyển khoản',
  },
  items: [
    {
      itemID: 1,
      itemName: 'Laptop Dell',
      quantity: 2,
      unitPrice: 15000000,
      unit: 'chiếc',
      taxRate: 10,
      amount: 30000000,
      taxAmount: 3000000,
      totalAmount: 33000000,
    }
  ],
  subtotal: 30000000,
  totalTax: 3000000,
  totalAmount: 33000000,
  notes: 'Giao hàng trong tuần',
}

// Convert to backend payload
const payload = mapFrontendRequestToBackendPayload(newRequest)

// Validate before sending
const validation = validateBackendPayload(payload)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
} else {
  // Send to API
  await createInvoiceRequest(payload)
}
*/
