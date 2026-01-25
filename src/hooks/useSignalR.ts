/**
 * useSignalR Hook
 * React hook để subscribe SignalR events một cách dễ dàng
 * 
 * Usage:
 * ```tsx
 * useSignalR({
 *   onInvoiceChanged: (payload) => {
 *     console.log('Invoice changed:', payload)
 *     refreshInvoices()
 *   },
 *   onDashboardChanged: (payload) => {
 *     if (payload.scope === 'Invoices') refreshDashboard()
 *   }
 * })
 * ```
 */

import { useEffect, useRef } from 'react'
import { signalRService } from '@/services/signalrService'
import type {
  InvoiceChangedHandler,
  UserChangedHandler,
  DashboardChangedHandler,
} from '@/types/signalr.types'

export interface UseSignalROptions {
  /**
   * Handler cho InvoiceChanged event
   * Gọi khi có invoice được tạo mới, cập nhật, xóa, hoặc đổi trạng thái
   */
  onInvoiceChanged?: InvoiceChangedHandler

  /**
   * Handler cho UserChanged event
   * Gọi khi có user được tạo mới, cập nhật, xóa, hoặc kích hoạt/vô hiệu hóa
   * Thường chỉ Admin nhận event này
   */
  onUserChanged?: UserChangedHandler

  /**
   * Handler cho DashboardChanged event
   * Gọi khi cần refresh dashboard (sau khi có thay đổi về Invoices hoặc Users)
   */
  onDashboardChanged?: DashboardChangedHandler

  /**
   * Bật/tắt SignalR subscription
   * Default: true
   */
  enabled?: boolean
}

/**
 * Custom hook để subscribe SignalR events
 * Tự động unsubscribe khi component unmount
 */
export const useSignalR = (options: UseSignalROptions = {}) => {
  const { onInvoiceChanged, onUserChanged, onDashboardChanged, enabled = true } = options

  // Store handlers in refs to avoid re-subscription on every render
  const handlersRef = useRef({
    onInvoiceChanged,
    onUserChanged,
    onDashboardChanged,
  })

  // Update refs when handlers change (but don't re-subscribe)
  useEffect(() => {
    handlersRef.current = {
      onInvoiceChanged,
      onUserChanged,
      onDashboardChanged,
    }
  }, [onInvoiceChanged, onUserChanged, onDashboardChanged])

  // Subscribe ONCE when enabled changes (not when handlers change)
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ [useSignalR] Disabled, skipping subscription')
      return
    }

    console.log('🔵 [useSignalR] Setting up SignalR subscriptions...')

    // Subscribe to events with stable wrapper functions
    const unsubscribeFns: Array<() => void> = []

    // Wrapper functions call current handlers from ref
    const invoiceChangedWrapper: InvoiceChangedHandler = (payload) => {
      if (handlersRef.current.onInvoiceChanged) {
        handlersRef.current.onInvoiceChanged(payload)
      }
    }

    const userChangedWrapper: UserChangedHandler = (payload) => {
      if (handlersRef.current.onUserChanged) {
        handlersRef.current.onUserChanged(payload)
      }
    }

    const dashboardChangedWrapper: DashboardChangedHandler = (payload) => {
      if (handlersRef.current.onDashboardChanged) {
        handlersRef.current.onDashboardChanged(payload)
      }
    }

    // Subscribe with wrappers (stable references)
    if (onInvoiceChanged) {
      const unsubscribe = signalRService.onInvoiceChanged(invoiceChangedWrapper)
      unsubscribeFns.push(unsubscribe)
      console.log('📨 [useSignalR] Subscribed to InvoiceChanged')
    }

    if (onUserChanged) {
      const unsubscribe = signalRService.onUserChanged(userChangedWrapper)
      unsubscribeFns.push(unsubscribe)
      console.log('📨 [useSignalR] Subscribed to UserChanged')
    }

    if (onDashboardChanged) {
      const unsubscribe = signalRService.onDashboardChanged(dashboardChangedWrapper)
      unsubscribeFns.push(unsubscribe)
      console.log('📨 [useSignalR] Subscribed to DashboardChanged')
    }

    // Cleanup: unsubscribe khi component unmount hoặc enabled = false
    return () => {
      console.log('🔕 [useSignalR] Cleaning up subscriptions...')
      unsubscribeFns.forEach((fn) => fn())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]) // ✅ CHỈ phụ thuộc vào enabled, handlers được lưu trong ref

  // Return connection state helper
  return {
    isConnected: () => signalRService.isConnected(),
    getState: () => signalRService.getState(),
  }
}

/**
 * Hook đặc biệt: Reconnect listener
 * Tự động gọi callback khi SignalR reconnect thành công
 * Dùng để resync data sau khi mất kết nối
 */
export const useSignalRReconnect = (onReconnected: () => void) => {
  // Store callback in ref to avoid re-subscription
  const callbackRef = useRef(onReconnected)

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = onReconnected
  }, [onReconnected])

  // Subscribe ONCE (no dependencies on callback)
  useEffect(() => {
    const handleReconnect = () => {
      console.log('🔄 [useSignalRReconnect] Reconnected, triggering callback')
      callbackRef.current() // Call current callback from ref
    }

    window.addEventListener('signalr:reconnected', handleReconnect)

    return () => {
      window.removeEventListener('signalr:reconnected', handleReconnect)
    }
  }, []) // ✅ Empty dependencies - subscribe ONCE
}
