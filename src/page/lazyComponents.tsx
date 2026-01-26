import { lazy } from 'react'

// Invoice Management Routes
export const InvoiceManagement = lazy(() => import('@/page/InvoiceManagement'))
export const InvoiceDetail = lazy(() => import('@/page/InvoiceDetail'))
export const CreateInvoice = lazy(() => import('@/page/CreateInvoice'))
export const CreateVatInvoice = lazy(() => import('@/page/CreateVatInvoice'))
export const CreateAdjustmentInvoice = lazy(() => import('@/page/CreateAdjustmentInvoice'))
export const CreateReplacementInvoice = lazy(() => import('@/page/CreateReplacementInvoice'))
export const RequestManagement = lazy(() => import('@/page/RequestManagement'))
export const ItemsManagement = lazy(() => import('@/page/ItemsManagement'))
export const StatementManagement = lazy(() => import('@/page/StatementManagement'))
export const DebtManagement = lazy(() => import('@/page/DebtManagement'))
export const TemplateManagement = lazy(() => import('@/page/TemplateManagement'))
export const TemplateEditor = lazy(() => import('@/page/TemplateEditor'))
export const TemplatePreview = lazy(() => import('@/page/TemplatePreviewPage'))

// User Management Routes
export const UserManagement = lazy(() => import('@/page/UserManagement'))
export const SystemConfiguration = lazy(() => import('@/page/SystemConfiguration'))
export const AuditLogsPage = lazy(() => import('@/page/AuditLogsPage'))
export const CustomerManagement = lazy(() => import('@/page/CustomerManagement'))

// Pages Routes
export const UserProfile = lazy(() => import('@/page/UserProfile'))
export const AllNotifications = lazy(() => import('@/page/AllNotifications'))

// Dashboard Routes
export const StaffDashboard = lazy(() => import('@/page/StaffDashboard'))
export const SaleDashboard = lazy(() => import('@/page/SaleDashboard'))
export const CustomerDashboard = lazy(() => import('@/page/CustomerDashboard'))

// Auth Routes
export const AuthSignIn = lazy(() => import('@/app/(other)/auth/sign-in/page'))
export const AuthSignUp = lazy(() => import('@/app/(other)/auth/sign-up/page'))

// Error Routes
export const NotFound = lazy(() => import('@/app/(other)/(error-pages)/error-404/page'))
