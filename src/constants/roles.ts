/**
 * 🔐 ROLE CONSTANTS - Định nghĩa các role trong hệ thống
 * Sử dụng cho phân quyền và điều hướng trang
 */

export const USER_ROLES = {
  // === ADMIN ROLE ===
  ADMIN: 'Admin',                    // Quản trị viên - Full quyền
  
  // === HOD ROLE ===
  HOD: 'HOD',                        // Kế toán trưởng - Full quyền NHƯNG không có Invoice Management
  
  // === ACCOUNTANT ROLE ===
  ACCOUNTANT: 'Accountant',          // Kế toán - Có Invoice Management NHƯNG không duyệt HĐ
  
  // === SALES ROLE ===
  SALES: 'Sale',                     // Kinh doanh - Khách hàng của tôi + Tạo yêu cầu xuất HĐ (backend: "Sale")
  
  // === CUSTOMER ROLE (KHÔNG SỬ DỤNG - Chỉ nhân viên nội bộ) ===
  CUSTOMER: 'Customer',              // Khách hàng - Tra cứu hóa đơn công khai
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/**
 * 🎭 ROLE LABELS - Tên hiển thị của các role
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Quản trị viên',
  [USER_ROLES.HOD]: 'Kế toán trưởng',
  [USER_ROLES.ACCOUNTANT]: 'Kế toán',
  [USER_ROLES.SALES]: 'Kinh doanh',
  [USER_ROLES.CUSTOMER]: 'Khách hàng',
}

/**
 * 🏠 DEFAULT DASHBOARD - Dashboard mặc định cho mỗi role sau khi login
 */
export const DEFAULT_DASHBOARD: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: '/dashboard/admin',
  [USER_ROLES.HOD]: '/dashboard/hod',
  [USER_ROLES.ACCOUNTANT]: '/dashboard/staff',
  [USER_ROLES.SALES]: '/dashboard/sale',
  [USER_ROLES.CUSTOMER]: '/dashboard/customer',
}

/**
 * 🔑 ROLE PERMISSIONS - Định nghĩa quyền của từng role
 */
export const ROLE_PERMISSIONS = {
  // === ADMIN - Full quyền ===
  [USER_ROLES.ADMIN]: {
    canViewInvoiceList: true,          // ✅ Xem /invoices (Danh sách HĐ)
    canAccessApprovalPage: true,       // ✅ Xem /approval/invoices (Duyệt HĐ)
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: true,
    canSignInvoice: true,
    canManageUsers: true,
    canManageTemplates: true,
    canManageSettings: true,
    canViewReports: true,
    canManageCustomers: true,
    canViewAuditLogs: true,
    canAccessSalesModule: false,       // ❌ Không cần module Sales
    canAccessPublicLookup: false,      // ❌ Không cần tra cứu công khai
  },
  
  // === HOD - Kế toán trưởng ===
  [USER_ROLES.HOD]: {
    canViewInvoiceList: false,         // ❌ KHÔNG xem /invoices (KEY REQUIREMENT)
    canAccessApprovalPage: true,       // ✅ Xem /approval/invoices (KEY REQUIREMENT)
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canSignInvoice: true,              // ✅ Quyền ký hóa đơn
    canManageUsers: false,
    canManageTemplates: true,
    canManageSettings: false,
    canViewReports: true,
    canManageCustomers: true,
    canViewAuditLogs: true,
    canAccessSalesModule: false,
    canAccessPublicLookup: false,
  },
  
  // === ACCOUNTANT - Kế toán ===
  [USER_ROLES.ACCOUNTANT]: {
    canViewInvoiceList: true,          // ✅ Xem /invoices (KEY REQUIREMENT)
    canAccessApprovalPage: false,      // ❌ KHÔNG xem /approval/invoices (KEY REQUIREMENT)
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canSignInvoice: false,
    canManageUsers: false,
    canManageTemplates: true,          // ✅ Quản lý templates
    canManageSettings: false,
    canViewReports: true,
    canManageCustomers: true,
    canViewAuditLogs: false,
    canAccessSalesModule: false,
    canAccessPublicLookup: false,
  },
  
  // === SALES - Kinh doanh ===
  [USER_ROLES.SALES]: {
    canViewInvoiceList: false,
    canAccessApprovalPage: false,
    canCreateInvoice: false,           // ❌ Không tạo HĐ trực tiếp
    canEditInvoice: false,
    canDeleteInvoice: false,
    canSignInvoice: false,
    canManageUsers: false,
    canManageTemplates: false,
    canManageSettings: false,
    canViewReports: false,
    canManageCustomers: false,         // ❌ Không quản lý tất cả KH
    canViewAuditLogs: false,
    canAccessSalesModule: true,        // ✅ Module Sales (KEY REQUIREMENT)
    canAccessPublicLookup: false,
  },
  
  // === CUSTOMER - Khách hàng ===
  [USER_ROLES.CUSTOMER]: {
    canViewInvoiceList: false,
    canAccessApprovalPage: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canSignInvoice: false,
    canManageUsers: false,
    canManageTemplates: false,
    canManageSettings: false,
    canViewReports: false,
    canManageCustomers: false,
    canViewAuditLogs: false,
    canAccessSalesModule: false,
    canAccessPublicLookup: true,       // ✅ Tra cứu HĐ công khai (KEY REQUIREMENT)
  },
}

/**
 * Helper function: Kiểm tra user có role cụ thể không
 */
export const hasRole = (userRole: string | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false
  return allowedRoles.includes(userRole as UserRole)
}

/**
 * Helper function: Kiểm tra user có permission cụ thể không
 */
export const hasPermission = (userRole: string | undefined, permission: keyof typeof ROLE_PERMISSIONS['Admin']): boolean => {
  if (!userRole) return false
  const rolePermissions = ROLE_PERMISSIONS[userRole as UserRole]
  return rolePermissions ? rolePermissions[permission] : false
}
