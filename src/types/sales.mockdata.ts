// Mock data for Sales Dashboard
// SCENARIO: "Salesperson A" - Mid-month performance, needs motivation
import type {
  SalesKPI,
  TargetProgress,
  SalesTrendData,
  DebtCustomer,
  SalesInvoice,
  SalesUser,
} from './sales.types';

// Current logged-in salesperson
export const currentSalesUser: SalesUser = {
  id: 'sale-001',
  name: 'Nguyễn Văn A',
  role: 'sale',
};

// Personal KPIs (This month vs Last month)
export const mockSalesKPI: SalesKPI = {
  currentRevenue: 85000000, // 85M VND (This month so far)
  lastMonthRevenue: 78000000, // 78M VND (Last month total)
  estimatedCommission: 1700000, // 1.7M VND (2% of 85M)
  commissionRate: 2, // 2%
  newCustomers: 8, // New clients added this month
  openInvoices: 12, // Unpaid invoices needing follow-up
};

// Target Progress (Monthly goal)
export const mockTargetProgress: TargetProgress = {
  currentRevenue: 85000000, // 85M VND
  targetRevenue: 100000000, // 100M VND (Target)
  completionRate: 85, // 85%
  remainingAmount: 15000000, // 15M VND to go
  daysLeft: 10, // 10 days left in month
};

// Sales Trend (Last 6 months)
export const mockSalesTrendData: SalesTrendData[] = [
  {
    month: 'T07/2024',
    revenue: 72000000,
    invoiceCount: 24,
    commissionEarned: 1440000,
  },
  {
    month: 'T08/2024',
    revenue: 78000000,
    invoiceCount: 28,
    commissionEarned: 1560000,
  },
  {
    month: 'T09/2024',
    revenue: 68000000,
    invoiceCount: 22,
    commissionEarned: 1360000,
  },
  {
    month: 'T10/2024',
    revenue: 82000000,
    invoiceCount: 30,
    commissionEarned: 1640000,
  },
  {
    month: 'T11/2024',
    revenue: 76000000,
    invoiceCount: 26,
    commissionEarned: 1520000,
  },
  {
    month: 'T12/2024',
    revenue: 85000000,
    invoiceCount: 29,
    commissionEarned: 1700000,
  },
];

// Debt Watchlist (Customers with overdue debt - CRITICAL for Sales)
export const mockDebtWatchlist: DebtCustomer[] = [
  {
    id: 'cust-045',
    name: 'Trần Văn B',
    company: 'Công ty TNHH XYZ',
    overdueAmount: 18500000, // 18.5M VND
    overdueDays: 45, // Critical
    lastContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    phone: '0912-345-678',
    email: 'tranvanb@xyz.com',
    urgencyLevel: 'critical',
  },
  {
    id: 'cust-067',
    name: 'Lê Thị C',
    company: 'Cửa hàng Điện máy C',
    overdueAmount: 12300000, // 12.3M VND
    overdueDays: 28, // High
    lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    phone: '0987-654-321',
    email: 'lethic@dienmayc.vn',
    urgencyLevel: 'high',
  },
  {
    id: 'cust-089',
    name: 'Phạm Văn D',
    company: 'Siêu thị Mini D',
    overdueAmount: 8700000, // 8.7M VND
    overdueDays: 18, // Medium
    lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    phone: '0909-111-222',
    email: 'phamvand@minimart.vn',
    urgencyLevel: 'medium',
  },
];

// Recent Invoices (My sales transactions - Last 10)
export const mockSalesInvoices: SalesInvoice[] = [
  {
    id: 'inv-s-001',
    invoiceNumber: 'HD-2024-1201',
    customerName: 'Công ty ABC',
    amount: 15000000,
    status: 'paid',
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-002',
    invoiceNumber: 'HD-2024-1202',
    customerName: 'Công ty TNHH XYZ',
    amount: 18500000,
    status: 'unpaid', // Overdue customer
    issueDate: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // Past due
    isPriority: true,
  },
  {
    id: 'inv-s-003',
    invoiceNumber: 'HD-2024-1203',
    customerName: 'Cửa hàng Điện máy C',
    amount: 12300000,
    status: 'rejected', // NEEDS IMMEDIATE ACTION
    issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    isPriority: true,
  },
  {
    id: 'inv-s-004',
    invoiceNumber: 'HD-2024-1204',
    customerName: 'Siêu thị E',
    amount: 9800000,
    status: 'paid',
    issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-005',
    invoiceNumber: 'HD-2024-1205',
    customerName: 'Công ty F',
    amount: 22000000,
    status: 'pending',
    issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-006',
    invoiceNumber: 'HD-2024-1206',
    customerName: 'Nhà hàng G',
    amount: 7500000,
    status: 'unpaid',
    issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-007',
    invoiceNumber: 'HD-2024-1207',
    customerName: 'Cửa hàng H',
    amount: 11200000,
    status: 'paid',
    issueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-008',
    invoiceNumber: 'HD-2024-1208',
    customerName: 'Công ty I',
    amount: 16800000,
    status: 'unpaid',
    issueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-009',
    invoiceNumber: 'HD-2024-1209',
    customerName: 'Siêu thị J',
    amount: 13500000,
    status: 'paid',
    issueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
  {
    id: 'inv-s-010',
    invoiceNumber: 'HD-2024-1210',
    customerName: 'Công ty K',
    amount: 19500000,
    status: 'pending',
    issueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    isPriority: false,
  },
];
