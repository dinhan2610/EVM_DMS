// Debt Management Interfaces & Types

// ==================== BACKEND-ALIGNED TYPES ====================

export interface DebtInvoice {
  id: number // Changed from string to number to match backend
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue'
  description: string
  customerId?: number
  customerName?: string
}

export interface CustomerDebt {
  customerId: number // Changed from string to number
  customerName: string
  taxCode: string
  email: string
  phone: string
  address: string
  totalDebt: number
  overdueDebt: number
  invoiceCount: number
  lastPaymentDate: string | null
}

export interface PaymentRecord {
  id: number // Changed from string to number
  invoiceId: number // Changed from string to number
  invoiceNo?: string // Optional, for display purposes
  amount: number
  paymentDate: string
  paymentMethod: string // Changed from enum to string to match backend
  transactionCode?: string // Added field from backend
  note?: string // Made optional
  userId: number // Changed from createdBy (string) to userId (number)
  userName?: string // Optional, for display purposes
  createdAt?: string // Added backend field
}

// ==================== REQUEST/FORM TYPES ====================

export interface PaymentFormData {
  amount: number
  paymentDate: string
  paymentMethod: string
  transactionCode?: string
  note?: string
}

// Payment method constants (to be confirmed with backend)
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'BankTransfer',
  CREDIT_CARD: 'CreditCard',
  DEBIT_CARD: 'DebitCard',
  EWALLET: 'EWallet',
  CHECK: 'Check',
  OTHER: 'Other',
} as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

