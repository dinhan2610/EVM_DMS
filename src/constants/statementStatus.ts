/**
 * Statement Status Constants
 * Quản lý trạng thái Bảng kê công nợ
 *
 * API Status IDs:
 * 1 - Draft
 * 2 - Published
 * 3 - Sent
 * 4 - Partially Paid
 * 5 - Paid
 * 6 - Cancelled
 * 7 - Refunded
 * 8 - Wait for payment (Chờ thanh toán)
 */

// ==================== STATEMENT STATUS ====================
/**
 * Statement Status (Trạng thái Bảng kê)
 */
export const STATEMENT_STATUS = {
  DRAFT: 'Draft', // 1 - Nháp
  PUBLISHED: 'Published', // 2 - Đã xuất bản
  SENT: 'Sent', // 3 - Đã gửi
  PARTIALLY_PAID: 'Partially Paid', // 4 - Trả một phần
  PAID: 'Paid', // 5 - Đã thanh toán
  CANCELLED: 'Cancelled', // 6 - Đã hủy
  REFUNDED: 'Refunded', // 7 - Đã hoàn tiền
  WAIT_FOR_PAYMENT: 'Wait for payment', // 8 - Chờ thanh toán
} as const

export type StatementStatus = (typeof STATEMENT_STATUS)[keyof typeof STATEMENT_STATUS]

/**
 * Mapping Status ID to Status String
 */
export const STATEMENT_STATUS_BY_ID: Record<number, StatementStatus> = {
  1: STATEMENT_STATUS.DRAFT,
  2: STATEMENT_STATUS.PUBLISHED,
  3: STATEMENT_STATUS.SENT,
  4: STATEMENT_STATUS.PARTIALLY_PAID,
  5: STATEMENT_STATUS.PAID,
  6: STATEMENT_STATUS.CANCELLED,
  7: STATEMENT_STATUS.REFUNDED,
  8: STATEMENT_STATUS.WAIT_FOR_PAYMENT,
}

/**
 * Mapping status sang label tiếng Việt
 */
export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  [STATEMENT_STATUS.DRAFT]: 'Nháp',
  [STATEMENT_STATUS.PUBLISHED]: 'Đã xuất bản',
  [STATEMENT_STATUS.SENT]: 'Đã gửi',
  [STATEMENT_STATUS.PARTIALLY_PAID]: 'Trả một phần',
  [STATEMENT_STATUS.PAID]: 'Đã thanh toán',
  [STATEMENT_STATUS.CANCELLED]: 'Đã hủy',
  [STATEMENT_STATUS.REFUNDED]: 'Đã hoàn tiền',
  [STATEMENT_STATUS.WAIT_FOR_PAYMENT]: 'Chờ thanh toán',
}

/**
 * Màu sắc cho từng trạng thái (MUI Chip colors)
 */
export const STATEMENT_STATUS_COLORS: Record<StatementStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [STATEMENT_STATUS.DRAFT]: 'default', // Xám - Nháp
  [STATEMENT_STATUS.PUBLISHED]: 'info', // Xanh dương nhạt - Đã xuất bản
  [STATEMENT_STATUS.SENT]: 'primary', // Xanh dương - Đã gửi
  [STATEMENT_STATUS.PARTIALLY_PAID]: 'warning', // Cam - Trả một phần
  [STATEMENT_STATUS.PAID]: 'success', // Xanh lá - Đã thanh toán
  [STATEMENT_STATUS.CANCELLED]: 'error', // Đỏ - Đã hủy
  [STATEMENT_STATUS.REFUNDED]: 'secondary', // Tím - Đã hoàn tiền
  [STATEMENT_STATUS.WAIT_FOR_PAYMENT]: 'warning', // Cam - Chờ thanh toán
}

/**
 * Helper function để lấy màu theo status
 */
export const getStatementStatusColor = (status: StatementStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  return STATEMENT_STATUS_COLORS[status] || 'default'
}

/**
 * Helper function để lấy label tiếng Việt theo status
 */
export const getStatementStatusLabel = (status: StatementStatus | string): string => {
  return STATEMENT_STATUS_LABELS[status as StatementStatus] || status
}

/**
 * Helper function để lấy status từ statusID
 */
export const getStatementStatusById = (statusId: number): StatementStatus => {
  return STATEMENT_STATUS_BY_ID[statusId] || STATEMENT_STATUS.DRAFT
}

/**
 * Helper function để lấy icon theo status
 */
export const getStatementStatusIcon = (status: StatementStatus): string => {
  const icons: Record<StatementStatus, string> = {
    [STATEMENT_STATUS.DRAFT]: '📝',
    [STATEMENT_STATUS.PUBLISHED]: '📋',
    [STATEMENT_STATUS.SENT]: '📤',
    [STATEMENT_STATUS.PARTIALLY_PAID]: '💰',
    [STATEMENT_STATUS.PAID]: '✅',
    [STATEMENT_STATUS.CANCELLED]: '❌',
    [STATEMENT_STATUS.REFUNDED]: '↩️',
    [STATEMENT_STATUS.WAIT_FOR_PAYMENT]: '⏳',
  }
  return icons[status] || '📄'
}
