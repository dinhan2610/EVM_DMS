// Mock Data for Staff Dashboard - Scenario: Busy accountant with urgent tasks
import type { StaffKPI, TaskItem, RecentInvoice } from './staff.types';

// Current user context
export const currentUser = 'Nguyễn Văn A';

// Staff KPIs - Showing workload status
export const mockStaffKPI: StaffKPI = {
  rejectedCount: 2, // CRITICAL - Need immediate attention
  draftsCount: 3, // Pending work
  sentToday: 5, // Good productivity
  customersToCall: 4, // Follow-up tasks
};

// Unified Task Queue - Combines rejected invoices and old drafts
export const mockTaskQueue: TaskItem[] = [
  // Rejected invoices (HIGHEST PRIORITY)
  {
    id: 'task-001',
    type: 'rejected',
    priority: 'high',
    invoiceNumber: 'HD-2024-005',
    customerName: 'Công ty TNHH ABC',
    reason: 'Sai mã số thuế - Vui lòng kiểm tra lại MST 0123456789',
    amount: 125000000,
    createdDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    actionUrl: '/invoices/edit/HD-2024-005',
  },
  {
    id: 'task-002',
    type: 'rejected',
    priority: 'high',
    invoiceNumber: 'HD-2024-008',
    customerName: 'Công ty CP XYZ',
    reason: 'Thiếu chữ ký điện tử - Cần upload lại chữ ký hợp lệ',
    amount: 85000000,
    createdDate: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    actionUrl: '/invoices/edit/HD-2024-008',
  },
  
  // Old drafts (MEDIUM PRIORITY)
  {
    id: 'task-003',
    type: 'draft',
    priority: 'medium',
    invoiceNumber: 'HD-2024-012',
    customerName: 'Công ty TNHH DEF',
    daysOld: 3,
    amount: 67000000,
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    actionUrl: '/invoices/edit/HD-2024-012',
  },
  {
    id: 'task-004',
    type: 'draft',
    priority: 'medium',
    invoiceNumber: 'HD-2024-015',
    customerName: 'Công ty CP GHI',
    daysOld: 2,
    amount: 95000000,
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    actionUrl: '/invoices/edit/HD-2024-015',
  },
  {
    id: 'task-005',
    type: 'draft',
    priority: 'low',
    invoiceNumber: 'HD-2024-018',
    customerName: 'Công ty TNHH JKL',
    daysOld: 1,
    amount: 42000000,
    createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    actionUrl: '/invoices/edit/HD-2024-018',
  },
  
  // Overdue customers (FOLLOW-UP)
  {
    id: 'task-006',
    type: 'overdue',
    priority: 'medium',
    customerName: 'Công ty CP MNO',
    invoiceNumber: 'HD-2024-001',
    daysOld: 45,
    amount: 138000000,
    createdDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    actionUrl: '/customers/detail/MNO',
  },
];

// Recent Invoices created by current user
export const mockRecentInvoices: RecentInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'HD-2024-025',
    customerName: 'Công ty TNHH ABC',
    amount: 125000000,
    status: 'Sent',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
  },
  {
    id: 'inv-002',
    invoiceNumber: 'HD-2024-024',
    customerName: 'Công ty CP XYZ',
    amount: 85000000,
    status: 'Approved',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
  },
  {
    id: 'inv-003',
    invoiceNumber: 'HD-2024-023',
    customerName: 'Công ty TNHH DEF',
    amount: 67000000,
    status: 'Sent',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
  },
  {
    id: 'inv-004',
    invoiceNumber: 'HD-2024-022',
    customerName: 'Công ty CP GHI',
    amount: 95000000,
    status: 'Pending',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8h ago
  },
  {
    id: 'inv-005',
    invoiceNumber: 'HD-2024-021',
    customerName: 'Công ty TNHH JKL',
    amount: 42000000,
    status: 'Sent',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10h ago
  },
  {
    id: 'inv-006',
    invoiceNumber: 'HD-2024-008',
    customerName: 'Công ty CP XYZ',
    amount: 85000000,
    status: 'Rejected',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h ago
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Rejected 5h ago
  },
  {
    id: 'inv-007',
    invoiceNumber: 'HD-2024-005',
    customerName: 'Công ty TNHH ABC',
    amount: 125000000,
    status: 'Rejected',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14h ago
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Rejected 3h ago
  },
  {
    id: 'inv-008',
    invoiceNumber: 'HD-2024-018',
    customerName: 'Công ty TNHH JKL',
    amount: 42000000,
    status: 'Draft',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 'inv-009',
    invoiceNumber: 'HD-2024-015',
    customerName: 'Công ty CP GHI',
    amount: 95000000,
    status: 'Draft',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 'inv-010',
    invoiceNumber: 'HD-2024-012',
    customerName: 'Công ty TNHH DEF',
    amount: 67000000,
    status: 'Draft',
    createdBy: currentUser,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];
