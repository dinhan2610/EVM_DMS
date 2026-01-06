# 📊 Invoice Status Separation - Business Logic Documentation

## 🎯 Tổng quan thay đổi

### **Vấn đề cũ:**
- Trạng thái "Lỗi gửi CQT" (SEND_ERROR - 8) hiển thị ở cột "Trạng thái" → **SAI LOGIC**
- Thiếu trạng thái "Đã duyệt" và "Đã ký" trong luồng chính
- Không tách biệt rõ ràng giữa trạng thái nội bộ và trạng thái CQT

### **Giải pháp mới:**
- ✅ **Cột "Trạng thái"**: Chỉ hiển thị luồng nghiệp vụ nội bộ
- ✅ **Cột "Trạng thái CQT"**: Hiển thị tất cả trạng thái tích hợp với CQT (bao gồm lỗi)
- ✅ Thêm 2 trạng thái mới: **Đã duyệt (9)** và **Đã ký (10)**

---

## 📋 Phân tách rõ ràng 2 cột

### **COT 1: "Trạng thái" (Internal Status)**

Hiển thị luồng xử lý hóa đơn **TRONG HỆ THỐNG**

| Step | ID | Code | Label | Màu sắc | Mô tả |
|------|----|----- |-------|---------|-------|
| 1️⃣ | 1 | DRAFT | Nháp | ⚪ Default | Mới tạo, chưa gửi duyệt |
| 2️⃣ | 6 | PENDING_APPROVAL | Chờ duyệt | 🟡 Warning | Đã gửi cho KTT duyệt |
| 3️⃣ | 9 | APPROVED | Đã duyệt | 🔵 Info | KTT đã phê duyệt ✨ **NEW** |
| 4️⃣ | 7 | PENDING_SIGN | Chờ ký | 🔵 Primary | Chờ ký số điện tử |
| 5️⃣ | 10 | SIGNED | Đã ký | 🟣 Secondary | Đã ký số thành công ✨ **NEW** |
| 6️⃣ | 2 | ISSUED | Đã phát hành | 🟢 Success | Hoàn tất (có/không mã CQT) |

**Luồng phụ (không nằm trong quy trình chính):**
- **3** - CANCELLED (Bị từ chối): KTT từ chối hóa đơn
- **4** - ADJUSTED (Đã điều chỉnh): Hóa đơn điều chỉnh
- **5** - REPLACED (Bị thay thế): Có hóa đơn thay thế

**❌ KHÔNG HIỂN THỊ Ở ĐÂY:**
- ~~Lỗi gửi CQT~~
- ~~TB01-TB12~~
- ~~KQ01-KQ04~~

---

### **CỘT 2: "Trạng thái CQT" (Tax Status)**

Hiển thị trạng thái tích hợp với **CƠ QUAN THUẾ**

#### **Nhóm 1: Trạng thái xử lý chung**

| ID | Code | Label | Màu sắc |
|----|------|-------|---------|
| 0 | NOT_SENT | Chưa gửi CQT | ⚪ Default |
| 1 | PENDING | Đang gửi CQT | 🟡 Warning |
| 2 | RECEIVED | CQT đã tiếp nhận | 🔵 Info |
| 3 | REJECTED | CQT từ chối | 🔴 Error |
| 4 | APPROVED | ✅ CQT đã cấp mã | 🟢 Success |
| 5 | FAILED | ❌ Lỗi gửi CQT | 🔴 Error |
| 6 | PROCESSING | Đang xử lý | 🟡 Warning |
| 7 | NOT_FOUND | Không tìm thấy | ⚪ Default |

#### **Nhóm 2: Thông báo tiếp nhận (TB01-TB12)**

| ID | Code | Label | Ý nghĩa |
|----|------|-------|---------|
| 10 | TB01 | ✅ Tiếp nhận hợp lệ | Thành công |
| 11 | TB02 | ❌ Sai định dạng XML | Lỗi format |
| 12 | TB03 | ❌ Chữ ký không hợp lệ | Lỗi chứng thư số |
| 13 | TB04 | ❌ MST không đúng | Lỗi mã số thuế |
| 14 | TB05 | ❌ Thiếu thông tin | Lỗi thiếu field |
| 15 | TB06 | ❌ Sai định dạng dữ liệu | Lỗi data type |
| 16 | TB07 | ❌ Trùng hóa đơn | Hóa đơn đã tồn tại |
| 17 | TB08 | ❌ Không được cấp mã | Không đủ điều kiện |
| 18 | TB09 | ❌ Không tìm thấy tham chiếu | Lỗi HĐ điều chỉnh |
| 19 | TB10 | ❌ Hàng hóa không hợp lệ | Lỗi chi tiết HĐ |
| 20 | TB11 | ❌ PDF sai cấu trúc | Lỗi file PDF |
| 21 | TB12 | ❌ Lỗi hệ thống CQT | Lỗi technical CQT |

#### **Nhóm 3: Kết quả xử lý (KQ01-KQ04)**

| ID | Code | Label | Ý nghĩa |
|----|------|-------|---------|
| 30 | KQ01 | ✅ Đã cấp mã CQT | **Thành công cuối cùng** |
| 31 | KQ02 | ❌ Bị từ chối cấp mã | Thất bại cuối cùng |
| 32 | KQ03 | Chưa có kết quả | Đang chờ |
| 33 | KQ04 | Không tìm thấy | Không có trong hệ thống |

---

## 🔄 Luồng nghiệp vụ mới (Updated State Machine)

### **Luồng chính:**

```
┌──────────────┐
│   1. Nháp    │
│   (DRAFT)    │
└──────┬───────┘
       │ sendForApproval()
       ▼
┌──────────────────┐
│  2. Chờ duyệt    │
│(PENDING_APPROVAL)│
└──────┬───────────┘
       │ approveInvoice()
       ▼
┌──────────────┐
│ 3. Đã duyệt  │ ✨ NEW
│  (APPROVED)  │
└──────┬───────┘
       │ markPendingSign()
       ▼
┌──────────────┐
│  4. Chờ ký   │
│(PENDING_SIGN)│
└──────┬───────┘
       │ signInvoice() + markSigned()
       ▼
┌──────────────┐
│  5. Đã ký    │ ✨ NEW
│   (SIGNED)   │
└──────┬───────┘
       │ submitToTaxAuthority() + markIssued()
       ▼
┌────────────────┐
│6. Đã phát hành │
│   (ISSUED)     │
└────────────────┘
```

### **Xử lý lỗi gửi CQT:**

```
┌──────────────┐
│  5. Đã ký    │
│   (SIGNED)   │
└──────┬───────┘
       │ submitToTaxAuthority() ❌ FAILED
       │
       ├─ Internal Status: Giữ nguyên SIGNED (10)
       │
       └─ Tax Status: Cập nhật FAILED (5) hoặc TB02-TB12
       
       ⚠️ Hiển thị:
       - Cột "Trạng thái": Đã ký
       - Cột "Trạng thái CQT": ❌ Lỗi gửi CQT (hoặc TB02, TB03, etc.)
       
       📌 Action: Nút "Gửi lại CQT" xuất hiện
```

### **Luồng từ chối:**

```
┌──────────────────┐
│  2. Chờ duyệt    │
│(PENDING_APPROVAL)│
└──────┬───────────┘
       │ rejectInvoice(reason)
       ▼
┌──────────────┐
│ Bị từ chối   │
│ (CANCELLED)  │
└──────────────┘
```

---

## 🛠️ Implementation Details

### **1. Constants Update** (`invoiceStatus.ts`)

```typescript
export const INVOICE_INTERNAL_STATUS = {
  // Luồng chính
  DRAFT: 1,
  PENDING_APPROVAL: 6,
  APPROVED: 9,          // ✨ NEW
  PENDING_SIGN: 7,
  SIGNED: 10,           // ✨ NEW
  ISSUED: 2,
  
  // Luồng phụ
  CANCELLED: 3,
  ADJUSTED: 4,
  REPLACED: 5,
};

export const TAX_STATUS = {
  NOT_SENT: 0,
  PENDING: 1,
  RECEIVED: 2,
  REJECTED: 3,
  APPROVED: 4,
  FAILED: 5,            // ❌ Lỗi gửi CQT
  // ... TB01-TB12, KQ01-KQ04
};
```

### **2. Service Methods** (`invoiceService.ts`)

#### **New Methods:**

```typescript
// 6 → 9 (KTT duyệt)
approveInvoice(invoiceId, note?): Promise<void>

// 9 → 7 (Tự động sau khi duyệt)
markPendingSign(invoiceId): Promise<void>

// 7 → 10 (Sau khi ký số)
markSigned(invoiceId, signerId?): Promise<void>

// 10 → 2 (Sau khi gửi CQT thành công)
markIssued(invoiceId, taxCode?): Promise<void>
```

#### **Deprecated:**

```typescript
// ❌ KHÔNG DÙNG NỮA
markSendError(invoiceId, errorMsg?): Promise<void>
// Lý do: Lỗi gửi CQT hiển thị ở Tax Status
```

### **3. UI Logic** (`InvoiceManagement.tsx`)

#### **Action Menu:**

```typescript
// Xác định trạng thái
const isDraft = status === 1
const isPendingSign = status === 7
const isSigned = status === 10
const isIssued = status === 2

// Kiểm tra lỗi CQT từ Tax Status
const hasTaxError = taxStatusId !== null && isTaxStatusError(taxStatusId)

// Menu items
{
  label: 'Ký & Phát hành',
  enabled: isPendingSign,  // Chỉ khi status = 7
}

{
  label: 'Gửi lại CQT',
  enabled: (isSigned || isIssued) && hasTaxError,  // Kiểm tra Tax Status
}
```

#### **Sign & Submit Handler:**

```typescript
const handleSignAndSubmit = async () => {
  // Bước 1: Ký số
  await signInvoice(invoiceId, userId);
  
  // Bước 2: Cập nhật Internal Status → SIGNED (10)
  await markSigned(invoiceId, userId);
  
  // Bước 3: Gửi CQT
  try {
    const taxCode = await submitToTaxAuthority(invoiceId);
    
    // Bước 4: Thành công → ISSUED (2)
    await markIssued(invoiceId, taxCode);
    
    showSuccess('Đã phát hành thành công');
    
  } catch (taxError) {
    // Lỗi CQT → Giữ SIGNED (10), lỗi ở Tax Status
    showError('Đã ký nhưng gửi CQT thất bại');
    
    // Tax Status sẽ được backend cập nhật tự động
  }
};
```

---

## 📊 So sánh trước và sau

### **Kịch bản: Hóa đơn đã ký nhưng gửi CQT thất bại**

#### **❌ CŨ (Sai):**

| Cột "Trạng thái" | Cột "Trạng thái CQT" |
|------------------|----------------------|
| Lỗi gửi CQT (8) | Chưa gửi CQT |

❌ **Vấn đề**: "Lỗi gửi CQT" không phải trạng thái nội bộ, gây nhầm lẫn

#### **✅ MỚI (Đúng):**

| Cột "Trạng thái" | Cột "Trạng thái CQT" |
|------------------|----------------------|
| Đã ký (10) | ❌ Lỗi gửi CQT (FAILED - 5) |

✅ **Lợi ích**: 
- Trạng thái nội bộ rõ ràng: Đã ký
- Lỗi CQT hiển thị đúng chỗ
- Dễ theo dõi và xử lý

---

## 🎯 Backend Requirements

### **1. Thêm 2 status IDs mới:**

```sql
-- Status 9: Đã duyệt
INSERT INTO InvoiceStatus (StatusID, StatusName) VALUES (9, 'Đã duyệt');

-- Status 10: Đã ký
INSERT INTO InvoiceStatus (StatusID, StatusName) VALUES (10, 'Đã ký');
```

### **2. Cập nhật InvoiceListItem response:**

```typescript
interface InvoiceListItem {
  // ... existing fields
  
  invoiceStatusID: number;      // Internal status (1-10)
  taxApiStatusID: number | null; // Tax status (0-33)
  taxStatusCode: string | null;  // Code: PENDING, TB01, KQ01, etc.
  taxStatusName: string | null;  // Label hiển thị
}
```

### **3. API PATCH /api/Invoice/{id}/status cần hỗ trợ:**

- Status 9 (APPROVED)
- Status 10 (SIGNED)
- Validation transitions hợp lệ

### **4. Tự động cập nhật Tax Status:**

Khi gửi CQT thất bại, backend tự động:
- Giữ `invoiceStatusID` = 10 (SIGNED)
- Cập nhật `taxApiStatusID` = 5 (FAILED) hoặc TB02-TB12
- Cập nhật `taxStatusCode` và `taxStatusName`

---

## ✅ Validation Rules

### **Frontend Validation:**

```typescript
const validTransitions: Record<number, number[]> = {
  1: [6],           // DRAFT → PENDING_APPROVAL
  6: [9, 3],        // PENDING_APPROVAL → APPROVED | CANCELLED
  9: [7],           // APPROVED → PENDING_SIGN
  7: [10],          // PENDING_SIGN → SIGNED
  10: [2],          // SIGNED → ISSUED
};
```

### **Backend Validation:**

1. Kiểm tra transition hợp lệ
2. Kiểm tra permissions (role-based)
3. Kiểm tra preconditions (VD: không thể ký nếu chưa duyệt)

---

## 🧪 Test Cases

### **Test 1: Happy Path**

```
1. Tạo hóa đơn → DRAFT (1)
2. Gửi duyệt → PENDING_APPROVAL (6)
3. KTT duyệt → APPROVED (9) → PENDING_SIGN (7)
4. Ký số → SIGNED (10)
5. Gửi CQT thành công → ISSUED (2), Tax Status = KQ01
```

### **Test 2: Lỗi gửi CQT**

```
1-4. Giống Test 1
5. Gửi CQT thất bại → 
   - Internal Status: SIGNED (10)
   - Tax Status: FAILED (5)
   - UI: Nút "Gửi lại CQT" xuất hiện
```

### **Test 3: Gửi lại thành công**

```
1. Từ SIGNED (10) + Tax Status FAILED
2. Click "Gửi lại CQT"
3. Thành công → ISSUED (2), Tax Status = KQ01
```

---

## 📚 Benefits

### **1. Tách biệt rõ ràng:**
- ✅ Trạng thái nội bộ (Internal) vs Trạng thái CQT (Tax)
- ✅ Không lẫn lộn giữa các concerns

### **2. Dễ hiểu hơn:**
- ✅ Người dùng nhìn cột "Trạng thái" biết hóa đơn đang ở bước nào
- ✅ Người dùng nhìn cột "Trạng thái CQT" biết CQT xử lý thế nào

### **3. Dễ bảo trì:**
- ✅ Logic rõ ràng, dễ debug
- ✅ Thêm status mới không ảnh hưởng logic cũ

### **4. Chuẩn nghiệp vụ:**
- ✅ Tuân thủ quy trình: Nháp → Chờ duyệt → Đã duyệt → Chờ ký → Đã ký → Đã phát hành
- ✅ Lỗi CQT được xử lý đúng chỗ

---

**Version**: 3.0.0  
**Last Updated**: 19/12/2024  
**Breaking Changes**: Thêm APPROVED (9) và SIGNED (10), loại bỏ SEND_ERROR (8) khỏi Internal Status
