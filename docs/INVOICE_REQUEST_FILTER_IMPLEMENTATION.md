# 📋 Tài liệu Tích hợp Bộ Lọc Yêu Cầu Xuất Hóa Đơn

## 1. Tổng Quan

Tài liệu này mô tả chi tiết việc tích hợp bộ lọc chuyên nghiệp vào trang **Quản lý Yêu cầu xuất HĐ** dựa trên phân tích và tối ưu từ bộ lọc trang **Quản lý Hóa đơn**.

---

## 2. Phân Tích InvoiceFilter (Bộ lọc Hóa đơn)

### 2.1. Cấu Trúc Component

**InvoiceFilter.tsx** (759 dòng) - Bộ lọc chuẩn cho quản lý hóa đơn:

```typescript
export interface InvoiceFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  invoiceStatus: string[]      // Hỗ trợ 'ALL'
  taxStatus: string
  customer: string | null       // Hỗ trợ 'ALL'
  invoiceType: string[]         // Hỗ trợ 'ALL'
}
```

### 2.2. Đặc Điểm UI/UX Nổi Bật

#### Màu Sắc & Thiết Kế
- **Primary Color**: `#1976d2` (Material Blue) - Nút filter, active states
- **Background Colors**: 
  - `#f8f9fa` - Filter container background
  - `#f0f2f5` - Hover states
  - `#fff` - Input fields
- **Border Colors**: `#e0e0e0` - Subtle borders
- **Typography**: 
  - Headers: `fontWeight: 600, fontSize: 0.95rem`
  - Labels: `color: #666`

#### Layout Pattern
```
┌────────────────────────────────────────────────────────┐
│ [🔍 Search Input] [🎯 Filter Button (badge)] [Action] │
└────────────────────────────────────────────────────────┘
          ┌──────────────────────────────────┐
          │  📅 Row 1: 2 DatePickers         │
          │  📊 Row 2: 3 Select/Autocomplete │
          │  👤 Row 3: 1 Customer Select     │
          │  [Reset] [Results: X/Y]          │
          └──────────────────────────────────┘
```

- **Progressive Disclosure**: Collapse/Expand với animation mượt
- **Responsive**: Flexbox với `wrap`, `minWidth: 200px` trên fields
- **Spacing**: Consistent `sx={{ mb: 2, gap: 2 }}`

#### Chức Năng Chính

1. **Auto-Apply Filters** ✨
   ```typescript
   useEffect(() => {
     if (isFirstMount.current) {
       isFirstMount.current = false
       return
     }
     if (onFilterChange) {
       onFilterChange(filters)
     }
   }, [filters.dateFrom, filters.dateTo, ...]) // Tất cả trừ searchText
   ```

2. **Debounced Search** ⏱️
   ```typescript
   // 500ms delay cho search text
   useEffect(() => {
     const handler = setTimeout(() => {
       if (!isFirstMount.current && onFilterChange) {
         onFilterChange(filters)
       }
     }, 500)
     return () => clearTimeout(handler)
   }, [filters.searchText])
   ```

3. **Badge Counter** 🔢
   ```typescript
   const getActiveFilterCount = useCallback(() => {
     let count = 0
     if (filters.searchText && filters.searchText.trim() !== '') count++
     if (filters.dateFrom) count++
     if (filters.dateTo) count++
     // ⚠️ Loại trừ 'ALL' values
     if (filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('ALL')) count++
     if (filters.customer && filters.customer !== 'ALL') count++
     if (filters.invoiceType.length > 0 && !filters.invoiceType.includes('ALL')) count++
     return count
   }, [filters])
   ```

4. **"Chọn tất cả" Logic** 📝
   ```typescript
   // Khi click "Tất cả"
   if (newValue.includes('ALL')) {
     setFilters(prev => ({ 
       ...prev, 
       invoiceStatus: ['ALL', ...allStatuses.map(s => s.value)] 
     }))
   }
   // Khi bỏ chọn "Tất cả"
   else if (prev.invoiceStatus.includes('ALL')) {
     setFilters(prev => ({ 
       ...prev, 
       invoiceStatus: newValue.filter(v => v !== 'ALL') 
     }))
   }
   // Auto thêm "Tất cả" khi chọn đủ tất cả items
   else if (newValue.length === allStatuses.length) {
     setFilters(prev => ({ 
       ...prev, 
       invoiceStatus: ['ALL', ...newValue] 
     }))
   }
   ```

5. **Real-time Results Display** 📊
   ```typescript
   // Props từ parent component
   totalResults={invoices.length}
   filteredResults={filteredInvoices.length}
   
   // Hiển thị trong filter
   <Typography variant="body2" sx={{ color: '#666', mr: 2 }}>
     Hiển thị <strong>{filteredResults}</strong> / {totalResults} kết quả
   </Typography>
   ```

### 2.3. Điểm Mạnh

✅ **Auto-apply** - Trải nghiệm người dùng mượt mà, không cần click "Áp dụng"  
✅ **Debounced Search** - Tối ưu performance, tránh filter quá nhiều lần  
✅ **Badge Counter** - Người dùng biết rõ có bao nhiêu filter đang active  
✅ **Smart "Chọn tất cả"** - Logic thông minh tự động thêm/xóa  
✅ **Real-time Feedback** - Hiển thị số lượng kết quả ngay lập tức  
✅ **Responsive Design** - Hoạt động tốt trên mọi kích thước màn hình  
✅ **Accessible** - Proper labels, ARIA attributes  

---

## 3. InvoiceRequestFilter - Component Mới

### 3.1. Đặc Điểm Riêng Biệt

**InvoiceRequestFilter.tsx** (691 dòng) - Bộ lọc tùy chỉnh cho yêu cầu xuất HĐ:

```typescript
export interface InvoiceRequestFilterState {
  searchText: string
  dateFrom: Dayjs | null          // Ngày tạo từ
  dateTo: Dayjs | null            // Ngày tạo đến
  requiredDateFrom: Dayjs | null  // ✨ MỚI - Hạn xuất HĐ từ
  requiredDateTo: Dayjs | null    // ✨ MỚI - Hạn xuất HĐ đến
  statusIDs: number[]             // ✨ THAY ĐỔI - number[] thay vì string[]
  requestTypes: number[]          // ✨ MỚI - Loại yêu cầu (thường/gấp)
  customer: string | null
  createdBy: string | null        // ✨ MỚI - Người tạo (chưa implement UI)
}
```

### 3.2. Nguồn Dữ Liệu

```typescript
// Từ invoiceRequest.types.ts
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from '@/types/invoiceRequest.types'

const allRequestStatuses = [
  { value: -1, label: '✓ Chọn tất cả' },  // Special value
  { value: 1, label: REQUEST_STATUS_LABELS[1] },  // Chờ duyệt
  { value: 2, label: REQUEST_STATUS_LABELS[2] },  // Đã duyệt
  { value: 3, label: REQUEST_STATUS_LABELS[3] },  // Từ chối
  { value: 4, label: REQUEST_STATUS_LABELS[4] },  // Đã tạo HĐ
  { value: 5, label: REQUEST_STATUS_LABELS[5] },  // Đã hủy
]

const allRequestTypes = [
  { value: -1, label: '✓ Chọn tất cả' },
  { value: 1, label: REQUEST_TYPE_LABELS[1] },  // Xuất HĐ thường
  { value: 2, label: REQUEST_TYPE_LABELS[2] },  // Xuất HĐ gấp
]
```

### 3.3. Layout Đặc Biệt

```
┌────────────────────────────────────────────────────────┐
│ [🔍 Search Input] [🎯 Filter Button (badge)]          │
└────────────────────────────────────────────────────────┘
          ┌──────────────────────────────────┐
          │  📅 Row 1: 4 DatePickers         │ ⭐ KHÁC BIỆT
          │    [Ngày tạo từ] [Ngày tạo đến]  │
          │    [Hạn xuất từ] [Hạn xuất đến]  │
          │                                  │
          │  📊 Row 2: Status + Request Type │
          │    [Trạng thái ▼] [Loại YC ▼]   │
          │                                  │
          │  👤 Row 3: Customer              │
          │    [Khách hàng (Autocomplete)]   │
          │                                  │
          │  [Reset] [Results: X/Y]          │
          └──────────────────────────────────┘
```

**So sánh với InvoiceFilter:**
- ✅ Nhiều hơn 2 DatePickers (4 vs 2) - Thêm "Hạn xuất HĐ"
- ✅ Ít hơn 1 row filters (2 rows vs 3 rows)
- ✅ Sử dụng `number[]` cho multi-selects thay vì `string[]`
- ✅ Dùng giá trị `-1` cho "Chọn tất cả" thay vì `'ALL'`

### 3.4. Điểm Đặc Biệt

#### A. Xử lý Number-based Multi-Select
```typescript
const handleChange = (field: keyof InvoiceRequestFilterState, value: any) => {
  setFilters((prev) => {
    // Xử lý Status IDs (number[])
    if (field === 'statusIDs') {
      const prevStatusIDs = prev.statusIDs
      const newValue = value as number[]
      
      // Click "Chọn tất cả" (-1)
      if (newValue.includes(-1) && !prevStatusIDs.includes(-1)) {
        return { 
          ...prev, 
          statusIDs: [-1, ...allRequestStatuses.slice(1).map((s) => s.value)] 
        }
      }
      // Bỏ chọn "Chọn tất cả"
      else if (prevStatusIDs.includes(-1) && !newValue.includes(-1)) {
        return { 
          ...prev, 
          statusIDs: newValue.filter((v) => v !== -1) 
        }
      }
      // Auto thêm khi chọn đủ
      else if (newValue.length === allRequestStatuses.length - 1 && !newValue.includes(-1)) {
        return { 
          ...prev, 
          statusIDs: [-1, ...newValue] 
        }
      }
      // Xóa "Chọn tất cả" nếu bỏ bất kỳ item nào
      else if (prevStatusIDs.includes(-1) && newValue.length < allRequestStatuses.length - 1) {
        return { 
          ...prev, 
          statusIDs: newValue.filter((v) => v !== -1) 
        }
      }
      
      return { ...prev, statusIDs: newValue }
    }
    
    // Logic tương tự cho requestTypes...
    return { ...prev, [field]: value }
  })
}
```

#### B. Date Range Labels Rõ Ràng
```jsx
<Grid item xs={12} sm={6} md={3}>
  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
    <DatePicker
      label="📅 Ngày tạo từ"
      value={filters.dateFrom}
      onChange={(date) => handleChange('dateFrom', date)}
      slotProps={{
        textField: {
          fullWidth: true,
          size: 'small',
          placeholder: 'Chọn ngày bắt đầu',
        },
      }}
    />
  </LocalizationProvider>
</Grid>

<Grid item xs={12} sm={6} md={3}>
  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
    <DatePicker
      label="⏰ Hạn xuất HĐ từ"
      value={filters.requiredDateFrom}
      onChange={(date) => handleChange('requiredDateFrom', date)}
      slotProps={{
        textField: {
          fullWidth: true,
          size: 'small',
          placeholder: 'Hạn xuất từ ngày',
        },
      }}
    />
  </LocalizationProvider>
</Grid>
```

---

## 4. Tích Hợp vào InvoiceRequestManagement

### 4.1. Cập Nhật Imports

```typescript
// BEFORE
import { useState, useEffect, useCallback } from 'react'

// AFTER
import { useState, useEffect, useCallback, useMemo } from 'react'
import InvoiceRequestFilter, {
  InvoiceRequestFilterState,
} from '@/components/InvoiceRequestFilter'
```

### 4.2. Thêm Filter State

```typescript
// Filter state
const [filters, setFilters] = useState<InvoiceRequestFilterState>({
  searchText: '',
  dateFrom: null,
  dateTo: null,
  requiredDateFrom: null,
  requiredDateTo: null,
  statusIDs: [],
  requestTypes: [],
  customer: null,
  createdBy: null,
})
```

### 4.3. Filter Handlers

```typescript
const handleFilterChange = useCallback((newFilters: InvoiceRequestFilterState) => {
  setFilters(newFilters)
}, [])

const handleResetFilter = useCallback(() => {
  setFilters({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    requiredDateFrom: null,
    requiredDateTo: null,
    statusIDs: [],
    requestTypes: [],
    customer: null,
    createdBy: null,
  })
}, [])
```

### 4.4. Filter Logic với useMemo

```typescript
const filteredRequests = useMemo(() => {
  return requests.filter((request) => {
    // 1️⃣ Search text
    const matchesSearch =
      !filters.searchText ||
      request.requestCode.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      request.customer.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      request.customer.taxCode?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      request.requestedBy.saleName.toLowerCase().includes(filters.searchText.toLowerCase())

    // 2️⃣ Date range (ngày tạo)
    const matchesDateFrom =
      !filters.dateFrom ||
      dayjs(request.requestDate).isAfter(filters.dateFrom, 'day') ||
      dayjs(request.requestDate).isSame(filters.dateFrom, 'day')
    const matchesDateTo =
      !filters.dateTo ||
      dayjs(request.requestDate).isBefore(filters.dateTo, 'day') ||
      dayjs(request.requestDate).isSame(filters.dateTo, 'day')

    // 3️⃣ Required date range (hạn xuất) ⭐ MỚI
    const matchesRequiredDateFrom =
      !filters.requiredDateFrom ||
      !request.requiredDate ||
      dayjs(request.requiredDate).isAfter(filters.requiredDateFrom, 'day') ||
      dayjs(request.requiredDate).isSame(filters.requiredDateFrom, 'day')
    const matchesRequiredDateTo =
      !filters.requiredDateTo ||
      !request.requiredDate ||
      dayjs(request.requiredDate).isBefore(filters.requiredDateTo, 'day') ||
      dayjs(request.requiredDate).isSame(filters.requiredDateTo, 'day')

    // 4️⃣ Status (xử lý -1 cho "Chọn tất cả") ⭐ KHÁC BIỆT
    const matchesStatus =
      filters.statusIDs.length === 0 ||
      filters.statusIDs.includes(-1) ||
      filters.statusIDs.includes(request.statusID)

    // 5️⃣ Request type ⭐ MỚI
    const matchesRequestType =
      filters.requestTypes.length === 0 ||
      filters.requestTypes.includes(-1) ||
      filters.requestTypes.includes(request.requestType)

    // 6️⃣ Customer
    const matchesCustomer =
      !filters.customer ||
      filters.customer === 'ALL' ||
      request.customer.customerName === filters.customer

    return (
      matchesSearch &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesRequiredDateFrom &&
      matchesRequiredDateTo &&
      matchesStatus &&
      matchesRequestType &&
      matchesCustomer
    )
  })
}, [requests, filters])
```

### 4.5. Cập Nhật UI

```tsx
{/* Header */}
<Box sx={{ mb: 4 }}>
  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
    📋 Quản lý Yêu cầu xuất HĐ
  </Typography>
  <Typography variant="body2" sx={{ color: '#666' }}>
    Quản lý và xử lý các yêu cầu xuất hóa đơn từ đội ngũ Sales
  </Typography>
  {filteredRequests.length > 0 && (
    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500, mt: 0.5 }}>
      📊 Hiển thị {filteredRequests.length} / {requests.length} yêu cầu
    </Typography>
  )}
</Box>

{/* Filter - MỚI */}
<InvoiceRequestFilter
  onFilterChange={handleFilterChange}
  onReset={handleResetFilter}
  totalResults={requests.length}
  filteredResults={filteredRequests.length}
/>

{/* DataGrid - Cập nhật sử dụng filteredRequests */}
<DataGrid
  rows={filteredRequests}  // ⭐ THAY ĐỔI từ requests
  columns={columns}
  getRowId={(row) => row.requestID}
  // ... other props
/>
```

---

## 5. So Sánh Chi Tiết

| Tiêu chí | InvoiceFilter | InvoiceRequestFilter |
|----------|---------------|---------------------|
| **Số lượng fields** | 7 | 9 |
| **DatePicker** | 2 (Ngày tạo) | 4 (Ngày tạo + Hạn xuất) |
| **Multi-select type** | `string[]` | `number[]` |
| **"Chọn tất cả" value** | `'ALL'` | `-1` |
| **Layout rows** | 3 | 2 |
| **Specific fields** | `taxStatus`, `invoiceType` | `requiredDate`, `requestType` |
| **Auto-apply** | ✅ Yes | ✅ Yes |
| **Debounced search** | ✅ 500ms | ✅ 500ms |
| **Badge counter** | ✅ Yes | ✅ Yes |
| **Real-time results** | ✅ Yes | ✅ Yes |

---

## 6. Kinh Nghiệm & Best Practices

### 6.1. Performance

✅ **useMemo cho filteredData** - Tránh re-filter không cần thiết
```typescript
const filteredRequests = useMemo(() => {
  return requests.filter(/* logic */)
}, [requests, filters])
```

✅ **useCallback cho handlers** - Tránh re-create functions
```typescript
const handleFilterChange = useCallback((newFilters) => {
  setFilters(newFilters)
}, [])
```

✅ **Debounced search** - Giảm số lần filter khi typing
```typescript
useEffect(() => {
  const handler = setTimeout(() => {
    // Apply filter after 500ms
  }, 500)
  return () => clearTimeout(handler)
}, [filters.searchText])
```

### 6.2. UX Enhancement

✅ **Progressive Disclosure** - Collapse/Expand để không chiếm không gian  
✅ **Badge Counter** - Người dùng biết có bao nhiêu filter active  
✅ **Smart "Chọn tất cả"** - Tự động thêm/xóa khi select/deselect all  
✅ **Real-time Feedback** - Hiển thị kết quả ngay lập tức  
✅ **Clear Visual Hierarchy** - Spacing, colors, typography nhất quán  

### 6.3. Code Quality

✅ **TypeScript Strict Mode** - Type-safe với proper interfaces  
✅ **Consistent Naming** - `handleFilterChange`, `handleResetFilter`  
✅ **Clear Comments** - Document complex logic như "Chọn tất cả"  
✅ **Reusable Components** - Có thể tái sử dụng cho các trang khác  

---

## 7. Checklist Hoàn Thành

### ✅ Component Creation
- [x] InvoiceRequestFilter.tsx component (691 lines)
- [x] InvoiceRequestFilterState interface
- [x] Filter logic với "Chọn tất cả" (-1 value)
- [x] 4 DatePickers layout
- [x] Status & Request Type multi-selects
- [x] Customer Autocomplete
- [x] Badge counter & results display

### ✅ Integration
- [x] Import InvoiceRequestFilter vào InvoiceRequestManagement
- [x] Add filter state với InvoiceRequestFilterState
- [x] Implement handleFilterChange
- [x] Implement handleResetFilter
- [x] Create filteredRequests với useMemo
- [x] Update DataGrid để dùng filteredRequests
- [x] Add results display trong header

### ✅ Testing
- [x] No TypeScript errors
- [x] All imports resolved
- [x] Filter logic handles all edge cases
- [x] Badge counter excludes -1 values correctly

---

## 8. Kết Luận

### Điểm Mạnh Của Solution

1. **Professional UX** 🎨
   - Auto-apply, debounce, real-time feedback
   - Smart "Chọn tất cả" logic
   - Clear visual hierarchy

2. **Performance Optimized** ⚡
   - useMemo để tránh re-filter không cần thiết
   - useCallback để tránh re-create functions
   - Debounced search giảm số lần filter

3. **Type-Safe** 🛡️
   - Full TypeScript support
   - Proper interfaces cho filter state
   - Type-safe handlers

4. **Maintainable** 🔧
   - Clean code structure
   - Reusable component pattern
   - Clear documentation

5. **Scalable** 📈
   - Dễ dàng thêm fields mới
   - Có thể tái sử dụng pattern cho trang khác
   - Consistent với InvoiceFilter pattern

### Next Steps (Tùy chọn)

- [ ] Thêm `createdBy` field UI nếu cần
- [ ] Thêm sort options nếu cần
- [ ] Thêm export filtered data nếu cần
- [ ] Thêm saved filters functionality
- [ ] Thêm filter presets (Hôm nay, Tuần này, Tháng này...)

---

**Tác giả**: GitHub Copilot  
**Ngày tạo**: 2024  
**Phiên bản**: 1.0
