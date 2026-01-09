import { lazy } from 'react'

// Dashboard
export const HODDashboard = lazy(() => import('@/page/HODDashboard'))
export const AdminDashboard = lazy(() => import('@/page/AdminDashboard'))
export const StaffDashboard = lazy(() => import('@/page/StaffDashboard'))
export const SaleDashboard = lazy(() => import('@/page/SaleDashboard'))
export const CustomerDashboard = lazy(() => import('@/page/CustomerDashboard'))

// Apps Routes
export const EcommerceCustomers = lazy(() => import('@/app/(admin)/ecommerce/customers/page'))
export const EcommerceSellers = lazy(() => import('@/app/(admin)/ecommerce/sellers/page'))
export const Chat = lazy(() => import('@/app/(admin)/apps/chat/page'))
export const Schedule = lazy(() => import('@/app/(admin)/calendar/schedule/page'))
export const Help = lazy(() => import('@/app/(admin)/calendar/help/page'))
export const Todo = lazy(() => import('@/app/(admin)/apps/todo/page'))
export const Contacts = lazy(() => import('@/app/(admin)/apps/contacts/page'))

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

// Customer Portal Routes
export const CustomerInvoiceList = lazy(() => import('@/page/CustomerInvoiceList'))
export const CustomerPaymentHistory = lazy(() => import('@/page/CustomerPaymentHistory'))

// Pages Routes
export const Welcome = lazy(() => import('@/app/(admin)/pages/welcome/page'))
export const FAQs = lazy(() => import('@/app/(admin)/pages/faqs/page'))
export const ContactUs = lazy(() => import('@/app/(admin)/pages/contact-us/page'))
export const AboutUs = lazy(() => import('@/app/(admin)/pages/about-us/page'))
export const OurTeam = lazy(() => import('@/app/(admin)/pages/our-team/page'))
export const TimelinePage = lazy(() => import('@/app/(admin)/pages/timeline/page'))
export const UserProfile = lazy(() => import('@/page/UserProfile'))
export const AllNotifications = lazy(() => import('@/page/AllNotifications'))
export const Pricing = lazy(() => import('@/app/(admin)/pages/pricing/page'))

// Charts Routes (Chỉ giữ 4 loại: Area, Bar, Line, Pie)
export const Area = lazy(() => import('@/app/(admin)/charts/area/page'))
export const Bar = lazy(() => import('@/app/(admin)/charts/bar/page'))
export const Line = lazy(() => import('@/app/(admin)/charts/line/page'))
export const Pie = lazy(() => import('@/app/(admin)/charts/pie/page'))

// Auth Routes
export const AuthSignIn = lazy(() => import('@/app/(other)/auth/sign-in/page'))
export const AuthSignUp = lazy(() => import('@/app/(other)/auth/sign-up/page'))

// Error Routes
export const NotFound = lazy(() => import('@/app/(other)/(error-pages)/error-404/page'))
