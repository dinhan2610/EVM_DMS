# 📋 PHÂN TÍCH & TỐI ƯU TRANG TẠO HÓA ĐƠN `/newinvoices`

**Ngày cập nhật:** 19/01/2026  
**Component:** `CreateVatInvoice.tsx`  
**API Endpoint:** `POST /api/Invoice`

---

## 🎯 MỤC ĐÍCH

Hệ thống hỗ trợ **2 cách tạo hóa đơn**:

### 1️⃣ **Tạo hóa đơn trực tiếp** (Kế toán/Admin)
- Không cần `requestID`
- Không cần `salesID`
- Người thực hiện = User hiện tại (Accountant/Admin)

### 2️⃣ **Tạo hóa đơn từ yêu cầu của Sale** (Từ Invoice Request)
- Có `requestID` để link với yêu cầu
- Có `salesID` để ghi nhận người tạo yêu cầu ban đầu
- Người thực hiện = User hiện tại (Accountant xử lý request)

---

## 🔍 API SCHEMA ANALYSIS

### **POST /api/Invoice** - Required Fields

```typescript
interface BackendInvoiceRequest {
  // REQUIRED - Luôn phải có
  templateID: number;
  customerID: number;
  taxCode: string;
  invoiceStatusID: number;
  companyID: number;
  customerName: string;
  address: string;
  notes: string;
  paymentMethod: string;
  items: BackendInvoiceItem[];
  amount: number;
  taxAmount: number;
  totalAmount: number;
  performedBy: number;          // ✅ User thực hiện (luôn = currentUserId)
  minRows: number;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
  
  // OPTIONAL - CHỈ gửi khi tạo từ Invoice Request
  salesID?: number;             // ✅ ID của Sale tạo request
  requestID?: number;           // ✅ ID của Invoice Request
}
```

### **Logic phân biệt 2 mode:**

| Field | Tạo trực tiếp | Tạo từ Request |
|-------|---------------|----------------|
| `performedBy` | currentUserId (Accountant) | currentUserId (Accountant) |
| `salesID` | ❌ KHÔNG GỬI | ✅ salesID từ request |
| `requestID` | ❌ KHÔNG GỬI | ✅ requestID từ URL |

---

## ✅ IMPLEMENTATION - AFTER OPTIMIZATION

### **1. Phát hiện mode trong CreateVatInvoice.tsx**

```typescript
// Line 742-743
const prefillRequestId = searchParams.get('requestId')
const isPrefillMode = !!prefillRequestId

// Routing:
// - Tạo trực tiếp: /newinvoices
// - Tạo từ request: /newinvoices?requestId=123
```

### **2. Load dữ liệu từ Invoice Request (Prefill Mode)**

```typescript
// Line 1029-1115
useEffect(() => {
  const loadPrefillData = async () => {
    if (!isPrefillMode || !prefillRequestId) return;
    
    const prefillResponse = await invoiceService.getPrefillInvoiceData(
      parseInt(prefillRequestId)
    );
    
    // Auto-fill customer info, items, payment method...
    
    // ✅ Lưu salesID từ request (CHỈ khi có và > 0)
    if (invoiceData.salesID !== undefined && 
        invoiceData.salesID !== null && 
        invoiceData.salesID > 0) {
      setPrefillSalesID(invoiceData.salesID);
      console.log('✅ [PREFILL MODE] Loaded salesID from request:', invoiceData.salesID);
    } else {
      console.warn('⚠️ [PREFILL MODE] Request không có salesID hợp lệ');
    }
  }
  
  loadPrefillData();
}, [isPrefillMode, prefillRequestId]);
```

### **3. Submit logic - Chuẩn bị payload**

```typescript
// Line 1740-1770 (OPTIMIZED)
const performedByUser = currentUserId; // Người thực hiện = user hiện tại
const salesIDValue = isPrefillMode && prefillSalesID > 0 
  ? prefillSalesID 
  : undefined;
const requestIDValue = isPrefillMode && prefillRequestId 
  ? parseInt(prefillRequestId) 
  : null;

console.log('🔍 ========== INVOICE CREATION MODE ==========');
console.log('📋 Mode:', isPrefillMode ? 'TẠO TỪ REQUEST' : 'TẠO TRỰC TIẾP');
console.log('👤 performedBy (người thực hiện):', performedByUser);
console.log('🏷️  salesID (người tạo request):', salesIDValue || 'KHÔNG GỬI');
console.log('🔗 requestID (link với request):', requestIDValue || 'KHÔNG GỬI');
console.log('============================================');

const backendRequest = mapToBackendInvoiceRequest(
  selectedTemplate.id,
  buyerInfo,
  items,
  totals,
  paymentMethod,
  5,              // minRows
  invoiceStatusID,
  invoiceNotes,
  performedByUser,  // ✅ performedBy: Luôn là currentUserId
  salesIDValue,     // ✅ salesID: CHỈ có khi tạo từ request
  requestIDValue    // ✅ requestID: CHỈ có khi tạo từ request
);
```

### **4. invoiceAdapter.ts - Logic conditional spread**

```typescript
// Line 310-357 (OPTIMIZED)
export function mapToBackendInvoiceRequest(
  // ... params ...
  signedBy: number,       // performedBy
  salesID?: number,       // Optional
  requestID: number | null = null
): BackendInvoiceRequest {
  
  // ✅ CRITICAL: Logic phân biệt 2 mode
  const payload = {
    templateID,
    customerID: buyerInfo.customerID || 0,
    taxCode: buyerInfo.taxCode || 'N/A',
    invoiceStatusID,
    companyID: 1,
    customerName: buyerInfo.companyName || 'Khách hàng',
    address: buyerInfo.address || 'Chưa cập nhật',
    notes: notes || '',
    paymentMethod: paymentMethod,
    items: backendItems,
    amount: totalAmountBeforeVat,
    taxAmount: totalVatAmount,
    totalAmount: totals.total,
    performedBy: signedBy,    // Người thực hiện (luôn là currentUserId)
    minRows: minRows,
    contactEmail: buyerInfo.email || 'noreply@company.com',
    contactPerson: buyerInfo.buyerName || '',
    contactPhone: buyerInfo.phone || '0000000000',
  };
  
  // ✅ CHỈ thêm salesID nếu có giá trị (tạo từ request)
  if (salesID !== undefined && salesID > 0) {
    Object.assign(payload, { salesID });
    console.log('✅ [ADAPTER] Added salesID to payload:', salesID);
  }
  
  // ✅ CHỈ thêm requestID nếu có giá trị (tạo từ request)
  if (requestID !== null && requestID > 0) {
    Object.assign(payload, { requestID });
    console.log('✅ [ADAPTER] Added requestID to payload:', requestID);
  }
  
  return payload;
}
```

---

## 📊 FLOW DIAGRAM

### **Tạo trực tiếp:**
```
User (Accountant) → Click "Tạo hóa đơn" 
  → /newinvoices
  → Nhập thông tin thủ công
  → Submit
  → Payload:
      {
        performedBy: currentUserId,
        // ❌ KHÔNG có salesID
        // ❌ KHÔNG có requestID
        ...
      }
  → POST /api/Invoice
```

### **Tạo từ Invoice Request:**
```
Sale → Tạo Invoice Request (#123, salesID=5)
  → KTT/Admin xem danh sách requests
  → Click "Tạo hóa đơn" từ request #123
  → /newinvoices?requestId=123
  → Load prefill data (API: GET /api/InvoiceRequest/123/prefill)
  → Auto-fill customer, items, salesID=5
  → Submit
  → Payload:
      {
        performedBy: 10,        // currentUserId (Accountant)
        salesID: 5,            // ✅ Sale tạo request
        requestID: 123,        // ✅ Link với request
        ...
      }
  → POST /api/Invoice
  → Backend tự động:
      - Link invoice với request #123
      - Cập nhật status request → COMPLETED
      - Ghi nhận salesID=5 cho báo cáo
```

---

## 🎯 KEY IMPROVEMENTS

### **✅ 1. Tách biệt rõ ràng `performedBy` vs `salesID`:**

#### **`performedBy` - System Audit Field:**
- **Luôn có** (required): user hiện tại thực hiện action tạo invoice
- **Mục đích:** Audit trail, accountability, permission check
- **VD:** Accountant (ID=10) tạo invoice → `performedBy=10`

#### **`salesID` - Business/Commission Field:**
- **Chỉ có** khi tạo từ Invoice Request (optional)
- **Mục đích:** Tính commission, sales performance, filter by sale
- **VD:** Sale (ID=5) tạo request → Accountant tạo invoice → `salesID=5`

**Business Logic:**
```
Sale tạo request (#123, salesID=5)
  ↓
Accountant (ID=10) xử lý request
  ↓
Tạo Invoice:
  - salesID = 5          ← Sale được tính hoa hồng
  - performedBy = 10     ← Accountant chịu trách nhiệm
  - requestID = 123      ← Link với request
```

### **✅ 2. Conditional spreading chuẩn xác:**
- Dùng `Object.assign()` thay vì spread operator `...`
- Chỉ thêm field khi thỏa điều kiện
- Backend chỉ nhận field khi cần thiết

### **✅ 3. Logging rõ ràng:**
```typescript
// Trước:
console.log('Mode detection:', { isPrefillMode, salesIDSent: ... })

// Sau:
console.log('🔍 ========== INVOICE CREATION MODE ==========');
console.log('📋 Mode:', isPrefillMode ? 'TẠO TỪ REQUEST' : 'TẠO TRỰC TIẾP');
console.log('👤 performedBy:', performedByUser);
console.log('🏷️  salesID:', salesIDValue || 'KHÔNG GỬI');
console.log('🔗 requestID:', requestIDValue || 'KHÔNG GỬI');
```

### **✅ 4. Validation chặt chẽ:**
- Check `salesID > 0` trước khi lưu vào state
- Check `requestID > 0` trước khi gửi lên backend
- Log warning nếu prefill mode nhưng thiếu salesID

---

## 🧪 TEST CASES

### **Test 1: Tạo hóa đơn trực tiếp**
```bash
# URL: /newinvoices
# Expected payload:
{
  "performedBy": 10,
  "templateID": 15,
  "customerID": 12,
  // ❌ KHÔNG có "salesID"
  // ❌ KHÔNG có "requestID"
  ...
}
```

### **Test 2: Tạo hóa đơn từ request (có salesID)**
```bash
# URL: /newinvoices?requestId=100
# Prefill data: salesID=5
# Expected payload:
{
  "performedBy": 10,      # Accountant xử lý
  "salesID": 5,          # ✅ Sale tạo request
  "requestID": 100,      # ✅ Link với request
  "templateID": 15,
  "customerID": 12,
  ...
}
```

### **Test 3: Tạo từ request nhưng thiếu salesID**
```bash
# URL: /newinvoices?requestId=101
# Prefill data: salesID=null hoặc 0
# Expected:
- Console warning: "⚠️ Request không có salesID hợp lệ"
# Expected payload:
{
  "performedBy": 10,
  "requestID": 101,
  // ❌ KHÔNG có "salesID" (vì không hợp lệ)
  ...
}
```

---

## 📝 BACKEND BEHAVIOR (Expected)

### **Scenario 1: Tạo trực tiếp (không có requestID, salesID)**
```csharp
// Backend nhận payload không có requestID, salesID
// → Tạo invoice độc lập
// → KHÔNG link với request nào
// → salesID = NULL hoặc 0
```

### **Scenario 2: Tạo từ request (có requestID, salesID)**
```csharp
// Backend nhận payload có requestID=100, salesID=5
// → Tạo invoice
// → Link invoice với request #100 (UPDATE invoiceID)
// → Cập nhật status request → COMPLETED
// → Lưu salesID=5 vào invoice (cho báo cáo, commission)
```

---

## 🔧 FILES CHANGED

| File | Changes |
|------|---------|
| `src/page/CreateVatInvoice.tsx` | ✅ Cải thiện logging, validate salesID > 0 |
| `src/utils/invoiceAdapter.ts` | ✅ Conditional spread cho salesID/requestID |

---

## ✅ CHECKLIST

- [x] Phân biệt 2 mode: tạo trực tiếp vs tạo từ request
- [x] `performedBy` luôn = currentUserId
- [x] `salesID` chỉ gửi khi tạo từ request và > 0
- [x] `requestID` chỉ gửi khi tạo từ request và > 0
- [x] Logging rõ ràng ở mọi bước
- [x] Validate salesID trước khi lưu state
- [x] Test với 2 flows: direct & from request

---

## 🚀 NEXT STEPS

1. **Test thực tế với backend:**
   - Tạo hóa đơn trực tiếp → kiểm tra không có salesID/requestID
   - Tạo từ request → kiểm tra có đầy đủ salesID/requestID
   
2. **Verify backend linking:**
   - Kiểm tra invoice có link với request không
   - Kiểm tra request status được cập nhật COMPLETED
   
3. **Monitor logs:**
   - Xem console logs trong browser
   - Verify payload gửi lên API

---

**✅ Tối ưu hoàn tất!** Trang tạo hóa đơn giờ đã xử lý chính xác 2 mode với logic rõ ràng và dễ debug.
