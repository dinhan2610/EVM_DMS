/**
 * 🔄 TAX ERROR NOTIFICATION ADAPTER
 * Maps backend API response to UI data structures
 * 
 * @adapter taxErrorNotificationAdapter
 * @description Converts NotificationListItem (backend) to ITaxErrorNotification (UI)
 * 
 * @author EIMS Team
 * @updated 2026-01-15 - Complete mapping with notificationTypeCode handling
 */

import { NotificationListItem } from '@/services/taxErrorNotificationService'
import {
  ITaxErrorNotification,
  NotificationType,
  NotificationStatus,
} from '@/types/taxErrorNotification'

/**
 * Map backend status code to UI enum
 * Backend: 1=Nháp, 2=Đã ký, 3=Đã gửi T-VAN, 4=CQT Tiếp nhận, 5=CQT Từ chối
 * UI: DRAFT=1, SIGNED=2, SENT=3, ACCEPTED=4, REJECTED=5
 * ✅ DIRECT MAPPING - Backend và UI đã match!
 */
const mapStatusCode = (statusCode: number): NotificationStatus => {
  // Direct cast vì backend statusCode (1-5) = UI enum (1-5)
  return statusCode as NotificationStatus
}

/**
 * Map backend notificationTypeCode to UI enum
 * Backend: 0=Chưa set, 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
 * UI: CANCEL=1, ADJUST=2, REPLACE=3, EXPLAIN=4
 * 
 * ⚠️ Handle edge case: notificationTypeCode = 0 (old data chưa populate)
 */
const mapNotificationType = (notificationTypeCode: number): NotificationType => {
  // Map trực tiếp vì backend và UI đều dùng enum 1-4
  const typeMap: Record<number, NotificationType> = {
    1: NotificationType.CANCEL,    // ❌ Hủy
    2: NotificationType.ADJUST,    // 📝 Điều chỉnh
    3: NotificationType.REPLACE,   // 🔄 Thay thế
    4: NotificationType.EXPLAIN,   // 📋 Giải trình
  }
  
  // ⚠️ EDGE CASE: notificationTypeCode = 0 (old data)
  // Default to ADJUST (most common type)
  if (notificationTypeCode === 0) {
    console.warn('⚠️ notificationTypeCode = 0 (old data), defaulting to ADJUST')
    return NotificationType.ADJUST
  }
  
  return typeMap[notificationTypeCode] ?? NotificationType.ADJUST
}

/**
 * Format invoice number with zero padding
 * Backend: "40" → UI: "00000040"
 */
const formatInvoiceNumber = (invoiceNumber: string): string => {
  if (!invoiceNumber) return '00000000'
  
  // Nếu đã có padding, giữ nguyên
  if (invoiceNumber.length >= 8) return invoiceNumber
  
  // Thêm zero padding (8 digits)
  return invoiceNumber.padStart(8, '0')
}

/**
 * 🎯 MAIN ADAPTER FUNCTION
 * Converts backend NotificationListItem to UI ITaxErrorNotification
 */
export const adaptNotificationListItem = (
  backendItem: NotificationListItem
): ITaxErrorNotification => {
  return {
    // IDs
    id: backendItem.id,
    invoiceId: 0,  // ⚠️ NOT AVAILABLE in list API - must fetch from detail API via details[].invoiceId
    
    // Dates
    sentDate: new Date(backendItem.createdDate),
    invoiceDate: backendItem.invoiceDate,
    
    // Message/Notification identifiers
    messageId: backendItem.mtDiep || backendItem.notificationNumber,
    notificationCode: backendItem.notificationNumber,
    
    // Invoice info
    invoiceRef: formatInvoiceNumber(backendItem.invoiceNumber),
    invoiceSymbol: backendItem.invoiceSerial,
    
    // Customer & Amount
    customerName: backendItem.customerName,
    totalAmount: backendItem.totalAmount,
    
    // Tax authority
    taxAuthority: backendItem.taxAuthorityName,
    
    // Type & Status (MAPPED TO UI ENUMS)
    type: mapNotificationType(backendItem.notificationTypeCode),
    status: mapStatusCode(backendItem.statusCode),
    
    // Additional info
    reason: backendItem.reason || '',  // Reason từ backend (có thể empty nếu chưa populate)
    cqtResponse: backendItem.taxResponsePath,
    xmlPath: backendItem.xmlPath,
  }
}

/**
 * 🔄 BATCH ADAPTER
 * Converts array of backend items to UI format
 */
export const adaptNotificationList = (
  backendItems: NotificationListItem[]
): ITaxErrorNotification[] => {
  return backendItems.map(adaptNotificationListItem)
}

/**
 * 📊 TYPE MAPPING REFERENCE
 * 
 * notificationTypeCode (Backend) → NotificationType (UI)
 * --------------------------------------------------------
 * 0 → ADJUST (default for old data) 📝
 * 1 → CANCEL ❌
 * 2 → ADJUST 📝
 * 3 → REPLACE 🔄
 * 4 → EXPLAIN 📋
 * 
 * 
 * statusCode (Backend) → NotificationStatus (UI)
 * -----------------------------------------------
 * 1 (Nháp) → PENDING
 * 2 (Đã ký) → PENDING
 * 3 (Đã gửi T-VAN) → SENDING
 * 4 (CQT Tiếp nhận) → ACCEPTED
 * 5 (CQT Từ chối) → REJECTED
 */
