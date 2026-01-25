# Tối Ưu Bộ Lọc Trang Duyệt Hóa Đơn (HOD Invoice Management)

## 📋 Tổng Quan

**Trang:** [HODInvoiceManagement.tsx](../src/components/dashboard/HODInvoiceManagement.tsx)  
**Component Bộ lọc:** [InvoiceFilter.tsx](../src/components/InvoiceFilter.tsx)  
**Route:** `/approval/invoices`

---

## 🔍 Vấn Đề Đã Phát Hiện

### ❌ Lỗi Nghiêm Trọng: Mapping Không Đúng Giữa Filter và Backend

**Component InvoiceFilter.tsx (TRƯỚC KHI FIX):**
```typescript
const allInvoiceStatus = [
  'Nháp',           // ❌ String
  'Đã ký',          // ❌ String  
  'Đã phát hành',   // ❌ String
  'Đã gửi',         // ❌ String
  'Bị từ chối',     // ❌ String
  'Đã thanh toán',  // ❌ String - KHÔNG TỒN TẠI TRONG BACKEND
  'Đã hủy',         // ❌ String
]
```

**HODInvoiceManagement.tsx - Logic lọc:**
```typescript
// Lọc theo invoice status - BỊ LỖI vì không match
if (filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('ALL')) {
  result = result.filter((inv) => 
    filters.invoiceStatus.includes(String(inv.internalStatusId)) // ⚠️ So sánh STRING vs NUMBER
  )
}
```

**Backend API - Trạng thái thực tế:**
```
GET /api/Invoice/hodInvoices
Response: [
  {
    invoiceStatusID: 1,  // ✅ NUMBER - Nháp
    invoiceStatusID: 2,  // ✅ NUMBER - Đã phát hành
    invoiceStatusID: 6,  // ✅ NUMBER - Chờ duyệt
    invoiceStatusID: 7,  // ✅ NUMBER - Chờ ký
    ...
  }
]
```

**Hậu quả:**
1. ❌ Bộ lọc "Trạng thái Hóa đơn" **HOÀN TOÀN KHÔNG HOẠT ĐỘNG**
2. ❌ Filter array chứa `['Nháp', 'Đã ký']` nhưng backend trả về `{invoiceStatusID: 1, 2}`
3. ❌ Điều kiện `filters.invoiceStatus.includes(String(1))` luôn trả về `false`
4. ❌ Dù user chọn filter, kết quả vẫn hiển thị TẤT CẢ hóa đơn

---

## ✅ Giải Pháp Đã Áp Dụng

### 1. Cập Nhật Import Constants

```typescript
// src/components/InvoiceFilter.tsx
import { 
  INVOICE_INTERNAL_STATUS, 
  INVOICE_INTERNAL_STATUS_LABELS 
} from '@/constants/invoiceStatus'
```

### 2. Thay Đổi allInvoiceStatus từ String Array → Object Array

**TRƯỚC:**
```typescript
const allInvoiceStatus = ['Nháp', 'Đã ký', 'Đã phát hành', ...]
```

**SAU:**
```typescript
const allInvoiceStatus = [
  { id: INVOICE_INTERNAL_STATUS.DRAFT, label: 'Nháp' },                    // 1
  { id: INVOICE_INTERNAL_STATUS.PENDING_APPROVAL, label: 'Chờ duyệt' },   // 6
  { id: INVOICE_INTERNAL_STATUS.PENDING_SIGN, label: 'Chờ ký' },          // 7
  { id: INVOICE_INTERNAL_STATUS.SIGNED, label: 'Đã ký' },                 // 8
  { id: INVOICE_INTERNAL_STATUS.SENT, label: 'Đã gửi CQT' },             // 9
  { id: INVOICE_INTERNAL_STATUS.ISSUED, label: 'Đã phát hành' },          // 2
  { id: INVOICE_INTERNAL_STATUS.REJECTED, label: 'Bị từ chối' },          // 16
  { id: INVOICE_INTERNAL_STATUS.CANCELLED, label: 'Đã hủy' },             // 3
]
```

### 3. Cập Nhật Logic "Chọn Tất Cả"

```typescript
// Xử lý logic "Chọn tất cả" cho Trạng thái hóa đơn
if (field === 'invoiceStatus' && Array.isArray(value)) {
  const hasSelectAll = value.includes('ALL')
  const prevHasSelectAll = filters.invoiceStatus.includes('ALL')
  
  if (hasSelectAll && !prevHasSelectAll) {
    // ✅ Chọn tất cả -> Lấy TẤT CẢ ID
    processedValue = ['ALL', ...allInvoiceStatus.map(s => String(s.id))]
  } else if (!hasSelectAll && prevHasSelectAll) {
    processedValue = []
  } else if (hasSelectAll && value.length < allInvoiceStatus.length + 1) {
    // Bỏ chọn một item -> tự động bỏ "Tất cả"
    processedValue = value.filter((v) => v !== 'ALL')
  } else if (!hasSelectAll && value.length === allInvoiceStatus.length) {
    // Chọn đủ tất cả items -> tự động thêm "Tất cả"
    processedValue = ['ALL', ...value]
  }
}
```

### 4. Cập Nhật MenuItem Rendering

```typescript
{allInvoiceStatus.map((status) => (
  <MenuItem key={status.id} value={String(status.id)}>
    <Checkbox
      checked={filters.invoiceStatus.indexOf(String(status.id)) > -1}
      size="small"
    />
    <ListItemText primary={status.label} />
  </MenuItem>
))}
```

### 5. Cập Nhật renderValue Display

```typescript
renderValue={(selected) => {
  const filteredSelected = selected.filter((s) => s !== 'ALL')
  if (selected.includes('ALL') || filteredSelected.length === allInvoiceStatus.length) {
    return 'Tất cả trạng thái'
  }
  if (filteredSelected.length === 0) return ''
  return filteredSelected.length > 2
    ? `${filteredSelected.length} trạng thái`
    : filteredSelected.map(id => {
        // ✅ Map từ ID → Label để hiển thị
        const status = allInvoiceStatus.find(s => String(s.id) === String(id))
        return status?.label || id
      }).join(', ')
}}
```

---

## 🔄 Luồng Hoạt Động (Sau Khi Fix)

### Flow Diagram

```
User chọn filter "Chờ duyệt" (ID: 6)
    ↓
InvoiceFilter component
  → filters.invoiceStatus = ['6']  // ✅ Lưu ID dạng string
    ↓
HODInvoiceManagement - filteredInvoices
  → Điều kiện: filters.invoiceStatus.includes(String(inv.internalStatusId))
  → So sánh: '6' === String(6)  // ✅ TRUE
    ↓
Kết quả: Chỉ hiển thị hóa đơn có invoiceStatusID = 6 (Chờ duyệt)
```

---

## 📊 Mapping Table - Trạng Thái Hóa Đơn

| ID | Constant | Label Tiếng Việt | Mô Tả | Hiển thị trong Filter |
|----|----------|------------------|-------|----------------------|
| 1 | DRAFT | Nháp | Mới tạo, chưa gửi duyệt | ✅ |
| 2 | ISSUED | Đã phát hành | Hoàn tất | ✅ |
| 3 | CANCELLED | Đã hủy | Đã hủy bỏ | ✅ |
| 6 | PENDING_APPROVAL | Chờ duyệt | Đã gửi cho KTT | ✅ |
| 7 | PENDING_SIGN | Chờ ký | KTT đã duyệt, chờ ký số | ✅ |
| 8 | SIGNED | Đã ký | Đã ký số thành công | ✅ |
| 9 | SENT | Đã gửi CQT | Đã gửi CQT | ✅ |
| 16 | REJECTED | Bị từ chối | KTT từ chối | ✅ |
| 4 | ADJUSTED | Đã điều chỉnh | - | ❌ (Ít dùng) |
| 5 | REPLACED | Đã thay thế | - | ❌ (Ít dùng) |
| 10 | ADJUSTMENT_IN_PROCESS | Đang điều chỉnh | - | ❌ (Trạng thái tạm) |
| 11 | REPLACEMENT_IN_PROCESS | Đang thay thế | - | ❌ (Trạng thái tạm) |

---

## 🎯 Testing Checklist

### ✅ Scenario 1: Chọn một trạng thái

**Bước test:**
1. Mở bộ lọc (click nút "Lọc")
2. Click dropdown "Trạng thái Hóa đơn"
3. Chọn "Chờ duyệt" (ID: 6)

**Kết quả mong đợi:**
- Dropdown hiển thị: "Chờ duyệt"
- `filters.invoiceStatus = ['6']`
- DataGrid chỉ hiển thị hóa đơn có `invoiceStatusID = 6`
- Console log:
  ```
  📊 [HODInvoiceManagement] Filter result: {
    totalInvoices: 50,
    filteredInvoices: 12,  // Chỉ 12 hóa đơn Chờ duyệt
    activeFilters: 1
  }
  ```

---

### ✅ Scenario 2: Chọn nhiều trạng thái

**Bước test:**
1. Chọn "Chờ duyệt" (6) + "Chờ ký" (7) + "Đã ký" (8)

**Kết quả mong đợi:**
- Dropdown hiển thị: "3 trạng thái"
- `filters.invoiceStatus = ['6', '7', '8']`
- DataGrid hiển thị hóa đơn có `invoiceStatusID` trong [6, 7, 8]
- Badge trên nút "Lọc" hiển thị số 1 (1 bộ lọc active)

---

### ✅ Scenario 3: Chọn tất cả

**Bước test:**
1. Click checkbox "Chọn tất cả" trong dropdown

**Kết quả mong đợi:**
- Tất cả 8 trạng thái được tick
- Dropdown hiển thị: "Tất cả trạng thái"
- `filters.invoiceStatus = ['ALL', '1', '6', '7', '8', '9', '2', '16', '3']`
- DataGrid hiển thị TẤT CẢ hóa đơn (không lọc theo status)

---

### ✅ Scenario 4: Bỏ chọn một trạng thái khi đã chọn tất cả

**Bước test:**
1. Chọn "Chọn tất cả"
2. Bỏ chọn "Đã hủy" (3)

**Kết quả mong đợi:**
- Checkbox "Chọn tất cả" tự động bỏ tick
- Dropdown hiển thị: "7 trạng thái"
- `filters.invoiceStatus = ['1', '6', '7', '8', '9', '2', '16']` (không có '3' và 'ALL')
- DataGrid hiển thị hóa đơn NGOẠI TRỪ Đã hủy

---

### ✅ Scenario 5: Chọn đủ tất cả items thủ công

**Bước test:**
1. Chọn lần lượt 8 trạng thái (không dùng "Chọn tất cả")

**Kết quả mong đợi:**
- Sau khi chọn item thứ 8, checkbox "Chọn tất cả" tự động tick
- Dropdown hiển thị: "Tất cả trạng thái"
- `filters.invoiceStatus = ['ALL', '1', '6', '7', '8', '9', '2', '16', '3']`

---

### ✅ Scenario 6: Kết hợp nhiều bộ lọc

**Bước test:**
1. Search text: "CONG"
2. Từ ngày: 01/01/2026
3. Trạng thái: "Chờ duyệt" + "Đã ký"
4. Khách hàng: "CÔNG TY ABC"
5. Loại HĐ: "Hóa đơn gốc"

**Kết quả mong đợi:**
- Badge hiển thị: "5 bộ lọc"
- DataGrid hiển thị hóa đơn thỏa mãn TẤT CẢ 5 điều kiện (AND logic)
- Console log:
  ```
  📊 [HODInvoiceManagement] Filter result: {
    totalInvoices: 50,
    filteredInvoices: 3,  // Chỉ 3 hóa đơn thỏa mãn
    activeFilters: 5
  }
  ```

---

### ✅ Scenario 7: Xóa bộ lọc

**Bước test:**
1. Chọn nhiều bộ lọc
2. Click nút "Xóa bộ lọc"

**Kết quả mong đợi:**
- Tất cả filter reset về giá trị mặc định
- Badge biến mất
- DataGrid hiển thị TẤT CẢ hóa đơn
- `filters = { searchText: '', dateFrom: null, ..., invoiceStatus: [] }`

---

## 🔧 Các Cải Tiến Khác

### 1. Auto-Apply Filters (Debounced)

```typescript
// Search text: debounce 500ms
useEffect(() => {
  const timer = setTimeout(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, 500)
  return () => clearTimeout(timer)
}, [filters.searchText])

// Các field khác: auto-apply ngay lập tức
useEffect(() => {
  if (onFilterChange) {
    onFilterChange(filters)
  }
}, [
  filters.dateFrom,
  filters.dateTo,
  filters.invoiceStatus,  // ✅ Đã fix
  filters.taxStatus,
  filters.customer,
  filters.invoiceType,
])
```

**Lợi ích:**
- User không cần nhấn nút "Áp dụng"
- Search có debounce để tránh gọi API quá nhiều
- Các dropdown apply ngay khi chọn

---

### 2. Active Filter Count Badge

```typescript
const getActiveFilterCount = useCallback(() => {
  let count = 0
  
  if (filters.searchText && filters.searchText.trim() !== '') count++
  if (filters.dateFrom) count++
  if (filters.dateTo) count++
  
  // ✅ Chỉ đếm nếu không phải 'ALL' và có lựa chọn
  if (filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('ALL')) {
    count++
  }
  
  if (filters.taxStatus && filters.taxStatus !== '') count++
  if (filters.customer && filters.customer !== 'ALL') count++
  
  if (filters.invoiceType.length > 0 && !filters.invoiceType.includes('ALL')) {
    count++
  }
  
  return count
}, [filters])
```

**Lợi ích:**
- User biết rõ có bao nhiêu bộ lọc đang active
- Badge màu primary nổi bật

---

### 3. Filter Results Display

```typescript
<Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
  Hiển thị <strong style={{ color: '#1976d2' }}>{filteredResults}</strong> / {totalResults} kết quả
</Typography>
```

**Lợi ích:**
- User biết ngay kết quả filter
- Dễ phát hiện khi filter quá hẹp (0 kết quả)

---

## 📝 Code Changes Summary

### Files Modified

1. **src/components/InvoiceFilter.tsx**
   - Import `INVOICE_INTERNAL_STATUS` và `INVOICE_INTERNAL_STATUS_LABELS`
   - Thay đổi `allInvoiceStatus` từ string array → object array với `{ id, label }`
   - Cập nhật logic "Chọn tất cả" để dùng ID
   - Cập nhật MenuItem rendering để map đúng ID
   - Cập nhật renderValue để hiển thị label từ ID

2. **src/components/dashboard/HODInvoiceManagement.tsx**
   - Không cần thay đổi (logic lọc đã đúng, chỉ thiếu data mapping)

### Lines Changed

```diff
// InvoiceFilter.tsx
+ import { INVOICE_INTERNAL_STATUS, INVOICE_INTERNAL_STATUS_LABELS } from '@/constants/invoiceStatus'

- const allInvoiceStatus = ['Nháp', 'Đã ký', ...]
+ const allInvoiceStatus = [
+   { id: INVOICE_INTERNAL_STATUS.DRAFT, label: 'Nháp' },
+   { id: INVOICE_INTERNAL_STATUS.PENDING_APPROVAL, label: 'Chờ duyệt' },
+   ...
+ ]

- processedValue = ['ALL', ...allInvoiceStatus]
+ processedValue = ['ALL', ...allInvoiceStatus.map(s => String(s.id))]

- <MenuItem key={status} value={status}>
+ <MenuItem key={status.id} value={String(status.id)}>
-   <ListItemText primary={status} />
+   <ListItemText primary={status.label} />

- return filteredSelected.join(', ')
+ return filteredSelected.map(id => {
+   const status = allInvoiceStatus.find(s => String(s.id) === String(id))
+   return status?.label || id
+ }).join(', ')
```

---

## 🚀 Lợi Ích Sau Khi Tối Ưu

### 1. Bộ Lọc Hoạt Động Chính Xác

✅ **TRƯỚC:** Filter không hoạt động, hiển thị toàn bộ dù có chọn
✅ **SAU:** Filter hoạt động 100%, chỉ hiển thị đúng trạng thái đã chọn

### 2. Đồng Bộ Với Backend

✅ **TRƯỚC:** Frontend dùng string, Backend dùng number → Mismatch
✅ **SAU:** Frontend và Backend cùng dùng status ID (number) → Đồng bộ hoàn toàn

### 3. Dễ Bảo Trì

✅ **TRƯỚC:** Hardcode string 'Nháp', 'Đã ký' → Khó đồng bộ khi backend thay đổi
✅ **SAU:** Import từ constants → Single source of truth

### 4. Extensible

✅ Thêm trạng thái mới? Chỉ cần thêm vào `INVOICE_INTERNAL_STATUS` constants
✅ Thay đổi label? Chỉ cần sửa `INVOICE_INTERNAL_STATUS_LABELS`
✅ Filter component tự động cập nhật

### 5. Type-Safe

✅ TypeScript kiểm tra đúng type
✅ Compile-time validation thay vì runtime errors

---

## 🔗 Related Files

- [InvoiceFilter.tsx](../src/components/InvoiceFilter.tsx) - Component bộ lọc
- [HODInvoiceManagement.tsx](../src/components/dashboard/HODInvoiceManagement.tsx) - Trang duyệt hóa đơn
- [invoiceStatus.ts](../src/constants/invoiceStatus.ts) - Constants định nghĩa trạng thái
- [invoiceService.ts](../src/services/invoiceService.ts) - API service

---

## 📌 Notes

1. **⚠️ Breaking Change:** Nếu có trang khác đang dùng `InvoiceFilter` với logic cũ (string-based), cần cập nhật tương tự

2. **✅ Backward Compatible:** Logic lọc trong HODInvoiceManagement đã dùng `String(inv.internalStatusId)` nên vẫn hoạt động

3. **🔍 Future Improvement:** 
   - Có thể thêm filter "Trạng thái CQT" (Tax Authority Status) riêng
   - Thêm preset filters (ví dụ: "Chờ tôi duyệt", "Đã từ chối hôm nay")

---

**Ngày cập nhật:** 2026-01-25  
**Version:** 2.0.0  
**Tác giả:** Development Team
