// Sales Dashboard Types
// Security: All data filtered by salesId === currentUser.id

export interface SalesKPI {
  currentRevenue: number; // VND - This month
  lastMonthRevenue: number; // For comparison
  estimatedCommission: number; // Calculated from revenue
  commissionRate: number; // e.g., 2%
  newCustomers: number; // Count of new clients this month
  openInvoices: number; // Unpaid invoices needing follow-up
}

export interface TargetProgress {
  currentRevenue: number; // VND - Actual sales
  targetRevenue: number; // VND - Monthly goal
  completionRate: number; // Percentage (0-100)
  remainingAmount: number; // VND - Gap to target
  daysLeft: number; // Days remaining in month
}

export interface SalesTrendData {
  month: string; // e.g., "T07/2024"
  revenue: number; // VND
  invoiceCount: number; // Number of invoices
  commissionEarned: number; // VND
}

export interface DebtCustomer {
  id: string;
  name: string;
  company: string;
  overdueAmount: number; // VND
  overdueDays: number; // Days past due
  lastContactDate: Date | null;
  phone: string;
  email: string;
  urgencyLevel: 'critical' | 'high' | 'medium'; // Based on days
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number; // VND
  status: 'paid' | 'unpaid' | 'rejected' | 'pending';
  issueDate: Date;
  dueDate: Date;
  isPriority: boolean; // Rejected = needs immediate action
}

export interface SalesUser {
  id: string;
  name: string;
  role: 'sale';
}
