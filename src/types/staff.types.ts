// Types for Staff Dashboard (Operational Workspace)

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
