# 📋 BACKEND API REQUIREMENTS - BẢNG KÊ (STATEMENT)

**Document Version:** 1.0  
**Date:** 16/01/2026  
**Author:** Frontend Team  
**For:** Backend Development Team

---

## 📑 MỤC LỤC

1. [Tổng quan chức năng](#1-tổng-quan-chức-năng)
2. [Data Structure](#2-data-structure)
3. [API Endpoints](#3-api-endpoints)
4. [Request/Response Schema](#4-requestresponse-schema)
5. [Business Logic](#5-business-logic)
6. [Validation Rules](#6-validation-rules)
7. [Error Handling](#7-error-handling)

---

## 1. TỔNG QUAN CHỨC NĂNG

### 1.1. Mô tả
**Bảng kê công nợ** là chức năng tạo báo cáo chi tiết về hàng hóa/dịch vụ đã cung cấp cho khách hàng trong một kỳ (tháng/năm), bao gồm:
- Thông tin khách hàng
- Kỳ báo cáo (tháng/năm)
- Nợ kỳ trước chưa thanh toán
- Danh sách hàng hóa/dịch vụ (items)
- Tính toán tự động: Tổng tiền hàng, VAT, tổng thanh toán

### 1.2. User Flow
```
1. User chọn Khách hàng (Autocomplete)
2. Chọn Tháng/Năm (Month/Year Picker)
3. Nhập/Auto-fetch Nợ kỳ trước
4. Nhập danh sách items (Manual hoặc Import Excel)
5. System tự động tính: Amount = Quantity × UnitPrice, Total VAT, Grand Total
6. Lưu nháp HOẶC Lưu & Kết xuất hóa đơn
```

### 1.3. Key Features
- ✅ **Auto Fetch Debt:** Tự động lấy nợ kỳ trước từ hóa đơn chưa thanh toán
- ✅ **Excel Import:** Import danh sách items từ file Excel
- ✅ **Real-time Calculation:** Tính toán tự động Amount, VAT, Grand Total
- ✅ **VAT Rate Validation:** Chỉ chấp nhận 0%, 5%, 8%, 10%
- ✅ **Draft Mode:** Lưu dạng nháp để sửa sau

---

## 2. DATA STRUCTURE

### 2.1. Frontend Interfaces

```typescript
// ==================== CUSTOMER ====================
interface Customer {
  id: number
  name: string          // Tên khách hàng
  taxCode: string       // Mã số thuế
  address: string       // Địa chỉ
  email: string         // Email
  phone: string         // Số điện thoại
}

// ==================== STATEMENT ITEM ====================
interface StatementItem {
  id: number            // Unique ID (frontend generated hoặc backend trả về)
  stt: number           // Số thứ tự (1, 2, 3...)
  itemName: string      // Tên hàng hóa/dịch vụ
  unit: string          // Đơn vị tính (Cái, Kg, m2, Giờ, etc.)
  quantity: number      // Số lượng
  unitPrice: number     // Đơn giá (VND)
  amount: number        // Thành tiền = quantity × unitPrice (auto calculated)
  vatRate: number       // Thuế suất GTGT (0, 5, 8, 10) - chỉ chấp nhận 4 giá trị này
  note: string          // Ghi chú
}

// ==================== STATEMENT FORM ====================
interface StatementForm {
  customerId: number | null      // ID khách hàng
  period: string                 // Kỳ cước (format: "YYYY-MM")
  previousDebt: number           // Nợ kỳ trước (VND)
  items: StatementItem[]         // Danh sách hàng hóa/dịch vụ
}

// ==================== CALCULATIONS (Frontend) ====================
interface StatementCalculations {
  totalGoods: number             // Tổng tiền hàng = sum(items.amount)
  totalVAT: number              // Tổng thuế VAT = sum(items.amount × items.vatRate / 100)
  grandTotal: number            // Tổng thanh toán = totalGoods + totalVAT + previousDebt
}
```

---

## 3. API ENDPOINTS

### 3.1. API Tối Thiểu (Must Have)

```
1️⃣ GET    /api/customers/search              - Tìm kiếm khách hàng (Autocomplete)
2️⃣ GET    /api/statements/customer/{id}/debt - Lấy nợ kỳ trước của khách hàng
3️⃣ POST   /api/statements/draft              - Lưu bảng kê dạng nháp
4️⃣ POST   /api/statements/publish            - Lưu & Kết xuất hóa đơn
5️⃣ GET    /api/statements/{id}               - Lấy chi tiết bảng kê (Edit mode)
6️⃣ PUT    /api/statements/{id}               - Cập nhật bảng kê
```

### 3.2. API Nâng Cao (Nice to Have)

```
7️⃣ POST   /api/statements/validate-excel     - Validate file Excel trước khi import
8️⃣ GET    /api/statements/template           - Download Excel template
9️⃣ GET    /api/statements                    - List bảng kê với phân trang
```

---

## 4. REQUEST/RESPONSE SCHEMA

### 4.1. 🔍 GET /api/customers/search

**Mục đích:** Tìm kiếm khách hàng cho Autocomplete  
**Method:** GET  
**Query Params:**
```typescript
{
  q: string        // Search query (name, taxCode, email, phone)
  limit?: number   // Default: 20
}
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Công ty TNHH Công nghệ ABC",
      "taxCode": "0123456789",
      "address": "123 Đường Láng, Đống Đa, Hà Nội",
      "email": "abc@company.com",
      "phone": "024 1234 5678"
    },
    {
      "id": 2,
      "name": "Công ty CP Viễn thông XYZ",
      "taxCode": "0987654321",
      "address": "456 Nguyễn Huệ, Quận 1, TP.HCM",
      "email": "xyz@company.com",
      "phone": "028 9876 5432"
    }
  ]
}
```

**Note:**
- Search theo: `name`, `taxCode`, `email`, `phone`
- Case-insensitive
- Return top 20 kết quả

---

### 4.2. 💰 GET /api/statements/customer/{customerId}/debt

**Mục đích:** Lấy tổng nợ kỳ trước của khách hàng (Auto Fetch Debt)  
**Method:** GET  
**Path Params:**
```typescript
{
  customerId: number   // ID khách hàng
}
```

**Query Params (Optional):**
```typescript
{
  beforePeriod?: string   // Format: "YYYY-MM" - Lấy nợ trước kỳ này (default: tháng hiện tại)
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "customerId": 1,
    "customerName": "Công ty TNHH Công nghệ ABC",
    "previousDebt": 15000000,
    "calculatedAt": "2026-01-16T10:30:00Z",
    "details": {
      "unpaidInvoicesCount": 3,
      "oldestInvoiceDate": "2025-11-15",
      "breakdown": [
        {
          "invoiceId": 145,
          "invoiceNumber": "INV-2025-145",
          "issueDate": "2025-11-15",
          "dueDate": "2025-12-15",
          "totalAmount": 5000000,
          "paidAmount": 0,
          "remainingAmount": 5000000
        },
        {
          "invoiceId": 158,
          "invoiceNumber": "INV-2025-158",
          "issueDate": "2025-12-10",
          "dueDate": "2026-01-10",
          "totalAmount": 8000000,
          "paidAmount": 0,
          "remainingAmount": 8000000
        },
        {
          "invoiceId": 162,
          "invoiceNumber": "INV-2025-162",
          "issueDate": "2025-12-20",
          "dueDate": "2026-01-20",
          "totalAmount": 3000000,
          "paidAmount": 1000000,
          "remainingAmount": 2000000
        }
      ]
    }
  }
}
```

**Business Logic:**
```sql
-- Tính nợ kỳ trước:
SELECT SUM(totalAmount - paidAmount) as previousDebt
FROM Invoices
WHERE customerId = :customerId
  AND status IN ('UNPAID', 'PARTIALLY_PAID')
  AND issueDate < :beforePeriod
  AND isDeleted = false
```

**Response 404:**
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Không tìm thấy khách hàng"
  }
}
```

---

### 4.3. 💾 POST /api/statements/draft

**Mục đích:** Lưu bảng kê dạng nháp (Draft)  
**Method:** POST  
**Content-Type:** application/json

**Request Body:**
```json
{
  "customerId": 1,
  "period": "2026-01",
  "previousDebt": 15000000,
  "items": [
    {
      "stt": 1,
      "itemName": "Dịch vụ thiết kế website",
      "unit": "Gói",
      "quantity": 1,
      "unitPrice": 20000000,
      "amount": 20000000,
      "vatRate": 10,
      "note": "Gói Premium"
    },
    {
      "stt": 2,
      "itemName": "Hosting VPS 12 tháng",
      "unit": "Năm",
      "quantity": 1,
      "unitPrice": 5000000,
      "amount": 5000000,
      "vatRate": 10,
      "note": ""
    },
    {
      "stt": 3,
      "itemName": "Domain .com.vn",
      "unit": "Domain",
      "quantity": 2,
      "unitPrice": 500000,
      "amount": 1000000,
      "vatRate": 10,
      "note": "abc.com.vn, xyz.com.vn"
    }
  ]
}
```

**Request Schema:**
```typescript
interface CreateStatementDraftRequest {
  customerId: number              // Required
  period: string                  // Required, Format: "YYYY-MM"
  previousDebt: number            // Required, >= 0
  items: StatementItemRequest[]   // Required, min 1 item
}

interface StatementItemRequest {
  stt: number                     // Số thứ tự (1, 2, 3...)
  itemName: string                // Required, max 500 chars
  unit: string                    // Required, max 50 chars
  quantity: number                // Required, > 0
  unitPrice: number               // Required, >= 0
  amount: number                  // Auto calculated = quantity × unitPrice
  vatRate: number                 // Required, only [0, 5, 8, 10]
  note: string                    // Optional, max 1000 chars
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "statementId": 45,
    "statementNumber": "BK-2026-001-045",
    "status": "DRAFT",
    "customerId": 1,
    "customerName": "Công ty TNHH Công nghệ ABC",
    "period": "2026-01",
    "previousDebt": 15000000,
    "totalGoods": 26000000,
    "totalVAT": 2600000,
    "grandTotal": 43600000,
    "itemsCount": 3,
    "createdAt": "2026-01-16T10:30:00Z",
    "createdBy": {
      "userId": 5,
      "username": "admin",
      "fullName": "Nguyễn Văn A"
    }
  }
}
```

**Response 400 (Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "items[0].vatRate",
        "message": "Thuế suất chỉ được phép là 0%, 5%, 8%, hoặc 10%",
        "value": 12
      },
      {
        "field": "items[1].quantity",
        "message": "Số lượng phải lớn hơn 0",
        "value": 0
      }
    ]
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Không tìm thấy khách hàng với ID = 999"
  }
}
```

---

### 4.4. 📤 POST /api/statements/publish

**Mục đích:** Lưu bảng kê và tự động tạo hóa đơn  
**Method:** POST  
**Content-Type:** application/json

**Request Body:** (Giống POST /api/statements/draft)
```json
{
  "customerId": 1,
  "period": "2026-01",
  "previousDebt": 15000000,
  "items": [...]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "statementId": 46,
    "statementNumber": "BK-2026-001-046",
    "status": "PUBLISHED",
    "customerId": 1,
    "customerName": "Công ty TNHH Công nghệ ABC",
    "period": "2026-01",
    "previousDebt": 15000000,
    "totalGoods": 26000000,
    "totalVAT": 2600000,
    "grandTotal": 43600000,
    "itemsCount": 3,
    "createdAt": "2026-01-16T10:30:00Z",
    "createdBy": {
      "userId": 5,
      "username": "admin",
      "fullName": "Nguyễn Văn A"
    },
    "invoice": {
      "invoiceId": 289,
      "invoiceNumber": "INV-2026-289",
      "invoiceSerial": "1C26TAA",
      "status": "ISSUED",
      "totalAmount": 43600000,
      "issueDate": "2026-01-16T10:30:00Z",
      "dueDate": "2026-02-16T10:30:00Z"
    }
  }
}
```

**Business Logic:**
```typescript
// Backend phải thực hiện:
1. Validate dữ liệu (giống draft)
2. Tạo Statement với status = "PUBLISHED"
3. Tự động tạo Invoice từ Statement:
   - InvoiceItems = StatementItems
   - TotalAmount = Statement.grandTotal
   - Customer = Statement.customer
   - IssueDate = now()
   - DueDate = now() + 30 days (hoặc theo config)
   - Status = "ISSUED" (đã phát hành)
4. Link Statement ↔ Invoice (statementId, invoiceId)
5. Return cả Statement + Invoice info
```

---

### 4.5. 🔍 GET /api/statements/{id}

**Mục đích:** Lấy chi tiết bảng kê (Edit mode)  
**Method:** GET  
**Path Params:**
```typescript
{
  id: number   // Statement ID
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "statementNumber": "BK-2026-001-045",
    "status": "DRAFT",
    "customer": {
      "id": 1,
      "name": "Công ty TNHH Công nghệ ABC",
      "taxCode": "0123456789",
      "address": "123 Đường Láng, Đống Đa, Hà Nội",
      "email": "abc@company.com",
      "phone": "024 1234 5678"
    },
    "period": "2026-01",
    "previousDebt": 15000000,
    "items": [
      {
        "id": 101,
        "stt": 1,
        "itemName": "Dịch vụ thiết kế website",
        "unit": "Gói",
        "quantity": 1,
        "unitPrice": 20000000,
        "amount": 20000000,
        "vatRate": 10,
        "note": "Gói Premium"
      },
      {
        "id": 102,
        "stt": 2,
        "itemName": "Hosting VPS 12 tháng",
        "unit": "Năm",
        "quantity": 1,
        "unitPrice": 5000000,
        "amount": 5000000,
        "vatRate": 10,
        "note": ""
      }
    ],
    "totalGoods": 25000000,
    "totalVAT": 2500000,
    "grandTotal": 42500000,
    "createdAt": "2026-01-16T10:30:00Z",
    "updatedAt": "2026-01-16T10:30:00Z",
    "createdBy": {
      "userId": 5,
      "username": "admin",
      "fullName": "Nguyễn Văn A"
    },
    "invoice": null
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": {
    "code": "STATEMENT_NOT_FOUND",
    "message": "Không tìm thấy bảng kê"
  }
}
```

---

### 4.6. ✏️ PUT /api/statements/{id}

**Mục đích:** Cập nhật bảng kê (chỉ DRAFT)  
**Method:** PUT  
**Path Params:**
```typescript
{
  id: number   // Statement ID
}
```

**Request Body:** (Giống POST draft)
```json
{
  "customerId": 1,
  "period": "2026-01",
  "previousDebt": 15000000,
  "items": [...]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "statementId": 45,
    "statementNumber": "BK-2026-001-045",
    "status": "DRAFT",
    "updatedAt": "2026-01-16T11:00:00Z",
    "message": "Đã cập nhật bảng kê thành công"
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_EDIT_PUBLISHED",
    "message": "Không thể sửa bảng kê đã phát hành"
  }
}
```

---

## 5. BUSINESS LOGIC

### 5.1. Statement Status Flow

```
┌──────────┐    Lưu nháp    ┌──────────┐
│          │ ─────────────> │  DRAFT   │
│   NEW    │                └──────────┘
│          │                      │
└──────────┘                      │ Lưu & Kết xuất
                                  ▼
                            ┌──────────┐    Tạo Invoice    ┌──────────┐
                            │ PUBLISHED│ ─────────────────> │ INVOICE  │
                            └──────────┘                    │  ISSUED  │
                                                            └──────────┘
```

**Status:**
- `DRAFT`: Nháp, có thể sửa
- `PUBLISHED`: Đã phát hành, đã tạo hóa đơn, không thể sửa

### 5.2. Calculation Rules

**Frontend tự tính (real-time):**
```typescript
// Thành tiền từng item
amount = quantity × unitPrice

// Tổng tiền hàng
totalGoods = sum(items.amount)

// Tổng VAT
totalVAT = sum(items.amount × items.vatRate / 100)

// Tổng thanh toán
grandTotal = totalGoods + totalVAT + previousDebt
```

**Backend phải validate lại:**
```typescript
// Validate mỗi item
for (item in items) {
  if (item.amount !== item.quantity * item.unitPrice) {
    throw ValidationError("Item amount calculation mismatch")
  }
}

// Recalculate totals
const calculatedTotalGoods = items.reduce((sum, item) => sum + item.amount, 0)
const calculatedTotalVAT = items.reduce((sum, item) => sum + (item.amount * item.vatRate / 100), 0)
const calculatedGrandTotal = calculatedTotalGoods + calculatedTotalVAT + previousDebt

// Compare with frontend (optional)
if (Math.abs(calculatedGrandTotal - request.grandTotal) > 1) {
  throw ValidationError("Total calculation mismatch")
}
```

### 5.3. Auto Create Invoice Logic

**Khi POST /api/statements/publish:**

```typescript
async function publishStatement(statementData) {
  // 1. Create Statement
  const statement = await db.statements.create({
    customerId: statementData.customerId,
    period: statementData.period,
    previousDebt: statementData.previousDebt,
    status: 'PUBLISHED',
    totalGoods: calculatedTotalGoods,
    totalVAT: calculatedTotalVAT,
    grandTotal: calculatedGrandTotal,
  })

  // 2. Create Statement Items
  for (const item of statementData.items) {
    await db.statementItems.create({
      statementId: statement.id,
      stt: item.stt,
      itemName: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      vatRate: item.vatRate,
      note: item.note,
    })
  }

  // 3. Auto Create Invoice
  const invoice = await db.invoices.create({
    customerId: statement.customerId,
    statementId: statement.id,
    invoiceNumber: generateInvoiceNumber(), // "INV-2026-289"
    invoiceSerial: getCompanyInvoiceSerial(), // "1C26TAA"
    issueDate: new Date(),
    dueDate: addDays(new Date(), 30),
    status: 'ISSUED',
    subtotal: statement.totalGoods,
    vatAmount: statement.totalVAT,
    totalAmount: statement.grandTotal,
  })

  // 4. Create Invoice Items (from Statement Items)
  for (const item of statementData.items) {
    await db.invoiceItems.create({
      invoiceId: invoice.id,
      description: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      vatRate: item.vatRate,
    })
  }

  // 5. Update Statement with Invoice ID
  await db.statements.update(statement.id, {
    invoiceId: invoice.id,
  })

  return { statement, invoice }
}
```

---

## 6. VALIDATION RULES

### 6.1. Customer
```typescript
✅ customerId: Required, must exist in Customers table
✅ Customer must be active (status != 'DELETED' || 'INACTIVE')
```

### 6.2. Period
```typescript
✅ period: Required
✅ Format: "YYYY-MM" (e.g., "2026-01")
✅ Must be valid month (01-12)
✅ Must be valid year (2020-2050)
❌ Cannot create statement for future months (> current month)
```

### 6.3. Previous Debt
```typescript
✅ previousDebt: Required
✅ Type: number (decimal)
✅ Range: >= 0 (không được âm)
✅ Max: 9,999,999,999 VND (< 10 tỷ)
```

### 6.4. Items Array
```typescript
✅ items: Required
✅ minItems: 1
✅ maxItems: 100 (tối đa 100 dòng)
```

### 6.5. Item Fields

| Field      | Type   | Required | Rules                                          |
|------------|--------|----------|------------------------------------------------|
| stt        | number | Yes      | > 0, must be unique in items array             |
| itemName   | string | Yes      | min: 1, max: 500 chars, not empty              |
| unit       | string | Yes      | min: 1, max: 50 chars, default: "Cái"          |
| quantity   | number | Yes      | > 0, max: 999,999                              |
| unitPrice  | number | Yes      | >= 0, max: 9,999,999,999                       |
| amount     | number | Yes      | = quantity × unitPrice                         |
| vatRate    | number | Yes      | **ONLY [0, 5, 8, 10]** - strict validation     |
| note       | string | No       | max: 1000 chars                                |

### 6.6. VAT Rate (CRITICAL)

```typescript
// Frontend validation
const VALID_VAT_RATES = [0, 5, 8, 10]

function normalizeVatRate(rate: number): number {
  // Auto normalize to closest valid rate
  const closest = VALID_VAT_RATES.reduce((prev, curr) => 
    Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
  )
  return closest
}

// Backend validation
if (![0, 5, 8, 10].includes(item.vatRate)) {
  throw new ValidationError(
    `vatRate must be 0, 5, 8, or 10. Got: ${item.vatRate}`
  )
}
```

---

## 7. ERROR HANDLING

### 7.1. Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string          // Error code (SCREAMING_SNAKE_CASE)
    message: string       // Human-readable message (Vietnamese)
    details?: any         // Additional error details (validation errors, etc.)
  }
}
```

### 7.2. Error Codes

| HTTP | Error Code              | Message                                    | When                                   |
|------|-------------------------|--------------------------------------------|----------------------------------------|
| 400  | VALIDATION_ERROR        | Dữ liệu không hợp lệ                       | Request body validation failed         |
| 400  | INVALID_VAT_RATE        | Thuế suất chỉ được phép 0%, 5%, 8%, 10%   | vatRate not in [0, 5, 8, 10]           |
| 400  | INVALID_PERIOD_FORMAT   | Định dạng kỳ không hợp lệ (YYYY-MM)       | Period format incorrect                |
| 400  | FUTURE_PERIOD           | Không thể tạo bảng kê cho tháng tương lai | Period > current month                 |
| 400  | CANNOT_EDIT_PUBLISHED   | Không thể sửa bảng kê đã phát hành         | Try to update PUBLISHED statement      |
| 400  | DUPLICATE_STATEMENT     | Đã tồn tại bảng kê cho khách hàng này      | Customer + Period already exists       |
| 400  | AMOUNT_MISMATCH         | Tính toán thành tiền không khớp            | item.amount != quantity × unitPrice    |
| 401  | UNAUTHORIZED            | Chưa đăng nhập                             | No auth token                          |
| 403  | FORBIDDEN               | Không có quyền truy cập                    | User lacks permission                  |
| 404  | CUSTOMER_NOT_FOUND      | Không tìm thấy khách hàng                  | Customer ID not found                  |
| 404  | STATEMENT_NOT_FOUND     | Không tìm thấy bảng kê                     | Statement ID not found                 |
| 500  | INTERNAL_SERVER_ERROR   | Lỗi hệ thống                               | Unexpected server error                |

### 7.3. Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "items[0].itemName",
        "message": "Tên hàng hóa không được để trống",
        "value": ""
      },
      {
        "field": "items[1].vatRate",
        "message": "Thuế suất chỉ được phép là 0%, 5%, 8%, hoặc 10%",
        "value": 12
      },
      {
        "field": "items[2].quantity",
        "message": "Số lượng phải lớn hơn 0",
        "value": -5
      },
      {
        "field": "period",
        "message": "Không thể tạo bảng kê cho tháng tương lai",
        "value": "2027-12"
      }
    ]
  }
}
```

---

## 8. DATABASE SCHEMA SUGGESTION

### 8.1. Table: statements

```sql
CREATE TABLE statements (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  statement_number    VARCHAR(50) UNIQUE NOT NULL,      -- "BK-2026-001-045"
  customer_id         INT NOT NULL,
  period              VARCHAR(7) NOT NULL,              -- "2026-01"
  previous_debt       DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_goods         DECIMAL(15, 2) NOT NULL,
  total_vat           DECIMAL(15, 2) NOT NULL,
  grand_total         DECIMAL(15, 2) NOT NULL,
  status              ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  invoice_id          INT NULL,                         -- Link to invoices table
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by          INT NOT NULL,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  INDEX idx_customer_period (customer_id, period),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### 8.2. Table: statement_items

```sql
CREATE TABLE statement_items (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  statement_id    INT NOT NULL,
  stt             INT NOT NULL,                    -- Số thứ tự (1, 2, 3...)
  item_name       VARCHAR(500) NOT NULL,
  unit            VARCHAR(50) NOT NULL DEFAULT 'Cái',
  quantity        DECIMAL(10, 2) NOT NULL,
  unit_price      DECIMAL(15, 2) NOT NULL,
  amount          DECIMAL(15, 2) NOT NULL,         -- = quantity × unit_price
  vat_rate        DECIMAL(5, 2) NOT NULL,          -- 0.00, 5.00, 8.00, 10.00
  note            VARCHAR(1000) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE,
  
  INDEX idx_statement (statement_id),
  CONSTRAINT chk_vat_rate CHECK (vat_rate IN (0, 5, 8, 10))
);
```

### 8.3. Indexes

```sql
-- Optimize search customer by name, taxCode
CREATE INDEX idx_customers_search ON customers(name, tax_code, email);

-- Optimize debt calculation
CREATE INDEX idx_invoices_debt ON invoices(customer_id, status, issue_date);

-- Optimize statement listing
CREATE INDEX idx_statements_list ON statements(status, created_at DESC);
```

---

## 9. EXCEL IMPORT SPECIFICATION

### 9.1. Excel Template Format

**Columns (Cột):**

| A              | B   | C        | D       | E             | F      |
|----------------|-----|----------|---------|---------------|--------|
| Tên hàng hóa   | ĐVT | Số lượng | Đơn giá | Thuế suất (%) | Ghi chú|

**Example:**

| A                          | B   | C   | D         | E   | F           |
|----------------------------|-----|-----|-----------|-----|-------------|
| Dịch vụ thiết kế website   | Gói | 1   | 20000000  | 10  | Gói Premium |
| Hosting VPS 12 tháng       | Năm | 1   | 5000000   | 10  |             |
| Domain .com.vn             | Domain | 2 | 500000  | 10  | abc, xyz    |

### 9.2. Frontend Excel Import Logic

```typescript
async function handleFileUpload(file: File) {
  // 1. Read Excel file
  const XLSX = await import('xlsx')
  const data = new Uint8Array(await file.arrayBuffer())
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
  
  // 2. Skip header row (index 0)
  const rows = jsonData.slice(1)
  
  // 3. Parse each row
  const items = rows
    .filter(row => row[0]) // Chỉ lấy row có tên hàng hóa
    .map((row, idx) => {
      const quantity = parseNumber(row[2] || 1)
      const unitPrice = parseNumber(row[3] || 0)
      const vatRate = normalizeVatRate(parseNumber(row[4] || 10))
      
      return {
        id: Date.now() + idx,
        stt: idx + 1,
        itemName: String(row[0] || '').trim(),
        unit: String(row[1] || 'Cái').trim(),
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
        vatRate,
        note: String(row[5] || '').trim(),
      }
    })
  
  // 4. Validate
  if (items.length === 0) {
    throw new Error('Không tìm thấy dữ liệu hợp lệ trong file Excel')
  }
  
  // 5. Replace current items
  setFormData(prev => ({ ...prev, items }))
}
```

### 9.3. Backend Validation (Optional)

**API:** `POST /api/statements/validate-excel`

**Request:**
```typescript
// Multipart form-data
{
  file: File   // Excel file (.xlsx, .xls)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validRows": 15,
    "invalidRows": 2,
    "errors": [
      {
        "row": 3,
        "field": "vatRate",
        "message": "Thuế suất không hợp lệ: 15%",
        "value": 15
      },
      {
        "row": 7,
        "field": "quantity",
        "message": "Số lượng phải lớn hơn 0",
        "value": -2
      }
    ],
    "preview": [
      {
        "stt": 1,
        "itemName": "Dịch vụ thiết kế website",
        "unit": "Gói",
        "quantity": 1,
        "unitPrice": 20000000,
        "amount": 20000000,
        "vatRate": 10
      }
    ]
  }
}
```

---

## 10. TESTING CHECKLIST

### 10.1. API Testing

**GET /api/customers/search:**
- ✅ Search by name (case-insensitive)
- ✅ Search by taxCode
- ✅ Empty query returns top 20
- ✅ No results returns empty array

**GET /api/statements/customer/{id}/debt:**
- ✅ Correct debt calculation
- ✅ Filter by period correctly
- ✅ Customer not found returns 404
- ✅ No unpaid invoices returns 0

**POST /api/statements/draft:**
- ✅ Valid data creates draft successfully
- ✅ Invalid customerId returns 404
- ✅ Invalid vatRate returns 400
- ✅ Empty items returns 400
- ✅ Future period returns 400
- ✅ Amount mismatch returns 400

**POST /api/statements/publish:**
- ✅ Creates statement + invoice
- ✅ Invoice linked to statement
- ✅ Invoice items match statement items
- ✅ Invoice totalAmount = statement.grandTotal

**PUT /api/statements/{id}:**
- ✅ Can update DRAFT statement
- ✅ Cannot update PUBLISHED statement
- ✅ Statement not found returns 404

### 10.2. Edge Cases

- ✅ Zero quantity (should fail)
- ✅ Negative unitPrice (should fail)
- ✅ Invalid VAT rate (12%, 15%) → should reject
- ✅ Very large numbers (> 10 billion VND)
- ✅ Unicode characters in itemName (Tiếng Việt có dấu)
- ✅ Special characters in note field
- ✅ Empty string vs null handling
- ✅ Duplicate period for same customer

---

## 11. PERFORMANCE REQUIREMENTS

### 11.1. Response Time

| API Endpoint                       | Expected Response Time |
|------------------------------------|------------------------|
| GET /api/customers/search          | < 200ms                |
| GET /api/statements/customer/debt  | < 500ms                |
| POST /api/statements/draft         | < 1s                   |
| POST /api/statements/publish       | < 2s                   |
| GET /api/statements/{id}           | < 300ms                |
| PUT /api/statements/{id}           | < 1s                   |

### 11.2. Scalability

- **Max items per statement:** 100 items
- **Max concurrent users:** 100 users
- **Max file size (Excel):** 5MB
- **Database query optimization:** Use indexes, avoid N+1 queries

---

## 12. SECURITY REQUIREMENTS

### 12.1. Authentication
- ✅ All APIs require JWT token
- ✅ Token in header: `Authorization: Bearer {token}`

### 12.2. Authorization
- ✅ User can only view/edit their own statements
- ✅ Admin can view/edit all statements
- ✅ Check permission before Create/Update/Delete

### 12.3. Input Sanitization
- ✅ Escape HTML in itemName, note fields
- ✅ Prevent SQL injection
- ✅ Prevent XSS attacks
- ✅ Validate all numeric fields

### 12.4. Rate Limiting
- ✅ Max 100 requests per minute per user
- ✅ Max 10 POST requests per minute per user

---

## 13. PRIORITY & TIMELINE

### Phase 1: MVP (Week 1-2) ✅ Must Have
1. ✅ GET /api/customers/search
2. ✅ GET /api/statements/customer/{id}/debt
3. ✅ POST /api/statements/draft
4. ✅ GET /api/statements/{id}
5. ✅ PUT /api/statements/{id}

### Phase 2: Auto Invoice (Week 3) ✅ Must Have
6. ✅ POST /api/statements/publish
7. ✅ Auto create invoice logic
8. ✅ Link statement ↔ invoice

### Phase 3: List & Filter (Week 4) 🔶 Should Have
9. 🔶 GET /api/statements (list with pagination)
10. 🔶 Filter by customer, period, status

### Phase 4: Advanced (Future) ⚪ Nice to Have
11. ⚪ POST /api/statements/validate-excel
12. ⚪ GET /api/statements/template (download Excel template)
13. ⚪ DELETE /api/statements/{id} (soft delete)

---

## 14. CONTACT & SUPPORT

**Frontend Team:**
- Lead: [Your Name]
- Email: [your-email@company.com]

**Questions?**
- Slack: #backend-api-support
- Email: backend-team@company.com

**API Documentation:**
- Swagger UI: https://api.yourdomain.com/docs
- Postman Collection: [Link to Postman]

---

## 15. APPENDIX

### 15.1. Sample Request (Full)

```bash
curl -X POST https://api.yourdomain.com/api/statements/draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "customerId": 1,
    "period": "2026-01",
    "previousDebt": 15000000,
    "items": [
      {
        "stt": 1,
        "itemName": "Dịch vụ thiết kế website",
        "unit": "Gói",
        "quantity": 1,
        "unitPrice": 20000000,
        "amount": 20000000,
        "vatRate": 10,
        "note": "Gói Premium"
      },
      {
        "stt": 2,
        "itemName": "Hosting VPS 12 tháng",
        "unit": "Năm",
        "quantity": 1,
        "unitPrice": 5000000,
        "amount": 5000000,
        "vatRate": 10,
        "note": ""
      }
    ]
  }'
```

### 15.2. VAT Rate Reference

| VAT Rate | Áp dụng cho                                    |
|----------|------------------------------------------------|
| 0%       | Hàng hóa xuất khẩu, dịch vụ quốc tế           |
| 5%       | Nước sạch, giáo dục, y tế                      |
| 8%       | Sản phẩm, dịch vụ cụ thể theo quy định        |
| 10%      | Hàng hóa, dịch vụ thông thường (mặc định)     |

### 15.3. Period Format Examples

| Valid ✅        | Invalid ❌      | Reason                |
|----------------|----------------|-----------------------|
| 2026-01        | 2026-1         | Missing leading zero  |
| 2025-12        | 2025-13        | Invalid month         |
| 2024-06        | 24-06          | Invalid year format   |
| 2026-01        | 2026/01        | Wrong separator       |

---

**END OF DOCUMENT**

✅ Tài liệu này cung cấp đầy đủ thông tin để Backend Team implement API cho chức năng Bảng kê.  
📧 Mọi thắc mắc xin liên hệ Frontend Team hoặc PM.

---

**Change Log:**
- v1.0 (16/01/2026): Initial version - Full API specification
