import type { MenuItemType } from '@/types/menu'

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'general',
    label: 'TỔNG QUAN',
    isTitle: true,
  },
  {
    key: 'dashboards',
    icon: 'iconamoon:home-duotone',
    label: 'Bảng điều khiển',
    children: [
      {
        key: 'dashboard-main',
        label: 'Tổng quan',
        url: '/dashboard',
        parentKey: 'dashboards',
      },
    ],
  },
  {
    key: 'apps',
    label: 'ỨNG DỤNG',
    isTitle: true,
  },
  {
    key: 'apps-admin',
    icon: 'iconamoon:settings-duotone',
    label: 'Quản lý',
    children: [
      {
        key: 'admin-templates',
        label: 'Mẫu hoá đơn',
        url: '/admin/templates',
        parentKey: 'apps-admin',
      },
      {
        key: 'admin-email-templates',
        label: 'Mẫu Email',
        url: '/admin/email-templates',
        parentKey: 'apps-admin',
      },
      {
        key: 'admin-users',
        label: 'Người dùng',
        url: '/admin/usermanager',
        parentKey: 'apps-admin',
      },
      {
        key: 'admin-settings',
        label: 'Cấu hình hệ thống',
        url: '/admin/settings',
        parentKey: 'apps-admin',
      },
      {
        key: 'admin-audit-logs',
        label: 'Nhật ký hệ thống',
        url: '/admin/audit-logs',
        parentKey: 'apps-admin',
      },
      {
        key: 'admin-customers',
        label: 'Quản lý Khách hàng',
        url: '/admin/customers',
        parentKey: 'apps-admin',
      },
    ],
  },
  {
    key: 'customers-section',
    icon: 'iconamoon:profile-circle-duotone',
    label: 'Khách hàng',
    children: [
      {
        key: 'sales-customers',
        label: 'Khách hàng của tôi',
        url: '/sales/customers',
        parentKey: 'customers-section',
      },
      {
        key: 'sales-create-order',
        label: 'Tạo Yêu cầu Xuất HĐ',
        url: '/sales/orders/create',
        parentKey: 'customers-section',
      },
    ],
  },
  {
    key: 'customer-portal',
    icon: 'iconamoon:profile-circle-duotone',
    label: 'Khách hàng',
    children: [
      {
        key: 'customer-invoices',
        label: 'Hóa đơn của tôi',
        url: '/customer/invoices',
        parentKey: 'customer-portal',
      },
      {
        key: 'customer-payments',
        label: 'Lịch sử giao dịch',
        url: '/customer/payments',
        parentKey: 'customer-portal',
      },
    ],
  },
  {
    key: 'apps-invoices',
    icon: 'iconamoon:invoice-duotone',
    label: 'Hoá đơn',
    children: [
      {
        key: 'invoices',
        label: 'Danh sách hoá đơn',
        url: '/invoices',
        parentKey: 'apps-invoices',
      },
      {
        key: 'statements',
        label: 'Bảng kê',
        url: '/statements',
        parentKey: 'apps-invoices',
      },
      {
        key: 'debt',
        label: 'Công nợ',
        url: '/debt',
        parentKey: 'apps-invoices',
      },
      {
        key: 'tax-error-notifications',
        label: 'Thông báo sai sót',
        url: '/tax-error-notifications',
        parentKey: 'apps-invoices',
      },
      {
        key: 'invoices-approval',
        label: 'Duyệt hoá đơn',
        url: '/approval/invoices',
        parentKey: 'apps-invoices',
      },
      {
        key: 'invoices-create',
        label: 'Tạo hoá đơn VAT',
        url: '/create-invoice',
        parentKey: 'apps-invoices',
      },
      {
        key: 'invoices-requests',
        label: 'Yêu cầu phát hành',
        url: '/invoice-requests',
        parentKey: 'apps-invoices',
      },
      {
        key: 'invoices',
        label: 'Tạo sản phẩm, dịch vụ',
        url: '/items',
        parentKey: 'apps-invoices',
      },
    ],
  },
  {
    key: 'page-authentication',
    label: 'Xác thực',
    isTitle: false,
    icon: 'iconamoon:lock-duotone',
    children: [
      {
        key: 'sign-in',
        label: 'Đăng nhập',
        url: '/auth/sign-in',
        parentKey: 'page-authentication',
      },
      {
        key: 'signup',
        label: 'Đăng ký',
        url: '/auth/sign-up',
        parentKey: 'page-authentication',
      },
    ],
  },
]
