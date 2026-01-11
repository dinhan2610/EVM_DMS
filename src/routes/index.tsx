import { Navigate, type RouteProps } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { USER_ROLES } from '@/constants/roles'

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
    path: '/dashboard/admin',
    name: 'Admin Dashboard',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/hod',
    name: 'HOD Dashboard',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.HOD]}>
        <HODDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/staff',
    name: 'Staff Dashboard',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
        <StaffDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/sale',
    name: 'Sale Dashboard',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.SALES]}>
        <SaleDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/customer',
    name: 'Customer Dashboard',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.CUSTOMER]}>
        <CustomerDashboard />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT]}>
        <TemplateManagement />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Email Template Management',
    path: '/admin/email-templates',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
        <EmailTemplateManagement />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT]}>
        <InvoiceManagement />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Public Invoice Lookup',
    path: '/public/invoice-lookup',
    element: <PublicInvoiceLookup />,
  },
  {
    name: 'Public Invoice Lookup (Old Path)',
    path: '/tra-cuu',
    element: <Navigate to="/public/invoice-lookup" replace />,
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
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
        <HODInvoiceManagement />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Roles & Permissions',
    path: '/admin/roles-permissions',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
        <RolesPermissions />
      </ProtectedRoute>
    ),
  },
  {
    name: 'System Configuration',
    path: '/admin/settings',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
        <SystemConfiguration />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Audit Logs',
    path: '/admin/audit-logs',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
        <AuditLogsPage />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.SALES]}>
        <SalesCustomerPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Create Sales Order',
    path: '/sales/orders/create',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.SALES]}>
        <CreateSalesOrder />
      </ProtectedRoute>
    ),
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