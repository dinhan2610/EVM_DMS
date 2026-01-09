# 🚨 BACKEND: Fix Lỗi Authentication Token

**Date:** January 9, 2026  
**Priority:** 🔴🔴🔴 CRITICAL  
**ETA:** 10 phút

---

## ❌ **VẤN ĐỀ:**

```
PUT /api/Invoice/draft/118 → 500 Internal Server Error
{
  "title": "An internal server error occurred.",
  "status": 500,
  "detail": "User ID not found in token."
}
```

**Frontend payload hoàn toàn đúng!** Lỗi 100% từ backend authentication.

---

## 🔍 **ROOT CAUSE:**

### **Tại sao CREATE thành công nhưng UPDATE lại lỗi?**

**Cùng JWT token, nhưng backend code KHÁC NHAU:**

```csharp
// ✅ CREATE endpoint - Check nhiều claim types
[HttpPost]
public async Task<IActionResult> CreateInvoice(...)
{
    var claim = User.FindFirst(ClaimTypes.NameIdentifier)
             ?? User.FindFirst("sub")          // ← TÌM ĐƯỢC!
             ?? User.FindFirst("userId");
    
    userId = int.Parse(claim.Value);
    // ✅ THÀNH CÔNG
}

// ❌ UPDATE endpoint - Chỉ check 1 claim
[HttpPut("draft/{id}")]
public async Task<IActionResult> UpdateDraftInvoice(...)
{
    var claim = User.FindFirst(ClaimTypes.NameIdentifier); // ← NULL!
    
    if (claim == null)
        throw new Exception("User ID not found in token");
}
```

**Giải thích:**
- JWT token có claim name là `"sub"` (không phải `ClaimTypes.NameIdentifier`)
- CREATE check nhiều claims → Tìm được `"sub"` → OK ✅
- UPDATE chỉ check 1 claim → NULL → Lỗi ❌

---

## ✅ **GIẢI PHÁP (10 PHÚT):**

### **BƯỚC 1: Tìm file InvoiceController.cs**

```bash
cd /path/to/backend-project
find . -name "InvoiceController.cs" -type f
```

### **BƯỚC 2: So sánh CREATE vs UPDATE**

```bash
# Xem CREATE method
grep -A 30 "public.*CreateInvoice" Controllers/InvoiceController.cs | grep -A 10 "User.FindFirst"

# Xem UPDATE method
grep -A 30 "UpdateDraftInvoice" Controllers/InvoiceController.cs | grep -A 10 "User.FindFirst"
```

**Kiểm tra:**
- CREATE có check nhiều claims không? (`?? User.FindFirst("sub")`)
- UPDATE có check nhiều claims không?
- Nếu KHÁC NHAU → Copy từ CREATE sang UPDATE!

---

### **BƯỚC 3: THÊM CODE VÀO UPDATE METHOD**

**Mở file:** `Controllers/InvoiceController.cs`

**Tìm method:** `UpdateDraftInvoice` hoặc `[HttpPut("draft/{id}")]`

**THÊM CODE NÀY VÀO ĐẦU METHOD:**

```csharp
[HttpPut("draft/{id}")]
public async Task<IActionResult> UpdateDraftInvoice(int id, [FromBody] DraftRequest request)
{
    // ==================== THÊM ĐOẠN NÀY ====================
    // ✅ Extract User ID from JWT token claims
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                   ?? User.FindFirst("sub")                    // ← JWT standard
                   ?? User.FindFirst("userId")                 // ← Custom claim
                   ?? User.FindFirst("id")                     // ← Alternative
                   ?? User.FindFirst("nameid")                 // ← .NET Identity
                   ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
    
    if (userIdClaim == null)
    {
        _logger.LogError("❌ Cannot find User ID claim. Available claims:");
        foreach (var claim in User.Claims)
        {
            _logger.LogError("  - {Type} = {Value}", claim.Type, claim.Value);
        }
        return Unauthorized(new { message = "User ID not found in token" });
    }
    
    if (!int.TryParse(userIdClaim.Value, out int userId))
    {
        _logger.LogError("❌ Cannot parse User ID: {Value}", userIdClaim.Value);
        return Unauthorized(new { message = "Invalid User ID format" });
    }
    
    _logger.LogInformation("✅ User ID extracted: {UserId} from claim: {ClaimType}", 
        userId, userIdClaim.Type);
    // ==================== END THÊM ====================
    
    // Tiếp tục logic update invoice
    var invoice = await _context.Invoices
        .Include(i => i.InvoiceItems)
        .FirstOrDefaultAsync(i => i.InvoiceID == id);
    
    if (invoice == null)
    {
        return NotFound(new { message = "Không tìm thấy hóa đơn" });
    }
    
    // Validate status
    if (invoice.InvoiceStatusID != 1 && invoice.InvoiceStatusID != 16)
    {
        return BadRequest(new { message = "Chỉ có thể chỉnh sửa hóa đơn Nháp hoặc Bị từ chối" });
    }
    
    // Update invoice fields
    invoice.CustomerID = request.CustomerID;
    invoice.TaxCode = request.TaxCode;
    invoice.CustomerName = request.CustomerName;
    invoice.Address = request.Address;
    invoice.PaymentMethod = request.PaymentMethod;
    invoice.Notes = request.Notes;
    invoice.Amount = request.Amount;
    invoice.TaxAmount = request.TaxAmount;
    invoice.TotalAmount = request.TotalAmount;
    invoice.ContactEmail = request.ContactEmail;
    invoice.ContactPerson = request.ContactPerson;
    invoice.ContactPhone = request.ContactPhone;
    invoice.ModifiedBy = userId;        // ✅ Use extracted userId
    invoice.ModifiedAt = DateTime.UtcNow;
    
    // Update invoice items
    _context.InvoiceItems.RemoveRange(invoice.InvoiceItems);
    foreach (var itemRequest in request.Items)
    {
        invoice.InvoiceItems.Add(new InvoiceItem
        {
            InvoiceID = id,
            ProductID = itemRequest.ProductId,
            ProductName = itemRequest.ProductName,
            Unit = itemRequest.Unit,
            Quantity = itemRequest.Quantity,
            Amount = itemRequest.Amount,
            VatAmount = itemRequest.VatAmount
        });
    }
    
    await _context.SaveChangesAsync();
    
    return Ok(new { 
        invoiceID = invoice.InvoiceID, 
        message = "Cập nhật thành công" 
    });
}
```

---

### **BƯỚC 4: Deploy và Test**

```bash
# Build
dotnet build

# Deploy (tùy môi trường)
dotnet publish -c Release
# hoặc
docker build -t invoice-api .
docker restart invoice-api-container

# Test
curl -X PUT http://159.223.64.31/api/Invoice/draft/118 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerID": 12,
    "taxCode": "0123456789",
    "customerName": "Công ty Hải Âu",
    "address": "Thủ Đức - Hồ Chí Minh",
    "notes": "",
    "paymentMethod": "Tiền mặt",
    "items": [{
      "productId": 4,
      "productName": "Test Product",
      "unit": "cái",
      "quantity": 1,
      "amount": 1111111,
      "vatAmount": 111111
    }],
    "amount": 1111111,
    "taxAmount": 111111,
    "totalAmount": 1222222,
    "minRows": 5,
    "contactEmail": "noreply@company.com",
    "contactPerson": "",
    "contactPhone": "0000000000",
    "signedBy": 0
  }'
```

**Expected response:**
```json
{
  "invoiceID": 118,
  "message": "Cập nhật thành công"
}
```

---

## 🔧 **DEBUG (nếu vẫn lỗi):**

### **Xem token claims:**

```csharp
// Thêm vào đầu UpdateDraftInvoice() để debug
_logger.LogInformation("=== DEBUG CLAIMS ===");
foreach (var claim in User.Claims)
{
    _logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
}
```

**Check logs:**
```bash
# Server logs
tail -f /var/log/app/application.log | grep "DEBUG CLAIMS"

# Docker logs
docker logs -f <container> | grep "DEBUG CLAIMS"
```

**Output ví dụ:**
```
=== DEBUG CLAIMS ===
Claim: sub = 5                    ← User ID ở đây!
Claim: email = user@example.com
Claim: name = John Doe
Claim: exp = 1736419200
```

**→ Nếu thấy `sub = 5` mà code vẫn lỗi:**
- Check xem code có `?? User.FindFirst("sub")` chưa
- Nếu chưa có → THÊM VÀO!

---

## 📋 **CHECKLIST:**

- [ ] Tìm được file `InvoiceController.cs`
- [ ] Tìm được method `UpdateDraftInvoice`
- [ ] Thêm code extract userID (copy từ CREATE hoặc dùng code trên)
- [ ] Build thành công
- [ ] Deploy thành công
- [ ] Test → 200 OK ✅
- [ ] Logs show "✅ User ID extracted: 5"

---

## 🎯 **TL;DR:**

**3 dòng code cần thêm:**
```csharp
var claim = User.FindFirst(ClaimTypes.NameIdentifier)
         ?? User.FindFirst("sub")      // ← THÊM DÒNG NÀY!
         ?? User.FindFirst("userId");  // ← VÀ DÒNG NÀY!

userId = int.Parse(claim.Value);
invoice.ModifiedBy = userId;
```

**Done!** 🚀

---

**Last Updated:** January 9, 2026, 3:00 PM  
**Status:** ⚠️ Waiting for backend team to fix  
**Contact:** Frontend team ready, backend blocking
