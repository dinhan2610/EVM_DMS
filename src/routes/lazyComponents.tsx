import { lazy } from 'react'

// Dashboard
export const HODDashboard = lazy(() => import('@/page/HODDashboard'))
export const AdminDashboard = lazy(() => import('@/page/AdminDashboard'))
export const StaffDashboard = lazy(() => import('@/page/StaffDashboard'))
export const SaleDashboard = lazy(() => import('@/page/SaleDashboard'))
export const CustomerDashboard = lazy(() => import('@/page/CustomerDashboard'))

// Invoice Management Routes
export const InvoiceManagement = lazy(() => import('@/page/InvoiceManagement'))
export const InvoiceApproval = lazy(() => import('@/page/InvoiceApproval'))
export const HODInvoiceManagement = lazy(() => import('@/components/dashboard/HODInvoiceManagement'))
export const InvoiceDetail = lazy(() => import('@/page/InvoiceDetail'))
export const CreateInvoice = lazy(() => import('@/page/CreateInvoice'))
export const CreateVatInvoice = lazy(() => import('@/page/CreateVatInvoice'))
export const CreateAdjustmentInvoice = lazy(() => import('@/page/CreateAdjustmentInvoice'))
export const CreateReplacementInvoice = lazy(() => import('@/page/CreateReplacementInvoice'))
export const PublicInvoiceLookup = lazy(() => import('@/page/PublicInvoiceLookup'))
export const RequestManagement = lazy(() => import('@/page/RequestManagement'))
export const ItemsManagement = lazy(() => import('@/page/ItemsManagement'))
export const StatementManagement = lazy(() => import('@/page/StatementManagement'))
export const CreateStatement = lazy(() => import('@/page/CreateStatement'))
export const DebtManagement = lazy(() => import('@/page/DebtManagement'))
export const TaxErrorNotificationManagement = lazy(() => import('@/page/TaxErrorNotificationManagement'))
export const TemplateManagement = lazy(() => import('@/page/TemplateManagement'))
export const TemplateSelection = lazy(() => import('@/page/TemplateSelection'))
export const TemplateEditor = lazy(() => import('@/page/TemplateEditor'))
export const TemplatePreview = lazy(() => import('@/page/TemplatePreviewPage'))
export const EmailTemplateManagement = lazy(() => import('@/page/EmailTemplateManagement'))

// User Management Routes
export const UserManagement = lazy(() => import('@/page/UserManagement'))
export const RolesPermissions = lazy(() => import('@/page/RolesPermissions'))
export const SystemConfiguration = lazy(() => import('@/page/SystemConfiguration'))
export const AuditLogsPage = lazy(() => import('@/page/AuditLogsPage'))
export const ReportsPage = lazy(() => import('@/page/ReportsPage'))
export const CustomerManagement = lazy(() => import('@/page/CustomerManagement'))
export const SalesCustomerPage = lazy(() => import('@/page/SalesCustomerPage'))
export const CreateSalesOrder = lazy(() => import('@/page/CreateSalesOrder'))

// Customer Portal Routes
export const CustomerInvoiceList = lazy(() => import('@/page/CustomerInvoiceList'))
export const CustomerPaymentHistory = lazy(() => import('@/page/CustomerPaymentHistory'))

// Pages Routes
export const UserProfile = lazy(() => import('@/page/UserProfile'))
export const AllNotifications = lazy(() => import('@/page/AllNotifications'))

// Auth Routes
export const AuthSignIn = lazy(() => import('@/app/(other)/auth/sign-in/page'))
export const AuthSignUp = lazy(() => import('@/app/(other)/auth/sign-up/page'))

// Error Routes
export const NotFound = lazy(() => import('@/app/(other)/(error-pages)/error-404/page'))
