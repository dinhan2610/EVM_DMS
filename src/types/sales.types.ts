// Sales Dashboard Types
// Security: All data filtered by salesId === currentUser.id

// =====================================================
// SALES DASHBOARD API TYPES (NEW API Response)
// API: GET /api/Dashboard/sales
// =====================================================

export interface SalesDashboardAPI {
  currentUser: {
    userId: number
    userName: string
    fullName: string
    role: string
    email: string
    salesId: number
  }
  salesKPIs: {
    currentRevenue: number
    lastMonthRevenue: number
    revenueGrowthPercent: number
    totalCustomers: number
  }
  invoiceRequestStats: {
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    issuedCount: number
    totalThisMonth: number
    recentRequests: Array<{
      requestId: number
      customerName: string
      amount: number
      status: string // "Invoice_Issued", "Approved", "Rejected", "Pending"
      createdDate: string // ISO date
    }>
  }
  salesTrend: Array<{
    month: string // "T01/2026"
    monthNumber: number
    year: number
    revenue: number
    invoiceCount: number
    commissionEarned: number
  }>
  debtWatchlist: Array<{
    customerId: number
    customerName: string
    overdueAmount: number
    overdueDays: number
    lastContactDate: string | null
    phone: string
    email: string
    urgencyLevel: 'critical' | 'high' | 'medium'
  }>
  totalCustomerDebt: {
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
}

// =====================================================
// LEGACY TYPES (for existing components)
// =====================================================

export interface SalesKPI {
  currentRevenue: number // VND - This month
  lastMonthRevenue: number // For comparison
  estimatedCommission: number // Calculated from revenue
  commissionRate: number // e.g., 2%
  newCustomers: number // Count of new clients this month
  openInvoices: number // Unpaid invoices needing follow-up
}

export interface TargetProgress {
  currentRevenue: number // VND - Actual sales
  targetRevenue: number // VND - Monthly goal
  completionRate: number // Percentage (0-100)
  remainingAmount: number // VND - Gap to target
  daysLeft: number // Days remaining in month
}

export interface SalesTrendData {
  month: string // e.g., "T07/2024"
  revenue: number // VND
  invoiceCount: number // Number of invoices
  commissionEarned: number // VND
}

export interface DebtCustomer {
  id: string
  name: string
  company: string
  overdueAmount: number // VND
  overdueDays: number // Days past due
  lastContactDate: Date | null
  phone: string
  email: string
  urgencyLevel: 'critical' | 'high' | 'medium' // Based on days
}

export interface SalesInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number // VND
  status: 'paid' | 'unpaid' | 'rejected' | 'pending'
  issueDate: Date
  dueDate: Date
  isPriority: boolean // Rejected = needs immediate action
}

export interface SalesUser {
  id: string
  name: string
  role: 'sale'
}
