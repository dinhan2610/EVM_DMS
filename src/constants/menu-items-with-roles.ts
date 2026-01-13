import type { MenuItemType } from '@/types/menu'
import { USER_ROLES, type UserRole } from '@/constants/roles'

/**
 * 🎯 FLAT MENU ITEMS - NO DROPDOWNS
 * Tất cả menu items hiển thị trực tiếp, không có parent/children hierarchy
 */

// === DASHBOARD ===
const dashboardMenu: MenuItemType = {
  key: 'dashboard',
  icon: 'iconamoon:home-duotone',
  label: 'Dashboard',
  url: '/dashboard',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES],
}

// === ADMIN MENUS (Flattened) ===
const adminTemplates: MenuItemType = {
  key: 'admin-templates',
  icon: 'iconamoon:file-document-duotone',
  label: 'Mẫu hoá đơn',
  url: '/admin/templates',
  roles: [USER_ROLES.ADMIN],
}

const adminEmailTemplates: MenuItemType = {
  key: 'admin-email-templates',
  icon: 'iconamoon:send-duotone',
  label: 'Mẫu Email',
  url: '/admin/email-templates',
  roles: [USER_ROLES.ADMIN],
}

const adminUsers: MenuItemType = {
  key: 'admin-users',
  icon: 'iconamoon:profile-circle-duotone',
  label: 'Người dùng',
  url: '/admin/usermanager',
  roles: [USER_ROLES.ADMIN],
}

const adminRolesPermissions: MenuItemType = {
  key: 'admin-roles-permissions',
  icon: 'iconamoon:shield-yes-duotone',
  label: 'Vai trò & Phân quyền',
  url: '/admin/roles-permissions',
  roles: [USER_ROLES.ADMIN],
}

const adminSettings: MenuItemType = {
  key: 'admin-settings',
  icon: 'iconamoon:settings-duotone',
  label: 'Cấu hình hệ thống',
  url: '/admin/settings',
  roles: [USER_ROLES.ADMIN],
}

const adminAuditLogs: MenuItemType = {
  key: 'admin-audit-logs',
  icon: 'iconamoon:file-duotone',
  label: 'Nhật ký hệ thống',
  url: '/admin/audit-logs',
  roles: [USER_ROLES.ADMIN],
}

const adminReports: MenuItemType = {
  key: 'admin-reports',
  icon: 'iconamoon:lightning-2-duotone',
  label: 'Trung tâm Báo cáo',
  url: '/admin/reports',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD],
}

const adminCustomers: MenuItemType = {
  key: 'admin-customers',
  icon: 'iconamoon:profile-circle-duotone',
  label: 'Quản lý Khách hàng',
  url: '/admin/customers',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
}

// === INVOICE MENUS (Flattened) ===
const invoicesList: MenuItemType = {
  key: 'invoices',
  icon: 'iconamoon:invoice-duotone',
  label: 'Danh sách hoá đơn',
  url: '/invoices',
  roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT], // ❌ HOD KHÔNG có
}

const invoicesApproval: MenuItemType = {
  key: 'invoices-approval',
  icon: 'iconamoon:certificate-badge-duotone',
  label: 'Duyệt hoá đơn',
  url: '/approval/invoices',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD], // ❌ Accountant KHÔNG có
}

const invoicesCreate: MenuItemType = {
  key: 'invoices-create',
  icon: 'iconamoon:file-add-duotone',
  label: 'Tạo hoá đơn',
  url: '/invoices/create',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
}

const statements: MenuItemType = {
  key: 'statements',
  icon: 'iconamoon:folder-duotone',
  label: 'Bảng kê',
  url: '/statements',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
}

const debt: MenuItemType = {
  key: 'debt',
  icon: 'iconamoon:card-duotone',
  label: 'Công nợ',
  url: '/debt',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
}

const items: MenuItemType = {
  key: 'items',
  icon: 'iconamoon:category-duotone',
  label: 'Danh mục hàng hoá',
  url: '/items',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
}

const taxErrorNotifications: MenuItemType = {
  key: 'tax-error-notifications',
  icon: 'iconamoon:sign-times-duotone',
  label: 'Thông báo sai sót',
  url: '/tax-error-notifications',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
}

// === SALES MENUS (Flattened) ===
const salesCustomers: MenuItemType = {
  key: 'sales-customers',
  icon: 'iconamoon:profile-circle-duotone',
  label: 'Khách hàng của tôi',
  url: '/sales/customers',
  roles: [USER_ROLES.SALES],
}

const salesCreateOrder: MenuItemType = {
  key: 'sales-create-order',
  icon: 'iconamoon:file-add-duotone',
  label: 'Tạo Yêu cầu Xuất HĐ',
  url: '/sales/orders/create',
  roles: [USER_ROLES.SALES],
}

// === CUSTOMER PORTAL (Flattened) ===
const customerInvoiceLookup: MenuItemType = {
  key: 'customer-invoice-lookup',
  icon: 'iconamoon:search-duotone',
  label: 'Tra cứu hóa đơn',
  url: '/public/invoice-lookup',
  roles: [USER_ROLES.CUSTOMER],
}

// === USER MENUS (Flattened) ===
const userProfile: MenuItemType = {
  key: 'user-profile',
  icon: 'iconamoon:profile-duotone',
  label: 'Hồ sơ cá nhân',
  url: '/user/profile',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES, USER_ROLES.CUSTOMER],
}

const userNotifications: MenuItemType = {
  key: 'user-notifications',
  icon: 'iconamoon:notification-duotone',
  label: 'Thông báo',
  url: '/user/notifications',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES, USER_ROLES.CUSTOMER],
}

/**
 * 🎯 EXPORT FILTERED MENU BASED ON USER ROLE
 * Function này sẽ filter menu items dựa trên role của user
 */
export const getMenuItemsByRole = (userRole?: string): MenuItemType[] => {
  if (!userRole) return []

  // ✅ All menu items flattened - no hierarchy
  const allMenus = [
    dashboardMenu,
    // Admin menus
    adminTemplates,
    adminEmailTemplates,
    adminUsers,
    adminRolesPermissions,
    adminSettings,
    adminAuditLogs,
    adminReports,
    adminCustomers,
    // Invoice menus
    invoicesList,
    invoicesApproval,
    invoicesCreate,
    statements,
    debt,
    items,
    taxErrorNotifications,
    // Sales menus
    salesCustomers,
    salesCreateOrder,
    // Customer portal
    customerInvoiceLookup,
    // User menus
    userProfile,
    userNotifications,
  ]

  return filterMenuByRole(allMenus, userRole as UserRole)
}

/**
 * Helper function: Filter menu based on role (simplified for flat structure)
 */
const filterMenuByRole = (items: MenuItemType[], userRole: UserRole): MenuItemType[] => {
  return items.filter(item => {
    // Nếu item có roles, check xem user có role đó không
    if (item.roles && !item.roles.includes(userRole)) {
      return false
    }
    return true
  })
}

/**
 * Export default menu items for backward compatibility
 */
export const MENU_ITEMS: MenuItemType[] = [
  dashboardMenu,
  // Admin menus
  adminTemplates,
  adminEmailTemplates,
  adminUsers,
  adminRolesPermissions,
  adminSettings,
  adminAuditLogs,
  adminReports,
  adminCustomers,
  // Invoice menus
  invoicesList,
  invoicesApproval,
  invoicesCreate,
  statements,
  debt,
  items,
  taxErrorNotifications,
  // Sales menus
  salesCustomers,
  salesCreateOrder,
  // Customer portal
  customerInvoiceLookup,
  // User menus
  userProfile,
  userNotifications,
]
