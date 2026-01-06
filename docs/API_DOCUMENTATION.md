# 📋 BÁO CÁO PHÂN TÍCH API - DỰ ÁN EIMS-KNS (Hệ thống Quản lý Hóa đơn Điện tử)

## 📊 TỔNG QUAN DỰ ÁN

**Tên dự án:** EIMS-KNS (Electronic Invoice Management System - Khung nghiệp vụ Số)  
**Tech Stack:** React + TypeScript + Vite + Material-UI  
**Trạng thái:** Development (Đang sử dụng Mock API)  
**API Framework:** Axios với Mock Adapter

---

## 🔧 CẤU TRÚC HTTP CLIENT

### File: `src/helpers/httpClient.ts`
```typescript
import axios from 'axios'

function HttpClient() {
  return {
    get: axios.get,
    post: axios.post,
    patch: axios.patch,
    put: axios.put,
    delete: axios.delete,
  }
}

export default HttpClient()
```

**Đặc điểm:**
- Sử dụng Axios làm HTTP client chính
- Wrapper đơn giản không có interceptors
- Không có base URL configuration
- Không có authentication headers tự động

---

## 🎭 FAKE BACKEND (Mock API)

### File: `src/helpers/fake-backend.ts`

Dự án hiện tại đang sử dụng **axios-mock-adapter** để mock API responses.

```typescript
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)
```

#### Mock Users Data:
```typescript
export const fakeUsers: UserType[] = [
  {
    id: '1',
    email: 'test@techzaa.com',
    username: 'demo_user',
    password: 'password',
    firstName: 'Demo',
    lastName: 'User',
    role: 'User',
    token: 'eyJhbGciOiJIUzUxMiIs...'
  },
  {
    id: '2',
    email: 'test@techzaa.com',
    username: 'demo_admin',
    password: 'password',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    token: 'eyJhbGciOiJIUzUxMiIs...'
  }
]
```

---

## 🔐 AUTHENTICATION API

### 1. Login API

**Endpoint:** `POST /login`  
**File:** `src/app/(other)/auth/sign-in/useSignIn.ts`

#### Request:
```typescript
{
  email: string       // Email đăng nhập
  password: string    // Mật khẩu
}
```

#### Response (Success - 200):
```typescript
{
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'User' | 'Admin'
  token: string       // JWT Token
}
```

#### Response (Error - 401):
```typescript
{
  error: "Username or password is incorrect"
}
```

#### Implementation:
```typescript
const login = handleSubmit(async (values: LoginFormFields) => {
  try {
    const res: AxiosResponse<UserType> = await httpClient.post('/login', values)
    if (res.data.token) {
      saveSession({
        ...(res.data ?? {}),
        token: res.data.token,
      })
      redirectUser()
      showNotification({ message: 'Successfully logged in. Redirecting....', variant: 'success' })
    }
  } catch (e: any) {
    if (e.response?.data?.error) {
      showNotification({ message: e.response?.data?.error, variant: 'danger' })
    }
  }
})
```

**Default Credentials:**
- User: `test@techzaa.com` / `password`
- Admin: `test@techzaa.com` / `password`

---

## 🧾 INVOICE MANAGEMENT APIs (Cần Triển Khai)

### 📌 Các API cần xây dựng cho Quản lý Hóa đơn:

#### 1. Lấy danh sách hóa đơn
```
GET /api/invoices
```

**Query Parameters:**
```typescript
{
  searchText?: string                  // Tìm kiếm theo số HĐ, tên KH
  dateFrom?: string                    // Lọc từ ngày (YYYY-MM-DD)
  dateTo?: string                      // Lọc đến ngày (YYYY-MM-DD)
  invoiceStatus?: string[]             // ['Nháp', 'Đã ký', 'Đã phát hành', ...]
  taxStatus?: string                   // 'Đã đồng bộ' | 'Chờ đồng bộ' | 'Lỗi'
  customer?: string                    // Mã khách hàng
  project?: string                     // Mã dự án
  invoiceType?: string[]               // Loại hóa đơn
  amountFrom?: number                  // Số tiền từ
  amountTo?: number                    // Số tiền đến
  page?: number                        // Phân trang
  pageSize?: number                    // Số bản ghi/trang
}
```

**Response:**
```typescript
{
  data: Invoice[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
```

#### 2. Lấy chi tiết hóa đơn
```
GET /api/invoices/:id
```

**Response:**
```typescript
{
  id: string
  invoiceNumber: string
  symbol: string
  customerName: string
  customerEmail: string
  customerTaxCode: string
  customerAddress: string
  taxCode: string
  taxAuthority: string
  issueDate: string
  dueDate: string
  status: 'Nháp' | 'Đã ký' | 'Đã phát hành' | 'Đã gửi' | 'Bị từ chối' | 'Đã thanh toán' | 'Đã hủy'
  taxStatus: 'Chờ đồng bộ' | 'Đã đồng bộ' | 'Lỗi'
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  amount: number
}
```

#### 3. Tạo hóa đơn mới
```
POST /api/invoices
```

**Request Body:**
```typescript
{
  creationMode: 'manual' | 'auto'
  selectedContract?: {
    id: number
    label: string
    value: string
  }
  customerInfo: {
    name: string
    email: string
    taxCode: string
    address: string
  }
  invoiceDetails: {
    issueDate: string
    dueDate: string
    notes: string
  }
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
}
```

**Response:**
```typescript
{
  id: string
  invoiceNumber: string
  message: string
  status: 'success' | 'error'
}
```

#### 4. Cập nhật hóa đơn (Draft)
```
PUT /api/invoices/:id
```

**Request Body:** (Tương tự POST /api/invoices)

#### 5. Ký và phát hành hóa đơn
```
POST /api/invoices/:id/issue
```

**Request Body:**
```typescript
{
  recipientName: string
  email: string
  ccEmails: string[]
  bccEmails: string[]
  sendToCustomer: boolean
  disableSms: boolean
  autoSendOnlyWithEmail: boolean
  language: 'vi' | 'en'
}
```

#### 6. Gửi lại email hóa đơn
```
POST /api/invoices/:id/resend-email
```

**Request Body:**
```typescript
{
  recipientName: string
  email: string
  ccEmails: string[]
  bccEmails: string[]
  includeXml: boolean
  disableSms: boolean
  language: 'vi' | 'en'
}
```

#### 7. Hủy hóa đơn
```
POST /api/invoices/:id/cancel
```

**Request Body:**
```typescript
{
  reason: string
}
```

#### 8. Tạo hóa đơn điều chỉnh
```
POST /api/invoices/:id/adjust
```

#### 9. Tạo hóa đơn thay thế
```
POST /api/invoices/:id/replace
```

#### 10. In hóa đơn
```
GET /api/invoices/:id/print
```

**Response:** PDF File

#### 11. Tải xuống hóa đơn
```
GET /api/invoices/:id/download
```

**Query Parameters:**
```typescript
{
  format: 'pdf' | 'xml' | 'excel'
}
```

---

## 👥 CUSTOMER MANAGEMENT APIs (Cần Triển Khai)

#### 1. Lấy danh sách khách hàng
```
GET /api/customers
```

**Query Parameters:**
```typescript
{
  searchText?: string
  status?: 'Active' | 'Inactive'
  page?: number
  pageSize?: number
}
```

**Response:**
```typescript
{
  data: Customer[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}
```

#### 2. Lấy chi tiết khách hàng
```
GET /api/customers/:id
```

#### 3. Tạo khách hàng mới
```
POST /api/customers
```

**Request Body:**
```typescript
{
  customerName: string
  taxCode: string
  email: string
  phone: string
  address: string
  bankAccount?: string
  bankName?: string
  status: 'Active' | 'Inactive'
}
```

#### 4. Cập nhật khách hàng
```
PUT /api/customers/:id
```

#### 5. Kiểm tra mã số thuế
```
POST /api/customers/validate-tax-code
```

**Request Body:**
```typescript
{
  taxCode: string
}
```

**Response:**
```typescript
{
  isValid: boolean
  companyInfo?: {
    name: string
    address: string
    representative: string
  }
  message?: string
}
```

#### 6. Chuyển trạng thái khách hàng
```
PATCH /api/customers/:id/toggle-status
```

---

## 📦 ITEMS MANAGEMENT APIs (Cần Triển Khai)

#### 1. Lấy danh sách hàng hóa/dịch vụ
```
GET /api/items
```

**Query Parameters:**
```typescript
{
  searchText?: string
  group?: 'hang-hoa' | 'dich-vu' | 'all'
  status?: 'active' | 'inactive'
  page?: number
  pageSize?: number
}
```

#### 2. Tạo hàng hóa/dịch vụ mới
```
POST /api/items
```

**Request Body:**
```typescript
{
  code: string
  name: string
  group: 'hang-hoa' | 'dich-vu'
  unit: string
  salesPrice: number
  priceIncludesTax: boolean
  vatTaxRate: '0%' | '5%' | '8%' | '10%'
  discountRate: number
  discountAmount: number
  vatReduction: 'none' | 'reduced-5%' | 'exempt'
  description?: string
  status: 'active' | 'inactive'
}
```

#### 3. Cập nhật hàng hóa/dịch vụ
```
PUT /api/items/:id
```

#### 4. Chuyển trạng thái
```
PATCH /api/items/:id/toggle-status
```

---

## 📄 TEMPLATE MANAGEMENT APIs (Cần Triển Khai)

#### 1. Lấy danh sách mẫu hóa đơn
```
GET /api/templates
```

**Response:**
```typescript
{
  data: InvoiceTemplate[]
}

interface InvoiceTemplate {
  id: string
  templateName: string
  templateCode: string
  modelCode: string
  invoiceType: 'GTGT' | 'BanHang' | 'DichVu' | 'DieuChinh' | 'ThayThe'
  status: 'Active' | 'Inactive'
  createdAt: string
  createdBy: string
  description?: string
}
```

#### 2. Lấy chi tiết mẫu
```
GET /api/templates/:id
```

#### 3. Tạo mẫu mới
```
POST /api/templates
```

#### 4. Cập nhật mẫu
```
PUT /api/templates/:id
```

#### 5. Xóa mẫu
```
DELETE /api/templates/:id
```

#### 6. Preview mẫu hóa đơn
```
GET /api/templates/:id/preview
```

**Query Parameters:**
```typescript
{
  language?: 'vi' | 'en'
  sampleData?: boolean
}
```

---

## 👤 USER MANAGEMENT APIs (Cần Triển Khai)

#### 1. Lấy danh sách người dùng
```
GET /api/users
```

**Query Parameters:**
```typescript
{
  searchQuery?: string
  role?: 'Admin' | 'Accountant' | 'PM' | 'all'
  status?: 'Active' | 'Inactive' | 'all'
}
```

#### 2. Tạo người dùng mới
```
POST /api/users
```

**Request Body:**
```typescript
{
  fullName: string
  email: string
  role: 'Admin' | 'Accountant' | 'PM'
  status: 'Active' | 'Inactive'
  sendInviteEmail: boolean
}
```

#### 3. Cập nhật người dùng
```
PUT /api/users/:id
```

#### 4. Reset mật khẩu
```
POST /api/users/:id/reset-password
```

**Request Body:**
```typescript
{
  sendEmail: boolean
}
```

#### 5. Chuyển trạng thái người dùng
```
PATCH /api/users/:id/toggle-status
```

---

## 📝 REQUEST MANAGEMENT APIs (Cần Triển Khai)

#### 1. Lấy danh sách yêu cầu tạo hóa đơn
```
GET /api/invoice-requests
```

**Query Parameters:**
```typescript
{
  searchText?: string
  status?: 'Pending' | 'Approved' | 'Rejected'
}
```

**Response:**
```typescript
{
  data: InvoiceRequest[]
}

interface InvoiceRequest {
  id: string
  requestorName: string
  projectName: string
  requestDate: string
  status: 'Pending' | 'Approved' | 'Rejected'
  customerName: string
  customerEmail: string
  customerTaxCode: string
  customerAddress: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
  supportingDocs: string[]
  notes?: string
}
```

#### 2. Duyệt yêu cầu
```
POST /api/invoice-requests/:id/approve
```

#### 3. Từ chối yêu cầu
```
POST /api/invoice-requests/:id/reject
```

**Request Body:**
```typescript
{
  reason: string
}
```

---

## ⚙️ SYSTEM CONFIGURATION APIs (Cần Triển Khai)

#### 1. Lấy cấu hình công ty
```
GET /api/config/company
```

**Response:**
```typescript
{
  companyName: string
  taxCode: string
  address: string
  phone: string
  email: string
  bankAccount: string
  bankName: string
}
```

#### 2. Cập nhật cấu hình công ty
```
PUT /api/config/company
```

#### 3. Lấy cấu hình API CQT
```
GET /api/config/api
```

**Response:**
```typescript
{
  isSandbox: boolean
  apiUrl: string
  apiKey: string      // Encrypted
  secretKey: string   // Encrypted
}
```

#### 4. Cập nhật cấu hình API
```
PUT /api/config/api
```

**Request Body:**
```typescript
{
  isSandbox: boolean
  apiUrl: string
  apiKey: string
  secretKey: string
}
```

#### 5. Test kết nối API CQT
```
POST /api/config/api/test-connection
```

**Response:**
```typescript
{
  success: boolean
  message: string
  responseTime?: number
}
```

#### 6. Lấy cấu hình Email
```
GET /api/config/email
```

#### 7. Cập nhật cấu hình Email
```
PUT /api/config/email
```

**Request Body:**
```typescript
{
  smtpHost: string
  smtpPort: string
  username: string
  password: string
  useSSL: boolean
}
```

#### 8. Gửi email test
```
POST /api/config/email/test
```

---

## 📊 DASHBOARD & REPORTS APIs (Cần Triển Khai)

#### 1. Dashboard Kế toán
```
GET /api/dashboard/accountant
```

**Response:**
```typescript
{
  statistics: {
    totalInvoices: number
    totalRevenue: number
    pendingInvoices: number
    overdueInvoices: number
  }
  recentInvoices: Invoice[]
  revenueChart: {
    labels: string[]
    data: number[]
  }
  invoiceStatusChart: {
    labels: string[]
    data: number[]
  }
}
```

#### 2. Dashboard Admin
```
GET /api/dashboard/admin
```

**Response:**
```typescript
{
  systemMetrics: {
    totalUsers: number
    activeUsers: number
    apiCalls: number
    storageUsed: number
  }
  activityLogs: ActivityLog[]
}
```

#### 3. Dashboard PM/Sales
```
GET /api/dashboard/sales
```

#### 4. Báo cáo doanh thu
```
GET /api/reports/revenue
```

**Query Parameters:**
```typescript
{
  dateFrom: string
  dateTo: string
  groupBy: 'day' | 'month' | 'quarter' | 'year'
}
```

#### 5. Báo cáo thuế
```
GET /api/reports/tax
```

#### 6. Nhật ký hoạt động
```
GET /api/audit-logs
```

**Query Parameters:**
```typescript
{
  dateFrom?: string
  dateTo?: string
  userId?: string
  action?: string
  page?: number
  pageSize?: number
}
```

---

## 🔗 INTEGRATION APIs - VNPT Invoice (API CQT)

### Base URLs:
- **Sandbox:** `https://api-sandbox.vnpt-invoice.com.vn`
- **Production:** `https://api.vnpt-invoice.com.vn`

### Các API cần tích hợp với CQT:

#### 1. Đồng bộ hóa đơn lên CQT
```
POST /api/cqt/sync-invoice
```

#### 2. Kiểm tra trạng thái hóa đơn trên CQT
```
GET /api/cqt/invoice-status/:invoiceNumber
```

#### 3. Lấy mã CQT
```
GET /api/cqt/tax-code/:taxCode
```

#### 4. Tra cứu hóa đơn
```
GET /api/cqt/lookup-invoice
```

---

## 🎨 MOCK DATA HIỆN TẠI

Dự án hiện đang sử dụng Mock Data tại các file:

1. **Invoices:** `src/page/InvoiceManagement.tsx` (8 hóa đơn mẫu)
2. **Customers:** `src/page/CustomerManagement.tsx` (6 khách hàng mẫu)
3. **Users:** `src/page/UserManagement.tsx` (8 người dùng mẫu)
4. **Items:** `src/page/ItemsManagement.tsx` (3 hàng hóa/dịch vụ mẫu)
5. **Templates:** `src/page/TemplateManagement.tsx` (3 mẫu hóa đơn)
6. **Requests:** `src/page/RequestManagement.tsx` (4 yêu cầu mẫu)

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Quy trình hiện tại:

1. **Login** → Mock backend trả về JWT token
2. **Save Session** → Context lưu user info + token
3. **Redirect** → Chuyển về dashboard

### Cần bổ sung:

1. **Token Refresh:** API để refresh token khi hết hạn
2. **Logout:** API để invalidate token
3. **Interceptors:**
   - Request: Tự động gắn Bearer token vào headers
   - Response: Xử lý 401 Unauthorized
4. **Role-based Access Control (RBAC)**
5. **Password Recovery:** Forgot password flow

---

## 📝 ĐÁNH GIÁ & KHUYẾN NGHỊ

### ✅ Điểm mạnh:
- Cấu trúc code rõ ràng, dễ maintain
- TypeScript đảm bảo type safety
- Component reusable tốt
- UI/UX professional với Material-UI

### ⚠️ Cần cải thiện:

#### 1. HTTP Client Configuration
```typescript
// Khuyến nghị: Tạo axios instance với config
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

#### 2. Environment Variables
Tạo file `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=10000
VITE_CQT_API_URL=https://api-sandbox.vnpt-invoice.com.vn
VITE_CQT_API_KEY=your_api_key
VITE_CQT_SECRET_KEY=your_secret_key
```

#### 3. API Service Layer
Tạo các service files để tách biệt API calls:

```typescript
// src/services/invoiceService.ts
import apiClient from '@/helpers/httpClient'
import type { Invoice, InvoiceFormData } from '@/types/invoiceTemplate'

export const invoiceService = {
  getAll: (filters?: InvoiceFilterParams) => 
    apiClient.get<{ data: Invoice[] }>('/invoices', { params: filters }),
  
  getById: (id: string) => 
    apiClient.get<Invoice>(`/invoices/${id}`),
  
  create: (data: InvoiceFormData) => 
    apiClient.post<Invoice>('/invoices', data),
  
  update: (id: string, data: Partial<InvoiceFormData>) => 
    apiClient.put<Invoice>(`/invoices/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/invoices/${id}`),
  
  issue: (id: string, issueData: IssueInvoiceData) => 
    apiClient.post(`/invoices/${id}/issue`, issueData),
}
```

#### 4. Error Handling
```typescript
// src/utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 400:
        return 'Dữ liệu không hợp lệ'
      case 401:
        return 'Phiên đăng nhập hết hạn'
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này'
      case 404:
        return 'Không tìm thấy dữ liệu'
      case 500:
        return 'Lỗi hệ thống, vui lòng thử lại sau'
      default:
        return error.response.data?.message || 'Đã có lỗi xảy ra'
    }
  } else if (error.request) {
    // Request made but no response
    return 'Không thể kết nối đến máy chủ'
  } else {
    // Something else happened
    return error.message || 'Lỗi không xác định'
  }
}
```

#### 5. React Query Integration
Khuyến nghị sử dụng React Query cho data fetching:

```typescript
// src/hooks/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceService } from '@/services/invoiceService'

export const useInvoices = (filters?: InvoiceFilterParams) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceService.getAll(filters),
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
```

---

## 📦 CÁC PACKAGE CẦN BỔ SUNG

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x.x",
    "@tanstack/react-query-devtools": "^5.x.x",
    "zod": "^3.x.x",  // Validation schema
    "react-hook-form": "^7.x.x",  // Đã có
    "date-fns": "^3.x.x"  // Date manipulation
  }
}
```

---

## 🚀 ROADMAP TRIỂN KHAI API

### Phase 1: Core APIs (Tuần 1-2)
- [ ] Setup API Client với interceptors
- [ ] Authentication APIs (Login, Logout, Refresh Token)
- [ ] User Management APIs
- [ ] Customer Management APIs

### Phase 2: Invoice Management (Tuần 3-4)
- [ ] Invoice CRUD APIs
- [ ] Invoice Issue & Sign APIs
- [ ] Invoice Email APIs
- [ ] Template Management APIs

### Phase 3: Advanced Features (Tuần 5-6)
- [ ] Request Management APIs
- [ ] Item Management APIs
- [ ] Dashboard & Reports APIs
- [ ] System Configuration APIs

### Phase 4: Integration (Tuần 7-8)
- [ ] VNPT Invoice API Integration
- [ ] Tax Code Validation API
- [ ] Email Service Integration
- [ ] File Upload/Download APIs

### Phase 5: Testing & Optimization (Tuần 9-10)
- [ ] Unit Tests cho API services
- [ ] Integration Tests
- [ ] Performance Optimization
- [ ] Security Audit

---

## 📞 CONTACT & SUPPORT

**Developer:** EIMS-KNS Team  
**Repository:** EVM_DMS  
**Branch:** dinhan  
**Last Updated:** 17/11/2025

---

**© 2025 EIMS-KNS - Electronic Invoice Management System**
