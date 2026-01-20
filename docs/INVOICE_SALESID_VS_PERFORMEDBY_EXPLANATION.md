# 🔍 CHI TIẾT: `salesID` vs `performedBy`

**Date:** 19/01/2026  
**Purpose:** Giải thích rõ mục đích business của 2 fields này

---

## 🎯 TÓM TẮT NGẮN GỌN

### **`salesID` - CHO SALE (Commission/Performance)**
- **Ai:** ID của Sale tạo Invoice Request
- **Khi nào:** Chỉ có khi tạo từ Invoice Request
- **Tại sao:** Để tính hoa hồng, báo cáo doanh số cho Sale

### **`performedBy` - CHO HỆ THỐNG (Audit/Legal)**
- **Ai:** ID của người tạo Invoice trong hệ thống
- **Khi nào:** Luôn luôn có (required)
- **Tại sao:** Trách nhiệm pháp lý, audit log, quyền hạn

---

## 📊 SO SÁNH CHI TIẾT

| Aspect | `salesID` | `performedBy` |
|--------|-----------|---------------|
| **Bắt buộc?** | ❌ Optional | ✅ Required |
| **Người nào?** | Sale tạo request | User tạo invoice |
| **Role?** | Sale | Accountant/Admin |
| **Khi nào có?** | Chỉ từ Invoice Request | Luôn luôn |
| **Mục đích chính** | Commission, Sales KPI | Audit, Accountability |
| **Dùng cho** | Business/Sales dept | Legal/System/Admin |
| **Query pattern** | `WHERE salesID = X` | `WHERE performedBy = X` |
| **Có thể NULL?** | ✅ Yes | ❌ No |

---

## 🎬 FLOW DIAGRAM

### **Scenario 1: Tạo từ Invoice Request**

```
┌─────────────────────────────────────────────────────┐
│  👤 SALE (ID=5) - Nguyễn Văn A                      │
│  - Gặp khách hàng, chốt đơn 100 triệu               │
│  - Tạo Invoice Request #123                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Invoice Request    │
         │  - requestID: 123   │
         │  - salesID: 5       │ ← GHI NHẬN SALE
         │  - status: Pending  │
         └──────────┬──────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  👤 ACCOUNTANT (ID=10) - Trần Thị B                 │
│  - Xem danh sách Invoice Requests                   │
│  - Click "Tạo Hóa Đơn" từ request #123              │
│  - Kiểm tra thông tin, xác nhận                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  POST /api/Invoice  │
         │  {                  │
         │    salesID: 5,      │ ← SALE ĐƯỢC TÍNH HOA HỒNG
         │    performedBy: 10, │ ← KT CHỊU TRÁCH NHIỆM
         │    requestID: 123   │
         │  }                  │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Invoice #206       │
         │  - salesID: 5       │ ← Sale A nhận commission
         │  - performedBy: 10  │ ← KT B chịu trách nhiệm
         │  - requestID: 123   │
         │  - amount: 100M     │
         └─────────────────────┘
```

**Backend processing:**
```sql
-- 1. Tạo Invoice
INSERT INTO invoices (salesID, performedBy, requestID, amount, ...)
VALUES (5, 10, 123, 100000000, ...);

-- 2. Update Request status
UPDATE invoice_requests 
SET statusID = 2, invoiceID = 206
WHERE requestID = 123;
```

**Use cases:**
```sql
-- Sale A xem doanh số của mình
SELECT invoiceID, totalAmount, createdAt
FROM invoices 
WHERE salesID = 5;
-- Result: Invoice #206 (100M) ← Được tính commission

-- Admin audit: Ai tạo Invoice #206?
SELECT u.userName, i.createdAt
FROM invoices i
JOIN users u ON i.performedBy = u.userID
WHERE invoiceID = 206;
-- Result: Trần Thị B (ID=10) - 19/01/2026
```

### **Scenario 2: Tạo trực tiếp**

```
┌─────────────────────────────────────────────────────┐
│  👤 ACCOUNTANT (ID=10) - Trần Thị B                 │
│  - Khách hàng gọi đến yêu cầu tạo HĐ khẩn           │
│  - KHÔNG QUA SALE                                   │
│  - Tạo trực tiếp từ menu "Tạo Hóa Đơn"              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  POST /api/Invoice  │
         │  {                  │
         │    // NO salesID    │ ← KHÔNG CÓ SALE
         │    performedBy: 10, │ ← KT TẠO VÀ CHỊU TN
         │    // NO requestID  │
         │  }                  │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Invoice #207       │
         │  - salesID: NULL    │ ← Không có Sale
         │  - performedBy: 10  │ ← KT B tạo và chịu TN
         │  - requestID: NULL  │
         │  - amount: 50M      │
         └─────────────────────┘
```

**Backend processing:**
```sql
-- Tạo Invoice (không có salesID, requestID)
INSERT INTO invoices (performedBy, amount, ...)
VALUES (10, 50000000, ...);
-- salesID = NULL, requestID = NULL
```

**Use cases:**
```sql
-- Invoices tạo trực tiếp (không qua Sale)
SELECT invoiceID, totalAmount
FROM invoices 
WHERE salesID IS NULL;
-- Result: Invoice #207 (50M) ← Không tính commission

-- KT B xem tất cả invoices mình tạo
SELECT invoiceID, totalAmount, salesID
FROM invoices 
WHERE performedBy = 10;
-- Result: 
--   Invoice #206 (100M) - salesID=5 (từ request)
--   Invoice #207 (50M)  - salesID=NULL (tạo trực tiếp)
```

---

## 💼 USE CASES THỰC TẾ

### **1. TÍNH COMMISSION CHO SALE**

```typescript
// API: GET /api/reports/sales-commission?month=1&year=2026

interface SalesCommissionReport {
  salesID: number;
  salesName: string;
  totalInvoices: number;
  totalAmount: number;      // Tổng doanh số
  commissionRate: number;   // 2%
  commission: number;       // Hoa hồng
}

// Query:
const report = await db.query(`
  SELECT 
    i.salesID,
    u.userName as salesName,
    COUNT(*) as totalInvoices,
    SUM(i.totalAmount) as totalAmount,
    SUM(i.totalAmount) * 0.02 as commission
  FROM invoices i
  JOIN users u ON i.salesID = u.userID
  WHERE i.salesID IS NOT NULL
    AND MONTH(i.createdAt) = 1
    AND YEAR(i.createdAt) = 2026
  GROUP BY i.salesID, u.userName
`);

// Result:
// salesID | salesName    | totalInvoices | totalAmount | commission
// 5       | Nguyễn Văn A | 10            | 500,000,000 | 10,000,000
// 7       | Lê Thị C     | 8             | 300,000,000 | 6,000,000
```

### **2. AUDIT TRAIL - AI TẠO INVOICE NÀY?**

```typescript
// API: GET /api/invoices/206/audit

interface InvoiceAudit {
  invoiceID: number;
  createdBy: {
    userID: number;
    userName: string;
    role: string;
  };
  createdAt: string;
  salesInfo?: {
    salesID: number;
    salesName: string;
  };
  requestInfo?: {
    requestID: number;
    requestCode: string;
  };
}

// Query:
const audit = await db.query(`
  SELECT 
    i.invoiceID,
    i.performedBy,
    u1.userName as createdByName,
    u1.role as createdByRole,
    i.createdAt,
    i.salesID,
    u2.userName as salesName,
    i.requestID,
    r.requestCode
  FROM invoices i
  JOIN users u1 ON i.performedBy = u1.userID
  LEFT JOIN users u2 ON i.salesID = u2.userID
  LEFT JOIN invoice_requests r ON i.requestID = r.requestID
  WHERE i.invoiceID = 206
`);

// Result:
{
  invoiceID: 206,
  createdBy: {
    userID: 10,
    userName: "Trần Thị B",
    role: "Accountant"
  },
  createdAt: "2026-01-19T12:49:04Z",
  salesInfo: {
    salesID: 5,
    salesName: "Nguyễn Văn A"
  },
  requestInfo: {
    requestID: 123,
    requestCode: "REQ-2026-00123"
  }
}
```

### **3. SALES DASHBOARD - INVOICES CỦA TÔI**

```typescript
// Sale login (ID=5) → Xem dashboard riêng

// API: GET /api/sales/my-invoices?salesID=5

const myInvoices = await db.query(`
  SELECT 
    i.invoiceID,
    i.invoiceNumber,
    i.customerName,
    i.totalAmount,
    i.createdAt,
    i.statusID,
    u.userName as createdByAccountant
  FROM invoices i
  JOIN users u ON i.performedBy = u.userID
  WHERE i.salesID = 5
  ORDER BY i.createdAt DESC
`);

// Result: Chỉ thấy invoices từ requests của mình
// invoiceID | invoiceNumber | customerName | totalAmount | createdByAccountant
// 206       | 55            | Công ty ABC  | 100,000,000 | Trần Thị B
// 205       | 54            | Công ty XYZ  | 80,000,000  | Nguyễn Văn D
```

### **4. PERMISSION CHECK - AI CÓ QUYỀN EDIT?**

```typescript
// Business rule: Chỉ người tạo mới edit/delete được (nếu chưa phát hành)

async function canEditInvoice(invoiceID: number, currentUserID: number): Promise<boolean> {
  const invoice = await db.query(`
    SELECT performedBy, statusID
    FROM invoices 
    WHERE invoiceID = ?
  `, [invoiceID]);
  
  // Chỉ edit được nếu:
  // 1. Là người tạo (performedBy)
  // 2. Invoice chưa phát hành (statusID = 1 - Draft)
  return invoice.performedBy === currentUserID && invoice.statusID === 1;
}

// VD: User #10 muốn edit Invoice #206
const canEdit = await canEditInvoice(206, 10);
// Result: true (vì performedBy=10 và có thể statusID=1)
```

### **5. MANAGER REPORT - ACCOUNTANT NÀO LÀM VIỆC NHIỀU NHẤT?**

```typescript
// API: GET /api/reports/accountant-productivity?month=1&year=2026

const report = await db.query(`
  SELECT 
    i.performedBy,
    u.userName,
    COUNT(*) as totalInvoices,
    SUM(CASE WHEN i.salesID IS NOT NULL THEN 1 ELSE 0 END) as fromRequests,
    SUM(CASE WHEN i.salesID IS NULL THEN 1 ELSE 0 END) as directCreated,
    SUM(i.totalAmount) as totalAmount
  FROM invoices i
  JOIN users u ON i.performedBy = u.userID
  WHERE MONTH(i.createdAt) = 1
    AND YEAR(i.createdAt) = 2026
  GROUP BY i.performedBy, u.userName
  ORDER BY totalInvoices DESC
`);

// Result:
// performedBy | userName    | totalInvoices | fromRequests | directCreated | totalAmount
// 10          | Trần Thị B  | 50            | 35           | 15            | 2,500,000,000
// 11          | Nguyễn Văn D| 40            | 30           | 10            | 2,000,000,000
```

---

## 🔐 PHÂN QUYỀN & BẢO MẬT

### **Role-based Access:**

```typescript
// 1. SALE - Chỉ xem invoices của mình (salesID)
if (userRole === 'Sale') {
  query = `SELECT * FROM invoices WHERE salesID = ${currentUserID}`;
}

// 2. ACCOUNTANT - Xem invoices mình tạo (performedBy) hoặc tất cả
if (userRole === 'Accountant') {
  query = `SELECT * FROM invoices WHERE performedBy = ${currentUserID} OR 1=1`;
}

// 3. ADMIN - Xem tất cả
if (userRole === 'Admin') {
  query = `SELECT * FROM invoices`;
}
```

### **Edit Permission:**

```typescript
function canEdit(invoice: Invoice, user: User): boolean {
  // Rule 1: Chỉ người tạo (performedBy) mới edit được
  if (invoice.performedBy !== user.userID) {
    return false;
  }
  
  // Rule 2: Chỉ edit được khi còn Draft
  if (invoice.statusID !== 1) {
    return false;
  }
  
  return true;
}
```

---

## 🎯 TÓM LẠI

### **Khi nào dùng `salesID`?**
- ✅ Tính commission cho Sale
- ✅ Báo cáo sales performance
- ✅ Filter invoices by Sale
- ✅ Sales dashboard riêng
- ✅ CRM integration

### **Khi nào dùng `performedBy`?**
- ✅ Audit trail (ai tạo/sửa)
- ✅ Permission check (quyền edit/delete)
- ✅ Accountability (trách nhiệm pháp lý)
- ✅ User activity tracking
- ✅ Legal compliance

### **Tại sao cần CẢ HAI?**
- **Business need:** Commission, sales tracking → `salesID`
- **Legal/System need:** Audit, compliance → `performedBy`
- **Không trùng lặp:** Sale ≠ Accountant trong hầu hết cases

---

## ✅ VALIDATION RULES

```typescript
// Backend validation
interface InvoiceCreateRequest {
  performedBy: number;     // ✅ REQUIRED
  salesID?: number;        // ✅ OPTIONAL
  requestID?: number;      // ✅ OPTIONAL
}

// Rule 1: performedBy PHẢI TỒN TẠI
if (!performedBy || performedBy <= 0) {
  throw new Error('performedBy is required');
}

// Rule 2: Nếu có requestID, PHẢI có salesID
if (requestID && !salesID) {
  throw new Error('salesID required when creating from request');
}

// Rule 3: Nếu có salesID, PHẢI có requestID
if (salesID && !requestID) {
  throw new Error('requestID required when salesID is provided');
}

// Rule 4: salesID PHẢI là role Sale
if (salesID) {
  const user = await getUserById(salesID);
  if (user.role !== 'Sale') {
    throw new Error('salesID must be a Sale user');
  }
}

// Rule 5: performedBy PHẢI là Accountant/Admin
const performer = await getUserById(performedBy);
if (!['Accountant', 'Admin'].includes(performer.role)) {
  throw new Error('Only Accountant/Admin can create invoices');
}
```

---

**Kết luận:** `salesID` và `performedBy` phục vụ 2 mục đích khác nhau nhưng bổ sung cho nhau - một cho business, một cho system/legal. ✅
