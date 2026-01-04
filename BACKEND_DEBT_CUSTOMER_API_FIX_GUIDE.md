# 🔧 HƯỚNG DẪN FIX BACKEND - CUSTOMER DEBT DETAIL API

> **Ngày tạo**: 28/12/2025  
> **Mục tiêu**: Fix API `GET /api/Customer/{id}/debt-detail` theo chuẩn Payment API  
> **Ưu tiên**: HIGH - Critical for performance  
> **Thời gian ước tính**: 1-2 ngày

## ⚠️ QUAN TRỌNG - CHỈ FIX GET ENDPOINT

**✅ POST /api/Payment - Đã tốt (9.7/10) - KHÔNG CẦN SỬA**

**❌ GET /api/Customer/{id}/debt-detail - Cần sửa (4/10) - FILE NÀY HƯỚNG DẪN FIX ENDPOINT NÀY**

---

## 📋 MỤC LỤC

1. [Tổng quan vấn đề](#1-tổng-quan-vấn-đề)
2. [Target API structure](#2-target-api-structure)
3. [Implementation guide](#3-implementation-guide)
4. [Code examples](#4-code-examples)
5. [Database changes](#5-database-changes)
6. [Testing checklist](#6-testing-checklist)
7. [Deployment steps](#7-deployment-steps)

---

## 1. TỔNG QUAN VẤN ĐỀ

### 📌 Scope của Fix

**Chỉ fix endpoint này**:
- ❌ `GET /api/Customer/{id}/debt-detail` - Hiện tại 4/10, cần fix

**KHÔNG động đến**:
- ✅ `POST /api/Payment` - Đã xuất sắc 9.7/10
- ✅ `GET /api/Payment` - Đã có pagination hoàn hảo

### ❌ Current API Response (WRONG)

**Endpoint**: `GET /api/Customer/1/debt-detail`

```json
{
  "customer": { ... },
  "summary": { ... },
  "invoices": {
    "items": [
      {
        "invoiceID": 44,              // ❌ PascalCase
        "signDate": "2024-12-25",     // ❌ Tên field sai
        "owedAmount": 2,              // ❌ Tên field sai
        "paymentStatus": "Unpaid"
      }
    ],
    "totalCount": 7,
    "pageIndex": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "payments": {
    "items": [],
    "totalCount": 0
  }
}
```

### ❌ Các vấn đề hiện tại

1. **Field naming không khớp Payment API**:
   - `invoices` thay vì `unpaidInvoices`
   - `payments` thay vì `paymentHistory`
   - `invoiceID` thay vì `invoiceId`
   - `signDate` thay vì `invoiceDate`
   - `owedAmount` thay vì `remainingAmount`

2. **Missing fields**:
   - Không có `dueDate`
   - Không có `paidAmount`
   - Không có `isOverdue`
   - Không có `description`

3. **Pagination không hoạt động**:
   - Frontend gửi `PageSize=1000` nhưng backend bỏ qua
   - Không có pagination parameters trong endpoint

4. **Performance kém**:
   - Trả về toàn bộ data (1000 items)
   - Response size lớn (500KB-1MB)
   - Query chậm (2-5 giây)

### ✅ Target API Response (CORRECT)

Theo pattern của Payment API (9.7/10):

```json
{
  "customer": {
    "customerId": 1,
    "customerName": "Công ty ABC",
    "taxCode": "0123456789",
    "email": "abc@example.com",
    "phone": "0901234567",
    "address": "123 Đường ABC"
  },
  "summary": {
    "totalDebt": 150000000,
    "overdueDebt": 50000000,
    "totalPaid": 100000000,
    "invoiceCount": 25,
    "unpaidInvoiceCount": 10,
    "lastPaymentDate": "2025-12-20T10:30:00Z"
  },
  "unpaidInvoices": {
    "items": [
      {
        "invoiceId": 44,                    // ✅ camelCase
        "invoiceNumber": "INV-2024-001",    // ✅ String
        "invoiceDate": "2024-12-25T00:00:00Z", // ✅ ISO 8601
        "dueDate": "2025-01-24T00:00:00Z",  // ✅ Added
        "totalAmount": 10000000,
        "paidAmount": 0,                    // ✅ Added
        "remainingAmount": 10000000,        // ✅ Renamed
        "paymentStatus": "Unpaid",
        "description": "Invoice for ...",   // ✅ Added
        "isOverdue": true                   // ✅ Added
      }
    ],
    "pageIndex": 1,
    "pageSize": 10,                         // ✅ Added
    "totalCount": 10,
    "totalPages": 1,                        // ✅ Added
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "paymentHistory": {                       // ✅ Renamed
    "items": [
      {
        "paymentId": 3,                     // ✅ camelCase
        "invoiceId": 40,
        "invoiceNumber": "INV-2024-001",
        "amount": 5000000,
        "paymentMethod": "BankTransfer",
        "transactionCode": "TX123",
        "note": "Payment for...",
        "paymentDate": "2025-12-15T10:00:00Z",
        "userId": 1,
        "userName": "Admin User"
      }
    ],
    "pageIndex": 1,
    "pageSize": 10,
    "totalCount": 5,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

---

## 2. TARGET API STRUCTURE

### API Endpoint

```
GET /api/Customer/{customerId}/debt-detail
```

### Query Parameters

| Parameter | Type | Default | Max | Required | Description |
|-----------|------|---------|-----|----------|-------------|
| `InvoicePageIndex` | int | 1 | - | No | Invoice page number (1-based) |
| `InvoicePageSize` | int | 10 | 100 | No | Items per page for invoices |
| `PaymentPageIndex` | int | 1 | - | No | Payment page number (1-based) |
| `PaymentPageSize` | int | 10 | 100 | No | Items per page for payments |
| `SortBy` | string | "invoiceDate" | - | No | Sort field: invoiceDate, amount, dueDate |
| `SortOrder` | string | "desc" | - | No | Sort direction: asc, desc |

### Example Requests

```bash
# Default pagination (10 items per page)
GET /api/Customer/1/debt-detail

# Custom pagination
GET /api/Customer/1/debt-detail?InvoicePageIndex=1&InvoicePageSize=20&PaymentPageIndex=1&PaymentPageSize=5

# With sorting
GET /api/Customer/1/debt-detail?SortBy=dueDate&SortOrder=asc
```

### Response HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid parameters (PageSize > 100) |
| 404 | Customer not found |
| 401 | Unauthorized |
| 500 | Server error |

---

## 3. IMPLEMENTATION GUIDE

### ⚠️ Lưu ý Quan Trọng

**Chỉ sửa trong `CustomerController.cs` và `CustomerService.cs`**:
- ✅ Method `GetCustomerDebtDetail()` - CẦN SỬA
- ✅ DTOs cho Customer Debt - CẦN SỬA

**KHÔNG động đến `PaymentController.cs`**:
- ✅ POST `/api/Payment` - Đã hoàn hảo, giữ nguyên
- ✅ GET `/api/Payment` - Đã hoàn hảo, giữ nguyên

### Bước 1: Update Controller

**File**: `Controllers/CustomerController.cs`

#### Thêm parameters vào endpoint

```csharp
[HttpGet("{customerId}/debt-detail")]
[ProducesResponseType(typeof(CustomerDebtDetailResponse), 200)]
[ProducesResponseType(typeof(ErrorResponse), 404)]
public async Task<IActionResult> GetCustomerDebtDetail(
    int customerId,
    [FromQuery] int invoicePageIndex = 1,
    [FromQuery] int invoicePageSize = 10,
    [FromQuery] int paymentPageIndex = 1,
    [FromQuery] int paymentPageSize = 10,
    [FromQuery] string sortBy = "invoiceDate",
    [FromQuery] string sortOrder = "desc")
{
    // Implementation in section 4
}
```

### Bước 2: Update Service Interface

**File**: `Services/ICustomerService.cs`

```csharp
public interface ICustomerService
{
    Task<CustomerDebtDetailResult> GetCustomerDebtDetailAsync(
        int customerId,
        int invoicePageIndex,
        int invoicePageSize,
        int paymentPageIndex,
        int paymentPageSize,
        string sortBy,
        string sortOrder);
}
```

### Bước 3: Update DTOs

**File**: `DTOs/CustomerDebtDTOs.cs`

Tạo DTOs mới phù hợp với Payment API structure:

```csharp
public class CustomerDebtDetailResponse
{
    public CustomerDto Customer { get; set; }
    public DebtSummaryDto Summary { get; set; }
    public PaginatedData<UnpaidInvoiceDto> UnpaidInvoices { get; set; }
    public PaginatedData<PaymentHistoryDto> PaymentHistory { get; set; }
}

public class UnpaidInvoiceDto
{
    public int InvoiceId { get; set; }              // ✅ Changed from InvoiceID
    public string InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }       // ✅ Changed from SignDate
    public DateTime DueDate { get; set; }           // ✅ Added
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }         // ✅ Added
    public decimal RemainingAmount { get; set; }    // ✅ Changed from OwedAmount
    public string PaymentStatus { get; set; }
    public string Description { get; set; }         // ✅ Added
    public bool IsOverdue { get; set; }             // ✅ Added
}

public class PaymentHistoryDto
{
    public int PaymentId { get; set; }              // ✅ Changed from PaymentID
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; }
    public string TransactionCode { get; set; }
    public string Note { get; set; }
    public DateTime PaymentDate { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; }
}

public class PaginatedData<T>
{
    public List<T> Items { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}
```

### Bước 4: Update Service Implementation

Chi tiết code trong section 4.

### Bước 5: Update Database Queries

Chi tiết trong section 5.

---

## 4. CODE EXAMPLES

### A. Controller Implementation (FULL CODE)

**File**: `Controllers/CustomerController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace EIMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;
        private readonly ILogger<CustomerController> _logger;

        public CustomerController(
            ICustomerService customerService,
            ILogger<CustomerController> logger)
        {
            _customerService = customerService;
            _logger = logger;
        }

        /// <summary>
        /// Get detailed debt information for a specific customer with pagination
        /// </summary>
        [HttpGet("{customerId}/debt-detail")]
        [ProducesResponseType(typeof(CustomerDebtDetailResponse), 200)]
        [ProducesResponseType(typeof(ErrorResponse), 400)]
        [ProducesResponseType(typeof(ErrorResponse), 404)]
        [ProducesResponseType(typeof(ErrorResponse), 500)]
        public async Task<IActionResult> GetCustomerDebtDetail(
            int customerId,
            [FromQuery] int invoicePageIndex = 1,
            [FromQuery] int invoicePageSize = 10,
            [FromQuery] int paymentPageIndex = 1,
            [FromQuery] int paymentPageSize = 10,
            [FromQuery] string sortBy = "invoiceDate",
            [FromQuery] string sortOrder = "desc")
        {
            try
            {
                // ===== VALIDATION =====
                
                // Check customer exists
                if (!await _customerService.ExistsAsync(customerId))
                {
                    _logger.LogWarning("Customer {CustomerId} not found", customerId);
                    return NotFound(new ErrorResponse
                    {
                        Error = "CUSTOMER_NOT_FOUND",
                        Message = $"Customer with ID {customerId} does not exist",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                // Validate and normalize pagination
                if (invoicePageIndex < 1)
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = "INVALID_PAGE_INDEX",
                        Message = "Invoice page index must be at least 1",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                if (invoicePageSize < 1 || invoicePageSize > 100)
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = "INVALID_PAGE_SIZE",
                        Message = "Invoice page size must be between 1 and 100",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                if (paymentPageIndex < 1)
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = "INVALID_PAGE_INDEX",
                        Message = "Payment page index must be at least 1",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                if (paymentPageSize < 1 || paymentPageSize > 100)
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = "INVALID_PAGE_SIZE",
                        Message = "Payment page size must be between 1 and 100",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                // Validate sort parameters
                var validSortFields = new[] { "invoiceDate", "amount", "dueDate", "invoiceNumber" };
                if (!string.IsNullOrEmpty(sortBy) && !validSortFields.Contains(sortBy.ToLower()))
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = "INVALID_SORT_FIELD",
                        Message = $"Sort field must be one of: {string.Join(", ", validSortFields)}",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                var validSortOrders = new[] { "asc", "desc" };
                if (!string.IsNullOrEmpty(sortOrder) && !validSortOrders.Contains(sortOrder.ToLower()))
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = "INVALID_SORT_ORDER",
                        Message = "Sort order must be 'asc' or 'desc'",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                // ===== FETCH DATA =====

                _logger.LogInformation(
                    "Fetching debt detail for customer {CustomerId} " +
                    "(Invoice: {InvoicePageIndex}/{InvoicePageSize}, " +
                    "Payment: {PaymentPageIndex}/{PaymentPageSize}, " +
                    "Sort: {SortBy} {SortOrder})",
                    customerId, invoicePageIndex, invoicePageSize,
                    paymentPageIndex, paymentPageSize,
                    sortBy, sortOrder);

                var stopwatch = Stopwatch.StartNew();

                var result = await _customerService.GetCustomerDebtDetailAsync(
                    customerId,
                    invoicePageIndex,
                    invoicePageSize,
                    paymentPageIndex,
                    paymentPageSize,
                    sortBy ?? "invoiceDate",
                    sortOrder ?? "desc");

                stopwatch.Stop();

                // ===== LOGGING =====

                _logger.LogInformation(
                    "Debt detail fetched successfully for customer {CustomerId} " +
                    "in {ElapsedMs}ms (Invoices: {InvoiceCount}, Payments: {PaymentCount})",
                    customerId,
                    stopwatch.ElapsedMilliseconds,
                    result.UnpaidInvoices.Count,
                    result.PaymentHistory.Count);

                // Warning for slow queries
                if (stopwatch.ElapsedMilliseconds > 1000)
                {
                    _logger.LogWarning(
                        "SLOW QUERY: Customer {CustomerId} took {ElapsedMs}ms",
                        customerId,
                        stopwatch.ElapsedMilliseconds);
                }

                // ===== BUILD RESPONSE =====

                var response = new CustomerDebtDetailResponse
                {
                    Customer = result.Customer,
                    Summary = result.Summary,
                    UnpaidInvoices = new PaginatedData<UnpaidInvoiceDto>
                    {
                        Items = result.UnpaidInvoices,
                        PageIndex = invoicePageIndex,
                        PageSize = invoicePageSize,
                        TotalCount = result.TotalUnpaidInvoiceCount,
                        TotalPages = (int)Math.Ceiling(result.TotalUnpaidInvoiceCount / (double)invoicePageSize),
                        HasPreviousPage = invoicePageIndex > 1,
                        HasNextPage = invoicePageIndex < (int)Math.Ceiling(result.TotalUnpaidInvoiceCount / (double)invoicePageSize)
                    },
                    PaymentHistory = new PaginatedData<PaymentHistoryDto>
                    {
                        Items = result.PaymentHistory,
                        PageIndex = paymentPageIndex,
                        PageSize = paymentPageSize,
                        TotalCount = result.TotalPaymentCount,
                        TotalPages = (int)Math.Ceiling(result.TotalPaymentCount / (double)paymentPageSize),
                        HasPreviousPage = paymentPageIndex > 1,
                        HasNextPage = paymentPageIndex < (int)Math.Ceiling(result.TotalPaymentCount / (double)paymentPageSize)
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error fetching debt detail for customer {CustomerId}",
                    customerId);
                
                return StatusCode(500, new ErrorResponse
                {
                    Error = "INTERNAL_ERROR",
                    Message = "An error occurred while fetching debt details",
                    TraceId = HttpContext.TraceIdentifier
                });
            }
        }
    }

    // ===== DTOs =====

    public class ErrorResponse
    {
        public string Error { get; set; }
        public string Message { get; set; }
        public string TraceId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
```

### B. Service Implementation (FULL CODE)

**File**: `Services/CustomerService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EIMS.API.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomerService> _logger;

        public CustomerService(
            ApplicationDbContext context,
            ILogger<CustomerService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> ExistsAsync(int customerId)
        {
            return await _context.Customers
                .AnyAsync(c => c.CustomerId == customerId);
        }

        public async Task<CustomerDebtDetailResult> GetCustomerDebtDetailAsync(
            int customerId,
            int invoicePageIndex,
            int invoicePageSize,
            int paymentPageIndex,
            int paymentPageSize,
            string sortBy,
            string sortOrder)
        {
            var result = new CustomerDebtDetailResult();
            var now = DateTime.UtcNow;

            // ===== 1. GET CUSTOMER INFO =====
            result.Customer = await _context.Customers
                .Where(c => c.CustomerId == customerId)
                .Select(c => new CustomerDto
                {
                    CustomerId = c.CustomerId,
                    CustomerName = c.Name,
                    TaxCode = c.TaxCode,
                    Email = c.Email,
                    Phone = c.Phone,
                    Address = c.Address
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();

            // ===== 2. CALCULATE DEBT SUMMARY =====
            var invoicesQuery = _context.Invoices
                .Where(i => i.CustomerId == customerId && i.Status == "ISSUED");

            result.Summary = new DebtSummaryDto
            {
                TotalDebt = await invoicesQuery
                    .SumAsync(i => i.RemainingAmount ?? 0),
                
                OverdueDebt = await invoicesQuery
                    .Where(i => i.DueDate < now && i.PaymentStatus != "Paid")
                    .SumAsync(i => i.RemainingAmount ?? 0),
                
                TotalPaid = await invoicesQuery
                    .SumAsync(i => i.PaidAmount ?? 0),
                
                InvoiceCount = await invoicesQuery.CountAsync(),
                
                UnpaidInvoiceCount = await invoicesQuery
                    .Where(i => i.PaymentStatus != "Paid")
                    .CountAsync(),
                
                LastPaymentDate = await _context.Payments
                    .Where(p => p.Invoice.CustomerId == customerId)
                    .OrderByDescending(p => p.PaymentDate)
                    .Select(p => (DateTime?)p.PaymentDate)
                    .FirstOrDefaultAsync()
            };

            // ===== 3. GET UNPAID INVOICES WITH PAGINATION =====
            var unpaidInvoicesQuery = _context.Invoices
                .Where(i => i.CustomerId == customerId &&
                           i.Status == "ISSUED" &&
                           i.PaymentStatus != "Paid")
                .Select(i => new UnpaidInvoiceDto
                {
                    InvoiceId = i.InvoiceId,                    // ✅ camelCase
                    InvoiceNumber = i.InvoiceNumber,
                    InvoiceDate = i.InvoiceDate,                // ✅ Not SignDate
                    DueDate = i.DueDate,                        // ✅ Added
                    TotalAmount = i.TotalAmount,
                    PaidAmount = i.PaidAmount ?? 0,             // ✅ Added
                    RemainingAmount = i.RemainingAmount ?? i.TotalAmount, // ✅ Not OwedAmount
                    PaymentStatus = i.PaymentStatus ?? "Unpaid",
                    Description = i.Description ?? "",          // ✅ Added
                    IsOverdue = i.DueDate < now && i.PaymentStatus != "Paid" // ✅ Added
                });

            // Apply sorting
            unpaidInvoicesQuery = ApplySorting(unpaidInvoicesQuery, sortBy, sortOrder);

            // Get total count BEFORE pagination
            result.TotalUnpaidInvoiceCount = await unpaidInvoicesQuery.CountAsync();

            // Apply pagination
            result.UnpaidInvoices = await unpaidInvoicesQuery
                .Skip((invoicePageIndex - 1) * invoicePageSize)
                .Take(invoicePageSize)
                .AsNoTracking()
                .ToListAsync();

            // ===== 4. GET PAYMENT HISTORY WITH PAGINATION =====
            var paymentHistoryQuery = _context.Payments
                .Where(p => p.Invoice.CustomerId == customerId)
                .Include(p => p.Invoice)
                .Include(p => p.User)
                .Select(p => new PaymentHistoryDto
                {
                    PaymentId = p.PaymentId,                    // ✅ camelCase
                    InvoiceId = p.InvoiceId,
                    InvoiceNumber = p.Invoice.InvoiceNumber,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    TransactionCode = p.TransactionCode,
                    Note = p.Note,
                    PaymentDate = p.PaymentDate,
                    UserId = p.UserId,
                    UserName = p.User.FullName
                });

            // Sort by date (newest first by default)
            paymentHistoryQuery = sortOrder.ToLower() == "asc"
                ? paymentHistoryQuery.OrderBy(p => p.PaymentDate)
                : paymentHistoryQuery.OrderByDescending(p => p.PaymentDate);

            // Get total count BEFORE pagination
            result.TotalPaymentCount = await paymentHistoryQuery.CountAsync();

            // Apply pagination
            result.PaymentHistory = await paymentHistoryQuery
                .Skip((paymentPageIndex - 1) * paymentPageSize)
                .Take(paymentPageSize)
                .AsNoTracking()
                .ToListAsync();

            return result;
        }

        private IQueryable<UnpaidInvoiceDto> ApplySorting(
            IQueryable<UnpaidInvoiceDto> query,
            string sortBy,
            string sortOrder)
        {
            var isAscending = sortOrder.ToLower() == "asc";

            return sortBy.ToLower() switch
            {
                "amount" => isAscending
                    ? query.OrderBy(i => i.TotalAmount)
                    : query.OrderByDescending(i => i.TotalAmount),
                
                "duedate" => isAscending
                    ? query.OrderBy(i => i.DueDate)
                    : query.OrderByDescending(i => i.DueDate),
                
                "invoicenumber" => isAscending
                    ? query.OrderBy(i => i.InvoiceNumber)
                    : query.OrderByDescending(i => i.InvoiceNumber),
                
                _ => isAscending
                    ? query.OrderBy(i => i.InvoiceDate)
                    : query.OrderByDescending(i => i.InvoiceDate)
            };
        }
    }

    // ===== Result class =====
    public class CustomerDebtDetailResult
    {
        public CustomerDto Customer { get; set; }
        public DebtSummaryDto Summary { get; set; }
        public List<UnpaidInvoiceDto> UnpaidInvoices { get; set; }
        public int TotalUnpaidInvoiceCount { get; set; }
        public List<PaymentHistoryDto> PaymentHistory { get; set; }
        public int TotalPaymentCount { get; set; }
    }
}
```

---

## 5. DATABASE CHANGES

### A. Indexes (for Performance)

**File**: `Database/Migrations/AddDebtDetailIndexes.sql`

```sql
-- =====================================================
-- CUSTOMER DEBT DETAIL - PERFORMANCE INDEXES
-- =====================================================

-- 1. Index for unpaid invoices query
-- Covers: WHERE CustomerId = X AND Status = 'ISSUED' AND PaymentStatus != 'Paid'
CREATE INDEX IF NOT EXISTS IDX_Invoice_Customer_Status_PaymentStatus
ON Invoices(CustomerId, Status, PaymentStatus)
INCLUDE (InvoiceNumber, InvoiceDate, DueDate, TotalAmount, PaidAmount, RemainingAmount, Description)
WHERE Status = 'ISSUED';

-- 2. Index for overdue calculation
-- Covers: WHERE DueDate < NOW() AND PaymentStatus != 'Paid'
CREATE INDEX IF NOT EXISTS IDX_Invoice_DueDate_PaymentStatus
ON Invoices(DueDate, PaymentStatus)
INCLUDE (CustomerId, RemainingAmount)
WHERE PaymentStatus IN ('Unpaid', 'PartiallyPaid');

-- 3. Index for payment history by customer
-- Covers: WHERE Invoice.CustomerId = X ORDER BY PaymentDate DESC
CREATE INDEX IF NOT EXISTS IDX_Payment_Invoice_Customer
ON Payments(InvoiceId, PaymentDate DESC)
INCLUDE (Amount, PaymentMethod, TransactionCode, Note, UserId);

-- 4. Ensure foreign key indexes exist
CREATE INDEX IF NOT EXISTS IDX_Invoice_CustomerId
ON Invoices(CustomerId);

CREATE INDEX IF NOT EXISTS IDX_Payment_InvoiceId
ON Payments(InvoiceId);

CREATE INDEX IF NOT EXISTS IDX_Payment_UserId
ON Payments(UserId);

-- =====================================================
-- VERIFY INDEXES
-- =====================================================

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('invoices', 'payments')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### B. Check Column Names

**Important**: Đảm bảo tên columns trong database khớp với code:

```sql
-- Check Invoice columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Expected columns:
-- InvoiceId (or invoice_id)
-- InvoiceNumber (or invoice_number)
-- InvoiceDate (or invoice_date)
-- DueDate (or due_date)
-- TotalAmount (or total_amount)
-- PaidAmount (or paid_amount)
-- RemainingAmount (or remaining_amount)
-- PaymentStatus (or payment_status)
-- Description (or description)
-- Status
-- CustomerId (or customer_id)
```

**⚠️ Nếu database dùng snake_case**, update code mapping:

```csharp
// In CustomerService.cs, add column name mapping
.Select(i => new UnpaidInvoiceDto
{
    InvoiceId = i.InvoiceId,
    InvoiceNumber = i.InvoiceNumber,
    InvoiceDate = i.InvoiceDate,
    // ... etc
})
```

Or configure EF Core column names:

```csharp
// In ApplicationDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Invoice>(entity =>
    {
        entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
        entity.Property(e => e.InvoiceNumber).HasColumnName("invoice_number");
        entity.Property(e => e.InvoiceDate).HasColumnName("invoice_date");
        // ... etc
    });
}
```

---

## 6. TESTING CHECKLIST

### A. Unit Tests

```csharp
[Fact]
public async Task GetCustomerDebtDetail_WithValidCustomer_ReturnsData()
{
    // Arrange
    var customerId = 1;
    var invoicePageIndex = 1;
    var invoicePageSize = 10;

    // Act
    var result = await _controller.GetCustomerDebtDetail(
        customerId, invoicePageIndex, invoicePageSize, 1, 10);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result);
    var response = Assert.IsType<CustomerDebtDetailResponse>(okResult.Value);
    Assert.NotNull(response.Customer);
    Assert.NotNull(response.Summary);
    Assert.NotNull(response.UnpaidInvoices);
    Assert.Equal(invoicePageIndex, response.UnpaidInvoices.PageIndex);
    Assert.Equal(invoicePageSize, response.UnpaidInvoices.PageSize);
}

[Fact]
public async Task GetCustomerDebtDetail_WithInvalidCustomer_Returns404()
{
    // Arrange
    var invalidCustomerId = 999999;

    // Act
    var result = await _controller.GetCustomerDebtDetail(invalidCustomerId);

    // Assert
    var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
    var error = Assert.IsType<ErrorResponse>(notFoundResult.Value);
    Assert.Equal("CUSTOMER_NOT_FOUND", error.Error);
}

[Fact]
public async Task GetCustomerDebtDetail_WithInvalidPageSize_Returns400()
{
    // Arrange
    var customerId = 1;
    var invalidPageSize = 150; // Exceeds max 100

    // Act
    var result = await _controller.GetCustomerDebtDetail(
        customerId, 1, invalidPageSize);

    // Assert
    var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
    var error = Assert.IsType<ErrorResponse>(badRequestResult.Value);
    Assert.Equal("INVALID_PAGE_SIZE", error.Error);
}

[Fact]
public async Task GetCustomerDebtDetail_Pagination_ReturnsCorrectPage()
{
    // Arrange
    var customerId = 1;
    var pageIndex = 2;
    var pageSize = 5;

    // Act
    var result = await _controller.GetCustomerDebtDetail(
        customerId, pageIndex, pageSize);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result);
    var response = Assert.IsType<CustomerDebtDetailResponse>(okResult.Value);
    Assert.Equal(pageIndex, response.UnpaidInvoices.PageIndex);
    Assert.True(response.UnpaidInvoices.Items.Count <= pageSize);
    Assert.Equal(pageIndex > 1, response.UnpaidInvoices.HasPreviousPage);
}
```

### B. Integration Tests

```bash
# Test 1: Default pagination
curl -X GET "http://localhost:5000/api/Customer/1/debt-detail" \
  -H "Authorization: Bearer <token>"

# Expected: 
# - unpaidInvoices.pageIndex = 1
# - unpaidInvoices.pageSize = 10
# - unpaidInvoices.items.length <= 10

# Test 2: Custom pagination
curl -X GET "http://localhost:5000/api/Customer/1/debt-detail?InvoicePageIndex=2&InvoicePageSize=5" \
  -H "Authorization: Bearer <token>"

# Expected:
# - unpaidInvoices.pageIndex = 2
# - unpaidInvoices.pageSize = 5
# - unpaidInvoices.items.length <= 5
# - unpaidInvoices.hasPreviousPage = true

# Test 3: Invalid customer
curl -X GET "http://localhost:5000/api/Customer/999999/debt-detail" \
  -H "Authorization: Bearer <token>"

# Expected: 404 with error "CUSTOMER_NOT_FOUND"

# Test 4: Invalid page size
curl -X GET "http://localhost:5000/api/Customer/1/debt-detail?InvoicePageSize=150" \
  -H "Authorization: Bearer <token>"

# Expected: 400 with error "INVALID_PAGE_SIZE"

# Test 5: Sorting
curl -X GET "http://localhost:5000/api/Customer/1/debt-detail?SortBy=dueDate&SortOrder=asc" \
  -H "Authorization: Bearer <token>"

# Expected: invoices sorted by dueDate ascending
```

### C. Performance Tests

```bash
# Test với customer có nhiều invoices (>100)
curl -X GET "http://localhost:5000/api/Customer/1/debt-detail?InvoicePageSize=10" \
  -w "\nTime: %{time_total}s\nSize: %{size_download} bytes\n"

# Expected:
# - Time: < 0.5 seconds
# - Size: < 50KB for 10 items
```

### D. Manual Testing Checklist

- [ ] Test với customer không tồn tại → 404
- [ ] Test với pageSize = 1 → trả về 1 item
- [ ] Test với pageSize = 100 → trả về max 100 items
- [ ] Test với pageSize > 100 → 400 error
- [ ] Test với pageIndex = 1 → hasPreviousPage = false
- [ ] Test với pageIndex = lastPage → hasNextPage = false
- [ ] Test sorting by invoiceDate asc
- [ ] Test sorting by dueDate desc
- [ ] Test sorting by amount
- [ ] Test với customer không có invoices → empty items array
- [ ] Test với customer không có payments → empty payment items
- [ ] Verify field names: invoiceId (not invoiceID)
- [ ] Verify field names: invoiceDate (not signDate)
- [ ] Verify field names: remainingAmount (not owedAmount)
- [ ] Verify field names: unpaidInvoices (not invoices)
- [ ] Verify field names: paymentHistory (not payments)
- [ ] Verify isOverdue = true for overdue invoices
- [ ] Verify paidAmount field exists
- [ ] Verify dueDate field exists
- [ ] Verify description field exists

---

## 7. DEPLOYMENT STEPS

### Step 1: Code Review

- [ ] Review Controller changes
- [ ] Review Service changes
- [ ] Review DTO changes
- [ ] Check for breaking changes in existing code
- [ ] Verify all field name changes

### Step 2: Database Migration

```bash
# Create migration
dotnet ef migrations add AddDebtDetailPagination

# Review migration SQL
dotnet ef migrations script

# Apply to development
dotnet ef database update

# Apply indexes
psql -d eims_db -f AddDebtDetailIndexes.sql
```

### Step 3: Testing

- [ ] Run unit tests: `dotnet test`
- [ ] Run integration tests
- [ ] Test on staging environment
- [ ] Performance testing with large dataset
- [ ] Load testing with multiple concurrent users

### Step 4: API Documentation

Update Swagger/OpenAPI specs:

```csharp
// In Startup.cs or Program.cs
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v2", new OpenApiInfo
    {
        Title = "EIMS API",
        Version = "v2",
        Description = "Updated Customer Debt Detail API with pagination"
    });
});
```

### Step 5: Frontend Notification

Notify frontend team về breaking changes:

```
BREAKING CHANGES in /api/Customer/{id}/debt-detail:

1. Response structure changed:
   - "invoices" → "unpaidInvoices"
   - "payments" → "paymentHistory"

2. Field names changed:
   - "invoiceID" → "invoiceId"
   - "signDate" → "invoiceDate"
   - "owedAmount" → "remainingAmount"

3. New fields added:
   - "dueDate"
   - "paidAmount"
   - "isOverdue"
   - "description"

4. Pagination now required:
   - Add InvoicePageIndex, InvoicePageSize
   - Add PaymentPageIndex, PaymentPageSize

5. Frontend needs to:
   - Update debtService.ts
   - Update DebtManagement.tsx
   - Change DataGrid to paginationMode="server"
```

### Step 6: Deployment

```bash
# 1. Backup database
pg_dump eims_db > backup_before_debt_api_fix.sql

# 2. Deploy to staging
git checkout develop
git pull
dotnet publish -c Release
# Deploy to staging server

# 3. Test on staging
# Run integration tests
# Performance tests

# 4. Deploy to production
git checkout main
git merge develop
git push
# Deploy to production server

# 5. Monitor
# Check logs
# Check performance metrics
# Check error rates
```

### Step 7: Rollback Plan

Nếu có vấn đề:

```bash
# 1. Rollback code
git revert <commit-hash>

# 2. Rollback database
dotnet ef database update <previous-migration>

# 3. Restore from backup if needed
psql eims_db < backup_before_debt_api_fix.sql
```

---

## 8. BEFORE/AFTER COMPARISON

### ❌ BEFORE (Current)

```bash
curl "http://159.223.64.31/api/Customer/1/debt-detail"
```

Response:
```json
{
  "invoices": {           // ❌ Wrong name
    "items": [
      {
        "invoiceID": 44,       // ❌ PascalCase
        "signDate": "2024-12-25", // ❌ Wrong field name
        "owedAmount": 2        // ❌ Wrong field name
      }
    ],
    "totalCount": 7
  },
  "payments": {           // ❌ Wrong name
    "items": [],
    "totalCount": 0
  }
}
```

**Problems**:
- No pagination support
- Wrong field names
- Missing fields
- Fetches all data (1000 items)

### ✅ AFTER (Target)

```bash
curl "http://159.223.64.31/api/Customer/1/debt-detail?InvoicePageIndex=1&InvoicePageSize=10"
```

Response:
```json
{
  "customer": {
    "customerId": 1,
    "customerName": "Công ty ABC",
    "taxCode": "0123456789"
  },
  "summary": {
    "totalDebt": 150000000,
    "overdueDebt": 50000000,
    "unpaidInvoiceCount": 10
  },
  "unpaidInvoices": {     // ✅ Correct name
    "items": [
      {
        "invoiceId": 44,         // ✅ camelCase
        "invoiceNumber": "INV-001",
        "invoiceDate": "2024-12-25", // ✅ Correct field name
        "dueDate": "2025-01-24",     // ✅ Added
        "totalAmount": 10000000,
        "paidAmount": 0,             // ✅ Added
        "remainingAmount": 10000000, // ✅ Correct field name
        "paymentStatus": "Unpaid",
        "description": "...",        // ✅ Added
        "isOverdue": true            // ✅ Added
      }
    ],
    "pageIndex": 1,         // ✅ Works
    "pageSize": 10,         // ✅ Respects parameter
    "totalCount": 10,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "paymentHistory": {      // ✅ Correct name
    "items": [],
    "pageIndex": 1,
    "pageSize": 10,
    "totalCount": 0
  }
}
```

**Benefits**:
- ✅ Proper pagination (only 10 items)
- ✅ Correct field names
- ✅ All required fields present
- ✅ Response size small (~10KB vs ~500KB)
- ✅ Fast response (<500ms vs 2-5s)

---

## 9. EXPECTED RESULTS

### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Response Time** | 2-5s | <500ms | **80-90% faster** |
| **Response Size** | 500KB-1MB | ~10KB | **98% smaller** |
| **Items Returned** | 1000 | 10-100 | **Configurable** |
| **Database Queries** | 10+ (N+1) | 2-3 | **70% fewer** |
| **Memory Usage** | High | Low | **90% less** |

### API Quality Score

| Metric | Before | After |
|--------|--------|-------|
| **Response Structure** | 3/10 | 10/10 |
| **Pagination** | 0/10 | 10/10 |
| **Field Naming** | 4/10 | 10/10 |
| **Performance** | 2/10 | 9/10 |
| **Validation** | 5/10 | 10/10 |
| **Error Handling** | 5/10 | 10/10 |
| **TOTAL** | **19/60 (3.2/10)** | **59/60 (9.8/10)** |

---

## 10. SUPPORT & QUESTIONS

### Common Issues

**Q: Frontend báo lỗi "Cannot read property 'items' of undefined"**
A: Frontend cần update code để đọc `unpaidInvoices.items` thay vì `invoices.items`

**Q: Pagination không hoạt động**
A: Kiểm tra query parameters: `InvoicePageIndex` và `InvoicePageSize` (PascalCase)

**Q: Field names không khớp**
A: Đảm bảo DTOs dùng camelCase: `invoiceId`, `invoiceDate`, `remainingAmount`

**Q: Performance vẫn chậm**
A: Kiểm tra indexes đã được tạo chưa, run `EXPLAIN ANALYZE` cho query

**Q: Làm sao test local?**
A: 
```bash
dotnet run
curl "http://localhost:5000/api/Customer/1/debt-detail?InvoicePageIndex=1&InvoicePageSize=10"
```

### Contact

- Backend Team Lead: [Name]
- DevOps: [Name]
- Frontend Team Lead: [Name] (cần coordinate deployment)

---

**Document Version**: 1.0  
**Last Updated**: 28/12/2025  
**Priority**: HIGH  
**Status**: ⏳ Ready for Implementation
