# Backend Invoice Request API - Requirements Specification

**API:** `POST /api/InvoiceRequest`  
**Date:** 2026-01-18  
**Role:** Sales (Nhân viên kinh doanh)  
**Purpose:** Tạo yêu cầu xuất hóa đơn để gửi cho kế toán xử lý

---

## 🚨 IMPLEMENTATION NOTES - CẦN SỬA NGAY

### ❌ **HIỆN TẠI - API Payload từ Swagger:**

```json
{
  "accountantId": 0,        // ⚠️ GIỮ - Nullable, để trống được (0 hoặc null)
  "customerID": 0,          // ✅ OK
  "taxCode": "string",      // ✅ OK
  "companyID": 0,           // ✅ OK
  "salesID": 0,             // ⚠️ GIỮ - Nhưng backend TỰ LẤY từ JWT, frontend gửi 0
  "customerName": "string", // ✅ OK
  "address": "string",      // ✅ OK
  "notes": "string",        // ✅ OK
  "paymentMethod": "string",// ✅ OK
  "items": [...],           // ✅ OK
  "amount": 0,              // ✅ OK
  "taxAmount": 0,           // ✅ OK
  "totalAmount": 0,         // ✅ OK
  "minRows": 0,             // ✅ OK
  "contactEmail": "string", // ✅ OK
  "contactPerson": "string",// ✅ OK
  "contactPhone": "string"  // ✅ OK
}
```

### ✅ **CẦN SỬA THÀNH - API Payload mới:**

```json
{
  // === KHÔNG THAY ĐỔI (GIỮ NGUYÊN) ===
  "accountantId": 0,        // ⚠️ Nullable - Để 0 hoặc null, backend tự assign sau
  "salesID": 0,             // ⚠️ Frontend gửi 0, backend TỰ OVERRIDE từ JWT token
  "customerID": 0,
  "taxCode": "string",
  "companyID": 0,
  "customerName": "string",
  "address": "string",
  "notes": "string",
  "paymentMethod": "string",
  "items": [...],
  "amount": 0,
  "taxAmount": 0,
  "totalAmount": 0,
  "minRows": 0,
  "contactEmail": "string",
  "contactPerson": "string",
  "contactPhone": "string",
  
  // === THÊM MỚI (TÙY CHỌN - Nhưng KHUYẾN NGHỊ) ===
  "requiredDate": "2026-01-25T23:59:59Z",  // 🤔 DateTime - Hạn xuất HĐ (cần không?)
  "priority": "HIGH"                        // 🤔 String - URGENT|HIGH|MEDIUM|LOW (cần không?)
}
```

### 📝 **CHECKLIST IMPLEMENTATION:**

#### 1. **GIỮ NGUYÊN FIELDS (Backend):**
- [x] ✅ **GIỮ `accountantId`** - Nullable (int?), frontend có thể gửi 0 hoặc null
- [x] ✅ **GIỮ `salesID`** - Frontend gửi 0, backend PHẢI OVERRIDE từ JWT token

#### 2. **XỬ LÝ LOGIC QUAN TRỌNG (Backend):**
- [ ] ⭐ **`salesID`**: Backend PHẢI IGNORE giá trị từ request body, TỰ ĐỘNG lấy từ JWT token
  ```csharp
  // Frontend gửi: dto.SalesID = 0 (hoặc bất kỳ giá trị nào)
  // Backend OVERRIDE:
  var salesID = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
  request.SalesID = salesID;  // ⭐ BẮT BUỘC - Dùng giá trị từ token
  ```

- [ ] ✅ **`accountantId`**: Nullable, frontend gửi 0 hoặc null, backend để NULL khi tạo mới
  ```csharp
  // Frontend: dto.AccountantId = 0 hoặc null
  // Backend: request.AccountantID = null;  // Để trống, assign sau khi approve
  ```

#### 3. **CÂU HỎI CHO USER - HẠN XUẤT HÓA ĐƠN:**

**❓ CÓ CẦN THÊM `requiredDate` (Hạn xuất HĐ) KHÔNG?**

**Lợi ích nếu CÓ:**
- ✅ Sales chỉ định deadline cụ thể: "Cần xuất HĐ trước 25/01/2026"
- ✅ Accountant biết yêu cầu nào URGENT, ưu tiên xử lý trước
- ✅ System tự động cảnh báo khi gần quá hạn
- ✅ Dashboard hiển thị yêu cầu sắp hết hạn (màu đỏ)
- ✅ Có thể sort/filter theo deadline

**Nhược điểm nếu KHÔNG:**
- ❌ Accountant không biết yêu cầu nào cần xử lý gấp
- ❌ Xử lý theo thứ tự FIFO (first in first out) - không linh hoạt
- ❌ Sales không thể báo trước deadline cho khách hàng

**Khuyến nghị:** ⭐ **NÊN CÓ** - Đây là field quan trọng cho workflow

---

**❓ CÓ CẦN THÊM `priority` (Mức độ ưu tiên) KHÔNG?**

**Lợi ích nếu CÓ:**
- ✅ Sales đánh dấu URGENT/HIGH/MEDIUM/LOW
- ✅ Dễ filter trong dashboard: "Chỉ xem yêu cầu URGENT"
- ✅ Tự động tính priority dựa vào requiredDate
- ✅ Accountant ưu tiên URGENT trước

**Nhược điểm nếu KHÔNG:**
- ❌ Không phân biệt được yêu cầu quan trọng
- ❌ Tất cả yêu cầu đều bình đẳng - khó quản lý

**Khuyến nghị:** ⭐ **NÊN CÓ** - Hỗ trợ filter và sort tốt hơn

---

### 🎯 **QUYẾT ĐỊNH:**

**Nếu KHÔNG cần `requiredDate` và `priority`:**
- [ ] Giữ nguyên API hiện tại (15 fields)
- [ ] Backend chỉ cần xử lý logic `salesID` từ token
- [ ] Backend set `accountantId = null` khi tạo mới

**Nếu CẦN `requiredDate` và `priority`:**
- [ ] Thêm 2 fields vào DTO
- [ ] Thêm 2 columns vào database
- [ ] Thêm validation cho requiredDate
- [ ] Frontend thêm DatePicker + Priority selector


---

## 📊 API SPECIFICATION

### **Endpoint:**
```
POST /api/InvoiceRequest
Authorization: Bearer {token}
Content-Type: application/json
```

### **Request Body (FINAL VERSION):**

```json
{
  // Thông tin khách hàng
  "customerID": 123,
  "taxCode": "0123456789",
  "customerName": "Công ty TNHH ABC",
  "address": "123 Đường ABC, Q.1, TP.HCM",
  "contactEmail": "contact@abc.com",
  "contactPerson": "Nguyễn Văn A",
  "contactPhone": "0901234567",
  
  // Chi tiết yêu cầu
  "requiredDate": "2026-01-25T23:59:59Z",  // ⭐ CRITICAL
  "priority": "HIGH",                       // ⭐ CRITICAL
  "paymentMethod": "Chuyển khoản",
  "notes": "Ghi chú chung",
  
  // Hàng hóa
  "items": [
    {
      "productId": 45,
      "productName": "Laptop Dell Latitude 5420",
      "unit": "Cái",
      "quantity": 5,
      "amount": 45000000,      // Tiền CHƯA VAT
      "vatAmount": 4500000     // Tiền VAT
    }
  ],
  
  // Tổng tiền
  "amount": 45000000,          // Tổng CHƯA VAT
  "taxAmount": 4500000,        // Tổng VAT
  "totalAmount": 49500000,     // Tổng thanh toán
  
  // Metadata
  "companyID": 1,
  "minRows": 5
}
```

### **Response (Success - 201 Created):**

```json
{
  "requestID": 1,
  "requestCode": "REQ-2026-0001",
  "statusID": 1,
  "statusName": "Pending",
  "customerName": "Công ty TNHH ABC",
  "salesID": 15,
  "salesName": "Trần Văn B",
  "totalAmount": 49500000,
  "requiredDate": "2026-01-25T23:59:59Z",
  "priority": "HIGH",
  "createdAt": "2026-01-18T10:30:00Z",
  "message": "✅ Yêu cầu xuất hóa đơn đã được tạo thành công"
}
```

---

## 🗄️ DATABASE SCHEMA

### **Table: InvoiceRequests**

```sql
CREATE TABLE InvoiceRequests (
    -- Primary Key
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    RequestCode NVARCHAR(50) NOT NULL UNIQUE,  -- REQ-2026-0001
    
    -- Foreign Keys
    SalesID INT NOT NULL,                       -- ⭐ Lấy từ JWT, không từ request body
    CustomerID INT NOT NULL,
    CompanyID INT NOT NULL DEFAULT 1,
    AccountantID INT NULL,                      -- Kế toán được assign (sau)
    ApprovedBy INT NULL,                        -- HOD/KTT phê duyệt (sau)
    InvoiceID INT NULL,                         -- Hóa đơn được tạo (sau)
    
    -- Customer Info (snapshot)
    TaxCode NVARCHAR(50) NOT NULL,
    CustomerName NVARCHAR(255) NOT NULL,
    Address NVARCHAR(500) NULL,
    ContactEmail NVARCHAR(255) NULL,
    ContactPerson NVARCHAR(255) NULL,
    ContactPhone NVARCHAR(50) NULL,
    
    -- Request Details ⭐ CRITICAL
    RequiredDate DATETIME NOT NULL,             -- ⭐ HẠN XUẤT HĐ
    Priority NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM',  -- ⭐ URGENT|HIGH|MEDIUM|LOW
    PaymentMethod NVARCHAR(100) NULL,
    Notes NVARCHAR(1000) NULL,
    
    -- Financial Summary
    Amount DECIMAL(18,2) NOT NULL,              -- Tổng chưa VAT
    TaxAmount DECIMAL(18,2) NOT NULL,           -- Tổng VAT
    TotalAmount DECIMAL(18,2) NOT NULL,         -- Tổng thanh toán
    MinRows INT NOT NULL DEFAULT 5,
    
    -- Status Tracking
    StatusID INT NOT NULL DEFAULT 1,            -- 1=Pending, 2=Approved, 3=Rejected, 4=In Progress, 5=Completed, 6=Cancelled
    RejectionReason NVARCHAR(500) NULL,
    
    -- Timestamps
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    ApprovedAt DATETIME NULL,
    CompletedAt DATETIME NULL,
    
    -- Constraints
    CONSTRAINT FK_InvoiceRequests_Sales FOREIGN KEY (SalesID) REFERENCES Users(UserID),
    CONSTRAINT FK_InvoiceRequests_Customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    CONSTRAINT FK_InvoiceRequests_Status FOREIGN KEY (StatusID) REFERENCES InvoiceRequestStatuses(StatusID),
    CONSTRAINT CK_Priority CHECK (Priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
    
    -- Indexes
    INDEX IX_InvoiceRequests_SalesID (SalesID),
    INDEX IX_InvoiceRequests_StatusID (StatusID),
    INDEX IX_InvoiceRequests_RequiredDate (RequiredDate),
    INDEX IX_InvoiceRequests_Priority (Priority)
)
```

### **Table: InvoiceRequestItems**

```sql
CREATE TABLE InvoiceRequestItems (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID INT NOT NULL,
    
    -- Product Info
    ProductID INT NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    Unit NVARCHAR(50) NOT NULL,
    
    -- Quantity & Pricing
    Quantity DECIMAL(18,2) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,              -- Tiền CHƯA VAT
    VatAmount DECIMAL(18,2) NOT NULL,           -- Tiền VAT
    
    -- Sorting
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_InvoiceRequestItems_Request FOREIGN KEY (RequestID) 
        REFERENCES InvoiceRequests(RequestID) ON DELETE CASCADE,
    
    INDEX IX_InvoiceRequestItems_RequestID (RequestID)
)
```

### **Table: InvoiceRequestStatuses**

```sql
CREATE TABLE InvoiceRequestStatuses (
    StatusID INT PRIMARY KEY,
    StatusName NVARCHAR(50) NOT NULL UNIQUE,
    StatusNameVi NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    Color NVARCHAR(20) NULL  -- success, warning, error, info, default
)

-- Seed Data
INSERT INTO InvoiceRequestStatuses VALUES
(1, 'Pending', 'Chờ duyệt', 'Yêu cầu đang chờ phê duyệt', 'warning'),
(2, 'Approved', 'Đã duyệt', 'Yêu cầu đã được phê duyệt', 'info'),
(3, 'Rejected', 'Từ chối', 'Yêu cầu bị từ chối', 'error'),
(4, 'In Progress', 'Đang xử lý', 'Kế toán đang tạo hóa đơn', 'info'),
(5, 'Completed', 'Hoàn thành', 'Hóa đơn đã được tạo', 'success'),
(6, 'Cancelled', 'Đã hủy', 'Yêu cầu bị hủy', 'default')
```

---

## 🔧 C# IMPLEMENTATION NOTES

### **DTO (Data Transfer Object):**

```csharp
public class CreateInvoiceRequestDto
{
    // === FIELDS GIỮ NGUYÊN ===
    
    // ⚠️ AccountantId - Nullable, frontend gửi 0 hoặc null
    public int? AccountantId { get; set; }  // NULL = chưa assign
    
    // ⚠️ SalesID - Frontend gửi 0, backend OVERRIDE từ JWT
    public int SalesID { get; set; }  // Backend sẽ ignore và dùng giá trị từ token
    
    [Required]
    public int CustomerID { get; set; }
    
    [Required]
    [RegularExpression(@"^\d{10,13}$")]
    public string TaxCode { get; set; }
    
    [Required]
    public string CustomerName { get; set; }
    
    public string Address { get; set; }
    public string ContactEmail { get; set; }
    public string ContactPerson { get; set; }
    public string ContactPhone { get; set; }
    public string PaymentMethod { get; set; }
    public string Notes { get; set; }
    
    [Required]
    public List<InvoiceRequestItemDto> Items { get; set; }
    
    [Required]
    public decimal Amount { get; set; }
    
    [Required]
    public decimal TaxAmount { get; set; }
    
    [Required]
    public decimal TotalAmount { get; set; }
    
    public int CompanyID { get; set; } = 1;
    public int MinRows { get; set; } = 5;
    
    // === TÙY CHỌN - Nếu cần thêm ===
    // public DateTime? RequiredDate { get; set; }  // Hạn xuất HĐ
    // public string Priority { get; set; } = "MEDIUM";  // URGENT|HIGH|MEDIUM|LOW
}
```

### **Controller Method:**

```csharp
[HttpPost]
[Authorize(Roles = "SALES")]
public async Task<ActionResult> CreateInvoiceRequest([FromBody] CreateInvoiceRequestDto dto)
{
    // ⭐ CRITICAL: LẤY SALES ID TỪ JWT TOKEN - IGNORE dto.SalesID
    var salesID = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
    
    // ⭐ CRITICAL: Validate customer exists
    var customer = await _context.Customers.FindAsync(dto.CustomerID);
    if (customer == null)
    {
        return BadRequest($"Không tìm thấy khách hàng với ID: {dto.CustomerID}");
    }
    
    // ⭐ CRITICAL: Validate items
    if (dto.Items == null || dto.Items.Count == 0)
    {
        return BadRequest("Phải có ít nhất 1 sản phẩm");
    }
    
    // ⭐ CRITICAL: Validate totals
    var calculatedAmount = dto.Items.Sum(i => i.Amount);
    var calculatedTaxAmount = dto.Items.Sum(i => i.VatAmount);
    var calculatedTotal = calculatedAmount + calculatedTaxAmount;
    
    if (Math.Abs(calculatedAmount - dto.Amount) > 1 ||
        Math.Abs(calculatedTaxAmount - dto.TaxAmount) > 1 ||
        Math.Abs(calculatedTotal - dto.TotalAmount) > 1)
    {
        return BadRequest("Tổng tiền không khớp với chi tiết sản phẩm");
    }
    
    // ✅ Tạo request
    var request = new InvoiceRequest
    {
        // ⭐ SalesID từ JWT token - KHÔNG DÙNG dto.SalesID
        SalesID = salesID,
        
        // ✅ AccountantID để NULL - chưa assign
        AccountantID = null,
        
        // ✅ Các fields khác
        CustomerID = dto.CustomerID,
        TaxCode = dto.TaxCode,
        CustomerName = dto.CustomerName,
        Address = dto.Address,
        ContactEmail = dto.ContactEmail,
        ContactPerson = dto.ContactPerson,
        ContactPhone = dto.ContactPhone,
        PaymentMethod = dto.PaymentMethod,
        Notes = dto.Notes,
        Amount = dto.Amount,
        TaxAmount = dto.TaxAmount,
        TotalAmount = dto.TotalAmount,
        CompanyID = dto.CompanyID,
        MinRows = dto.MinRows,
        StatusID = 1,  // Pending
        CreatedAt = DateTime.Now,
        
        // Nếu có requiredDate và priority:
        // RequiredDate = dto.RequiredDate ?? DateTime.Now.AddDays(7),
        // Priority = dto.Priority ?? "MEDIUM"
    };
    
    _context.InvoiceRequests.Add(request);
    await _context.SaveChangesAsync();
    
    // ✅ Tạo items
    var items = dto.Items.Select((item, index) => new InvoiceRequestItem
    {
        RequestID = request.RequestID,
        ProductID = item.ProductId,
        ProductName = item.ProductName,
        Unit = item.Unit,
        Quantity = item.Quantity,
        Amount = item.Amount,
        VatAmount = item.VatAmount,
        SortOrder = index + 1
    }).ToList();
    
    _context.InvoiceRequestItems.AddRange(items);
    await _context.SaveChangesAsync();
    
    return CreatedAtAction(nameof(GetRequest), new { id = request.RequestID }, request);
}
```

---

## ⚠️ VALIDATION RULES

### **Backend Validation:**

1. **requiredDate:**
   - ✅ MUST be future date (`> DateTime.Now`)
   - ✅ Required field

2. **priority:**
   - ✅ MUST be one of: "URGENT", "HIGH", "MEDIUM", "LOW"
   - ✅ Default: "MEDIUM"

3. **salesID:**
   - ✅ KHÔNG NHẬN từ request body
   - ✅ TỰ ĐỘNG lấy từ JWT token
   - ✅ User phải có role "SALES"

4. **customerID:**
   - ✅ Phải tồn tại trong DB
   - ✅ Customer phải active

5. **items:**
   - ✅ Phải có ít nhất 1 item
   - ✅ Products phải tồn tại trong DB
   - ✅ Quantity > 0
   - ✅ Amount >= 0
   - ✅ VatAmount >= 0

6. **totals:**
   - ✅ `amount` = sum of items.amount
   - ✅ `taxAmount` = sum of items.vatAmount
   - ✅ `totalAmount` = amount + taxAmount
   - ✅ Tolerance: ±1 VNĐ (rounding)

---

## 🔐 AUTHORIZATION

### **Roles:**

| Role | Create Request | View Own | View All | Approve | Process |
|------|----------------|----------|----------|---------|---------|
| SALES | ✅ | ✅ | ❌ | ❌ | ❌ |
| ACCOUNTANT | ❌ | N/A | ✅ | ❌ | ✅ |
| HOD | ❌ | N/A | ✅ | ✅ | ✅ |
| ADMIN | ✅ | N/A | ✅ | ✅ | ✅ |

### **Logic:**

```csharp
// POST /api/InvoiceRequest
[Authorize(Roles = "SALES")]

// GET /api/InvoiceRequest/{id}
// Sales chỉ xem được request của mình
if (User.IsInRole("SALES"))
{
    if (request.SalesID != currentUserId)
    {
        return Forbid();
    }
}
```

---

## 📈 STATUS FLOW

```
PENDING (1)
    ├─ [HOD Approve] ──→ APPROVED (2)
    ├─ [HOD Reject] ───→ REJECTED (3)
    └─ [Sales Cancel] ─→ CANCELLED (6)

APPROVED (2)
    ├─ [Accountant Start] ──→ IN_PROGRESS (4)
    └─ [Sales Cancel] ──────→ CANCELLED (6)

IN_PROGRESS (4)
    └─ [Accountant Complete] ──→ COMPLETED (5)

REJECTED (3) - Terminal state
COMPLETED (5) - Terminal state
CANCELLED (6) - Terminal state
```

---

## 🧪 TESTING

### **Test Case 1: Success (với requiredDate & priority)**

```http
POST /api/InvoiceRequest
Authorization: Bearer {sales_token}

{
  "customerID": 1,
  "taxCode": "0123456789",
  "customerName": "Công ty ABC",
  "address": "123 ABC",
  "requiredDate": "2026-01-25T23:59:59Z",  // ⭐ Mới
  "priority": "HIGH",                       // ⭐ Mới
  "items": [
    {
      "productId": 1,
      "productName": "Laptop",
      "unit": "Cái",
      "quantity": 1,
      "amount": 10000000,
      "vatAmount": 1000000
    }
  ],
  "amount": 10000000,
  "taxAmount": 1000000,
  "totalAmount": 11000000,
  "companyID": 1,
  "minRows": 5
}

Expected: 201 Created
{
  "requestID": 1,
  "requestCode": "REQ-2026-0001",
  "statusID": 1,
  "statusName": "Pending",
  "requiredDate": "2026-01-25T23:59:59Z",
  "priority": "HIGH",
  "message": "✅ Yêu cầu xuất hóa đơn đã được tạo thành công"
}
```

### **Test Case 2: Validation Error (past date)**

```http
POST /api/InvoiceRequest
{
  "requiredDate": "2026-01-01T00:00:00Z"  // ❌ Quá khứ
}

Expected: 400 Bad Request
{
  "errors": {
    "requiredDate": ["Ngày yêu cầu phải lớn hơn hiện tại"]
  }
}
```

### **Test Case 3: Invalid Priority**

```http
POST /api/InvoiceRequest
{
  "priority": "INVALID"  // ❌ Không hợp lệ
}

Expected: 400 Bad Request
{
  "errors": {
    "priority": ["Priority phải là URGENT, HIGH, MEDIUM hoặc LOW"]
  }
}
```

---

## 🎯 SUMMARY - CẦN LÀM GÌ?

### **Backend Developer Checklist:**

#### **1. Database Migration:**
- [ ] Tạo table `InvoiceRequests`
- [ ] Tạo table `InvoiceRequestItems`
- [ ] Tạo table `InvoiceRequestStatuses`
- [ ] Insert seed data cho statuses
- [ ] Tạo indexes cho performance

#### **2. Code Changes:**
- [ ] ❌ **Xóa `accountantId`** khỏi DTO
- [ ] ❌ **Xóa `salesID`** khỏi DTO
- [ ] ⭐ **Thêm `requiredDate`** vào DTO (Required, DateTime)
- [ ] ⭐ **Thêm `priority`** vào DTO (Required, String, Default="MEDIUM")
- [ ] ⭐ Auto-populate `salesID` từ JWT token trong Controller

#### **3. Validation:**
- [ ] Validate `requiredDate > DateTime.Now`
- [ ] Validate `priority` in ["URGENT", "HIGH", "MEDIUM", "LOW"]
- [ ] Validate customer exists
- [ ] Validate products exist
- [ ] Validate totals match items

#### **4. Testing:**
- [ ] Test với valid data
- [ ] Test với past requiredDate (should fail)
- [ ] Test với invalid priority (should fail)
- [ ] Test authorization (SALES only)
- [ ] Test salesID từ token

#### **5. Documentation:**
- [ ] Update Swagger/OpenAPI spec
- [ ] Update API documentation
- [ ] Update Postman collection

---

## 📊 SO SÁNH API CŨ vs MỚI

| Field | API Hiện tại (Swagger) | Xử lý Backend | Frontend gửi |
|-------|------------------------|---------------|--------------|
| `accountantId` | ✅ Có | ✅ **GIỮ** - Set NULL khi tạo mới | 0 hoặc null |
| `salesID` | ✅ Có | ✅ **GIỮ** - Nhưng OVERRIDE từ JWT token | 0 (bị ignore) |
| `customerID` | ✅ Có | ✅ GIỮ NGUYÊN | ID thực tế |
| `taxCode` | ✅ Có | ✅ GIỮ NGUYÊN | MST khách hàng |
| `customerName` | ✅ Có | ✅ GIỮ NGUYÊN | Tên công ty |
| `address` | ✅ Có | ✅ GIỮ NGUYÊN | Địa chỉ |
| `notes` | ✅ Có | ✅ GIỮ NGUYÊN | Ghi chú |
| `paymentMethod` | ✅ Có | ✅ GIỮ NGUYÊN | Tiền mặt/CK |
| `items` | ✅ Có | ✅ GIỮ NGUYÊN | Mảng sản phẩm |
| `amount` | ✅ Có | ✅ GIỮ NGUYÊN | Tổng chưa VAT |
| `taxAmount` | ✅ Có | ✅ GIỮ NGUYÊN | Tổng VAT |
| `totalAmount` | ✅ Có | ✅ GIỮ NGUYÊN | Tổng thanh toán |
| `minRows` | ✅ Có | ✅ GIỮ NGUYÊN | 5 |
| `contactEmail` | ✅ Có | ✅ GIỮ NGUYÊN | Email |
| `contactPerson` | ✅ Có | ✅ GIỮ NGUYÊN | Người liên hệ |
| `contactPhone` | ✅ Có | ✅ GIỮ NGUYÊN | SĐT |
| `companyID` | ✅ Có | ✅ GIỮ NGUYÊN | 1 |
| **`requiredDate`** | ❌ Không có | 🤔 **TÙY CHỌN** - Thêm nếu cần | DateTime |
| **`priority`** | ❌ Không có | 🤔 **TÙY CHỌN** - Thêm nếu cần | URGENT/HIGH/... |

---

## 🎯 TÓM TẮT - BACKEND CẦN LÀM GÌ?

### ✅ **KHÔNG CẦN XÓA GÌ CẢ** - API hiện tại OK!

### ⚠️ **CHỈ CẦN SỬA 2 LOGIC:**

1. **`salesID` - Backend PHẢI OVERRIDE:**
   ```csharp
   // Frontend gửi: dto.SalesID = 0
   // Backend IGNORE và dùng giá trị từ JWT:
   var salesID = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
   request.SalesID = salesID;  // ⭐ Bắt buộc
   ```

2. **`accountantId` - Backend SET NULL:**
   ```csharp
   // Frontend gửi: dto.AccountantId = 0 hoặc null
   // Backend:
   request.AccountantID = null;  // Để trống, assign sau khi approve
   ```

### 🤔 **CÂU HỎI CHO USER:**

**Có cần thêm `requiredDate` (Hạn xuất HĐ) không?**
- ✅ **NẾU CÓ**: Accountant biết yêu cầu nào URGENT, sắp xếp ưu tiên
- ❌ **NẾU KHÔNG**: Xử lý theo thứ tự tạo (FIFO)

**Có cần thêm `priority` (Mức độ ưu tiên) không?**
- ✅ **NẾU CÓ**: Filter dễ dàng: "Chỉ xem URGENT"
- ❌ **NẾU KHÔNG**: Tất cả yêu cầu đều bình đẳng

---

## 📋 IMPLEMENTATION CHECKLIST

### **Nếu GIỮ NGUYÊN (không thêm requiredDate/priority):**

- [x] ✅ API payload hiện tại đã OK
- [ ] ⚠️ Backend: Override `salesID` từ JWT token
- [ ] ⚠️ Backend: Set `accountantID = null` khi tạo mới
- [ ] ✅ Validate customer exists
- [ ] ✅ Validate products exist  
- [ ] ✅ Validate totals match items
- [ ] ✅ Test authorization (SALES only)

### **Nếu THÊM requiredDate & priority:**

- [ ] 📅 Thêm `requiredDate` vào DTO (DateTime, nullable hoặc required)
- [ ] 🔢 Thêm `priority` vào DTO (String, default "MEDIUM")
- [ ] 🗄️ Alter table: ADD `RequiredDate` DATETIME
- [ ] 🗄️ Alter table: ADD `Priority` NVARCHAR(20)
- [ ] ✅ Validate requiredDate > Now (nếu required)
- [ ] ✅ Validate priority in ["URGENT","HIGH","MEDIUM","LOW"]
- [ ] 🎨 Frontend: Thêm DatePicker
- [ ] 🎨 Frontend: Thêm Priority dropdown

---

**Last Updated:** 2026-01-18  
**Status:** 🟡 Đang chờ Backend implement  
**Priority:** HIGH (Core feature)

**Liên hệ:** Frontend đã sẵn sàng, chỉ cần Backend update 2 fields: `requiredDate` và `priority`
