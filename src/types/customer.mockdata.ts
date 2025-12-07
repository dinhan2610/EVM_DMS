// Mock data for Customer Portal Dashboard
// SCENARIO: "Customer X" - Company with outstanding debt, needs to pay
import type {
  CustomerUser,
  DebtSummary,
  SupportContact,
  SpendingData,
  CustomerInvoice,
  BankInfo,
} from './customer.types';

// Current logged-in customer
export const currentCustomerUser: CustomerUser = {
  customerId: 'cust-001',
  name: 'Trần Văn B',
  company: 'Công ty TNHH ABC',
  taxCode: '0123456789',
  email: 'tranvanb@abc.com',
  phone: '0912-345-678',
};

// Debt Summary (Matches sum of unpaid invoices)
export const mockDebtSummary: DebtSummary = {
  totalDebt: 15400000, // 15.4M VND (Sum of unpaid invoices)
  nearestDueDate: new Date('2025-01-20'), // Next due date
  overdueAmount: 5200000, // 5.2M VND (Overdue portion)
  unpaidInvoiceCount: 3, // 3 unpaid invoices
};

// Support Contact (Account Manager)
export const mockSupportContact: SupportContact = {
  id: 'emp-008',
  name: 'Nguyễn Thị Hạnh',
  role: 'Kế toán viên',
  phone: '0987-654-321',
  email: 'hanh.nguyen@company.vn',
  department: 'Phòng Kế toán',
};

// Spending Analysis (Current Year - 12 months)
export const mockSpendingData: SpendingData[] = [
  {
    month: 'T01/2025',
    totalAmount: 8500000,
    invoiceCount: 3,
    paidAmount: 8500000,
    unpaidAmount: 0,
  },
  {
    month: 'T02/2025',
    totalAmount: 9200000,
    invoiceCount: 4,
    paidAmount: 9200000,
    unpaidAmount: 0,
  },
  {
    month: 'T03/2025',
    totalAmount: 7800000,
    invoiceCount: 2,
    paidAmount: 7800000,
    unpaidAmount: 0,
  },
  {
    month: 'T04/2025',
    totalAmount: 10500000,
    invoiceCount: 5,
    paidAmount: 10500000,
    unpaidAmount: 0,
  },
  {
    month: 'T05/2025',
    totalAmount: 8900000,
    invoiceCount: 3,
    paidAmount: 8900000,
    unpaidAmount: 0,
  },
  {
    month: 'T06/2025',
    totalAmount: 11200000,
    invoiceCount: 4,
    paidAmount: 11200000,
    unpaidAmount: 0,
  },
  {
    month: 'T07/2025',
    totalAmount: 9600000,
    invoiceCount: 3,
    paidAmount: 9600000,
    unpaidAmount: 0,
  },
  {
    month: 'T08/2025',
    totalAmount: 12300000,
    invoiceCount: 5,
    paidAmount: 12300000,
    unpaidAmount: 0,
  },
  {
    month: 'T09/2025',
    totalAmount: 8700000,
    invoiceCount: 2,
    paidAmount: 8700000,
    unpaidAmount: 0,
  },
  {
    month: 'T10/2025',
    totalAmount: 10100000,
    invoiceCount: 4,
    paidAmount: 5900000,
    unpaidAmount: 4200000, // Partial unpaid
  },
  {
    month: 'T11/2025',
    totalAmount: 13500000,
    invoiceCount: 5,
    paidAmount: 7300000,
    unpaidAmount: 6200000, // Partial unpaid
  },
  {
    month: 'T12/2025',
    totalAmount: 5000000,
    invoiceCount: 2,
    paidAmount: 0,
    unpaidAmount: 5000000, // All unpaid
  },
];

// Customer Invoice History (Last 15 invoices)
export const mockCustomerInvoices: CustomerInvoice[] = [
  // Recent Unpaid/Overdue (Current debt)
  {
    id: 'inv-c-001',
    invoiceNumber: 'HD-2024-1115',
    issueDate: new Date('2024-11-15'),
    dueDate: new Date('2024-12-15'), // Overdue (past due)
    amount: 5200000,
    paidAmount: 0,
    status: 'overdue',
    description: 'Hóa đơn dịch vụ tháng 11',
    pdfUrl: '/invoices/HD-2024-1115.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-002',
    invoiceNumber: 'HD-2024-1208',
    issueDate: new Date('2024-12-08'),
    dueDate: new Date('2025-01-07'), // Not due yet
    amount: 5200000,
    paidAmount: 0,
    status: 'unpaid',
    description: 'Hóa đơn dịch vụ tháng 12',
    pdfUrl: '/invoices/HD-2024-1208.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-003',
    invoiceNumber: 'HD-2024-1201',
    issueDate: new Date('2024-12-01'),
    dueDate: new Date('2025-01-20'), // Nearest due date
    amount: 5000000,
    paidAmount: 0,
    status: 'unpaid',
    description: 'Hóa đơn hàng hóa',
    pdfUrl: '/invoices/HD-2024-1201.pdf',
    canDownload: true,
  },

  // Paid Invoices (History)
  {
    id: 'inv-c-004',
    invoiceNumber: 'HD-2024-1025',
    issueDate: new Date('2024-10-25'),
    dueDate: new Date('2024-11-24'),
    amount: 4800000,
    paidAmount: 4800000,
    status: 'paid',
    description: 'Hóa đơn dịch vụ tháng 10',
    pdfUrl: '/invoices/HD-2024-1025.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-005',
    invoiceNumber: 'HD-2024-0920',
    issueDate: new Date('2024-09-20'),
    dueDate: new Date('2024-10-20'),
    amount: 8700000,
    paidAmount: 8700000,
    status: 'paid',
    description: 'Hóa đơn hàng hóa tháng 9',
    pdfUrl: '/invoices/HD-2024-0920.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-006',
    invoiceNumber: 'HD-2024-0815',
    issueDate: new Date('2024-08-15'),
    dueDate: new Date('2024-09-14'),
    amount: 12300000,
    paidAmount: 12300000,
    status: 'paid',
    description: 'Hóa đơn combo dịch vụ + hàng',
    pdfUrl: '/invoices/HD-2024-0815.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-007',
    invoiceNumber: 'HD-2024-0710',
    issueDate: new Date('2024-07-10'),
    dueDate: new Date('2024-08-09'),
    amount: 9600000,
    paidAmount: 9600000,
    status: 'paid',
    description: 'Hóa đơn dịch vụ tháng 7',
    pdfUrl: '/invoices/HD-2024-0710.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-008',
    invoiceNumber: 'HD-2024-0605',
    issueDate: new Date('2024-06-05'),
    dueDate: new Date('2024-07-05'),
    amount: 11200000,
    paidAmount: 11200000,
    status: 'paid',
    description: 'Hóa đơn hàng hóa tháng 6',
    pdfUrl: '/invoices/HD-2024-0605.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-009',
    invoiceNumber: 'HD-2024-0520',
    issueDate: new Date('2024-05-20'),
    dueDate: new Date('2024-06-19'),
    amount: 8900000,
    paidAmount: 8900000,
    status: 'paid',
    description: 'Hóa đơn dịch vụ tháng 5',
    pdfUrl: '/invoices/HD-2024-0520.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-010',
    invoiceNumber: 'HD-2024-0415',
    issueDate: new Date('2024-04-15'),
    dueDate: new Date('2024-05-15'),
    amount: 10500000,
    paidAmount: 10500000,
    status: 'paid',
    description: 'Hóa đơn combo tháng 4',
    pdfUrl: '/invoices/HD-2024-0415.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-011',
    invoiceNumber: 'HD-2024-0308',
    issueDate: new Date('2024-03-08'),
    dueDate: new Date('2024-04-07'),
    amount: 7800000,
    paidAmount: 7800000,
    status: 'paid',
    description: 'Hóa đơn dịch vụ tháng 3',
    pdfUrl: '/invoices/HD-2024-0308.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-012',
    invoiceNumber: 'HD-2024-0225',
    issueDate: new Date('2024-02-25'),
    dueDate: new Date('2024-03-26'),
    amount: 9200000,
    paidAmount: 9200000,
    status: 'paid',
    description: 'Hóa đơn hàng hóa tháng 2',
    pdfUrl: '/invoices/HD-2024-0225.pdf',
    canDownload: true,
  },
  {
    id: 'inv-c-013',
    invoiceNumber: 'HD-2024-0115',
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-14'),
    amount: 8500000,
    paidAmount: 8500000,
    status: 'paid',
    description: 'Hóa đơn dịch vụ tháng 1',
    pdfUrl: '/invoices/HD-2024-0115.pdf',
    canDownload: true,
  },
];

// Bank Info for Payment QR Code
export const mockBankInfo: BankInfo = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  accountName: 'CONG TY TNHH ABC',
  branch: 'Chi nhánh Hà Nội',
};
