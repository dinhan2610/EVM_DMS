/**
 * Statement Types - API Response Types for Statement Management
 * 
 * Based on API Documentation:
 * - GET /api/Statement (List with pagination)
 * - GET /api/Statement/{id} (Detail with productSummaries and invoices)
 * - GET /api/Statement/{id}/export-pdf (Export PDF)
 */

// ==================== LIST API TYPES ====================

/**
 * Statement List Item - Single statement in list view
 * API: GET /api/Statement
 */
export interface StatementListItem {
  statementID: number;              // ID bảng kê
  statementCode: string;            // Mã bảng kê (VD: "BK202512-0002")
  customerName: string;             // Tên khách hàng
  statementDate: string;            // Ngày bảng kê (ISO format: "2025-12-11T00:00:00")
  totalAmount: number;              // Tổng tiền
  totalInvoices: number;            // Số lượng hóa đơn
  status: string;                   // Trạng thái (VD: "Partially Paid", "Unpaid", "Paid")
}

/**
 * Statement List Response with Pagination
 * API: GET /api/Statement?pageIndex={page}
 */
export interface StatementListResponse {
  items: StatementListItem[];       // Danh sách bảng kê
  pageIndex: number;                // Trang hiện tại (1-based)
  totalPages: number;               // Tổng số trang
  totalCount: number;               // Tổng số bản ghi
  hasPreviousPage: boolean;         // Có trang trước không
  hasNextPage: boolean;             // Có trang sau không
}

// ==================== DETAIL API TYPES ====================

/**
 * Product Summary - Chi tiết sản phẩm trong bảng kê
 * API: GET /api/Statement/{id}
 */
export interface ProductSummary {
  productId: number;                // ID sản phẩm
  productName: string;              // Tên sản phẩm/dịch vụ
  unit: string;                     // Đơn vị tính
  quantity: number;                 // Số lượng
  unitPrice: number;                // Đơn giá
  totalAmount: number;              // Thành tiền
  vatAmount: number;                // Tiền VAT
}

/**
 * Statement Invoice - Hóa đơn trong bảng kê
 * API: GET /api/Statement/{id}
 */
export interface StatementInvoice {
  invoiceID: number;                // ID hóa đơn
  invoiceNumber: number;            // Số hóa đơn
  signDate: string;                 // Ngày ký (ISO format: "2025-12-10T00:00:00")
  totalAmount: number;              // Tổng tiền hóa đơn
  owedAmount: number;               // Số tiền còn nợ
  paymentStatus: string;            // Trạng thái thanh toán (VD: "Partially Paid")
}

/**
 * Statement Detail Response
 * API: GET /api/Statement/{id}
 */
export interface StatementDetailResponse {
  statementID: number;              // ID bảng kê
  statementCode: string;            // Mã bảng kê
  customerName: string;             // Tên khách hàng
  statementDate: string;            // Ngày bảng kê (ISO format)
  totalAmount: number;              // Tổng tiền
  status: string;                   // Trạng thái
  productSummaries: ProductSummary[]; // Danh sách sản phẩm
  invoices: StatementInvoice[];     // Danh sách hóa đơn
}

// ==================== FILTER TYPES ====================

/**
 * Statement Filter Params for API calls
 */
export interface StatementFilterParams {
  pageIndex?: number;               // Trang hiện tại (default: 1)
  pageSize?: number;                // Số bản ghi/trang (default: 10)
  customerName?: string;            // Filter by customer name
  status?: string;                  // Filter by status
  fromDate?: string;                // Filter from date (ISO format)
  toDate?: string;                  // Filter to date (ISO format)
}

// ==================== LEGACY TYPES (For backward compatibility) ====================

/**
 * @deprecated Use StatementListItem instead
 * Old interface for backward compatibility with existing code
 */
export interface Statement {
  id: string;
  code: string;
  customerName: string;
  period: string;
  totalAmount: number;
  status: string;
  linkedInvoiceNumber: string | null;
  isEmailSent: boolean;
  createdDate: string;
}
