// Dashboard Types

// Original KPIs (Keep for backward compatibility)
export interface DashboardKPI {
  revenueToday: number
  revenueMonth: number
  totalReceivable: number // Tổng nợ phải thu
  pendingSignatures: number // Số hóa đơn chờ ký
}

// NEW: Advanced Financial KPIs for HOD
export interface FinancialHealthKPI {
  netRevenue: number // Doanh thu thuần (Total invoiced this month)
  cashCollected: number // Thực thu (Total payments received)
  collectionRate: number // % of revenue collected
  estimatedVAT: number // VAT phải nộp (Output - Input)
  criticalDebt: number // Nợ quá hạn >90 days
  criticalDebtCount: number // Số lượng nợ nguy hiểm
}

// NEW: Cash Flow Data
export interface CashFlowData {
  month: string
  invoiced: number // Total invoiced
  collected: number // Total collected
  outstanding: number // Invoiced - Collected
  collectionRate: number // (Collected/Invoiced) * 100
}

// NEW: Debt Aging Data
export interface DebtAgingData {
  category: string
  amount: number
  count: number
  color: string
}

// NEW: Invoice for Approval Queue
export interface PendingInvoice {
  id: string
  invoiceNumber: string
  customer: string
  amount: number
  createdBy: string
  createdDate: Date
  priority: 'low' | 'medium' | 'high'
  invoiceType: number // 1=Gốc, 2=Điều chỉnh, 3=Thay thế, 4=Hủy, 5=Giải trình
  originalInvoiceID?: number | null
  originalInvoiceNumber?: number
  originalInvoiceSignDate?: string | null
  originalInvoiceSymbol?: string | null
  adjustmentReason?: string | null
  replacementReason?: string | null
  cancellationReason?: string | null
  explanationText?: string | null
}

export interface RevenueChartData {
  month: string
  revenue: number
  target: number
}

export interface InvoiceStatusData {
  status: string
  count: number
  color: string
}

export interface RecentActivity {
  id: string
  type: 'invoice' | 'payment' | 'signature' | 'system'
  title: string
  description: string
  timestamp: string
  user: string
  icon: string
}

export interface QuickReport {
  id: string
  name: string
  description: string
  icon: string
  color: string
  route: string
}

// =====================================================
// ADMIN DASHBOARD API TYPES
// API: GET /api/Dashboard/admin
// =====================================================

export interface CurrentMonthStats {
  totalRevenue: number        // Tổng doanh thu tháng này
  netProfit: number          // Lợi nhuận ròng
  taxLiability: number       // Thuế phải nộp
  collectedAmount: number    // Đã thu
  outstandingAmount: number  // Còn nợ
  overdueAmount: number      // Quá hạn
}

export interface AllTimeStats {
  totalRevenue: number        // Tổng doanh thu (all time)
  netProfit: number          // Tổng lợi nhuận (all time)
  taxLiability: number       // Tổng thuế (all time)
  collectedAmount: number    // Đã thu (all time)
  outstandingAmount: number  // Còn nợ (all time)
  overdueAmount: number      // Quá hạn (all time)
}

export interface InvoiceCounts {
  total: number      // Tổng hóa đơn
  paid: number       // Đã thanh toán
  unpaid: number     // Chưa thanh toán
  overdue: number    // Quá hạn
  cancelled: number  // Đã hủy
}

export interface UserStats {
  totalUsers: number          // Tổng số user
  totalCustomers: number      // Tổng số khách hàng
  newUsersThisMonth: number   // User mới tháng này
  usersByRole?: Array<{       // Phân bổ user theo role (optional - BE added)
    role: string              // "Admin", "Accountant", "Sale", "HOD", "Customer"
    count: number
  }>
}

export interface RevenueTrendItem {
  month: string        // "Dec 2025", "Jan 2026"
  monthNumber: number  // 12, 1
  year: number         // 2025, 2026
  revenue: number      // Doanh thu tháng đó
}

export interface TopCustomer {
  customerName: string   // Tên khách hàng
  invoiceCount: number   // Số lượng hóa đơn
  totalSpent: number     // Tổng chi tiêu
}

export interface RecentInvoice {
  invoiceId: number
  invoiceNumber: number
  customerName: string
  createdAt: string           // ISO date string
  amount: number
  statusName: string          // "Issued", "AdjustmentInProcess", "Replaced", "Cancelled", "Pending"
  paymentStatus: string       // "Paid", "Unpaid", "PartiallyPaid"
  dueDate?: string            // ISO date string (optional - BE added)
  isOverdue?: boolean         // true if overdue (optional - BE added)
}

export interface AdminDashboardData {
  currentMonthStats: CurrentMonthStats
  allTimeStats: AllTimeStats
  invoiceCounts: InvoiceCounts
  userStats: UserStats
  revenueTrend: RevenueTrendItem[]
  topCustomers: TopCustomer[]
  recentInvoices: RecentInvoice[]
  revenueGrowthPercentage: number  // % tăng trưởng doanh thu
}

// Helper types for Admin Dashboard UI
export interface AdminFinancialKPI {
  id: string
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  bgColor: string
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
}
