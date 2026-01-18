# Backend Staff Dashboard API - Requirements Specification

**API:** `GET /api/Dashboard/staff`  
**Date:** 2026-01-18  
**Role:** Accountant (Kế toán viên)  
**Purpose:** Personal workspace để theo dõi công việc hàng ngày

---

## 📋 TỔNG QUAN

Staff Dashboard là không gian làm việc cá nhân cho kế toán viên, tập trung vào:
1. **Workload Status** - Tình trạng công việc (KPIs)
2. **Task Queue** - Danh sách việc cần xử lý ngay
3. **Recent Work** - Hóa đơn vừa tạo gần đây

**Key Principles:**
- Personal data only (chỉ dữ liệu của user đang login)
- Action-oriented (focus vào việc cần làm ngay)
- Simple & Fast (load nhanh, dễ hiểu)

---

## 🎯 API ENDPOINT

```
GET /api/Dashboard/staff
Authorization: Bearer {token}
```

**Response Structure:**
```json
{
  "kpis": {
    "rejectedCount": 2,
    "draftsCount": 3,
    "sentToday": 5,
    "customersToCall": 4
  },
  "taskQueue": [
    {
      "id": "task-001",
      "type": "rejected",
      "priority": "high",
      "invoiceId": 43,
      "invoiceNumber": "HD-2024-005",
      "customerName": "Công ty TNHH ABC",
      "reason": "Sai mã số thuế - Vui lòng kiểm tra lại MST 0123456789",
      "amount": 125000000,
      "createdDate": "2026-01-18T08:15:30Z",
      "hoursAgo": 3.5
    }
  ],
  "recentInvoices": [
    {
      "invoiceId": 147,
      "invoiceNumber": "HD-2024-025",
      "customerName": "Công ty TNHH ABC",
      "amount": 125000000,
      "statusId": 8,
      "statusName": "Sent",
      "createdAt": "2026-01-18T09:30:00Z",
      "updatedAt": null
    }
  ],
  "currentUser": {
    "userId": 53,
    "userName": "Nguyễn Văn A",
    "role": "Accountant"
  },
  "generatedAt": "2026-01-18T11:45:30Z"
}
```

---

## 📊 SECTION 1: KPIs (Workload Status)

### Purpose:
Hiển thị tình trạng công việc tổng quan của user

### Fields:

```json
{
  "kpis": {
    "rejectedCount": 2,      // ✅ CRITICAL - Số hóa đơn bị từ chối cần fix ngay
    "draftsCount": 3,        // ✅ Số hóa đơn nháp chưa hoàn thành
    "sentToday": 5,          // ✅ Số hóa đơn đã gửi trong ngày hôm nay
    "customersToCall": 4     // ✅ Số khách hàng có công nợ cần gọi điện
  }
}
```

### Calculation Logic:

#### 1. rejectedCount
```sql
SELECT COUNT(*)
FROM Invoices
WHERE CreatedBy = @CurrentUserId
  AND InvoiceStatusID = 9  -- Rejected status
  AND UpdatedAt >= DATEADD(DAY, -7, GETDATE())  -- Rejected trong 7 ngày qua
```

**Business Rules:**
- Chỉ đếm hóa đơn bị từ chối trong 7 ngày gần đây
- Hóa đơn rejected quá 7 ngày không đếm (coi như đã xử lý hoặc bỏ qua)
- Nếu hóa đơn bị reject nhiều lần → chỉ đếm 1 lần

#### 2. draftsCount
```sql
SELECT COUNT(*)
FROM Invoices
WHERE CreatedBy = @CurrentUserId
  AND InvoiceStatusID = 1  -- Draft status
  AND CreatedAt >= DATEADD(DAY, -30, GETDATE())  -- Draft trong 30 ngày qua
```

**Business Rules:**
- Chỉ đếm draft trong 30 ngày gần đây
- Draft quá cũ (>30 ngày) không hiển thị (có thể đã bỏ qua)

#### 3. sentToday
```sql
SELECT COUNT(*)
FROM Invoices
WHERE CreatedBy = @CurrentUserId
  AND InvoiceStatusID = 8  -- Sent/Issued status
  AND CAST(UpdatedAt AS DATE) = CAST(GETDATE() AS DATE)  -- Hôm nay
```

**Business Rules:**
- Đếm hóa đơn có status = Sent trong ngày hôm nay
- Dùng UpdatedAt (thời điểm chuyển sang Sent), không dùng CreatedAt

#### 4. customersToCall
```sql
SELECT COUNT(DISTINCT i.CustomerID)
FROM Invoices i
INNER JOIN Customers c ON i.CustomerID = c.CustomerID
WHERE i.CreatedBy = @CurrentUserId
  AND i.PaymentStatusID = 2  -- Unpaid
  AND DATEDIFF(DAY, i.IssueDate, GETDATE()) > 30  -- Quá hạn > 30 ngày
  AND c.IsActive = 1
```

**Business Rules:**
- Đếm số khách hàng (DISTINCT, không đếm số hóa đơn)
- Chỉ đếm khách hàng có hóa đơn:
  - Do user tạo
  - Chưa thanh toán (PaymentStatusID = 2)
  - Quá hạn > 30 ngày
- 1 khách hàng có nhiều hóa đơn quá hạn → chỉ đếm 1 lần

---

## 📋 SECTION 2: Task Queue (Việc cần xử lý ngay)

### Purpose:
Danh sách tất cả công việc cần xử lý khẩn cấp của user

### Task Types:

1. **rejected** - Hóa đơn bị từ chối (HIGHEST PRIORITY)
2. **draft** - Hóa đơn nháp chưa hoàn thành (MEDIUM PRIORITY)
3. **overdue** - Công nợ quá hạn cần theo dõi (LOW PRIORITY)

### API Response:

```json
{
  "taskQueue": [
    {
      "id": "task-rejected-43",
      "type": "rejected",
      "priority": "high",
      "invoiceId": 43,
      "invoiceNumber": "HD-2024-005",
      "customerName": "Công ty TNHH ABC",
      "taxCode": "0123456789",
      "reason": "Sai mã số thuế - Vui lòng kiểm tra lại MST 0123456789",
      "amount": 125000000,
      "createdDate": "2026-01-18T08:15:30Z",
      "rejectedDate": "2026-01-18T08:15:30Z",
      "hoursAgo": 3.5,
      "daysOld": null
    },
    {
      "id": "task-draft-147",
      "type": "draft",
      "priority": "medium",
      "invoiceId": 147,
      "invoiceNumber": "HD-2024-012",
      "customerName": "Công ty TNHH DEF",
      "taxCode": null,
      "reason": null,
      "amount": 67000000,
      "createdDate": "2026-01-15T10:30:00Z",
      "rejectedDate": null,
      "hoursAgo": null,
      "daysOld": 3
    },
    {
      "id": "task-overdue-MNO",
      "type": "overdue",
      "priority": "low",
      "invoiceId": 85,
      "invoiceNumber": "HD-2024-001",
      "customerName": "Công ty CP MNO",
      "taxCode": "9876543210",
      "reason": null,
      "amount": 138000000,
      "createdDate": "2025-12-04T14:20:00Z",
      "rejectedDate": null,
      "hoursAgo": null,
      "daysOld": 45
    }
  ]
}
```

### Field Definitions:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID: "task-{type}-{invoiceId/customerId}" |
| `type` | enum | ✅ | "rejected" \| "draft" \| "overdue" |
| `priority` | enum | ✅ | "high" \| "medium" \| "low" |
| `invoiceId` | number | ✅ | ID của invoice |
| `invoiceNumber` | string | ✅ | Số hóa đơn |
| `customerName` | string | ✅ | Tên khách hàng |
| `taxCode` | string | ⚪ | Mã số thuế (nullable) |
| `reason` | string | ⚪ | Lý do từ chối (chỉ có khi type=rejected) |
| `amount` | number | ✅ | Tổng tiền hóa đơn |
| `createdDate` | string | ✅ | ISO timestamp - Ngày tạo invoice |
| `rejectedDate` | string | ⚪ | ISO timestamp - Ngày bị reject (nullable) |
| `hoursAgo` | number | ⚪ | Số giờ kể từ khi bị reject (nullable) |
| `daysOld` | number | ⚪ | Số ngày tồn tại (cho draft/overdue, nullable) |

### SQL Queries:

#### Query 1: Rejected Invoices
```sql
SELECT 
    'task-rejected-' + CAST(i.InvoiceID AS VARCHAR) AS id,
    'rejected' AS type,
    'high' AS priority,
    i.InvoiceID AS invoiceId,
    CONCAT('HD-', YEAR(i.CreatedAt), '-', RIGHT('000' + CAST(i.InvoiceNumber AS VARCHAR), 3)) AS invoiceNumber,
    c.CustomerName AS customerName,
    c.TaxCode AS taxCode,
    i.RejectionReason AS reason,  -- ⚠️ CRITICAL: Cần có field này
    i.TotalAmount AS amount,
    i.CreatedAt AS createdDate,
    i.UpdatedAt AS rejectedDate,
    DATEDIFF(HOUR, i.UpdatedAt, GETDATE()) + 
        (DATEDIFF(MINUTE, i.UpdatedAt, GETDATE()) % 60) / 60.0 AS hoursAgo,
    NULL AS daysOld
FROM Invoices i
INNER JOIN Customers c ON i.CustomerID = c.CustomerID
WHERE i.CreatedBy = @CurrentUserId
  AND i.InvoiceStatusID = 9  -- Rejected
  AND i.UpdatedAt >= DATEADD(DAY, -7, GETDATE())
ORDER BY i.UpdatedAt DESC
```

**Important Notes:**
- ⚠️ **CRITICAL:** Cần có field `RejectionReason` trong table Invoices
- Nếu chưa có field này → cần tạo migration:
```sql
ALTER TABLE Invoices ADD RejectionReason NVARCHAR(500) NULL
```

#### Query 2: Draft Invoices (Old)
```sql
SELECT 
    'task-draft-' + CAST(i.InvoiceID AS VARCHAR) AS id,
    'draft' AS type,
    CASE 
        WHEN DATEDIFF(DAY, i.CreatedAt, GETDATE()) >= 7 THEN 'high'
        WHEN DATEDIFF(DAY, i.CreatedAt, GETDATE()) >= 3 THEN 'medium'
        ELSE 'low'
    END AS priority,
    i.InvoiceID AS invoiceId,
    CONCAT('HD-', YEAR(i.CreatedAt), '-', RIGHT('000' + CAST(i.InvoiceNumber AS VARCHAR), 3)) AS invoiceNumber,
    c.CustomerName AS customerName,
    c.TaxCode AS taxCode,
    NULL AS reason,
    i.TotalAmount AS amount,
    i.CreatedAt AS createdDate,
    NULL AS rejectedDate,
    NULL AS hoursAgo,
    DATEDIFF(DAY, i.CreatedAt, GETDATE()) AS daysOld
FROM Invoices i
INNER JOIN Customers c ON i.CustomerID = c.CustomerID
WHERE i.CreatedBy = @CurrentUserId
  AND i.InvoiceStatusID = 1  -- Draft
  AND i.CreatedAt >= DATEADD(DAY, -30, GETDATE())
  AND DATEDIFF(DAY, i.CreatedAt, GETDATE()) >= 1  -- Ít nhất 1 ngày cũ
ORDER BY i.CreatedAt ASC  -- Oldest first
```

#### Query 3: Overdue Customers
```sql
SELECT 
    'task-overdue-' + CAST(i.InvoiceID AS VARCHAR) AS id,
    'overdue' AS type,
    CASE 
        WHEN DATEDIFF(DAY, i.IssueDate, GETDATE()) >= 60 THEN 'high'
        WHEN DATEDIFF(DAY, i.IssueDate, GETDATE()) >= 45 THEN 'medium'
        ELSE 'low'
    END AS priority,
    i.InvoiceID AS invoiceId,
    CONCAT('HD-', YEAR(i.CreatedAt), '-', RIGHT('000' + CAST(i.InvoiceNumber AS VARCHAR), 3)) AS invoiceNumber,
    c.CustomerName AS customerName,
    c.TaxCode AS taxCode,
    NULL AS reason,
    i.TotalAmount AS amount,
    i.IssueDate AS createdDate,
    NULL AS rejectedDate,
    NULL AS hoursAgo,
    DATEDIFF(DAY, i.IssueDate, GETDATE()) AS daysOld
FROM Invoices i
INNER JOIN Customers c ON i.CustomerID = c.CustomerID
WHERE i.CreatedBy = @CurrentUserId
  AND i.PaymentStatusID = 2  -- Unpaid
  AND DATEDIFF(DAY, i.IssueDate, GETDATE()) > 30
ORDER BY i.IssueDate ASC  -- Oldest first
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY  -- Limit 20 items
```

### Sorting Rules:

Backend phải return tasks theo thứ tự:
1. **Rejected tasks** (type=rejected) - Sorted by rejectedDate DESC (mới nhất first)
2. **Draft tasks** (type=draft) - Sorted by createdDate ASC (cũ nhất first)
3. **Overdue tasks** (type=overdue) - Sorted by issueDate ASC (cũ nhất first)

```csharp
// C# sorting example
var sortedTasks = rejectedTasks
    .OrderByDescending(t => t.RejectedDate)
    .Concat(draftTasks.OrderBy(t => t.CreatedDate))
    .Concat(overdueTasks.OrderBy(t => t.CreatedDate))
    .Take(50)  // Limit to 50 tasks
    .ToList();
```

### Limit Rules:
- Maximum 50 tasks total
- Breakdown:
  - Rejected: unlimited (nhưng filter 7 ngày)
  - Draft: unlimited (nhưng filter 30 ngày)
  - Overdue: maximum 20 (giới hạn trong query)

---

## 📄 SECTION 3: Recent Invoices

### Purpose:
Danh sách hóa đơn user vừa tạo gần đây (tất cả statuses)

### API Response:

```json
{
  "recentInvoices": [
    {
      "invoiceId": 147,
      "invoiceNumber": "HD-2024-025",
      "customerName": "Công ty TNHH ABC",
      "amount": 125000000,
      "statusId": 8,
      "statusName": "Sent",
      "createdAt": "2026-01-18T09:30:00Z",
      "updatedAt": "2026-01-18T10:15:00Z"
    }
  ]
}
```

### SQL Query:

```sql
SELECT TOP 20
    i.InvoiceID AS invoiceId,
    CONCAT('HD-', YEAR(i.CreatedAt), '-', RIGHT('000' + CAST(i.InvoiceNumber AS VARCHAR), 3)) AS invoiceNumber,
    c.CustomerName AS customerName,
    i.TotalAmount AS amount,
    i.InvoiceStatusID AS statusId,
    s.StatusName AS statusName,
    i.CreatedAt AS createdAt,
    i.UpdatedAt AS updatedAt
FROM Invoices i
INNER JOIN Customers c ON i.CustomerID = c.CustomerID
INNER JOIN InvoiceStatuses s ON i.InvoiceStatusID = s.StatusID
WHERE i.CreatedBy = @CurrentUserId
  AND i.CreatedAt >= DATEADD(DAY, -7, GETDATE())  -- Last 7 days
ORDER BY i.CreatedAt DESC
```

**Business Rules:**
- Show last 20 invoices (limit 20)
- Include ALL statuses (Draft, Pending, Approved, Rejected, Sent)
- Filter: Chỉ invoices tạo trong 7 ngày gần đây
- Sort: CreatedAt DESC (mới nhất first)

**Status Mapping:**
```csharp
// Map status name to Vietnamese
var statusMap = new Dictionary<int, string>
{
    { 1, "Draft" },      // Nháp
    { 6, "Pending" },    // Chờ duyệt
    { 7, "Approved" },   // Đã duyệt
    { 9, "Rejected" },   // Từ chối
    { 8, "Sent" }        // Đã gửi
};
```

---

## 👤 SECTION 4: Current User Info

### Purpose:
Thông tin user hiện tại để hiển thị personalized greeting

### API Response:

```json
{
  "currentUser": {
    "userId": 53,
    "userName": "Nguyễn Văn A",
    "fullName": "Trần Thị Nguyên Nguyễn Nguyên",
    "role": "Accountant",
    "email": "nguyennguyen16502@gmail.com",
    "avatar": null
  }
}
```

### Implementation:

```csharp
// Get from JWT token claims
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var userName = User.FindFirst(ClaimTypes.Name)?.Value;
var role = User.FindFirst(ClaimTypes.Role)?.Value;
var email = User.FindFirst(ClaimTypes.Email)?.Value;

// Query for full info
var user = await _context.Users
    .Where(u => u.UserID == int.Parse(userId))
    .Select(u => new {
        u.UserID,
        u.UserName,
        u.FullName,
        u.Email,
        Role = u.Role.RoleName,
        u.AvatarUrl
    })
    .FirstOrDefaultAsync();
```

---

## 🔧 C# IMPLEMENTATION EXAMPLE

```csharp
[HttpGet("staff")]
[Authorize(Roles = "Accountant")]
public async Task<IActionResult> GetStaffDashboard()
{
    try
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        
        // 1. Get KPIs
        var kpis = await GetStaffKPIs(userId);
        
        // 2. Get Task Queue
        var taskQueue = await GetStaffTaskQueue(userId);
        
        // 3. Get Recent Invoices
        var recentInvoices = await GetStaffRecentInvoices(userId);
        
        // 4. Get Current User Info
        var currentUser = await GetCurrentUserInfo(userId);
        
        var response = new
        {
            kpis,
            taskQueue,
            recentInvoices,
            currentUser,
            generatedAt = DateTime.UtcNow
        };
        
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching staff dashboard");
        return StatusCode(500, "Internal server error");
    }
}

private async Task<object> GetStaffKPIs(int userId)
{
    var now = DateTime.Now;
    var sevenDaysAgo = now.AddDays(-7);
    var thirtyDaysAgo = now.AddDays(-30);
    var today = now.Date;
    
    var rejectedCount = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.InvoiceStatusID == 9 
            && i.UpdatedAt >= sevenDaysAgo)
        .CountAsync();
    
    var draftsCount = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.InvoiceStatusID == 1 
            && i.CreatedAt >= thirtyDaysAgo)
        .CountAsync();
    
    var sentToday = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.InvoiceStatusID == 8 
            && i.UpdatedAt.HasValue
            && i.UpdatedAt.Value.Date == today)
        .CountAsync();
    
    var customersToCall = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.PaymentStatusID == 2
            && EF.Functions.DateDiffDay(i.IssueDate, now) > 30)
        .Select(i => i.CustomerID)
        .Distinct()
        .CountAsync();
    
    return new
    {
        rejectedCount,
        draftsCount,
        sentToday,
        customersToCall
    };
}

private async Task<List<object>> GetStaffTaskQueue(int userId)
{
    var now = DateTime.Now;
    var sevenDaysAgo = now.AddDays(-7);
    var thirtyDaysAgo = now.AddDays(-30);
    
    // 1. Rejected Invoices
    var rejectedTasks = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.InvoiceStatusID == 9 
            && i.UpdatedAt >= sevenDaysAgo)
        .OrderByDescending(i => i.UpdatedAt)
        .Select(i => new
        {
            id = $"task-rejected-{i.InvoiceID}",
            type = "rejected",
            priority = "high",
            invoiceId = i.InvoiceID,
            invoiceNumber = $"HD-{i.CreatedAt.Year}-{i.InvoiceNumber:D3}",
            customerName = i.Customer.CustomerName,
            taxCode = i.Customer.TaxCode,
            reason = i.RejectionReason,
            amount = i.TotalAmount,
            createdDate = i.CreatedAt,
            rejectedDate = i.UpdatedAt,
            hoursAgo = EF.Functions.DateDiffHour(i.UpdatedAt.Value, now) + 
                      (EF.Functions.DateDiffMinute(i.UpdatedAt.Value, now) % 60) / 60.0,
            daysOld = (int?)null
        })
        .ToListAsync();
    
    // 2. Draft Invoices
    var draftTasks = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.InvoiceStatusID == 1 
            && i.CreatedAt >= thirtyDaysAgo
            && EF.Functions.DateDiffDay(i.CreatedAt, now) >= 1)
        .OrderBy(i => i.CreatedAt)
        .Select(i => new
        {
            id = $"task-draft-{i.InvoiceID}",
            type = "draft",
            priority = EF.Functions.DateDiffDay(i.CreatedAt, now) >= 7 ? "high" :
                      EF.Functions.DateDiffDay(i.CreatedAt, now) >= 3 ? "medium" : "low",
            invoiceId = i.InvoiceID,
            invoiceNumber = $"HD-{i.CreatedAt.Year}-{i.InvoiceNumber:D3}",
            customerName = i.Customer.CustomerName,
            taxCode = i.Customer.TaxCode,
            reason = (string)null,
            amount = i.TotalAmount,
            createdDate = i.CreatedAt,
            rejectedDate = (DateTime?)null,
            hoursAgo = (double?)null,
            daysOld = EF.Functions.DateDiffDay(i.CreatedAt, now)
        })
        .ToListAsync();
    
    // 3. Overdue Invoices
    var overdueTasks = await _context.Invoices
        .Where(i => i.CreatedBy == userId 
            && i.PaymentStatusID == 2
            && EF.Functions.DateDiffDay(i.IssueDate, now) > 30)
        .OrderBy(i => i.IssueDate)
        .Take(20)
        .Select(i => new
        {
            id = $"task-overdue-{i.InvoiceID}",
            type = "overdue",
            priority = EF.Functions.DateDiffDay(i.IssueDate, now) >= 60 ? "high" :
                      EF.Functions.DateDiffDay(i.IssueDate, now) >= 45 ? "medium" : "low",
            invoiceId = i.InvoiceID,
            invoiceNumber = $"HD-{i.CreatedAt.Year}-{i.InvoiceNumber:D3}",
            customerName = i.Customer.CustomerName,
            taxCode = i.Customer.TaxCode,
            reason = (string)null,
            amount = i.TotalAmount,
            createdDate = i.IssueDate,
            rejectedDate = (DateTime?)null,
            hoursAgo = (double?)null,
            daysOld = EF.Functions.DateDiffDay(i.IssueDate, now)
        })
        .ToListAsync();
    
    // Combine and limit to 50 total
    return rejectedTasks.Cast<object>()
        .Concat(draftTasks.Cast<object>())
        .Concat(overdueTasks.Cast<object>())
        .Take(50)
        .ToList();
}

private async Task<List<object>> GetStaffRecentInvoices(int userId)
{
    var sevenDaysAgo = DateTime.Now.AddDays(-7);
    
    return await _context.Invoices
        .Where(i => i.CreatedBy == userId && i.CreatedAt >= sevenDaysAgo)
        .OrderByDescending(i => i.CreatedAt)
        .Take(20)
        .Select(i => new
        {
            invoiceId = i.InvoiceID,
            invoiceNumber = $"HD-{i.CreatedAt.Year}-{i.InvoiceNumber:D3}",
            customerName = i.Customer.CustomerName,
            amount = i.TotalAmount,
            statusId = i.InvoiceStatusID,
            statusName = i.InvoiceStatus.StatusName,
            createdAt = i.CreatedAt,
            updatedAt = i.UpdatedAt
        })
        .ToListAsync();
}

private async Task<object> GetCurrentUserInfo(int userId)
{
    return await _context.Users
        .Where(u => u.UserID == userId)
        .Select(u => new
        {
            userId = u.UserID,
            userName = u.UserName,
            fullName = u.FullName,
            role = u.Role.RoleName,
            email = u.Email,
            avatar = u.AvatarUrl
        })
        .FirstOrDefaultAsync();
}
```

---

## ⚠️ CRITICAL REQUIREMENTS

### 1. Database Schema Changes

**⚠️ REQUIRED:** Nếu chưa có field `RejectionReason`:

```sql
-- Migration: Add RejectionReason field
ALTER TABLE Invoices 
ADD RejectionReason NVARCHAR(500) NULL;

-- Update existing rejected invoices (optional)
UPDATE Invoices 
SET RejectionReason = 'Lý do từ chối chưa được ghi nhận'
WHERE InvoiceStatusID = 9 
  AND RejectionReason IS NULL;
```

### 2. Authorization

```csharp
[Authorize(Roles = "Accountant")]
```

- Chỉ user có role "Accountant" mới access được
- Không được phép xem data của user khác

### 3. Performance Optimization

```csharp
// Use AsNoTracking for read-only queries
var invoices = await _context.Invoices
    .AsNoTracking()
    .Where(...)
    .ToListAsync();

// Add indexes for better performance
CREATE INDEX IX_Invoices_CreatedBy_StatusID_UpdatedAt 
ON Invoices (CreatedBy, InvoiceStatusID, UpdatedAt);

CREATE INDEX IX_Invoices_CreatedBy_StatusID_CreatedAt 
ON Invoices (CreatedBy, InvoiceStatusID, CreatedAt);
```

---

## 🧪 TESTING

### Test Case 1: KPIs Calculation
```http
GET /api/Dashboard/staff
Authorization: Bearer {accountant_token}

Expected Response:
{
  "kpis": {
    "rejectedCount": 2,  // Must match actual rejected invoices in last 7 days
    "draftsCount": 3,    // Must match actual drafts in last 30 days
    "sentToday": 5,      // Must match invoices sent today
    "customersToCall": 4 // Must match distinct customers with overdue > 30 days
  }
}
```

### Test Case 2: Task Queue Sorting
```json
{
  "taskQueue": [
    // MUST be sorted in this order:
    // 1. All rejected tasks (newest first)
    { "type": "rejected", "hoursAgo": 2.5 },
    { "type": "rejected", "hoursAgo": 5.0 },
    // 2. All draft tasks (oldest first)
    { "type": "draft", "daysOld": 5 },
    { "type": "draft", "daysOld": 3 },
    // 3. All overdue tasks (oldest first)
    { "type": "overdue", "daysOld": 60 },
    { "type": "overdue", "daysOld": 45 }
  ]
}
```

### Test Case 3: Personal Data Only
```http
# User A (userId=53) should NOT see User B's data
GET /api/Dashboard/staff
Authorization: Bearer {user_a_token}

# Should ONLY return invoices where CreatedBy = 53
```

### Test Case 4: RejectionReason Field
```json
{
  "taskQueue": [
    {
      "type": "rejected",
      "reason": "Sai mã số thuế - Vui lòng kiểm tra lại MST 0123456789"
      // ⚠️ Must have actual rejection reason, not null
    }
  ]
}
```

---

## 📈 SUCCESS CRITERIA

| Requirement | Status |
|-------------|--------|
| ✅ API returns personal data only | REQUIRED |
| ✅ KPIs calculate correctly | REQUIRED |
| ✅ Task queue sorted properly | REQUIRED |
| ✅ RejectionReason field exists | REQUIRED |
| ✅ Recent invoices limited to 20 | REQUIRED |
| ✅ Task queue limited to 50 | REQUIRED |
| ✅ Performance < 500ms | REQUIRED |
| ✅ Authorization check | REQUIRED |

---

## 🎯 SUMMARY

**API Structure:**
```
GET /api/Dashboard/staff
└── kpis (4 metrics)
└── taskQueue (max 50 items, 3 types)
└── recentInvoices (max 20 items)
└── currentUser (user info)
└── generatedAt (timestamp)
```

**Key Points:**
1. **Personal Data Only** - Chỉ data của user login
2. **Action-Oriented** - Focus việc cần làm ngay
3. **Properly Sorted** - Rejected → Draft → Overdue
4. **Limited Results** - 50 tasks, 20 invoices
5. **Fast Performance** - < 500ms response time

---

**Last Updated:** 2026-01-18  
**Status:** 🟡 Ready for Implementation  
**Priority:** HIGH (Personal dashboard for daily operations)

**Next Steps:**
1. ⚠️ Check if `RejectionReason` field exists → If not, create migration
2. Implement C# code following example above
3. Add indexes for performance
4. Test with real user data
5. Deploy to staging for testing
