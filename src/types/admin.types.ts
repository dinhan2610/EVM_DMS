// Admin Dashboard Type Definitions
// Focus: System Health, Security Monitoring, User Management

export interface SystemKPI {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number; // e.g., 12.5 for +12.5%
    isPositive: boolean;
  };
  status: 'safe' | 'warning' | 'critical';
  subtitle?: string;
  progress?: number; // For Storage Usage (0-100)
}

export interface TrafficData {
  date: string; // "2024-12-01"
  requests: number;
  errors: number;
}

export interface UserDistribution {
  role: string; // "Admin", "HOD", "Staff", "Sale", "Customer"
  count: number;
  color: string;
  percentage?: number;
}

// Legacy AuditLog interface (for AdminDashboard component)
export interface AuditLog {
  id: string;
  timestamp: Date;
  actor: {
    name: string;
    avatar?: string;
  };
  role: 'Admin' | 'HOD' | 'Staff' | 'Sale' | 'Customer';
  action: string;
  ip: string;
  status: 'success' | 'failed';
}

// NEW: Backend Audit Log Types

/**
 * DATA LOG - Track database changes (CRUD operations)
 * Backend: GET /api/Audit/data-logs
 */
export interface DataLog {
  auditID: number
  traceId: string              // Request trace ID
  userID: number               // 0 = System, >0 = User ID
  userName: string             // "System" or user name
  action: 'Added' | 'Modified' | 'Deleted'
  tableName: string            // "Invoice", "User", "InvoiceItem", etc.
  recordId: string | null      // ID of affected record
  oldValues: string | null     // JSON string of old data
  newValues: string | null     // JSON string of new data
  timestamp: string            // ISO date string
}

/**
 * ACTIVITY LOG - Track user actions & system events
 * Backend: GET /api/Audit/activity-logs
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
 * Paginated response for audit logs
 */
export interface PaginatedAuditResponse<T> {
  items: T[]
  pageIndex: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Chart Tooltip Types
export interface TrafficTooltipPayload {
  date: string;
  requests: number;
  errors: number;
}

export interface UserPiePayload {
  role: string;
  count: number;
  color: string;
  percentage: number;
}
