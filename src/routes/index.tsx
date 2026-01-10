import { Navigate, type RouteProps } from 'react-router-dom'

import {
  HODDashboard,
  AdminDashboard,
  StaffDashboard,
  SaleDashboard,
  CustomerDashboard,
  InvoiceManagement,
  HODInvoiceManagement,
  InvoiceDetail,
  CreateInvoice,
  CreateVatInvoice,
  CreateAdjustmentInvoice,
  CreateReplacementInvoice,
  PublicInvoiceLookup,
  RequestManagement,
  ItemsManagement,
  StatementManagement,
  CreateStatement,
  DebtManagement,
  TaxErrorNotificationManagement,
  TemplateManagement,
  TemplateSelection,
  TemplateEditor,
  TemplatePreview,
  EmailTemplateManagement,
  UserManagement,
  RolesPermissions,
  SystemConfiguration,
  AuditLogsPage,
  ReportsPage,
  CustomerManagement,
  SalesCustomerPage,
  CreateSalesOrder,
  CustomerInvoiceList,
  CustomerPaymentHistory,
  UserProfile,
  AllNotifications,
  AuthSignIn,
  AuthSignUp,
  NotFound,
} from './lazyComponents'

export type RoutesProps = {
  path: RouteProps['path']
  name: string
  element: RouteProps['element']
  exact?: boolean
}

const initialRoutes: RoutesProps[] = [
  {
    path: '/',
    name: 'root',
    exact: true,
    element: <Navigate to="/dashboard" />,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    element: <HODDashboard />,
  },
  {
    path: '/admin-dashboard',
    name: 'Admin Dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/staff-dashboard',
    name: 'Staff Dashboard',
    element: <StaffDashboard />,
  },
  {
    path: '/sale-dashboard',
    name: 'Sale Dashboard',
    element: <SaleDashboard />,
  },
  {
    path: '/customer-dashboard',
    name: 'Customer Dashboard',
    element: <CustomerDashboard />,
  },
]

const appsRoutes: RoutesProps[] = [
  {
    path: '/customer/invoices',
    name: 'Customer Invoices',
    element: <CustomerInvoiceList />,
  },
  {
    path: '/customer/payments',
    name: 'Customer Payment History',
    element: <CustomerPaymentHistory />,
  },
  {
    name: 'Template Management',
    path: '/admin/templates',
    element: <TemplateManagement />,
  },
  {
    name: 'Email Template Management',
    path: '/admin/email-templates',
    element: <EmailTemplateManagement />,
  },
  {
    name: 'Select Template',
    path: '/admin/templates/select',
    element: <TemplateSelection />,
  },
  {
    name: 'Create Template',
    path: '/admin/templates/new',
    element: <TemplateEditor />,
  },
  {
    name: 'Preview Template',
    path: '/admin/templates/preview/:templateId',
    element: <TemplatePreview />,
  },
  {
    name: 'Edit Template',
    path: '/admin/templates/edit/:templateId',
    element: <TemplateEditor />,
  },
  {
    name: 'Invoices List',
    path: '/invoices',
    element: <InvoiceManagement />,
  },
  {
    name: 'Public Invoice Lookup',
    path: '/tra-cuu',
    element: <PublicInvoiceLookup />,
  },
  {
    name: 'Statement Management',
    path: '/statements',
    element: <StatementManagement />,
  },
  {
    name: 'Create Statement',
    path: '/statements/new',
    element: <CreateStatement />,
  },
  {
    name: 'Edit Statement',
    path: '/statements/edit/:id',
    element: <CreateStatement />,
  },
  {
    name: 'Debt Management',
    path: '/debt',
    element: <DebtManagement />,
  },
  {
    name: 'Tax Error Notification Management',
    path: '/tax-error-notifications',
    element: <TaxErrorNotificationManagement />,
  },
  {
    name: 'Invoice Approval',
    path: '/approval/invoices',
    element: <HODInvoiceManagement />,
  },
  {
    name: 'Invoice Detail',
    path: '/invoices/:id',
    element: <InvoiceDetail />,
  },
  {
    name: 'Approval Invoice Detail',
    path: '/approval/invoices/:id',
    element: <InvoiceDetail />,
  },
  {
    name: 'Create Invoice',
    path: '/newinvoices',
    element: <CreateVatInvoice />,
  },
  {
    name: 'Create/Edit Invoice',
    path: '/create-invoice',
    element: <CreateVatInvoice />,
  },
  {
    name: 'Create Invoice Old',
    path: '/newinvoices-old',
    element: <CreateInvoice />,
  },
  {
    name: 'Create Adjustment Invoice',
    path: '/invoices/:id/adjust',
    element: <CreateAdjustmentInvoice />,
  },
  {
    name: 'Create Replacement Invoice',
    path: '/invoices/:id/replace',
    element: <CreateReplacementInvoice />,
  },
  {
    name: 'Invoice Requests',
    path: '/invoice-requests',
    element: <RequestManagement />,
  },
  {
    name: 'Items Management',
    path: '/items',
    element: <ItemsManagement />,
  },
  {
    name: 'User Management',
    path: '/admin/usermanager',
    element: <UserManagement />,
  },
  {
    name: 'Roles & Permissions',
    path: '/admin/roles-permissions',
    element: <RolesPermissions />,
  },
  {
    name: 'System Configuration',
    path: '/admin/settings',
    element: <SystemConfiguration />,
  },
  {
    name: 'Audit Logs',
    path: '/admin/audit-logs',
    element: <AuditLogsPage />,
  },
  {
    name: 'Reports Center',
    path: '/admin/reports',
    element: <ReportsPage />,
  },
  {
    name: 'Customer Management',
    path: '/admin/customers',
    element: <CustomerManagement />,
  },
  {
    name: 'Sales Customers',
    path: '/sales/customers',
    element: <SalesCustomerPage />,
  },
  {
    name: 'Create Sales Order',
    path: '/sales/orders/create',
    element: <CreateSalesOrder />,
  },
]

const customRoutes: RoutesProps[] = [
  {
    name: 'Profile',
    path: '/pages/profile',
    element: <UserProfile />,
  },
  {
    name: 'All Notifications',
    path: '/pages/all-notifications',
    element: <AllNotifications />,
  },
]

const authRoutes: RoutesProps[] = [
  {
    name: 'Sign In',
    path: '/auth/sign-in',
    element: <AuthSignIn />,
  },
  {
    name: 'Sign Up',
    path: '/auth/sign-up',
    element: <AuthSignUp />,
  },
]

const otherRoutes: RoutesProps[] = [
  {
    name: 'Error 404',
    path: '*',
    element: <NotFound />,
  },
]

const routes: RoutesProps[] = [
  ...initialRoutes,
  ...appsRoutes,
  ...customRoutes,
  ...authRoutes,
  ...otherRoutes,
]

export { routes }