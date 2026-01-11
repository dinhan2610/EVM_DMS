# 🎯 HƯỚNG DẪN CẤU HÌNH LẠI ROLES THEO YÊU CẦU MỚI

## 📋 YÊU CẦU PHÂN QUYỀN MỚI

### **5 Roles trong hệ thống:**

| Role | Dashboard | Quyền truy cập |
|------|-----------|----------------|
| **ADMIN** | `/dashboard/admin` | ✅ **Full quyền** - Tất cả trang |
| **HOD** | `/dashboard/hod` | ✅ Full quyền <br> ❌ **KHÔNG có** `/invoices` (Danh sách HĐ) |
| **ACCOUNTANT** | `/dashboard/staff` | ✅ Có `/invoices` (Danh sách HĐ) <br> ❌ **KHÔNG có** `/invoices/approval` (Duyệt HĐ) |
| **SALES** | `/dashboard/sale` | ✅ `/sales/customers` (Khách hàng của tôi) <br> ✅ `/sales/orders/create` (Tạo yêu cầu) |
| **CUSTOMER** | `/dashboard/customer` | ✅ `/public/invoice-lookup` (Tra cứu HĐ) |

### **❌ Bỏ role STAFF**

---

## 🔧 BƯỚC 1: CẬP NHẬT FILE `roles.ts`

### **File: `src/constants/roles.ts`**

#### **1.1. Bỏ STAFF role**

```typescript
export const USER_ROLES = {
  // === ADMIN ROLES ===
  ADMIN: 'Admin',                    // Quản trị viên - Full quyền
  HOD: 'HOD',                        // Kế toán trưởng - Full quyền NHƯNG KHÔNG có Invoice Management
  
  // === ACCOUNTANT ROLE ===
  ACCOUNTANT: 'Accountant',          // Kế toán - Có Invoice Management NHƯNG KHÔNG duyệt HĐ
  
  // === SALES ROLE ===
  SALES: 'Sales',                    // Kinh doanh - Khách hàng + Tạo yêu cầu
  
  // === CUSTOMER ROLE ===
  CUSTOMER: 'Customer',              // Khách hàng - Tra cứu hóa đơn
} as const
```

#### **1.2. Cập nhật ROLE_LABELS**

```typescript
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Quản trị viên',
  [USER_ROLES.HOD]: 'Kế toán trưởng',
  [USER_ROLES.ACCOUNTANT]: 'Kế toán',
  [USER_ROLES.SALES]: 'Kinh doanh',
  [USER_ROLES.CUSTOMER]: 'Khách hàng',
}
```

#### **1.3. Cập nhật DEFAULT_DASHBOARD**

```typescript
export const DEFAULT_DASHBOARD: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: '/dashboard/admin',
  [USER_ROLES.HOD]: '/dashboard/hod',
  [USER_ROLES.ACCOUNTANT]: '/dashboard/staff',
  [USER_ROLES.SALES]: '/dashboard/sale',
  [USER_ROLES.CUSTOMER]: '/dashboard/customer',
}
```

#### **1.4. Cập nhật ROLE_PERMISSIONS**

```typescript
export const ROLE_PERMISSIONS = {
  // === ADMIN - Full quyền ===
  [USER_ROLES.ADMIN]: {
    canViewInvoiceList: true,          // ✅ Xem /invoices
    canApproveInvoice: true,           // ✅ Xem /invoices/approval
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: true,
    canSignInvoice: true,
    canManageUsers: true,
    canManageTemplates: true,
    canManageSettings: true,
    canViewReports: true,
    canManageCustomers: true,
    canViewAuditLogs: true,
    canAccessSalesModule: false,       // ❌ Không cần module Sales
    canAccessCustomerPortal: false,    // ❌ Không cần portal Customer
  },
  
  // === HOD - Full quyền NHƯNG KHÔNG có /invoices ===
  [USER_ROLES.HOD]: {
    canViewInvoiceList: false,         // ❌ KHÔNG xem /invoices
    canApproveInvoice: true,           // ✅ Xem /invoices/approval
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canSignInvoice: true,
    canManageUsers: false,
    canManageTemplates: true,
    canManageSettings: false,
    canViewReports: true,
    canManageCustomers: true,
    canViewAuditLogs: true,
    canAccessSalesModule: false,
    canAccessCustomerPortal: false,
  },
  
  // === ACCOUNTANT - Có /invoices NHƯNG KHÔNG có /invoices/approval ===
  [USER_ROLES.ACCOUNTANT]: {
    canViewInvoiceList: true,          // ✅ Xem /invoices
    canApproveInvoice: false,          // ❌ KHÔNG xem /invoices/approval
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canSignInvoice: false,
    canManageUsers: false,
    canManageTemplates: true,
    canManageSettings: false,
    canViewReports: true,
    canManageCustomers: true,
    canViewAuditLogs: false,
    canAccessSalesModule: false,
    canAccessCustomerPortal: false,
  },
  
  // === SALES - Chỉ module Sales ===
  [USER_ROLES.SALES]: {
    canViewInvoiceList: false,
    canApproveInvoice: false,
    canCreateInvoice: false,           // ❌ Không tạo HĐ trực tiếp
    canEditInvoice: false,
    canDeleteInvoice: false,
    canSignInvoice: false,
    canManageUsers: false,
    canManageTemplates: false,
    canManageSettings: false,
    canViewReports: false,
    canManageCustomers: false,         // ❌ Không quản lý tất cả KH
    canViewAuditLogs: false,
    canAccessSalesModule: true,        // ✅ Module Sales
    canAccessCustomerPortal: false,
  },
  
  // === CUSTOMER - Chỉ tra cứu HĐ ===
  [USER_ROLES.CUSTOMER]: {
    canViewInvoiceList: false,
    canApproveInvoice: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canSignInvoice: false,
    canManageUsers: false,
    canManageTemplates: false,
    canManageSettings: false,
    canViewReports: false,
    canManageCustomers: false,
    canViewAuditLogs: false,
    canAccessSalesModule: false,
    canAccessCustomerPortal: true,     // ✅ Portal Customer (tra cứu)
  },
}
```

---

## 🔧 BƯỚC 2: CẬP NHẬT FILE `menu-items-with-roles.ts`

### **File: `src/constants/menu-items-with-roles.ts`**

### **2.1. Dashboard Menu**

```typescript
const dashboardMenu: MenuItemType = {
  key: 'general',
  label: 'TỔNG QUAN',
  isTitle: true,
  children: [
    {
      key: 'dashboards',
      icon: 'iconamoon:home-duotone',
      label: 'Bảng điều khiển',
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
```

### **2.2. Admin Menu (Chỉ Admin)**

```typescript
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
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
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
```

### **2.3. Invoice Menu**

**⭐ KEY POINT:**
- Admin: Có tất cả (bao gồm `/invoices` và `/invoices/approval`)
- HOD: **KHÔNG** có `/invoices` NHƯNG có `/invoices/approval`
- Accountant: Có `/invoices` NHƯNG **KHÔNG** có `/invoices/approval`

```typescript
const invoiceMenu: MenuItemType = {
  key: 'apps-invoices',
  icon: 'iconamoon:invoice-duotone',
  label: 'Quản lý Hoá đơn',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT],
  children: [
    // === /invoices - Chỉ Admin và Accountant ===
    {
      key: 'invoices',
      label: 'Danh sách hoá đơn',
      url: '/invoices',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT], // ❌ HOD KHÔNG có
    },
    
    // === /invoices/approval - Chỉ Admin và HOD ===
    {
      key: 'invoices-approval',
      label: 'Duyệt hoá đơn',
      url: '/invoices/approval',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD], // ❌ Accountant KHÔNG có
    },
    
    // === Các trang khác - Admin, HOD, Accountant ===
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
```

### **2.4. Sales Menu (Chỉ Sales)**

```typescript
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
```

### **2.5. Customer Portal Menu (Chỉ Customer)**

```typescript
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
```

### **2.6. User Menu (Tất cả roles)**

```typescript
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
```

---

## 🔧 BƯỚC 3: CẬP NHẬT ROUTES VỚI PROTECTEDROUTE

### **File: `src/routes/index.tsx`**

### **3.1. Dashboard Routes**

```typescript
// Admin Dashboard
{
  path: '/dashboard/admin',
  name: 'Admin Dashboard',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
}

// HOD Dashboard
{
  path: '/dashboard/hod',
  name: 'HOD Dashboard',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.HOD]}>
      <HODDashboard />
    </ProtectedRoute>
  ),
}

// Accountant Dashboard
{
  path: '/dashboard/staff',
  name: 'Staff Dashboard',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
      <StaffDashboard />
    </ProtectedRoute>
  ),
}

// Sales Dashboard
{
  path: '/dashboard/sale',
  name: 'Sale Dashboard',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.SALES]}>
      <SaleDashboard />
    </ProtectedRoute>
  ),
}

// Customer Dashboard
{
  path: '/dashboard/customer',
  name: 'Customer Dashboard',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.CUSTOMER]}>
      <CustomerDashboard />
    </ProtectedRoute>
  ),
}
```

### **3.2. Invoice Routes**

**⭐ KEY ROUTES:**

```typescript
// === /invoices - CHỈ Admin và Accountant ===
{
  path: '/invoices',
  name: 'Invoice Management',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT]}>
      <InvoiceManagement />
    </ProtectedRoute>
  ),
}

// === /invoices/approval - CHỈ Admin và HOD ===
{
  path: '/invoices/approval',
  name: 'Invoice Approval',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
      <HODInvoiceManagement />
    </ProtectedRoute>
  ),
}

// === Các route khác - Admin, HOD, Accountant ===
{
  path: '/invoices/create',
  name: 'Create Invoice',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT]}>
      <CreateInvoice />
    </ProtectedRoute>
  ),
}

{
  path: '/statements',
  name: 'Statement Management',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT]}>
      <StatementManagement />
    </ProtectedRoute>
  ),
}

{
  path: '/debt',
  name: 'Debt Management',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT]}>
      <DebtManagement />
    </ProtectedRoute>
  ),
}
```

### **3.3. Admin Routes (Chỉ Admin)**

```typescript
{
  path: '/admin/usermanager',
  name: 'User Management',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <UserManagement />
    </ProtectedRoute>
  ),
}

{
  path: '/admin/settings',
  name: 'System Configuration',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <SystemConfiguration />
    </ProtectedRoute>
  ),
}
```

### **3.4. Sales Routes (Chỉ Sales)**

```typescript
{
  path: '/sales/customers',
  name: 'Sales Customers',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.SALES]}>
      <SalesCustomerPage />
    </ProtectedRoute>
  ),
}

{
  path: '/sales/orders/create',
  name: 'Create Sales Order',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.SALES]}>
      <CreateSalesOrder />
    </ProtectedRoute>
  ),
}
```

### **3.5. Customer Routes (Chỉ Customer)**

```typescript
{
  path: '/public/invoice-lookup',
  name: 'Public Invoice Lookup',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.CUSTOMER]}>
      <PublicInvoiceLookup />
    </ProtectedRoute>
  ),
}
```

### **3.6. User Routes (Tất cả roles)**

```typescript
{
  path: '/user/profile',
  name: 'User Profile',
  element: (
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  ),
}

{
  path: '/user/notifications',
  name: 'All Notifications',
  element: (
    <ProtectedRoute>
      <AllNotifications />
    </ProtectedRoute>
  ),
}
```

---

## 📊 BẢNG TỔNG KẾT PHÂN QUYỀN

| Trang | URL | Admin | HOD | Accountant | Sales | Customer |
|-------|-----|-------|-----|------------|-------|----------|
| **Dashboard** | `/dashboard/...` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Invoice List** | `/invoices` | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Invoice Approval** | `/invoices/approval` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create Invoice** | `/invoices/create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Statements** | `/statements` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Debt** | `/debt` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Items** | `/items` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **User Management** | `/admin/usermanager` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Templates** | `/admin/templates` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settings** | `/admin/settings` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | `/admin/reports` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Customers (All)** | `/admin/customers` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **My Customers** | `/sales/customers` | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Create Sales Order** | `/sales/orders/create` | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Invoice Lookup** | `/public/invoice-lookup` | ❌ | ❌ | ❌ | ❌ | ✅ |
| **User Profile** | `/user/profile` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 TEST SCENARIOS

### **Test 1: Admin Login**
```
Login: admin@example.com
→ Redirect: /dashboard/admin
→ Menu hiển thị: Tất cả menu (Admin + Invoice + Reports + Customers)
→ Có thể vào:
   ✅ /invoices (Invoice List)
   ✅ /invoices/approval (Duyệt HĐ)
   ✅ /admin/usermanager
   ✅ Tất cả trang
```

### **Test 2: HOD Login**
```
Login: hod@example.com
→ Redirect: /dashboard/hod
→ Menu hiển thị: Admin (Reports + Customers), Invoice (KHÔNG có Invoice List, có Duyệt HĐ)
→ Có thể vào:
   ❌ /invoices → Redirect về /dashboard/hod
   ✅ /invoices/approval (Duyệt HĐ)
   ✅ /invoices/create
   ✅ /statements, /debt, /items
   ✅ /admin/reports, /admin/customers
   ❌ /admin/usermanager → Redirect về /dashboard/hod
```

### **Test 3: Accountant Login**
```
Login: accountant@example.com
→ Redirect: /dashboard/staff
→ Menu hiển thị: Invoice (có Invoice List, KHÔNG có Duyệt HĐ), Reports, Customers
→ Có thể vào:
   ✅ /invoices (Invoice List)
   ❌ /invoices/approval → Redirect về /dashboard/staff
   ✅ /invoices/create
   ✅ /statements, /debt, /items
   ✅ /admin/reports, /admin/customers
   ❌ /admin/usermanager → Redirect về /dashboard/staff
```

### **Test 4: Sales Login**
```
Login: sales@example.com
→ Redirect: /dashboard/sale
→ Menu hiển thị: Kinh doanh (Khách hàng của tôi, Tạo yêu cầu)
→ Có thể vào:
   ✅ /sales/customers
   ✅ /sales/orders/create
   ❌ /invoices → Redirect về /dashboard/sale
   ❌ /invoices/approval → Redirect về /dashboard/sale
   ❌ /admin/... → Redirect về /dashboard/sale
```

### **Test 5: Customer Login**
```
Login: customer@example.com
→ Redirect: /dashboard/customer
→ Menu hiển thị: Tra cứu (Tra cứu hóa đơn)
→ Có thể vào:
   ✅ /public/invoice-lookup
   ❌ /invoices → Redirect về /dashboard/customer
   ❌ /admin/... → Redirect về /dashboard/customer
   ❌ /sales/... → Redirect về /dashboard/customer
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Cập nhật `src/constants/roles.ts` (Bỏ STAFF, cập nhật permissions)
- [ ] Cập nhật `src/constants/menu-items-with-roles.ts` (Menu theo roles mới)
- [ ] Cập nhật `src/routes/index.tsx` (Thêm ProtectedRoute cho tất cả routes)
- [ ] Test với Admin → Vào được tất cả
- [ ] Test với HOD → KHÔNG vào được /invoices, vào được /invoices/approval
- [ ] Test với Accountant → Vào được /invoices, KHÔNG vào được /invoices/approval
- [ ] Test với Sales → Chỉ vào được /sales/customers và /sales/orders/create
- [ ] Test với Customer → Chỉ vào được /public/invoice-lookup

---

## 💡 LƯU Ý QUAN TRỌNG

1. **HOD không thấy menu "Danh sách hoá đơn"** nhưng vẫn thấy "Duyệt hoá đơn"
2. **Accountant thấy "Danh sách hoá đơn"** nhưng không thấy "Duyệt hoá đơn"
3. **Sales chỉ có module riêng**, không truy cập được admin hay invoice
4. **Customer chỉ tra cứu**, không quản lý gì cả
5. Backend cũng phải validate lại permissions, frontend chỉ là UI protection

---

**✅ Hệ thống phân quyền đã được cấu hình theo yêu cầu mới!**
