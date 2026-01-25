/**
 * SignalR Event Types
 * Định nghĩa các payload từ backend SignalR Hub
 */

/**
 * Event: InvoiceChanged
 * Phát khi có thay đổi về hóa đơn (tạo mới, cập nhật, xóa, đổi trạng thái)
 */
export interface InvoiceChangedPayload {
  invoiceId: number
  changeType: 'Created' | 'Updated' | 'Deleted' | 'StatusChanged'
  statusId?: number        // Trạng thái mới (1=Draft, 2=Signed, etc.)
  customerId?: number      // ID khách hàng
  roles: string[]          // Roles được phép nhận event này
  occurredAt: string       // Timestamp ISO 8601
}

/**
 * Event: UserChanged
 * Phát khi có thay đổi về user (tạo mới, cập nhật, xóa, kích hoạt/vô hiệu hóa)
 * Chỉ Admin nhận event này
 */
export interface UserChangedPayload {
  userId: number
  changeType: 'Created' | 'Updated' | 'Deleted' | 'Activated' | 'Deactivated'
  roleName?: string        // Role của user (Admin, HOD, Sale, etc.)
  isActive?: boolean       // Trạng thái kích hoạt
  roles: string[]          // Roles được phép nhận event này (thường chỉ Admin)
  occurredAt: string       // Timestamp ISO 8601
}

/**
 * Event: DashboardChanged
 * Phát khi cần refresh dashboard (sau khi có thay đổi về Invoices hoặc Users)
 */
export interface DashboardChangedPayload {
  scope: 'Invoices' | 'Users'  // Phạm vi thay đổi
  changeType: string           // Loại thay đổi
  entityId?: number            // ID của entity thay đổi (optional)
  roles: string[]              // Roles cần refresh dashboard
  occurredAt: string           // Timestamp ISO 8601
}

/**
 * SignalR Event Handlers
 * Type-safe callbacks cho các events
 */
export type InvoiceChangedHandler = (payload: InvoiceChangedPayload) => void
export type UserChangedHandler = (payload: UserChangedPayload) => void
export type DashboardChangedHandler = (payload: DashboardChangedPayload) => void

/**
 * SignalR Connection State
 */
export type SignalRConnectionState = 
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Reconnecting'
  | 'Disconnecting'
