import { Navigate, type RouteProps } from 'react-router-dom'

import {
  Dashboard,
  EcommerceCustomers,
  EcommerceSellers,
  CustomerProfile,
  CustomerPassword,
  SellerInvoices,
  SellerProfile,
  SellerPassword,
  Chat,
  Schedule,
  Help,
  Todo,
  Contacts,
  InvoiceManagement,
  InvoiceDetail,
  CreateInvoice,
  CreateVatInvoice,
  CreateAdjustmentInvoice,
  CreateReplacementInvoice,
  RequestManagement,
  ItemsManagement,
  TemplateManagement,
  TemplateSelection,
  TemplateEditor,
  TemplatePreview,
  UserManagement,
  RolesPermissions,
  SystemConfiguration,
  AuditLogsPage,
  ReportsPage,
  CustomerManagement,
  Welcome,
  FAQs,
  ContactUs,
  AboutUs,
  OurTeam,
  TimelinePage,
  UserProfile,
  AllNotifications,
  Pricing,
  Area,
  Bar,
  Line,
  Pie,
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
    name: 'Dashboard',
    path: '/dashboard',
    element: <Dashboard />,
  },
]

const appsRoutes: RoutesProps[] = [
  {
    name: 'Customers',
    path: '/ecommerce/customers',
    element: <EcommerceCustomers />,
  },
  {
    name: 'Customer Profile',
    path: '/ecommerce/customers/profile',
    element: <CustomerProfile />,
  },
  {
    name: 'Customer Change Password',
    path: '/ecommerce/customers/password',
    element: <CustomerPassword />,
  },
  {
    name: 'Sellers',
    path: '/ecommerce/sellers',
    element: <EcommerceSellers />,
  },
  {
    name: 'Seller Invoices',
    path: '/ecommerce/sellers/invoices',
    element: <SellerInvoices />,
  },
  {
    name: 'Seller Profile',
    path: '/ecommerce/sellers/profile',
    element: <SellerProfile />,
  },
  {
    name: 'Seller Change Password',
    path: '/ecommerce/sellers/password',
    element: <SellerPassword />,
  },
  {
    name: 'Chat',
    path: '/apps/chat',
    element: <Chat />,
  },
  {
    name: 'Schedule',
    path: '/calendar/schedule',
    element: <Schedule />,
  },
  {
    name: 'Help',
    path: '/calendar/help',
    element: <Help />,
  },
  {
    name: 'Todo',
    path: '/apps/todo',
    element: <Todo />,
  },
  {
    name: 'Contacts',
    path: '/apps/contacts',
    element: <Contacts />,
  },
  {
    name: 'Template Management',
    path: '/admin/templates',
    element: <TemplateManagement />,
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
    name: 'Invoice Detail',
    path: '/invoices/:id',
    element: <InvoiceDetail />,
  },
  {
    name: 'Create Invoice',
    path: '/newinvoices',
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
]

const customRoutes: RoutesProps[] = [
  {
    name: 'Welcome',
    path: '/pages/welcome',
    element: <Welcome />,
  },
  {
    name: 'FAQs',
    path: '/pages/faqs',
    element: <FAQs />,
  },
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
  {
    name: 'Contact Us',
    path: '/pages/contact-us',
    element: <ContactUs />,
  },
  {
    name: 'About Us',
    path: '/pages/about-us',
    element: <AboutUs />,
  },
  {
    name: 'Our Team',
    path: '/pages/our-team',
    element: <OurTeam />,
  },
  {
    name: 'Timeline',
    path: '/pages/timeline',
    element: <TimelinePage />,
  },
  {
    name: 'Pricing',
    path: '/pages/pricing',
    element: <Pricing />,
  },
]

const chartsRoutes: RoutesProps[] = [
  {
    name: 'Area Chart',
    path: '/charts/area',
    element: <Area />,
  },
  {
    name: 'Bar Chart',
    path: '/charts/bar',
    element: <Bar />,
  },
  {
    name: 'Line Chart',
    path: '/charts/line',
    element: <Line />,
  },
  {
    name: 'Pie Chart',
    path: '/charts/pie',
    element: <Pie />,
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

const routes: RoutesProps[] = [...initialRoutes, ...appsRoutes, ...customRoutes, ...chartsRoutes, ...authRoutes, ...otherRoutes]

export { routes }
