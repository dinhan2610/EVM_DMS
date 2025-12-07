// Dashboard Types

export interface DashboardKPI {
  revenueToday: number
  revenueMonth: number
  totalReceivable: number // Tổng nợ phải thu
  pendingSignatures: number // Số hóa đơn chờ ký
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
