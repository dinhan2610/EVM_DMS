/**
 * SignalR Service
 * Quản lý kết nối SignalR realtime với backend
 * Pattern: Singleton - chỉ tạo 1 connection duy nhất cho toàn app
 */

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import API_CONFIG from '@/config/api.config'
import type {
  InvoiceChangedPayload,
  UserChangedPayload,
  DashboardChangedPayload,
  InvoiceChangedHandler,
  UserChangedHandler,
  DashboardChangedHandler,
} from '@/types/signalr.types'

/**
 * SignalR Hub URL
 * Development: /hubs/notifications (proxy qua Vite)
 * Production: https://eims.site/hubs/notifications
 */
const SIGNALR_HUB_URL = `${API_CONFIG.BASE_URL.replace('/api', '')}/hubs/notifications`

/**
 * SignalR Connection Manager Class
 * Singleton pattern - chỉ 1 instance cho toàn app
 */
class SignalRService {
  private connection: HubConnection | null = null
  private isInitialized = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  /**
   * Lấy access token từ localStorage
   * Token được lưu bởi httpClient khi login thành công
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(API_CONFIG.TOKEN_KEY)
  }

  /**
   * Khởi tạo SignalR connection
   * Chỉ gọi 1 lần duy nhất khi app start
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔵 [SignalR] Already initialized, skipping...')
      return
    }

    try {
      console.log('🔄 [SignalR] Initializing connection to:', SIGNALR_HUB_URL)

      // Tạo connection với JWT authentication
      this.connection = new HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          accessTokenFactory: () => {
            const token = this.getAccessToken()
            if (!token) {
              console.warn('⚠️ [SignalR] No access token found!')
            }
            return token || ''
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0s, 2s, 10s, 30s, 60s
            if (retryContext.previousRetryCount === 0) return 0
            if (retryContext.previousRetryCount === 1) return 2000
            if (retryContext.previousRetryCount === 2) return 10000
            if (retryContext.previousRetryCount === 3) return 30000
            return 60000 // Max 60s
          },
        })
        .configureLogging(LogLevel.Information)
        .build()

      // Handle connection events
      this.setupConnectionHandlers()

      // Start connection
      await this.connection.start()
      this.isInitialized = true
      this.reconnectAttempts = 0
      console.log('✅ [SignalR] Connected successfully!')
    } catch (error) {
      console.error('❌ [SignalR] Failed to initialize:', error)
      this.isInitialized = false
      throw error
    }
  }

  /**
   * Setup các event handlers cho connection lifecycle
   */
  private setupConnectionHandlers(): void {
    if (!this.connection) return

    // Handle reconnecting
    this.connection.onreconnecting((error) => {
      this.reconnectAttempts++
      console.warn(`🔄 [SignalR] Reconnecting... (Attempt ${this.reconnectAttempts})`, error)
    })

    // Handle reconnected
    this.connection.onreconnected((connectionId) => {
      this.reconnectAttempts = 0
      console.log('✅ [SignalR] Reconnected successfully!', connectionId)
      
      // Dispatch custom event để các components biết cần refresh data
      window.dispatchEvent(new CustomEvent('signalr:reconnected'))
    })

    // Handle disconnected (close)
    this.connection.onclose((error) => {
      console.warn('⚠️ [SignalR] Connection closed', error)
      this.isInitialized = false
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('signalr:disconnected'))
      
      // Auto retry nếu chưa vượt quá max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          console.log('🔄 [SignalR] Attempting manual reconnect...')
          this.initialize().catch(console.error)
        }, 5000)
      }
    })
  }

  /**
   * Subscribe to InvoiceChanged event
   */
  public onInvoiceChanged(handler: InvoiceChangedHandler): () => void {
    if (!this.connection) {
      console.warn('⚠️ [SignalR] Cannot subscribe: connection not initialized')
      return () => {}
    }

    // Store wrapper function to properly unsubscribe later
    const wrapper = (payload: InvoiceChangedPayload) => {
      console.log('📨 [SignalR] InvoiceChanged received:', payload)
      handler(payload)
    }

    console.log('📨 [SignalR] Subscribed to InvoiceChanged event')
    this.connection.on('InvoiceChanged', wrapper)

    // Return unsubscribe function
    return () => {
      if (this.connection) {
        this.connection.off('InvoiceChanged', wrapper) // ✅ Unsubscribe đúng wrapper
        console.log('🔕 [SignalR] Unsubscribed from InvoiceChanged')
      }
    }
  }

  /**
   * Subscribe to UserChanged event
   */
  public onUserChanged(handler: UserChangedHandler): () => void {
    if (!this.connection) {
      console.warn('⚠️ [SignalR] Cannot subscribe: connection not initialized')
      return () => {}
    }

    // Store wrapper function to properly unsubscribe later
    const wrapper = (payload: UserChangedPayload) => {
      console.log('📨 [SignalR] UserChanged received:', payload)
      handler(payload)
    }

    console.log('📨 [SignalR] Subscribed to UserChanged event')
    this.connection.on('UserChanged', wrapper)

    // Return unsubscribe function
    return () => {
      if (this.connection) {
        this.connection.off('UserChanged', wrapper) // ✅ Unsubscribe đúng wrapper
        console.log('🔕 [SignalR] Unsubscribed from UserChanged')
      }
    }
  }

  /**
   * Subscribe to DashboardChanged event
   */
  public onDashboardChanged(handler: DashboardChangedHandler): () => void {
    if (!this.connection) {
      console.warn('⚠️ [SignalR] Cannot subscribe: connection not initialized')
      return () => {}
    }

    // Store wrapper function to properly unsubscribe later
    const wrapper = (payload: DashboardChangedPayload) => {
      console.log('📨 [SignalR] DashboardChanged received:', payload)
      handler(payload)
    }

    console.log('📨 [SignalR] Subscribed to DashboardChanged event')
    this.connection.on('DashboardChanged', wrapper)

    // Return unsubscribe function
    return () => {
      if (this.connection) {
        this.connection.off('DashboardChanged', wrapper) // ✅ Unsubscribe đúng wrapper
        console.log('🔕 [SignalR] Unsubscribed from DashboardChanged')
      }
    }
  }

  /**
   * Get current connection state
   */
  public getState(): HubConnectionState {
    return this.connection?.state || HubConnectionState.Disconnected
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected
  }

  /**
   * Manually disconnect (for cleanup)
   */
  public async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop()
        console.log('🛑 [SignalR] Disconnected')
        this.isInitialized = false
      } catch (error) {
        console.error('❌ [SignalR] Error disconnecting:', error)
      }
    }
  }

  /**
   * Manually reconnect
   */
  public async reconnect(): Promise<void> {
    await this.disconnect()
    await this.initialize()
  }
}

// Export singleton instance
export const signalRService = new SignalRService()

// Export class for type
export default SignalRService
