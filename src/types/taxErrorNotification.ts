/**
 * Tax Error Notification Constants & Types
 * Form 04/SS-HĐĐT - Electronic Invoice Error Notification
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Notification Type Enum
 * Maps to Form 04/SS-HĐĐT notification types
 */
export enum NotificationType {
  CANCEL = 1,      // Hủy hóa đơn
  ADJUST = 2,      // Điều chỉnh hóa đơn
  REPLACE = 3,     // Thay thế hóa đơn
  EXPLAIN = 4,     // Giải trình hóa đơn
}

/**
 * Notification Status Enum
 * Tracks the lifecycle of a notification
 */
export enum NotificationStatus {
  PENDING = 0,         // Chờ gửi
  SENDING = 1,         // Đang gửi
  ACCEPTED = 2,        // CQT Tiếp nhận
  REJECTED = 3,        // CQT Từ chối
  ERROR = 4,           // Lỗi kỹ thuật
}

/**
 * Tax Error Notification Interface
 * Represents a Form 04/SS-HĐĐT notification
 */
export interface ITaxErrorNotification {
  id: string | number
  sentDate: Date | string           // Ngày gửi
  messageId: string                 // Mã giao dịch T-VAN
  invoiceRef: string                // Số hóa đơn gốc (clickable)
  invoiceId: number                 // Invoice ID for navigation
  invoiceSymbol: string             // Ký hiệu hóa đơn
  invoiceDate: string               // Ngày hóa đơn
  taxAuthority: string              // Cơ quan thuế
  type: NotificationType            // Loại thông báo (1-4)
  reason: string                    // Lý do
  status: NotificationStatus        // Trạng thái (0-4)
  cqtResponse: string | null        // Phản hồi từ CQT
  notificationCode: string          // Mã thông báo (Mẫu 04)
  xmlPath: string | null            // Đường dẫn file XML
  customerName: string              // Tên khách hàng
  totalAmount: number               // Tổng tiền hóa đơn
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get notification type label in Vietnamese
 */
export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels = {
    [NotificationType.CANCEL]: 'Hủy hóa đơn',
    [NotificationType.ADJUST]: 'Điều chỉnh hóa đơn',
    [NotificationType.REPLACE]: 'Thay thế hóa đơn',
    [NotificationType.EXPLAIN]: 'Giải trình hóa đơn',
  }
  return labels[type] || 'Không xác định'
}

/**
 * Get notification type color
 */
export const getNotificationTypeColor = (type: NotificationType): 'error' | 'warning' | 'info' | 'secondary' => {
  const colors = {
    [NotificationType.CANCEL]: 'error' as const,
    [NotificationType.ADJUST]: 'warning' as const,
    [NotificationType.REPLACE]: 'info' as const,
    [NotificationType.EXPLAIN]: 'secondary' as const,
  }
  return colors[type] || 'secondary'
}

/**
 * Get notification status label in Vietnamese
 */
export const getNotificationStatusLabel = (status: NotificationStatus): string => {
  const labels = {
    [NotificationStatus.PENDING]: 'Chờ gửi',
    [NotificationStatus.SENDING]: 'Đang gửi',
    [NotificationStatus.ACCEPTED]: 'CQT Tiếp nhận',
    [NotificationStatus.REJECTED]: 'CQT Từ chối',
    [NotificationStatus.ERROR]: 'Lỗi',
  }
  return labels[status] || 'Không xác định'
}

/**
 * Get notification status color for badge
 */
export const getNotificationStatusColor = (status: NotificationStatus): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const colors = {
    [NotificationStatus.PENDING]: 'default' as const,
    [NotificationStatus.SENDING]: 'info' as const,
    [NotificationStatus.ACCEPTED]: 'success' as const,
    [NotificationStatus.REJECTED]: 'error' as const,
    [NotificationStatus.ERROR]: 'error' as const,
  }
  return colors[status] || 'default'
}

/**
 * Check if notification needs attention (rejected or error)
 */
export const needsAttention = (status: NotificationStatus): boolean => {
  return status === NotificationStatus.REJECTED || status === NotificationStatus.ERROR
}

/**
 * Format currency to VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format date to Vietnamese format
 */
export const formatDate = (date: Date | string): string => {
  // Note: Import dayjs in the component that uses this function
  // This is a placeholder - actual formatting should be done in component
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
