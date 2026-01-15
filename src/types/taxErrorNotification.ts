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
 * ⚠️ MUST MATCH backend statusCode (1-5)
 */
export enum NotificationStatus {
  DRAFT = 1,           // Nháp (chưa ký)
  SIGNED = 2,          // Đã ký (chưa gửi CQT)
  SENT = 3,            // Đã gửi T-VAN
  ACCEPTED = 4,        // CQT Tiếp nhận
  REJECTED = 5,        // CQT Từ chối
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
    [NotificationType.ADJUST]: 'Điều chỉnh',
    [NotificationType.REPLACE]: 'Thay thế',
    [NotificationType.EXPLAIN]: 'Giải trình',
  }
  return labels[type] || 'Không xác định'
}

/**
 * Get notification type color - Professional color scheme
 * Hủy = Red (critical), Điều chỉnh = Yellow (moderate), Thay thế = Purple (info), Giải trình = Grey (review)
 */
export const getNotificationTypeColor = (
  type: NotificationType
): 'error' | 'warning' | 'info' | 'secondary' | 'success' => {
  const colors = {
    [NotificationType.CANCEL]: 'error' as const,      // 🔴 Red - Critical action
    [NotificationType.ADJUST]: 'warning' as const,    // 🟡 Yellow - Needs attention  
    [NotificationType.REPLACE]: 'secondary' as const, // 🟪 Purple/Light purple - Informational
    [NotificationType.EXPLAIN]: 'secondary' as const, // ⚫ Grey - Explanation/documentation
  }
  return colors[type] || 'secondary'
}

/**
 * Get custom background color for notification type (for purple variant)
 */
export const getNotificationTypeCustomColor = (type: NotificationType) => {
  if (type === NotificationType.REPLACE) {
    // Tím nhạt (Light Purple) - Custom color
    return {
      bgcolor: '#f3e5f5',      // Light purple background
      color: '#6a1b9a',        // Dark purple text
      borderColor: '#ce93d8',  // Medium purple border
    }
  }
  return null
}

/**
 * Get notification status label in Vietnamese
 * Short, professional labels for better UI display
 */
export const getNotificationStatusLabel = (status: NotificationStatus): string => {
  const labels = {
    [NotificationStatus.DRAFT]: 'Nháp',
    [NotificationStatus.SIGNED]: 'Đã ký',
    [NotificationStatus.SENT]: 'Đã gửi',
    [NotificationStatus.ACCEPTED]: 'Đã tiếp nhận',
    [NotificationStatus.REJECTED]: 'Bị từ chối',
  }
  return labels[status] || 'Không xác định'
}

/**
 * Get notification status color - Professional color scheme
 * Nháp = Grey (draft), Đã ký = Blue (ready), Đã gửi = Cyan (processing), Đã tiếp nhận = Green (success), Bị từ chối = Red (error)
 */
export const getNotificationStatusColor = (
  status: NotificationStatus
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const colors = {
    [NotificationStatus.DRAFT]: 'default' as const,   // Grey - Draft state
    [NotificationStatus.SIGNED]: 'info' as const,     // Blue - Signed & ready
    [NotificationStatus.SENT]: 'warning' as const,    // Orange - Processing/Pending
    [NotificationStatus.ACCEPTED]: 'success' as const, // Green - Accepted
    [NotificationStatus.REJECTED]: 'error' as const,  // Red - Rejected
  }
  return colors[status] || 'default'
}

/**
 * Check if notification needs attention (rejected)
 */
export const needsAttention = (status: NotificationStatus): boolean => {
  return status === NotificationStatus.REJECTED
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
