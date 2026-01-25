# 📋 Business Rules: Tạo Hóa Đơn Điều Chỉnh & Thay Thế

## 🎯 Tổng Quan

Document này mô tả chi tiết logic nghiệp vụ cho việc tạo **Hóa đơn Điều chỉnh** và **Hóa đơn Thay thế** theo quy định của **NĐ 123/2020/NĐ-CP** và yêu cầu kinh doanh của hệ thống.

## 📊 Bảng Trạng Thái & Quyền Thao Tác

| Trạng thái HĐ hiện tại | Có HĐ con Điều chỉnh | Có HĐ con Thay thế | Lập ĐIỀU CHỈNH | Lập THAY THẾ |
|------------------------|---------------------|-------------------|----------------|--------------|
| 🆕 **Gốc (Mới)**       | ❌ Không            | ❌ Không          | ✅ OK          | ✅ OK        |
| 📝 **Đã bị Điều chỉnh** | ✅ Có               | ❌ Không          | ✅ OK (Lập tiếp) | ❌ BLOCK (Luật 1) |
| ⚰️ **Đã bị Thay thế**  | ❌ Không            | ✅ Có             | ❌ BLOCK (HĐ chết) | ❌ BLOCK (HĐ chết) |
| 🔄 **Là HĐ Thay thế**  | ❌ Không            | ❌ Không          | ✅ OK (Luật 2) | ✅ OK (Case 1) |
| 📋 **Là HĐ Điều chỉnh** | ❌ Không            | ❌ Không          | ✅ OK (Chính cho chính) | ❌ BLOCK (Thường không ai thay thế HĐ điều chỉnh) |

## 🔑 Các Luật Nghiệp Vụ Quan Trọng

### ⚠️ Luật 1: HĐ Đã Bị Điều Chỉnh → KHÔNG Thể Thay Thế

```typescript
// ❌ SAI - Logic cũ
const canReplace = (isIssued || isAdjusted) && !isAdjusted

// ✅ ĐÚNG - Logic mới
const canReplace = 
  (isIssued || isAdjusted) &&      // HĐ đã phát hành
  !isAdjustmentInvoice &&          // KHÔNG phải HĐ điều chỉnh
  !hasAdjustmentChild &&           // CHƯA bị điều chỉnh (Luật 1) ⭐
  !hasReplacementChild             // CHƯA bị thay thế (HĐ chết)
```

**Giải thích:**
- Nếu HĐ gốc đã có **HĐ con điều chỉnh** → Không được tạo **HĐ thay thế** nữa
- Lý do: Tránh conflict giữa 2 luồng điều chỉnh và thay thế
- Ví dụ: HĐ #001 đã điều chỉnh → chỉ có thể điều chỉnh tiếp, không thể thay thế

### ✅ Luật 2: HĐ Thay Thế → CÓ THỂ Điều Chỉnh

```typescript
// ✅ HĐ Thay thế là 1 HĐ hợp lệ mới → có thể điều chỉnh
const canAdjust = 
  (isIssued || isAdjusted) &&      // HĐ đã phát hành
  !hasReplacementChild             // CHƯA bị thay thế (HĐ chết)

// invoiceType = REPLACEMENT vẫn OK!
```

**Giải thích:**
- HĐ Thay thế là một **hóa đơn gốc mới** (Original Invoice v2)
- Có đầy đủ giá trị pháp lý → có thể điều chỉnh nếu có sai sót
- Ví dụ: HĐ #002 (Thay thế HĐ #001) → Có thể tạo HĐ #003 (Điều chỉnh HĐ #002)

### ⚰️ Khái Niệm "HĐ Chết" (Dead Invoice)

```typescript
// HĐ đã bị thay thế = HĐ chết
const isReplacedByChild = hasReplacementChild(invoice, allInvoices)

if (isReplacedByChild) {
  canAdjust = false   // ❌ Không thể điều chỉnh
  canReplace = false  // ❌ Không thể thay thế
}
```

**Giải thích:**
- HĐ đã bị thay thế → **không còn giá trị pháp lý**
- Mọi thao tác điều chỉnh/thay thế phải thực hiện trên **HĐ thay thế mới**
- Ví dụ: HĐ #001 đã bị thay thế bởi HĐ #002 → HĐ #001 là HĐ chết, chỉ tương tác với HĐ #002

### 🔄 Case 1: HĐ Thay Thế → CÓ THỂ Thay Thế Tiếp (Replacement Chain)

```typescript
// ✅ Cho phép chuỗi thay thế: HĐ #001 → HĐ #002 → HĐ #003
const canReplace = 
  (isIssued || isAdjusted) &&      // HĐ đã phát hành
  !isAdjustmentInvoice &&          // KHÔNG phải HĐ điều chỉnh
  !hasAdjustmentChild &&           // CHƯA bị điều chỉnh
  !hasReplacementChild             // CHƯA bị thay thế

// invoiceType = REPLACEMENT vẫn OK! Không filter ra
```

**Giải thích:**
- HĐ Thay thế có thể được thay thế tiếp nếu cần
- Tạo chuỗi thay thế: Original → Replacement 1 → Replacement 2 → ...
- Ví dụ: HĐ #002 (Thay thế #001) → Có thể tạo HĐ #003 (Thay thế #002)

## 💻 Implementation Code

### 1. Helper Functions (invoiceService.ts)

```typescript
/**
 * Check if invoice has adjustment child (trong danh sách)
 */
export const hasAdjustmentChild = (
  invoice: InvoiceListItem, 
  allInvoices: InvoiceListItem[]
): boolean => {
  return allInvoices.some(inv => 
    inv.originalInvoiceID === invoice.invoiceID && 
    inv.invoiceType === INVOICE_TYPE.ADJUSTMENT
  );
};

/**
 * Check if invoice has replacement child (trong danh sách)
 */
export const hasReplacementChild = (
  invoice: InvoiceListItem, 
  allInvoices: InvoiceListItem[]
): boolean => {
  return allInvoices.some(inv => 
    inv.originalInvoiceID === invoice.invoiceID && 
    inv.invoiceType === INVOICE_TYPE.REPLACEMENT
  );
};

/**
 * Check if single invoice has adjustment child (query backend)
 * Dùng cho InvoiceDetail page (chỉ load 1 invoice)
 */
export const checkHasAdjustmentChild = async (
  invoiceId: number
): Promise<boolean> => {
  const allInvoices = await getAllInvoices()
  return allInvoices.some(inv => 
    inv.originalInvoiceID === invoiceId && 
    inv.invoiceType === INVOICE_TYPE.ADJUSTMENT
  )
};

/**
 * Check if single invoice has replacement child (query backend)
 * Dùng cho InvoiceDetail page (chỉ load 1 invoice)
 */
export const checkHasReplacementChild = async (
  invoiceId: number
): Promise<boolean> => {
  const allInvoices = await getAllInvoices()
  return allInvoices.some(inv => 
    inv.originalInvoiceID === invoiceId && 
    inv.invoiceType === INVOICE_TYPE.REPLACEMENT
  )
};
```

### 2. Logic trong InvoiceManagement.tsx

```typescript
// ✅ Check child invoice existence
const isReplacedByChild = invoiceService.hasReplacementChild(invoice, invoices)
const isAdjustedByChild = invoiceService.hasAdjustmentChild(invoice, invoices)

// ✅ Logic tạo HĐ điều chỉnh
const canAdjust = (isIssued || isAdjusted) && !isReplacedByChild

// ✅ Logic tạo HĐ thay thế  
const canReplace = 
  (isIssued || isAdjusted) &&     // HĐ đã phát hành
  !isAdjustmentInvoice &&          // KHÔNG phải HĐ điều chỉnh
  !isAdjustedByChild &&            // CHƯA bị điều chỉnh (Luật 1)
  !isReplacedByChild               // CHƯA bị thay thế (HĐ chết)
```

### 3. Logic trong InvoiceDetail.tsx

```typescript
// State để track child invoice
const [hasAdjustmentChildState, setHasAdjustmentChildState] = useState(false)
const [hasReplacementChildState, setHasReplacementChildState] = useState(false)

// useEffect để check child invoice
useEffect(() => {
  const checkMinuteStatus = async () => {
    if (!invoice?.invoiceID) return
    
    // ... check minute status code ...
    
    // ✅ Check child invoice existence
    const [hasAdjChild, hasReplChild] = await Promise.all([
      invoiceService.checkHasAdjustmentChild(invoice.invoiceID),
      invoiceService.checkHasReplacementChild(invoice.invoiceID)
    ])
    setHasAdjustmentChildState(hasAdjChild)
    setHasReplacementChildState(hasReplChild)
  }
  
  checkMinuteStatus()
}, [invoice?.invoiceID])

// ✅ Logic tạo HĐ điều chỉnh
const canCreateAdjustmentInvoice = 
  (isIssued || isAdjusted) && 
  !hasReplacementChildState && 
  adjustmentMinuteStatus.hasValidMinute

// ✅ Logic tạo HĐ thay thế
const canCreateReplacementInvoice = 
  (isIssued || isAdjusted) && 
  !isAdjustmentInvoice && 
  !hasAdjustmentChildState && 
  !hasReplacementChildState && 
  replacementMinuteStatus.hasValidMinute
```

## 🧪 Test Cases

### Test Case 1: HĐ Gốc Mới
```
Given: HĐ #001 - Type: ORIGINAL, Status: ISSUED
       Không có HĐ con

When:  Kiểm tra quyền tạo HĐ điều chỉnh
Then:  ✅ Cho phép (có biên bản hợp lệ)

When:  Kiểm tra quyền tạo HĐ thay thế  
Then:  ✅ Cho phép (có biên bản hợp lệ)
```

### Test Case 2: HĐ Đã Bị Điều Chỉnh (Luật 1)
```
Given: HĐ #001 - Type: ORIGINAL, Status: ADJUSTED
       HĐ #002 - Type: ADJUSTMENT, originalInvoiceID: 1

When:  Kiểm tra quyền tạo HĐ điều chỉnh cho HĐ #001
Then:  ✅ Cho phép (điều chỉnh nhiều lần)

When:  Kiểm tra quyền tạo HĐ thay thế cho HĐ #001
Then:  ❌ BLOCK - "HĐ đã bị điều chỉnh không thể thay thế" (Luật 1)
```

### Test Case 3: HĐ Chết (Đã Bị Thay Thế)
```
Given: HĐ #001 - Type: ORIGINAL, Status: ISSUED
       HĐ #002 - Type: REPLACEMENT, originalInvoiceID: 1

When:  Kiểm tra quyền tạo HĐ điều chỉnh cho HĐ #001
Then:  ❌ BLOCK - "HĐ đã bị thay thế (HĐ chết)"

When:  Kiểm tra quyền tạo HĐ thay thế cho HĐ #001
Then:  ❌ BLOCK - "HĐ đã bị thay thế (HĐ chết)"
```

### Test Case 4: HĐ Thay Thế (Luật 2 & Case 1)
```
Given: HĐ #002 - Type: REPLACEMENT, Status: ISSUED
       Không có HĐ con

When:  Kiểm tra quyền tạo HĐ điều chỉnh
Then:  ✅ Cho phép (Luật 2: HĐ thay thế có thể điều chỉnh)

When:  Kiểm tra quyền tạo HĐ thay thế
Then:  ✅ Cho phép (Case 1: HĐ thay thế có thể thay thế tiếp)
```

### Test Case 5: HĐ Điều Chỉnh
```
Given: HĐ #002 - Type: ADJUSTMENT, Status: ISSUED
       Không có HĐ con

When:  Kiểm tra quyền tạo HĐ điều chỉnh
Then:  ✅ Cho phép (HĐ điều chỉnh có thể điều chỉnh tiếp)

When:  Kiểm tra quyền tạo HĐ thay thế
Then:  ❌ BLOCK - "HĐ điều chỉnh không thể thay thế"
```

## 📌 Lưu Ý Quan Trọng

### 1. Điều Kiện Bổ Sung
Ngoài logic nghiệp vụ trên, còn cần kiểm tra:
- ✅ **Biên bản hợp lệ**: `hasValidMinute` từ minuteService
- ✅ **Trạng thái nội bộ**: `ISSUED` hoặc `ADJUSTED`
- ✅ **Quyền hạn**: Sale role bị ẩn các action điều chỉnh/thay thế

### 2. Performance Considerations
- **InvoiceManagement**: Đã có `allInvoices` → Dùng helper synchronous
- **InvoiceDetail**: Chỉ có 1 invoice → Cần query backend async

### 3. Future Enhancements
Có thể tối ưu bằng cách thêm fields vào backend API response:
```typescript
interface InvoiceListItem {
  // ... existing fields ...
  hasAdjustmentChild?: boolean   // Calculated by backend
  hasReplacementChild?: boolean  // Calculated by backend
}
```

## 🔗 Related Documents
- [ADJUSTMENT_INVOICE_IMPLEMENTATION_GUIDE.md](ADJUSTMENT_INVOICE_IMPLEMENTATION_GUIDE.md)
- [BACKEND_INVOICE_REQUEST_API_REQUIREMENTS.md](BACKEND_INVOICE_REQUEST_API_REQUIREMENTS.md)
- [NĐ 123/2020/NĐ-CP](https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-123-2020-ND-CP-hoa-don-chung-tu-457740.aspx)

---

**Last Updated**: 2024  
**Author**: AI Assistant  
**Status**: ✅ Implemented & Documented
