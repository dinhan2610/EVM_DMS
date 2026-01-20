# 📊 Tài liệu Tích hợp Bộ Lọc Quản Lý Công Nợ (Statement Management)

## 1. Phân Tích Chi Tiết InvoiceFilter

### 1.1. Cấu Trúc Tổng Quan

**InvoiceFilter.tsx** (759 dòng) là bộ lọc chuẩn mẫu với kiến trúc chuyên nghiệp:

```typescript
export interface InvoiceFilterState {
  searchText: string          // Tìm kiếm toàn văn
  dateFrom: Dayjs | null      // Ngày tạo từ
  dateTo: Dayjs | null        // Ngày tạo đến
  invoiceStatus: string[]     // Multi-select trạng thái
  taxStatus: string           // Single select trạng thái thuế
  customer: string | null     // Autocomplete khách hàng
  invoiceType: string[]       // Multi-select loại hóa đơn
}
```

### 1.2. Màu Sắc & Thiết Kế (Color Palette)

#### Primary Colors
```css
/* Primary Blue - Main Actions */
Primary: #1976d2
Hover: #1565c0
Active: #0d47a1

/* Success Green */
Success: #4caf50
Success Hover: #45a049

/* Error Red */
Error: #f44336
Error Hover: #e53935

/* Warning Orange */
Warning: #ff9800
Warning Hover: #fb8c00
```

#### Background Colors
```css
/* Container Backgrounds */
Filter Container: #f8f9fa    /* Light gray */
Hover State: #f0f2f5         /* Slightly darker gray */
Input Fields: #ffffff        /* Pure white */
Page Background: #f5f5f5     /* Material Design gray */

/* Border Colors */
Default Border: #e0e0e0      /* Light border */
Focus Border: #1976d2        /* Primary blue */
Error Border: #f44336        /* Error red */
```

#### Typography Colors
```css
/* Text Colors */
Primary Text: #1a1a1a        /* Almost black */
Secondary Text: #666666      /* Medium gray */
Disabled Text: #9e9e9e       /* Light gray */
Link Text: #1976d2           /* Primary blue */
Link Hover: #0d47a1          /* Darker blue */
```

#### Status Colors
```css
/* Invoice Status Chips */
Draft: #9e9e9e              /* Gray */
Signed: #2196f3             /* Blue */
Published: #4caf50          /* Green */
Sent: #00bcd4               /* Cyan */
Rejected: #f44336           /* Red */
Paid: #8bc34a               /* Light green */
Cancelled: #757575          /* Dark gray */
```

### 1.3. UI/UX Chi Tiết

#### Progressive Disclosure Pattern
```tsx
<Collapse in={advancedOpen}>
  {/* Advanced filters ẩn/hiện mượt mà */}
</Collapse>
```

**Lợi ích:**
- ✅ Không chiếm không gian khi không dùng
- ✅ Animation mượt mà (Material-UI default)
- ✅ Clear visual hierarchy

#### Search Bar Design
```tsx
<TextField
  placeholder="🔍 Tìm theo số HĐ, mã KH, tên KH, MST..."
  sx={{
    minWidth: 300,
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f8f9fa',        // Subtle background
      '&:hover': {
        backgroundColor: '#f0f2f5',      // Darker on hover
      },
      '&.Mui-focused': {
        backgroundColor: '#fff',         // Pure white when focused
      },
    },
  }}
/>
```

**Đặc điểm:**
- 🎨 3-state visual feedback (default/hover/focus)
- 🔍 Icon search rõ ràng
- ❌ Clear button khi có text
- 📱 Responsive với minWidth 300px

#### Filter Button với Badge Counter
```tsx
<Badge
  badgeContent={getActiveFilterCount()}
  color="primary"
  sx={{
    '& .MuiBadge-badge': {
      right: -3,
      top: 13,
      border: '2px solid #fff',    // White border
      padding: '0 4px',
    },
  }}
>
  <Button
    variant={advancedOpen ? 'contained' : 'outlined'}
    startIcon={<FilterListIcon />}
  >
    Bộ lọc
  </Button>
</Badge>
```

**Smart Logic:**
```typescript
const getActiveFilterCount = useCallback(() => {
  let count = 0
  if (filters.searchText && filters.searchText.trim() !== '') count++
  if (filters.dateFrom) count++
  if (filters.dateTo) count++
  // ⚠️ QUAN TRỌNG: Loại trừ 'ALL' values
  if (filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('ALL')) count++
  if (filters.customer && filters.customer !== 'ALL') count++
  return count
}, [filters])
```

#### "Chọn tất cả" Logic
```typescript
// Khi click "Tất cả"
if (newValue.includes('ALL') && !prevValue.includes('ALL')) {
  return ['ALL', ...allItems]  // Thêm tất cả items
}

// Khi bỏ chọn "Tất cả"
else if (prevValue.includes('ALL') && !newValue.includes('ALL')) {
  return newValue.filter(v => v !== 'ALL')  // Xóa tất cả
}

// Auto thêm "Tất cả" khi chọn đủ
else if (newValue.length === allItems.length && !newValue.includes('ALL')) {
  return ['ALL', ...newValue]
}

// Xóa "Tất cả" khi bỏ bất kỳ item nào
else if (prevValue.includes('ALL') && newValue.length < allItems.length) {
  return newValue.filter(v => v !== 'ALL')
}
```

### 1.4. Auto-Apply & Debounce Strategy

#### Auto-Apply cho Non-Search Fields
```typescript
useEffect(() => {
  if (isFirstMount.current) {
    isFirstMount.current = false
    return  // Skip first render
  }
  
  if (onFilterChange) {
    onFilterChange(filters)
  }
}, [
  filters.dateFrom,
  filters.dateTo,
  filters.invoiceStatus,
  filters.taxStatus,
  filters.customer,
  filters.invoiceType,
  // ⚠️ Không có filters.searchText
])
```

#### Debounced Search (500ms)
```typescript
useEffect(() => {
  if (isFirstMount.current) return

  const handler = setTimeout(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, 500)  // 500ms delay

  return () => clearTimeout(handler)
}, [filters.searchText])
```

**Tại sao 500ms?**
- ⚡ Đủ nhanh để UX tốt
- 🎯 Giảm số lần filter không cần thiết
- 💻 Tối ưu performance

### 1.5. Layout Responsive

```tsx
<Box sx={{ 
  display: 'flex', 
  gap: 2,           // Consistent spacing
  flexWrap: 'wrap', // Wrap on small screens
}}>
  <Box sx={{ minWidth: 200, flex: 1 }}>
    {/* DatePicker */}
  </Box>
  <Box sx={{ minWidth: 200, flex: 1 }}>
    {/* Select */}
  </Box>
</Box>
```

**Breakpoints:**
- Desktop (>900px): 4 columns
- Tablet (600-900px): 2 columns
- Mobile (<600px): 1 column

---

## 2. StatementFilter - Component Mới

### 2.1. Đặc Điểm Riêng Biệt

**StatementFilter.tsx** (550+ dòng) - Tối ưu cho quản lý công nợ:

```typescript
export interface StatementFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  periodFrom: string          // ✨ MỚI - Kỳ cước từ (MM/YYYY)
  periodTo: string            // ✨ MỚI - Kỳ cước đến (MM/YYYY)
  status: string[]            // Trạng thái bảng kê
  customer: string | null
  emailSentStatus: string     // ✨ MỚI - Đã gửi email chưa
  linkedInvoice: string       // ✨ MỚI - Đã gắn HĐ chưa
}
```

### 2.2. Nguồn Dữ Liệu Đặc Thù

```typescript
// Trạng thái Bảng kê (từ statementStatus.ts)
import { STATEMENT_STATUS, STATEMENT_STATUS_LABELS } from '@/constants/statementStatus'

const allStatuses = [
  { value: STATEMENT_STATUS.DRAFT, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.DRAFT] },
  { value: STATEMENT_STATUS.INVOICED, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.INVOICED] },
]

// Trạng thái gửi email
const emailStatusOptions = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SENT', label: 'Đã gửi email' },
  { value: 'NOT_SENT', label: 'Chưa gửi email' },
]

// Trạng thái gắn hóa đơn
const invoiceLinkedOptions = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'LINKED', label: 'Đã gắn HĐ' },
  { value: 'NOT_LINKED', label: 'Chưa gắn HĐ' },
]
```

### 2.3. Layout 3 Rows

```
┌────────────────────────────────────────────────────────┐
│ [🔍 Search] [🎯 Filter (badge)] [Tạo Bảng kê mới ➜]  │
└────────────────────────────────────────────────────────┘
          ┌──────────────────────────────────┐
          │  📅 Row 1: 4 Fields              │
          │    [Ngày tạo từ] [Ngày tạo đến]  │
          │    [Kỳ cước từ]  [Kỳ cước đến]   │
          │                                  │
          │  📊 Row 2: 3 Selects             │
          │    [Trạng thái] [Gửi email]     │
          │    [Gắn hóa đơn]                │
          │                                  │
          │  👤 Row 3: Customer              │
          │    [Khách hàng (Autocomplete)]   │
          │                                  │
          │  [Reset] [Results: X/Y]          │
          └──────────────────────────────────┘
```

### 2.4. Period Filter (Đặc Trưng)

```tsx
<TextField
  label="📊 Kỳ cước từ"
  placeholder="VD: 01/2025"
  value={filters.periodFrom}
  onChange={(e) => handleChange('periodFrom', e.target.value)}
  helperText="Định dạng: MM/YYYY"
/>
```

**Validation Logic:**
```typescript
const matchesPeriodFrom = 
  !filters.periodFrom || 
  statement.period >= filters.periodFrom  // String comparison

const matchesPeriodTo = 
  !filters.periodTo || 
  statement.period <= filters.periodTo
```

**Ví dụ:**
- Period: "10/2025"
- PeriodFrom: "09/2025"
- PeriodTo: "12/2025"
- ✅ Match: "10/2025" >= "09/2025" && "10/2025" <= "12/2025"

### 2.5. Email & Invoice Status Filters

```tsx
{/* Email Status */}
<FormControl fullWidth size="small">
  <InputLabel>📧 Gửi email</InputLabel>
  <Select
    value={filters.emailSentStatus}
    onChange={(e) => handleChange('emailSentStatus', e.target.value)}
  >
    <MenuItem value="ALL">Tất cả</MenuItem>
    <MenuItem value="SENT">Đã gửi email</MenuItem>
    <MenuItem value="NOT_SENT">Chưa gửi email</MenuItem>
  </Select>
</FormControl>

{/* Invoice Linked Status */}
<FormControl fullWidth size="small">
  <InputLabel>🔗 Gắn hóa đơn</InputLabel>
  <Select
    value={filters.linkedInvoice}
    onChange={(e) => handleChange('linkedInvoice', e.target.value)}
  >
    <MenuItem value="ALL">Tất cả</MenuItem>
    <MenuItem value="LINKED">Đã gắn HĐ</MenuItem>
    <MenuItem value="NOT_LINKED">Chưa gắn HĐ</MenuItem>
  </Select>
</FormControl>
```

---

## 3. Tích Hợp vào StatementManagement

### 3.1. Cập Nhật Imports

```typescript
// BEFORE
import { useState, useMemo } from 'react'

// AFTER
import { useState, useMemo, useCallback } from 'react'
import dayjs from 'dayjs'
import StatementFilter, { StatementFilterState } from '@/components/StatementFilter'
```

### 3.2. Filter State

```typescript
const [filters, setFilters] = useState<StatementFilterState>({
  searchText: '',
  dateFrom: null,
  dateTo: null,
  periodFrom: '',
  periodTo: '',
  status: [],
  customer: null,
  emailSentStatus: 'ALL',
  linkedInvoice: 'ALL',
})
```

### 3.3. Filter Logic Toàn Diện

```typescript
const filteredStatements = useMemo(() => {
  let result = statements

  // 1️⃣ Tab filtering (Draft/Invoiced)
  switch (selectedTab) {
    case 'draft':
      result = result.filter(s => s.status !== STATEMENT_STATUS.INVOICED)
      break
    case 'invoiced':
      result = result.filter(s => s.status === STATEMENT_STATUS.INVOICED)
      break
  }

  // 2️⃣ Advanced filtering
  result = result.filter((statement) => {
    // Search text (mã BK, khách hàng, số HĐ)
    const matchesSearch =
      !filters.searchText ||
      statement.code.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      statement.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      statement.linkedInvoiceNumber?.toLowerCase().includes(filters.searchText.toLowerCase())

    // Date range (ngày tạo)
    const matchesDateFrom =
      !filters.dateFrom ||
      dayjs(statement.createdDate).isAfter(filters.dateFrom, 'day') ||
      dayjs(statement.createdDate).isSame(filters.dateFrom, 'day')
    const matchesDateTo =
      !filters.dateTo ||
      dayjs(statement.createdDate).isBefore(filters.dateTo, 'day') ||
      dayjs(statement.createdDate).isSame(filters.dateTo, 'day')

    // Period range (kỳ cước) ⭐ MỚI
    const matchesPeriodFrom =
      !filters.periodFrom ||
      statement.period >= filters.periodFrom
    const matchesPeriodTo =
      !filters.periodTo ||
      statement.period <= filters.periodTo

    // Status
    const matchesStatus =
      filters.status.length === 0 ||
      filters.status.includes('ALL') ||
      filters.status.includes(statement.status)

    // Customer
    const matchesCustomer =
      !filters.customer ||
      filters.customer === 'ALL' ||
      statement.customerName === filters.customer

    // Email sent status ⭐ MỚI
    const matchesEmailSent =
      filters.emailSentStatus === 'ALL' ||
      (filters.emailSentStatus === 'SENT' && statement.isEmailSent) ||
      (filters.emailSentStatus === 'NOT_SENT' && !statement.isEmailSent)

    // Invoice linked status ⭐ MỚI
    const matchesInvoiceLinked =
      filters.linkedInvoice === 'ALL' ||
      (filters.linkedInvoice === 'LINKED' && statement.linkedInvoiceNumber !== null) ||
      (filters.linkedInvoice === 'NOT_LINKED' && statement.linkedInvoiceNumber === null)

    return (
      matchesSearch &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesPeriodFrom &&
      matchesPeriodTo &&
      matchesStatus &&
      matchesCustomer &&
      matchesEmailSent &&
      matchesInvoiceLinked
    )
  })

  return result
}, [statements, selectedTab, filters])
```

### 3.4. Handlers

```typescript
const handleFilterChange = useCallback((newFilters: StatementFilterState) => {
  setFilters(newFilters)
}, [])

const handleResetFilter = useCallback(() => {
  setFilters({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    periodFrom: '',
    periodTo: '',
    status: [],
    customer: null,
    emailSentStatus: 'ALL',
    linkedInvoice: 'ALL',
  })
}, [])
```

### 3.5. UI Integration

```tsx
{/* Header - Simplified */}
<Box sx={{ mb: 4 }}>
  <Typography variant="h4">📋 Quản lý Bảng kê công nợ</Typography>
  <Typography variant="body2" sx={{ color: '#666' }}>
    Quản lý và theo dõi các bảng kê cước, công nợ khách hàng
  </Typography>
  {filteredStatements.length > 0 && (
    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
      📊 Hiển thị {filteredStatements.length} / {statements.length} bảng kê
    </Typography>
  )}
</Box>

{/* Statement Filter với Action Button */}
<StatementFilter
  onFilterChange={handleFilterChange}
  onReset={handleResetFilter}
  totalResults={statements.length}
  filteredResults={filteredStatements.length}
  actionButton={
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => navigate('/statements/new')}
    >
      Tạo Bảng kê mới
    </Button>
  }
/>
```

---

## 4. So Sánh Chi Tiết

| Tiêu chí | InvoiceFilter | StatementFilter |
|----------|---------------|-----------------|
| **Số lượng fields** | 7 | 9 |
| **Date fields** | 2 (Ngày tạo) | 2 (Ngày tạo) |
| **Period fields** | 0 | 2 (Kỳ cước từ/đến) ⭐ |
| **Status filters** | 2 (Invoice, Tax) | 3 (Statement, Email, Invoice Link) ⭐ |
| **Layout rows** | 3 | 3 |
| **Auto-apply** | ✅ Yes | ✅ Yes |
| **Debounced search** | ✅ 500ms | ✅ 500ms |
| **Badge counter** | ✅ Yes | ✅ Yes |
| **Smart "Chọn tất cả"** | ✅ Yes | ✅ Yes |
| **Real-time results** | ✅ Yes | ✅ Yes |

---

## 5. Điểm Mạnh & Best Practices

### 5.1. Performance Optimization

✅ **useMemo cho filteredData**
```typescript
const filteredStatements = useMemo(() => {
  // Complex filtering logic
}, [statements, selectedTab, filters])
```

✅ **useCallback cho handlers**
```typescript
const handleFilterChange = useCallback((newFilters) => {
  setFilters(newFilters)
}, [])
```

✅ **Debounced search** - Giảm số lần filter

### 5.2. UX Excellence

✅ **Progressive Disclosure** - Collapse/Expand mượt mà  
✅ **Badge Counter** - Hiển thị số filters active  
✅ **Smart "Chọn tất cả"** - Auto thêm/xóa  
✅ **Real-time Feedback** - Kết quả ngay lập tức  
✅ **3-State Visual Feedback** - Default/Hover/Focus  

### 5.3. Code Quality

✅ **TypeScript Strict** - Full type safety  
✅ **Consistent Naming** - Clear conventions  
✅ **Component Reusability** - Dễ tái sử dụng  
✅ **Clear Documentation** - Comments đầy đủ  

---

## 6. Checklist Hoàn Thành

### ✅ Component Creation
- [x] StatementFilter.tsx (550+ lines)
- [x] StatementFilterState interface
- [x] Period filter (MM/YYYY format)
- [x] Email sent status filter
- [x] Invoice linked status filter
- [x] Status multi-select với "Chọn tất cả"
- [x] Customer Autocomplete
- [x] Badge counter & results display

### ✅ Integration
- [x] Import StatementFilter vào StatementManagement
- [x] Add filter state với StatementFilterState
- [x] Implement handleFilterChange
- [x] Implement handleResetFilter
- [x] Create filteredStatements với useMemo
- [x] Combine với tab filtering (Draft/Invoiced)
- [x] Update UI với results display

### ✅ Filter Logic
- [x] Search text (code, customer, invoice number)
- [x] Date range filtering
- [x] Period range filtering (string comparison)
- [x] Status filtering
- [x] Customer filtering
- [x] Email sent status filtering
- [x] Invoice linked status filtering

---

## 7. Kết Luận

### Ưu Điểm Solution

1. **🎨 Professional UX**
   - Auto-apply, debounce, real-time feedback
   - Smart "Chọn tất cả" logic
   - Clear visual hierarchy
   - Consistent color palette

2. **⚡ Performance Optimized**
   - useMemo/useCallback
   - Debounced search
   - Efficient re-rendering

3. **🛡️ Type-Safe**
   - Full TypeScript support
   - Proper interfaces
   - Type-safe handlers

4. **🔧 Maintainable**
   - Clean code structure
   - Reusable pattern
   - Clear documentation

5. **📈 Scalable**
   - Dễ thêm fields mới
   - Consistent với InvoiceFilter
   - Có thể áp dụng cho các trang khác

### Tính Năng Độc Đáo cho Statement

- ✨ **Period Filter** - Lọc theo kỳ cước (MM/YYYY)
- ✨ **Email Status Filter** - Đã gửi/Chưa gửi email
- ✨ **Invoice Link Filter** - Đã gắn/Chưa gắn HĐ
- ✨ **Combined Filtering** - Tab + Advanced filters

---

**Tác giả**: GitHub Copilot  
**Ngày tạo**: Tháng 1, 2026  
**Phiên bản**: 1.0
