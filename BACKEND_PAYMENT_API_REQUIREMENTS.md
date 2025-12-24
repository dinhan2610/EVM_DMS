# 🔧 YÊU CẦU BACKEND API BỔ SUNG - DEBT MANAGEMENT MODULE

## 📋 TỔNG QUAN

Tài liệu này mô tả các API endpoints và logic backend cần được bổ sung/sửa đổi để hỗ trợ đầy đủ tính năng Quản lý Công nợ (Debt Management) trên frontend.

---

## ✅ API ĐÃ CÓ (PAYMENT)

### 1. POST /api/Payment - Tạo thanh toán mới
**Status**: ✅ Đã có - Cần verify response format

**Request Body**:
```json
{
  "invoiceId": 0,
  "amount": 0,
  "paymentMethod": "string",
  "transactionCode": "string",
  "note": "string",
  "paymentDate": "2025-12-14T07:46:52.123Z",
  "userId": 0
}
```

**Response cần trả về**:
```json
{
  "id": 1,
  "invoiceId": 1,
  "amount": 10000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN123456",
  "note": "Thanh toán đợt 1",
  "paymentDate": "2025-12-14T07:46:52.123Z",
  "userId": 1,
  "createdAt": "2025-12-14T07:46:52.123Z",
  "updatedAt": "2025-12-14T07:46:52.123Z",
  "invoice": {
    "invoiceNumber": "C24TAA-001",
    "customerName": "Công ty ABC",
    "totalAmount": 50000000,
    "paidAmount": 10000000,
    "remainingAmount": 40000000
  },
  "user": {
    "userId": 1,
    "userName": "Admin User"
  }
}
```

### 2. GET /api/Payment - Lấy danh sách thanh toán
**Status**: ✅ Đã có - Cần verify pagination format

**Query Parameters**:
- PageIndex: int
- PageSize: int
- InvoiceId: int (optional)
- CustomerId: int (optional)
- SearchTerm: string (optional)

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "invoiceId": 1,
      "amount": 10000000,
      "paymentMethod": "BankTransfer",
      "transactionCode": "TXN123",
      "note": "Thanh toán",
      "paymentDate": "2025-12-14",
      "userId": 1,
      "createdAt": "2025-12-14",
      "invoice": {
        "invoiceNumber": "C24TAA-001"
      },
      "user": {
        "userName": "Admin"
      }
    }
  ],
  "pageIndex": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5
}
```

### 3. GET /api/Payment/{id} - Lấy chi tiết thanh toán
**Status**: ✅ Đã có - Cần verify response format

---

## ⚠️ API CẦN BỔ SUNG/SỬA ĐỔI

### 1. ⭐ **QUAN TRỌNG**: Update Invoice sau khi Payment
**Endpoint**: POST /api/Payment
**Yêu cầu**: Sau khi tạo Payment thành công, cần **TƯ ĐỘNG CẬP NHẬT** Invoice:

```csharp
// Logic cần implement trong PaymentController.CreatePayment()
public async Task<IActionResult> CreatePayment([FromBody] PaymentRequest request)
{
    // 1. Validate payment
    // 2. Create payment record
    var payment = await _paymentService.CreateAsync(request);
    
    // 3. ⭐ CẬP NHẬT INVOICE
    var invoice = await _invoiceService.GetByIdAsync(request.InvoiceId);
    
    // Tính toán lại số tiền
    invoice.PaidAmount += request.Amount;
    invoice.RemainingAmount = invoice.TotalAmount - invoice.PaidAmount;
    
    // Cập nhật trạng thái thanh toán
    if (invoice.RemainingAmount == 0) {
        invoice.PaymentStatus = "Paid";
    } else if (invoice.PaidAmount > 0) {
        invoice.PaymentStatus = "PartiallyPaid";
    }
    
    // Cập nhật ngày thanh toán cuối
    invoice.LastPaymentDate = request.PaymentDate;
    
    await _invoiceService.UpdateAsync(invoice);
    
    // 4. Return payment with updated invoice info
    return Ok(payment);
}
```

### 2. ⭐ **QUAN TRỌNG**: GET /api/Customer/{customerId}/debt-summary
**Status**: ❌ Chưa có - CẦN TẠO MỚI

**Mục đích**: Lấy tổng quan công nợ của 1 khách hàng

**Response**:
```json
{
  "customerId": 1,
  "customerName": "Công ty TNHH ABC",
  "taxCode": "0123456789",
  "email": "abc@company.com",
  "phone": "024 1234 5678",
  "address": "123 Đường Láng, Hà Nội",
  "totalDebt": 45000000,
  "overdueDebt": 15000000,
  "totalPaid": 30000000,
  "invoiceCount": 5,
  "unpaidInvoiceCount": 3,
  "lastPaymentDate": "2024-11-20",
  "invoices": [
    {
      "invoiceId": 1,
      "invoiceNumber": "C24TAA-001",
      "invoiceDate": "2024-10-01",
      "dueDate": "2024-10-31",
      "totalAmount": 15000000,
      "paidAmount": 10000000,
      "remainingAmount": 5000000,
      "paymentStatus": "PartiallyPaid",
      "description": "Dịch vụ tư vấn",
      "isOverdue": true
    }
  ]
}
```

**Logic tính toán**:
```csharp
// Pseudocode
totalDebt = SUM(invoices.remainingAmount WHERE paymentStatus != 'Paid')
overdueDebt = SUM(invoices.remainingAmount WHERE dueDate < TODAY AND paymentStatus != 'Paid')
totalPaid = SUM(invoices.paidAmount)
invoiceCount = COUNT(invoices)
unpaidInvoiceCount = COUNT(invoices WHERE paymentStatus != 'Paid')
lastPaymentDate = MAX(payments.paymentDate)
```

### 3. ⭐ GET /api/Customer/debt-summary - Danh sách tất cả khách hàng có nợ
**Status**: ❌ Chưa có - CẦN TẠO MỚI

**Query Parameters**:
- PageIndex: int
- PageSize: int
- SearchTerm: string (optional) - Tìm theo tên, MST, email
- SortBy: string (optional) - "totalDebt", "overdueDebt", "lastPayment"
- SortOrder: string (optional) - "asc", "desc"
- HasOverdue: bool (optional) - Chỉ lấy khách hàng có nợ quá hạn

**Response**:
```json
{
  "data": [
    {
      "customerId": 1,
      "customerName": "Công ty ABC",
      "taxCode": "0123456789",
      "email": "abc@company.com",
      "phone": "024 1234 5678",
      "totalDebt": 45000000,
      "overdueDebt": 15000000,
      "invoiceCount": 3,
      "lastPaymentDate": "2024-11-20"
    }
  ],
  "pageIndex": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5
}
```

### 4. ⭐ Thêm fields vào Invoice Model
**Yêu cầu**: Bổ sung các fields sau vào Invoice entity/model:

```csharp
public class Invoice
{
    // ... existing fields
    
    // ⭐ CẦN BỔ SUNG:
    public decimal PaidAmount { get; set; }  // Số tiền đã thanh toán
    public decimal RemainingAmount { get; set; }  // Số tiền còn nợ
    public string PaymentStatus { get; set; }  // "Unpaid", "PartiallyPaid", "Paid", "Overdue"
    public DateTime? LastPaymentDate { get; set; }  // Ngày thanh toán gần nhất
    
    // Computed property hoặc method
    public bool IsOverdue => DueDate < DateTime.Now && PaymentStatus != "Paid";
}
```

### 5. ⭐ Payment Method Enum/Constants
**Yêu cầu**: Standardize payment methods

**Recommended values**:
```csharp
public enum PaymentMethod
{
    Cash = 0,
    BankTransfer = 1,
    CreditCard = 2,
    DebitCard = 3,
    EWallet = 4,
    Check = 5,
    Other = 99
}

// Hoặc dùng constants:
public static class PaymentMethods
{
    public const string Cash = "Cash";
    public const string BankTransfer = "BankTransfer";
    public const string CreditCard = "CreditCard";
    public const string DebitCard = "DebitCard";
    public const string EWallet = "EWallet";
    public const string Check = "Check";
    public const string Other = "Other";
}
```

---

## 🔄 BUSINESS LOGIC CẦN IMPLEMENT

### 1. Payment Creation Flow
```
1. Validate Input
   - amount > 0
   - amount <= invoice.remainingAmount
   - invoiceId exists
   - userId exists
   
2. Create Payment Record
   - Save to Payments table
   
3. Update Invoice
   - invoice.paidAmount += payment.amount
   - invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount
   - Update paymentStatus:
     * remainingAmount == 0 → "Paid"
     * paidAmount > 0 && remainingAmount > 0 → "PartiallyPaid"
     * paidAmount == 0 → "Unpaid"
   - invoice.lastPaymentDate = payment.paymentDate
   
4. Check Overdue Status
   - If dueDate < today && paymentStatus != "Paid" → "Overdue"
   
5. Return Response
   - Include updated invoice info
```

### 2. Debt Calculation Logic
```csharp
// Tính tổng nợ của khách hàng
public decimal CalculateTotalDebt(int customerId)
{
    return _context.Invoices
        .Where(i => i.CustomerId == customerId && i.PaymentStatus != "Paid")
        .Sum(i => i.RemainingAmount);
}

// Tính nợ quá hạn
public decimal CalculateOverdueDebt(int customerId)
{
    var today = DateTime.Now.Date;
    return _context.Invoices
        .Where(i => i.CustomerId == customerId 
            && i.PaymentStatus != "Paid" 
            && i.DueDate < today)
        .Sum(i => i.RemainingAmount);
}

// Lấy ngày thanh toán cuối
public DateTime? GetLastPaymentDate(int customerId)
{
    return _context.Payments
        .Where(p => p.Invoice.CustomerId == customerId)
        .OrderByDescending(p => p.PaymentDate)
        .Select(p => p.PaymentDate)
        .FirstOrDefault();
}
```

---

## 📊 DATABASE SCHEMA CHANGES

### Payments Table
```sql
CREATE TABLE Payments (
    Id INT PRIMARY KEY IDENTITY,
    InvoiceId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    TransactionCode NVARCHAR(100) NULL,
    Note NVARCHAR(500) NULL,
    PaymentDate DATETIME NOT NULL,
    UserId INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    
    FOREIGN KEY (InvoiceId) REFERENCES Invoices(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
)

CREATE INDEX IX_Payments_InvoiceId ON Payments(InvoiceId)
CREATE INDEX IX_Payments_PaymentDate ON Payments(PaymentDate)
```

### Invoices Table - Thêm columns
```sql
ALTER TABLE Invoices ADD PaidAmount DECIMAL(18,2) DEFAULT 0
ALTER TABLE Invoices ADD RemainingAmount DECIMAL(18,2) 
ALTER TABLE Invoices ADD PaymentStatus NVARCHAR(50) DEFAULT 'Unpaid'
ALTER TABLE Invoices ADD LastPaymentDate DATETIME NULL

-- Set initial values
UPDATE Invoices 
SET RemainingAmount = TotalAmount,
    PaidAmount = 0,
    PaymentStatus = 'Unpaid'
WHERE RemainingAmount IS NULL
```

---

## 🔐 AUTHORIZATION & VALIDATION

### Permission Requirements
```csharp
// Payment operations
[Authorize(Roles = "Admin,Accountant,Manager")]
public async Task<IActionResult> CreatePayment() { }

[Authorize(Roles = "Admin,Accountant,Manager,Sales")]
public async Task<IActionResult> GetPayments() { }

// Debt summary
[Authorize(Roles = "Admin,Accountant,Manager")]
public async Task<IActionResult> GetDebtSummary() { }
```

### Validation Rules
```csharp
public class PaymentRequestValidator : AbstractValidator<PaymentRequest>
{
    public PaymentRequestValidator()
    {
        RuleFor(x => x.InvoiceId).GreaterThan(0);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaymentMethod).NotEmpty().MaximumLength(50);
        RuleFor(x => x.TransactionCode).MaximumLength(100);
        RuleFor(x => x.Note).MaximumLength(500);
        RuleFor(x => x.PaymentDate).LessThanOrEqualTo(DateTime.Now);
        RuleFor(x => x.UserId).GreaterThan(0);
        
        // Custom validation: amount <= remaining amount
        RuleFor(x => x)
            .Must(x => ValidatePaymentAmount(x.InvoiceId, x.Amount))
            .WithMessage("Số tiền thanh toán không được vượt quá số nợ còn lại");
    }
}
```

---

## 🧪 TEST CASES CẦN KIỂM TRA

### 1. Payment Creation
- ✅ Tạo payment với full amount → Invoice status = "Paid"
- ✅ Tạo payment với partial amount → Invoice status = "PartiallyPaid"
- ✅ Tạo multiple payments cho 1 invoice
- ✅ Validate amount > remainingAmount → Error
- ✅ Payment date in the past
- ✅ Transaction code optional

### 2. Debt Calculation
- ✅ Customer có nhiều invoices: tính tổng đúng
- ✅ Customer có invoices quá hạn: tính overdue đúng
- ✅ Customer không có invoice: return 0
- ✅ Invoice đã paid: không tính vào debt

### 3. Payment History
- ✅ Get payments by invoice
- ✅ Get payments by customer
- ✅ Pagination works correctly
- ✅ Search by transaction code

---

## 📝 PRIORITY & TIMELINE

### Phase 1 - Critical (ASAP)
1. ✅ Update POST /api/Payment để auto-update Invoice
2. ✅ Thêm PaidAmount, RemainingAmount, PaymentStatus vào Invoice model
3. ✅ Verify Payment API response format

### Phase 2 - High Priority (Week 1)
4. GET /api/Customer/{id}/debt-summary
5. GET /api/Customer/debt-summary (list)
6. Standardize PaymentMethod enum

### Phase 3 - Nice to Have (Week 2)
7. Advanced filters cho debt list
8. Export debt reports
9. Email notifications cho overdue invoices

---

## 🔗 FRONTEND INTEGRATION NOTES

**Frontend đã sẵn sàng:**
- ✅ paymentService.ts đã tạo với đầy đủ methods
- ✅ DebtManagement.tsx đã tích hợp API calls
- ✅ Types đã align với backend format
- ✅ Error handling đã implement
- ✅ Loading states đã có

**Chờ backend:**
- ⏳ Invoice auto-update logic
- ⏳ Customer debt summary endpoints
- ⏳ Response format verification
- ⏳ PaymentMethod standardization

---

## 📞 CONTACTS & QUESTIONS

Nếu có thắc mắc về yêu cầu này, vui lòng liên hệ:
- Frontend Team Lead
- Backend Team Lead
- Product Owner

---

**Document Version**: 1.0  
**Created**: 2025-12-14  
**Last Updated**: 2025-12-14
