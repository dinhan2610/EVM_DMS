# 🔍 ADJUSTMENT INVOICE - CURRENT STATUS ANALYSIS

**Document**: Analysis of Current Backend Implementation  
**Date**: 19/01/2026  
**Status**: ⚠️ Backend INCOMPLETE  

---

## 📊 BACKEND IMPLEMENTATION STATUS

### ✅ ĐIỀU BACKEND ĐÃ LÀM

1. **Create Adjustment Invoice API** - Working
   ```bash
   POST /api/Invoice/adjustment
   → Creates adjustment invoice with type=2
   → Sets original invoice status to 10 (ADJUSTMENT_IN_PROCESS)
   ```

2. **Issue Adjustment Invoice** - Working
   ```bash
   PUT /api/Invoice/{id}?statusId=2
   → Updates adjustment invoice to ISSUED status
   ```

3. **Add adjustmentReason field** - Working
   ```json
   {
     "adjustmentReason": "Nhầm giá bán"  // ✅ New field
   }
   ```

### ❌ ĐIỀU BACKEND CHƯA LÀM

1. **Database Migration** - NOT DONE
   ```sql
   -- ❌ Column này chưa tồn tại
   ALTER TABLE Invoices ADD HasBeenAdjusted BIT NOT NULL DEFAULT 0;
   ```

2. **Auto-Update Logic** - NOT DONE
   ```
   Khi adjustment invoice ISSUED:
   ❌ Original invoice vẫn status = 10 (ADJUSTMENT_IN_PROCESS)
   ✅ Nên tự động chuyển → status = 4 (ADJUSTED)
   ```

3. **API Response Field** - NOT DONE
   ```json
   {
     "invoiceID": 183,
     "invoiceStatusID": 10,  // ❌ Vẫn là 10, không phải 4
     // ❌ Không có field "hasBeenAdjusted"
   }
   ```

---

## 📋 PROOF - API RESPONSES

### Original Invoice (ID=183)

```json
{
  "invoiceID": 183,
  "invoiceStatusID": 10,           // ❌ ADJUSTMENT_IN_PROCESS (expected: 4)
  "invoiceType": 1,                // STANDARD
  "originalInvoiceID": null,
  "adjustmentReason": null,
  // ❌ No "hasBeenAdjusted" field
  "invoiceNumber": 2,
  "totalAmount": 300000,
  "issuedDate": "2026-01-18T18:51:20Z"
}
```

**Analysis:**
- ❌ Status vẫn là 10 mặc dù adjustment đã ISSUED
- ❌ Không có field `hasBeenAdjusted`
- **Expected:** Status = 4, hasBeenAdjusted = true

### Adjustment Invoice (ID=184)

```json
{
  "invoiceID": 184,
  "invoiceStatusID": 2,            // ✅ ISSUED
  "invoiceType": 2,                // ✅ ADJUSTMENT
  "originalInvoiceID": 183,        // ✅ Links to original
  "adjustmentReason": "Nhầm giá bán",  // ✅ Reason provided
  // ❌ No "hasBeenAdjusted" field
  "invoiceNumber": 5,
  "totalAmount": 200000,
  "issuedDate": "2026-01-19T02:00:25Z"
}
```

**Analysis:**
- ✅ Adjustment invoice issued successfully
- ✅ Linked to original invoice correctly
- ❌ No side effect: original invoice not updated

---

## 🚨 VẤN ĐỀ HIỆN TẠI

### 1. User Experience Issue

```
Timeline (Actual):
1. Original Invoice #2 → Status = "Đã phát hành" ✅
2. User creates adjustment → Original shows "Đang điều chỉnh" ⏳
3. Adjustment #5 issued → ❌ Original STILL shows "Đang điều chỉnh"

Expected:
3. Adjustment #5 issued → ✅ Original should show "Đã điều chỉnh"
```

### 2. Data Inconsistency

```
Reality:
- Adjustment Invoice #5 = ISSUED (complete) ✅
- Original Invoice #2 = ADJUSTMENT_IN_PROCESS (incomplete) ❌

→ Contradiction: Adjustment is done but original says "in process"
```

### 3. Frontend Performance

```typescript
// Current: O(n) every render
const adjustedInvoicesMap = useMemo(() => {
  invoices.forEach(inv => {
    if (inv.invoiceType === 2 && inv.originalInvoiceID) {
      map.set(inv.originalInvoiceID.toString(), true)
    }
  })
}, [invoices])  // Recomputes when any invoice changes

// With 10,000 invoices → ~1.5 seconds lag
```

---

## 💡 GIẢI PHÁP

### 🔴 Option A: ĐỢI Backend Hoàn Thành (Recommended)

**Backend cần làm thêm:**

1. **Database Migration** (30 mins)
   ```sql
   ALTER TABLE Invoices ADD HasBeenAdjusted BIT NOT NULL DEFAULT 0;
   CREATE INDEX idx_invoices_has_been_adjusted ON Invoices(HasBeenAdjusted, InvoiceType);
   
   -- Fix existing data
   UPDATE original SET original.HasBeenAdjusted = 1
   FROM Invoices original
   WHERE EXISTS (
       SELECT 1 FROM Invoices adjustment
       WHERE adjustment.InvoiceType = 2
         AND adjustment.OriginalInvoiceID = original.Id
         AND adjustment.Status = 2
   );
   ```

2. **State Machine Service** (2 hours)
   ```csharp
   // Auto-update when adjustment issued
   if (invoice.InvoiceType == 2 && newStatus == 2) {
       var original = await _db.Invoices.FindAsync(invoice.OriginalInvoiceID);
       if (original != null) {
           original.Status = 4;  // ADJUSTED
           original.HasBeenAdjusted = true;
       }
   }
   ```

3. **Update API Response** (30 mins)
   ```csharp
   // Include in DTO
   HasBeenAdjusted = i.HasBeenAdjusted
   ```

**Timeline:** ~3.5 hours backend work

**Frontend sau đó:**
- Remove `adjustedInvoicesMap` logic
- Use `hasBeenAdjusted` field from API
- Performance boost: O(n) → O(1)

---

### 🟡 Option B: Frontend Tạm Thời Cho Phép Multiple Adjustments

**Thay đổi nhỏ trong frontend:**

```typescript
// File: src/page/InvoiceManagement.tsx

// ❌ OLD: Block multiple adjustments
const canAdjust = 
  isIssued && 
  !hasBeenAdjusted &&  // ← Remove this check
  !isAdjustmentInvoice

// ✅ NEW: Allow multiple adjustments (legal per NĐ 123/2020)
const canAdjust = 
  (invoice.status === INVOICE_INTERNAL_STATUS.ISSUED || 
   invoice.status === INVOICE_INTERNAL_STATUS.ADJUSTMENT_IN_PROCESS ||
   invoice.status === INVOICE_INTERNAL_STATUS.ADJUSTED) &&
  invoice.invoiceType !== 2  // Not adjustment invoice itself
```

**Tooltip update:**
```typescript
// ❌ OLD:
hasBeenAdjusted 
  ? '⚠️ Hóa đơn này đã được điều chỉnh rồi (chỉ được điều chỉnh 1 lần)'
  : 'Tạo hóa đơn điều chỉnh'

// ✅ NEW:
canAdjust
  ? 'Tạo hóa đơn điều chỉnh (có thể nhiều lần theo NĐ 123/2020)'
  : 'Chỉ điều chỉnh HĐ đã phát hành'
```

**Benefits:**
- ✅ Users can create multiple adjustments immediately
- ✅ Legal compliance (NĐ 123/2020)
- ✅ No waiting for backend
- ⚠️ Still uses slow `adjustedInvoicesMap` logic

**Effort:** ~30 minutes

---

### 🟢 Option C: Frontend Only - Workaround (Not Recommended)

Fake the `hasBeenAdjusted` field locally:

```typescript
// Add to invoice transform
const enhancedInvoices = invoices.map(inv => ({
  ...inv,
  hasBeenAdjusted: adjustedInvoicesMap.get(inv.id?.toString()) || false
}))
```

**Problems:**
- Still O(n) performance
- Doesn't fix status display issue
- Temporary hack, not sustainable

---

## 🎯 RECOMMENDATION

### For Frontend Team: **Option B** (Allow Multiple Adjustments)

**Immediate action:**
1. Update `canAdjust` logic (30 mins)
2. Change tooltip text (5 mins)
3. Test creating 2nd adjustment (10 mins)

**Total:** 45 minutes to improve UX now

### For Backend Team: **Option A** (Complete Implementation)

**Required work:**
1. Database migration + fix existing data
2. State machine service
3. Update APIs to include `hasBeenAdjusted`

**Total:** ~3.5 hours to fix properly

### Timeline Suggestion

**Week 1:**
- Frontend: Implement Option B (allow multiple adjustments)
- Backend: Complete Option A (state machine + field)

**Week 2:**
- Frontend: Remove `adjustedInvoicesMap` logic
- Frontend: Use `hasBeenAdjusted` from API
- Testing: Full E2E workflow

---

## 📊 IMPACT COMPARISON

| Metric | Current | Option B | Option A (Full) |
|--------|---------|----------|-----------------|
| **Can create multiple adjustments** | ❌ No | ✅ Yes | ✅ Yes |
| **Original status correct** | ❌ No (shows 10) | ❌ No (still 10) | ✅ Yes (shows 4) |
| **Performance** | 🐌 O(n) | 🐌 O(n) | ⚡ O(1) |
| **hasBeenAdjusted field** | ❌ No | ❌ No | ✅ Yes |
| **Pagination bugs** | ❌ Yes | ❌ Yes | ✅ Fixed |
| **Implementation time** | 0 | 45 mins | 3.5 hours |
| **Legal compliance** | ❌ No | ✅ Yes | ✅ Yes |

---

## 📝 TESTING SCENARIOS

### Test 1: Multiple Adjustments

**Current behavior:**
```
1. Create adjustment for invoice #2 → Success
2. Try to create 2nd adjustment → ❌ Blocked by frontend
```

**After Option B:**
```
1. Create adjustment for invoice #2 → Success
2. Try to create 2nd adjustment → ✅ Allowed
```

**After Option A (Backend complete):**
```
1. Create adjustment #1 → Original status = 10
2. Issue adjustment #1 → ✅ Original status = 4 automatically
3. Create adjustment #2 → ✅ Allowed (status 4 can be adjusted)
4. Issue adjustment #2 → ✅ Original stays at 4
```

### Test 2: Status Display

**Current:**
```
Invoice #2: Status = 10 ("Đang điều chỉnh") ← Wrong after adjustment issued
```

**After Option B:**
```
Invoice #2: Status = 10 ("Đang điều chỉnh") ← Still wrong, but can create more
```

**After Option A:**
```
Invoice #2: Status = 4 ("Đã điều chỉnh") ← Correct!
```

---

## 🔗 REFERENCES

- [Nghị định 123/2020/NĐ-CP](https://thuvienphapluat.vn) - Điều 19: Cho phép nhiều lần điều chỉnh
- [Full Implementation Guide](./ADJUSTMENT_INVOICE_FINAL_IMPLEMENTATION.md) - Complete backend solution
- [Invoice Status Constants](../src/constants/invoiceStatus.ts) - Frontend status definitions

---

## 🎓 CONCLUSION

Backend đã sửa **một phần** (có thể bỏ validation "1 lần"), nhưng **chưa hoàn chỉnh**:

### ✅ Backend đã có:
- Create adjustment API
- Issue adjustment API
- `adjustmentReason` field

### ❌ Backend còn thiếu:
- `HasBeenAdjusted` column
- Auto-update status 10→4
- Return `hasBeenAdjusted` in API

### 💡 Next Steps:
1. **Frontend**: Implement Option B (45 mins) để improve UX ngay
2. **Backend**: Complete Option A (3.5 hours) để fix triệt để
3. **Frontend**: Refactor sau khi backend xong

**Status:** ⚠️ Partially Fixed - Need Full Implementation
