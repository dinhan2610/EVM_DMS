// Types for Staff Dashboard (Operational Workspace)

// ==================== API RESPONSE TYPES ====================

export interface AccountantDashboardAPI {
  currentUser: {
    userId: number
    userName: string | null
    fullName: string
    role: string
    email: string
  }
  overviewStats: {
    totalMonthlyRevenue: number
    totalInvoiceRequests: number
    totalProducts: number
    totalInvoicesIssued: number
    totalInvoicesPendingApproval: number
    totalDebtAll: number
  }
  kpis: {
    rejectedCount: number
    draftsCount: number
    sentToday: number
    totalMonthlyRevenue: number
    lastMonthRevenue: number
    revenueGrowthPercent: number
    pendingApproval: number
    urgentTasks: number
  }
  invoiceRequestStats: {
    pendingCount: number
    processedCount: number
    rejectedCount: number
    totalThisMonth: number
    recentRequests: Array<{
      requestId: number
      customerName: string
      totalAmount: number
      status: string
      createdDate: string
      daysWaiting: number
    }>
  }
  totalMonthlyDebt: {
    totalDebtors: number
    totalUnpaidAmount: number
    totalOverdueAmount: number
    overdueCustomerCount: number
    lastMonthTotalDebt: number
    debtGrowthPercent: number
    averageDebtPerCustomer: number
    debtByUrgency: {
      critical: number
      high: number
      medium: number
    }
  }
  taskQueue: Array<{
    invoiceId: number
    invoiceNumber: string | null
    customerName: string
    amount: number
    status: string
    priority: 'Critical' | 'High' | 'Medium' | 'Low'
    taskType: 'Rejected' | 'Old Draft' | 'Pending Approval'
    taskDate: string
    reason: string | null
    invoiceType: number
    invoiceTypeName: string
    daysOld: number
  }>
  recentInvoices: Array<{
    invoiceId: number
    invoiceNumber: string | null
    customerName: string
    status: string
    totalAmount: number
    createdAt: string
  }>
  taskQueueTotal: number
  recentInvoicesTotal: number
  generatedAt: string
}

// ==================== FRONTEND TYPES ====================

export interface StaffKPI {
  rejectedCount: number // Critical - needs immediate fix
  draftsCount: number // Pending work
  sentToday: number // Productivity metric
  customersToCall: number // Follow-up tasks
}

export interface TaskItem {
  id: string
  type: 'rejected' | 'draft' | 'overdue'
  priority: 'high' | 'medium' | 'low'
  invoiceNumber?: string
  customerName?: string
  reason?: string // Rejection reason
  daysOld?: number // For drafts
  amount?: number
  createdDate: Date
  actionUrl: string // Navigation target
}

export interface RecentInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Sent'
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  color: 'primary' | 'success' | 'info' | 'warning'
  path: string
}
