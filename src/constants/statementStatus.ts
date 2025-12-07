/**
 * Statement Status Constants
 * Quản lý trạng thái Bảng kê công nợ
 */

// ==================== STATEMENT STATUS ====================
/**
 * Statement Status (Trạng thái Bảng kê)
 */
export const STATEMENT_STATUS = {
  DRAFT: 'Draft',           // Nháp - Chưa xuất hóa đơn
  INVOICED: 'Invoiced',     // Đã xuất hóa đơn
  CANCELLED: 'Cancelled',   // Đã hủy
} as const;

export type StatementStatus = typeof STATEMENT_STATUS[keyof typeof STATEMENT_STATUS];

/**
 * Mapping status sang label hiển thị
 */
export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  [STATEMENT_STATUS.DRAFT]: 'Chưa xuất HĐ',
  [STATEMENT_STATUS.INVOICED]: 'Đã xuất HĐ',
  [STATEMENT_STATUS.CANCELLED]: 'Đã hủy',
};

/**
 * Màu sắc cho từng trạng thái (MUI Chip colors)
 */
export const STATEMENT_STATUS_COLORS: Record<StatementStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [STATEMENT_STATUS.DRAFT]: 'warning',      // Cam - Chưa xuất
  [STATEMENT_STATUS.INVOICED]: 'success',   // Xanh lá - Đã xuất
  [STATEMENT_STATUS.CANCELLED]: 'error',    // Đỏ - Đã hủy
};

/**
 * Helper function để lấy màu theo status
 */
export const getStatementStatusColor = (status: StatementStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  return STATEMENT_STATUS_COLORS[status] || 'default';
};
