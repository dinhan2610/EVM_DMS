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
  kpis: {
    rejectedCount: number
    draftsCount: number
    sentToday: number
    customersToCall: number
  }
  taskQueue: Array<{
    invoiceId: number
    invoiceNumber: string
    customerName: string
    amount: number
    status: string
    priority: 'High' | 'Medium' | 'Low'
    taskType: 'Rejected' | 'Old Draft'
    taskDate: string // ISO string
    reason: string
  }>
  recentInvoices: Array<{
    invoiceId: number
    invoiceNumber: string
    customerName: string
    status: string
    totalAmount: number
    createdAt: string // ISO string
  }>
  generatedAt: string
}

// ==================== FRONTEND TYPES ====================

export interface StaffKPI {
  rejectedCount: number; // Critical - needs immediate fix
  draftsCount: number; // Pending work
  sentToday: number; // Productivity metric
  customersToCall: number; // Follow-up tasks
}

export interface TaskItem {
  id: string;
  type: 'rejected' | 'draft' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  invoiceNumber?: string;
  customerName?: string;
  reason?: string; // Rejection reason
  daysOld?: number; // For drafts
  amount?: number;
  createdDate: Date;
  actionUrl: string; // Navigation target
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Sent';
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: 'primary' | 'success' | 'info' | 'warning';
  path: string;
}
