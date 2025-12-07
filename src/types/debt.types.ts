// Debt Management Interfaces & Types
export interface DebtInvoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue'
  description: string
}

export interface CustomerDebt {
  customerId: string
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
  id: string
  invoiceId: string
  invoiceNo: string
  amount: number
  paymentDate: string
  method: 'Transfer' | 'Cash'
  note: string
  createdBy: string
}
