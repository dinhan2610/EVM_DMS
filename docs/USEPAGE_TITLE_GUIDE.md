# 📖 Hướng dẫn sử dụng usePageTitle Hook

## Mục đích

Hook `usePageTitle` quản lý document title theo best practices UX:
- ✅ Format chuẩn: `[Tên Trang] | EIMS`
- ✅ Hiển thị số lượng thông báo: `(5) Duyệt hóa đơn | EIMS`
- ✅ Tự động restore title khi user quay lại tab
- ✅ Message "Hãy quay lại! 🥺" khi user rời tab

---

## Cách sử dụng

### 1. Basic Usage - Trang thông thường

```tsx
import { usePageTitle } from '@/hooks/usePageTitle'

const InvoiceManagement = () => {
  // Set title: "Quản lý hóa đơn | EIMS"
  usePageTitle('Quản lý hóa đơn')
  
  return <div>...</div>
}
```

### 2. With Notification Count - Trang cần attention

```tsx
import { usePageTitle } from '@/hooks/usePageTitle'

const HODInvoiceManagement = () => {
  const [pendingCount, setPendingCount] = useState(0)
  
  // Title: "(5) Duyệt hóa đơn | EIMS" khi có 5 hóa đơn chờ duyệt
  usePageTitle('Duyệt hóa đơn', pendingCount)
  
  useEffect(() => {
    // Fetch pending invoices
    fetchPendingInvoices().then(data => {
      setPendingCount(data.length)
    })
  }, [])
  
  return <div>...</div>
}
```

### 3. Without Brand - Trang login/public

```tsx
import { usePageTitle } from '@/hooks/usePageTitle'

const AuthSignIn = () => {
  // Title: "Đăng nhập" (không có "| EIMS")
  usePageTitle('Đăng nhập', 0, false)
  
  return <div>...</div>
}
```

### 4. Dynamic Title Update - Cập nhật title trong runtime

```tsx
import { usePageTitle } from '@/hooks/usePageTitle'

const TaskQueue = () => {
  const { setTitle } = usePageTitle('Hàng đợi công việc')
  
  const handleTaskComplete = () => {
    // Update title dynamically
    setTitle('Hàng đợi công việc', tasks.length - 1)
  }
  
  return <div>...</div>
}
```

### 5. Invoice Detail Page - Hiển thị mã hóa đơn

```tsx
import { usePageTitle } from '@/hooks/usePageTitle'
import { useParams } from 'react-router-dom'

const InvoiceDetail = () => {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  
  // Title ban đầu: "Chi tiết hóa đơn | EIMS"
  usePageTitle('Chi tiết hóa đơn')
  
  // Sau khi load xong: "HD-2026-150 - Chi tiết hóa đơn | EIMS"
  useEffect(() => {
    if (invoice?.invoiceNumber) {
      document.title = `${invoice.invoiceNumber} - Chi tiết hóa đơn | EIMS`
    }
  }, [invoice])
  
  return <div>...</div>
}
```

---

## Mapping Title cho các trang chính

### Dashboard Pages

| Route | Title | Note |
|-------|-------|------|
| `/dashboard` | `Tổng quan \| EIMS` | Auto redirect based on role |
| `/dashboard/admin` | `Tổng quan - Admin \| EIMS` | Admin dashboard |
| `/dashboard/hod` | `Tổng quan - Kế toán trưởng \| EIMS` | HOD dashboard |
| `/dashboard/staff` | `Không gian làm việc \| EIMS` | Staff/Accountant |
| `/dashboard/sale` | `Tổng quan - Sales \| EIMS` | Sales dashboard |
| `/dashboard/customer` | `Hóa đơn của tôi \| EIMS` | Customer portal |

### Invoice Management

| Route | Title | Count? |
|-------|-------|--------|
| `/invoices` | `Quản lý hóa đơn \| EIMS` | ❌ |
| `/invoices/:id` | `HD-XXX - Chi tiết hóa đơn \| EIMS` | ❌ |
| `/create-invoice` | `Lập hóa đơn mới \| EIMS` | ❌ |
| `/invoices/:id/adjust` | `Lập hóa đơn điều chỉnh \| EIMS` | ❌ |
| `/invoices/:id/replace` | `Lập hóa đơn thay thế \| EIMS` | ❌ |

### Approval & Workflow

| Route | Title | Count? |
|-------|-------|--------|
| `/approval/invoices` | `Duyệt hóa đơn \| EIMS` | ✅ Show pending count |
| `/approval/invoices/:id` | `HD-XXX - Duyệt hóa đơn \| EIMS` | ❌ |

### Customer Management

| Route | Title |
|-------|-------|
| `/admin/customers` | `Quản lý khách hàng \| EIMS` |
| `/sales/customers` | `Khách hàng của tôi \| EIMS` |

### Statement & Debt

| Route | Title |
|-------|-------|
| `/statements` | `Quản lý bảng kê \| EIMS` |
| `/statements/new` | `Tạo bảng kê mới \| EIMS` |
| `/debt` | `Quản lý công nợ \| EIMS` |

### Templates

| Route | Title |
|-------|-------|
| `/admin/templates` | `Quản lý mẫu hóa đơn \| EIMS` |
| `/admin/templates/new` | `Tạo mẫu hóa đơn \| EIMS` |
| `/admin/templates/edit/:id` | `Chỉnh sửa mẫu hóa đơn \| EIMS` |
| `/admin/email-templates` | `Quản lý mẫu email \| EIMS` |

### Admin Pages

| Route | Title |
|-------|-------|
| `/admin/usermanager` | `Quản lý người dùng \| EIMS` |
| `/admin/roles-permissions` | `Phân quyền \| EIMS` |
| `/admin/settings` | `Cấu hình hệ thống \| EIMS` |
| `/admin/audit-logs` | `Nhật ký hệ thống \| EIMS` |
| `/admin/reports` | `Báo cáo \| EIMS` |

### Auth & Public Pages

| Route | Title | Brand? |
|-------|-------|--------|
| `/auth/sign-in` | `Đăng nhập` | ❌ No brand |
| `/auth/sign-up` | `Đăng ký` | ❌ No brand |
| `/public/invoice-lookup` | `Tra cứu hóa đơn \| EIMS` | ✅ |

### User Pages

| Route | Title |
|-------|-------|
| `/pages/profile` | `Hồ sơ cá nhân \| EIMS` |
| `/pages/all-notifications` | `Thông báo \| EIMS` |

---

## Priority Implementation

### Phase 1: Critical Pages (Ưu tiên cao nhất)

Những trang này người dùng truy cập nhiều nhất:

1. ✅ **AdminDashboard** - `Tổng quan - Admin | EIMS`
2. ✅ **HODDashboard** - `Tổng quan - Kế toán trưởng | EIMS`
3. ✅ **StaffDashboard** - `Không gian làm việc | EIMS`
4. ✅ **InvoiceManagement** - `Quản lý hóa đơn | EIMS`
5. ✅ **HODInvoiceManagement** - `(5) Duyệt hóa đơn | EIMS` (với count)
6. ✅ **InvoiceDetail** - `HD-XXX - Chi tiết hóa đơn | EIMS`
7. ✅ **CreateVatInvoice** - `Lập hóa đơn mới | EIMS`

### Phase 2: Common Pages

8. CustomerManagement - `Quản lý khách hàng | EIMS`
9. DebtManagement - `Quản lý công nợ | EIMS`
10. StatementManagement - `Quản lý bảng kê | EIMS`
11. UserManagement - `Quản lý người dùng | EIMS`
12. ReportsPage - `Báo cáo | EIMS`

### Phase 3: Admin & Config Pages

13. TemplateManagement - `Quản lý mẫu hóa đơn | EIMS`
14. SystemConfiguration - `Cấu hình hệ thống | EIMS`
15. AuditLogsPage - `Nhật ký hệ thống | EIMS`

---

## Technical Notes

### Automatic Features

1. **Visibility Change Handling**: Hook tự động xử lý khi user switch tab
   - User rời tab → Title = "Hãy quay lại! 🥺"
   - User quay lại → Restore original title

2. **Route Change Detection**: Title tự động update khi route thay đổi

3. **Memory Management**: Event listeners được cleanup tự động

### Performance

- ✅ No re-renders: Hook chỉ update `document.title`, không trigger component re-render
- ✅ Efficient: Sử dụng `useRef` để lưu original title, tránh recreation
- ✅ Clean: Auto cleanup event listeners trong useEffect

---

## Migration Checklist

- [x] Create `usePageTitle` hook
- [x] Update `index.html` title
- [x] Update `constants.ts` (APP_NAME, DEFAULT_PAGE_TITLE)
- [x] Remove old title handler in `AppProvidersWrapper`
- [ ] Apply to Phase 1 pages (7 pages)
- [ ] Apply to Phase 2 pages (6 pages)
- [ ] Apply to Phase 3 pages (3 pages)
- [ ] Test visibility change behavior
- [ ] Test notification count updates
- [ ] QA approval

---

## Examples từ các ông lớn

### Google Workspace
```
Gmail (15) | Google
Docs - Project Plan | Google
```

### AWS Console
```
EC2 Dashboard | AWS
S3 Buckets | AWS Console
```

### Salesforce
```
(3) Opportunities | Salesforce
Account Details | Salesforce
```

### GitHub
```
Pull requests | my-repo | GitHub
Issues (12) | my-repo | GitHub
```

Chúng ta đang follow đúng pattern này! 🎯
