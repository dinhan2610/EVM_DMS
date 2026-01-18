# 🔄 CreateSalesOrder → Invoice Request API Migration

## ✅ Đã Hoàn Thành

Đã migrate trang **CreateSalesOrder** (`/sales/orders/create`) từ gọi API tạo hóa đơn trực tiếp sang gọi API tạo yêu cầu xuất hóa đơn.

---

## 📊 Thay Đổi Chính

### 1. **API Endpoint Change**
**TRƯỚC:**
```typescript
// ❌ SAI - Tạo hóa đơn trực tiếp
response = await invoiceService.createInvoice(backendRequest)
// POST /api/Invoice
```

**SAU:**
```typescript
// ✅ ĐÚNG - Tạo yêu cầu xuất hóa đơn
const requestPayload: BackendInvoiceRequestPayload = {
  accountantId: null,              // ⚠️ NULL - chưa assign
  salesID: 0,                      // ⚠️ Backend OVERRIDE từ JWT
  customerID: backendRequest.customerID,
  taxCode: backendRequest.taxCode,
  customerName: backendRequest.customerName,
  address: backendRequest.address,
  notes: backendRequest.notes || '',
  paymentMethod: backendRequest.paymentMethod,
  items: backendRequest.items.map(item => ({
    productId: item.productId || 0,
    productName: item.productName,
    unit: item.unit,
    quantity: item.quantity,
    amount: item.amount,
    vatAmount: item.vatAmount,
  })),
  amount: backendRequest.amount,
  taxAmount: backendRequest.taxAmount,
  totalAmount: backendRequest.totalAmount,
  minRows: backendRequest.minRows || 5,
  contactEmail: backendRequest.contactEmail,
  contactPerson: backendRequest.contactPerson,
  contactPhone: backendRequest.contactPhone,
  companyID: backendRequest.companyID || 1,
}

response = await createInvoiceRequest(requestPayload)
// POST /api/InvoiceRequest
```

---

### 2. **UI Label Changes**

| Element | Trước | Sau |
|---------|-------|-----|
| Page Title | "Tạo đơn hàng mới" | "Tạo yêu cầu xuất hóa đơn" |
| Button Text | "Lưu nháp" / "Gửi yêu cầu" | "📋 Gửi yêu cầu xuất hóa đơn" |
| Loading Text | "Đang lưu..." | "Đang gửi yêu cầu..." |
| Success Message | "Lưu hóa đơn nháp thành công" | "Tạo yêu cầu xuất hóa đơn thành công! Yêu cầu đang chờ kế toán xử lý." |

---

### 3. **Button Actions Simplification**

**TRƯỚC (2 buttons):**
- 💾 "Lưu nháp" → `handleSaveDraft()` → Status 1
- 📤 "Gửi yêu cầu" → `handleSubmitForApproval()` → Status 6

**SAU (1 button):**
- 📋 "Gửi yêu cầu xuất hóa đơn" → `handleSubmitRequest()` → Status 1

**Lý do:** Yêu cầu không cần draft mode, chỉ cần submit 1 lần.

---

### 4. **Import Changes**

```typescript
// Added imports
import { createInvoiceRequest, type BackendInvoiceRequestPayload } from '@/services/invoiceService'
```

---

## 🎯 Workflow Mới

```
Sales điền form → Click "Gửi yêu cầu xuất hóa đơn"
    ↓
POST /api/InvoiceRequest (17 fields)
    ↓
Backend tạo InvoiceRequest với:
  - salesID = từ JWT token (không dùng giá trị frontend gửi)
  - accountantID = NULL (chưa assign)
  - statusID = 1 (PENDING)
    ↓
Response: { requestID, customerName, totalAmount, ... }
    ↓
UI hiển thị: "✅ Tạo yêu cầu xuất hóa đơn thành công! (ID: xxx)
              📋 Yêu cầu đang chờ kế toán xử lý."
    ↓
Navigate to /invoices (hoặc future: /invoice-requests/list)
```

---

## 📋 Payload Mapping

### Frontend InvoiceItem → Backend InvoiceRequestItem

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `productId` | `productId` | 0 nếu không có |
| `name` | `productName` | Tên sản phẩm |
| `unit` | `unit` | Đơn vị tính |
| `quantity` | `quantity` | Số lượng |
| `priceAfterTax * quantity - discount` | `amount` | Thành tiền CHƯA VAT |
| `vatTax` hoặc tính từ `vatRate` | `vatAmount` | Tiền VAT |

### Backend Request (17 fields)

```typescript
{
  accountantId: null,           // ⚠️ Luôn null
  salesID: 0,                   // ⚠️ Backend override
  customerID: number,
  taxCode: string,
  customerName: string,
  address: string,
  notes: string,
  paymentMethod: string,
  items: Array<{
    productId: number,
    productName: string,
    unit: string,
    quantity: number,
    amount: number,
    vatAmount: number
  }>,
  amount: number,               // Tổng chưa VAT
  taxAmount: number,            // Tổng VAT
  totalAmount: number,          // Tổng thanh toán
  minRows: 5,
  contactEmail: string,
  contactPerson: string,
  contactPhone: string,
  companyID: 1
}
```

---

## ⚠️ Critical Notes

### 1. **salesID Override**
```typescript
salesID: 0  // Frontend LUÔN gửi 0
```
Backend **BẮT BUỘC** phải:
```csharp
var salesID = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
request.SalesID = salesID;  // Ignore dto.SalesID
```

### 2. **accountantId Always NULL**
```typescript
accountantId: null  // Frontend LUÔN gửi null
```
Backend set NULL khi tạo, assign sau khi HOD approve.

### 3. **Response Type Handling**
```typescript
// Response có thể là:
// - BackendInvoiceRequestResponse (có requestID)
// - BackendInvoiceResponse (có invoiceID)

const responseId = ('requestID' in response ? response.requestID : response.invoiceID) || 0
```

---

## 🧪 Testing Checklist

- [x] Form validation (customer info, items, totals)
- [x] Product auto-fill từ database
- [x] Customer auto-fill theo MST
- [x] VAT calculation đúng
- [x] Submit button disabled khi đang gửi
- [x] Success message hiển thị đúng
- [x] Error handling với message rõ ràng
- [x] Navigate to /invoices sau khi thành công
- [ ] Backend API `/api/InvoiceRequest` sẵn sàng
- [ ] Backend override salesID từ JWT token
- [ ] Backend set accountantID = null

---

## 🚀 Deployment Notes

### Frontend Changes
- ✅ File updated: `src/page/CreateSalesOrder.tsx`
- ✅ Import added: `createInvoiceRequest`, `BackendInvoiceRequestPayload`
- ✅ Function added: `handleSubmitRequest()`
- ✅ Button updated: Single "Gửi yêu cầu xuất hóa đơn"
- ✅ Messages updated: Success/error messages

### Backend Requirements
- ⏳ Implement: `POST /api/InvoiceRequest`
- ⏳ Override: `salesID` from JWT token
- ⏳ Set: `accountantID = null` on creation
- ⏳ Return: `requestID` in response
- ⏳ Create: InvoiceRequest record with status = 1 (PENDING)

---

## 📝 Future Enhancements

1. **Separate List Page** (`/invoice-requests/list`)
   - View all requests created by Sales
   - Filter by status (Pending, Approved, Rejected)
   - Edit draft requests before submitting

2. **Request Status Tracking**
   - Real-time status updates
   - Notifications when approved/rejected
   - Link to created invoice after completion

3. **Validation Improvements**
   - Check duplicate requests
   - Warn if customer has pending requests
   - Validate against business rules

---

## ✅ Summary

**Trước đây:**
- Sales → Tạo hóa đơn trực tiếp → API `/api/Invoice`
- Không cần approval workflow
- Template, số HĐ được tạo ngay

**Bây giờ:**
- Sales → Tạo yêu cầu → API `/api/InvoiceRequest`
- Kế toán/HOD approve
- Template, số HĐ được tạo sau khi approve

**Benefits:**
- ✅ Workflow approval rõ ràng
- ✅ Tách biệt quyền: Sales không tạo HĐ trực tiếp
- ✅ Audit trail đầy đủ
- ✅ Giảm lỗi do nhập sai thông tin
- ✅ Kế toán kiểm soát được tất cả HĐ

---

**Status: ✅ COMPLETE - Ready for Backend Implementation**
