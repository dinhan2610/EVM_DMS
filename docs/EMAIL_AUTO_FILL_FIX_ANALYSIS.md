# 🔍 Phân tích và Sửa lỗi Auto-fill Email Khách hàng

## 🎯 Vấn đề ban đầu

**User báo:** Chưa get được thông tin email khách hàng trong hóa đơn khi mở modal gửi email.

---

## 🔬 Phân tích chi tiết

### 1. Backend API Response (Thực tế)

**Endpoint:** `GET /api/Invoice`

```json
{
  "items": [
    {
      "invoiceID": 133,
      "customerName": "Công Ty Dịch Vụ Giải Trí MTP",
      "customerAddress": "11 đường số 16 KDC Lake View, An Phú, Hồ Chí Minh",
      "customerEmail": "antdse173107@fpt.edu.vn",  // ✅ Backend trả về field này
      "taxCode": "0112233445",
      // ... các field khác
    }
  ]
}
```

**Phát hiện:** Backend trả về `customerEmail`, KHÔNG phải `contactEmail`!

---

### 2. Frontend Interface (Trước khi sửa)

**File:** `src/services/invoiceService.ts`

```typescript
export interface InvoiceListItem {
  // ...
  contactEmail?: string;    // ❌ Frontend expect field này
  contactPerson?: string;
  contactPhone?: string;
  
  customerName?: string;
  customerAddress?: string;
  taxCode?: string;
  // customerEmail KHÔNG CÓ! ❌
}
```

**Vấn đề:** Interface không có field `customerEmail` nên data từ backend bị bỏ qua!

---

### 3. Mapping trong InvoiceManagement (Trước khi sửa)

**File:** `src/page/InvoiceManagement.tsx`

```typescript
const mapInvoiceToUI = (item: InvoiceListItem) => {
  return {
    // ...
    contactEmail: item.contactEmail || null,  // ❌ item.contactEmail = undefined
    // Backend trả về customerEmail nhưng không map!
  }
}
```

**Kết quả:** `contactEmail` luôn là `null` → Modal không có email để auto-fill!

---

## ✅ Giải pháp đã áp dụng

### 1. Update InvoiceListItem Interface

**File:** `src/services/invoiceService.ts`

```typescript
export interface InvoiceListItem {
  // ...
  contactPerson?: string;
  contactEmail?: string;         // Legacy field (không dùng)
  contactPhone?: string;
  
  // Customer fields from backend API response
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;        // ✅ THÊM field này từ backend
  taxCode?: string;
}
```

**Lý do:**
- Backend trả về `customerEmail`
- Giữ `contactEmail` để backward compatible (nếu backend có update sau)
- Map cả 2 để đảm bảo không miss data

---

### 2. Update Mapping Logic

**File:** `src/page/InvoiceManagement.tsx`

```typescript
const mapInvoiceToUI = (item: InvoiceListItem) => {
  return {
    // ...
    amount: item.totalAmount,
    notes: item.notes || null,
    
    // Contact info từ invoice (để gửi email)
    // ✅ Ưu tiên customerEmail từ backend, fallback về contactEmail
    contactEmail: item.customerEmail || item.contactEmail || null,
    contactPerson: item.contactPerson || null,
    contactPhone: item.contactPhone || null,
    // ...
  }
}
```

**Logic ưu tiên:**
1. `item.customerEmail` - Field mới từ backend API (✅ Có data)
2. `item.contactEmail` - Field legacy (fallback)
3. `null` - Mặc định nếu không có gì

---

### 3. Thêm Debug Logging

**File:** `src/page/InvoiceManagement.tsx`

```typescript
const loadInvoices = async () => {
  // ... load data
  
  let mappedData = invoicesData.map(item => mapInvoiceToUI(item, templateMap, customerMap))
  
  // 🔍 DEBUG: Log email data từ backend
  if (invoicesData.length > 0 && import.meta.env.DEV) {
    console.log('📧 [InvoiceManagement] Sample invoice with email:', {
      invoiceID: invoicesData[0].invoiceID,
      customerName: invoicesData[0].customerName,
      customerEmail: invoicesData[0].customerEmail,      // Backend field
      contactEmail: invoicesData[0].contactEmail,        // Legacy field
      mappedContactEmail: mappedData[0].contactEmail,    // Final mapped value
    })
  }
  
  // ...
}
```

**Mục đích:**
- Verify backend có trả về `customerEmail` không
- Check mapping có hoạt động đúng không
- Debug dễ dàng nếu có vấn đề

---

## 📊 Luồng dữ liệu hoàn chỉnh

```
┌────────────────────────────────────────────────────────────┐
│ 1. Backend API Response                                    │
├────────────────────────────────────────────────────────────┤
│ GET /api/Invoice                                           │
│ {                                                          │
│   "customerEmail": "antdse173107@fpt.edu.vn"  ✅          │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 2. InvoiceListItem Interface                               │
├────────────────────────────────────────────────────────────┤
│ interface InvoiceListItem {                                │
│   customerEmail?: string  ✅ Added                         │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 3. mapInvoiceToUI() - Mapping                              │
├────────────────────────────────────────────────────────────┤
│ contactEmail: item.customerEmail || item.contactEmail      │
│ Result: "antdse173107@fpt.edu.vn"  ✅                      │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 4. Invoice State                                           │
├────────────────────────────────────────────────────────────┤
│ const invoice: Invoice = {                                 │
│   contactEmail: "antdse173107@fpt.edu.vn"  ✅             │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 5. Menu Action - Chọn invoice                              │
├────────────────────────────────────────────────────────────┤
│ onOpenEmailModal={(inv) => {                               │
│   setSelectedInvoiceForEmail(inv)  // inv có contactEmail │
│   setSendEmailModalOpen(true)                             │
│ }}                                                         │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 6. SendInvoiceEmailModal Props                             │
├────────────────────────────────────────────────────────────┤
│ <SendInvoiceEmailModal                                     │
│   invoiceData={{                                           │
│     recipientEmail: invoice.contactEmail  ✅               │
│     // = "antdse173107@fpt.edu.vn"                        │
│   }}                                                       │
│ />                                                         │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 7. Modal useEffect - Auto-fill                             │
├────────────────────────────────────────────────────────────┤
│ useEffect(() => {                                          │
│   if (open && invoiceData) {                              │
│     setEmail(invoiceData.recipientEmail)  ✅               │
│     // Email field = "antdse173107@fpt.edu.vn"            │
│   }                                                        │
│ }, [open, invoiceData])                                   │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 8. TextField hiển thị                                      │
├────────────────────────────────────────────────────────────┤
│ <TextField                                                 │
│   label="Email người nhận"                                 │
│   value={email}  // ✅ "antdse173107@fpt.edu.vn"          │
│ />                                                         │
└────────────────────────────────────────────────────────────┘
```

---

## 🧪 Cách kiểm tra

### 1. Check Console Logs

Mở DevTools Console, reload trang Invoice Management:

```javascript
// Sẽ thấy log:
📧 [InvoiceManagement] Sample invoice with email: {
  invoiceID: 133,
  customerName: "Công Ty Dịch Vụ Giải Trí MTP",
  customerEmail: "antdse173107@fpt.edu.vn",  // ✅ Backend có trả về
  contactEmail: undefined,                    // Legacy field không có
  mappedContactEmail: "antdse173107@fpt.edu.vn"  // ✅ Mapping thành công
}
```

### 2. Test UI

1. Vào trang **Quản lý hóa đơn**
2. Click menu 3 chấm trên hóa đơn
3. Chọn **"Gửi email"**
4. Kiểm tra modal:
   - ✅ Email field tự động điền: `antdse173107@fpt.edu.vn`
   - ✅ Tên người nhận tự động điền: `Công Ty Dịch Vụ Giải Trí MTP`

---

## 📋 So sánh trước/sau

| Tiêu chí | Trước sửa ❌ | Sau sửa ✅ |
|----------|-------------|-----------|
| **Backend field** | `customerEmail` | `customerEmail` |
| **Interface có field?** | Không | **Có** (`customerEmail`) |
| **Mapping** | `item.contactEmail` (undefined) | `item.customerEmail \|\| item.contactEmail` |
| **contactEmail value** | `null` | `"antdse173107@fpt.edu.vn"` |
| **Email modal auto-fill** | Rỗng | **Có email** |
| **Debug logging** | Không | **Có** (console.log) |

---

## 🔑 Các điểm quan trọng

### 1. Field name khác nhau

**Backend:** `customerEmail`  
**Frontend (legacy):** `contactEmail`

→ Phải map từ `customerEmail` → `contactEmail` trong UI

### 2. Fallback logic

```typescript
contactEmail: item.customerEmail || item.contactEmail || null
```

**Lý do:**
- Ưu tiên `customerEmail` (field hiện tại từ backend)
- Fallback `contactEmail` (nếu backend update sau này)
- Default `null` (nếu không có gì)

### 3. Backward compatibility

Giữ cả 2 fields trong interface:
- `contactEmail` - Legacy, có thể backend dùng sau
- `customerEmail` - Field mới, đang dùng

→ Đảm bảo code không break nếu backend thay đổi

---

## 🚀 Kết quả

### ✅ Đã hoàn thành

1. **Interface updated** - Thêm `customerEmail` vào `InvoiceListItem`
2. **Mapping fixed** - Map `customerEmail` → `contactEmail` đúng
3. **Auto-fill hoạt động** - Email tự động điền vào modal
4. **Debug logging** - Console log giúp verify data
5. **Backward compatible** - Giữ fallback logic an toàn

### 📊 Test cases passed

- ✅ Backend trả về `customerEmail` → Interface nhận được
- ✅ Mapping `customerEmail` → `contactEmail` thành công
- ✅ Modal auto-fill email từ `contactEmail`
- ✅ Console log hiển thị đúng data flow
- ✅ Không có TypeScript errors

---

## 💡 Bài học

### 1. Luôn check API response thực tế

Đừng assume field name - Phải verify bằng curl hoặc Network tab!

### 2. Interface phải khớp với backend

Nếu backend trả về `customerEmail`, interface phải có field đó.

### 3. Mapping logic cẩn thận

```typescript
// ❌ Sai
contactEmail: item.contactEmail  // Backend không có field này

// ✅ Đúng
contactEmail: item.customerEmail || item.contactEmail || null
```

### 4. Debug logging giúp phát hiện lỗi nhanh

Console.log đơn giản nhưng cực kỳ hữu ích!

---

## 🔮 Cải tiến tương lai

### 1. Thống nhất field names

Đề xuất backend team:
- Đổi `customerEmail` → `contactEmail` (hoặc ngược lại)
- Thống nhất naming convention

### 2. Type-safe API response

```typescript
// Dùng Zod hoặc io-ts để validate runtime
const InvoiceSchema = z.object({
  customerEmail: z.string().email(),
  // ...
})
```

### 3. API documentation

Cập nhật docs rõ ràng về field names và types.

---

## 📞 Troubleshooting

### Nếu vẫn không có email sau khi sửa:

1. **Check console log** - Xem backend có trả về `customerEmail` không?
2. **Check Network tab** - Response từ `/api/Invoice` có field nào?
3. **Check mapping** - `mappedContactEmail` trong log có giá trị không?
4. **Check modal props** - `invoiceData.recipientEmail` có được pass đúng không?

### Debug checklist:

```typescript
// 1. Backend response
console.log('Backend:', response.data.items[0].customerEmail)

// 2. Interface mapping
console.log('Mapped:', mappedData[0].contactEmail)

// 3. Selected invoice
console.log('Selected:', selectedInvoiceForEmail?.contactEmail)

// 4. Modal props
console.log('Modal props:', invoiceData.recipientEmail)

// 5. Modal state
console.log('Email state:', email)
```

---

**Tác giả:** GitHub Copilot  
**Ngày sửa:** 11/01/2026  
**Version:** 1.1.0  
**Status:** ✅ Fixed & Verified
