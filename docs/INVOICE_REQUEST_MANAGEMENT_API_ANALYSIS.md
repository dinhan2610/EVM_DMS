# Phân Tích Trang Quản Lý Yêu Cầu Xuất HĐ - API Mapping

## 📋 Tổng Quan

**File:** `src/page/InvoiceRequestManagement.tsx`  
**API Endpoint:** `GET /api/InvoiceRequest`  
**Vấn đề:** ❌ **THIẾU field `invoiceCustomerType`** trong cả interface và UI

---

## 🔍 Phân Tích API Response

### API GET /api/InvoiceRequest (List)

```json
{
  "items": [
    {
      "requestID": 3,
      "customerName": "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ KỸ THUẬT TTE",
      "taxCode": "0402319526",
      "totalAmount": 10000000,
      "statusName": "Invoice_Issued",
      "statusId": 5,
      "saleName": "Sales User",
      "invoiceCustomerType": "0",  // ⚠️ STRING "0" (không phải 1 hoặc 2!)
      "evidenceFilePath": null,
      "createdAt": "2026-01-24T03:31:29.97049Z"
    }
  ],
  "pageIndex": 1,
  "totalPages": 1,
  "totalCount": 3
}
```

### API GET /api/InvoiceRequest/{id} (Detail)

```json
{
  "requestID": 2,
  "createdInvoiceId": null,
  "statusName": "Pending",
  "customerName": "CÔNG TY TNHH...",
  "saleName": "Sales User",
  "totalAmount": 540000,
  "totalAmountInWords": "Năm trăm bốn mươi nghìn đồng",
  "createdAt": "2026-01-24T02:00:41.518225Z",
  "rejectReason": "",
  "invoiceCustomerType": "0",  // ⚠️ STRING "0"
  "evidenceFilePath": null,
  "items": [...]
}
```

---

## ❌ Vấn Đề Phát Hiện

### 1. **Backend Trả Về String "0" Thay Vì Number**

**Expected:**
```typescript
invoiceCustomerType: 1 | 2  // 1=Retail/Bán lẻ, 2=Business/Doanh nghiệp
```

**Actual:**
```typescript
invoiceCustomerType: "0"  // STRING "0" - giá trị không hợp lệ!
```

**Phân tích:**
- `"0"` có thể là:
  - Giá trị mặc định khi field NULL/undefined trong DB
  - Backend convert NULL → "0" (string)
  - Yêu cầu cũ (tạo trước khi có field này) → mặc định "0"
- Không khớp với enum (1=Retail, 2=Business)

---

### 2. **Frontend Interface Thiếu Field `invoiceCustomerType`**

**File:** `src/types/invoiceRequest.types.ts`  
**Line:** 87-138

```typescript
export interface InvoiceRequest {
  requestID: number
  requestCode: string
  requestType: RequestType
  statusID: InvoiceRequestStatus
  statusName: string
  // ... 30+ fields
  invoiceID?: number
  invoiceNumber?: string
  // ❌ THIẾU: invoiceCustomerType
}
```

**Impact:**
- TypeScript không type-check field này
- Không có IntelliSense cho `invoiceCustomerType`
- Mapping function bỏ qua field này

---

### 3. **Mapping Function Không Map `invoiceCustomerType`**

**File:** `src/page/InvoiceRequestManagement.tsx`  
**Line:** 386-447 (`mapBackendToFrontend`)

```typescript
const mapBackendToFrontend = (backendData: BackendInvoiceRequestResponse): InvoiceRequest => {
  return {
    requestID: backendData.requestID,
    requestCode: backendData.requestCode || `REQ-${backendData.requestID}`,
    // ... map 20+ fields
    invoiceID: backendData.invoiceID || backendData.createdInvoiceId || undefined,
    invoiceNumber: backendData.invoiceNumber?.toString(),
    // ❌ THIẾU: invoiceCustomerType: backendData.invoiceCustomerType
  }
}
```

**Impact:**
- Data từ API bị mất field `invoiceCustomerType`
- Frontend không có thông tin loại hóa đơn (B2B/B2C)

---

### 4. **UI Không Hiển Thị `invoiceCustomerType`**

**File:** `src/page/InvoiceRequestManagement.tsx`  
**Line:** 779-1100 (DataGrid columns)

**Các Column Hiện Tại:**
1. ✅ Mã yêu cầu (`requestCode`)
2. ✅ Loại YC (`requestType`)
3. ✅ Khách hàng (`customerName` + `taxCode`)
4. ✅ Sale (`requestedBy.saleName`)
5. ✅ Tổng tiền (`totalAmount`)
6. ✅ Ngày tạo (`requestDate`)
7. ✅ Hạn xuất HĐ (`requiredDate`)
8. ✅ Trạng thái (`statusID`)
9. ✅ Thao tác (`actions`)

**❌ THIẾU: Column "Loại hóa đơn"** (`invoiceCustomerType`)

**Impact:**
- User không biết yêu cầu là B2B hay B2C
- Không thể filter theo loại hóa đơn
- Accountant không biết cần điền thông tin gì khi tạo HĐ

---

### 5. **Backend Response Type Chưa Cập Nhật**

**File:** `src/services/invoiceService.ts`  
**Line:** 50-80 (`BackendInvoiceRequestResponse`)

```typescript
export interface BackendInvoiceRequestResponse {
  requestID: number
  requestCode?: string
  statusID?: number
  // ... 20+ fields
  approvedDate?: string
  // ❌ THIẾU: invoiceCustomerType?: string | number
}
```

**Impact:**
- TypeScript không biết API response có field này
- Không có type safety khi map data

---

## 🔧 Giải Pháp Đề Xuất

### ✅ Fix 1: Update `BackendInvoiceRequestResponse` Interface

**File:** `src/services/invoiceService.ts`

```typescript
export interface BackendInvoiceRequestResponse {
  // ...existing fields
  invoiceCustomerType?: string | number;  // ✅ NEW: Backend có thể trả về "0", 1, hoặc 2
  evidenceFilePath?: string | null;       // ✅ NEW: File đính kèm (từ API response)
}
```

**Lý do:**
- Type-safe với API response thực tế
- Hỗ trợ cả string và number (backend inconsistent)
- Optional vì có thể NULL ở requests cũ

---

### ✅ Fix 2: Update `InvoiceRequest` Interface

**File:** `src/types/invoiceRequest.types.ts`

```typescript
export interface InvoiceRequest {
  // ...existing fields (40+ fields)
  
  // Related Invoice
  invoiceID?: number        
  invoiceNumber?: string    
  
  // ✅ NEW: Invoice Customer Type
  invoiceCustomerType?: 0 | 1 | 2;  // 0=Unknown/Old, 1=Retail/B2C, 2=Business/B2B
  
  // ✅ NEW: Evidence File
  evidenceFilePath?: string | null;  // File đính kèm (nếu có)
  
  // Original Request (for adjustment/replacement)
  originalRequestID?: number
  originalInvoiceID?: number
}
```

**Mapping:**
- `0` = Unknown/Old data (requests tạo trước khi có field này)
- `1` = Retail/Bán lẻ (B2C)
- `2` = Business/Doanh nghiệp (B2B)

---

### ✅ Fix 3: Update Mapping Function

**File:** `src/page/InvoiceRequestManagement.tsx`  
**Function:** `mapBackendToFrontend`

```typescript
const mapBackendToFrontend = (backendData: BackendInvoiceRequestResponse): InvoiceRequest => {
  const statusID = backendData.statusID || backendData.statusId || 1;
  const saleName = backendData.salesName || backendData.saleName || 'N/A';
  
  // ✅ Parse invoiceCustomerType với fallback
  let invoiceCustomerType: 0 | 1 | 2 = 0;
  if (backendData.invoiceCustomerType !== undefined && backendData.invoiceCustomerType !== null) {
    const parsed = typeof backendData.invoiceCustomerType === 'string' 
      ? parseInt(backendData.invoiceCustomerType) 
      : backendData.invoiceCustomerType;
    
    // Validate: chỉ chấp nhận 0, 1, 2
    if ([0, 1, 2].includes(parsed)) {
      invoiceCustomerType = parsed as 0 | 1 | 2;
    }
  }
  
  return {
    // ...existing mapping (40+ fields)
    invoiceID: backendData.invoiceID || backendData.createdInvoiceId || undefined,
    invoiceNumber: backendData.invoiceNumber?.toString(),
    
    // ✅ NEW: Map invoiceCustomerType
    invoiceCustomerType: invoiceCustomerType,
    
    // ✅ NEW: Map evidenceFilePath
    evidenceFilePath: backendData.evidenceFilePath || undefined,
  }
}
```

**Logic:**
1. Parse string → number nếu cần
2. Validate chỉ chấp nhận 0, 1, 2
3. Default = 0 (Unknown) nếu invalid

---

### ✅ Fix 4: Add Column "Loại HĐ" to DataGrid

**File:** `src/page/InvoiceRequestManagement.tsx`  
**Location:** Thêm vào `columns` array (sau column "Loại YC", trước "Khách hàng")

```typescript
const columns: GridColDef[] = [
  // ...existing columns (requestCode, requestType)
  
  {
    field: 'invoiceCustomerType',
    headerName: 'Loại HĐ',
    flex: 0.8,
    minWidth: 120,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const type = params.value as 0 | 1 | 2;
      
      // Map type → label + icon
      const typeInfo = {
        0: { label: 'Chưa rõ', icon: '❓', bg: '#f5f5f5', text: '#757575', border: '#bdbdbd' },
        1: { label: 'Bán lẻ', icon: '👤', bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' },
        2: { label: 'Doanh nghiệp', icon: '🏢', bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' },
      };
      
      const info = typeInfo[type] || typeInfo[0];
      
      return (
        <Tooltip 
          title={
            type === 0 
              ? 'Yêu cầu cũ (chưa có thông tin loại HĐ)' 
              : type === 1 
              ? 'Hóa đơn B2C - Bán lẻ cá nhân' 
              : 'Hóa đơn B2B - Bán cho doanh nghiệp'
          }
          arrow
          placement="top"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                padding: '6px 12px',
                borderRadius: '16px',
                bgcolor: info.bg,
                border: `1px solid ${info.border}`,
                height: 28,
              }}
            >
              <Box component="span" sx={{ fontSize: '0.875rem' }}>
                {info.icon}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: info.text,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.3px',
                  lineHeight: 1,
                }}
              >
                {info.label}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      );
    },
  },
  
  // ...existing columns (customerName, requestedBy, etc.)
];
```

**Visual Design:**
- ❓ **Chưa rõ** (type=0): Gray badge - yêu cầu cũ
- 👤 **Bán lẻ** (type=1): Blue badge - B2C
- 🏢 **Doanh nghiệp** (type=2): Purple badge - B2B

---

### ✅ Fix 5: Add Filter for `invoiceCustomerType`

**File:** `src/components/InvoiceRequestFilter.tsx`

**Option 1: Checkbox Group**
```typescript
<FormGroup>
  <FormControlLabel 
    control={<Checkbox checked={filters.customerTypes?.includes(0)} />}
    label="❓ Chưa rõ"
  />
  <FormControlLabel 
    control={<Checkbox checked={filters.customerTypes?.includes(1)} />}
    label="👤 Bán lẻ (B2C)"
  />
  <FormControlLabel 
    control={<Checkbox checked={filters.customerTypes?.includes(2)} />}
    label="🏢 Doanh nghiệp (B2B)"
  />
</FormGroup>
```

**Option 2: Chip Select**
```typescript
<Stack direction="row" spacing={1}>
  <Chip 
    label="👤 Bán lẻ" 
    color={filters.customerTypes?.includes(1) ? 'primary' : 'default'}
    onClick={() => toggleCustomerType(1)}
  />
  <Chip 
    label="🏢 Doanh nghiệp" 
    color={filters.customerTypes?.includes(2) ? 'primary' : 'default'}
    onClick={() => toggleCustomerType(2)}
  />
</Stack>
```

**Update Filter Interface:**
```typescript
export interface InvoiceRequestFilterState {
  // ...existing fields
  customerTypes?: (0 | 1 | 2)[];  // ✅ NEW: Filter by invoice customer type
}
```

**Update Filter Logic:**
```typescript
const filteredRequests = useMemo(() => {
  return requests.filter((request) => {
    // ...existing filters
    
    // ✅ NEW: Filter by customer type
    const matchesCustomerType = 
      !filters.customerTypes || 
      filters.customerTypes.length === 0 ||
      filters.customerTypes.includes(request.invoiceCustomerType || 0);
    
    return matchesSearch && matchesDateFrom && matchesDateTo && 
           matchesStatus && matchesCustomerType;
  });
}, [requests, filters]);
```

---

## 📊 So Sánh Trước & Sau

### Backend Response (Không thay đổi)
| Field | Type | Value Example | Note |
|-------|------|---------------|------|
| `invoiceCustomerType` | `string` | `"0"` | ⚠️ Backend issue - trả về string "0" |

### Frontend Interface

**Trước:**
```typescript
interface InvoiceRequest {
  // 40 fields
  invoiceID?: number
  // ❌ Không có invoiceCustomerType
}
```

**Sau:**
```typescript
interface InvoiceRequest {
  // 40 fields
  invoiceID?: number
  invoiceCustomerType?: 0 | 1 | 2  // ✅ NEW
  evidenceFilePath?: string | null  // ✅ NEW
}
```

### Mapping Function

**Trước:**
```typescript
return {
  // ...40 fields mapped
  invoiceID: backendData.invoiceID,
  // ❌ invoiceCustomerType bị bỏ qua
}
```

**Sau:**
```typescript
return {
  // ...40 fields mapped
  invoiceID: backendData.invoiceID,
  invoiceCustomerType: parseCustomerType(backendData.invoiceCustomerType), // ✅ Map + parse
  evidenceFilePath: backendData.evidenceFilePath, // ✅ Map
}
```

### DataGrid Columns

**Trước:** 9 columns
1. Mã yêu cầu
2. Loại YC
3. Khách hàng
4. Sale
5. Tổng tiền
6. Ngày tạo
7. Hạn xuất HĐ
8. Trạng thái
9. Thao tác

**Sau:** 10 columns (insert after "Loại YC")
1. Mã yêu cầu
2. Loại YC
3. **✅ Loại HĐ** (NEW)
4. Khách hàng
5. Sale
6. Tổng tiền
7. Ngày tạo
8. Hạn xuất HĐ
9. Trạng thái
10. Thao tác

---

## 🚨 Backend Issues Cần Fix

### Issue 1: `invoiceCustomerType` Trả Về String "0"

**Current Behavior:**
```json
{
  "invoiceCustomerType": "0"  // STRING
}
```

**Expected Behavior:**
```json
{
  "invoiceCustomerType": 1  // NUMBER (1 hoặc 2)
}
```

**Backend Fix Required:**
1. Check DB schema: `invoiceCustomerType` column type
2. Ensure column is NOT NULL with DEFAULT value (1 hoặc 2)
3. Update existing records: `UPDATE InvoiceRequest SET invoiceCustomerType = 2 WHERE invoiceCustomerType IS NULL OR invoiceCustomerType = 0`
4. Update API response serialization to return number

**SQL Migration Example:**
```sql
-- 1. Add column if not exists (with default = 2 for B2B)
ALTER TABLE InvoiceRequest 
ADD invoiceCustomerType INT NOT NULL DEFAULT 2;

-- 2. Update old records (assume B2B if unknown)
UPDATE InvoiceRequest 
SET invoiceCustomerType = 2 
WHERE invoiceCustomerType = 0 OR invoiceCustomerType IS NULL;

-- 3. Add constraint
ALTER TABLE InvoiceRequest
ADD CONSTRAINT CK_InvoiceCustomerType CHECK (invoiceCustomerType IN (1, 2));

-- 4. Create index for filtering
CREATE INDEX IX_InvoiceRequest_CustomerType ON InvoiceRequest(invoiceCustomerType);
```

---

### Issue 2: Missing Field in POST /api/InvoiceRequest

**Check:** Khi Sales tạo yêu cầu mới qua CreateSalesOrder, có gửi `invoiceCustomerType` không?

**Current (đã fix ở CreateSalesOrder):**
```typescript
// ✅ GOOD: CreateSalesOrder đã include field này
const requestPayload: BackendInvoiceRequestPayload = {
  // ...16 fields
  invoiceCustomerType: invoiceCustomerType, // ✅ 1 hoặc 2
}
```

**Backend Validation Required:**
```csharp
// C# Backend - InvoiceRequestController.cs
[HttpPost]
public async Task<IActionResult> CreateInvoiceRequest([FromBody] InvoiceRequestDto request)
{
    // ✅ Validate invoiceCustomerType
    if (request.InvoiceCustomerType != 1 && request.InvoiceCustomerType != 2)
    {
        return BadRequest(new { 
            message = "invoiceCustomerType must be 1 (Retail) or 2 (Business)" 
        });
    }
    
    // Save to DB...
}
```

---

## 📝 Implementation Checklist

### Phase 1: Types & Interfaces ✅
- [x] Update `BackendInvoiceRequestResponse` interface
- [x] Update `InvoiceRequest` interface
- [x] Add `invoiceCustomerType` field
- [x] Add `evidenceFilePath` field

### Phase 2: Data Mapping ✅
- [x] Update `mapBackendToFrontend` function
- [x] Add parsing logic for `invoiceCustomerType` (string→number)
- [x] Add validation (only 0, 1, 2)
- [x] Map `evidenceFilePath`

### Phase 3: UI Display ✅
- [x] Add "Loại HĐ" column to DataGrid
- [x] Render badge với icon (❓/👤/🏢)
- [x] Add tooltip với description
- [x] Color coding (gray/blue/purple)

### Phase 4: Filtering (Optional) ⏳
- [ ] Update `InvoiceRequestFilterState` interface
- [ ] Add filter UI component
- [ ] Update filter logic in `filteredRequests`
- [ ] Add filter chips/tags

### Phase 5: Testing ⏳
- [ ] Verify type = 0 renders correctly (old data)
- [ ] Verify type = 1 renders correctly (B2C)
- [ ] Verify type = 2 renders correctly (B2B)
- [ ] Test sorting by column
- [ ] Test filtering (if implemented)

---

## 🎯 Expected Results

### After Implementation:

**DataGrid will show:**
```
┌────────────┬──────────┬────────────┬─────────────────┬─────────┬────────────┬────────────┬──────────┬─────────────┐
│ Mã yêu cầu │ Loại YC  │ Loại HĐ    │ Khách hàng      │ Sale    │ Tổng tiền  │ Ngày tạo   │ Trạng thái│ Thao tác   │
├────────────┼──────────┼────────────┼─────────────────┼─────────┼────────────┼────────────┼──────────┼─────────────┤
│ REQ-3      │ Tạo mới  │ ❓ Chưa rõ │ CÔNG TY TNHH... │ Sales   │ 10,000,000 │ 24/01/2026 │ Hoàn thành│ [⋮]        │
│ REQ-2      │ Tạo mới  │ ❓ Chưa rõ │ CÔNG TY TNHH... │ Sales   │ 540,000    │ 24/01/2026 │ Chờ duyệt │ [⋮]        │
│ REQ-1      │ Tạo mới  │ ❓ Chưa rõ │ CÔNG TY TNHH... │ Sales   │ 10,000,000 │ 23/01/2026 │ Hoàn thành│ [⋮]        │
└────────────┴──────────┴────────────┴─────────────────┴─────────┴────────────┴────────────┴──────────┴─────────────┘
```

**Note:** Hiện tại tất cả requests cũ đều có `invoiceCustomerType = "0"` → hiển thị "❓ Chưa rõ"

**Sau khi Sales tạo request mới (với dropdown):**
```
┌────────────┬──────────┬──────────────────┬─────────────────┬─────────┬────────────┬────────────┬──────────┬─────────────┐
│ Mã yêu cầu │ Loại YC  │ Loại HĐ          │ Khách hàng      │ Sale    │ Tổng tiền  │ Ngày tạo   │ Trạng thái│ Thao tác   │
├────────────┼──────────┼──────────────────┼─────────────────┼─────────┼────────────┼────────────┼──────────┼─────────────┤
│ REQ-5      │ Tạo mới  │ 🏢 Doanh nghiệp  │ CÔNG TY ABC...  │ Sales   │ 5,000,000  │ 25/01/2026 │ Chờ duyệt │ [⋮]        │
│ REQ-4      │ Tạo mới  │ 👤 Bán lẻ        │ Nguyễn Văn A    │ Sales   │ 1,200,000  │ 25/01/2026 │ Chờ duyệt │ [⋮]        │
│ REQ-3      │ Tạo mới  │ ❓ Chưa rõ       │ CÔNG TY TNHH... │ Sales   │ 10,000,000 │ 24/01/2026 │ Hoàn thành│ [⋮]        │
└────────────┴──────────┴──────────────────┴─────────────────┴─────────┴────────────┴────────────┴──────────┴─────────────┘
```

---

## 🔗 Related Files

1. **Type Definitions:**
   - `src/types/invoiceRequest.types.ts` - Interface definitions
   - `src/services/invoiceService.ts` - API response types

2. **Components:**
   - `src/page/InvoiceRequestManagement.tsx` - Main management page
   - `src/components/InvoiceRequestFilter.tsx` - Filter component

3. **API Services:**
   - `src/services/invoiceService.ts` - API calls

4. **Related Pages:**
   - `src/page/CreateSalesOrder.tsx` - Form tạo request (đã có dropdown)
   - `src/page/CreateVatInvoice.tsx` - Reference implementation

---

## 📌 Summary

### Current State (❌ Not Optimized):
- ❌ Interface thiếu `invoiceCustomerType`
- ❌ Mapping function bỏ qua field này
- ❌ UI không hiển thị loại hóa đơn
- ❌ Không thể filter theo loại HĐ
- ⚠️ Backend trả về string "0" thay vì number 1/2

### After Fix (✅ Optimized):
- ✅ Interface có `invoiceCustomerType: 0 | 1 | 2`
- ✅ Mapping function parse string → number
- ✅ UI hiển thị badge với icon và color
- ✅ Có thể filter theo loại HĐ (optional)
- ✅ Type-safe với TypeScript
- ⚠️ Backend issue vẫn cần fix (trả về number thay vì string)

### Action Items:
1. **Frontend (High Priority):** Implement Fix 1-4 above
2. **Backend (Critical):** Fix `invoiceCustomerType` data type and default value
3. **Testing (Medium):** Verify UI renders correctly for all 3 types
4. **Enhancement (Low):** Add filtering capability

---

## 🏷️ Tags
`#invoice-request` `#invoiceCustomerType` `#API-mapping` `#data-grid` `#optimization` `#bug-fix`
