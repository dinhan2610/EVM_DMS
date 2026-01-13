/**
 * 🔔 NOTIFICATION SERVICE
 * API Service for System Notifications
 * 
 * @service notificationService
 * 
 * API Endpoints:
 * - GET /api/Notification?pageIndex=1&pageSize=10 - Lấy danh sách thông báo
 * - GET /api/Notification/unread-count - Đếm số thông báo chưa đọc
 * - PUT /api/Notification/{id}/read - Đánh dấu đã đọc 1 thông báo
 * - PUT /api/Notification/read-all - Đánh dấu tất cả đã đọc
 */

import httpClient from '@/helpers/httpClient'

/**
 * Notification Type Enum
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  NEW_REQUEST = 'new_request',
}

/**
 * Notification Interface
 */
export interface Notification {
  notificationID: number
  userID: number
  message: string
  notificationType: NotificationType
  isRead: boolean
  createdAt: string
  relatedEntityType?: string | null
  relatedEntityID?: number | null
}

/**
 * Get Notifications Request
 */
export interface GetNotificationsRequest {
  pageIndex?: number
  pageSize?: number
  isRead?: boolean | null // null = all, true = read only, false = unread only
}

/**
 * Get Notifications Response
 */
export interface GetNotificationsResponse {
  items: Notification[]
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

/**
 * Unread Count Response
 */
export interface UnreadCountResponse {
  unreadCount: number
}

/**
 * Mark as Read Response
 */
export interface MarkAsReadResponse {
  success: boolean
  message?: string
}

/**
 * Notification Service
 */
const notificationService = {
  /**
   * 📋 GET NOTIFICATIONS WITH PAGINATION
   * Lấy danh sách thông báo có phân trang
   * 
   * @param params - Query parameters
   * @returns Promise<GetNotificationsResponse>
   * 
   * @example
   * // Get all notifications (page 1, 10 items)
   * const result = await notificationService.getNotifications({ pageIndex: 1, pageSize: 10 })
   * 
   * // Get only unread notifications
   * const unread = await notificationService.getNotifications({ pageIndex: 1, pageSize: 10, isRead: false })
   */
  async getNotifications(params: GetNotificationsRequest = {}): Promise<GetNotificationsResponse> {
    const { pageIndex = 1, pageSize = 10, isRead = null } = params
    
    const queryParams = new URLSearchParams({
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
    })
    
    // Add isRead filter if specified
    if (isRead !== null) {
      queryParams.append('isRead', isRead.toString())
    }
    
    const response = await httpClient.get(`/Notification?${queryParams.toString()}`)
    return response.data
  },

  /**
   * 🔢 GET UNREAD COUNT
   * Đếm số thông báo chưa đọc
   * 
   * @returns Promise<number>
   * 
   * @example
   * const count = await notificationService.getUnreadCount()
   * console.log(`You have ${count} unread notifications`)
   */
  async getUnreadCount(): Promise<number> {
    const response = await httpClient.get<UnreadCountResponse>('/Notification/unread-count')
    return response.data.unreadCount
  },

  /**
   * ✅ MARK NOTIFICATION AS READ
   * Đánh dấu 1 thông báo là đã đọc
   * 
   * @param notificationId - ID của thông báo
   * @returns Promise<MarkAsReadResponse>
   * 
   * @example
   * await notificationService.markAsRead(123)
   */
  async markAsRead(notificationId: number): Promise<MarkAsReadResponse> {
    const response = await httpClient.put<MarkAsReadResponse>(
      `/Notification/${notificationId}/read`
    )
    return response.data
  },

  /**
   * ✅ MARK ALL NOTIFICATIONS AS READ
   * Đánh dấu tất cả thông báo là đã đọc
   * 
   * @returns Promise<MarkAsReadResponse>
   * 
   * @example
   * await notificationService.markAllAsRead()
   */
  async markAllAsRead(): Promise<MarkAsReadResponse> {
    const response = await httpClient.put<MarkAsReadResponse>('/Notification/read-all')
    return response.data
  },
}

export default notificationService
