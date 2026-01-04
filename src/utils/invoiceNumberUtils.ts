/**
 * Invoice Number Utilities
 * 
 * Các hàm tiện ích để xử lý và format số hóa đơn
 */

/**
 * Format invoice number để hiển thị
 * 
 * @param invoiceNumber - Số hóa đơn (0 = chưa cấp số)
 * @param isDraft - Có phải hóa đơn nháp không
 * @returns String đã format
 * 
 * @example
 * formatInvoiceNumber(0, true) // "<Chưa cấp số>"
 * formatInvoiceNumber(123, false) // "0000123"
 * formatInvoiceNumber(12345, false) // "0012345"
 */
export function formatInvoiceNumber(invoiceNumber: number, isDraft: boolean = false): string {
  // Nếu là nháp hoặc số = 0 → chưa cấp số
  if (isDraft || invoiceNumber === 0) {
    return '<Chưa cấp số>'
  }
  
  // Format với leading zeros (7 chữ số)
  return invoiceNumber.toString().padStart(7, '0')
}

/**
 * Parse invoice number từ string sang number
 * 
 * @param invoiceNumberStr - String số hóa đơn
 * @returns Number hoặc 0 nếu invalid
 * 
 * @example
 * parseInvoiceNumber("0000123") // 123
 * parseInvoiceNumber("<Chưa cấp số>") // 0
 */
export function parseInvoiceNumber(invoiceNumberStr: string): number {
  if (!invoiceNumberStr || invoiceNumberStr === '<Chưa cấp số>') {
    return 0
  }
  
  const parsed = parseInt(invoiceNumberStr.replace(/^0+/, ''), 10)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Kiểm tra xem hóa đơn đã được cấp số chưa
 * 
 * @param invoiceNumber - Số hóa đơn
 * @returns true nếu đã cấp số, false nếu chưa
 * 
 * @example
 * hasInvoiceNumber(0) // false
 * hasInvoiceNumber(123) // true
 */
export function hasInvoiceNumber(invoiceNumber: number): boolean {
  return invoiceNumber > 0
}

/**
 * Tạo invoice display string với serial number
 * 
 * @param serial - Ký hiệu (VD: "1K24TXN")
 * @param invoiceNumber - Số hóa đơn
 * @param isDraft - Có phải nháp không
 * @returns Full invoice number string
 * 
 * @example
 * getFullInvoiceNumber("1K24TXN", 123, false) // "1K24TXN - 0000123"
 * getFullInvoiceNumber("1K24TXN", 0, true) // "1K24TXN - <Chưa cấp số>"
 */
export function getFullInvoiceNumber(
  serial: string, 
  invoiceNumber: number, 
  isDraft: boolean = false
): string {
  const formattedNumber = formatInvoiceNumber(invoiceNumber, isDraft)
  return `${serial} - ${formattedNumber}`
}

/**
 * Validate invoice number format
 * 
 * @param invoiceNumber - Số hóa đơn cần validate
 * @returns Object { isValid, error }
 * 
 * @example
 * validateInvoiceNumber(123) // { isValid: true, error: null }
 * validateInvoiceNumber(-1) // { isValid: false, error: "Số hóa đơn không hợp lệ" }
 */
export function validateInvoiceNumber(invoiceNumber: number): { 
  isValid: boolean
  error: string | null 
} {
  if (typeof invoiceNumber !== 'number') {
    return {
      isValid: false,
      error: 'Số hóa đơn phải là số'
    }
  }
  
  if (invoiceNumber < 0) {
    return {
      isValid: false,
      error: 'Số hóa đơn không được âm'
    }
  }
  
  if (invoiceNumber > 9999999) {
    return {
      isValid: false,
      error: 'Số hóa đơn vượt quá giới hạn (7 chữ số)'
    }
  }
  
  return {
    isValid: true,
    error: null
  }
}

export default {
  formatInvoiceNumber,
  parseInvoiceNumber,
  hasInvoiceNumber,
  getFullInvoiceNumber,
  validateInvoiceNumber,
}
