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
    key: 'ecommerce',
    icon: 'iconamoon:shopping-bag-duotone',
    label: 'Thương mại',
    children: [
      
    
      {
        key: 'ecommerce-customers',
        label: 'Khách hàng',
        url: '/ecommerce/customers',
        parentKey: 'ecommerce',
      },
      {
        key: 'ecommerce-sellers',
        label: 'Người bán',
        url: '/ecommerce/sellers',
        parentKey: 'ecommerce',
      },
      
      
      
    ],
  },
  {
    key: 'apps-chat',
    icon: 'iconamoon:comment-dots-duotone',
    label: 'Trò chuyện',
    url: '/apps/chat',
  },
  {
    key: 'apps-calendar',
    icon: 'iconamoon:calendar-1-duotone',
    label: 'Lịch',
    children: [
      {
        key: 'calendar-schedule',
        label: 'Lịch trình',
        url: '/calendar/schedule',
        parentKey: 'apps-calendar',
      },
      
      {
        key: 'calendar-help',
        label: 'Trợ giúp',
        url: '/calendar/help',
        parentKey: 'apps-calendar',
      },
    ],
  },
  {
    key: 'apps-todo',
    icon: 'iconamoon:ticket-duotone',
    label: 'Công việc',
    url: '/apps/todo',
  },
  
  {
    key: 'apps-contacts',
    icon: 'iconamoon:profile-circle-duotone',
    label: 'Liên hệ',
    url: '/apps/contacts',
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
        key: 'admin-roles-permissions',
        label: 'Vai trò & Phân quyền',
        url: '/admin/roles-permissions',
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
        key: 'admin-reports',
        label: 'Trung tâm Báo cáo',
        url: '/admin/reports',
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
        key: 'invoices-approval',
        label: 'Duyệt hoá đơn',
        url: '/approval/invoices',
        parentKey: 'apps-invoices',
      },
      {
        key: 'invoices-create',
        label: 'Tạo hoá đơn VAT',
        url: '/newinvoices',
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
    key: 'custom',
    label: 'TÙY CHỌN',
    isTitle: true,
  },
  {
    key: 'pages',
    label: 'Trang',
    isTitle: false,
    icon: 'iconamoon:copy-duotone',
    children: [
      {
        key: 'page-welcome',
        label: 'Chào mừng',
        url: '/pages/welcome',
        parentKey: 'pages',
      },
      {
        key: 'page-faqs',
        label: 'Câu hỏi thường gặp',
        url: '/pages/faqs',
        parentKey: 'pages',
      },
      {
        key: 'page-profile',
        label: 'Hồ sơ',
        url: '/pages/profile',
        parentKey: 'pages',
      },
      
      {
        key: 'page-contact-us',
        label: 'Liên hệ',
        url: '/pages/contact-us',
        parentKey: 'pages',
      },
      {
        key: 'page-about-us',
        label: 'Về chúng tôi',
        url: '/pages/about-us',
        parentKey: 'pages',
      },
      {
        key: 'page-our-team',
        label: 'Đội ngũ',
        url: '/pages/our-team',
        parentKey: 'pages',
      },
      {
        key: 'page-timeline',
        label: 'Dòng thời gian',
        url: '/pages/timeline',
        parentKey: 'pages',
      },
      {
        key: 'page-pricing',
        label: 'Bảng giá',
        url: '/pages/pricing',
        parentKey: 'pages',
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
  
  {
    key: 'components',
    label: 'THÀNH PHẦN',
    isTitle: true,
  },
  {
    key: 'charts',
    icon: 'iconamoon:3d-duotone',
    label: 'Biểu đồ',
    children: [
      {
        key: 'charts-area',
        label: 'Area',
        url: '/charts/area',
        parentKey: 'charts',
      },
      {
        key: 'charts-bar',
        label: 'Bar',
        url: '/charts/bar',
        parentKey: 'charts',
      },
      {
        key: 'charts-line',
        label: 'Line',
        url: '/charts/line',
        parentKey: 'charts',
      },
      {
        key: 'charts-pie',
        label: 'Pie',
        url: '/charts/pie',
        parentKey: 'charts',
      },
    ],
  },
  {
    key: 'charts',
    icon: 'iconamoon:3d-duotone',
    label: 'Biểu đồ',
    children: [
      {
        key: 'charts-area',
        label: 'Area',
        url: '/charts/area',
        parentKey: 'charts',
      },
      {
        key: 'charts-bar',
        label: 'Bar',
        url: '/charts/bar',
        parentKey: 'charts',
      },
      {
        key: 'charts-line',
        label: 'Line',
        url: '/charts/line',
        parentKey: 'charts',
      },
      {
        key: 'charts-pie',
        label: 'Pie',
        url: '/charts/pie',
        parentKey: 'charts',
      },
    ],
  },
]
