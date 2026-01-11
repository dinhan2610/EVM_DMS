import type { MenuItemType } from '@/types/menu'
import { USER_ROLES, type UserRole } from '@/constants/roles'

/**
 * 🎯 MENU ITEMS WITH ROLE-BASED ACCESS
 * Mỗi menu item có thể có thuộc tính `roles` để chỉ định role nào được xem
 */

// === DASHBOARD MENUS ===
const dashboardMenu: MenuItemType = {
  key: 'general',
  label: 'TỔNG QUAN',
  isTitle: true,
  children: [
    {
      key: 'dashboards',
      icon: 'iconamoon:home-duotone',
      label: 'Bảng điều khiển',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES, USER_ROLES.CUSTOMER],
      children: [
        {
          key: 'dashboard-admin',
          label: 'Tổng quan',
          url: '/dashboard/admin',
          parentKey: 'dashboards',
          roles: [USER_ROLES.ADMIN],
        },
        {
          key: 'dashboard-hod',
          label: 'Tổng quan',
          url: '/dashboard/hod',
          parentKey: 'dashboards',
          roles: [USER_ROLES.HOD],
        },
        {
          key: 'dashboard-accountant',
          label: 'Tổng quan',
          url: '/dashboard/staff',
          parentKey: 'dashboards',
          roles: [USER_ROLES.ACCOUNTANT],
        },
        {
          key: 'dashboard-sale',
          label: 'Tổng quan',
          url: '/dashboard/sale',
          parentKey: 'dashboards',
          roles: [USER_ROLES.SALES],
        },
        {
          key: 'dashboard-customer',
          label: 'Tổng quan',
          url: '/dashboard/customer',
          parentKey: 'dashboards',
          roles: [USER_ROLES.CUSTOMER],
        },
      ],
    },
  ],
}

// === ADMIN MENU (Chỉ Admin) ===
const adminMenu: MenuItemType = {
  key: 'apps-admin',
  icon: 'iconamoon:settings-duotone',
  label: 'Quản trị hệ thống',
  roles: [USER_ROLES.ADMIN],
  children: [
    {
      key: 'admin-templates',
      label: 'Mẫu hoá đơn',
      url: '/admin/templates',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
    {
      key: 'admin-email-templates',
      label: 'Mẫu Email',
      url: '/admin/email-templates',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
    {
      key: 'admin-users',
      label: 'Người dùng',
      url: '/admin/usermanager',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
    {
      key: 'admin-roles-permissions',
      label: 'Vai trò & Phân quyền',
      url: '/admin/roles-permissions',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
    {
      key: 'admin-settings',
      label: 'Cấu hình hệ thống',
      url: '/admin/settings',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
    {
      key: 'admin-audit-logs',
      label: 'Nhật ký hệ thống',
      url: '/admin/audit-logs',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
    {
      key: 'admin-reports',
      label: 'Trung tâm Báo cáo',
      url: '/admin/reports',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD],
    },
    {
      key: 'admin-customers',
      label: 'Quản lý Khách hàng',
      url: '/admin/customers',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
    },
  ],
}

// === INVOICE MENU (Admin, HOD, Accountant) ===
const invoiceMenu: MenuItemType = {
  key: 'apps-invoices',
  icon: 'iconamoon:invoice-duotone',
  label: 'Quản lý Hoá đơn',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
  children: [
    // === Danh sách HĐ - CHỈ Admin và Accountant ===
    {
      key: 'invoices',
      label: 'Danh sách hoá đơn',
      url: '/invoices',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT], // ❌ HOD KHÔNG có (KEY REQUIREMENT)
    },
    // === Duyệt HĐ - CHỈ Admin và HOD ===
    {
      key: 'invoices-approval',
      label: 'Duyệt hoá đơn',
      url: '/approval/invoices',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD], // ❌ Accountant KHÔNG có (KEY REQUIREMENT)
    },
    {
      key: 'invoices-create',
      label: 'Tạo hoá đơn',
      url: '/invoices/create',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
    },
    {
      key: 'statements',
      label: 'Bảng kê',
      url: '/statements',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
    },
    {
      key: 'debt',
      label: 'Công nợ',
      url: '/debt',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
    },
    {
      key: 'items',
      label: 'Danh mục hàng hoá',
      url: '/items',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
    },
    {
      key: 'tax-error-notifications',
      label: 'Thông báo sai sót',
      url: '/tax-error-notifications',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
    },
  ],
}

// === SALES MENU (Chỉ Sales role) ===
const salesMenu: MenuItemType = {
  key: 'sales-section',
  icon: 'iconamoon:profile-circle-duotone',
  label: 'Kinh doanh',
  roles: [USER_ROLES.SALES],
  children: [
    {
      key: 'sales-customers',
      label: 'Khách hàng của tôi',
      url: '/sales/customers',
      parentKey: 'sales-section',
      roles: [USER_ROLES.SALES],
    },
    {
      key: 'sales-create-order',
      label: 'Tạo Yêu cầu Xuất HĐ',
      url: '/sales/orders/create',
      parentKey: 'sales-section',
      roles: [USER_ROLES.SALES],
    },
  ],
}

// === CUSTOMER PORTAL MENU (Chỉ Customer role) ===
const customerPortalMenu: MenuItemType = {
  key: 'customer-portal',
  icon: 'iconamoon:search-duotone',
  label: 'Tra cứu',
  roles: [USER_ROLES.CUSTOMER],
  children: [
    {
      key: 'customer-invoice-lookup',
      label: 'Tra cứu hóa đơn',
      url: '/public/invoice-lookup',
      parentKey: 'customer-portal',
      roles: [USER_ROLES.CUSTOMER],
    },
  ],
}

// === USER MENU (Tất cả roles) ===
const userMenu: MenuItemType = {
  key: 'pages',
  icon: 'iconamoon:profile-duotone',
  label: 'Tài khoản',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES, USER_ROLES.CUSTOMER],
  children: [
    {
      key: 'user-profile',
      label: 'Hồ sơ cá nhân',
      url: '/user/profile',
      parentKey: 'pages',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES, USER_ROLES.CUSTOMER],
    },
    {
      key: 'user-notifications',
      label: 'Thông báo',
      url: '/user/notifications',
      parentKey: 'pages',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.SALES, USER_ROLES.CUSTOMER],
    },
  ],
}

/**
 * 🎯 EXPORT FILTERED MENU BASED ON USER ROLE
 * Function này sẽ filter menu items dựa trên role của user
 */
export const getMenuItemsByRole = (userRole?: string): MenuItemType[] => {
  if (!userRole) return []

  const allMenus = [
    dashboardMenu,
    adminMenu,
    invoiceMenu,
    salesMenu,
    customerPortalMenu,
    userMenu,
  ]

  return filterMenuByRole(allMenus, userRole as UserRole)
}

/**
 * Helper function: Filter menu recursively based on role
 */
const filterMenuByRole = (items: MenuItemType[], userRole: UserRole): MenuItemType[] => {
  return items
    .filter(item => {
      // Nếu item có roles, check xem user có role đó không
      if (item.roles && !item.roles.includes(userRole)) {
        return false
      }
      return true
    })
    .map(item => {
      // Nếu có children, filter children recursively
      if (item.children) {
        return {
          ...item,
          children: filterMenuByRole(item.children, userRole),
        }
      }
      return item
    })
    .filter(item => {
      // Loại bỏ parent nếu không còn children nào
      if (item.children && item.children.length === 0) {
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
  adminMenu,
  invoiceMenu,
  salesMenu,
  customerPortalMenu,
  userMenu,
]
