// Customer Portal Dashboard Types
// Security: All data filtered by customerId === currentUser.customerId

export interface CustomerUser {
  customerId: string;
  name: string;
  company: string;
  taxCode: string;
  email: string;
  phone: string;
}

export interface DebtSummary {
  totalDebt: number; // VND - Current outstanding balance
  nearestDueDate: Date | null; // Next payment due date
  overdueAmount: number; // VND - Amount overdue
  unpaidInvoiceCount: number; // Number of unpaid invoices
}

export interface SupportContact {
  id: string;
  name: string;
  role: string; // e.g., "Kế toán viên", "Nhân viên kinh doanh"
  avatar?: string;
  phone: string;
  email: string;
  department: string;
}

export interface SpendingData {
  month: string; // e.g., "T01/2025"
  totalAmount: number; // VND - Total invoiced this month
  invoiceCount: number; // Number of invoices
  paidAmount: number; // VND - Amount paid
  unpaidAmount: number; // VND - Amount unpaid
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number; // VND
  paidAmount: number; // VND - Amount paid (for partial payments)
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  description: string;
  pdfUrl?: string; // URL to download PDF
  canDownload: boolean;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
}
