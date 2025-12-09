// Mock data for HOD Dashboard (Advanced Financial Analysis)
import type {
  FinancialHealthKPI,
  CashFlowData,
  DebtAgingData,
  PendingInvoice,
} from './dashboard.types';

// Financial Health KPIs
export const mockFinancialHealthKPI: FinancialHealthKPI = {
  netRevenue: 4250000000, // 4.25 tỷ VNĐ (Total invoiced this month)
  cashCollected: 3400000000, // 3.4 tỷ VNĐ (Total payments received)
  collectionRate: 80, // 80% collection rate
  estimatedVAT: 425000000, // 425 triệu VNĐ (10% of revenue)
  criticalDebt: 340000000, // 340 triệu VNĐ (Debt >90 days)
  criticalDebtCount: 8, // 8 customers with critical debt
};

// Cash Flow Data (6 months) - Ensure Collected <= Invoiced
export const mockCashFlowData: CashFlowData[] = [
  {
    month: 'T07/2024',
    invoiced: 3800000000,
    collected: 3200000000,
    outstanding: 600000000,
    collectionRate: 84.2,
  },
  {
    month: 'T08/2024',
    invoiced: 4100000000,
    collected: 3450000000,
    outstanding: 650000000,
    collectionRate: 84.1,
  },
  {
    month: 'T09/2024',
    invoiced: 3900000000,
    collected: 3100000000,
    outstanding: 800000000,
    collectionRate: 79.5,
  },
  {
    month: 'T10/2024',
    invoiced: 4350000000,
    collected: 3600000000,
    outstanding: 750000000,
    collectionRate: 82.8,
  },
  {
    month: 'T11/2024',
    invoiced: 4200000000,
    collected: 3300000000,
    outstanding: 900000000,
    collectionRate: 78.6,
  },
  {
    month: 'T12/2024',
    invoiced: 4250000000,
    collected: 3400000000,
    outstanding: 850000000,
    collectionRate: 80.0,
  },
];

// Debt Aging Data (Risk Visualization)
export const mockDebtAgingData: DebtAgingData[] = [
  {
    category: 'Trong hạn',
    amount: 1200000000, // 1.2 tỷ VNĐ
    count: 45,
    color: '#10b981', // Green - Safe
  },
  {
    category: '1-30 ngày',
    amount: 650000000, // 650 triệu VNĐ
    count: 28,
    color: '#fbbf24', // Yellow - Caution
  },
  {
    category: '31-60 ngày',
    amount: 420000000, // 420 triệu VNĐ
    count: 15,
    color: '#f59e0b', // Orange - Warning
  },
  {
    category: '60+ ngày',
    amount: 340000000, // 340 triệu VNĐ (Critical)
    count: 8,
    color: '#dc2626', // Red - Critical
  },
];

// Pending Invoices for Approval Queue
export const mockPendingInvoices: PendingInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'HD-2024-1205',
    customer: 'Công ty TNHH ABC',
    amount: 125000000,
    createdBy: 'Nguyễn Văn A',
    createdDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    priority: 'high',
    type: 'VAT',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'HD-2024-1204',
    customer: 'Công ty CP XYZ',
    amount: 85000000,
    createdBy: 'Trần Thị B',
    createdDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    priority: 'high',
    type: 'Standard',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'HD-2024-1203',
    customer: 'Công ty TNHH DEF',
    amount: 67000000,
    createdBy: 'Lê Văn C',
    createdDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    priority: 'medium',
    type: 'VAT',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'HD-2024-1202',
    customer: 'Công ty CP GHI',
    amount: 95000000,
    createdBy: 'Phạm Thị D',
    createdDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    priority: 'medium',
    type: 'Adjustment',
  },
  {
    id: 'inv-005',
    invoiceNumber: 'HD-2024-1201',
    customer: 'Công ty TNHH JKL',
    amount: 42000000,
    createdBy: 'Hoàng Văn E',
    createdDate: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    priority: 'low',
    type: 'Standard',
  },
  {
    id: 'inv-006',
    invoiceNumber: 'HD-2024-1200',
    customer: 'Công ty CP MNO',
    amount: 138000000,
    createdBy: 'Vũ Thị F',
    createdDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    priority: 'high',
    type: 'VAT',
  },
  {
    id: 'inv-007',
    invoiceNumber: 'HD-2024-1199',
    customer: 'Công ty TNHH PQR',
    amount: 56000000,
    createdBy: 'Đỗ Văn G',
    createdDate: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
    priority: 'low',
    type: 'Standard',
  },
  {
    id: 'inv-008',
    invoiceNumber: 'HD-2024-1198',
    customer: 'Công ty CP STU',
    amount: 72000000,
    createdBy: 'Bùi Thị H',
    createdDate: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
    priority: 'medium',
    type: 'Adjustment',
  },
];
