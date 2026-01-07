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
