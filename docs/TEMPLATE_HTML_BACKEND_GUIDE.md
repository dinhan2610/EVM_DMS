# Template HTML Backend Implementation Guide

## 📋 Overview

Frontend giờ sẽ gửi **self-contained HTML template** lên backend khi tạo/update template. HTML này chứa:
- ✅ Inline CSS (computed styles)
- ✅ Base64 embedded images (logo + background frame)
- ✅ Complete structure (không phụ thuộc external resources)

Backend cần:
1. Lưu HTML vào database
2. Khi tạo invoice → lấy HTML template + fill data thực vào placeholders

---

## 🔧 Backend Changes Required

### 1. Database Schema Update

```sql
-- Update Templates table
ALTER TABLE Templates 
ADD RenderedHtml NVARCHAR(MAX);

-- Update Invoices table (optional - nếu muốn lưu HTML cho từng invoice)
ALTER TABLE Invoices
ADD RenderedHtml NVARCHAR(MAX);
```

### 2. Model Updates

```csharp
// Models/Template.cs
public class Template
{
    public int TemplateID { get; set; }
    public string TemplateName { get; set; }
    public int SerialID { get; set; }
    public int TemplateTypeID { get; set; }
    public string LayoutDefinition { get; set; } // JSON config (existing)
    public int TemplateFrameID { get; set; }
    public string? LogoUrl { get; set; }
    
    // ✅ NEW: Self-contained HTML template
    public string? RenderedHtml { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### 3. API Request DTO Update

```csharp
// DTOs/CreateTemplateRequest.cs
public class CreateTemplateRequest
{
    [Required]
    public string TemplateName { get; set; }
    
    [Required]
    public int SerialID { get; set; }
    
    [Required]
    public int TemplateTypeID { get; set; }
    
    [Required]
    public object LayoutDefinition { get; set; } // JSON
    
    [Required]
    public int TemplateFrameID { get; set; }
    
    public string? LogoUrl { get; set; }
    
    // ✅ NEW: Self-contained HTML
    public string? RenderedHtml { get; set; }
}
```

### 4. Controller Updates

```csharp
// Controllers/TemplateController.cs
[HttpPost]
public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest request)
{
    try
    {
        var template = new Template
        {
            TemplateName = request.TemplateName,
            SerialID = request.SerialID,
            TemplateTypeID = request.TemplateTypeID,
            LayoutDefinition = JsonSerializer.Serialize(request.LayoutDefinition),
            TemplateFrameID = request.TemplateFrameID,
            LogoUrl = request.LogoUrl,
            RenderedHtml = request.RenderedHtml, // ✅ Save HTML
            CreatedAt = DateTime.UtcNow
        };
        
        await _context.Templates.AddAsync(template);
        await _context.SaveChangesAsync();
        
        return Ok(new { templateID = template.TemplateID });
    }
    catch (Exception ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}

// ✅ NEW: Get template HTML
[HttpGet("{id}/html")]
public async Task<IActionResult> GetTemplateHtml(int id)
{
    var template = await _context.Templates.FindAsync(id);
    if (template == null) return NotFound();
    
    return Ok(new { html = template.RenderedHtml });
}
```

---

## 🎯 HTML Template Usage

### Option 1: Simple Placeholder Replacement (Khuyến nghị)

**Template HTML có các placeholders:**
```html
<td>{{CUSTOMER_NAME}}</td>
<td>{{CUSTOMER_TAX_CODE}}</td>
<td>{{INVOICE_NUMBER}}</td>
<td>{{TOTAL_AMOUNT}}</td>
```

**Backend fill data:**
```csharp
public string GenerateInvoiceHtml(int templateId, Invoice invoice)
{
    var template = _context.Templates.Find(templateId);
    var html = template.RenderedHtml;
    
    // Simple string replacement
    html = html.Replace("{{CUSTOMER_NAME}}", invoice.CustomerName);
    html = html.Replace("{{CUSTOMER_TAX_CODE}}", invoice.TaxCode);
    html = html.Replace("{{INVOICE_NUMBER}}", invoice.InvoiceNumber.ToString());
    html = html.Replace("{{TOTAL_AMOUNT}}", invoice.TotalAmount.ToString("N0"));
    html = html.Replace("{{PAYMENT_METHOD}}", invoice.PaymentMethod);
    
    // Replace product rows
    var productRows = "";
    foreach (var item in invoice.Items)
    {
        productRows += $@"
            <tr>
                <td>{item.ProductName}</td>
                <td>{item.Unit}</td>
                <td>{item.Quantity}</td>
                <td>{item.UnitPrice:N0}</td>
                <td>{item.Amount:N0}</td>
            </tr>";
    }
    html = html.Replace("{{PRODUCT_ROWS}}", productRows);
    
    return html;
}
```

### Option 2: Razor Template Engine

```csharp
// Use RazorEngine or similar
public async Task<string> RenderInvoiceAsync(Template template, Invoice invoice)
{
    var razorEngine = new RazorEngine();
    var model = new InvoiceViewModel
    {
        Customer = invoice.Customer,
        Items = invoice.Items,
        TotalAmount = invoice.TotalAmount
    };
    
    return await razorEngine.CompileRenderAsync(
        template.RenderedHtml, 
        model
    );
}
```

### Option 3: Use existing HTML as-is (Display only)

```csharp
// Nếu HTML đã đầy đủ data (từ frontend preview)
[HttpGet("invoices/{id}/html")]
public IActionResult GetInvoiceHtml(int id)
{
    var invoice = _context.Invoices.Find(id);
    
    // Nếu invoice có HTML riêng
    if (!string.IsNullOrEmpty(invoice.RenderedHtml))
    {
        return Content(invoice.RenderedHtml, "text/html");
    }
    
    // Hoặc dùng template + fill data
    var template = _context.Templates.Find(invoice.TemplateID);
    var html = GenerateInvoiceHtml(template.TemplateID, invoice);
    
    return Content(html, "text/html");
}
```

---

## 🚀 Invoice Creation Flow

### Current Flow (Frontend → Backend)

```typescript
// Frontend: CreateInvoice.tsx
POST /api/Invoice
{
  customerID, customerName, taxCode, address,
  items: [{productName, unit, quantity, unitPrice, amount, vatAmount}],
  amount, taxAmount, totalAmount,
  paymentMethod, notes, contactEmail, contactPhone
}
```

### New Flow with Template HTML

**Option A: Backend generates HTML from template**

```csharp
[HttpPost("Invoice")]
public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
{
    // 1. Create invoice record
    var invoice = new Invoice
    {
        CustomerID = request.CustomerID,
        CustomerName = request.CustomerName,
        // ... other fields
    };
    await _context.Invoices.AddAsync(invoice);
    
    // 2. Get active template
    var template = await _context.Templates
        .Where(t => t.IsActive)
        .FirstOrDefaultAsync();
    
    // 3. Generate HTML from template
    if (template?.RenderedHtml != null)
    {
        invoice.RenderedHtml = GenerateInvoiceHtml(template.TemplateID, invoice);
    }
    
    await _context.SaveChangesAsync();
    
    return Ok(new { invoiceID = invoice.InvoiceID });
}
```

**Option B: Frontend sends pre-rendered HTML**

```typescript
// Frontend fills template với data → generates HTML → sends to backend
const html = await fillTemplateWithInvoiceData(template, invoiceData);

POST /api/Invoice
{
  ...invoiceData,
  renderedHtml: html // ✅ Complete invoice HTML
}
```

---

## 📄 Export to PDF

```csharp
// Using SelectPdf or similar library
public byte[] ExportInvoiceToPdf(string html)
{
    var converter = new HtmlToPdf();
    converter.Options.PdfPageSize = PdfPageSize.A4;
    converter.Options.PdfPageOrientation = PdfPageOrientation.Portrait;
    converter.Options.MarginTop = 0;
    converter.Options.MarginBottom = 0;
    converter.Options.MarginLeft = 0;
    converter.Options.MarginRight = 0;
    
    var pdfDocument = converter.ConvertHtmlString(html);
    return pdfDocument.Save();
}

[HttpGet("invoices/{id}/pdf")]
public IActionResult DownloadPdf(int id)
{
    var invoice = _context.Invoices.Find(id);
    var html = invoice.RenderedHtml ?? GenerateInvoiceHtml(invoice.TemplateID, invoice);
    
    var pdfBytes = ExportInvoiceToPdf(html);
    
    return File(pdfBytes, "application/pdf", $"invoice-{id}.pdf");
}
```

---

## ✅ Testing

### 1. Test template creation
```bash
POST /api/Template
{
  "templateName": "Test Template",
  "serialID": 1,
  "templateTypeID": 1,
  "layoutDefinition": {...},
  "templateFrameID": 1,
  "logoUrl": null,
  "renderedHtml": "<!DOCTYPE html>..."
}
```

### 2. Verify HTML saved
```sql
SELECT TOP 1 
  TemplateID,
  TemplateName,
  LEN(RenderedHtml) as HtmlLength,
  LEFT(RenderedHtml, 100) as HtmlPreview
FROM Templates
ORDER BY CreatedAt DESC
```

### 3. Test HTML retrieval
```bash
GET /api/Template/{id}/html
```

### 4. Test invoice generation
```bash
POST /api/Invoice
{...}

# Then verify invoice HTML
GET /api/Invoice/{id}/html
```

---

## 🔒 Security Considerations

1. **HTML Sanitization**: Nếu accept HTML từ frontend, cần sanitize
2. **Size Limits**: HTML có thể lớn (base64 images), set appropriate limits
3. **SQL Injection**: Dùng parameterized queries
4. **XSS Prevention**: Khi render HTML, ensure proper escaping

```csharp
// Example size validation
[RequestSizeLimit(10_485_760)] // 10MB max
public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest request)
{
    if (!string.IsNullOrEmpty(request.RenderedHtml) && 
        request.RenderedHtml.Length > 5_000_000) // 5MB
    {
        return BadRequest("HTML template too large");
    }
    // ...
}
```

---

## 📊 Frontend Changes Summary

**TemplateEditor.tsx:**
- ✅ Import `exportTemplateToHTML` 
- ✅ Add `previewRef` to capture preview element
- ✅ Export HTML before calling `createTemplate()`
- ✅ Send `renderedHtml` field to backend

**templateService.ts:**
- ✅ Add `renderedHtml?: string` to `CreateTemplateInternalRequest`
- ✅ Include `renderedHtml` in API request

**Result:**
- Template HTML (~500KB - 2MB) được lưu vào database
- Backend có thể dùng HTML này để generate invoices
- Không cần frontend render lại mỗi lần xem invoice
