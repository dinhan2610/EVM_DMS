# Backend Sign API - Recommendations để Fix Transaction Issue

## 🐛 Vấn đề hiện tại

**Symptom:**
```
POST /api/Invoice/72/sign → 400 "Không có số hóa đơn"
→ Status đã update: 7 → 8 (SIGNED)
→ InvoiceNumber vẫn: 0 (chưa cấp)
→ User phải retry lần 2 mới thành công
```

**Root cause:** Transaction không atomic - Status được update trước khi generate số

---

## ✅ Solution 1: Atomic Transaction (RECOMMENDED)

### Sử dụng Database Transaction

```csharp
[HttpPost("{id}/sign")]
public async Task<IActionResult> SignInvoice(int id)
{
    // Start transaction
    using (var transaction = await _context.Database.BeginTransactionAsync())
    {
        try 
        {
            var invoice = await _context.Invoices
                .Include(i => i.Template)
                .FirstOrDefaultAsync(i => i.InvoiceID == id);
            
            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });
            
            // Validate status
            if (invoice.InvoiceStatusID != 7) // Not PENDING_SIGN
                return BadRequest(new { 
                    message = "Ký số thất bại", 
                    errors = new[] { "Hóa đơn không ở trạng thái chờ ký" } 
                });
            
            // Generate invoice number FIRST (before status change)
            var invoiceNumber = await GenerateInvoiceNumber(invoice.TemplateID);
            
            if (invoiceNumber == null || invoiceNumber == 0)
            {
                // Rollback - không commit transaction
                return BadRequest(new { 
                    message = "Ký số thất bại", 
                    errors = new[] { "Lỗi: Không có số hóa đơn." } 
                });
            }
            
            // Update invoice - both fields together
            invoice.InvoiceNumber = invoiceNumber;
            invoice.InvoiceStatusID = 8; // SIGNED_PENDING_ISSUE
            invoice.SignDate = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            
            // Commit transaction - only if everything succeeded
            await transaction.CommitAsync();
            
            return Ok(new { 
                invoiceNumber = invoice.InvoiceNumber,
                message = "Đã kích hoạt ký số thành công" 
            });
        }
        catch (Exception ex)
        {
            // Rollback on any error
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error signing invoice {InvoiceId}", id);
            
            return StatusCode(500, new { 
                message = "Ký số thất bại", 
                errors = new[] { ex.Message } 
            });
        }
    }
}
```

---

## ✅ Solution 2: Generate Number First (Alternative)

Nếu không thể dùng transaction, generate số TRƯỚC khi update status:

```csharp
[HttpPost("{id}/sign")]
public async Task<IActionResult> SignInvoice(int id)
{
    var invoice = await _context.Invoices
        .Include(i => i.Template)
        .FirstOrDefaultAsync(i => i.InvoiceID == id);
    
    if (invoice == null)
        return NotFound();
    
    // Validate status
    if (invoice.InvoiceStatusID != 7)
        return BadRequest(new { 
            message = "Hóa đơn không ở trạng thái chờ ký" 
        });
    
    // ✅ STEP 1: Generate number FIRST
    var invoiceNumber = await GenerateInvoiceNumber(invoice.TemplateID);
    
    // ✅ STEP 2: Fail early if no number
    if (invoiceNumber == null || invoiceNumber == 0)
    {
        return BadRequest(new { 
            message = "Ký số thất bại", 
            errors = new[] { "Lỗi: Không có số hóa đơn." } 
        });
    }
    
    // ✅ STEP 3: Update both fields together (after validation passed)
    invoice.InvoiceNumber = invoiceNumber;
    invoice.InvoiceStatusID = 8;
    invoice.SignDate = DateTime.UtcNow;
    
    await _context.SaveChangesAsync();
    
    return Ok(new { 
        invoiceNumber = invoice.InvoiceNumber,
        message = "Đã kích hoạt ký số thành công" 
    });
}
```

---

## ✅ Solution 3: Add Idempotency Check

Xử lý retry an toàn khi invoice đã signed:

```csharp
[HttpPost("{id}/sign")]
public async Task<IActionResult> SignInvoice(int id)
{
    var invoice = await _context.Invoices.FindAsync(id);
    
    if (invoice == null)
        return NotFound();
    
    // ✅ Idempotency: Nếu đã ký + có số → return success
    if (invoice.InvoiceStatusID == 8 && invoice.InvoiceNumber > 0)
    {
        return Ok(new { 
            invoiceNumber = invoice.InvoiceNumber,
            message = "Hóa đơn đã được ký số trước đó" 
        });
    }
    
    // ✅ Recovery: Nếu đã ký nhưng chưa có số → cấp số
    if (invoice.InvoiceStatusID == 8 && invoice.InvoiceNumber == 0)
    {
        var invoiceNumber = await GenerateInvoiceNumber(invoice.TemplateID);
        
        if (invoiceNumber == null || invoiceNumber == 0)
        {
            return BadRequest(new { 
                message = "Ký số thất bại", 
                errors = new[] { "Lỗi: Không có số hóa đơn." } 
            });
        }
        
        invoice.InvoiceNumber = invoiceNumber;
        await _context.SaveChangesAsync();
        
        return Ok(new { 
            invoiceNumber = invoice.InvoiceNumber,
            message = "Đã kích hoạt ký số thành công" 
        });
    }
    
    // Normal flow: chưa ký
    if (invoice.InvoiceStatusID != 7)
    {
        return BadRequest(new { 
            message = "Hóa đơn không ở trạng thái chờ ký" 
        });
    }
    
    // Continue with signing...
}
```

---

## 🔍 Fix GenerateInvoiceNumber Method

Đảm bảo method này robust:

```csharp
private async Task<int?> GenerateInvoiceNumber(int templateId)
{
    try 
    {
        var template = await _context.InvoiceTemplates
            .FirstOrDefaultAsync(t => t.TemplateID == templateId && t.IsActive);
        
        if (template == null)
        {
            _logger.LogWarning("Template {TemplateId} not found or inactive", templateId);
            return null;
        }
        
        // Get next number from serial
        var serial = await _context.InvoiceSerials
            .FirstOrDefaultAsync(s => s.Serial == template.Serial && s.IsActive);
        
        if (serial == null)
        {
            _logger.LogWarning("Serial {Serial} not found or inactive", template.Serial);
            return null;
        }
        
        // Check if serial has available numbers
        if (serial.CurrentNumber >= serial.ToNumber)
        {
            _logger.LogWarning("Serial {Serial} exhausted: {Current}/{Max}", 
                template.Serial, serial.CurrentNumber, serial.ToNumber);
            return null;
        }
        
        // Increment and get next number
        serial.CurrentNumber++;
        await _context.SaveChangesAsync();
        
        return serial.CurrentNumber;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error generating invoice number for template {TemplateId}", templateId);
        return null;
    }
}
```

---

## 📊 Priority của fixes

### 🔴 Critical (Bắt buộc)
1. **Solution 1: Atomic Transaction** - Ngăn inconsistent state
2. **Fix GenerateInvoiceNumber** - Add proper logging & error handling

### 🟡 High Priority (Nên có)
3. **Solution 3: Idempotency Check** - Handle retry gracefully
4. **Add logging** - Track all sign attempts với InvoiceID, TemplateID, Serial

### 🟢 Nice to Have
5. **Add metrics** - Monitor sign success/failure rate
6. **Add serial exhaustion alert** - Warning khi serial gần hết

---

## 🧪 Test Cases cần verify

```
✅ Test 1: Happy path
   - Invoice status = 7
   - Serial có số available
   → Result: Status = 8, Number > 0

❌ Test 2: Serial exhausted
   - Serial.CurrentNumber >= Serial.ToNumber
   → Result: Status = 7 (không đổi), Error message

❌ Test 3: Template inactive
   - Template.IsActive = false
   → Result: Status = 7 (không đổi), Error message

✅ Test 4: Retry after partial failure
   - Invoice status = 8, Number = 0
   → Result: Cấp số thành công, không đổi status

✅ Test 5: Duplicate sign
   - Invoice status = 8, Number > 0
   → Result: Idempotent, return existing number
```

---

## 📝 Response Contract

Đảm bảo API luôn trả về format consistent:

```json
// Success
{
  "invoiceNumber": 21,
  "message": "Đã kích hoạt ký số thành công"
}

// Error
{
  "message": "Ký số thất bại",
  "errors": ["Lỗi: Không có số hóa đơn."]
}
```

---

## 🎯 Kết luận

**Implement theo thứ tự:**
1. ✅ Solution 1 (Atomic Transaction) - Fix root cause
2. ✅ Fix GenerateInvoiceNumber - Robust error handling  
3. ✅ Solution 3 (Idempotency) - Better retry experience
4. ✅ Add comprehensive logging

**Frontend đã handle tốt** nhờ recovery logic, nhưng backend fix sẽ:
- Giảm số lần user phải retry
- Tránh inconsistent state trong database
- Dễ debug khi có vấn đề

**Timeline đề xuất:** 1-2 sprints
