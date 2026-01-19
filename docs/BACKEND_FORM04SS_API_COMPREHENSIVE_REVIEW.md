# 📋 Backend API Review: Form 04/SS-HĐĐT (Thông báo sai sót)

## 🎯 Endpoint được review
```http
POST /api/Tax/Create-Form04SS-Draft
Content-Type: application/json
Authorization: Bearer {token}
```

## ⚠️ Backend notification: Logic mới

Backend team báo đã **sửa logic**:
> "Chỉ còn gửi **thông báo chỉnh sửa hóa đơn** lên CQT, chứ không thay thế/điều chỉnh/hủy"

---

## 📊 Payload Structure Analysis

```json
{
  "notificationTypeCode": 0,
  "notificationNumber": "string",
  "taxAuthority": "string",
  "taxAuthorityCode": "string",
  "taxpayerName": "string",
  "taxCode": "string",
  "createdDate": "2026-01-19T01:41:05.796Z",
  "place": "string",
  "errorItems": [
    {
      "invoiceId": 0,
      "errorType": 2,
      "reason": "stringstri"
    }
  ]
}
```

---

## ❌ VẤN ĐỀ NGHIÊM TRỌNG: Sai nghiệp vụ Form 04/SS-HĐĐT

### 🚨 Vấn đề 1: Nhầm lẫn giữa Form 04/SS và 04/TB

**Backend đang nhầm lẫn 2 loại thông báo khác nhau:**

| Form | Tên đầy đủ | Mục đích | API hiện tại |
|------|-----------|----------|--------------|
| **04/SS-HĐĐT** | Thông báo hóa đơn điện tử có sai sót | Thông báo đến **CQT** về sai sót (chỉ nội bộ) | ❌ Đang dùng sai |
| **04/TB-HĐĐT** | Thông báo hóa đơn điều chỉnh/thay thế/hủy | Thông báo đến **CQT** và **khách hàng** về điều chỉnh | ✅ Cần dùng cái này |

### 📚 Căn cứ pháp lý (Nghị định 123/2020/NĐ-CP)

#### Form 04/SS-HĐĐT (Hiện tại đang dùng):
- **Điều 19 khoản 3**: "Trường hợp hóa đơn đã lập có sai sót..."
- **Mục đích:** Thông báo nội bộ đến CQT khi phát hiện sai sót
- **KHÔNG dùng để:** Hủy, điều chỉnh, thay thế hóa đơn
- **Chỉ dùng để:** Báo cáo sai sót cần sửa

#### Form 04/TB-HĐĐT (Nên dùng):
- **Điều 19 khoản 2**: "Thông báo điều chỉnh, thay thế, hủy hóa đơn"
- **Mục đích:** Thông báo chính thức về điều chỉnh/thay thế/hủy
- **Bắt buộc gửi:** CQT + Khách hàng
- **Có giá trị pháp lý**

---

## 🔴 Phân tích chi tiết các vấn đề

### 1. `notificationTypeCode: 0` - Không hợp lệ

```json
"notificationTypeCode": 0  // ❌ SAI
```

**Vấn đề:**
- `0` = Không xác định / Chưa set
- Backend **PHẢI** validate và reject nếu = 0
- Frontend gửi 1-4, backend nhận 0 → logic sai

**Chuẩn:**
```json
"notificationTypeCode": 2  // ✅ ĐÚNG - 2 = Điều chỉnh
```

**Enum mapping (theo NĐ 123/2020):**
```typescript
enum NotificationType {
  // 0 = INVALID - PHẢI REJECT
  CANCEL = 1,      // Hủy hóa đơn (Điều 19.2.a)
  ADJUST = 2,      // Điều chỉnh (Điều 19.2.b)
  REPLACE = 3,     // Thay thế (Điều 19.2.c)
  EXPLAIN = 4,     // Giải trình (Điều 19.3)
}
```

**Backend PHẢI validate:**
```csharp
if (request.NotificationTypeCode < 1 || request.NotificationTypeCode > 4)
{
    return BadRequest("notificationTypeCode phải từ 1-4");
}
```

---

### 2. `errorType: 2` - Không nhất quán với `notificationTypeCode`

```json
{
  "notificationTypeCode": 0,  // ❌ Level form
  "errorItems": [
    {
      "errorType": 2  // ❌ Level item - Trùng lặp, confusing
    }
  ]
}
```

**Vấn đề:**
- Có 2 fields cùng mục đích: `notificationTypeCode` (header) và `errorType` (item)
- Không cần thiết vì 1 thông báo 04/SS chỉ có 1 loại
- Gây nhầm lẫn khi 2 giá trị khác nhau

**Đề xuất sửa:**

**Option 1: Loại bỏ `errorType` trong errorItems**
```json
{
  "notificationTypeCode": 2,  // ✅ Chỉ cần 1 field này
  "errorItems": [
    {
      "invoiceId": 148,
      "reason": "Sai số tiền..."
      // Không có errorType - inherit từ notificationTypeCode
    }
  ]
}
```

**Option 2: Validate consistency**
```csharp
// Backend phải check
if (item.ErrorType != request.NotificationTypeCode)
{
    return BadRequest("errorType phải giống notificationTypeCode");
}
```

---

### 3. `reason: "stringstri"` - Validation yếu

```json
"reason": "stringstri"  // ❌ Chỉ 10 chars
```

**Vấn đề:**
- Lý do quá ngắn, không có nghĩa
- Không validate format (VD: tiếng Việt có dấu)
- Không validate từ cấm (spam, test, xxx)

**Đề xuất validation:**
```csharp
[Required(ErrorMessage = "Lý do sai sót là bắt buộc")]
[StringLength(500, MinimumLength = 20, 
    ErrorMessage = "Lý do phải từ 20-500 ký tự")]
[RegularExpression(@"^[\p{L}\p{N}\s.,;:()\-]+$", 
    ErrorMessage = "Lý do chứa ký tự không hợp lệ")]
public string Reason { get; set; }
```

**Business rules:**
```csharp
// Check từ cấm
var bannedWords = new[] { "test", "thử", "xxx", "asdf" };
if (bannedWords.Any(w => reason.ToLower().Contains(w)))
{
    return BadRequest("Lý do không được chứa từ không phù hợp");
}

// Check tính nghiệp vụ
if (!reason.Contains("sai") && !reason.Contains("lỗi") && !reason.Contains("điều chỉnh"))
{
    return BadRequest("Lý do phải mô tả cụ thể sai sót");
}
```

---

### 4. `taxAuthorityCode` - Thiếu validation format

```json
"taxAuthorityCode": "string"  // ❌ Phải là mã số chuẩn
```

**Vấn đề:**
- Accept bất kỳ string nào
- Không check mã CQT có tồn tại không
- Không check format (6 digits)

**Đề xuất:**
```csharp
[Required]
[RegularExpression(@"^\d{6}$", ErrorMessage = "Mã CQT phải 6 số")]
public string TaxAuthorityCode { get; set; }

// Database validation
var validCodes = new[] { "100394", "100395", "100396" }; // Hà Nội, HCM, etc
if (!validCodes.Contains(request.TaxAuthorityCode))
{
    return BadRequest($"Mã CQT {request.TaxAuthorityCode} không hợp lệ");
}
```

---

### 5. `invoiceId: 0` - ID không hợp lệ

```json
"invoiceId": 0  // ❌ ID = 0 không tồn tại
```

**Vấn đề:**
- ID = 0 thường là default value
- Không check invoice có tồn tại không
- Không check invoice đã có thông báo chưa

**Đề xuất:**
```csharp
[Range(1, int.MaxValue, ErrorMessage = "Invoice ID phải > 0")]
public int InvoiceId { get; set; }

// Business validation
var invoice = await _db.Invoices.FindAsync(item.InvoiceId);
if (invoice == null)
{
    return NotFound($"Không tìm thấy hóa đơn ID {item.InvoiceId}");
}

// Check duplicate notification
var existingNotification = await _db.TaxNotifications
    .Where(n => n.InvoiceId == item.InvoiceId)
    .Where(n => n.Status != NotificationStatus.Rejected)
    .FirstOrDefaultAsync();
    
if (existingNotification != null)
{
    return BadRequest($"Hóa đơn {item.InvoiceId} đã có thông báo #{existingNotification.Id}");
}
```

---

### 6. `createdDate` - Không validate time range

```json
"createdDate": "2026-01-19T01:41:05.796Z"  // ⚠️ Không check logic
```

**Vấn đề:**
- Accept ngày trong tương lai (2026)
- Accept ngày quá xa trong quá khứ
- Không check với invoice date

**Đề xuất:**
```csharp
// Validation
var createdDate = request.CreatedDate;
if (createdDate > DateTime.UtcNow.AddHours(1))
{
    return BadRequest("Ngày tạo không được trong tương lai");
}

if (createdDate < DateTime.UtcNow.AddYears(-5))
{
    return BadRequest("Ngày tạo không được quá 5 năm");
}

// Business rule: Phải sau ngày hóa đơn
if (createdDate < invoice.IssueDate)
{
    return BadRequest("Ngày thông báo phải sau ngày hóa đơn");
}
```

---

### 7. Missing fields - Thiếu thông tin bắt buộc

**Theo NĐ 123/2020, Form 04/SS cần:**

```json
{
  // ✅ Có
  "notificationNumber": "TB-19012026_0141",
  "taxpayerName": "Công ty ABC",
  "taxCode": "0316882091",
  
  // ❌ THIẾU - Bắt buộc
  "companyName": "Công ty TNHH ABC",           // Tên doanh nghiệp
  "companyAddress": "123 Đường XYZ, Hà Nội",   // Địa chỉ
  "representativeName": "Nguyễn Văn A",        // Người đại diện
  "representativePosition": "Giám đốc",        // Chức vụ
  "phoneNumber": "024-1234567",                // Số điện thoại
  "email": "contact@abc.com",                  // Email
  
  // ❌ THIẾU - Cho errorItems
  "errorItems": [{
    "invoiceSerial": "AA/24E",                 // Ký hiệu HĐ
    "invoiceNumber": "0000148",                // Số HĐ
    "invoiceDate": "2025-12-15",               // Ngày HĐ
    "buyerName": "Công ty XYZ",                // Tên người mua
    "buyerTaxCode": "0123456789",              // MST người mua
    "totalAmount": 15000000,                   // Tổng tiền
    "taxAmount": 1500000,                      // Tiền thuế
    "taxAuthorityCode": "ABC123456789DEF123456789012345", // Mã CQT của HĐ
    "oldValue": "15,000,000",                  // Giá trị cũ (nếu điều chỉnh)
    "newValue": "16,000,000"                   // Giá trị mới (nếu điều chỉnh)
  }]
}
```

---

## 🎯 ĐỀ XUẤT CHUẨN HÓA API

### Version 1: Fix hiện tại (Quick fix)

Nếu tiếp tục dùng Form 04/SS (không khuyến khích):

```json
{
  "notificationTypeCode": 2,  // ✅ 1-4, KHÔNG 0
  "notificationNumber": "TB-19012026_0141",
  "taxAuthority": "Cục Thuế Thành phố Hà Nội",
  "taxAuthorityCode": "100394",  // ✅ 6 digits
  "taxpayerName": "Công ty TNHH ABC",
  "taxCode": "0316882091",
  "createdDate": "2026-01-19T01:41:05Z",
  "place": "Hà Nội",
  
  // ✅ Thêm fields bắt buộc
  "companyAddress": "123 Đường XYZ, Quận 1, TP. Hà Nội",
  "representativeName": "Nguyễn Văn A",
  "representativePosition": "Giám đốc",
  "phoneNumber": "024-12345678",
  "email": "contact@abc.com",
  
  "errorItems": [
    {
      "invoiceId": 148,
      // ❌ XÓA errorType (inherit từ notificationTypeCode)
      
      "reason": "Sai số tiền trên hóa đơn do nhầm lẫn khi nhập liệu, cần điều chỉnh từ 15.000.000 VNĐ thành 16.000.000 VNĐ",  // ✅ Min 20 chars
      
      // ✅ Thêm chi tiết HĐ
      "invoiceSerial": "AA/24E",
      "invoiceNumber": "0000148",
      "invoiceDate": "2025-12-15",
      "buyerName": "Công ty XYZ",
      "buyerTaxCode": "0123456789",
      "totalAmount": 15000000,
      "taxAmount": 1500000,
      "taxAuthorityCode": "ABC123456789DEF123456789012345",
      "oldValue": "15,000,000 VNĐ",
      "newValue": "16,000,000 VNĐ"
    }
  ]
}
```

---

### Version 2: Đúng nghiệp vụ (Recommended) ⭐

**Nên tạo API mới cho Form 04/TB-HĐĐT:**

```http
POST /api/Tax/Create-Form04TB-Draft
```

**Payload:**
```json
{
  "notificationType": "ADJUST",  // CANCEL | ADJUST | REPLACE
  "notificationNumber": "TB-19012026_0141",
  
  // Thông tin người bán
  "seller": {
    "name": "Công ty TNHH ABC",
    "taxCode": "0316882091",
    "address": "123 Đường XYZ, Hà Nội",
    "phone": "024-12345678",
    "email": "contact@abc.com",
    "representative": {
      "name": "Nguyễn Văn A",
      "position": "Giám đốc"
    }
  },
  
  // Thông tin CQT
  "taxAuthority": {
    "name": "Cục Thuế TP. Hà Nội",
    "code": "100394"
  },
  
  // Hóa đơn gốc
  "originalInvoice": {
    "id": 148,
    "serial": "AA/24E",
    "number": "0000148",
    "date": "2025-12-15",
    "taxAuthorityCode": "ABC123456789DEF123456789012345",
    "totalAmount": 15000000,
    "taxAmount": 1500000
  },
  
  // Người mua
  "buyer": {
    "name": "Công ty XYZ",
    "taxCode": "0123456789",
    "address": "456 Đường DEF, Hà Nội",
    "phone": "024-98765432",
    "email": "buyer@xyz.com"
  },
  
  // Lý do và thay đổi
  "adjustment": {
    "reason": "Sai số tiền do nhầm lẫn nhập liệu",
    "description": "Điều chỉnh tổng tiền từ 15.000.000 VNĐ thành 16.000.000 VNĐ",
    "changes": [
      {
        "field": "totalAmount",
        "oldValue": 15000000,
        "newValue": 16000000
      },
      {
        "field": "taxAmount",
        "oldValue": 1500000,
        "newValue": 1600000
      }
    ]
  },
  
  // Metadata
  "createdDate": "2026-01-19T01:41:05Z",
  "place": "Hà Nội",
  "notifyCustomer": true  // ✅ Gửi email cho khách hàng
}
```

---

## 📊 So sánh 2 Forms

| Tiêu chí | Form 04/SS (Hiện tại) | Form 04/TB (Nên dùng) |
|----------|----------------------|----------------------|
| **Mục đích** | Thông báo sai sót nội bộ | Thông báo chính thức điều chỉnh/hủy |
| **Người nhận** | Chỉ CQT | CQT + Khách hàng |
| **Giá trị pháp lý** | Thấp (chỉ báo cáo) | Cao (có hiệu lực thay đổi) |
| **Khi nào dùng** | Phát hiện sai nhỏ, chưa xử lý | Đã quyết định điều chỉnh/hủy |
| **Workflow** | 1 bước: Báo CQT | 3 bước: Draft → Sign → Send |
| **Tạo HĐ mới** | Không | Có (HĐ điều chỉnh/thay thế) |
| **Backend logic** | Đơn giản | Phức tạp hơn |

---

## ✅ CHECKLIST BẮT BUỘC CHO BACKEND

### 🔴 Nghiệp vụ (Business Logic)

- [ ] **Quyết định form nào:** 04/SS hay 04/TB?
- [ ] **Validate notificationTypeCode:** 1-4, reject nếu 0
- [ ] **Check invoice status:** Chỉ thông báo HĐ đã signed/issued
- [ ] **Check duplicate:** 1 HĐ chỉ 1 thông báo active
- [ ] **Validate time:** createdDate > invoiceDate
- [ ] **Check quyền:** User có quyền thông báo HĐ này không?

### 🟡 Validation (Data Integrity)

- [ ] **taxAuthorityCode:** 6 digits, tồn tại trong DB
- [ ] **taxCode:** 10-13 digits, valid MST format
- [ ] **reason:** Min 20 chars, max 500 chars, no spam words
- [ ] **invoiceId:** > 0, tồn tại, chưa deleted
- [ ] **errorType:** Bỏ hoặc match với notificationTypeCode

### 🟢 Response (API Design)

- [ ] **Trả về notificationId:** Để frontend gọi preview/send
- [ ] **Trả về xmlPath:** Để frontend download
- [ ] **Trả về status:** DRAFT/SIGNED/SENT/ACCEPTED/REJECTED
- [ ] **Error messages:** Tiếng Việt, cụ thể, hướng dẫn fix

### 🔵 Security

- [ ] **Rate limiting:** Max 10 requests/minute/user
- [ ] **Audit log:** Log tất cả actions (create/edit/send)
- [ ] **JWT validation:** Verify token, check permissions
- [ ] **SQL injection:** Dùng parameterized queries

---

## 🚀 HÀNH ĐỘNG ƯU TIÊN

### Ngay lập tức (24h)

1. **Fix `notificationTypeCode` validation**
   ```csharp
   if (request.NotificationTypeCode < 1 || request.NotificationTypeCode > 4)
       return BadRequest("notificationTypeCode phải từ 1-4");
   ```

2. **Fix `reason` validation**
   ```csharp
   if (string.IsNullOrWhiteSpace(item.Reason) || item.Reason.Length < 20)
       return BadRequest("Lý do phải ít nhất 20 ký tự");
   ```

3. **Add invoice existence check**
   ```csharp
   var invoice = await _db.Invoices.FindAsync(item.InvoiceId);
   if (invoice == null)
       return NotFound($"Không tìm thấy hóa đơn {item.InvoiceId}");
   ```

### Tuần này (7 ngày)

4. **Thêm fields bắt buộc** (company info, phone, email)
5. **Validate taxAuthorityCode** (6 digits, exist in DB)
6. **Check duplicate notifications**
7. **Add audit logging**

### Tháng này (30 ngày)

8. **Quyết định:** Dùng 04/SS hay 04/TB?
9. **Nếu 04/TB:** Tạo API mới với payload đầy đủ
10. **Write unit tests** (coverage > 80%)
11. **Update Swagger docs** với examples chuẩn

---

## 📚 Tài liệu tham khảo

- **Nghị định 123/2020/NĐ-CP** - Quy định về hóa đơn điện tử
  - Điều 19: Điều chỉnh, thay thế, hủy hóa đơn
  - Điều 22: Xử lý sai sót trên hóa đơn
- **Thông tư 78/2021/TT-BTC** - Hướng dẫn Nghị định 123
  - Mục IV: Mẫu biểu
  - Phụ lục 04/SS-HĐĐT, 04/TB-HĐĐT
- **Cổng thông tin điện tử Tổng cục Thuế** - https://gdt.gov.vn

---

## 💬 Câu hỏi cho Backend Team

1. **Logic mới là gì cụ thể?**
   - "Chỉ gửi thông báo chỉnh sửa" = Form 04/SS hay 04/TB?
   - Có tạo hóa đơn điều chỉnh mới không?
   - Workflow: Draft → Preview → Send hay chỉ Send?

2. **Database schema:**
   - Table `TaxNotifications` có fields gì?
   - Có lưu `xmlPath`, `pdfPath`, `cqtResponse` không?
   - Có quan hệ với table `Invoices` không?

3. **CQT Integration:**
   - API gửi CQT là gì? (T-VAN? Trực tiếp?)
   - Response format từ CQT như thế nào?
   - Handle timeout/retry ra sao?

---

## 📅 Metadata

- **Ngày review:** 19/01/2026
- **Reviewer:** Frontend Team + Legal Consultant
- **Endpoint:** `POST /api/Tax/Create-Form04SS-Draft`
- **Severity:** 🔴 HIGH (Nghiệp vụ sai cơ bản)
- **Next review:** Sau khi backend fix

---

## 🎯 TÓM TẮT EXECUTIVE

### ❌ Vấn đề chính

1. **Sai form:** Dùng 04/SS cho mục đích của 04/TB
2. **Validation yếu:** Accept invalid data (notificationTypeCode=0, reason="string")
3. **Thiếu fields:** Không đủ thông tin theo quy định pháp luật
4. **Không consistent:** errorType vs notificationTypeCode

### ✅ Giải pháp

**Quick fix (3 ngày):**
- Fix validation: notificationTypeCode 1-4, reason min 20 chars
- Add invoice check
- Add duplicate check

**Proper fix (14 ngày):**
- Tạo API mới: `/api/Tax/Create-Form04TB-Draft`
- Payload đầy đủ theo NĐ 123/2020
- Workflow: Draft → Preview → Sign → Send → Track CQT response

**Tổng work effort:** ~40-60 giờ (1 dev, 2 tuần)

---

## ✉️ Contact

**Nếu cần làm rõ:**
- Frontend Lead: Về UI/UX flow
- Backend Lead: Về API implementation
- Legal Team: Về compliance với NĐ 123/2020
- Tax Consultant: Về quy trình CQT thực tế
