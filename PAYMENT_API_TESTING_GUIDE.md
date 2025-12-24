# 🧪 PAYMENT API - HƯỚNG DẪN TESTING HOÀN CHỈNH

## 📋 MỤC LỤC
1. [Phân tích cURL Request](#phân-tích-curl-request)
2. [Chuẩn bị Test Data](#chuẩn-bị-test-data)
3. [Test Cases Chi Tiết](#test-cases-chi-tiết)
4. [Validation Rules](#validation-rules)
5. [Response Examples](#response-examples)
6. [Error Handling](#error-handling)

---

## 🔍 PHÂN TÍCH cURL REQUEST

### ❌ Request KHÔNG ĐÚNG (từ Swagger - chỉ là template)

```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 0,                    # ❌ KHÔNG HỢP LỆ: Phải > 0
  "amount": 0,                       # ❌ KHÔNG HỢP LỆ: Phải > 0
  "paymentMethod": "string",         # ❌ KHÔNG HỢP LỆ: Phải là giá trị chuẩn
  "transactionCode": "string",       # ⚠️ CẦN SỬA: Nên có format rõ ràng
  "note": "string",                  # ⚠️ CẦN SỬA: Nên mô tả cụ thể
  "paymentDate": "2025-12-14T16:16:09.918Z",  # ✅ OK
  "userId": 0                        # ❌ KHÔNG HỢP LỆ: Phải > 0
}'
```

### 🚫 CÁC VẤN ĐỀ PHÁT HIỆN

| Field | Giá trị hiện tại | Vấn đề | Giá trị đúng |
|-------|------------------|--------|--------------|
| `invoiceId` | 0 | Invoice ID không tồn tại | ID thực từ database (VD: 1, 2, 3...) |
| `amount` | 0 | Số tiền = 0 không hợp lệ | Số tiền thực > 0 và ≤ remainingAmount |
| `paymentMethod` | "string" | Không phải giá trị chuẩn | "BankTransfer", "Cash", "CreditCard", etc. |
| `transactionCode` | "string" | Format không rõ ràng | "TXN20251214001" hoặc null (nếu Cash) |
| `note` | "string" | Không mô tả gì | "Thanh toán đợt 1", "Thanh toán hóa đơn tháng 12" |
| `userId` | 0 | User ID không tồn tại | ID user từ token (thường lấy tự động) |

---

## 🎯 CHUẨN BỊ TEST DATA

### Bước 1️⃣: Lấy danh sách Invoices có nợ

```bash
# GET invoices để biết Invoice nào có RemainingAmount > 0
curl -X 'GET' \
  'http://159.223.64.31/api/Invoice?PageIndex=1&PageSize=10' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc'
```

**Expected Response**:
```json
{
  "data": [
    {
      "invoiceId": 1,
      "invoiceNumber": "C24TAA-001",
      "customerId": 1,
      "customerName": "Công ty ABC",
      "totalAmount": 50000000,
      "paidAmount": 0,                    # ← LƯU Ý: Còn nợ 50 triệu
      "remainingAmount": 50000000,        # ← LƯU Ý: Có thể thanh toán tối đa 50 triệu
      "paymentStatus": "Unpaid",
      "dueDate": "2025-12-31T00:00:00Z"
    },
    {
      "invoiceId": 2,
      "invoiceNumber": "C24TAA-002",
      "totalAmount": 30000000,
      "paidAmount": 10000000,             # ← LƯU Ý: Đã thanh toán 10 triệu
      "remainingAmount": 20000000,        # ← LƯU Ý: Còn nợ 20 triệu
      "paymentStatus": "PartiallyPaid"
    }
  ]
}
```

**Action**: Lưu lại `invoiceId` và `remainingAmount` để dùng cho test

---

### Bước 2️⃣: Verify User ID từ Token

Token JWT chứa `sub` (subject) = User ID:
```json
{
  "sub": "1",                    # ← User ID = 1
  "email": "admin@eims.local",
  "name": "Admin User",
  "role": "Admin"
}
```

**Action**: Lấy `userId` từ token (trong trường hợp này là `1`)

---

## ✅ TEST CASES CHI TIẾT

### Test Case #1: ✅ SUCCESS - Thanh toán toàn bộ Invoice

**Scenario**: Thanh toán 100% Invoice C24TAA-001

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 1,
  "amount": 50000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN20251214001",
  "note": "Thanh toán toàn bộ hóa đơn C24TAA-001",
  "paymentDate": "2025-12-14T16:16:09.918Z",
  "userId": 1
}'
```

**Expected Response (200 OK)**:
```json
{
  "id": 1,
  "invoiceId": 1,
  "amount": 50000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN20251214001",
  "note": "Thanh toán toàn bộ hóa đơn C24TAA-001",
  "paymentDate": "2025-12-14T16:16:09.918Z",
  "userId": 1,
  "createdAt": "2025-12-14T16:16:10.123Z",
  "invoice": {
    "invoiceNumber": "C24TAA-001",
    "customerName": "Công ty ABC",
    "totalAmount": 50000000,
    "paidAmount": 50000000,           # ← ĐÃ CẬP NHẬT
    "remainingAmount": 0,             # ← ĐÃ CẬP NHẬT
    "paymentStatus": "Paid"           # ← ĐÃ CẬP NHẬT
  },
  "user": {
    "userId": 1,
    "userName": "Admin User"
  }
}
```

**Verification**:
✅ Payment record được tạo  
✅ Invoice.PaidAmount = 50,000,000  
✅ Invoice.RemainingAmount = 0  
✅ Invoice.PaymentStatus = "Paid"  
✅ Invoice.LastPaymentDate = "2025-12-14"

---

### Test Case #2: ✅ SUCCESS - Thanh toán một phần (Partial Payment)

**Scenario**: Thanh toán 50% Invoice C24TAA-002 (10 triệu / 20 triệu còn nợ)

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 2,
  "amount": 10000000,
  "paymentMethod": "Cash",
  "transactionCode": null,
  "note": "Thanh toán đợt 1 - 50% số tiền còn nợ",
  "paymentDate": "2025-12-14T16:20:00.000Z",
  "userId": 1
}'
```

**Expected Response (200 OK)**:
```json
{
  "id": 2,
  "invoiceId": 2,
  "amount": 10000000,
  "paymentMethod": "Cash",
  "transactionCode": null,
  "note": "Thanh toán đợt 1 - 50% số tiền còn nợ",
  "paymentDate": "2025-12-14T16:20:00.000Z",
  "userId": 1,
  "createdAt": "2025-12-14T16:20:01.456Z",
  "invoice": {
    "invoiceNumber": "C24TAA-002",
    "customerName": "Công ty XYZ",
    "totalAmount": 30000000,
    "paidAmount": 20000000,           # ← 10M cũ + 10M mới = 20M
    "remainingAmount": 10000000,      # ← 30M - 20M = 10M
    "paymentStatus": "PartiallyPaid"  # ← VẪN CÒN NỢ
  },
  "user": {
    "userId": 1,
    "userName": "Admin User"
  }
}
```

**Verification**:
✅ Payment record được tạo  
✅ Invoice.PaidAmount = 20,000,000 (10M + 10M)  
✅ Invoice.RemainingAmount = 10,000,000  
✅ Invoice.PaymentStatus = "PartiallyPaid"  
✅ TransactionCode = null (vì thanh toán bằng Cash)

---

### Test Case #3: ❌ ERROR - Invoice không tồn tại

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 99999,
  "amount": 1000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN20251214002",
  "note": "Test với invoice không tồn tại",
  "paymentDate": "2025-12-14T16:25:00.000Z",
  "userId": 1
}'
```

**Expected Response (404 Not Found)**:
```json
{
  "statusCode": 404,
  "message": "Invoice not found",
  "errors": {
    "invoiceId": ["Invoice with ID 99999 does not exist"]
  }
}
```

---

### Test Case #4: ❌ ERROR - Số tiền thanh toán vượt quá số nợ

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 1,
  "amount": 60000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN20251214003",
  "note": "Thanh toán vượt quá số nợ",
  "paymentDate": "2025-12-14T16:30:00.000Z",
  "userId": 1
}'
```

**Expected Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "message": "Payment amount exceeds remaining amount",
  "errors": {
    "amount": [
      "Payment amount (60,000,000 VND) exceeds remaining amount (50,000,000 VND)"
    ]
  },
  "details": {
    "invoiceId": 1,
    "invoiceNumber": "C24TAA-001",
    "totalAmount": 50000000,
    "paidAmount": 0,
    "remainingAmount": 50000000,
    "requestedAmount": 60000000
  }
}
```

---

### Test Case #5: ❌ ERROR - Số tiền = 0 hoặc âm

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 1,
  "amount": 0,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN20251214004",
  "note": "Test với amount = 0",
  "paymentDate": "2025-12-14T16:35:00.000Z",
  "userId": 1
}'
```

**Expected Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "amount": ["Amount must be greater than 0"]
  }
}
```

---

### Test Case #6: ❌ ERROR - PaymentMethod không hợp lệ

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 1,
  "amount": 5000000,
  "paymentMethod": "Bitcoin",
  "transactionCode": "TXN20251214005",
  "note": "Test với payment method không hợp lệ",
  "paymentDate": "2025-12-14T16:40:00.000Z",
  "userId": 1
}'
```

**Expected Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "message": "Invalid payment method",
  "errors": {
    "paymentMethod": [
      "Payment method must be one of: Cash, BankTransfer, CreditCard, DebitCard, EWallet, Check, Other"
    ]
  }
}
```

---

### Test Case #7: ⚠️ EDGE CASE - Thanh toán Invoice đã được thanh toán đầy đủ

**Request**:
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": 1,
  "amount": 1000,
  "paymentMethod": "Cash",
  "transactionCode": null,
  "note": "Thanh toán thêm cho invoice đã paid",
  "paymentDate": "2025-12-14T16:45:00.000Z",
  "userId": 1
}'
```

**Expected Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "message": "Invoice already fully paid",
  "errors": {
    "invoiceId": ["Invoice C24TAA-001 has already been fully paid"]
  },
  "details": {
    "invoiceId": 1,
    "invoiceNumber": "C24TAA-001",
    "paymentStatus": "Paid",
    "remainingAmount": 0
  }
}
```

---

## 📐 VALIDATION RULES

### 1. **invoiceId** (Required)
- ✅ Phải là số nguyên dương (> 0)
- ✅ Invoice phải tồn tại trong database
- ✅ Invoice.RemainingAmount > 0 (chưa thanh toán hết)

### 2. **amount** (Required)
- ✅ Phải là số thực dương (> 0)
- ✅ Không được vượt quá Invoice.RemainingAmount
- ✅ Độ chính xác: 2 chữ số thập phân (VD: 10000000.50)

### 3. **paymentMethod** (Required)
- ✅ Phải thuộc danh sách:
  - `Cash` - Tiền mặt
  - `BankTransfer` - Chuyển khoản ngân hàng
  - `CreditCard` - Thẻ tín dụng
  - `DebitCard` - Thẻ ghi nợ
  - `EWallet` - Ví điện tử (Momo, ZaloPay, VNPay...)
  - `Check` - Séc
  - `Other` - Phương thức khác

### 4. **transactionCode** (Optional)
- ⚠️ **BẮT BUỘC** nếu PaymentMethod = BankTransfer, CreditCard, DebitCard, EWallet
- ⚠️ Có thể NULL nếu PaymentMethod = Cash hoặc Check
- ✅ Format đề xuất: `TXN + YYYYMMDD + Sequence` (VD: TXN20251214001)
- ✅ Max length: 50 characters

### 5. **note** (Optional)
- ✅ Mô tả ngắn gọn về khoản thanh toán
- ✅ Max length: 500 characters
- ✅ VD: "Thanh toán đợt 1", "Thanh toán hóa đơn tháng 12/2024"

### 6. **paymentDate** (Required)
- ✅ Format: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- ✅ Không được là ngày tương lai
- ✅ Nên <= ngày hiện tại

### 7. **userId** (Required)
- ✅ Phải là số nguyên dương (> 0)
- ✅ User phải tồn tại trong database
- ✅ **Thường lấy tự động từ JWT token** (không cần truyền vào)

---

## 📊 PAYMENT METHOD REFERENCE

| Code | Tên | Transaction Code | Note |
|------|-----|------------------|------|
| `Cash` | Tiền mặt | ❌ Không bắt buộc | Dùng cho thanh toán trực tiếp |
| `BankTransfer` | Chuyển khoản | ✅ **BẮT BUỘC** | Mã giao dịch ngân hàng |
| `CreditCard` | Thẻ tín dụng | ✅ **BẮT BUỘC** | Mã authorization |
| `DebitCard` | Thẻ ghi nợ | ✅ **BẮT BUỘC** | Mã authorization |
| `EWallet` | Ví điện tử | ✅ **BẮT BUỘC** | Transaction ID từ Momo/ZaloPay/VNPay |
| `Check` | Séc | ❌ Không bắt buộc | Có thể dùng số séc |
| `Other` | Khác | ⚠️ Tùy chọn | Mô tả trong Note |

---

## 🔄 BUSINESS LOGIC FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Validate Request                                         │
│    - Check required fields                                  │
│    - Validate data types & formats                          │
│    - Validate payment method                                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Validate Invoice                                         │
│    - Check invoice exists                                   │
│    - Check invoice.RemainingAmount > 0                      │
│    - Check amount <= invoice.RemainingAmount                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create Payment Record                                    │
│    - Insert into Payments table                             │
│    - Save payment details                                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ⭐ AUTO UPDATE INVOICE                                   │
│    - invoice.PaidAmount += payment.Amount                   │
│    - invoice.RemainingAmount = TotalAmount - PaidAmount     │
│    - invoice.LastPaymentDate = payment.PaymentDate          │
│    - UPDATE PaymentStatus:                                  │
│      • If RemainingAmount = 0 → "Paid"                      │
│      • If PaidAmount > 0 && RemainingAmount > 0             │
│        → "PartiallyPaid"                                    │
│      • If DueDate < Today && Status != Paid → "Overdue"     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Commit Transaction & Return Response                     │
│    - Save all changes                                       │
│    - Return payment with updated invoice info               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 QUICK START - Test ngay lập tức

### Bước 1: Lấy Invoice ID có nợ

```bash
curl -X 'GET' 'http://159.223.64.31/api/Invoice?PageIndex=1&PageSize=5' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc'
```

### Bước 2: Tạo Payment (sử dụng INVOICE_ID và REMAINING_AMOUNT từ bước 1)

```bash
curl -X 'POST' 'http://159.223.64.31/api/Payment' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc' \
  -H 'Content-Type: application/json' \
  -d '{
  "invoiceId": <INVOICE_ID_TỪ_BƯỚC_1>,
  "amount": <SỐ_TIỀN_MUỐN_THANH_TOÁN>,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN20251214001",
  "note": "Thanh toán hóa đơn - Test API",
  "paymentDate": "2025-12-14T16:16:09.918Z",
  "userId": 1
}'
```

### Bước 3: Verify kết quả

```bash
# Kiểm tra Payment vừa tạo
curl -X 'GET' 'http://159.223.64.31/api/Payment?PageIndex=1&PageSize=10' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc'

# Kiểm tra Invoice đã được update
curl -X 'GET' 'http://159.223.64.31/api/Invoice/<INVOICE_ID>' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBlaW1zLmxvY2FsIiwibmFtZSI6IkFkbWluIFVzZXIiLCJqdGkiOiJiYzFmNjk3Yi02NDZmLTRkZWQtYWExNi04ZjBkODk0YzU2MmIiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NjU3Mjg5MDMsImV4cCI6MTc2NTcyOTgwMywiaWF0IjoxNzY1NzI4OTAzLCJpc3MiOiJodHRwOi8vMTU5LjIyMy42NC4zMSIsImF1ZCI6IkVJTVMuQ2xpZW50In0.N9Klq5oNCh86xne7rcdtjXzZUPwMxwEImPr56-qFkzc'
```

---

## 📚 SUMMARY - TÓM TẮT QUAN TRỌNG

### ✅ ĐIỂM CHÍNH XÁC của cURL Request

| Phần | Trạng thái |
|------|------------|
| Endpoint URL | ✅ Đúng: `POST /api/Payment` |
| Headers | ✅ Đúng: Authorization, Content-Type |
| Request Body Structure | ✅ Đúng: 7 fields cần thiết |

### ❌ ĐIỂM CẦN SỬA của cURL Request

| Field | Giá trị Swagger | Cần sửa thành |
|-------|-----------------|---------------|
| `invoiceId` | 0 | ID thực từ database (VD: 1, 2, 3) |
| `amount` | 0 | Số tiền thực > 0 (VD: 5000000) |
| `paymentMethod` | "string" | Giá trị chuẩn (VD: "BankTransfer") |
| `transactionCode` | "string" | Mã thực hoặc null (VD: "TXN20251214001") |
| `note` | "string" | Mô tả rõ ràng (VD: "Thanh toán đợt 1") |
| `userId` | 0 | User ID thực (VD: 1) |

### 🎯 CHECKLIST Test API

- [ ] Đã lấy danh sách Invoices để biết invoiceId
- [ ] Đã check remainingAmount của Invoice
- [ ] Đã chọn paymentMethod hợp lệ
- [ ] Đã tạo transactionCode (nếu cần)
- [ ] Số tiền thanh toán > 0 và <= remainingAmount
- [ ] Đã verify response trả về đúng
- [ ] Đã check Invoice được update (PaidAmount, RemainingAmount, PaymentStatus)

---

## 📞 SUPPORT

Nếu gặp lỗi, kiểm tra:
1. ✅ Token còn hạn? (exp trong JWT)
2. ✅ Invoice tồn tại và có RemainingAmount > 0?
3. ✅ Amount <= RemainingAmount?
4. ✅ PaymentMethod hợp lệ?
5. ✅ TransactionCode có khi cần?

---

**Document Version**: 1.0  
**Created**: 14/12/2025  
**Last Updated**: 14/12/2025  
**Status**: ✅ Ready for Testing
