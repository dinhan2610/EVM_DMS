# 🔧 BACKEND IMPLEMENTATION GUIDE - TỰ ĐỘNG TẠO CÔNG NỢ KHI PHÁT HÀNH HÓA ĐƠN

## 📋 MỤC LỤC
1. [Tổng quan](#1-tổng-quan)
2. [Database Changes](#2-database-changes)
3. [API Endpoints cần cập nhật](#3-api-endpoints-cần-cập-nhật)
4. [Code Implementation](#4-code-implementation)
5. [Testing Guide](#5-testing-guide)
6. [Deployment Checklist](#6-deployment-checklist)

---

## 1. TỔNG QUAN

### 🎯 Mục tiêu
Khi hóa đơn được phát hành (Issue Invoice), hệ thống tự động tạo bản ghi công nợ trong trang Quản lý Công nợ, và tự động cập nhật trạng thái khi có thanh toán.

### 📊 Workflow hiện tại vs. Workflow mới

#### ❌ Workflow hiện tại (Có vấn đề):
```
1. User tạo hóa đơn nháp
2. Gửi duyệt → KTT duyệt
3. Ký số → Cấp số hóa đơn
4. Phát hành → Hóa đơn status = ISSUED
5. ❌ Hóa đơn KHÔNG xuất hiện trong trang Công nợ
6. ❌ User phải thủ công tạo công nợ (???)
```

#### ✅ Workflow mới (Tối ưu):
```
1. User tạo hóa đơn nháp
2. Gửi duyệt → KTT duyệt
3. Ký số → Cấp số hóa đơn
4. Phát hành → Hóa đơn status = ISSUED
5. ✅ Backend TỰ ĐỘNG tạo bản ghi công nợ
6. ✅ Hóa đơn xuất hiện trong trang Công nợ với trạng thái "Chưa thanh toán"
7. User ghi nhận thanh toán → ✅ Backend TỰ ĐỘNG cập nhật Invoice
```

### 🚀 3 Tasks chính cần làm:

| Task | Priority | Estimated Time |
|------|----------|----------------|
| **Task 1**: Update `POST /api/Payment` - Auto update Invoice | 🔴 CRITICAL | 2-3 giờ |
| **Task 2**: Update `POST /api/Invoice/{id}/issue` - Auto create Debt | 🔴 CRITICAL | 3-4 giờ |
| **Task 3**: Create `GET /api/Customer/debt-summary` | 🟡 HIGH | 2-3 giờ |

**Tổng thời gian ước tính**: 1-1.5 ngày làm việc

---

## 2. DATABASE CHANGES

### 2.1. Kiểm tra bảng Invoices

Đảm bảo bảng `Invoices` có các cột sau:

```sql
-- Cột cần có trong bảng Invoices
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS PaidAmount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS RemainingAmount DECIMAL(18,2);
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS PaymentStatus VARCHAR(50) DEFAULT 'Unpaid';
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS LastPaymentDate DATETIME NULL;
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS PaymentDueDate DATETIME NULL;

-- Index để tăng performance
CREATE INDEX IF NOT EXISTS IDX_Invoices_PaymentStatus ON Invoices(PaymentStatus);
CREATE INDEX IF NOT EXISTS IDX_Invoices_CustomerID_PaymentStatus ON Invoices(CustomerID, PaymentStatus);
```

**Các giá trị PaymentStatus**:
- `Unpaid`: Chưa thanh toán (mặc định khi phát hành)
- `PartiallyPaid`: Đã thanh toán một phần
- `Paid`: Đã thanh toán đầy đủ

### 2.2. Cập nhật stored procedure hoặc trigger (Optional)

Nếu muốn đảm bảo data consistency, có thể tạo trigger:

```sql
-- Trigger để tự động tính RemainingAmount
CREATE TRIGGER trg_Invoice_Calculate_Remaining
AFTER UPDATE ON Invoices
FOR EACH ROW
BEGIN
    IF NEW.PaidAmount IS NOT NULL THEN
        SET NEW.RemainingAmount = NEW.TotalAmount - NEW.PaidAmount;
    END IF;
END;
```

**⚠️ Lưu ý**: Nếu sử dụng trigger, cần test kỹ để tránh conflict với logic trong code.

---

## 3. API ENDPOINTS CẦN CẬP NHẬT

### 3.1. ⭐ TASK 1: Update Payment API - Auto update Invoice

**File**: `Controllers/PaymentController.cs`  
**Method**: `CreatePayment`  
**Endpoint**: `POST /api/Payment`

#### Current Request/Response:
```json
// Request
{
  "invoiceId": 1,
  "amount": 5000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN123456",
  "note": "Thanh toán đợt 1",
  "paymentDate": "2025-12-24T00:00:00Z",
  "userId": 1
}

// Response (HIỆN TẠI - thiếu invoice info)
{
  "id": 76,
  "invoiceId": 1,
  "amount": 5000000,
  "paymentMethod": "BankTransfer",
  "createdAt": "2025-12-24T10:30:00Z"
}
```

#### Expected Response (SAU KHI UPDATE):
```json
{
  "id": 76,
  "invoiceId": 1,
  "amount": 5000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN123456",
  "note": "Thanh toán đợt 1",
  "paymentDate": "2025-12-24T00:00:00Z",
  "userId": 1,
  "createdAt": "2025-12-24T10:30:00Z",
  "invoice": {
    "invoiceNumber": "C24TAA-001",
    "customerName": "Công ty ABC",
    "totalAmount": 10000000,
    "paidAmount": 5000000,        // ✅ ĐÃ CẬP NHẬT
    "remainingAmount": 5000000,   // ✅ ĐÃ CẬP NHẬT
    "paymentStatus": "PartiallyPaid"  // ✅ ĐÃ CẬP NHẬT
  },
  "user": {
    "userId": 1,
    "userName": "Admin User"
  }
}
```

### 3.2. ⭐ TASK 2: Update Issue Invoice API - Auto create Debt

**File**: `Controllers/InvoiceController.cs`  
**Method**: `IssueInvoice`  
**Endpoint**: `POST /api/Invoice/{id}/issue`

#### Current Request/Response:
```json
// Request
{
  "issuerId": 1,
  "autoCreatePayment": false,
  "paymentAmount": 0,
  "paymentMethod": "Cash",
  "note": ""
}

// Response (HIỆN TẠI - thiếu debt info)
{
  "invoiceID": 73,
  "invoiceNumber": "C24TAA-0073",
  "invoiceStatusID": 2
}
```

#### Expected Response (SAU KHI UPDATE):
```json
{
  "invoiceID": 73,
  "invoiceNumber": "C24TAA-0073",
  "invoiceStatusID": 2,
  "debtCreated": true,          // ✅ MỚI
  "debtInfo": {                 // ✅ MỚI
    "customerId": 5,
    "customerName": "Công ty ABC",
    "totalDebt": 10000000,
    "dueDate": "2025-01-23T00:00:00Z"
  }
}
```

### 3.3. ⭐ TASK 3: Create Customer Debt Summary API

**File**: `Controllers/CustomerController.cs` (NEW or existing)  
**Method**: `GetDebtSummary` (NEW)  
**Endpoint**: `GET /api/Customer/debt-summary`

#### Request Query Parameters:
```
GET /api/Customer/debt-summary?PageIndex=1&PageSize=100&SearchTerm=ABC&SortBy=totalDebt&SortOrder=desc&HasOverdue=true
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| PageIndex | int | No | 1 | Trang hiện tại |
| PageSize | int | No | 100 | Số records/trang |
| SearchTerm | string | No | null | Tìm kiếm theo tên, MST, email, phone |
| SortBy | string | No | totalDebt | totalDebt, overdueDebt, lastPaymentDate |
| SortOrder | string | No | desc | asc hoặc desc |
| HasOverdue | bool | No | null | Lọc khách hàng có nợ quá hạn |

#### Expected Response:
```json
{
  "data": [
    {
      "customerId": 5,
      "customerName": "Công ty TNHH ABC",
      "taxCode": "0123456789",
      "email": "abc@company.com",
      "phone": "024 1234 5678",
      "address": "123 Đường Láng, Hà Nội",
      "totalDebt": 45000000,
      "overdueDebt": 15000000,
      "invoiceCount": 5,
      "lastPaymentDate": "2024-11-20T00:00:00Z"
    }
  ],
  "pageIndex": 1,
  "pageSize": 100,
  "totalCount": 25,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

---

## 4. CODE IMPLEMENTATION

### 4.1. ⭐ TASK 1: Update PaymentController.CreatePayment()

**File**: `Controllers/PaymentController.cs`

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace EIMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            ApplicationDbContext context,
            ILogger<PaymentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo payment mới và TỰ ĐỘNG cập nhật Invoice
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
        {
            // ==================== VALIDATION ====================
            if (request.Amount <= 0)
            {
                return BadRequest(new { message = "Payment amount must be greater than 0" });
            }

            // Validate invoice exists
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.InvoiceID == request.InvoiceId);

            if (invoice == null)
            {
                return NotFound(new { message = $"Invoice {request.InvoiceId} not found" });
            }

            // Validate payment không vượt quá remaining amount
            var currentRemaining = invoice.TotalAmount - (invoice.PaidAmount ?? 0);
            if (request.Amount > currentRemaining)
            {
                return BadRequest(new { 
                    message = $"Payment amount ({request.Amount:N0}) exceeds remaining amount ({currentRemaining:N0})" 
                });
            }

            // ==================== CREATE PAYMENT WITH TRANSACTION ====================
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // 1. CREATE PAYMENT RECORD
                var payment = new Payment
                {
                    InvoiceId = request.InvoiceId,
                    Amount = request.Amount,
                    PaymentMethod = request.PaymentMethod,
                    TransactionCode = request.TransactionCode,
                    Note = request.Note,
                    PaymentDate = request.PaymentDate,
                    UserId = request.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Payments.AddAsync(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    $"✅ Payment created: ID={payment.PaymentId}, InvoiceId={request.InvoiceId}, Amount={request.Amount:N0}"
                );

                // 2. ⭐ AUTO UPDATE INVOICE
                invoice.PaidAmount = (invoice.PaidAmount ?? 0) + request.Amount;
                invoice.RemainingAmount = invoice.TotalAmount - invoice.PaidAmount.Value;
                invoice.LastPaymentDate = request.PaymentDate;

                // Update payment status
                if (invoice.RemainingAmount <= 0)
                {
                    invoice.PaymentStatus = "Paid";
                    _logger.LogInformation($"✅ Invoice {invoice.InvoiceID} marked as FULLY PAID");
                }
                else if (invoice.PaidAmount > 0)
                {
                    invoice.PaymentStatus = "PartiallyPaid";
                    _logger.LogInformation(
                        $"✅ Invoice {invoice.InvoiceID} marked as PARTIALLY PAID " +
                        $"(Paid: {invoice.PaidAmount:N0}, Remaining: {invoice.RemainingAmount:N0})"
                    );
                }

                _context.Invoices.Update(invoice);
                await _context.SaveChangesAsync();

                // 3. COMMIT TRANSACTION
                await transaction.CommitAsync();

                _logger.LogInformation($"✅ Payment {payment.PaymentId} processed successfully");

                // 4. RETURN RESPONSE WITH UPDATED INVOICE INFO
                var user = await _context.Users.FindAsync(request.UserId);

                return Ok(new
                {
                    id = payment.PaymentId,
                    invoiceId = payment.InvoiceId,
                    amount = payment.Amount,
                    paymentMethod = payment.PaymentMethod,
                    transactionCode = payment.TransactionCode,
                    note = payment.Note,
                    paymentDate = payment.PaymentDate,
                    userId = payment.UserId,
                    createdAt = payment.CreatedAt,
                    invoice = new
                    {
                        invoiceNumber = invoice.InvoiceNumber,
                        customerName = invoice.Customer?.Name,
                        totalAmount = invoice.TotalAmount,
                        paidAmount = invoice.PaidAmount,
                        remainingAmount = invoice.RemainingAmount,
                        paymentStatus = invoice.PaymentStatus
                    },
                    user = new
                    {
                        userId = user?.UserId,
                        userName = user?.UserName
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"❌ Error creating payment for invoice {request.InvoiceId}");
                return StatusCode(500, new { message = $"Error creating payment: {ex.Message}" });
            }
        }

        // ... other methods ...
    }

    // ==================== REQUEST DTO ====================
    public class CreatePaymentRequest
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; }
        public string? TransactionCode { get; set; }
        public string? Note { get; set; }
        public DateTime PaymentDate { get; set; }
        public int UserId { get; set; }
    }
}
```

**✅ Checklist cho Task 1**:
- [ ] Thêm validation amount > 0
- [ ] Thêm validation amount <= remaining
- [ ] Wrap trong transaction
- [ ] Update `invoice.PaidAmount`
- [ ] Update `invoice.RemainingAmount`
- [ ] Update `invoice.PaymentStatus` (Paid/PartiallyPaid)
- [ ] Update `invoice.LastPaymentDate`
- [ ] Trả về invoice info trong response
- [ ] Thêm logging
- [ ] Test với Postman

---

### 4.2. ⭐ TASK 2: Update InvoiceController.IssueInvoice()

**File**: `Controllers/InvoiceController.cs`

```csharp
/// <summary>
/// Phát hành hóa đơn và TỰ ĐỘNG tạo bản ghi công nợ
/// </summary>
[HttpPost("{id}/issue")]
public async Task<IActionResult> IssueInvoice(int id, [FromBody] IssueInvoiceRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    
    try
    {
        // ==================== 1. VALIDATE & GET INVOICE ====================
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Template)
            .Include(i => i.Serial)
            .FirstOrDefaultAsync(i => i.InvoiceID == id);

        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice {id} not found" });
        }

        // Validate status
        if (invoice.InvoiceStatusID != 8) // SIGNED_PENDING_ISSUE
        {
            return BadRequest(new { 
                message = $"Invoice must be signed before issuing. Current status: {invoice.InvoiceStatusID}" 
            });
        }

        if (invoice.Customer == null)
        {
            return BadRequest(new { message = "Invoice must have a customer" });
        }

        // ==================== 2. GENERATE INVOICE NUMBER ====================
        var serial = await _context.Serials
            .FirstOrDefaultAsync(s => s.SerialID == invoice.SerialID && s.IsActive);

        if (serial == null)
        {
            return BadRequest(new { message = "No active serial found for this invoice" });
        }

        // Format: {TemplateCode}{YY}{XXX}-{Number}
        // Example: C24TAA-00000073
        var invoiceNumber = $"{serial.TemplateCode}{DateTime.Now:yy}{serial.SerialNumber}-{serial.CurrentNumber:D8}";

        _logger.LogInformation($"📋 Generated invoice number: {invoiceNumber}");

        // ==================== 3. UPDATE INVOICE ====================
        invoice.InvoiceNumber = invoiceNumber;
        invoice.InvoiceStatusID = 2; // ISSUED
        invoice.SignedBy = request.IssuerId;
        invoice.SignedDate = DateTime.UtcNow;
        
        // Initialize payment tracking fields
        invoice.PaidAmount = 0;
        invoice.RemainingAmount = invoice.TotalAmount;
        invoice.PaymentStatus = "Unpaid";
        invoice.LastPaymentDate = null;

        // Update serial current number
        serial.CurrentNumber++;

        _context.Invoices.Update(invoice);
        _context.Serials.Update(serial);

        _logger.LogInformation($"✅ Invoice {id} issued with number {invoiceNumber}");

        // ==================== 4. ⭐ AUTO CREATE DEBT RECORD ====================
        
        // Calculate due date (default: 30 days from invoice date)
        var dueDate = invoice.PaymentDueDate ?? invoice.InvoiceDate.AddDays(30);

        var debtRecord = new DebtRecord
        {
            InvoiceId = invoice.InvoiceID,
            InvoiceNumber = invoiceNumber,
            CustomerId = invoice.CustomerID,
            CustomerName = invoice.Customer.Name,
            CustomerTaxCode = invoice.Customer.TaxCode,
            CustomerEmail = invoice.Customer.Email,
            CustomerPhone = invoice.Customer.Phone,
            CustomerAddress = invoice.Customer.Address,
            InvoiceDate = invoice.InvoiceDate,
            DueDate = dueDate,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = 0,
            RemainingAmount = invoice.TotalAmount,
            PaymentStatus = "Unpaid",
            Description = $"Hóa đơn {invoiceNumber} - {invoice.Customer.Name}",
            IsOverdue = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = request.IssuerId
        };

        await _context.DebtRecords.AddAsync(debtRecord);

        _logger.LogInformation(
            $"✅ Auto-created debt record for invoice {invoiceNumber}, " +
            $"Customer: {invoice.Customer.Name}, Amount: {invoice.TotalAmount:N0}, Due: {dueDate:yyyy-MM-dd}"
        );

        // ==================== 5. SAVE ALL CHANGES ====================
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        _logger.LogInformation($"✅ Invoice {id} issued successfully with auto-created debt");

        // ==================== 6. RETURN RESPONSE ====================
        return Ok(new
        {
            invoiceID = invoice.InvoiceID,
            invoiceNumber = invoiceNumber,
            invoiceStatusID = 2,
            debtCreated = true,
            debtInfo = new
            {
                customerId = invoice.CustomerID,
                customerName = invoice.Customer.Name,
                totalDebt = invoice.TotalAmount,
                dueDate = dueDate,
                paymentStatus = "Unpaid"
            }
        });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, $"❌ Error issuing invoice {id}");
        return StatusCode(500, new { message = $"Error issuing invoice: {ex.Message}" });
    }
}
```

**Model cho DebtRecord** (nếu chưa có):

```csharp
// Models/DebtRecord.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EIMS.API.Models
{
    [Table("DebtRecords")]
    public class DebtRecord
    {
        [Key]
        public int DebtRecordId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        [MaxLength(255)]
        public string CustomerName { get; set; }

        [MaxLength(20)]
        public string? CustomerTaxCode { get; set; }

        [MaxLength(255)]
        public string? CustomerEmail { get; set; }

        [MaxLength(20)]
        public string? CustomerPhone { get; set; }

        [MaxLength(500)]
        public string? CustomerAddress { get; set; }

        [Required]
        public DateTime InvoiceDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal RemainingAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentStatus { get; set; } = "Unpaid";

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsOverdue { get; set; } = false;

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public int CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("InvoiceId")]
        public virtual Invoice Invoice { get; set; }

        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; }
    }
}
```

**Migration Command**:
```bash
dotnet ef migrations add AddDebtRecordsTable
dotnet ef database update
```

**✅ Checklist cho Task 2**:
- [ ] Tạo model `DebtRecord`
- [ ] Tạo migration cho bảng `DebtRecords`
- [ ] Update `IssueInvoice()` method
- [ ] Thêm logic tạo debt record
- [ ] Calculate due date (invoice.PaymentDueDate hoặc +30 ngày)
- [ ] Wrap trong transaction
- [ ] Trả về debt info trong response
- [ ] Thêm logging
- [ ] Test với Postman

---

### 4.3. ⭐ TASK 3: Create CustomerController.GetDebtSummary()

**File**: `Controllers/CustomerController.cs`

```csharp
/// <summary>
/// Lấy danh sách khách hàng có công nợ
/// </summary>
[HttpGet("debt-summary")]
public async Task<IActionResult> GetDebtSummary(
    [FromQuery] int PageIndex = 1,
    [FromQuery] int PageSize = 100,
    [FromQuery] string? SearchTerm = null,
    [FromQuery] string SortBy = "totalDebt",
    [FromQuery] string SortOrder = "desc",
    [FromQuery] bool? HasOverdue = null)
{
    try
    {
        // ==================== 1. BASE QUERY ====================
        // Lấy customers có ít nhất 1 invoice chưa thanh toán đầy đủ
        var query = _context.Customers
            .Include(c => c.Invoices)
                .ThenInclude(i => i.Payments)
            .Where(c => c.Invoices.Any(i => 
                i.PaymentStatus != "Paid" && 
                i.InvoiceStatusID == 2 // ISSUED only
            ));

        // ==================== 2. SEARCH FILTER ====================
        if (!string.IsNullOrEmpty(SearchTerm))
        {
            var searchLower = SearchTerm.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(searchLower) ||
                c.TaxCode.ToLower().Contains(searchLower) ||
                (c.Email != null && c.Email.ToLower().Contains(searchLower)) ||
                (c.Phone != null && c.Phone.ToLower().Contains(searchLower))
            );
        }

        // ==================== 3. CALCULATE DEBT SUMMARY ====================
        var customerDebts = await query
            .Select(c => new
            {
                customerId = c.CustomerID,
                customerName = c.Name,
                taxCode = c.TaxCode,
                email = c.Email,
                phone = c.Phone,
                address = c.Address,

                // Calculate total debt (invoices not fully paid)
                totalDebt = c.Invoices
                    .Where(i => i.PaymentStatus != "Paid" && i.InvoiceStatusID == 2)
                    .Sum(i => i.RemainingAmount ?? 0),

                // Calculate overdue debt
                overdueDebt = c.Invoices
                    .Where(i => 
                        i.PaymentStatus != "Paid" && 
                        i.InvoiceStatusID == 2 &&
                        i.PaymentDueDate.HasValue &&
                        i.PaymentDueDate.Value < DateTime.Today
                    )
                    .Sum(i => i.RemainingAmount ?? 0),

                // Count unpaid invoices
                invoiceCount = c.Invoices.Count(i => 
                    i.PaymentStatus != "Paid" && 
                    i.InvoiceStatusID == 2
                ),

                // Last payment date
                lastPaymentDate = c.Invoices
                    .SelectMany(i => i.Payments)
                    .OrderByDescending(p => p.PaymentDate)
                    .Select(p => (DateTime?)p.PaymentDate)
                    .FirstOrDefault()
            })
            .ToListAsync();

        // ==================== 4. FILTER BY OVERDUE ====================
        if (HasOverdue == true)
        {
            customerDebts = customerDebts
                .Where(c => c.overdueDebt > 0)
                .ToList();
        }

        // ==================== 5. SORTING ====================
        customerDebts = SortBy.ToLower() switch
        {
            "overduedebt" => SortOrder.ToLower() == "asc"
                ? customerDebts.OrderBy(c => c.overdueDebt).ToList()
                : customerDebts.OrderByDescending(c => c.overdueDebt).ToList(),

            "lastpaymentdate" => SortOrder.ToLower() == "asc"
                ? customerDebts.OrderBy(c => c.lastPaymentDate ?? DateTime.MinValue).ToList()
                : customerDebts.OrderByDescending(c => c.lastPaymentDate ?? DateTime.MaxValue).ToList(),

            "invoicecount" => SortOrder.ToLower() == "asc"
                ? customerDebts.OrderBy(c => c.invoiceCount).ToList()
                : customerDebts.OrderByDescending(c => c.invoiceCount).ToList(),

            _ => SortOrder.ToLower() == "asc"
                ? customerDebts.OrderBy(c => c.totalDebt).ToList()
                : customerDebts.OrderByDescending(c => c.totalDebt).ToList()
        };

        // ==================== 6. PAGINATION ====================
        var totalCount = customerDebts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)PageSize);

        var pagedData = customerDebts
            .Skip((PageIndex - 1) * PageSize)
            .Take(PageSize)
            .ToList();

        // ==================== 7. RETURN RESPONSE ====================
        _logger.LogInformation(
            $"✅ GetDebtSummary: Found {totalCount} customers with debt, " +
            $"returned page {PageIndex}/{totalPages}"
        );

        return Ok(new
        {
            data = pagedData,
            pageIndex = PageIndex,
            pageSize = PageSize,
            totalCount = totalCount,
            totalPages = totalPages,
            hasPreviousPage = PageIndex > 1,
            hasNextPage = PageIndex < totalPages
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "❌ Error getting debt summary");
        return StatusCode(500, new { message = $"Error getting debt summary: {ex.Message}" });
    }
}
```

**✅ Checklist cho Task 3**:
- [ ] Tạo method `GetDebtSummary()` trong `CustomerController`
- [ ] Implement search filter
- [ ] Implement sort (totalDebt, overdueDebt, lastPaymentDate)
- [ ] Implement pagination
- [ ] Implement overdue filter
- [ ] Calculate totals correctly
- [ ] Thêm logging
- [ ] Test với Postman với nhiều query params

---

## 5. TESTING GUIDE

### 5.1. Test Task 1: Payment API Auto-updates Invoice

#### Test Case 1.1: Thanh toán một phần (Partial Payment)

```bash
# Step 1: Tạo và phát hành invoice có total = 10,000,000 VND

# Step 2: Kiểm tra invoice trước khi payment
GET http://159.223.64.31/api/Invoice/73

# Expected:
{
  "invoiceID": 73,
  "invoiceNumber": "C24TAA-0073",
  "totalAmount": 10000000,
  "paidAmount": 0,
  "remainingAmount": 10000000,
  "paymentStatus": "Unpaid"
}

# Step 3: Tạo payment 5,000,000 VND
POST http://159.223.64.31/api/Payment
Content-Type: application/json

{
  "invoiceId": 73,
  "amount": 5000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN001",
  "note": "Thanh toán đợt 1",
  "paymentDate": "2025-12-24T00:00:00Z",
  "userId": 1
}

# Expected Response:
{
  "id": 100,
  "invoiceId": 73,
  "amount": 5000000,
  "invoice": {
    "invoiceNumber": "C24TAA-0073",
    "totalAmount": 10000000,
    "paidAmount": 5000000,           // ✅ UPDATED
    "remainingAmount": 5000000,      // ✅ UPDATED
    "paymentStatus": "PartiallyPaid" // ✅ UPDATED
  }
}

# Step 4: Verify invoice updated
GET http://159.223.64.31/api/Invoice/73

# Expected:
{
  "invoiceID": 73,
  "paidAmount": 5000000,
  "remainingAmount": 5000000,
  "paymentStatus": "PartiallyPaid"
}
```

**✅ Pass criteria**:
- [ ] Payment created successfully
- [ ] Invoice `paidAmount` = 5,000,000
- [ ] Invoice `remainingAmount` = 5,000,000
- [ ] Invoice `paymentStatus` = "PartiallyPaid"
- [ ] Response contains invoice info

#### Test Case 1.2: Thanh toán đầy đủ (Full Payment)

```bash
# Step 1: Tạo payment 5,000,000 VND nữa (tổng = 10,000,000)
POST http://159.223.64.31/api/Payment

{
  "invoiceId": 73,
  "amount": 5000000,
  "paymentMethod": "Cash",
  "note": "Thanh toán đợt 2 - hoàn tất",
  "paymentDate": "2025-12-25T00:00:00Z",
  "userId": 1
}

# Expected Response:
{
  "invoice": {
    "paidAmount": 10000000,
    "remainingAmount": 0,
    "paymentStatus": "Paid"  // ✅ CHANGED TO PAID
  }
}

# Step 2: Verify invoice
GET http://159.223.64.31/api/Invoice/73

# Expected:
{
  "paidAmount": 10000000,
  "remainingAmount": 0,
  "paymentStatus": "Paid"
}
```

**✅ Pass criteria**:
- [ ] Invoice `remainingAmount` = 0
- [ ] Invoice `paymentStatus` = "Paid"
- [ ] Invoice disappears from "Unpaid" tab in Debt Management page

#### Test Case 1.3: Validation - Payment vượt quá remaining

```bash
POST http://159.223.64.31/api/Payment

{
  "invoiceId": 73,
  "amount": 15000000,  // > remaining (10,000,000)
  "paymentMethod": "Cash",
  "paymentDate": "2025-12-24T00:00:00Z",
  "userId": 1
}

# Expected Response: 400 Bad Request
{
  "message": "Payment amount (15,000,000) exceeds remaining amount (10,000,000)"
}
```

**✅ Pass criteria**:
- [ ] Returns 400 Bad Request
- [ ] Invoice không bị update
- [ ] Payment không được tạo

---

### 5.2. Test Task 2: Issue Invoice Auto-creates Debt

#### Test Case 2.1: Issue invoice tạo debt record

```bash
# Step 1: Tạo invoice nháp, duyệt, ký số
# ... (skip các bước trước)

# Step 2: Issue invoice
POST http://159.223.64.31/api/Invoice/75/issue

{
  "issuerId": 1,
  "autoCreatePayment": false,
  "paymentAmount": 0,
  "paymentMethod": "Cash",
  "note": ""
}

# Expected Response:
{
  "invoiceID": 75,
  "invoiceNumber": "C24TAA-0075",
  "invoiceStatusID": 2,
  "debtCreated": true,         // ✅ NEW
  "debtInfo": {                // ✅ NEW
    "customerId": 5,
    "customerName": "Công ty ABC",
    "totalDebt": 10000000,
    "dueDate": "2025-01-23T00:00:00Z",
    "paymentStatus": "Unpaid"
  }
}

# Step 3: Verify debt created
GET http://159.223.64.31/api/Customer/debt-summary?PageIndex=1&PageSize=100

# Expected: Customer 5 xuất hiện với totalDebt = 10,000,000
{
  "data": [
    {
      "customerId": 5,
      "customerName": "Công ty ABC",
      "totalDebt": 10000000,
      "overdueDebt": 0,
      "invoiceCount": 1
    }
  ]
}

# Step 4: Verify trong frontend
# - Vào trang Công nợ (DebtManagement)
# - Tìm khách hàng "Công ty ABC"
# - Kiểm tra invoice C24TAA-0075 xuất hiện
# - Status: "Chưa thanh toán"
```

**✅ Pass criteria**:
- [ ] Invoice issued successfully
- [ ] Response contains `debtCreated: true`
- [ ] Response contains customer debt info
- [ ] Customer xuất hiện trong debt summary API
- [ ] Invoice xuất hiện trong Debt Management page (Frontend)

---

### 5.3. Test Task 3: Customer Debt Summary API

#### Test Case 3.1: Get all customers with debt

```bash
GET http://159.223.64.31/api/Customer/debt-summary?PageIndex=1&PageSize=10

# Expected:
{
  "data": [
    {
      "customerId": 5,
      "customerName": "Công ty ABC",
      "taxCode": "0123456789",
      "totalDebt": 15000000,
      "overdueDebt": 5000000,
      "invoiceCount": 3,
      "lastPaymentDate": "2025-12-20T00:00:00Z"
    }
  ],
  "pageIndex": 1,
  "totalCount": 25,
  "totalPages": 3
}
```

#### Test Case 3.2: Search customers

```bash
GET http://159.223.64.31/api/Customer/debt-summary?SearchTerm=ABC

# Expected: Chỉ trả về customers có tên/MST/email/phone chứa "ABC"
```

#### Test Case 3.3: Sort by overdue debt

```bash
GET http://159.223.64.31/api/Customer/debt-summary?SortBy=overdueDebt&SortOrder=desc

# Expected: Customers sorted by overdueDebt descending
```

#### Test Case 3.4: Filter by overdue

```bash
GET http://159.223.64.31/api/Customer/debt-summary?HasOverdue=true

# Expected: Chỉ trả về customers có overdueDebt > 0
```

**✅ Pass criteria**:
- [ ] API returns correct data structure
- [ ] Search works correctly
- [ ] Sort works correctly (all fields)
- [ ] Filter works correctly
- [ ] Pagination works correctly
- [ ] Calculations are accurate (totalDebt, overdueDebt)

---

### 5.4. End-to-End Test: Full Workflow

```
1. Tạo hóa đơn mới → Gửi duyệt → KTT duyệt → Ký số
2. Phát hành hóa đơn (Issue)
   ✅ Backend tự động tạo debt record
3. Vào trang Công nợ (Frontend)
   ✅ Hóa đơn xuất hiện ngay lập tức
   ✅ Status: "Chưa thanh toán"
   ✅ Remaining = Total
4. Ghi nhận thanh toán 50%
   ✅ Backend tự động update invoice
   ✅ Status chuyển: "Đã trả 1 phần"
   ✅ Frontend auto refresh, hiển thị updated data
5. Ghi nhận thanh toán 50% còn lại
   ✅ Status chuyển: "Đã thanh toán"
   ✅ Hóa đơn biến mất khỏi tab "Chưa thanh toán"
   ✅ Xuất hiện trong tab "Lịch sử thanh toán"
```

---

## 6. DEPLOYMENT CHECKLIST

### 6.1. Pre-deployment

- [ ] **Code Review**: Review tất cả code changes
- [ ] **Unit Tests**: Viết và pass tất cả unit tests
- [ ] **Integration Tests**: Test tất cả API endpoints
- [ ] **Database Migration**: Chạy migration cho bảng DebtRecords
- [ ] **Backup Database**: Backup production database trước khi deploy

### 6.2. Database Changes

```sql
-- 1. Kiểm tra và thêm cột vào bảng Invoices
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS PaidAmount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS RemainingAmount DECIMAL(18,2);
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS PaymentStatus VARCHAR(50) DEFAULT 'Unpaid';
ALTER TABLE Invoices ADD COLUMN IF NOT EXISTS LastPaymentDate DATETIME NULL;

-- 2. Update existing invoices (nếu có data cũ)
UPDATE Invoices 
SET 
    PaidAmount = COALESCE((
        SELECT SUM(p.Amount) 
        FROM Payments p 
        WHERE p.InvoiceId = Invoices.InvoiceID
    ), 0),
    RemainingAmount = TotalAmount - COALESCE((
        SELECT SUM(p.Amount) 
        FROM Payments p 
        WHERE p.InvoiceId = Invoices.InvoiceID
    ), 0),
    PaymentStatus = CASE
        WHEN TotalAmount - COALESCE((SELECT SUM(p.Amount) FROM Payments p WHERE p.InvoiceId = Invoices.InvoiceID), 0) <= 0 THEN 'Paid'
        WHEN COALESCE((SELECT SUM(p.Amount) FROM Payments p WHERE p.InvoiceId = Invoices.InvoiceID), 0) > 0 THEN 'PartiallyPaid'
        ELSE 'Unpaid'
    END
WHERE InvoiceStatusID = 2; -- ISSUED only

-- 3. Tạo bảng DebtRecords
CREATE TABLE IF NOT EXISTS DebtRecords (
    DebtRecordId INT AUTO_INCREMENT PRIMARY KEY,
    InvoiceId INT NOT NULL,
    InvoiceNumber VARCHAR(50) NOT NULL,
    CustomerId INT NOT NULL,
    CustomerName VARCHAR(255) NOT NULL,
    CustomerTaxCode VARCHAR(20),
    CustomerEmail VARCHAR(255),
    CustomerPhone VARCHAR(20),
    CustomerAddress VARCHAR(500),
    InvoiceDate DATETIME NOT NULL,
    DueDate DATETIME NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    PaidAmount DECIMAL(18,2) DEFAULT 0,
    RemainingAmount DECIMAL(18,2) NOT NULL,
    PaymentStatus VARCHAR(50) DEFAULT 'Unpaid',
    Description VARCHAR(500),
    IsOverdue BIT DEFAULT 0,
    CreatedAt DATETIME NOT NULL,
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME,
    UpdatedBy INT,
    FOREIGN KEY (InvoiceId) REFERENCES Invoices(InvoiceID),
    FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerID),
    INDEX IDX_DebtRecords_CustomerId (CustomerId),
    INDEX IDX_DebtRecords_PaymentStatus (PaymentStatus),
    INDEX IDX_DebtRecords_DueDate (DueDate)
);

-- 4. Create indexes
CREATE INDEX IDX_Invoices_PaymentStatus ON Invoices(PaymentStatus);
CREATE INDEX IDX_Invoices_CustomerID_PaymentStatus ON Invoices(CustomerID, PaymentStatus);
```

### 6.3. Deployment Steps

1. **Deploy to Staging**
   - [ ] Deploy code to staging environment
   - [ ] Run database migration
   - [ ] Test all 3 tasks
   - [ ] Test end-to-end workflow
   - [ ] Verify frontend integration

2. **Deploy to Production**
   - [ ] Backup production database
   - [ ] Deploy code to production
   - [ ] Run database migration
   - [ ] Smoke test: Tạo 1 invoice test và issue
   - [ ] Verify debt created
   - [ ] Ghi nhận payment test
   - [ ] Verify invoice updated

3. **Post-deployment**
   - [ ] Monitor logs for errors
   - [ ] Check API response times
   - [ ] Verify frontend displays correctly
   - [ ] Get user feedback

### 6.4. Rollback Plan

Nếu có vấn đề, rollback như sau:

```sql
-- 1. Drop new table
DROP TABLE IF EXISTS DebtRecords;

-- 2. Remove new columns from Invoices (optional, có thể giữ lại)
-- ALTER TABLE Invoices DROP COLUMN PaidAmount;
-- ALTER TABLE Invoices DROP COLUMN RemainingAmount;
-- ALTER TABLE Invoices DROP COLUMN PaymentStatus;
-- ALTER TABLE Invoices DROP COLUMN LastPaymentDate;

-- 3. Restore code from backup
-- 4. Restart application
```

---

## 7. MONITORING & LOGGING

### 7.1. Key Metrics to Monitor

- **Payment Creation Rate**: Số payment được tạo mỗi giờ
- **Invoice Update Success Rate**: % invoice được update thành công sau payment
- **Debt Creation Success Rate**: % debt được tạo thành công sau issue
- **API Response Time**: Thời gian response của các API (should be < 500ms)
- **Error Rate**: % request bị lỗi

### 7.2. Important Logs to Check

```csharp
// Payment created
_logger.LogInformation($"✅ Payment created: ID={paymentId}, InvoiceId={invoiceId}, Amount={amount}");

// Invoice updated
_logger.LogInformation($"✅ Invoice {invoiceId} marked as PAID/PARTIALLY PAID");

// Debt created
_logger.LogInformation($"✅ Auto-created debt for invoice {invoiceNumber}, Customer: {customerName}");

// Errors
_logger.LogError(ex, $"❌ Error creating payment for invoice {invoiceId}");
_logger.LogError(ex, $"❌ Error issuing invoice {invoiceId}");
```

### 7.3. Alerts to Set Up

- Alert when error rate > 5%
- Alert when API response time > 1 second
- Alert when transaction rollback occurs
- Alert when debt creation fails after invoice issue

---

## 8. FAQ & TROUBLESHOOTING

### Q1: Nếu payment được tạo nhưng invoice không update được thì sao?

**A**: Transaction sẽ rollback toàn bộ, payment không được tạo. Đảm bảo luôn wrap trong transaction.

### Q2: Nếu issue invoice thành công nhưng debt không tạo được?

**A**: Transaction sẽ rollback, invoice không được issue. User cần thử lại.

### Q3: Làm sao để tạo lại debt cho các invoice cũ đã phát hành trước đây?

**A**: Chạy script sau:

```sql
INSERT INTO DebtRecords (
    InvoiceId, InvoiceNumber, CustomerId, CustomerName,
    InvoiceDate, DueDate, TotalAmount, PaidAmount, 
    RemainingAmount, PaymentStatus, CreatedAt, CreatedBy
)
SELECT 
    i.InvoiceID,
    i.InvoiceNumber,
    i.CustomerID,
    c.Name,
    i.InvoiceDate,
    COALESCE(i.PaymentDueDate, DATE_ADD(i.InvoiceDate, INTERVAL 30 DAY)),
    i.TotalAmount,
    COALESCE(i.PaidAmount, 0),
    i.TotalAmount - COALESCE(i.PaidAmount, 0),
    CASE
        WHEN i.TotalAmount - COALESCE(i.PaidAmount, 0) <= 0 THEN 'Paid'
        WHEN COALESCE(i.PaidAmount, 0) > 0 THEN 'PartiallyPaid'
        ELSE 'Unpaid'
    END,
    NOW(),
    1
FROM Invoices i
INNER JOIN Customers c ON i.CustomerID = c.CustomerID
WHERE i.InvoiceStatusID = 2  -- ISSUED
AND i.InvoiceNumber IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM DebtRecords d WHERE d.InvoiceId = i.InvoiceID
);
```

### Q4: Frontend không hiển thị debt records mới, tại sao?

**A**: Kiểm tra:
1. Backend API `/api/Customer/debt-summary` có trả về data không?
2. Frontend có call đúng endpoint không?
3. Check browser console for errors
4. Verify auth token còn valid không

---

## ✅ FINAL CHECKLIST

### Backend Implementation:
- [ ] **Task 1**: Update `PaymentController.CreatePayment()`
  - [ ] Add transaction
  - [ ] Update invoice fields
  - [ ] Return invoice info in response
- [ ] **Task 2**: Update `InvoiceController.IssueInvoice()`
  - [ ] Create DebtRecord model
  - [ ] Add migration
  - [ ] Auto-create debt record
  - [ ] Return debt info in response
- [ ] **Task 3**: Create `CustomerController.GetDebtSummary()`
  - [ ] Implement query logic
  - [ ] Add search, sort, filter
  - [ ] Add pagination

### Database:
- [ ] Add columns to Invoices table
- [ ] Create DebtRecords table
- [ ] Create indexes
- [ ] Update existing data

### Testing:
- [ ] Test partial payment
- [ ] Test full payment
- [ ] Test payment validation
- [ ] Test issue invoice creates debt
- [ ] Test debt summary API
- [ ] Test end-to-end workflow

### Deployment:
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Smoke test production
- [ ] Monitor logs

---

## 📞 SUPPORT

Nếu cần hỗ trợ thêm:
- Database schema chi tiết hơn
- Sample data for testing
- Postman collection
- Unit test examples

Hãy liên hệ! 🚀

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-24  
**Author**: Backend Implementation Guide for EIMS Debt Management
