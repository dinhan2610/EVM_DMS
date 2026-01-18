/**
 * Invoice Request Types
 * Định nghĩa types cho tính năng Quản lý yêu cầu xuất hóa đơn từ Sale
 */

// ==================== ENUMS ====================

/**
 * Trạng thái yêu cầu xuất hóa đơn
 */
export enum InvoiceRequestStatus {
  PENDING = 1,      // Chờ duyệt
  APPROVED = 2,     // Đã duyệt - Chờ kế toán tạo HĐ
  REJECTING = 3,    // Đang từ chối
  CANCELLED = 4,    // Đã hủy bởi Sale
  COMPLETED = 5,    // Hoàn thành - Đã xuất HĐ
}

/**
 * Mức độ ưu tiên
 */
export enum RequestPriority {
  LOW = 1,      // Thấp
  MEDIUM = 2,   // Trung bình
  HIGH = 3,     // Cao
  URGENT = 4,   // Khẩn cấp
}

/**
 * Loại yêu cầu
 */
export enum RequestType {
  NEW_INVOICE = 1,           // Tạo HĐ mới
  ADJUSTMENT_REQUEST = 2,    // Yêu cầu điều chỉnh
  REPLACEMENT_REQUEST = 3,   // Yêu cầu thay thế
}

// ==================== INTERFACES ====================

/**
 * Thông tin sản phẩm/dịch vụ trong yêu cầu
 */
export interface InvoiceRequestItem {
  itemID: number
  itemName: string           // Tên sản phẩm/dịch vụ
  itemDescription?: string   // Mô tả chi tiết
  quantity: number           // Số lượng
  unitPrice: number          // Đơn giá
  unit: string              // Đơn vị tính (cái, chiếc, gói, etc.)
  taxRate: number           // Thuế suất (%, ví dụ: 10, 8, 5, 0)
  discount?: number         // Giảm giá (%)
  amount: number            // Thành tiền (quantity * unitPrice * (1 - discount/100))
  taxAmount: number         // Tiền thuế
  totalAmount: number       // Tổng cộng (amount + taxAmount)
}

/**
 * Thông tin Sale tạo yêu cầu
 */
export interface SaleInfo {
  saleID: number
  saleName: string
  saleEmail: string
  salePhone?: string
  department?: string      // Phòng ban
  salesTeam?: string      // Nhóm Sales
}

/**
 * Thông tin khách hàng trong yêu cầu
 */
export interface CustomerInfo {
  customerID: number
  customerName: string
  taxCode: string
  address: string
  email?: string
  phone?: string
  contactPerson?: string    // Người liên hệ
  paymentMethod?: string   // Phương thức thanh toán
  paymentTerm?: string     // Điều kiện thanh toán (ví dụ: "30 ngày", "COD")
}

/**
 * Interface chính: Invoice Request
 */
export interface InvoiceRequest {
  // Basic Info
  requestID: number
  requestCode: string        // Mã yêu cầu (REQ-2024-001)
  requestType: RequestType
  
  // Status & Priority
  statusID: InvoiceRequestStatus
  statusName: string
  priority: RequestPriority
  
  // Dates
  requestDate: string        // Ngày tạo yêu cầu (ISO string)
  requiredDate?: string      // Ngày yêu cầu xuất HĐ (ISO string)
  approvedDate?: string      // Ngày duyệt
  completedDate?: string     // Ngày hoàn thành
  
  // People
  requestedBy: SaleInfo      // Sale tạo yêu cầu
  approvedBy?: {             // KTT duyệt
    userID: number
    userName: string
    approvedAt: string
  }
  processedBy?: {            // KT xử lý
    userID: number
    userName: string
    processedAt: string
  }
  
  // Customer & Items
  customer: CustomerInfo
  items: InvoiceRequestItem[]
  
  // Amounts
  subtotal: number          // Tổng tiền hàng (trước thuế)
  totalTax: number          // Tổng tiền thuế
  totalDiscount: number     // Tổng giảm giá
  totalAmount: number       // Tổng cộng (sau thuế)
  
  // Additional Info
  notes?: string            // Ghi chú từ Sale
  internalNotes?: string    // Ghi chú nội bộ (KT, KTT)
  attachments?: string[]    // File đính kèm (URLs)
  rejectionReason?: string  // Lý do từ chối
  
  // Related Invoice
  invoiceID?: number        // ID hóa đơn đã tạo (nếu completed)
  invoiceNumber?: string    // Số hóa đơn đã tạo
  
  // Original Request (for adjustment/replacement)
  originalRequestID?: number
  originalInvoiceID?: number
}

/**
 * Filter state cho Invoice Request list
 */
export interface InvoiceRequestFilterState {
  searchText: string                    // Search trong mã yêu cầu, tên KH, Sale
  dateFrom: Date | null                 // Từ ngày
  dateTo: Date | null                   // Đến ngày
  status: InvoiceRequestStatus[]        // Multi-select status
  priority: RequestPriority[]           // Multi-select priority
  requestType: RequestType[]            // Multi-select type
  saleID: number | null                 // Filter theo Sale
  customerID: number | null             // Filter theo khách hàng
  amountFrom: string                    // Số tiền từ
  amountTo: string                      // Số tiền đến
}

// ==================== CONSTANTS ====================

/**
 * Status labels
 */
export const REQUEST_STATUS_LABELS: Record<InvoiceRequestStatus, string> = {
  [InvoiceRequestStatus.PENDING]: 'Chờ duyệt',
  [InvoiceRequestStatus.APPROVED]: 'Đã duyệt',
  [InvoiceRequestStatus.REJECTING]: 'Đang từ chối',
  [InvoiceRequestStatus.CANCELLED]: 'Đã hủy',
  [InvoiceRequestStatus.COMPLETED]: 'Hoàn thành',
}

/**
 * Priority labels
 */
export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  [RequestPriority.LOW]: 'Thấp',
  [RequestPriority.MEDIUM]: 'Trung bình',
  [RequestPriority.HIGH]: 'Cao',
  [RequestPriority.URGENT]: 'Khẩn cấp',
}

/**
 * Request type labels
 */
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.NEW_INVOICE]: 'Tạo HĐ mới',
  [RequestType.ADJUSTMENT_REQUEST]: 'Điều chỉnh HĐ',
  [RequestType.REPLACEMENT_REQUEST]: 'Thay thế HĐ',
}

// ==================== COLOR HELPERS ====================

/**
 * Get color for status badges
 */
export const getRequestStatusColor = (status: InvoiceRequestStatus): 'default' | 'warning' | 'success' | 'error' | 'info' => {
  switch (status) {
    case InvoiceRequestStatus.PENDING:
      return 'warning'      // Vàng - chờ xử lý
    case InvoiceRequestStatus.APPROVED:
      return 'info'         // Xanh dương - đã duyệt
    case InvoiceRequestStatus.REJECTING:
      return 'error'        // Đỏ - đang từ chối
    case InvoiceRequestStatus.CANCELLED:
      return 'default'      // Xám - đã hủy
    case InvoiceRequestStatus.COMPLETED:
      return 'success'      // Xanh lá - hoàn thành
    default:
      return 'default'
  }
}

/**
 * Get color for priority badges
 */
export const getPriorityColor = (priority: RequestPriority): 'default' | 'warning' | 'error' | 'success' => {
  switch (priority) {
    case RequestPriority.LOW:
      return 'success'      // Xanh lá - thấp
    case RequestPriority.MEDIUM:
      return 'default'      // Xám - trung bình
    case RequestPriority.HIGH:
      return 'warning'      // Vàng - cao
    case RequestPriority.URGENT:
      return 'error'        // Đỏ - khẩn cấp
    default:
      return 'default'
  }
}

/**
 * Get icon for priority
 */
export const getPriorityIcon = (priority: RequestPriority): string => {
  switch (priority) {
    case RequestPriority.LOW:
      return '🟢'
    case RequestPriority.MEDIUM:
      return '🟡'
    case RequestPriority.HIGH:
      return '🟠'
    case RequestPriority.URGENT:
      return '🔴'
    default:
      return '⚪'
  }
}
