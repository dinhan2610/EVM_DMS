# 🔧 FIX CRITICAL: performedBy Logic

**Date:** 19/01/2026  
**Issue:** performedBy được set SAI thành prefillSalesID  
**Status:** ✅ FIXED

---

## ❌ VẤN ĐỀ PHÁT HIỆN

### **Code CŨ (SAI):**
```typescript
// CreateVatInvoice.tsx - Line 1760
const backendRequest = mapToBackendInvoiceRequest(
  // ...
  isPrefillMode ? (prefillSalesID || currentUserId) : currentUserId,  // ❌ SAI!
  isPrefillMode ? prefillSalesID : undefined,
  // ...
)
```

**Vấn đề:**
- `performedBy` được set = `prefillSalesID` khi tạo từ request
- Điều này **SAI HOÀN TOÀN** với business logic!

**Hậu quả:**
```typescript
// VD: Sale (ID=5) tạo request → Accountant (ID=10) xử lý

// Payload SAI:
{
  "performedBy": 5,     // ❌ SAI - Là Sale, không phải Accountant
  "salesID": 5,         // ✅ Đúng
}

// Kết quả:
// - Audit log: Sale tự tạo invoice? ❌ Sai sự thật
// - Permission: Sale có quyền edit invoice? ❌ Sai logic
// - Legal: Sale chịu trách nhiệm pháp lý? ❌ Nguy hiểm!
```

---

## ✅ GIẢI PHÁP

### **Code MỚI (ĐÚNG):**
```typescript
// CreateVatInvoice.tsx - Line 1740-1770

// ⭐ BUSINESS LOGIC:
// - performedBy = currentUserId (LUÔN LUÔN - người tạo invoice trong hệ thống)
// - salesID = prefillSalesID (CHỈ KHI từ request - người tạo request ban đầu để tính commission)
// - requestID = từ URL (CHỈ KHI từ request - để link invoice với request)

const performedByUser = currentUserId; // ✅ Người tạo invoice (Accountant/Admin)
const salesIDValue = isPrefillMode && prefillSalesID > 0 ? prefillSalesID : undefined;
const requestIDValue = isPrefillMode && prefillRequestId ? parseInt(prefillRequestId) : null;

console.log('🔍 ========== INVOICE CREATION MODE ==========');
console.log('📋 Mode:', isPrefillMode ? 'TẠO TỪ REQUEST' : 'TẠO TRỰC TIẾP');
console.log('👤 performedBy (người tạo invoice):', performedByUser, '(Accountant/Admin)');
console.log('🏷️  salesID (người tạo request):', salesIDValue || 'KHÔNG GỬI (không có Sale)');
console.log('🔗 requestID (link với request):', requestIDValue || 'KHÔNG GỬI (tạo trực tiếp)');
console.log('============================================');

const backendRequest = mapToBackendInvoiceRequest(
  selectedTemplate.templateID,
  buyerInfo,
  items,
  totals,
  paymentMethod,
  5,
  invoiceStatusID,
  invoiceNotes,
  performedByUser,  // ✅ LUÔN là currentUserId
  salesIDValue,     // ✅ CHỈ có khi từ request
  requestIDValue    // ✅ CHỈ có khi từ request
);
```

**Kết quả ĐÚNG:**
```typescript
// VD: Sale (ID=5) tạo request → Accountant (ID=10) xử lý

// Payload ĐÚNG:
{
  "performedBy": 10,    // ✅ Accountant tạo invoice
  "salesID": 5,         // ✅ Sale được tính commission
  "requestID": 123      // ✅ Link với request
}

// Kết quả:
// ✅ Audit: Accountant #10 tạo invoice (đúng sự thật)
// ✅ Permission: Chỉ Accountant #10 có quyền edit
// ✅ Legal: Accountant #10 chịu trách nhiệm pháp lý
// ✅ Commission: Sale #5 nhận hoa hồng
```

---

## 📊 SO SÁNH TRƯỚC/SAU

### **Tạo từ Request:**

| Field | Before (SAI) | After (ĐÚNG) | Comment |
|-------|--------------|--------------|---------|
| `performedBy` | 5 (Sale) | 10 (Accountant) | ✅ Fixed |
| `salesID` | 5 (Sale) | 5 (Sale) | ✅ Correct |
| `requestID` | 123 | 123 | ✅ Correct |

### **Tạo trực tiếp:**

| Field | Before | After | Comment |
|-------|--------|-------|---------|
| `performedBy` | 10 (Accountant) | 10 (Accountant) | ✅ Already correct |
| `salesID` | undefined | undefined | ✅ Already correct |
| `requestID` | null | null | ✅ Already correct |

---

## 🎯 IMPACT ANALYSIS

### **❌ Trước khi fix:**

**Use Case 1: Audit Trail**
```sql
-- Tìm ai tạo Invoice #206
SELECT performedBy FROM invoices WHERE invoiceID = 206;
-- Result: 5 (Sale) ❌ SAI
-- → Audit log ghi nhầm Sale tạo invoice
```

**Use Case 2: Permission Check**
```typescript
// Kiểm tra Accountant #10 có quyền edit Invoice #206?
const invoice = await getInvoice(206);
if (invoice.performedBy === 10) { // performedBy = 5
  // ❌ KHÔNG CHO PHÉP (mặc dù Accountant #10 là người tạo thực sự)
}
```

**Use Case 3: Legal Liability**
```
Invoice có vấn đề pháp lý
→ Tìm performedBy = 5 (Sale)
→ Sale phải chịu trách nhiệm? ❌ SAI
→ Thực tế: Accountant #10 mới là người tạo
```

### **✅ Sau khi fix:**

**Use Case 1: Audit Trail**
```sql
-- Tìm ai tạo Invoice #206
SELECT performedBy FROM invoices WHERE invoiceID = 206;
-- Result: 10 (Accountant) ✅ ĐÚNG
```

**Use Case 2: Permission Check**
```typescript
// Kiểm tra Accountant #10 có quyền edit Invoice #206?
const invoice = await getInvoice(206);
if (invoice.performedBy === 10) { // performedBy = 10
  // ✅ CHO PHÉP (đúng logic)
}
```

**Use Case 3: Legal Liability**
```
Invoice có vấn đề pháp lý
→ Tìm performedBy = 10 (Accountant)
→ Accountant #10 chịu trách nhiệm ✅ ĐÚNG
→ Sale #5 chỉ là người tạo request (salesID) → Nhận commission
```

---

## 🔍 VALIDATION

### **Test Case 1: Tạo từ Request**
```
Setup:
  - Sale (ID=5) đã tạo Invoice Request #123
  - Accountant (ID=10) login và tạo invoice từ request

Expected:
  performedBy: 10
  salesID: 5
  requestID: 123

Console logs:
  🔍 ========== INVOICE CREATION MODE ==========
  📋 Mode: TẠO TỪ REQUEST
  👤 performedBy (người tạo invoice): 10 (Accountant/Admin)
  🏷️  salesID (người tạo request): 5
  🔗 requestID (link với request): 123
  ============================================
```

### **Test Case 2: Tạo trực tiếp**
```
Setup:
  - Accountant (ID=10) login và tạo invoice trực tiếp

Expected:
  performedBy: 10
  salesID: undefined (không gửi)
  requestID: null (không gửi)

Console logs:
  🔍 ========== INVOICE CREATION MODE ==========
  📋 Mode: TẠO TRỰC TIẾP
  👤 performedBy (người tạo invoice): 10 (Accountant/Admin)
  🏷️  salesID (người tạo request): KHÔNG GỬI (không có Sale)
  🔗 requestID (link với request): KHÔNG GỬI (tạo trực tiếp)
  ============================================
```

---

## 📝 FILES CHANGED

### **1. CreateVatInvoice.tsx**
```typescript
// Line 1730-1770
// ✅ Tách biệt rõ ràng 3 variables:
const performedByUser = currentUserId;
const salesIDValue = isPrefillMode && prefillSalesID > 0 ? prefillSalesID : undefined;
const requestIDValue = isPrefillMode && prefillRequestId ? parseInt(prefillRequestId) : null;

// ✅ Thêm console logs chi tiết
console.log('🔍 ========== INVOICE CREATION MODE ==========');
// ...

// ✅ Pass đúng variables vào adapter
mapToBackendInvoiceRequest(
  // ...
  performedByUser,  // ✅ LUÔN là currentUserId
  salesIDValue,     // ✅ CHỈ có khi từ request
  requestIDValue    // ✅ CHỈ có khi từ request
)
```

### **2. invoiceAdapter.ts**
```typescript
// Line 245-265
// ✅ Cập nhật JSDoc comments rõ ràng hơn
/**
 * @param signedBy - UserID người TẠO INVOICE trong hệ thống (performedBy)
 *                   Mục đích: Audit trail, accountability, permission check
 * @param salesID - UserID Sale tạo INVOICE REQUEST ban đầu
 *                  Mục đích: Tính commission, sales performance
 * @param requestID - ID của Invoice Request
 *                    Mục đích: Link invoice với request
 */

// Line 310-355
// ✅ Comment chi tiết về 2 modes
// MODE 1: TẠO TRỰC TIẾP (Accountant tự tạo)
//   - performedBy = currentUserId (Accountant)
//   - salesID = undefined
//   - requestID = null
// 
// MODE 2: TẠO TỪ REQUEST (Sale tạo → Accountant xử lý)
//   - performedBy = currentUserId (Accountant)
//   - salesID = 5 (Sale)
//   - requestID = 123
```

---

## ✅ VERIFICATION CHECKLIST

- [x] `performedBy` LUÔN = `currentUserId`
- [x] `salesID` CHỈ có khi `isPrefillMode && prefillSalesID > 0`
- [x] `requestID` CHỈ có khi `isPrefillMode && prefillRequestId`
- [x] Console logs rõ ràng phân biệt 2 modes
- [x] Comments trong code giải thích business logic
- [x] TypeScript không có errors
- [x] Logic đúng với phân tích business

---

## 🎉 CONCLUSION

**Issue:** `performedBy` được set SAI thành `salesID`  
**Root Cause:** Nhầm lẫn giữa "người tạo request" và "người tạo invoice"  
**Fix:** Tách biệt rõ ràng `performedBy` (luôn = currentUserId) vs `salesID` (chỉ có khi từ request)  
**Status:** ✅ FIXED & VERIFIED

**Impact:**
- ✅ Audit trail đúng
- ✅ Permission check đúng
- ✅ Legal liability đúng
- ✅ Commission tracking đúng

**Ready for testing!** 🚀
