/**
 * Tax Authority API Status Types
 * Định nghĩa các kiểu dữ liệu cho trạng thái hóa đơn với CQT (Cơ Quan Thuế)
 */

/**
 * Tax API Status Response từ GET /api/TaxApiStatus
 * Các trạng thái được CQT định nghĩa theo chuẩn hóa đơn điện tử Việt Nam
 */
export interface TaxApiStatus {
  taxApiStatusID: number;
  code: string;
  statusName: string;
}

/**
 * Tax Status Categories - Phân loại theo nhóm nghiệp vụ
 */
export enum TaxStatusCategory {
  /** Trạng thái xử lý chung */
  PROCESSING = 'PROCESSING',
  
  /** Trạng thái tiếp nhận (TB - Thông báo) */
  RECEIVE_NOTIFICATION = 'RECEIVE_NOTIFICATION',
  
  /** Trạng thái kết quả (KQ - Kết quả) */
  RESULT = 'RESULT',
}

/**
 * Tax Status Level - Mức độ nghiêm trọng của trạng thái
 */
export enum TaxStatusLevel {
  /** Trạng thái trung lập/đang xử lý */
  INFO = 'INFO',
  
  /** Trạng thái thành công */
  SUCCESS = 'SUCCESS',
  
  /** Trạng thái cảnh báo */
  WARNING = 'WARNING',
  
  /** Trạng thái lỗi/từ chối */
  ERROR = 'ERROR',
}

/**
 * Tax Status Metadata - Thông tin mở rộng cho mỗi trạng thái
 */
export interface TaxStatusMetadata {
  /** Mã trạng thái */
  code: string;
  
  /** Tên hiển thị */
  displayName: string;
  
  /** Nhóm trạng thái */
  category: TaxStatusCategory;
  
  /** Mức độ nghiêm trọng */
  level: TaxStatusLevel;
  
  /** Mô tả chi tiết */
  description?: string;
  
  /** Hướng dẫn xử lý */
  actionRequired?: string;
  
  /** Có thể gửi lại không */
  canRetry?: boolean;
  
  /** Trạng thái cuối cùng (không thay đổi nữa) */
  isFinal?: boolean;
}

/**
 * Extended Invoice with Tax Status
 * Hóa đơn được mở rộng với thông tin trạng thái CQT chi tiết
 */
export interface InvoiceWithTaxStatus {
  invoiceID: number;
  invoiceNumber: string;
  
  /** Mã CQT đã cấp (nếu có) */
  taxAuthorityCode: string | null;
  
  /** ID trạng thái tax API */
  taxApiStatusID: number | null;
  
  /** Mã trạng thái (PENDING, TB01, KQ01, etc.) */
  taxStatusCode: string | null;
  
  /** Tên trạng thái */
  taxStatusName: string | null;
  
  /** Thời gian cập nhật trạng thái */
  taxStatusUpdatedAt: string | null;
  
  /** Message lỗi (nếu có) */
  taxErrorMessage: string | null;
}
