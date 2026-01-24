# Tối Ưu Dropdown Loại Hóa Đơn (invoiceCustomerType) - CreateSalesOrder

## 📋 Tổng Quan

**Mục tiêu:** Thêm dropdown chọn loại hóa đơn (Bán lẻ/Doanh nghiệp) vào form "Tạo yêu cầu xuất hóa đơn GTGT" (CreateSalesOrder).

**Lý do:** 
- Backend API yêu cầu field `invoiceCustomerType` (1 = Bán lẻ/B2C, 2 = Doanh nghiệp/B2B)
- CreateVatInvoice đã có implementation hoàn chỉnh
- CreateSalesOrder thiếu field này hoàn toàn → cần đồng bộ

---

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. **Thêm State Variable** 
**File:** `src/page/CreateSalesOrder.tsx`  
**Line:** ~1151

```typescript
const [invoiceCustomerType, setInvoiceCustomerType] = useState<1 | 2>(2) 
// ✅ Loại hóa đơn: 1=Retail/Bán lẻ, 2=Business/Doanh nghiệp
```

**Quyết định:** Default = 2 (Doanh nghiệp) vì form có các field doanh nghiệp (MST, Tên đơn vị, etc.)

---

### 2. **Thêm Import Icons**
**File:** `src/page/CreateSalesOrder.tsx`  
**Lines:** ~14-47

**Thêm vào MUI imports:**
```typescript
import { ..., Tooltip } from '@mui/material'
import { ..., Info } from '@mui/icons-material'
```

---

### 3. **Thêm Dropdown UI**
**File:** `src/page/CreateSalesOrder.tsx`  
**Location:** Ngay sau `<Divider sx={{ my: 2 }} />` (line ~2116), trước section "Thông tin người mua"

**UI Components:**
- ✅ Select với 2 MenuItem (Doanh nghiệp=2, Bán lẻ=1)
- ✅ Icon: 🏢 cho Doanh nghiệp, 👤 cho Bán lẻ
- ✅ Description cho mỗi option
- ✅ Tooltip với Info icon để giải thích

**Code Pattern:** Copy từ CreateVatInvoice (lines 2843-2926) và adapt cho CreateSalesOrder

```tsx
<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem', color: '#666' }}>
    Loại hóa đơn:
  </Typography>
  <Select
    size="small"
    value={invoiceCustomerType}
    onChange={(e) => setInvoiceCustomerType(e.target.value as 1 | 2)}
    variant="outlined"
    sx={{...}}
  >
    <MenuItem value={2}>🏢 Hóa đơn Doanh nghiệp (B2B)</MenuItem>
    <MenuItem value={1}>👤 Hóa đơn Bán lẻ (B2C)</MenuItem>
  </Select>
  <Tooltip title="💡 Chọn loại hóa đơn..." arrow placement="right">
    <Info sx={{ fontSize: 18, color: '#1976d2', cursor: 'help' }} />
  </Tooltip>
</Stack>
```

---

### 4. **Thêm Field vào Payload**
**File:** `src/page/CreateSalesOrder.tsx`  
**Line:** ~1740

**Thêm vào `BackendInvoiceRequestPayload`:**
```typescript
const requestPayload: BackendInvoiceRequestPayload = {
  // ...existing 16 fields
  invoiceCustomerType: invoiceCustomerType, // ✅ NEW FIELD
}
```

**Update comment:** "17 fields" (was "16 fields")

---

### 5. **Update TypeScript Interface**
**File:** `src/services/invoiceService.ts`  
**Line:** ~39

**Thêm vào `BackendInvoiceRequestPayload` interface:**
```typescript
export interface BackendInvoiceRequestPayload {
  // ...existing fields
  invoiceCustomerType: number; // ✅ REQUIRED: 1=Retail/Bán lẻ (B2C), 2=Business/Doanh nghiệp (B2B)
}
```

---

## 🔍 Mapping Logic

| UI Dropdown Value | State Value | API Value | Meaning |
|------------------|-------------|-----------|---------|
| "Hóa đơn Doanh nghiệp" | `2` | `2` | Business/B2B |
| "Hóa đơn Bán lẻ" | `1` | `1` | Retail/B2C |

**Default:** `2` (Doanh nghiệp) - vì form có MST và Tên đơn vị

---

## 📊 So Sánh với CreateVatInvoice

| Feature | CreateVatInvoice | CreateSalesOrder (Trước) | CreateSalesOrder (Sau) |
|---------|------------------|-------------------------|------------------------|
| State | `invoiceType: 'B2B' \| 'B2C'` | ❌ Không có | ✅ `invoiceCustomerType: 1 \| 2` |
| Dropdown UI | ✅ Có (lines 2843-2926) | ❌ Không có | ✅ Có (adapted) |
| Handler | `handleInvoiceTypeChange()` | ❌ Không có | ✅ Inline onChange |
| Payload Field | ✅ Có via adapter | ❌ Không có | ✅ Có trực tiếp |
| Mapping | Via `invoiceAdapter.ts` | - | Trực tiếp từ state |

**Sự Khác Biệt:**
- CreateVatInvoice: Sử dụng `'B2B' | 'B2C'` → map qua `invoiceAdapter` → `1 | 2`
- CreateSalesOrder: Sử dụng `1 | 2` trực tiếp (đơn giản hơn)

---

## ✅ Validation

### TypeScript Compilation
```bash
✅ No errors in CreateSalesOrder.tsx
✅ No errors in invoiceService.ts
```

### Code Quality Checks
- ✅ State type safety: `useState<1 | 2>(2)`
- ✅ Type assertion trong onChange: `e.target.value as 1 | 2`
- ✅ Interface updated: `invoiceCustomerType: number`
- ✅ Payload includes field: `invoiceCustomerType: invoiceCustomerType`
- ✅ Comment updated: "17 fields" (was "16 fields")

---

## 🎯 Testing Checklist

### UI Testing
- [ ] Dropdown hiển thị đúng với 2 options
- [ ] Icon 🏢 và 👤 hiển thị đúng
- [ ] Description text hiển thị đúng cho mỗi option
- [ ] Tooltip hoạt động khi hover vào Info icon
- [ ] Default value = "Hóa đơn Doanh nghiệp" (value=2)

### Functionality Testing
- [ ] Chọn "Hóa đơn Doanh nghiệp" → state = 2
- [ ] Chọn "Hóa đơn Bán lẻ" → state = 1
- [ ] State change trigger re-render

### API Integration Testing
- [ ] Submit form → console log payload
- [ ] Verify `invoiceCustomerType: 2` trong payload (default)
- [ ] Change dropdown → verify state change
- [ ] Submit again → verify `invoiceCustomerType: 1` trong payload
- [ ] Backend accepts payload without validation errors

### Browser Console Checks
```javascript
// Expected log khi submit:
📤 Sending InvoiceRequest payload: {
  // ...existing fields
  invoiceCustomerType: 2, // or 1
}
```

---

## 📁 Files Modified

1. **src/page/CreateSalesOrder.tsx**
   - Thêm imports: `Tooltip`, `Info`
   - Thêm state: `invoiceCustomerType`
   - Thêm dropdown UI (83 lines)
   - Thêm field vào payload: `invoiceCustomerType`

2. **src/services/invoiceService.ts**
   - Thêm field vào `BackendInvoiceRequestPayload` interface: `invoiceCustomerType: number`

---

## 🔗 References

- **API Requirement:** User's curl example showing `"invoiceCustomerType": 1`
- **Reference Implementation:** `src/page/CreateVatInvoice.tsx` (lines 2843-2926, 2259)
- **Mapping Logic:** `src/utils/invoiceAdapter.ts` (lines 352-382)
- **Backend Enum:** 
  - `1` = Customer/Retail/Bán lẻ (B2C)
  - `2` = Business/Enterprise/Doanh nghiệp (B2B)

---

## 💡 Design Decisions

### 1. **State Type: Direct `1 | 2` vs. String `'B2B' | 'B2C'`**
**Decision:** Sử dụng `1 | 2` trực tiếp  
**Rationale:**
- Đơn giản hơn (không cần mapping function)
- Type-safe với TypeScript union type
- Trực tiếp match với API requirement

### 2. **Default Value: `2` (Doanh nghiệp)**
**Decision:** Default = `2` (Business)  
**Rationale:**
- Form có MST và Tên đơn vị (typical B2B fields)
- Consistent với CreateVatInvoice default (`'B2B'`)
- Hầu hết sales orders là B2B

### 3. **UI Placement: Before "Thông tin người mua"**
**Decision:** Place dropdown after Divider, before customer info  
**Rationale:**
- Logical flow: Chọn loại hóa đơn trước → điền thông tin khách hàng
- Visual hierarchy: Important decision at top
- Consistent với CreateVatInvoice layout

### 4. **No Conditional Validation (Yet)**
**Decision:** Không thêm conditional validation based on invoiceCustomerType  
**Rationale:**
- Keep changes minimal for this implementation
- Both B2B and B2C require same fields in CreateSalesOrder
- Can add later if needed (e.g., different MST vs CCCD validation)

---

## 🚀 Next Steps (Optional Enhancements)

### 1. **Conditional Field Labels**
```typescript
// Example: Change "MST người mua" label based on invoiceCustomerType
{invoiceCustomerType === 2 ? 'MST người mua:' : 'CCCD:'}
```

### 2. **Conditional Validation**
```typescript
// Example: Different MST format for B2B vs B2C
const isValidTaxCode = invoiceCustomerType === 2 
  ? /^\d{10}$|^\d{13}$/.test(buyerTaxCode)  // MST: 10 or 13 digits
  : /^\d{12}$/.test(buyerTaxCode)            // CCCD: 12 digits
```

### 3. **Auto-switch Based on Tax Code Format**
```typescript
// Example: Auto-detect customer type from tax code length
const handleTaxCodeChange = (value: string) => {
  setBuyerTaxCode(value)
  if (/^\d{10}$|^\d{13}$/.test(value)) {
    setInvoiceCustomerType(2) // B2B
  } else if (/^\d{12}$/.test(value)) {
    setInvoiceCustomerType(1) // B2C
  }
}
```

### 4. **Clear Fields When Switching Type**
```typescript
// Example: Clear buyer info when changing invoice type
const handleInvoiceTypeChange = (newType: 1 | 2) => {
  setInvoiceCustomerType(newType)
  // Clear fields
  setBuyerTaxCode('')
  setBuyerCompanyName('')
  // ... etc
}
```

---

## 📝 Summary

**Thay đổi thành công:**
- ✅ Thêm state variable `invoiceCustomerType` với default value = 2
- ✅ Thêm dropdown UI với 2 options (Doanh nghiệp/Bán lẻ)
- ✅ Thêm icons, descriptions, và tooltip
- ✅ Thêm field vào API payload
- ✅ Update TypeScript interface
- ✅ No compilation errors

**Kết quả:**
- Form giờ đây có dropdown chọn loại hóa đơn
- User có thể chọn giữa "Doanh nghiệp" (B2B) và "Bán lẻ" (B2C)
- API payload bao gồm field `invoiceCustomerType` với giá trị 1 hoặc 2
- UI/UX đồng nhất với CreateVatInvoice

**Testing:** Cần test trên browser để verify:
1. Dropdown hiển thị đúng
2. State update khi chọn
3. Payload gửi lên API chính xác

---

## 📌 Tags
`#invoice-request` `#dropdown` `#invoiceCustomerType` `#B2B` `#B2C` `#CreateSalesOrder` `#optimization` `#API-integration`
