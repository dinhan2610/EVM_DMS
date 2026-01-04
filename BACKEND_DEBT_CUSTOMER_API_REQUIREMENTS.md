# 🔧 YÊU CẦU BACKEND - CUSTOMER DEBT & INVOICE APIs

## 📋 TỔNG QUAN

Tài liệu này mô tả chi tiết các API endpoints mà backend cần bổ sung/sửa đổi để hỗ trợ đầy đủ tính năng **Quản lý Công nợ Khách hàng** (Debt Management).

**Ngày tạo**: 14/12/2025  
**Frontend Status**: ✅ Đã sẵn sàng, đang dùng mock data  
**Backend Status**: ⏳ Cần implement các APIs dưới đây

---

## 🎯 MỤC TIÊU

Frontend cần các APIs để:
1. ✅ Lấy danh sách khách hàng có công nợ
2. ✅ Lấy chi tiết công nợ của từng khách hàng
3. ✅ Lấy danh sách hóa đơn chưa thanh toán (với trạng thái thanh toán)
4. ✅ Lấy lịch sử thanh toán của khách hàng
5. ✅ Tính toán tự động: tổng nợ, nợ quá hạn, đã thanh toán

---

## ⚠️ VẤN ĐỀ HIỆN TẠI

### 1. **Thiếu Invoice Payment Fields** ❌

**Invoice model hiện tại** KHÔNG có các fields cần thiết:

```csharp
// ❌ THIẾU trong Invoice model:
public decimal PaidAmount { get; set; }           // Số tiền đã thanh toán
public decimal RemainingAmount { get; set; }      // Số tiền còn nợ
public string PaymentStatus { get; set; }         // Trạng thái thanh toán
public DateTime? LastPaymentDate { get; set; }    // Ngày thanh toán gần nhất
```

**Hậu quả**:
- ❌ Không biết hóa đơn nào đã thanh toán, chưa thanh toán, thanh toán 1 phần
- ❌ Không tính được tổng nợ của khách hàng
- ❌ Không biết số tiền còn thiếu
- ❌ Frontend phải dùng mock data

### 2. **Thiếu Customer Debt Summary API** ❌

**Không có endpoint** để lấy tổng quan công nợ của khách hàng.

**Frontend cần**:
- Danh sách khách hàng có nợ
- Tổng nợ, nợ quá hạn của từng khách hàng
- Số lượng hóa đơn chưa thanh toán
- Ngày thanh toán gần nhất

### 3. **Invoice API không trả về Payment Status** ❌

**GET /api/Invoice** hiện tại không có:
- Payment status (Paid/Unpaid/PartiallyPaid/Overdue)
- Paid amount
- Remaining amount

---

## ✅ CÁC API CẦN BỔ SUNG

### API #1: ⭐ GET /api/Customer/debt-summary (QUAN TRỌNG NHẤT)

**Mục đích**: Lấy danh sách TẤT CẢ khách hàng có công nợ

**Request**:
```http
GET /api/Customer/debt-summary?PageIndex=1&PageSize=20&SearchTerm=ABC&SortBy=totalDebt&SortOrder=desc&HasOverdue=true
Authorization: Bearer {token}
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| PageIndex | int | No | Trang hiện tại (default: 1) |
| PageSize | int | No | Số records/trang (default: 20) |
| SearchTerm | string | No | Tìm theo tên, MST, email, phone |
| SortBy | string | No | Sắp xếp theo: "totalDebt", "overdueDebt", "lastPaymentDate" |
| SortOrder | string | No | "asc" hoặc "desc" |
| HasOverdue | bool | No | true = chỉ lấy khách hàng có nợ quá hạn |

**Response** (Status: 200):
```json
{
  "data": [
    {
      "customerId": 1,
      "customerName": "Công ty TNHH ABC Technology",
      "taxCode": "0123456789",
      "email": "abc@company.com",
      "phone": "024 1234 5678",
      "address": "123 Đường Láng, Đống Đa, Hà Nội",
      "totalDebt": 45000000,
      "overdueDebt": 15000000,
      "totalPaid": 30000000,
      "invoiceCount": 5,
      "unpaidInvoiceCount": 3,
      "lastPaymentDate": "2024-11-20T00:00:00Z"
    },
    {
      "customerId": 2,
      "customerName": "Công ty CP XYZ Solutions",
      "taxCode": "0987654321",
      "email": "xyz@company.com",
      "phone": "028 9876 5432",
      "address": "456 Nguyễn Huệ, Quận 1, TP.HCM",
      "totalDebt": 28000000,
      "overdueDebt": 28000000,
      "totalPaid": 0,
      "invoiceCount": 2,
      "unpaidInvoiceCount": 2,
      "lastPaymentDate": null
    }
  ],
  "pageIndex": 1,
  "pageSize": 20,
  "totalCount": 50,
  "totalPages": 3
}
```

**Business Logic**:
```csharp
public async Task<PaginatedResponse<CustomerDebtSummary>> GetDebtSummary(DebtQueryParams queryParams)
{
    var customersQuery = _context.Customers
        .Where(c => c.Invoices.Any(i => i.RemainingAmount > 0));
    
    // Apply search filter
    if (!string.IsNullOrEmpty(queryParams.SearchTerm))
    {
        customersQuery = customersQuery.Where(c => 
            c.CustomerName.Contains(queryParams.SearchTerm) ||
            c.TaxCode.Contains(queryParams.SearchTerm) ||
            c.Email.Contains(queryParams.SearchTerm) ||
            c.Phone.Contains(queryParams.SearchTerm)
        );
    }
    
    // Apply overdue filter
    if (queryParams.HasOverdue == true)
    {
        var today = DateTime.Now.Date;
        customersQuery = customersQuery.Where(c => 
            c.Invoices.Any(i => i.DueDate < today && i.PaymentStatus != "Paid")
        );
    }
    
    // Calculate debt summary for each customer
    var customers = await customersQuery
        .Select(c => new CustomerDebtSummary
        {
            CustomerId = c.CustomerId,
            CustomerName = c.CustomerName,
            TaxCode = c.TaxCode,
            Email = c.Email,
            Phone = c.Phone,
            Address = c.Address,
            
            // ⭐ TÍNH TOÁN CÔNG NỢ
            TotalDebt = c.Invoices
                .Where(i => i.PaymentStatus != "Paid")
                .Sum(i => i.RemainingAmount),
            
            OverdueDebt = c.Invoices
                .Where(i => i.DueDate < DateTime.Now.Date && i.PaymentStatus != "Paid")
                .Sum(i => i.RemainingAmount),
            
            TotalPaid = c.Invoices.Sum(i => i.PaidAmount),
            
            InvoiceCount = c.Invoices.Count(),
            
            UnpaidInvoiceCount = c.Invoices
                .Count(i => i.PaymentStatus != "Paid"),
            
            LastPaymentDate = c.Invoices
                .SelectMany(i => i.Payments)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => p.PaymentDate)
                .FirstOrDefault()
        })
        .ToListAsync();
    
    // Apply sorting
    customers = queryParams.SortBy switch
    {
        "totalDebt" => queryParams.SortOrder == "desc" 
            ? customers.OrderByDescending(c => c.TotalDebt).ToList()
            : customers.OrderBy(c => c.TotalDebt).ToList(),
        "overdueDebt" => queryParams.SortOrder == "desc"
            ? customers.OrderByDescending(c => c.OverdueDebt).ToList()
            : customers.OrderBy(c => c.OverdueDebt).ToList(),
        "lastPaymentDate" => queryParams.SortOrder == "desc"
            ? customers.OrderByDescending(c => c.LastPaymentDate).ToList()
            : customers.OrderBy(c => c.LastPaymentDate).ToList(),
        _ => customers.OrderByDescending(c => c.TotalDebt).ToList()
    };
    
    // Pagination
    var totalCount = customers.Count;
    var paginatedCustomers = customers
        .Skip((queryParams.PageIndex - 1) * queryParams.PageSize)
        .Take(queryParams.PageSize)
        .ToList();
    
    return new PaginatedResponse<CustomerDebtSummary>
    {
        Data = paginatedCustomers,
        PageIndex = queryParams.PageIndex,
        PageSize = queryParams.PageSize,
        TotalCount = totalCount,
        TotalPages = (int)Math.Ceiling(totalCount / (double)queryParams.PageSize)
    };
}
```

---

### API #2: ⭐ GET /api/Customer/{customerId}/debt-detail

**Mục đích**: Lấy chi tiết công nợ của 1 khách hàng (bao gồm danh sách hóa đơn chưa thanh toán)

**Request**:
```http
GET /api/Customer/1/debt-detail
Authorization: Bearer {token}
```

**Response** (Status: 200):
```json
{
  "customer": {
    "customerId": 1,
    "customerName": "Công ty TNHH ABC Technology",
    "taxCode": "0123456789",
    "email": "abc@company.com",
    "phone": "024 1234 5678",
    "address": "123 Đường Láng, Đống Đa, Hà Nội"
  },
  "summary": {
    "totalDebt": 45000000,
    "overdueDebt": 15000000,
    "totalPaid": 30000000,
    "invoiceCount": 5,
    "unpaidInvoiceCount": 3,
    "lastPaymentDate": "2024-11-20T00:00:00Z"
  },
  "unpaidInvoices": [
    {
      "invoiceId": 1,
      "invoiceNumber": "C24TAA-001",
      "invoiceDate": "2024-10-01T00:00:00Z",
      "dueDate": "2024-10-31T00:00:00Z",
      "totalAmount": 15000000,
      "paidAmount": 10000000,
      "remainingAmount": 5000000,
      "paymentStatus": "PartiallyPaid",
      "description": "Dịch vụ tư vấn tháng 10/2024",
      "isOverdue": true
    },
    {
      "invoiceId": 2,
      "invoiceNumber": "C24TAA-002",
      "invoiceDate": "2024-11-01T00:00:00Z",
      "dueDate": "2024-11-30T00:00:00Z",
      "totalAmount": 25000000,
      "paidAmount": 15000000,
      "remainingAmount": 10000000,
      "paymentStatus": "Overdue",
      "description": "Cước hosting VPS tháng 11/2024",
      "isOverdue": true
    },
    {
      "invoiceId": 3,
      "invoiceNumber": "C24TAA-003",
      "invoiceDate": "2024-12-01T00:00:00Z",
      "dueDate": "2024-12-31T00:00:00Z",
      "totalAmount": 30000000,
      "paidAmount": 0,
      "remainingAmount": 30000000,
      "paymentStatus": "Unpaid",
      "description": "Bảo trì hệ thống tháng 12/2024",
      "isOverdue": false
    }
  ],
  "paymentHistory": [
    {
      "paymentId": 1,
      "invoiceId": 1,
      "invoiceNumber": "C24TAA-001",
      "amount": 10000000,
      "paymentMethod": "BankTransfer",
      "transactionCode": "TXN123456",
      "note": "Thanh toán đợt 1",
      "paymentDate": "2024-11-20T00:00:00Z",
      "userId": 1,
      "userName": "Admin User"
    },
    {
      "paymentId": 2,
      "invoiceId": 2,
      "invoiceNumber": "C24TAA-002",
      "amount": 15000000,
      "paymentMethod": "Cash",
      "transactionCode": null,
      "note": "Thanh toán một phần",
      "paymentDate": "2024-11-25T00:00:00Z",
      "userId": 1,
      "userName": "Admin User"
    }
  ]
}
```

**Business Logic**:
```csharp
public async Task<CustomerDebtDetail> GetCustomerDebtDetail(int customerId)
{
    var customer = await _context.Customers
        .Include(c => c.Invoices)
            .ThenInclude(i => i.Payments)
                .ThenInclude(p => p.User)
        .FirstOrDefaultAsync(c => c.CustomerId == customerId);
    
    if (customer == null)
        throw new NotFoundException("Customer not found");
    
    var today = DateTime.Now.Date;
    
    var unpaidInvoices = customer.Invoices
        .Where(i => i.PaymentStatus != "Paid")
        .Select(i => new UnpaidInvoiceDto
        {
            InvoiceId = i.InvoiceId,
            InvoiceNumber = i.InvoiceNumber,
            InvoiceDate = i.InvoiceDate,
            DueDate = i.DueDate,
            TotalAmount = i.TotalAmount,
            PaidAmount = i.PaidAmount,
            RemainingAmount = i.RemainingAmount,
            PaymentStatus = i.PaymentStatus,
            Description = i.Notes,
            IsOverdue = i.DueDate < today && i.PaymentStatus != "Paid"
        })
        .OrderBy(i => i.DueDate)
        .ToList();
    
    var paymentHistory = customer.Invoices
        .SelectMany(i => i.Payments.Select(p => new PaymentHistoryDto
        {
            PaymentId = p.Id,
            InvoiceId = i.InvoiceId,
            InvoiceNumber = i.InvoiceNumber,
            Amount = p.Amount,
            PaymentMethod = p.PaymentMethod,
            TransactionCode = p.TransactionCode,
            Note = p.Note,
            PaymentDate = p.PaymentDate,
            UserId = p.UserId,
            UserName = p.User?.UserName ?? "Unknown"
        }))
        .OrderByDescending(p => p.PaymentDate)
        .ToList();
    
    return new CustomerDebtDetail
    {
        Customer = new CustomerDto
        {
            CustomerId = customer.CustomerId,
            CustomerName = customer.CustomerName,
            TaxCode = customer.TaxCode,
            Email = customer.Email,
            Phone = customer.Phone,
            Address = customer.Address
        },
        Summary = new DebtSummaryDto
        {
            TotalDebt = unpaidInvoices.Sum(i => i.RemainingAmount),
            OverdueDebt = unpaidInvoices
                .Where(i => i.IsOverdue)
                .Sum(i => i.RemainingAmount),
            TotalPaid = customer.Invoices.Sum(i => i.PaidAmount),
            InvoiceCount = customer.Invoices.Count,
            UnpaidInvoiceCount = unpaidInvoices.Count,
            LastPaymentDate = paymentHistory.FirstOrDefault()?.PaymentDate
        },
        UnpaidInvoices = unpaidInvoices,
        PaymentHistory = paymentHistory
    };
}
```

---

## 🔧 DATABASE SCHEMA CHANGES

### 1. **Thêm fields vào Invoice Table** ⭐ QUAN TRỌNG

```sql
-- Thêm các columns mới
ALTER TABLE Invoices 
ADD PaidAmount DECIMAL(18,2) DEFAULT 0 NOT NULL;

ALTER TABLE Invoices 
ADD RemainingAmount DECIMAL(18,2);

ALTER TABLE Invoices 
ADD PaymentStatus NVARCHAR(50) DEFAULT 'Unpaid' NOT NULL;

ALTER TABLE Invoices 
ADD LastPaymentDate DATETIME NULL;

-- Set giá trị ban đầu cho các invoice hiện có
UPDATE Invoices 
SET 
    PaidAmount = 0,
    RemainingAmount = TotalAmount,
    PaymentStatus = 'Unpaid',
    LastPaymentDate = NULL
WHERE PaidAmount IS NULL;

-- Tạo index để tối ưu query
CREATE INDEX IX_Invoices_PaymentStatus ON Invoices(PaymentStatus);
CREATE INDEX IX_Invoices_RemainingAmount ON Invoices(RemainingAmount);
CREATE INDEX IX_Invoices_DueDate ON Invoices(DueDate);
```

### 2. **Invoice Model Update**

```csharp
public class Invoice
{
    // ... existing fields
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; }
    public int CustomerId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Notes { get; set; }
    
    // ⭐ THÊM CÁC FIELDS MỚI
    public decimal PaidAmount { get; set; } = 0;
    public decimal RemainingAmount { get; set; }
    public string PaymentStatus { get; set; } = "Unpaid"; // Unpaid, PartiallyPaid, Paid, Overdue
    public DateTime? LastPaymentDate { get; set; }
    
    // Navigation properties
    public Customer Customer { get; set; }
    public ICollection<Payment> Payments { get; set; }
    
    // ⭐ COMPUTED PROPERTY
    [NotMapped]
    public bool IsOverdue => DueDate < DateTime.Now.Date && PaymentStatus != "Paid";
}
```

### 3. **Payment Status Constants**

```csharp
public static class PaymentStatuses
{
    public const string Unpaid = "Unpaid";
    public const string PartiallyPaid = "PartiallyPaid";
    public const string Paid = "Paid";
    public const string Overdue = "Overdue";
}
```

---

## 🔄 BUSINESS LOGIC - AUTO UPDATE INVOICE

### ⭐ Quan trọng: Cập nhật Invoice sau mỗi Payment

Khi tạo Payment record mới, **BẮT BUỘC** phải cập nhật Invoice:

```csharp
public async Task<PaymentResponse> CreatePayment(PaymentRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    
    try
    {
        // 1. Validate invoice
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId);
        
        if (invoice == null)
            throw new NotFoundException("Invoice not found");
        
        if (request.Amount > invoice.RemainingAmount)
            throw new BadRequestException("Payment amount exceeds remaining amount");
        
        // 2. Create payment record
        var payment = new Payment
        {
            InvoiceId = request.InvoiceId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            TransactionCode = request.TransactionCode,
            Note = request.Note,
            PaymentDate = request.PaymentDate,
            UserId = request.UserId,
            CreatedAt = DateTime.Now
        };
        
        _context.Payments.Add(payment);
        
        // 3. ⭐ AUTO UPDATE INVOICE
        invoice.PaidAmount += request.Amount;
        invoice.RemainingAmount = invoice.TotalAmount - invoice.PaidAmount;
        invoice.LastPaymentDate = request.PaymentDate;
        
        // 4. ⭐ UPDATE PAYMENT STATUS
        if (invoice.RemainingAmount == 0)
        {
            invoice.PaymentStatus = PaymentStatuses.Paid;
        }
        else if (invoice.PaidAmount > 0 && invoice.RemainingAmount > 0)
        {
            invoice.PaymentStatus = PaymentStatuses.PartiallyPaid;
        }
        
        // 5. ⭐ CHECK OVERDUE
        if (invoice.DueDate < DateTime.Now.Date && invoice.PaymentStatus != PaymentStatuses.Paid)
        {
            invoice.PaymentStatus = PaymentStatuses.Overdue;
        }
        
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        
        // 6. Return response with updated invoice info
        var response = new PaymentResponse
        {
            Id = payment.Id,
            InvoiceId = payment.InvoiceId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            TransactionCode = payment.TransactionCode,
            Note = payment.Note,
            PaymentDate = payment.PaymentDate,
            UserId = payment.UserId,
            CreatedAt = payment.CreatedAt,
            Invoice = new InvoiceSummaryDto
            {
                InvoiceNumber = invoice.InvoiceNumber,
                TotalAmount = invoice.TotalAmount,
                PaidAmount = invoice.PaidAmount,
                RemainingAmount = invoice.RemainingAmount,
                PaymentStatus = invoice.PaymentStatus
            }
        };
        
        return response;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

---

## 📊 DTOs (Data Transfer Objects)

### CustomerDebtSummary DTO
```csharp
public class CustomerDebtSummary
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; }
    public string TaxCode { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Address { get; set; }
    public decimal TotalDebt { get; set; }
    public decimal OverdueDebt { get; set; }
    public decimal TotalPaid { get; set; }
    public int InvoiceCount { get; set; }
    public int UnpaidInvoiceCount { get; set; }
    public DateTime? LastPaymentDate { get; set; }
}
```

### UnpaidInvoiceDto
```csharp
public class UnpaidInvoiceDto
{
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string PaymentStatus { get; set; }
    public string Description { get; set; }
    public bool IsOverdue { get; set; }
}
```

### DebtQueryParams
```csharp
public class DebtQueryParams
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SearchTerm { get; set; }
    public string SortBy { get; set; } = "totalDebt";
    public string SortOrder { get; set; } = "desc";
    public bool? HasOverdue { get; set; }
}
```

---

## 🧪 TEST CASES

### Test Case 1: Get Debt Summary - Success
```
Request: GET /api/Customer/debt-summary?PageIndex=1&PageSize=10
Expected: 200 OK
Response: List of customers with debt calculations
```

### Test Case 2: Get Debt Detail - Customer Found
```
Request: GET /api/Customer/1/debt-detail
Expected: 200 OK
Response: Full customer debt details with invoices and payment history
```

### Test Case 3: Get Debt Detail - Customer Not Found
```
Request: GET /api/Customer/9999/debt-detail
Expected: 404 Not Found
Response: {"message": "Customer not found"}
```

### Test Case 4: Search Customers by Name
```
Request: GET /api/Customer/debt-summary?SearchTerm=ABC
Expected: 200 OK
Response: Only customers matching "ABC"
```

### Test Case 5: Filter Overdue Customers Only
```
Request: GET /api/Customer/debt-summary?HasOverdue=true
Expected: 200 OK
Response: Only customers with overdue debt > 0
```

### Test Case 6: Sort by Total Debt Descending
```
Request: GET /api/Customer/debt-summary?SortBy=totalDebt&SortOrder=desc
Expected: 200 OK
Response: Customers sorted by highest debt first
```

---

## 🔐 AUTHORIZATION

### Required Permissions
```csharp
[Authorize(Roles = "Admin,Accountant,Manager")]
public async Task<IActionResult> GetDebtSummary([FromQuery] DebtQueryParams queryParams)
{
    // ...
}

[Authorize(Roles = "Admin,Accountant,Manager")]
public async Task<IActionResult> GetCustomerDebtDetail(int customerId)
{
    // ...
}
```

---

## 📝 PRIORITY & TIMELINE

### Phase 1 - CRITICAL (Tuần 1)
1. ⭐ **Thêm fields vào Invoice model** (PaidAmount, RemainingAmount, PaymentStatus, LastPaymentDate)
2. ⭐ **Update Payment API** để tự động cập nhật Invoice
3. ⭐ **Migration script** để update database

### Phase 2 - HIGH (Tuần 1-2)
4. **GET /api/Customer/debt-summary** - Danh sách khách hàng có nợ
5. **GET /api/Customer/{id}/debt-detail** - Chi tiết công nợ khách hàng
6. **Testing & Bug fixes**

### Phase 3 - MEDIUM (Tuần 2-3)
7. Advanced filters và search
8. Performance optimization (caching, indexing)
9. Report generation

---

## 📞 CONTACTS & QUESTIONS

Nếu có thắc mắc về yêu cầu này, vui lòng liên hệ:
- **Frontend Team Lead**: [Your Name]
- **Product Owner**: [PO Name]

---

## 📎 RELATED DOCUMENTS

1. [`BACKEND_PAYMENT_API_REQUIREMENTS.md`](BACKEND_PAYMENT_API_REQUIREMENTS.md) - Payment API requirements
2. [`DEBT_MANAGEMENT_API_INTEGRATION_SUMMARY.md`](DEBT_MANAGEMENT_API_INTEGRATION_SUMMARY.md) - Frontend integration summary
3. [`DEBT_MANAGEMENT_DOCUMENTATION.md`](DEBT_MANAGEMENT_DOCUMENTATION.md) - Feature documentation

---

**Document Version**: 1.0  
**Created**: 14/12/2025  
**Last Updated**: 14/12/2025  
**Status**: ⏳ Waiting for Backend Implementation
