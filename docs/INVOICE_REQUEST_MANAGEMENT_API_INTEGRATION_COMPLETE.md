# 📋 Invoice Request Management - API Integration Complete

## ✅ Tổng Quan Implementation

Đã hoàn thành việc integrate API cho tính năng **Quản lý Yêu cầu xuất Hóa đơn từ Sales**.

### 🎯 Các tính năng đã implement:

1. ✅ **Service Layer** - `src/services/invoiceService.ts`
   - `createInvoiceRequest()` - Tạo yêu cầu mới
   - `getAllInvoiceRequests()` - Lấy danh sách yêu cầu
   - `getInvoiceRequestDetail()` - Xem chi tiết
   - `approveInvoiceRequest()` - Phê duyệt
   - `rejectInvoiceRequest()` - Từ chối
   - `processInvoiceRequest()` - Bắt đầu xử lý
   - `completeInvoiceRequest()` - Hoàn thành + liên kết HĐ
   - `cancelInvoiceRequest()` - Hủy yêu cầu

2. ✅ **UI Integration** - `src/page/InvoiceRequestManagement.tsx`
   - Real-time data loading với loading state
   - Error handling với Alert component
   - Auto-refresh sau mỗi action
   - Fallback to mock data trong development mode
   - Async action handlers với proper error messages

3. ✅ **Adapter Layer** - `src/utils/invoiceRequestAdapter.ts`
   - `mapFrontendRequestToBackendPayload()` - Convert data types
   - `validateBackendPayload()` - Validate trước khi gửi
   - `calculateRequestTotals()` - Tính toán tổng tiền
   - Helper functions: `formatCurrency()`, `formatDate()`, `formatDateTime()`

---

## 📊 API Endpoints Specification

### Base URL
```
/api/InvoiceRequest
```

### 1. POST `/api/InvoiceRequest` - Tạo yêu cầu mới

**Request Payload (17 fields):**
```typescript
{
  accountantId: null,              // ⚠️ NULL - chưa assign
  salesID: 0,                      // ⚠️ Backend OVERRIDE từ JWT
  customerID: number,
  taxCode: string,
  customerName: string,
  address: string,
  notes: string,
  paymentMethod: string,
  items: [
    {
      productId: number,           // 0 nếu không có
      productName: string,
      unit: string,
      quantity: number,
      amount: number,              // Chưa VAT
      vatAmount: number
    }
  ],
  amount: number,                  // Tổng chưa VAT
  taxAmount: number,               // Tổng VAT
  totalAmount: number,             // Tổng thanh toán
  minRows: 5,
  contactEmail: string,
  contactPerson: string,
  contactPhone: string,
  companyID: 1
}
```

**Response:**
```typescript
{
  requestID: number,
  requestCode: string,
  statusID: number,                // 1=Pending
  customerName: string,
  totalAmount: number,
  createdAt: string
}
```

---

### 2. GET `/api/InvoiceRequest` - Lấy danh sách

**Query Params:**
- `pageSize`: 1000 (mặc định)
- `page`: 1

**Response:**
```typescript
[
  {
    requestID: number,
    requestCode: string,
    statusID: number,
    statusName: string,
    customerID: number,
    customerName: string,
    taxCode: string,
    salesID: number,
    salesName: string,
    accountantId: number | null,
    accountantName: string,
    amount: number,
    taxAmount: number,
    totalAmount: number,
    requestDate: string,
    items: [...],
    ...
  }
]
```

---

### 3. GET `/api/InvoiceRequest/{id}` - Chi tiết yêu cầu

**Response:** Same as list item above

---

### 4. POST `/api/InvoiceRequest/{id}/approve` - Phê duyệt

**Request Body:**
```typescript
{
  notes?: string                   // Optional
}
```

**Response:** Updated request object

---

### 5. POST `/api/InvoiceRequest/{id}/reject` - Từ chối

**Request Body:**
```typescript
{
  reason: string                   // Required
}
```

**Response:** Updated request object

---

### 6. POST `/api/InvoiceRequest/{id}/process` - Bắt đầu xử lý

**Request Body:** Empty `{}`

**Response:** Updated request object

---

### 7. POST `/api/InvoiceRequest/{id}/complete` - Hoàn thành

**Request Body:**
```typescript
{
  invoiceID: number,               // Required
  invoiceNumber: number            // Required
}
```

**Response:** Updated request object

---

### 8. POST `/api/InvoiceRequest/{id}/cancel` - Hủy yêu cầu

**Request Body:**
```typescript
{
  reason?: string                  // Optional
}
```

**Response:** Updated request object

---

## 🔐 Authorization & JWT Token

### ⚠️ CRITICAL: salesID Override Logic

**Frontend behavior:**
- Khi tạo yêu cầu, frontend **LUÔN** gửi `salesID = 0`
- Backend **PHẢI** ignore giá trị này và lấy từ JWT token:

```csharp
// Backend Controller Example
[HttpPost]
public async Task<IActionResult> CreateInvoiceRequest([FromBody] CreateInvoiceRequestDto dto)
{
    // ⭐ CRITICAL: Get salesID from JWT token
    var salesID = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
    
    var request = new InvoiceRequest
    {
        SalesID = salesID,          // Use token value, ignore dto.SalesID
        AccountantID = null,         // Set NULL initially
        CustomerID = dto.CustomerID,
        // ... other fields
    };
    
    await _db.InvoiceRequests.AddAsync(request);
    await _db.SaveChangesAsync();
    
    return Ok(request);
}
```

### Authorization Headers

```typescript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

---

## 📝 Status Flow

```
1. PENDING (Chờ duyệt)
   ↓
2. APPROVED (Đã duyệt) ← HOD/Accountant phê duyệt
   ↓
3. IN_PROGRESS (Đang xử lý) ← Accountant bắt đầu tạo HĐ
   ↓
4. COMPLETED (Hoàn thành) ← Accountant đã tạo HĐ xong

Hoặc:
1. PENDING
   ↓
5. REJECTED (Từ chối) ← HOD/Accountant từ chối

Hoặc:
1. PENDING
   ↓
6. CANCELLED (Đã hủy) ← Sales tự hủy
```

---

## 🎨 UI Components

### Loading State
```tsx
{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <CircularProgress size={60} />
    <Typography>Đang tải dữ liệu...</Typography>
  </Box>
)}
```

### Error State
```tsx
{error && (
  <Alert severity="error" onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

### Data Table
- Auto-refresh sau mỗi action
- Pagination: 5, 10, 25, 50, 100 rows
- Checkbox selection
- Row hover effects
- Responsive design

---

## 🧪 Testing Guide

### Test Case 1: Load Data
1. Mở trang `/invoice-requests`
2. Verify: Loading spinner hiện ra
3. Verify: Data table hiển thị danh sách yêu cầu
4. Verify: Nếu API lỗi, hiển thị error message
5. Verify: Trong dev mode, fallback to mock data

### Test Case 2: Approve Request
1. Click menu "⋮" trên request có status = PENDING
2. Click "Phê duyệt"
3. Nhập ghi chú (optional)
4. Verify: Alert "✅ Đã phê duyệt yêu cầu thành công!"
5. Verify: Table refresh và status chuyển sang APPROVED

### Test Case 3: Reject Request
1. Click menu "⋮" trên request có status = PENDING
2. Click "Từ chối"
3. Nhập lý do (required)
4. Verify: Alert "✅ Đã từ chối yêu cầu"
5. Verify: Table refresh và status chuyển sang REJECTED

### Test Case 4: Process Request
1. Click menu "⋮" trên request có status = APPROVED
2. Click "Bắt đầu xử lý"
3. Verify: Alert "✅ Đã chuyển sang trạng thái 'Đang xử lý'"
4. Verify: Status chuyển sang IN_PROGRESS

### Test Case 5: Complete Request
1. Click menu "⋮" trên request có status = IN_PROGRESS
2. Click "Hoàn thành"
3. Nhập Invoice ID (số nguyên dương)
4. Nhập Invoice Number (số nguyên dương)
5. Verify: Alert "✅ Đã hoàn thành yêu cầu\nHóa đơn: {number}"
6. Verify: Status chuyển sang COMPLETED

### Test Case 6: Cancel Request
1. Click menu "⋮" trên request có status = PENDING
2. Click "Hủy yêu cầu"
3. Confirm dialog
4. Nhập lý do hủy (optional)
5. Verify: Alert "✅ Đã hủy yêu cầu"
6. Verify: Status chuyển sang CANCELLED

---

## 🔧 Troubleshooting

### Issue 1: API trả về lỗi 401 Unauthorized
**Solution:** Kiểm tra token trong localStorage
```typescript
const token = localStorage.getItem('token')
console.log('Token:', token)
```

### Issue 2: API trả về lỗi 400 Bad Request
**Solution:** Check payload validation
```typescript
const validation = validateBackendPayload(payload)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

### Issue 3: Data không load
**Solution:** 
1. Mở DevTools Console
2. Check API response: `[getAllInvoiceRequests] Response:`
3. Nếu API lỗi, trong dev mode sẽ fallback to mock data
4. Kiểm tra backend API có sẵn sàng không

### Issue 4: Actions không hoạt động
**Solution:**
1. Check DevTools Console for error logs
2. Verify user có quyền thực hiện action không
3. Kiểm tra request status có đúng không (VD: chỉ approve PENDING requests)

---

## 📦 Dependencies

```json
{
  "@mui/material": "^5.x",
  "@mui/x-data-grid": "^6.x",
  "@mui/x-date-pickers": "^6.x",
  "axios": "^1.x",
  "dayjs": "^1.x",
  "react": "^18.x",
  "react-router-dom": "^6.x"
}
```

---

## 🚀 Next Steps (Future Enhancements)

### Phase 2: Optional Fields
- [ ] Add `requiredDate` field (DateTime - Hạn xuất HĐ)
- [ ] Add `priority` field (URGENT|HIGH|MEDIUM|LOW)
- [ ] Update backend API to support these fields
- [ ] Add DateTimePicker component
- [ ] Add Priority dropdown selector

### Phase 3: Advanced Features
- [ ] Advanced filtering (by status, date range, customer)
- [ ] Export to Excel
- [ ] Bulk actions (approve multiple requests)
- [ ] Email notifications
- [ ] Audit log / History tracking
- [ ] File attachments support

### Phase 4: Performance Optimization
- [ ] Implement pagination on backend
- [ ] Add debounced search
- [ ] Lazy loading for large datasets
- [ ] Caching with React Query
- [ ] Optimistic UI updates

---

## 📚 Related Documentation

- [Backend API Requirements](./BACKEND_INVOICE_REQUEST_API_REQUIREMENTS.md)
- [Invoice Management Guide](./HOD_INVOICE_MANAGEMENT_INTEGRATION.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

## ✅ Checklist - API Integration Complete

### Service Layer
- [x] Types và interfaces cho backend payload
- [x] `createInvoiceRequest()` function
- [x] `getAllInvoiceRequests()` function
- [x] `getInvoiceRequestDetail()` function
- [x] `approveInvoiceRequest()` function
- [x] `rejectInvoiceRequest()` function
- [x] `processInvoiceRequest()` function
- [x] `completeInvoiceRequest()` function
- [x] `cancelInvoiceRequest()` function
- [x] Error handling với `handleApiError()`
- [x] Dev mode logging

### UI Layer
- [x] Import API service functions
- [x] Replace mock data với real API calls
- [x] Add `loading` state với CircularProgress
- [x] Add `error` state với Alert component
- [x] Add `refreshTrigger` state
- [x] Implement `useEffect()` để fetch data
- [x] Implement `mapBackendToFrontend()` mapper
- [x] Update all action handlers (approve, reject, etc.)
- [x] Add proper error messages
- [x] Add success confirmations
- [x] Fallback to mock data trong dev mode

### Adapter Layer
- [x] Create `invoiceRequestAdapter.ts`
- [x] `mapFrontendRequestToBackendPayload()` function
- [x] `validateBackendPayload()` function
- [x] `calculateRequestTotals()` function
- [x] Helper functions (formatCurrency, formatDate, formatDateTime)
- [x] Example usage documentation

### Documentation
- [x] API endpoints specification
- [x] Request/Response examples
- [x] Authorization & JWT token guide
- [x] Status flow diagram
- [x] Testing guide
- [x] Troubleshooting guide
- [x] Next steps planning

---

## 🎉 Summary

**Implementation hoàn chỉnh:**
- ✅ 8 API endpoints được integrate
- ✅ Full CRUD operations
- ✅ Proper error handling
- ✅ Loading states
- ✅ Auto-refresh mechanism
- ✅ TypeScript type safety
- ✅ Validation layer
- ✅ Dev mode fallback
- ✅ Comprehensive documentation

**Chức năng hoạt động:**
- Sales có thể tạo yêu cầu xuất HĐ
- HOD/Accountant có thể xem, phê duyệt, từ chối
- Accountant có thể xử lý và hoàn thành yêu cầu
- Sales có thể hủy yêu cầu của mình
- Tất cả actions có proper validation và error handling

**Ready for Backend Implementation! 🚀**
