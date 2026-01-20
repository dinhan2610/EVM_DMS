# 🔍 PHÂN TÍCH API RESPONSE - Invoice

**Date:** 19/01/2026  
**Endpoint:** 
- `GET /api/Invoice` - List all invoices
- `GET /api/Invoice/{id}` - Get single invoice detail

---

## 📊 API RESPONSE COMPARISON

Bạn cung cấp 2 responses từ cùng 1 invoice (ID: 206), nhưng có 1 field khác nhau:

### **1. GET /api/Invoice (List)**
```json
{
  "invoiceID": 206,
  "originalInvoiceSymbol": "1C25TAA",  // ✅ CÓ GIÁ TRỊ
  ...
}
```

### **2. GET /api/Invoice/206 (Detail)**
```json
{
  "invoiceID": 206,
  "originalInvoiceSymbol": null,       // ❌ NULL
  ...
}
```

---

## ⚠️ PHÁT HIỆN INCONSISTENCY

### **Field: `originalInvoiceSymbol`**

| Endpoint | Value | Expected |
|----------|-------|----------|
| GET /api/Invoice | `"1C25TAA"` | ✅ Đúng |
| GET /api/Invoice/206 | `null` | ❌ Sai |

**Nguyên nhân khả năng cao:**
- Backend có 2 query khác nhau cho list vs detail
- Query detail có thể missing JOIN với bảng chứa `originalInvoiceSymbol`
- Hoặc backend trả về DTO khác nhau

---

## 🔧 CÁCH XỬ LÝ TRÊN FRONTEND

### **Option 1: Fallback logic** ✅ (Recommended)
```typescript
// Trong component hiển thị invoice detail
const invoiceSymbol = invoice.originalInvoiceSymbol || 
                      invoice.invoiceSymbol || 
                      'N/A';
```

### **Option 2: Request fix từ backend** 🎯 (Long-term)
```csharp
// Backend controller GET /api/Invoice/{id}
// Cần đảm bảo query bao gồm originalInvoiceSymbol
public async Task<IActionResult> GetInvoiceById(int id)
{
    var invoice = await _context.Invoices
        .Include(i => i.OriginalInvoice)  // ✅ Ensure JOIN
        .FirstOrDefaultAsync(i => i.InvoiceID == id);
        
    return Ok(new {
        ...invoice,
        originalInvoiceSymbol = invoice.OriginalInvoice?.Symbol  // ✅ Map correctly
    });
}
```

---

## 📋 FULL INVOICE RESPONSE FIELDS

### **Invoice Object (GET /api/Invoice/206)**

```typescript
interface InvoiceResponse {
  // ==================== BASIC INFO ====================
  invoiceID: number;              // 206
  requestID: number | null;       // null (tạo trực tiếp) hoặc 123 (tạo từ request)
  templateID: number;             // 15
  invoiceNumber: number;          // 55
  invoiceStatusID: number;        // 2 (Đã phát hành)
  paymentStatusID: number;        // 1 (Chưa thanh toán)
  companyId: number;              // 1
  customerID: number;             // 12
  salesID: number | null;         // null (tạo trực tiếp) hoặc 5 (từ request)
  issuerID: number;               // 1 (User phát hành)
  
  // ==================== INVOICE TYPE & ORIGINAL ====================
  invoiceType: number;            // 3 (Hóa đơn điều chỉnh/thay thế)
  originalInvoiceID: number;      // 205
  originalInvoiceNumber: number;  // 54
  originalInvoiceSignDate: string; // "2026-01-19T12:48:15.289477Z"
  originalInvoiceSymbol: string | null; // ⚠️ "1C25TAA" hoặc null (inconsistent)
  adjustmentReason: string;       // "(Thay thế cho hóa đơn...)"
  
  // ==================== AMOUNTS ====================
  subtotalAmount: number;         // 50420000 (Tiền hàng chưa VAT)
  vatRate: number;                // 0.08 (8%)
  vatAmount: number;              // 42000 (Tiền thuế)
  totalAmount: number;            // 50462000 (Tổng thanh toán)
  totalAmountInWords: string;     // "Năm mươi triệu..."
  paidAmount: number;             // 0
  remainingAmount: number;        // 50462000
  
  // ==================== DATES ====================
  signDate: string;               // "2026-01-19T12:49:39.512042Z"
  issuedDate: string;             // "2026-01-19T12:49:47.37338Z"
  paymentDueDate: string;         // "2026-02-18T12:49:04.44269Z"
  createdAt: string;              // "2026-01-19T12:49:04.442209Z"
  
  // ==================== CUSTOMER INFO ====================
  customerName: string;           // "Công ty Hải Âu"
  customerAddress: string;        // "Thủ Đức - Hồ Chí Minh"
  customerEmail: string;          // "vncrowncc@gmail.com"
  taxCode: string;                // "0123456789"
  
  // ==================== PAYMENT & STATUS ====================
  paymentMethod: string;          // "Tiền mặt"
  paymentStatus: string;          // "Unpaid"
  notes: string;                  // "Kế toán trưởng đã duyệt"
  
  // ==================== DIGITAL SIGNATURE & TAX ====================
  digitalSignature: string;       // Long RSA signature
  taxAuthorityCode: string;       // "A126E1D682A0B48AE9E22BBD938C3D6881"
  taxStatusCode: string;          // "KQ01"
  taxStatusDescription: string;   // "Đã cấp mã CQT"
  taxStatusColor: string;         // "success"
  qrCodeData: string | null;      // null
  
  // ==================== FILES ====================
  filePath: string;               // Cloudinary PDF URL
  xmlPath: string;                // Cloudinary XML URL
  
  // ==================== ITEMS ====================
  invoiceItems: InvoiceItem[];
}

interface InvoiceItem {
  productId: number;              // 4
  productName: string;            // "Test Product"
  unit: string;                   // "cái"
  quantity: number;               // 2
  amount: number;                 // 220000 (Tiền chưa VAT)
  vatAmount: number;              // 22000 (Tiền VAT)
}
```

---

## 🎯 FIELDS QUAN TRỌNG CHO 2 MODE TẠO HÓA ĐƠN

### **Tạo trực tiếp:**
```json
{
  "requestID": null,        // ❌ Không link với request
  "salesID": null,         // ❌ Không có sale
  "issuerID": 10,          // ✅ Accountant tạo
  "invoiceType": 1,        // Hóa đơn thường
  "originalInvoiceID": null
}
```

### **Tạo từ Invoice Request:**
```json
{
  "requestID": 123,        // ✅ Link với request #123
  "salesID": 5,           // ✅ Sale tạo request
  "issuerID": 10,         // ✅ Accountant xử lý
  "invoiceType": 1,       // Hóa đơn thường
  "originalInvoiceID": null
}
```

### **Hóa đơn điều chỉnh/thay thế:**
```json
{
  "invoiceType": 3,                    // ✅ Replacement
  "originalInvoiceID": 205,            // ✅ Link với HĐ gốc
  "originalInvoiceNumber": 54,
  "originalInvoiceSignDate": "...",
  "originalInvoiceSymbol": "1C25TAA",  // ⚠️ Có thể null ở detail endpoint
  "adjustmentReason": "(Thay thế cho...)"
}
```

---

## 🐛 BUGS PHÁT HIỆN

### **1. originalInvoiceSymbol inconsistency**
- **List endpoint:** Trả về `"1C25TAA"`
- **Detail endpoint:** Trả về `null`
- **Impact:** UI hiển thị thiếu thông tin khi xem chi tiết
- **Fix:** Backend cần sửa query detail endpoint

### **2. invoiceNumber type inconsistency**
```typescript
// API trả về number
"invoiceNumber": 55

// Nhưng type definition có thể là string
invoiceNumber?: number | string;  // ⚠️ Cần chuẩn hóa
```

---

## ✅ RECOMMENDATIONS

### **1. Frontend - Type Safety**
```typescript
interface InvoiceResponse {
  originalInvoiceSymbol: string | null;  // ✅ Cho phép null
  invoiceNumber: number;                 // ✅ Chỉ number (backend chuẩn)
  salesID: number | null;                // ✅ null = tạo trực tiếp
  requestID: number | null;              // ✅ null = không từ request
}
```

### **2. Backend - Consistency**
```csharp
// Đảm bảo list và detail trả về cùng structure
public InvoiceDTO MapToDTO(Invoice invoice)
{
    return new InvoiceDTO
    {
        // ... other fields
        OriginalInvoiceSymbol = invoice.OriginalInvoice?.Symbol,  // ✅ Map cho cả 2 endpoints
    };
}
```

### **3. Display Logic**
```typescript
// Component hiển thị invoice
const displaySymbol = invoice.originalInvoiceSymbol || 
                     `${invoice.originalInvoiceNumber || 'N/A'}`;

const displaySales = invoice.salesID 
  ? `Sale #${invoice.salesID}` 
  : 'Tạo trực tiếp';
```

---

## 📋 TESTING CHECKLIST

- [ ] Test GET /api/Invoice - verify originalInvoiceSymbol có giá trị
- [ ] Test GET /api/Invoice/{id} - verify originalInvoiceSymbol có giá trị
- [ ] Test tạo HĐ trực tiếp → verify requestID=null, salesID=null
- [ ] Test tạo HĐ từ request → verify requestID có giá trị, salesID có giá trị
- [ ] Test HĐ điều chỉnh → verify originalInvoiceSymbol hiển thị đúng

---

**Kết luận:** API response structure đã tốt, chỉ cần fix `originalInvoiceSymbol` ở detail endpoint và đảm bảo type consistency.
