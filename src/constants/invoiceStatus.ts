/**
 * Invoice Status Constants
 * Chuẩn hóa theo nghiệp vụ Hóa đơn điện tử Việt Nam
 */

// ==================== BỘ 1: TRẠNG THÁI QUY TRÌNH NỘI BỘ ====================
/**
 * Internal Workflow Status (Quy trình nội bộ)
 * Mô tả trạng thái xử lý hóa đơn trong hệ thống
 * ⚠️ ĐỒNG BỘ VỚI BACKEND API
 */
export const INVOICE_INTERNAL_STATUS = {
  DRAFT: 1,             // Nháp - Mới tạo, chưa gửi duyệt
  ISSUED: 2,            // Đã phát hành - Hóa đơn đã được phát hành
  CANCELLED: 3,         // Đã hủy - Hóa đơn bị hủy
  ADJUSTED: 4,          // Đã điều chỉnh - Hóa đơn điều chỉnh
  REPLACED: 5,          // Bị thay thế - Có hóa đơn thay thế mới
  PENDING_APPROVAL: 6,  // Chờ duyệt - Kế toán trưởng cần duyệt
  PENDING_SIGN: 7,      // Chờ ký - Đã duyệt, chờ ký số
} as const;

export type InvoiceInternalStatus = typeof INVOICE_INTERNAL_STATUS[keyof typeof INVOICE_INTERNAL_STATUS];

/**
 * Mapping từ status ID sang label hiển thị
 */
export const INVOICE_INTERNAL_STATUS_LABELS: Record<number, string> = {
  [INVOICE_INTERNAL_STATUS.DRAFT]: 'Nháp',
  [INVOICE_INTERNAL_STATUS.ISSUED]: 'Đã phát hành',
  [INVOICE_INTERNAL_STATUS.CANCELLED]: 'Bị từ chối',
  [INVOICE_INTERNAL_STATUS.ADJUSTED]: 'Đã điều chỉnh',
  [INVOICE_INTERNAL_STATUS.REPLACED]: 'Bị thay thế',
  [INVOICE_INTERNAL_STATUS.PENDING_APPROVAL]: 'Chờ duyệt',
  [INVOICE_INTERNAL_STATUS.PENDING_SIGN]: 'Chờ ký',
};

/**
 * Màu sắc cho từng trạng thái nội bộ (MUI Chip colors)
 */
export const INVOICE_INTERNAL_STATUS_COLORS: Record<number, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [INVOICE_INTERNAL_STATUS.DRAFT]: 'default',           // Xám - Nháp
  [INVOICE_INTERNAL_STATUS.ISSUED]: 'success',          // Xanh lá - Đã phát hành
  [INVOICE_INTERNAL_STATUS.CANCELLED]: 'error',         // Đỏ - Đã hủy
  [INVOICE_INTERNAL_STATUS.ADJUSTED]: 'info',           // Xanh dương - Đã điều chỉnh
  [INVOICE_INTERNAL_STATUS.REPLACED]: 'secondary',      // Tím - Bị thay thế
  [INVOICE_INTERNAL_STATUS.PENDING_APPROVAL]: 'warning', // Vàng - Chờ duyệt
  [INVOICE_INTERNAL_STATUS.PENDING_SIGN]: 'primary',    // Xanh primary - Chờ ký
};

// ==================== BỘ 2: TRẠNG THÁI TÍCH HỢP CQT ====================
/**
 * Tax Authority Integration Status (Trạng thái tích hợp Cơ quan Thuế)
 * Mô tả trạng thái đồng bộ với hệ thống thuế
 */
export const TAX_AUTHORITY_STATUS = {
  NOT_SENT: 0,      // Chưa gửi - Hóa đơn chưa gửi lên CQT
  SENDING: 1,       // Đang gửi - Đang trong quá trình đồng bộ
  ACCEPTED: 2,      // Đã cấp mã - CQT chấp nhận và cấp mã
  REJECTED: 3,      // Bị từ chối - CQT từ chối hoặc có lỗi
} as const;

export type TaxAuthorityStatus = typeof TAX_AUTHORITY_STATUS[keyof typeof TAX_AUTHORITY_STATUS];

/**
 * Mapping từ tax status ID sang label hiển thị
 */
export const TAX_AUTHORITY_STATUS_LABELS: Record<number, string> = {
  [TAX_AUTHORITY_STATUS.NOT_SENT]: 'Chưa gửi CQT',
  [TAX_AUTHORITY_STATUS.SENDING]: 'Đang đồng bộ',
  [TAX_AUTHORITY_STATUS.ACCEPTED]: 'Đã cấp mã',
  [TAX_AUTHORITY_STATUS.REJECTED]: 'CQT từ chối',
};

/**
 * Màu sắc cho từng trạng thái thuế (MUI Chip colors)
 */
export const TAX_AUTHORITY_STATUS_COLORS: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [TAX_AUTHORITY_STATUS.NOT_SENT]: 'default',   // Xám - Chưa gửi
  [TAX_AUTHORITY_STATUS.SENDING]: 'warning',    // Vàng - Đang gửi
  [TAX_AUTHORITY_STATUS.ACCEPTED]: 'success',   // Xanh - Đã cấp mã
  [TAX_AUTHORITY_STATUS.REJECTED]: 'error',     // Đỏ - Bị từ chối
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Lấy label của internal status
 */
export const getInternalStatusLabel = (statusId: number): string => {
  return INVOICE_INTERNAL_STATUS_LABELS[statusId] || 'Không xác định';
};

/**
 * Lấy màu của internal status
 */
export const getInternalStatusColor = (statusId: number) => {
  return INVOICE_INTERNAL_STATUS_COLORS[statusId] || 'default';
};

/**
 * Lấy label của tax status
 */
export const getTaxStatusLabel = (statusId: number): string => {
  return TAX_AUTHORITY_STATUS_LABELS[statusId] || 'Không xác định';
};

/**
 * Lấy màu của tax status
 */
export const getTaxStatusColor = (statusId: number) => {
  return TAX_AUTHORITY_STATUS_COLORS[statusId] || 'default';
};

// ==================== LEGACY MAPPING (DEPRECATED) ====================
/**
 * @deprecated Use INVOICE_INTERNAL_STATUS_LABELS instead
 * Giữ lại để tương thích với code cũ
 */
export const INVOICE_STATUS: Record<number, string> = {
  1: 'Đã tạo',      // Map sang PENDING_APPROVAL
  2: 'Đã ký',       // Map sang SIGNED
  3: 'Đã gửi',      // Map sang SIGNED + TAX_ACCEPTED
  4: 'Đã hủy',      // Map sang CANCELLED
};
