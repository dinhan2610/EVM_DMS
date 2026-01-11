# 🔐 HƯỚNG DẪN PHÂN QUYỀN THEO ROLE

## 📋 Mục lục
1. [Tổng quan hệ thống Role](#1-tổng-quan-hệ-thống-role)
2. [Cách sử dụng ProtectedRoute](#2-cách-sử-dụng-protectedroute)
3. [Cách cấu hình Menu theo Role](#3-cách-cấu-hình-menu-theo-role)
4. [Cách kiểm tra Permission trong Component](#4-cách-kiểm-tra-permission-trong-component)
5. [Ví dụ thực tế](#5-ví-dụ-thực-tế)
6. [Testing](#6-testing)

---

## 1. Tổng quan hệ thống Role

### 🎭 Các Role trong hệ thống

```typescript
// File: src/constants/roles.ts

export const USER_ROLES = {
  ADMIN: 'Admin',           // Quản trị viên - Full quyền
  HOD: 'HOD',              // Kế toán trưởng - Duyệt HĐ
  ACCOUNTANT: 'Accountant', // Kế toán - Tạo và quản lý HĐ
  STAFF: 'Staff',          // Nhân viên - Tạo HĐ cơ bản
  SALES: 'Sales',          // Kinh doanh - Tạo yêu cầu xuất HĐ
  CUSTOMER: 'Customer',    // Khách hàng - Xem HĐ của mình
}
```

### 🏠 Dashboard mặc định cho mỗi Role

| Role | Dashboard | URL |
|------|-----------|-----|
| Admin | Admin Dashboard | `/dashboard/admin` |
| HOD | HOD Dashboard | `/dashboard/hod` |
| Accountant/Staff | Staff Dashboard | `/dashboard/staff` |
| Sales | Sale Dashboard | `/dashboard/sale` |
| Customer | Customer Dashboard | `/dashboard/customer` |

### 🔑 Quyền của từng Role

| Permission | Admin | HOD | Accountant | Staff | Sales | Customer |
|------------|-------|-----|------------|-------|-------|----------|
| Xem tất cả HĐ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo HĐ | ✅ | ✅ | ✅ | ✅ | ✅ (yêu cầu) | ❌ |
| Sửa HĐ | ✅ | ✅ | ✅ | ✅ (của mình) | ❌ | ❌ |
| Xóa HĐ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Duyệt HĐ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ký HĐ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quản lý Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quản lý Templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quản lý Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xem Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Quản lý Khách hàng | ✅ | ✅ | ✅ | ❌ | ✅ (của mình) | ❌ |
| Xem Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 2. Cách sử dụng ProtectedRoute

### 📦 Import Component

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { USER_ROLES } from '@/constants/roles'
```

### ✅ Cách 1: Protect route cho nhiều roles

```typescript
// File: src/routes/index.tsx

{
  path: '/invoices/approval',
  name: 'Invoice Approval',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
      <InvoiceApproval />
    </ProtectedRoute>
  ),
}
```

**Kết quả:**
- ✅ Admin và HOD → Vào được
- ❌ Accountant, Staff, Sales, Customer → Redirect về dashboard của họ

### ✅ Cách 2: Protect route cho tất cả user đã login

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
```

**Kết quả:**
- ✅ Tất cả user đã login → Vào được
- ❌ Chưa login → Redirect về `/auth/sign-in`

### ✅ Cách 3: Protect route cho 1 role duy nhất

```typescript
{
  path: '/admin/settings',
  name: 'System Settings',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <SystemConfiguration />
    </ProtectedRoute>
  ),
}
```

**Kết quả:**
- ✅ Chỉ Admin → Vào được
- ❌ Tất cả role khác → Redirect về dashboard của họ

---

## 3. Cách cấu hình Menu theo Role

### 📝 File cấu hình: `src/constants/menu-items-with-roles.ts`

### ✅ Ví dụ: Menu cho Admin only

```typescript
const adminMenu: MenuItemType = {
  key: 'apps-admin',
  icon: 'iconamoon:settings-duotone',
  label: 'Quản trị hệ thống',
  roles: [USER_ROLES.ADMIN], // ⭐ Chỉ Admin thấy
  children: [
    {
      key: 'admin-users',
      label: 'Người dùng',
      url: '/admin/usermanager',
      parentKey: 'apps-admin',
      roles: [USER_ROLES.ADMIN],
    },
  ],
}
```

### ✅ Ví dụ: Menu cho nhiều roles

```typescript
const invoiceMenu: MenuItemType = {
  key: 'apps-invoices',
  icon: 'iconamoon:invoice-duotone',
  label: 'Quản lý Hoá đơn',
  roles: [USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.ACCOUNTANT, USER_ROLES.STAFF], // ⭐ 4 roles
  children: [
    {
      key: 'invoices-approval',
      label: 'Duyệt hoá đơn',
      url: '/invoices/approval',
      parentKey: 'apps-invoices',
      roles: [USER_ROLES.ADMIN, USER_ROLES.HOD], // ⭐ Chỉ Admin và HOD
    },
  ],
}
```

### 🎯 Cách sử dụng Menu động

```typescript
// File: src/layouts/VerticalLayout.tsx hoặc component Menu

import { getMenuItemsByRole } from '@/constants/menu-items-with-roles'
import { useAuthContext } from '@/context/useAuthContext'

function Sidebar() {
  const { user } = useAuthContext()
  
  // ⭐ Lấy menu items đã được filter theo role
  const menuItems = getMenuItemsByRole(user?.role)
  
  return (
    <div>
      {menuItems.map(item => (
        <MenuItem key={item.key} item={item} />
      ))}
    </div>
  )
}
```

---

## 4. Cách kiểm tra Permission trong Component

### 📦 Import helpers

```typescript
import { hasRole, hasPermission, USER_ROLES } from '@/constants/roles'
import { useAuthContext } from '@/context/useAuthContext'
```

### ✅ Cách 1: Kiểm tra Role

```typescript
function InvoiceManagement() {
  const { user } = useAuthContext()
  
  const canApprove = hasRole(user?.role, [USER_ROLES.ADMIN, USER_ROLES.HOD])
  
  return (
    <div>
      <h1>Danh sách hóa đơn</h1>
      
      {canApprove && (
        <Button onClick={handleApprove}>
          Duyệt hóa đơn
        </Button>
      )}
    </div>
  )
}
```

### ✅ Cách 2: Kiểm tra Permission cụ thể

```typescript
function InvoiceActions() {
  const { user } = useAuthContext()
  
  const canEdit = hasPermission(user?.role, 'canEditInvoice')
  const canDelete = hasPermission(user?.role, 'canDeleteInvoice')
  const canApprove = hasPermission(user?.role, 'canApproveInvoice')
  
  return (
    <Box>
      {canEdit && <Button>Sửa</Button>}
      {canDelete && <Button>Xóa</Button>}
      {canApprove && <Button>Duyệt</Button>}
    </Box>
  )
}
```

### ✅ Cách 3: Conditional Rendering phức tạp

```typescript
function InvoiceList() {
  const { user } = useAuthContext()
  const isAdmin = hasRole(user?.role, [USER_ROLES.ADMIN])
  const isHOD = hasRole(user?.role, [USER_ROLES.HOD])
  const isStaff = hasRole(user?.role, [USER_ROLES.STAFF])
  
  return (
    <div>
      {/* Admin và HOD xem tất cả HĐ */}
      {(isAdmin || isHOD) && (
        <AllInvoicesList />
      )}
      
      {/* Staff chỉ xem HĐ của mình */}
      {isStaff && (
        <MyInvoicesList userId={user?.id} />
      )}
    </div>
  )
}
```

---

## 5. Ví dụ thực tế

### 🎯 Ví dụ 1: Trang Duyệt Hóa đơn (Chỉ Admin và HOD)

```typescript
// File: src/routes/index.tsx

{
  path: '/invoices/approval',
  name: 'Invoice Approval',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
      <InvoiceApproval />
    </ProtectedRoute>
  ),
}
```

```typescript
// File: src/page/InvoiceApproval.tsx

import { hasPermission } from '@/constants/roles'
import { useAuthContext } from '@/context/useAuthContext'

function InvoiceApproval() {
  const { user } = useAuthContext()
  const canSign = hasPermission(user?.role, 'canSignInvoice')
  
  return (
    <div>
      <h1>Duyệt hóa đơn</h1>
      
      <Button onClick={handleApprove}>
        ✅ Duyệt
      </Button>
      
      {canSign && (
        <Button onClick={handleSign}>
          🔏 Ký số
        </Button>
      )}
    </div>
  )
}
```

### 🎯 Ví dụ 2: Trang Quản lý Users (Chỉ Admin)

```typescript
// File: src/routes/index.tsx

{
  path: '/admin/usermanager',
  name: 'User Management',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <UserManagement />
    </ProtectedRoute>
  ),
}
```

### 🎯 Ví dụ 3: Trang Sales (Chỉ Sales role)

```typescript
// File: src/routes/index.tsx

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

### 🎯 Ví dụ 4: Trang Customer Portal (Chỉ Customer)

```typescript
// File: src/routes/index.tsx

{
  path: '/customer/invoices',
  name: 'Customer Invoices',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.CUSTOMER]}>
      <CustomerInvoiceList />
    </ProtectedRoute>
  ),
}
```

---

## 6. Testing

### 🧪 Test Case 1: Login với các role khác nhau

```typescript
// Test với Admin
email: admin@example.com
→ Redirect về: /dashboard/admin
→ Menu hiển thị: Tất cả menu

// Test với HOD
email: hod@example.com
→ Redirect về: /dashboard/hod
→ Menu hiển thị: Dashboard, Invoices (có Duyệt HĐ), Reports, Customers

// Test với Sales
email: sales@example.com
→ Redirect về: /dashboard/sale
→ Menu hiển thị: Dashboard, Kinh doanh (Khách hàng, Tạo yêu cầu)

// Test với Customer
email: customer@example.com
→ Redirect về: /dashboard/customer
→ Menu hiển thị: Dashboard, Portal Khách hàng (HĐ của tôi, Thanh toán)
```

### 🧪 Test Case 2: Truy cập URL không có quyền

```typescript
// Sales cố truy cập /admin/usermanager
→ Redirect về: /dashboard/sale

// Customer cố truy cập /invoices/approval
→ Redirect về: /dashboard/customer

// Staff cố truy cập /admin/settings
→ Redirect về: /dashboard/staff
```

---

## 📚 Tổng kết

### ✅ Đã implement:

1. ✅ **File roles.ts** - Định nghĩa roles, permissions, default dashboards
2. ✅ **Component ProtectedRoute** - Bảo vệ routes theo role
3. ✅ **File menu-items-with-roles.ts** - Menu động theo role
4. ✅ **Helper functions** - hasRole(), hasPermission()
5. ✅ **Type MenuItemType** - Thêm property `roles`

### 🚀 Cách áp dụng vào project:

#### Bước 1: Wrap routes cần protect

```typescript
// File: src/routes/index.tsx

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { USER_ROLES } from '@/constants/roles'

// Thêm ProtectedRoute cho các routes cần phân quyền
{
  path: '/invoices/approval',
  element: (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
      <InvoiceApproval />
    </ProtectedRoute>
  ),
}
```

#### Bước 2: Sử dụng menu động

```typescript
// File: src/layouts/VerticalLayout.tsx (hoặc component Sidebar)

import { getMenuItemsByRole } from '@/constants/menu-items-with-roles'

const menuItems = getMenuItemsByRole(user?.role)
```

#### Bước 3: Kiểm tra permissions trong components

```typescript
import { hasRole, hasPermission } from '@/constants/roles'

const canApprove = hasPermission(user?.role, 'canApproveInvoice')
```

---

## 💡 Tips & Best Practices

1. **Luôn sử dụng ProtectedRoute** cho các trang nhạy cảm
2. **Kiểm tra permissions** trước khi gọi API (frontend + backend)
3. **Test với nhiều roles** để đảm bảo phân quyền chính xác
4. **Không hardcode roles** - dùng constants `USER_ROLES`
5. **Backend validation** - Frontend check chỉ là UI, backend phải validate lại

---

## 🔗 Files quan trọng

- `src/constants/roles.ts` - Định nghĩa roles và permissions
- `src/components/ProtectedRoute.tsx` - Component bảo vệ routes
- `src/constants/menu-items-with-roles.ts` - Menu động theo role
- `src/types/menu.ts` - Type definitions với `roles` property
- `src/context/useAuthContext.tsx` - Auth context với user info

---

**✅ Hệ thống phân quyền đã sẵn sàng sử dụng!**
