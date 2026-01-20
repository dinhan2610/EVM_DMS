# ✅ CHECKLIST TESTING - 2 CÁCH TẠO HÓA ĐƠN

**Date:** 19/01/2026  
**Component:** CreateVatInvoice.tsx  
**Status:** Ready for Testing

---

## 🎯 TESTING OBJECTIVES

Đảm bảo 2 flows tạo hóa đơn hoạt động chính xác:
1. **Tạo trực tiếp** - Không có requestID, salesID
2. **Tạo từ request** - Có requestID, salesID từ prefill

---

## 📋 TEST CASE 1: TẠO HÓA ĐƠN TRỰC TIẾP

### **Setup:**
```
- Login as: Accountant/Admin
- URL: /newinvoices (không có ?requestId)
```

### **Steps:**

#### **1.1. Navigation & Initial State**
- [ ] Click "Tạo Hóa Đơn" từ menu
- [ ] Verify URL = `/newinvoices` (không có query params)
- [ ] Verify page title = "Lập hóa đơn mới"

**Expected Console Logs:**
```
🔍 CreateVatInvoice params: {
  editMode: false,
  editInvoiceId: null,
  prefillRequestId: null,
  isPrefillMode: false
}
⏭️ Skipping prefill - not in prefill mode
```

#### **1.2. Form Data Entry**
- [ ] Chọn template từ dropdown
- [ ] Nhập/chọn thông tin khách hàng
- [ ] Thêm ít nhất 2 sản phẩm
- [ ] Verify tính toán tổng tiền đúng
- [ ] Chọn hình thức thanh toán

#### **1.3. Submit as Draft**
- [ ] Click "Lưu nháp"

**Expected Console Logs:**
```
🔍 ========== INVOICE CREATION MODE ==========
📋 Mode: TẠO TRỰC TIẾP
👤 performedBy (người thực hiện): 10
🏷️  salesID (người tạo request): KHÔNG GỬI
🔗 requestID (link với request): KHÔNG GỬI
============================================

📤 Sending invoice request (Nháp): { ... }

🔍 ========== PAYLOAD VALIDATION ==========
📄 Template & Customer:
  - templateID: 15
  - customerID: 12
💰 Amounts:
  - amount (chưa VAT): 50,420,000
  - taxAmount (VAT): 42,000
  - totalAmount: 50,462,000
👥 User & Link:
  - performedBy: 10 (number)
  - salesID: ❌ KHÔNG GỬI
  - requestID: ❌ KHÔNG GỬI
```

#### **1.4. Verify Request Payload**
- [ ] Open Network tab → tìm `POST /api/Invoice`
- [ ] Verify payload **KHÔNG CÓ** `salesID`
- [ ] Verify payload **KHÔNG CÓ** `requestID`
- [ ] Verify `performedBy` = currentUserId

**Expected Payload:**
```json
{
  "templateID": 15,
  "customerID": 12,
  "performedBy": 10,
  "amount": 50420000,
  "taxAmount": 42000,
  "totalAmount": 50462000,
  "invoiceStatusID": 1,
  // ❌ KHÔNG CÓ "salesID"
  // ❌ KHÔNG CÓ "requestID"
  ...
}
```

#### **1.5. Verify Backend Response**
- [ ] Verify status code = 200 OK
- [ ] Verify response có `invoiceID`
- [ ] Verify `requestID = null`
- [ ] Verify `salesID = null`

#### **1.6. Navigate to Invoice List**
- [ ] Auto-redirect đến `/invoices`
- [ ] Tìm invoice vừa tạo
- [ ] Verify status = "Nháp"
- [ ] Click xem chi tiết
- [ ] Verify không có link với request nào

---

## 📋 TEST CASE 2: TẠO HÓA ĐƠN TỪ INVOICE REQUEST

### **Setup:**
```
- Step 1: Login as Sale → Tạo Invoice Request
- Step 2: Login as Accountant → Xử lý request
```

### **Step 1: Sale tạo Invoice Request**

#### **2.1. Create Invoice Request**
- [ ] Login as Sale (userID=5)
- [ ] Navigate to `/create-sales-order`
- [ ] Nhập thông tin khách hàng
- [ ] Thêm sản phẩm
- [ ] Submit request

**Expected:**
- [ ] Request được tạo với `requestID = 123` (example)
- [ ] Verify `salesID = 5` trong response
- [ ] Verify `statusID = 1` (Pending)

### **Step 2: Accountant xử lý request**

#### **2.2. Navigate from Request List**
- [ ] Login as Accountant (userID=10)
- [ ] Navigate to `/invoice-requests`
- [ ] Tìm request #123 (status = Pending)
- [ ] Click "Tạo Hóa Đơn" từ menu actions

**Expected:**
- [ ] URL = `/newinvoices?requestId=123`
- [ ] Page title = "Tạo hóa đơn từ yêu cầu"

#### **2.3. Verify Prefill Loading**

**Expected Console Logs:**
```
🔍 CreateVatInvoice params: {
  editMode: false,
  editInvoiceId: null,
  prefillRequestId: "123",
  isPrefillMode: true
}

🚀 Prefill useEffect triggered: {
  isPrefillMode: true,
  prefillRequestId: "123"
}

📥 Loading prefill data for request ID: 123
✅ Prefill data loaded: { ... }
✅ [PREFILL MODE] Loaded salesID from request: 5
   → salesID sẽ được gửi lên backend để link với sale tạo request
```

#### **2.4. Verify Auto-filled Data**
- [ ] Customer info được fill sẵn
- [ ] Items được fill sẵn
- [ ] Payment method được fill sẵn
- [ ] Verify `prefillSalesID` state = 5

#### **2.5. Review & Submit**
- [ ] Kiểm tra dữ liệu auto-fill
- [ ] Điều chỉnh nếu cần
- [ ] Click "Gửi duyệt"

**Expected Console Logs:**
```
🔍 ========== INVOICE CREATION MODE ==========
📋 Mode: TẠO TỪ REQUEST
👤 performedBy (người thực hiện): 10
🏷️  salesID (người tạo request): 5
🔗 requestID (link với request): 123
============================================

✅ [ADAPTER] Added salesID to payload: 5
✅ [ADAPTER] Added requestID to payload: 123

📤 Sending invoice request (Chờ duyệt): { ... }
```

#### **2.6. Verify Request Payload**
- [ ] Open Network tab → tìm `POST /api/Invoice`
- [ ] Verify payload **CÓ** `salesID = 5`
- [ ] Verify payload **CÓ** `requestID = 123`
- [ ] Verify `performedBy = 10` (Accountant)

**Expected Payload:**
```json
{
  "templateID": 15,
  "customerID": 12,
  "performedBy": 10,
  "salesID": 5,          // ✅ FROM REQUEST
  "requestID": 123,      // ✅ LINK
  "amount": 50420000,
  "taxAmount": 42000,
  "totalAmount": 50462000,
  "invoiceStatusID": 6,
  ...
}
```

#### **2.7. Verify Backend Response**
- [ ] Verify status code = 200 OK
- [ ] Verify response có `invoiceID = 207` (example)
- [ ] Verify `requestID = 123`
- [ ] Verify `salesID = 5`

#### **2.8. Verify Request Status Update**
- [ ] Navigate back to `/invoice-requests`
- [ ] Tìm request #123
- [ ] Verify status = "Completed"
- [ ] Verify `invoiceID = 207` trong request

#### **2.9. Verify Invoice Detail**
- [ ] Navigate to `/invoices`
- [ ] Tìm invoice #207
- [ ] Click xem chi tiết
- [ ] Verify có link với request #123
- [ ] Verify salesID = 5

---

## 📋 TEST CASE 3: EDGE CASES

### **3.1. Tạo từ Request nhưng thiếu salesID**

**Setup:**
```sql
-- Tạo request test với salesID = NULL
INSERT INTO invoice_requests (requestID, salesID, statusID, ...)
VALUES (124, NULL, 1, ...);
```

**Steps:**
- [ ] Login as Accountant
- [ ] Navigate to `/newinvoices?requestId=124`

**Expected Console Logs:**
```
📥 Loading prefill data for request ID: 124
⚠️ [PREFILL MODE] Request không có salesID hợp lệ, sẽ dùng currentUserId
```

**Verify Payload:**
- [ ] Payload **KHÔNG CÓ** `salesID` (undefined)
- [ ] Payload **CÓ** `requestID = 124`
- [ ] Verify `performedBy = 10`

### **3.2. Invalid requestId trong URL**

**Steps:**
- [ ] Navigate to `/newinvoices?requestId=99999` (không tồn tại)

**Expected:**
- [ ] API error: "Request not found"
- [ ] Snackbar error hiển thị
- [ ] Form không auto-fill

### **3.3. Refresh page sau prefill**

**Steps:**
- [ ] Navigate to `/newinvoices?requestId=123`
- [ ] Wait for auto-fill
- [ ] Press F5 (refresh)

**Expected:**
- [ ] Data được load lại từ API
- [ ] Form auto-fill lại đầy đủ
- [ ] Không bị mất data

---

## 🔍 MONITORING CHECKLIST

### **Console Logs:**
- [ ] Mode detection logs xuất hiện đúng
- [ ] Payload validation logs đầy đủ
- [ ] Adapter logs hiển thị conditional spread
- [ ] Không có error logs

### **Network Tab:**
- [ ] API calls đúng endpoints
- [ ] Request payloads đúng structure
- [ ] Response codes = 200 OK
- [ ] Response data hợp lệ

### **UI/UX:**
- [ ] Loading states hiển thị
- [ ] Success/error messages rõ ràng
- [ ] Auto-redirect sau submit
- [ ] Form validation hoạt động

---

## 🐛 BUGS TO WATCH FOR

### **Bug 1: salesID = 0 được gửi lên backend**
**Check:**
```typescript
// Payload PHẢI KHÔNG có salesID nếu = 0
// ❌ BAD: { "salesID": 0 }
// ✅ GOOD: Không có field "salesID"
```

### **Bug 2: requestID = null được gửi lên backend**
**Check:**
```typescript
// Payload PHẢI KHÔNG có requestID nếu = null
// ❌ BAD: { "requestID": null }
// ✅ GOOD: Không có field "requestID"
```

### **Bug 3: performedBy bị override bởi salesID**
**Check:**
```typescript
// performedBy PHẢI LÀ currentUserId
// Không được là prefillSalesID
```

### **Bug 4: Request status không update sau tạo invoice**
**Check:**
- [ ] Request #123 status = Pending trước khi tạo invoice
- [ ] Request #123 status = Completed sau khi tạo invoice
- [ ] Request #123 có `invoiceID` được fill

---

## 📊 TEST RESULTS TEMPLATE

### **Test Case 1: Tạo trực tiếp**
- Date: _______________
- Tester: _______________
- Status: ☐ PASS ☐ FAIL
- Notes: _______________

### **Test Case 2: Tạo từ request**
- Date: _______________
- Tester: _______________
- Status: ☐ PASS ☐ FAIL
- Notes: _______________

### **Test Case 3: Edge cases**
- Date: _______________
- Tester: _______________
- Status: ☐ PASS ☐ FAIL
- Notes: _______________

---

## ✅ SIGN-OFF

- [ ] Tất cả test cases PASS
- [ ] Không có bugs critical
- [ ] Console logs sạch (không có errors)
- [ ] Network payloads chính xác
- [ ] Backend responses hợp lệ
- [ ] UI/UX flow smooth

**Tested by:** _______________  
**Date:** _______________  
**Approved by:** _______________  
**Date:** _______________

---

**Ready to deploy!** 🚀
