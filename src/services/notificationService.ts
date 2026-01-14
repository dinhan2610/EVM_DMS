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
import API_CONFIG from '@/config/api.config'

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
 * Notification Interface (Backend Response)
 * Matches actual API response structure
 */
export interface Notification {
  notificationID: number
  content: string              // Backend uses 'content', not 'message'
  statusName: string           // Backend returns 'statusName' (e.g., "Chưa đọc")
  isRead: boolean
  typeName: string             // Backend returns 'typeName' (e.g., "Hóa đơn")
  time: string                 // Backend uses 'time', not 'createdAt'
  
  // Legacy fields (kept for backward compatibility)
  userID?: number
  message?: string
  notificationType?: NotificationType
  createdAt?: string
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
  hasPreviousPage: boolean  // Backend field
  hasNextPage: boolean       // Backend field
}

/**
 * Unread Count Response
 */
export interface UnreadCountResponse {
  count: number  // Backend returns 'count', not 'unreadCount'
}

/**
 * Mark as Read Response
 * Backend trả về: {"message": "Đã đánh dấu đã đọc."}
 */
export interface MarkAsReadResponse {
  message: string
}

/**
 * Helper: Check if user is authenticated
 */
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  return !!token && token.length > 0
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
    // Check authentication first
    if (!isAuthenticated()) {
      console.warn('[Notification] User not authenticated, skipping API call')
      // Return empty result if not authenticated (avoid unnecessary API call)
      return {
        items: [],
        totalCount: 0,
        pageIndex: params.pageIndex || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }

    try {
      const { pageIndex = 1, pageSize = 10, isRead = null } = params
      
      const queryParams = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString(),
      })
      
      // Add isRead filter if specified
      if (isRead !== null) {
        queryParams.append('isRead', isRead.toString())
      }
      
      const url = `/Notification?${queryParams.toString()}`
      console.log('[Notification] Fetching:', { 
        url, 
        params: { pageIndex, pageSize, isRead },
        token: localStorage.getItem(API_CONFIG.TOKEN_KEY)?.substring(0, 50) + '...',
      })
      
      const response = await httpClient.get(url)
      
      console.log('[Notification] Response:', {
        totalCount: response.data.totalCount,
        itemsCount: response.data.items?.length || 0,
        pageIndex: response.data.pageIndex,
        sample: response.data.items?.[0],
      })
      
      return response.data
    } catch (error) {
      const axiosError = error as { message?: string; response?: { status?: number; statusText?: string; data?: unknown }; config?: { url?: string } }
      console.error('[Notification] API call failed:', {
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url,
      })
      // Return empty result on error (e.g., 401, 500)
      return {
        items: [],
        totalCount: 0,
        pageIndex: params.pageIndex || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }
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
    // Check authentication first
    if (!isAuthenticated()) {
      console.warn('[Notification] User not authenticated, skipping unread count')
      return 0
    }

    try {
      console.log('[Notification] Fetching unread count')
      console.log('[Notification] Token:', localStorage.getItem(API_CONFIG.TOKEN_KEY)?.substring(0, 50) + '...')
      console.log('[Notification] Full token:', localStorage.getItem(API_CONFIG.TOKEN_KEY))
      
      const response = await httpClient.get<UnreadCountResponse>('/Notification/unread-count')
      
      console.log('[Notification] Unread count response:', response.data)
      return response.data.count  // Backend returns 'count'
    } catch (error) {
      const axiosError = error as { message?: string; response?: { status?: number; statusText?: string; data?: unknown }; config?: { url?: string } }
      console.error('[Notification] Failed to get unread count:', {
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        dataStringified: JSON.stringify(axiosError.response?.data, null, 2),
        url: axiosError.config?.url,
      })
      
      // Return 0 on error
      return 0
    }
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
    // Check authentication first
    if (!isAuthenticated()) {
      console.warn('[Notification] User not authenticated')
      throw new Error('Not authenticated')
    }

    try {
      console.log(`[Notification] Marking notification ${notificationId} as read`)
      const response = await httpClient.put<MarkAsReadResponse>(
        `/Notification/${notificationId}/read`
      )
      console.log('[Notification] Mark as read response:', response.data)
      return response.data
    } catch (error) {
      const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
      console.error('[Notification] Failed to mark as read:', {
        notificationId,
        error: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      })
      throw error
    }
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
    // Check authentication first
    if (!isAuthenticated()) {
      console.warn('[Notification] User not authenticated')
      throw new Error('Not authenticated')
    }

    try {
      console.log('[Notification] Marking all notifications as read')
      const response = await httpClient.put<MarkAsReadResponse>('/Notification/read-all')
      console.log('[Notification] Mark all as read response:', response.data)
      return response.data
    } catch (error) {
      const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
      console.error('[Notification] Failed to mark all as read:', {
        error: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      })
      throw error
    }
  },
}

export default notificationService
