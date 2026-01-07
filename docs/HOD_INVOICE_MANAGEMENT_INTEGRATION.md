# ✅ HOD Invoice Management Integration - Complete Documentation

## 📋 Tổng quan

Đã tích hợp **API `/api/Invoice/hodInvoices`** vào hệ thống và tạo component quản lý hóa đơn đầy đủ cho role **Kế toán trưởng** (Head of Department).

---

## 🎯 Yêu cầu đã hoàn thành

✅ **API Integration:**
- Thêm method `getHODInvoices()` vào `invoiceService.ts`
- Xử lý response format `{ items: [...] }` từ backend
- Hỗ trợ unwrapping linh hoạt cho nhiều format response

✅ **Component HODInvoiceManagement:**
- **100% tính năng giống InvoiceManagement:**
  - DataGrid với tất cả cột (Ký hiệu, Khách hàng, MST, Ngày phát hành, Trạng thái, Trạng thái CQT, Loại HĐ, Tổng tiền)
  - Invoice type badges với rounded corners (20px/16px)
  - Tooltip hiển thị đầy đủ thông tin HĐ gốc (Số HĐ, Ký hiệu, Ngày ký)
  - Link navigation đến HĐ gốc
  - Filter (search, date range, status, invoice type, amount)
  - Actions menu (view, edit, sign, issue, resend, cancel, download, print)
  - Preview modal
  - Sign dialog
  - Snackbar notifications

✅ **Code Quality:**
- TypeScript type-safe
- Không có compilation errors
- Proper error handling
- Console logging in DEV mode only

---

## 📁 Files Modified/Created

### 1. `/src/services/invoiceService.ts`

**Thêm API method:**

```typescript
/**
 * Lấy danh sách hóa đơn cho role Kế toán trưởng (HOD)
 * API: GET /api/Invoice/hodInvoices
 */
export const getHODInvoices = async (): Promise<InvoiceListItem[]> => {
  try {
    const response = await axios.get<{ items: InvoiceListItem[] }>(
      `/api/Invoice/hodInvoices`,
      { headers: getAuthHeaders() }
    );
    
    // Backend trả về format: { items: [...] }
    let invoicesArray: InvoiceListItem[] = [];
    
    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data)) {
        invoicesArray = response.data;
      } else if ('items' in response.data && Array.isArray(response.data.items)) {
        invoicesArray = response.data.items;
      } else if ('data' in response.data) {
        invoicesArray = (response.data as Record<string, unknown>).data as InvoiceListItem[];
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`[getHODInvoices] Loaded ${invoicesArray.length} invoices for HOD role`);
    }
    
    return invoicesArray;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[getHODInvoices] Error:', error);
    }
    return handleApiError(error, 'Get HOD invoices failed');
  }
};
```

**Export:**

```typescript
const invoiceService = {
  // ... existing exports
  getAllInvoices,
  getHODInvoices,       // ✅ NEW
  getInvoiceById,
  // ...
};
```

---

### 2. `/src/components/dashboard/HODInvoiceManagement.tsx` (NEW FILE)

**Component structure:**

```typescript
/**
 * HOD Invoice Management Component
 * Bảng quản lý hóa đơn dành cho role Kế toán trưởng
 * 
 * ✨ Features (giống 100% với InvoiceManagement):
 * - DataGrid với tất cả cột
 * - Invoice type badges với tooltip
 * - Filter (search, date range, status, invoice type)
 * - Actions menu (view, edit, sign, issue, resend, delete)
 * - Preview modal
 * - Sign dialog
 * - Snackbar notifications
 */

const HODInvoiceManagement = () => {
  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load invoices từ API HOD
  const loadInvoices = async () => {
    const [invoicesData, templatesData, customersData] = await Promise.all([
      invoiceService.getHODInvoices(), // ✅ API mới
      templateService.getAllTemplates(),
      customerService.getAllCustomers(),
    ])
    
    // Map data và hiển thị
    const mappedData = invoicesData.map(item => mapInvoiceToUI(item, templateMap, customerMap))
    setInvoices(mappedData)
  }
  
  // DataGrid columns (giống InvoiceManagement)
  const columns: GridColDef[] = [
    { field: 'symbol', headerName: 'Ký hiệu' },
    { field: 'customerName', headerName: 'Khách hàng' },
    { field: 'taxCode', headerName: 'Mã số thuế' },
    { field: 'issueDate', headerName: 'Ngày phát hành' },
    { field: 'internalStatus', headerName: 'Trạng thái' },
    { field: 'taxStatus', headerName: 'Trạng thái CQT' },
    { 
      field: 'invoiceType', 
      headerName: 'Loại HĐ',
      renderCell: (params) => {
        // Badge với tooltip và link đến HĐ gốc
        return (
          <Tooltip title={tooltipContent}>
            <Box component={Link} to={`/invoices/${originalInvoiceID}`}>
              <Typography>{label}</Typography>
              <LinkIcon />
            </Box>
          </Tooltip>
        )
      }
    },
    { field: 'amount', headerName: 'Tổng tiền' },
    { field: 'actions', headerName: 'Thao tác' },
  ]
  
  return (
    <DataGrid 
      rows={filteredInvoices} 
      columns={columns}
      // ... other props
    />
  )
}
```

---

## 🔄 API Response Format

### Request:
```bash
curl -X 'GET' \
  'http://159.223.64.31/api/Invoice/hodInvoices' \
  -H 'accept: */*'
```

### Response Format:
```json
{
  "items": [
    {
      "invoiceID": 83,
      "templateID": 30,
      "invoiceNumber": 31,
      "invoiceStatusID": 12,
      "paymentStatusID": 1,
      "companyId": 1,
      "customerID": 12,
      "issuerID": null,
      "invoiceType": 1,
      "originalInvoiceID": null,
      "originalInvoiceNumber": null,
      "paymentMethod": "Tiền mặt",
      "signDate": "2026-01-02T02:48:29.79584Z",
      "issuedDate": null,
      "paymentDueDate": null,
      "subtotalAmount": 380000,
      "vatRate": 10,
      "vatAmount": 38000,
      "totalAmount": 418000,
      "totalAmountInWords": "Bốn trăm mười tám nghìn đồng",
      "digitalSignature": "...",
      "taxAuthorityCode": "...",
      "qrCodeData": null,
      "notes": "",
      "filePath": null,
      "xmlPath": "...",
      "createdAt": "2026-01-02T02:17:53.593006Z",
      "adjustmentReason": null,
      "originalInvoiceSignDate": "2025-12-28T11:12:23.901373Z",
      "originalInvoiceSymbol": "1C25TAA",
      "taxStatusCode": "NOT_SENT",
      "taxStatusDescription": "Chưa gửi CQT",
      "taxStatusColor": "default",
      "invoiceItems": [...]
    }
  ]
}
```

### Fields Mapping:

| Backend Field | UI Field | Description |
|---------------|----------|-------------|
| `invoiceID` | `id` | ID hóa đơn |
| `invoiceNumber` | `invoiceNumber` | Số hóa đơn |
| `templateID` → `serial` | `symbol` | Ký hiệu HĐ |
| `customerID` → `name` | `customerName` | Tên khách hàng |
| `customerID` → `taxCode` | `taxCode` | Mã số thuế |
| `createdAt` | `issueDate` | Ngày phát hành |
| `invoiceStatusID` | `internalStatusId` | Trạng thái nội bộ |
| `taxApiStatusID` | `taxStatusId` | Trạng thái CQT |
| `invoiceType` | `invoiceType` | 1=Gốc, 2=Điều chỉnh, 3=Thay thế, 4=Hủy, 5=Giải trình |
| `originalInvoiceID` | `originalInvoiceID` | ID HĐ gốc |
| `originalInvoiceNumber` | `originalInvoiceNumber` | **Số HĐ gốc** |
| `originalInvoiceSignDate` | `originalInvoiceSignDate` | Ngày ký HĐ gốc |
| `originalInvoiceSymbol` | `originalInvoiceSymbol` | Ký hiệu HĐ gốc |
| `totalAmount` | `amount` | Tổng tiền |

---

## 🎨 UI Features

### 1. **Invoice Type Badge với Tooltip**

**Badge Design:**
- Rounded corners: `borderRadius: 20px` (InvoiceManagement) / `16px` (ApprovalQueue)
- Color-coded: Gốc (default), Điều chỉnh (warning), Thay thế (info), Hủy (error), Giải trình (secondary)
- Glass morphism: `backdrop-filter: blur(4px)`

**Tooltip Content:**
```
📝 Hóa đơn điều chỉnh
────────────────────────────
Liên quan đến hóa đơn:
  • Số HĐ: 27              ← originalInvoiceNumber
  • Ký hiệu: 1C25TAA       ← originalInvoiceSymbol
  • Ngày ký: 28/12/2025    ← originalInvoiceSignDate

Lý do điều chỉnh:
  "nhầm giá bán"

────────────────────────────
💡 Click để xem chi tiết HĐ gốc
```

### 2. **Link Icon với Circular Background**

```tsx
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    bgcolor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }}
>
  <LinkIcon sx={{ fontSize: 16, color: '#1976d2' }} />
</Box>
```

### 3. **Actions Menu**

**Available Actions:**
- ✅ Xem chi tiết (luôn active)
- ✅ Sửa (chỉ khi DRAFT)
- ✅ Gửi duyệt (chỉ khi DRAFT)
- ✅ Ký số (chỉ khi APPROVED/PENDING_SIGN)
- ✅ Phát hành (chỉ khi SIGNED + có invoiceNumber)
- ✅ Gửi lại CQT (chỉ khi SIGNED + có lỗi tax status)
- ✅ In hóa đơn (chỉ khi có invoiceNumber)
- ✅ Tải PDF (chỉ khi có invoiceNumber)
- ❌ Gửi email (disabled - chưa implement)
- ✅ Hủy hóa đơn (chỉ khi không phải DRAFT/CANCELLED)
- ✅ Xóa (chỉ khi DRAFT)

### 4. **Filter Panel**

**Supported Filters:**
- Search text (customerName, taxCode, invoiceNumber, symbol)
- Date range (from/to)
- Invoice status (multiple selection)
- Tax status (single selection)
- Invoice type (multiple selection)
- Amount range (from/to)

---

## 📊 Component Comparison

### InvoiceManagement vs HODInvoiceManagement

| Feature | InvoiceManagement | HODInvoiceManagement | Status |
|---------|-------------------|----------------------|--------|
| API Endpoint | `/api/Invoice` | `/api/Invoice/hodInvoices` | ✅ Different |
| DataGrid Columns | 9 columns | 9 columns | ✅ Same |
| Invoice Type Badge | Rounded (20px) | Rounded (20px) | ✅ Same |
| Tooltip Content | Full info | Full info | ✅ Same |
| Filter Panel | Full features | Full features | ✅ Same |
| Actions Menu | 12 actions | 12 actions | ✅ Same |
| Sign Dialog | ✅ | ✅ | ✅ Same |
| Preview Modal | ✅ | ✅ | ✅ Same |
| Snackbar | ✅ | ✅ | ✅ Same |
| **Total Features** | **100%** | **100%** | ✅ **Identical** |

---

## 🚀 Usage

### Integrate vào Dashboard:

```tsx
import HODInvoiceManagement from '@/components/dashboard/HODInvoiceManagement'

// Trong HOD Dashboard page
const HODDashboardPage = () => {
  return (
    <Box>
      <Typography variant="h4">Dashboard - Kế toán trưởng</Typography>
      
      {/* Bảng quản lý hóa đơn */}
      <HODInvoiceManagement />
    </Box>
  )
}
```

### Replace ApprovalQueue:

```tsx
// BEFORE (old ApprovalQueue component)
<ApprovalQueue 
  invoices={pendingInvoices} 
  onBulkApprove={handleApprove} 
/>

// AFTER (new HODInvoiceManagement - full features)
<HODInvoiceManagement />
```

---

## 🧪 Testing Guide

### 1. **API Test:**

```bash
# Test API endpoint
curl -X 'GET' \
  'http://159.223.64.31/api/Invoice/hodInvoices' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected Response:**
```json
{
  "items": [
    {
      "invoiceID": 83,
      "invoiceNumber": 31,
      "invoiceType": 1,
      "originalInvoiceNumber": null,
      "originalInvoiceSignDate": null,
      "originalInvoiceSymbol": null,
      // ... other fields
    }
  ]
}
```

### 2. **UI Test Cases:**

**Test Case 1: Hóa đơn gốc**
```
- invoiceType: 1
- originalInvoiceID: null
- Badge: "Hóa đơn gốc" (default color)
- Tooltip: None
- Link icon: Disabled (gray)
```

**Test Case 2: Hóa đơn điều chỉnh có số**
```
- invoiceType: 2
- originalInvoiceID: 77
- originalInvoiceNumber: 27
- originalInvoiceSymbol: "1C25TAA"
- originalInvoiceSignDate: "2025-12-28..."
- Badge: "Hóa đơn điều chỉnh" (warning color)
- Tooltip: Hiển thị đầy đủ "Số HĐ: 27"
- Link icon: Active (blue) → Click navigate to /invoices/77
```

**Test Case 3: Hóa đơn điều chỉnh chưa cấp số**
```
- invoiceType: 2
- originalInvoiceID: 77
- originalInvoiceNumber: 0 or null
- Badge: "Hóa đơn điều chỉnh" (warning color)
- Tooltip: Hiển thị "Số HĐ: Chưa cấp số" (italic, gray)
```

### 3. **Filter Test:**

```typescript
// Test search filter
filters.searchText = "Công ty ABC"
→ Should show invoices with customerName containing "Công ty ABC"

// Test date range filter
filters.dateFrom = "2026-01-01"
filters.dateTo = "2026-01-31"
→ Should show invoices in January 2026

// Test invoice type filter
filters.invoiceType = [1, 2]
→ Should show only "Hóa đơn gốc" and "Hóa đơn điều chỉnh"
```

### 4. **Action Test:**

```typescript
// Test sign action
handleOpenSignDialog(invoiceId, invoiceNumber)
→ Should open dialog
→ Click "Ký số" → Call invoiceService.signInvoice()
→ Show success snackbar
→ Reload invoices

// Test issue action
handleIssueInvoice(invoiceId)
→ Submit to tax authority
→ Mark as issued
→ Show success with tax code
```

---

## 📝 Migration Notes

### Từ ApprovalQueue cũ sang HODInvoiceManagement mới:

**Removed Features:**
- ❌ Bulk approve checkbox
- ❌ Simple table layout
- ❌ Limited columns (5 columns)

**Added Features:**
- ✅ DataGrid với pagination
- ✅ Full columns (9 columns)
- ✅ Advanced filter panel
- ✅ Actions menu với 12+ actions
- ✅ Invoice type badges với tooltip
- ✅ Link navigation đến HĐ gốc
- ✅ Preview modal
- ✅ Sign dialog
- ✅ Snackbar notifications

**Breaking Changes:**
```tsx
// OLD ApprovalQueue Props
<ApprovalQueue 
  invoices={pendingInvoices}      // ❌ No longer needed
  onBulkApprove={handleApprove}   // ❌ No longer needed
  onQuickView={handleView}        // ❌ No longer needed
/>

// NEW HODInvoiceManagement (no props needed)
<HODInvoiceManagement />          // ✅ Self-contained component
```

---

## ✅ Checklist

- [x] Thêm `getHODInvoices()` vào `invoiceService.ts`
- [x] Export `getHODInvoices` trong `invoiceService` default export
- [x] Tạo component `HODInvoiceManagement.tsx`
- [x] Copy tất cả columns từ `InvoiceManagement`
- [x] Copy invoice type badge với tooltip
- [x] Copy filter panel
- [x] Copy actions menu
- [x] Copy sign dialog
- [x] Copy preview modal
- [x] Fix TypeScript errors (0 errors)
- [x] Test API integration
- [x] Verify UI display
- [x] Create documentation

---

## 🎉 Kết luận

**Component HODInvoiceManagement đã được tạo với 100% tính năng giống InvoiceManagement:**

✅ **API:** `GET /api/Invoice/hodInvoices` đã được tích hợp  
✅ **UI:** DataGrid với đầy đủ 9 cột  
✅ **Badge:** Rounded corners với tooltip hiển thị đầy đủ thông tin HĐ gốc  
✅ **Filter:** Search, date range, status, invoice type, amount  
✅ **Actions:** 12+ actions (view, edit, sign, issue, resend, cancel, download, print)  
✅ **Dialogs:** Sign dialog, Preview modal  
✅ **Notifications:** Snackbar cho tất cả actions  
✅ **Code Quality:** TypeScript type-safe, 0 compilation errors  

**Ready for production! 🚀**
