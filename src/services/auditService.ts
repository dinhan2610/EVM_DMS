/**
 * 📊 AUDIT SERVICE
 * API Service for Audit Logs & Activity Tracking
 * 
 * @service auditService
 * 
 * API Endpoints:
 * - GET /api/Audit/data-logs - Lấy data change logs (CRUD operations)
 * - GET /api/Audit/activity-logs - Lấy user activity logs
 */

import httpClient from '@/helpers/httpClient'
import API_CONFIG from '@/config/api.config'

/**
 * DATA LOG - Track database changes (CRUD)
 * Backend: /api/Audit/data-logs
 */
export interface DataLog {
  auditID: number
  traceId: string              // Request trace ID
  userID: number               // 0 = System, >0 = User ID
  userName: string             // "System" or user name
  action: 'Added' | 'Modified' | 'Deleted'
  tableName: string            // "Invoice", "User", "InvoiceItem", "InvoiceHistory", etc.
  recordId: string | null      // ID of affected record
  oldValues: string | null     // JSON string of old data (for Modified/Deleted)
  newValues: string | null     // JSON string of new data (for Added/Modified)
  timestamp: string            // ISO date string
}

/**
 * ACTIVITY LOG - Track user actions & system events
 * Backend: /api/Audit/activity-logs
 */
export interface ActivityLog {
  logId: number
  userId: string               // User ID or "System"
  actionName: string           // "Login", "Logout", "MarkNotificationRead", etc.
  description: string          // Success message or error details
  ipAddress: string            // Client IP address
  status: 'Success' | 'Failed'
  timestamp: string            // ISO date string
}

/**
 * Paginated Response (shared structure)
 */
export interface PaginatedResponse<T> {
  items: T[]
  pageIndex: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

/**
 * Request params for data logs
 */
export interface GetDataLogsRequest {
  pageIndex?: number
  pageSize?: number
  tableName?: string           // Filter by table (e.g., "Invoice", "User")
  action?: string              // Filter by action (e.g., "Added", "Modified")
  userId?: number              // Filter by user
  fromDate?: string            // ISO date string
  toDate?: string              // ISO date string
}

/**
 * Request params for activity logs
 */
export interface GetActivityLogsRequest {
  pageIndex?: number
  pageSize?: number
  userId?: string              // Filter by user ID
  actionName?: string          // Filter by action name
  status?: 'Success' | 'Failed' // Filter by status
  fromDate?: string            // ISO date string
  toDate?: string              // ISO date string
}

/**
 * Helper: Check if user is authenticated
 */
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  return !!token && token.length > 0
}

const auditService = {
  /**
   * 📊 GET DATA LOGS
   * Lấy danh sách thay đổi database (CRUD operations)
   * 
   * @param params - Filter & pagination params
   * @returns Promise<PaginatedResponse<DataLog>>
   * 
   * @example
   * const logs = await auditService.getDataLogs({
   *   pageIndex: 1,
   *   pageSize: 20,
   *   tableName: 'Invoice',
   *   action: 'Modified'
   * })
   */
  async getDataLogs(params: GetDataLogsRequest = {}): Promise<PaginatedResponse<DataLog>> {
    // Check authentication
    if (!isAuthenticated()) {
      console.warn('[AuditService] User not authenticated')
      return {
        items: [],
        pageIndex: params.pageIndex || 1,
        totalPages: 0,
        totalCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }

    try {
      const queryParams = new URLSearchParams()
      
      if (params.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
      if (params.tableName) queryParams.append('tableName', params.tableName)
      if (params.action) queryParams.append('action', params.action)
      if (params.userId !== undefined) queryParams.append('userId', params.userId.toString())
      if (params.fromDate) queryParams.append('fromDate', params.fromDate)
      if (params.toDate) queryParams.append('toDate', params.toDate)

      console.log('[AuditService] Fetching data logs:', params)

      const response = await httpClient.get<PaginatedResponse<DataLog>>(
        `/Audit/data-logs?${queryParams.toString()}`
      )

      console.log('[AuditService] Data logs response:', {
        count: response.data.items.length,
        totalCount: response.data.totalCount,
        pageIndex: response.data.pageIndex,
        totalPages: response.data.totalPages,
      })
      // Debug: Log unique userId values to verify mapping
      if (response.data.items.length > 0) {
        const uniqueUserIds = [...new Set(response.data.items.map(log => log.userID))]
        console.log('[AuditService] Unique userId values found:', uniqueUserIds)
      }
      return response.data
    } catch (error) {
      const axiosError = error as { 
        message?: string
        response?: { status?: number; statusText?: string; data?: unknown }
        config?: { url?: string }
      }
      
      console.error('[AuditService] Failed to fetch data logs:', {
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url,
      })

      // Return empty result on error
      return {
        items: [],
        pageIndex: params.pageIndex || 1,
        totalPages: 0,
        totalCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }
  },

  /**
   * 👤 GET ACTIVITY LOGS
   * Lấy danh sách hoạt động user & system events
   * 
   * @param params - Filter & pagination params
   * @returns Promise<PaginatedResponse<ActivityLog>>
   * 
   * @example
   * const logs = await auditService.getActivityLogs({
   *   pageIndex: 1,
   *   pageSize: 20,
   *   status: 'Failed'
   * })
   */
  async getActivityLogs(params: GetActivityLogsRequest = {}): Promise<PaginatedResponse<ActivityLog>> {
    // Check authentication
    if (!isAuthenticated()) {
      console.warn('[AuditService] User not authenticated')
      return {
        items: [],
        pageIndex: params.pageIndex || 1,
        totalPages: 0,
        totalCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }

    try {
      const queryParams = new URLSearchParams()
      
      if (params.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
      if (params.userId) queryParams.append('userId', params.userId)
      if (params.actionName) queryParams.append('actionName', params.actionName)
      if (params.status) queryParams.append('status', params.status)
      if (params.fromDate) queryParams.append('fromDate', params.fromDate)
      if (params.toDate) queryParams.append('toDate', params.toDate)

      console.log('[AuditService] Fetching activity logs:', params)

      const response = await httpClient.get<PaginatedResponse<ActivityLog>>(
        `/Audit/activity-logs?${queryParams.toString()}`
      )

      console.log('[AuditService] Activity logs response:', {
        count: response.data.items.length,
        totalCount: response.data.totalCount,
        pageIndex: response.data.pageIndex,
        totalPages: response.data.totalPages,
      })

      // Debug: Log unique userId values to verify mapping
      if (response.data.items.length > 0) {
        const uniqueUserIds = [...new Set(response.data.items.map(log => log.userId))]
        console.log('[AuditService] Unique userId values found:', uniqueUserIds)
      }

      return response.data
    } catch (error) {
      const axiosError = error as { 
        message?: string
        response?: { status?: number; statusText?: string; data?: unknown }
        config?: { url?: string }
      }
      
      console.error('[AuditService] Failed to fetch activity logs:', {
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url,
      })

      // Return empty result on error
      return {
        items: [],
        pageIndex: params.pageIndex || 1,
        totalPages: 0,
        totalCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }
  },

  /**
   * 🔍 GET INVOICE AUDIT TRAIL
   * Lấy lịch sử thay đổi của 1 invoice cụ thể
   * Kết hợp data từ nhiều tables: Invoice, InvoiceItem, InvoiceHistory
   * 
   * @param invoiceId - ID của invoice
   * @returns Promise<DataLog[]>
   * 
   * @example
   * const trail = await auditService.getInvoiceAuditTrail(82)
   */
  async getInvoiceAuditTrail(invoiceId: number): Promise<DataLog[]> {
    try {
      // Fetch all data logs for this invoice
      const response = await this.getDataLogs({
        pageIndex: 1,
        pageSize: 100, // Get all related logs
      })

      // Filter logs related to this invoice
      const invoiceLogs = response.items.filter((log) => {
        // Direct Invoice table changes
        if (log.tableName === 'Invoice' && log.recordId === invoiceId.toString()) {
          return true
        }

        // InvoiceItem changes - check newValues/oldValues for InvoiceID
        if (log.tableName === 'InvoiceItem') {
          try {
            const newValues = log.newValues ? JSON.parse(log.newValues) : null
            const oldValues = log.oldValues ? JSON.parse(log.oldValues) : null
            
            if (newValues?.InvoiceID === invoiceId || oldValues?.InvoiceID === invoiceId) {
              return true
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        // InvoiceHistory changes
        if (log.tableName === 'InvoiceHistory') {
          try {
            const newValues = log.newValues ? JSON.parse(log.newValues) : null
            if (newValues?.InvoiceID === invoiceId) {
              return true
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        return false
      })

      console.log(`[AuditService] Found ${invoiceLogs.length} audit logs for invoice ${invoiceId}`)
      return invoiceLogs
    } catch (error) {
      console.error('[AuditService] Failed to fetch invoice audit trail:', error)
      return []
    }
  },

  /**
   * 🛠️ HELPER: Parse JSON values
   * Parse oldValues/newValues JSON strings safely
   * 
   * @param jsonString - JSON string to parse
   * @returns Parsed object or null
   */
  parseValues(jsonString: string | null): Record<string, unknown> | null {
    if (!jsonString) return null
    
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn('[AuditService] Failed to parse JSON:', jsonString)
      return null
    }
  },

  /**
   * 🛠️ HELPER: Get action label in Vietnamese
   */
  getActionLabel(action: DataLog['action']): string {
    switch (action) {
      case 'Added':
        return 'Thêm mới'
      case 'Modified':
        return 'Cập nhật'
      case 'Deleted':
        return 'Xóa'
      default:
        return action
    }
  },

  /**
   * 🛠️ HELPER: Get table name in Vietnamese
   */
  getTableLabel(tableName: string): string {
    const labels: Record<string, string> = {
      'Invoice': 'Hóa đơn',
      'InvoiceItem': 'Sản phẩm hóa đơn',
      'InvoiceHistory': 'Lịch sử hóa đơn',
      'User': 'Người dùng',
      'Customer': 'Khách hàng',
      'Product': 'Sản phẩm',
      'InvoiceTemplate': 'Mẫu hóa đơn',
      'Company': 'Công ty',
    }
    return labels[tableName] || tableName
  },

  /**
   * 🛠️ HELPER: Get action color
   */
  getActionColor(action: DataLog['action']): 'success' | 'info' | 'error' {
    switch (action) {
      case 'Added':
        return 'success'
      case 'Modified':
        return 'info'
      case 'Deleted':
        return 'error'
      default:
        return 'info'
    }
  },

  /**
   * 🛠️ HELPER: Get status color
   */
  getStatusColor(status: ActivityLog['status']): 'success' | 'error' {
    return status === 'Success' ? 'success' : 'error'
  },

  /**
   * 🛠️ HELPER: Get status label in Vietnamese
   */
  getStatusLabel(status: ActivityLog['status']): string {
    return status === 'Success' ? 'Thành công' : 'Thất bại'
  },

  /**
   * 🛠️ HELPER: Map userId/role to Vietnamese label
   * Supports: System, Admin, HOD, Accountant, Sale (case-insensitive)
   * Falls back to original value if not found (e.g., numeric user IDs)
   */
  getUserIdLabel(userId: string): string {
    const mapping: Record<string, string> = {
      'System': 'Hệ thống',
      'system': 'Hệ thống',
      'Admin': 'Quản trị viên',
      'admin': 'Quản trị viên',
      'HOD': 'Kế toán trưởng',
      'hod': 'Kế toán trưởng',
      'Accountant': 'Kế toán',
      'accountant': 'Kế toán',
      'Sale': 'Nhân viên bán hàng',
      'sale': 'Nhân viên bán hàng',
    }

    return mapping[userId] || userId // Fallback to original (numeric IDs or unknown values)
  },

  /**
   * 🛠️ HELPER: Get action name in Vietnamese
   * Map English actionName from backend to Vietnamese display
   */
  getActionNameLabel(actionName: string): string {
    const labels: Record<string, string> = {
      // Authentication & User Management
      'Login': 'Đăng nhập',
      'Logout': 'Đăng xuất',
      'ChangePassword': 'Đổi mật khẩu',
      'UpdateProfile': 'Cập nhật thông tin cá nhân',
      'UpdateUserStatus': 'Cập nhật trạng thái người dùng',
      'RegisterHod': 'Đăng ký HOD',

      // Invoice Management
      'CreateInvoice': 'Tạo hóa đơn',
      'PreviewInvoice': 'Xem trước hóa đơn',
      'UpdateInvoice': 'Cập nhật hóa đơn',
      'CreateAdjustmentInvoice': 'Tạo hóa đơn điều chỉnh',
      'CreateReplacementInvoice': 'Tạo hóa đơn thay thế',
      'SignInvoice': 'Ký hóa đơn',
      'GetHashToSign': 'Lấy mã hash để ký',
      'CompleteInvoiceSigning': 'Hoàn tất ký hóa đơn',
      'SendInvoiceEmail': 'Gửi email hóa đơn',
      'SendInvoiceMinutes': 'Gửi biên bản hóa đơn',

      // Invoice Status
      'CreateInvoiceStatus': 'Tạo trạng thái hóa đơn',
      'UpdateInvoiceStatus': 'Cập nhật trạng thái hóa đơn',

      // Customer Management
      'CreateCustomer': 'Tạo khách hàng',
      'UpdateCustomer': 'Cập nhật khách hàng',
      'UpdateCustomerStatus': 'Cập nhật trạng thái khách hàng',

      // Company & Settings
      'UpdateCompany': 'Cập nhật thông tin công ty',
      'CreateSerial': 'Tạo ký hiệu hóa đơn',

      // Product Management
      'UpdateProductStatus': 'Cập nhật trạng thái sản phẩm',

      // Email Templates
      'CreateEmailTemplate': 'Tạo mẫu email',
      'UpdateEmailTemplate': 'Cập nhật mẫu email',
      'UpdateTemplate': 'Cập nhật mẫu',

      // Statement & Debt
      'CreateStatement': 'Tạo bảng kê',
      'SendMonthlyDebtReminders': 'Gửi nhắc nợ hàng tháng',
      'CreatePayment': 'Tạo thanh toán',

      // Notifications
      'GetUnreadCountQuery': 'Lấy số thông báo chưa đọc',
      'MarkNotificationRead': 'Đánh dấu đã đọc thông báo',
      'CreateErrorNotification': 'Tạo thông báo lỗi',

      // Tax API Integration
      'CreateTaxApiStatus': 'Tạo trạng thái API thuế',
      'UpdateTaxApiStatus': 'Cập nhật trạng thái API thuế',
      'CreateTaxLog': 'Tạo log API thuế',

      // API Operations (Generic)
      'GetRequest': 'Truy vấn dữ liệu',
      'PostRequest': 'Gửi dữ liệu',
      'PutRequest': 'Cập nhật dữ liệu',
      'DeleteRequest': 'Xóa dữ liệu',
    }

    return labels[actionName] || actionName
  },
}

export default auditService
