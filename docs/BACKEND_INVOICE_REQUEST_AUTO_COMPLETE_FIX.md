# 🐛 Backend Fix: Auto-Complete Invoice Request Status

**Phát hiện lỗi:** 19/01/2026  
**Mức độ:** 🔴 CRITICAL - Workflow broken  
**Ảnh hưởng:** Invoice Request status không được cập nhật đúng

---

## 🚨 VẤN ĐỀ

### Workflow mong muốn:
```
1. Sale tạo request → statusID = PENDING (1)
2. KTT duyệt → statusID = APPROVED (2)
3. Kế toán tạo hóa đơn → statusID = COMPLETED (5) ✅ TỰ ĐỘNG
```

### Thực tế hiện tại:
```
1. Sale tạo request → statusID = PENDING (1) ✅
2. KTT duyệt → statusID = APPROVED (2) ✅  
3. Kế toán tạo hóa đơn → statusID = REJECTING (3) ❌ SAI!
```

**Root Cause:**
- Backend API `POST /api/Invoice` nhận được `requestID` từ frontend
- Nhưng **KHÔNG TỰ ĐỘNG** cập nhật status của InvoiceRequest
- Hoặc cập nhật SAI thành REJECTING (3) thay vì COMPLETED (5)

---

## 📋 BACKEND FIX REQUIRED

### File cần sửa: `InvoiceController.cs`

**Method:** `POST /api/Invoice`

### ✅ Logic cần implement:

```csharp
[HttpPost]
public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
{
    try
    {
        // 1. Tạo hóa đơn như bình thường
        var invoice = new Invoice
        {
            TemplateID = dto.TemplateID,
            CustomerID = dto.CustomerID,
            // ... các field khác
            RequestID = dto.RequestID  // ⭐ Link với Invoice Request (nullable)
        };
        
        await _context.Invoices.AddAsync(invoice);
        await _context.SaveChangesAsync();
        
        // 2. ⭐ NẾU có requestID: Tự động cập nhật InvoiceRequest
        if (dto.RequestID.HasValue && dto.RequestID.Value > 0)
        {
            var invoiceRequest = await _context.InvoiceRequests
                .FirstOrDefaultAsync(r => r.RequestID == dto.RequestID.Value);
            
            if (invoiceRequest != null)
            {
                // ✅ CẬP NHẬT STATUS → COMPLETED (5)
                invoiceRequest.StatusID = 5;  // COMPLETED
                invoiceRequest.StatusName = "Hoàn thành";
                
                // ✅ LƯU THÔNG TIN HÓA ĐƠN
                invoiceRequest.InvoiceID = invoice.InvoiceID;
                invoiceRequest.InvoiceNumber = invoice.InvoiceNumber;
                invoiceRequest.CompletedDate = DateTime.UtcNow;
                
                // ✅ LƯU VÀO DATABASE
                _context.InvoiceRequests.Update(invoiceRequest);
                await _context.SaveChangesAsync();
                
                // 📝 Log
                _logger.LogInformation(
                    $"Auto-completed InvoiceRequest #{dto.RequestID} → Invoice #{invoice.InvoiceID}"
                );
            }
            else
            {
                _logger.LogWarning(
                    $"InvoiceRequest #{dto.RequestID} not found for auto-complete"
                );
            }
        }
        
        // 3. Trả về response
        return Ok(new
        {
            InvoiceID = invoice.InvoiceID,
            InvoiceNumber = invoice.InvoiceNumber,
            Message = "Invoice created successfully"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating invoice");
        return StatusCode(500, "Internal server error");
    }
}
```

---

## 🔍 KIỂM TRA ENUM STATUS

### File: `InvoiceRequestStatus.cs` (hoặc Enum definition)

```csharp
public enum InvoiceRequestStatus
{
    PENDING = 1,      // Chờ duyệt
    APPROVED = 2,     // Đã duyệt - Chờ kế toán tạo HĐ
    REJECTING = 3,    // Đang từ chối
    CANCELLED = 4,    // Đã hủy bởi Sale
    COMPLETED = 5     // ✅ Hoàn thành - Đã xuất HĐ
}
```

**⚠️ ĐẢM BẢO:** 
- Status ID phải khớp với database
- COMPLETED = 5 (KHÔNG PHẢI 4 hay số khác)
- Frontend đang dùng đúng: `InvoiceRequestStatus.COMPLETED = 5`

---

## 📊 DATABASE SCHEMA

### Table: `InvoiceRequests`

**Cần có các cột:**
```sql
ALTER TABLE InvoiceRequests
ADD InvoiceID INT NULL,                    -- Link đến Invoices.InvoiceID
    InvoiceNumber NVARCHAR(50) NULL,       -- Số hóa đơn
    CompletedDate DATETIME NULL;           -- Ngày hoàn thành
```

**Foreign Key:**
```sql
ALTER TABLE InvoiceRequests
ADD CONSTRAINT FK_InvoiceRequests_Invoices
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID);
```

---

## 🧪 TESTING

### Test Case 1: Tạo hóa đơn từ Invoice Request
```bash
# 1. Sale tạo request
POST /api/InvoiceRequest
Response: { requestID: 123, statusID: 1, statusName: "Chờ duyệt" }

# 2. KTT duyệt
POST /api/InvoiceRequest/123/approve
Response: { requestID: 123, statusID: 2, statusName: "Đã duyệt" }

# 3. Kế toán tạo hóa đơn
POST /api/Invoice
Body: {
  templateID: 1,
  customerID: 34,
  requestID: 123,  # ⭐ Link với request
  ...
}
Response: { 
  invoiceID: 456, 
  invoiceNumber: "HD-2026-150" 
}

# 4. ✅ CHECK: InvoiceRequest tự động cập nhật
GET /api/InvoiceRequest/123
Response: { 
  requestID: 123, 
  statusID: 5,              # ✅ COMPLETED
  statusName: "Hoàn thành",
  invoiceID: 456,           # ✅ Linked
  invoiceNumber: "HD-2026-150",
  completedDate: "2026-01-19T00:51:00Z"
}
```

### Test Case 2: Tạo hóa đơn thông thường (không có requestID)
```bash
POST /api/Invoice
Body: {
  templateID: 1,
  customerID: 34,
  requestID: null,  # ⭐ KHÔNG link
  ...
}
Response: { 
  invoiceID: 457, 
  invoiceNumber: "HD-2026-151" 
}

# ✅ Không có side effect (không update request nào)
```

---

## 📝 VALIDATION RULES

### Backend phải kiểm tra:

1. **requestID hợp lệ:**
   ```csharp
   if (dto.RequestID > 0)
   {
       var request = await _context.InvoiceRequests.FindAsync(dto.RequestID);
       if (request == null)
           return BadRequest("Invalid requestID");
       
       if (request.StatusID != 2)  // APPROVED
           return BadRequest("Request must be APPROVED before creating invoice");
   }
   ```

2. **Không tạo trùng hóa đơn:**
   ```csharp
   if (request.InvoiceID.HasValue)
       return BadRequest("Invoice already created for this request");
   ```

3. **Transaction safety:**
   ```csharp
   using var transaction = await _context.Database.BeginTransactionAsync();
   try
   {
       // Create invoice + Update request
       await _context.SaveChangesAsync();
       await transaction.CommitAsync();
   }
   catch
   {
       await transaction.RollbackAsync();
       throw;
   }
   ```

---

## 🔄 MIGRATION SCRIPT (Nếu cần)

### Nếu database thiếu cột:

```sql
-- Thêm cột link hóa đơn
ALTER TABLE InvoiceRequests
ADD InvoiceID INT NULL,
    InvoiceNumber NVARCHAR(50) NULL,
    CompletedDate DATETIME NULL;

-- Thêm foreign key
ALTER TABLE InvoiceRequests
ADD CONSTRAINT FK_InvoiceRequests_Invoices
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
    ON DELETE SET NULL;  -- Nếu xóa invoice, set NULL (không xóa request)

-- Index cho performance
CREATE INDEX IX_InvoiceRequests_InvoiceID 
ON InvoiceRequests(InvoiceID);
```

---

## ✅ VERIFICATION CHECKLIST

**Backend Developer cần kiểm tra:**
- [ ] Enum `InvoiceRequestStatus.COMPLETED = 5` đúng
- [ ] API `POST /api/Invoice` nhận được `requestID` (nullable)
- [ ] Logic auto-update status → COMPLETED (5)
- [ ] Lưu `invoiceID`, `invoiceNumber`, `completedDate`
- [ ] Transaction safety (rollback nếu lỗi)
- [ ] Validation: request phải APPROVED trước
- [ ] Database có đủ cột: `InvoiceID`, `InvoiceNumber`, `CompletedDate`
- [ ] Test case pass: tạo HĐ từ request → status auto COMPLETED

---

## 📞 CONTACT

**Frontend Team:**
- ✅ requestID đã được gửi đúng từ CreateVatInvoice.tsx
- ✅ Enum frontend khớp: `InvoiceRequestStatus.COMPLETED = 5`

**Backend Team:**
- ⏳ Cần implement auto-update logic
- ⏳ Cần verify database schema

**Deadline:** ASAP - Blocking workflow chính

---

## 📚 RELATED DOCS

- `/docs/BACKEND_INVOICE_REQUEST_API_REQUIREMENTS.md` - API spec ban đầu
- `/docs/INVOICE_REQUEST_MANAGEMENT_API_INTEGRATION_COMPLETE.md` - Frontend integration
- `/src/page/CreateVatInvoice.tsx` (Line 1755) - requestID được gửi
- `/src/utils/invoiceAdapter.ts` (Line 71, 326) - requestID interface
