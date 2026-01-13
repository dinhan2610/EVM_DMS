# 📋 YÊU CẦU API - THÔNG BÁO SAI SÓT HÓA ĐƠN (MẪU 04/SS-HĐĐT)

**Ngày tạo:** 14/01/2026  
**Cập nhật:** 14/01/2026 - Review BE API  
**Tác giả:** Frontend Team  
**Trạng thái:** 🔄 Backend đã implement (cần sửa)

---

## 🚨 BACKEND API REVIEW (14/01/2026)

**BE đã implement:**
```
POST http://159.223.64.31/api/Tax/Create-Form04SS-Draft
```

**Request Body hiện tại:**
```json
{
  "taxAuthorityCode": "string",
  "place": "string",
  "errorItems": [
    {
      "invoiceId": 0,
      "errorType": 0,
      "reason": "string"
    }
  ]
}
```

### ⚠️ VẤN ĐỀ CẦN SỬA NGAY:

#### **1. THIẾU HEADER INFO QUAN TRỌNG (Section A - Mẫu 04/SS-HĐĐT)**

API thiếu các field bắt buộc theo Mẫu 04/SS-HĐĐT:

❌ **notificationType** (Loại thông báo)
- VD: "Thông báo hủy/giải trình của Người nộp thuế"
- Bắt buộc theo mẫu 04
- FE đang gửi field này

❌ **notificationNumber** (Số thông báo)
- Format: `TB-DDMMYYYY_HHMM` (VD: "TB-14012026_1430")
- FE auto-generate hoặc BE tự tạo
- Cần unique constraint

❌ **taxAuthority** (Tên cơ quan thuế)
- VD: "Cục Thuế TP. Hà Nội"
- Khác với taxAuthorityCode (mã 34 ký tự)

❌ **taxpayerName** (Tên người nộp thuế)
- Tên công ty
- FE lấy từ Company

❌ **taxCode** (Mã số thuế người nộp thuế)
- MST công ty
- FE lấy từ Company

❌ **createdDate** (Ngày lập)
- ISO date format
- FE gửi current date

✅ **place** (Nơi lập) - ĐÃ CÓ

#### **2. taxAuthorityCode Ở SAI VỊ TRÍ**

**Hiện tại:**
```json
{
  "taxAuthorityCode": "string",  // Top level
  "errorItems": [...]
}
```

**Vấn đề:**
- Mỗi invoice đã có `taxAuthorityCode` riêng trong DB
- FE không cần gửi field này
- BE nên tự lấy từ `Invoices.taxAuthorityCode` khi query
- Field này ở top-level không hợp lý vì mỗi invoice có thể khác nhau

**Đề xuất:**
- ❌ XÓA field `taxAuthorityCode` khỏi request body
- ✅ BE tự query từ DB: `SELECT taxAuthorityCode FROM Invoices WHERE invoiceID = @invoiceId`

#### **3. errorType Value Range**

**Cần xác nhận:**
- BE đang dùng: `0-3` hay `1-4`?
- FE đang dùng: `1-4` (CANCEL=1, ADJUST=2, REPLACE=3, EXPLAIN=4)

**Mapping FE:**
```typescript
enum ErrorType {
  CANCEL = 1,      // Hủy
  ADJUST = 2,      // Điều chỉnh
  REPLACE = 3,     // Thay thế
  EXPLAIN = 4,     // Giải trình
}
```

**Action:**
- ✅ Confirm BE dùng 1-4 (khớp với FE)
- ⚠️ Nếu BE dùng 0-3, FE cần adjust mapping

#### **4. THIẾU RESPONSE STRUCTURE**

Cần response rõ ràng:

```json
{
  "success": true,
  "message": "Đã lưu thông báo sai sót thành công",
  "data": {
    "notificationId": 1,
    "notificationNumber": "TB-14012026_1430",
    "status": "draft",
    "createdAt": "2026-01-14T14:30:00Z",
    "createdBy": 5
  }
}
```

---

### ✅ REQUEST BODY ĐỀ XUẤT (FIXED)

```json
{
  // ========== HEADER INFO (Section A) ==========
  "notificationType": "Thông báo hủy/giải trình của Người nộp thuế",
  "notificationNumber": "TB-14012026_1430",
  "taxAuthority": "Cục Thuế TP. Hà Nội",
  "taxpayerName": "Công ty TNHH ABC",
  "taxCode": "0316882091",
  "createdDate": "2026-01-14",
  "place": "Hà Nội",
  
  // ========== DETAILS (Section B) ==========
  "errorItems": [
    {
      "invoiceId": 148,
      "errorType": 1,           // 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
      "reason": "Thông tin khách hàng không chính xác, cần điều chỉnh địa chỉ"
    }
  ]
}
```

**Notes:**
- ❌ XÓA `taxAuthorityCode` khỏi request (BE tự lấy từ DB)
- ✅ THÊM 6 fields header info (notificationType, notificationNumber, taxAuthority, taxpayerName, taxCode, createdDate)
- ✅ Keep `place` và `errorItems`

---

### 🔧 BACKEND TODO LIST

#### **PRIORITY 1 - CRITICAL (Phải sửa):**

- [ ] **Thêm 6 fields vào request model:**
  ```csharp
  public class CreateForm04SSDraftRequest 
  {
      // NEW FIELDS
      public string NotificationType { get; set; }
      public string NotificationNumber { get; set; }
      public string TaxAuthority { get; set; }
      public string TaxpayerName { get; set; }
      public string TaxCode { get; set; }
      public DateTime CreatedDate { get; set; }
      
      // EXISTING FIELDS
      public string Place { get; set; }
      public List<ErrorItemDto> ErrorItems { get; set; }
  }
  ```

- [ ] **Xóa `taxAuthorityCode` khỏi request body top-level**

- [ ] **Validate `notificationNumber` unique:**
  ```sql
  SELECT COUNT(*) FROM TaxErrorNotifications 
  WHERE NotificationNumber = @notificationNumber
  ```

- [ ] **Auto-query `taxAuthorityCode` từ Invoice:**
  ```csharp
  foreach (var item in request.ErrorItems) 
  {
      var invoice = await _db.Invoices.FindAsync(item.InvoiceId);
      var taxAuthorityCode = invoice.TaxAuthorityCode; // Use this
  }
  ```

#### **PRIORITY 2 - Validation:**

- [ ] **Validate errorType range: 1-4**
  ```csharp
  if (item.ErrorType < 1 || item.ErrorType > 4)
      return BadRequest("errorType phải từ 1-4");
  ```

- [ ] **Validate reason min length: 10 chars**
  ```csharp
  if (item.Reason.Length < 10)
      return BadRequest("Lý do phải >= 10 ký tự");
  ```

- [ ] **Validate place required**
  ```csharp
  if (string.IsNullOrWhiteSpace(request.Place))
      return BadRequest("Nơi lập là bắt buộc");
  ```

#### **PRIORITY 3 - Response Structure:**

- [ ] **Trả về response chuẩn:**
  ```json
  {
    "success": true,
    "message": "Đã lưu thông báo sai sót thành công",
    "data": {
      "notificationId": 1,
      "notificationNumber": "TB-14012026_1430",
      "status": "draft",
      "createdAt": "2026-01-14T14:30:00Z",
      "createdBy": 5
    }
  }
  ```

---

### 📝 FRONTEND INTEGRATION NOTES

**Sau khi BE sửa xong, FE cần:**

1. Update `taxErrorNotificationService.ts`:
   ```typescript
   // OLD endpoint (if different)
   // POST /api/TaxErrorNotification/create
   
   // NEW endpoint
   POST /api/Tax/Create-Form04SS-Draft
   ```

2. Map request body từ modal state:
   ```typescript
   const requestBody = {
     notificationType: headerData.notificationType,
     notificationNumber: headerData.notificationNumber,
     taxAuthority: headerData.taxAuthority,
     taxpayerName: headerData.taxpayerName,
     taxCode: headerData.taxCode,
     createdDate: headerData.createdDate.format('YYYY-MM-DD'),
     place: headerData.place,
     errorItems: detailData.map(detail => ({
       invoiceId: invoice.invoiceID,
       errorType: detail.errorType,
       reason: detail.reason,
     }))
   };
   ```

3. Xóa `taxAuthorityCode` khỏi request (BE tự lấy)

---

### 🧪 TEST CASE MẪU

**Request hợp lệ:**
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Tax/Create-Form04SS-Draft' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "notificationType": "Thông báo hủy/giải trình của Người nộp thuế",
  "notificationNumber": "TB-14012026_1430",
  "taxAuthority": "Cục Thuế TP. Hà Nội",
  "taxpayerName": "Công ty TNHH Giải pháp Tổng thể Kỷ Nguyên Số",
  "taxCode": "0316882091",
  "createdDate": "2026-01-14",
  "place": "Hà Nội",
  "errorItems": [
    {
      "invoiceId": 148,
      "errorType": 1,
      "reason": "Thông tin khách hàng không chính xác, cần điều chỉnh địa chỉ và mã số thuế"
    }
  ]
}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đã lưu thông báo sai sót thành công",
  "data": {
    "notificationId": 1,
    "notificationNumber": "TB-14012026_1430",
    "status": "draft",
    "createdAt": "2026-01-14T14:30:00Z",
    "createdBy": 5
  }
}
```

---

### 📊 SO SÁNH API

| Field | FE Có | BE Nhận (Hiện tại) | BE Cần Sửa |
|-------|-------|-------------------|-----------|
| notificationType | ✅ | ❌ | ✅ THÊM |
| notificationNumber | ✅ | ❌ | ✅ THÊM |
| taxAuthority | ✅ | ❌ | ✅ THÊM |
| taxpayerName | ✅ | ❌ | ✅ THÊM |
| taxCode | ✅ | ❌ | ✅ THÊM |
| createdDate | ✅ | ❌ | ✅ THÊM |
| place | ✅ | ✅ | ✅ GIỮ |
| taxAuthorityCode | ❌ (readonly) | ✅ | ❌ XÓA (BE tự lấy) |
| errorItems | ✅ | ✅ | ✅ GIỮ |

**Tổng kết:**
- ➕ Cần thêm: 6 fields
- ➖ Cần xóa: 1 field (taxAuthorityCode)
- ✅ Giữ nguyên: 2 fields (place, errorItems)

---

## 📌 TỔNG QUAN

Frontend đã hoàn thành **TaxErrorNotificationModal_v2** với đầy đủ tính năng:
- ✅ Auto-fill thông tin hóa đơn từ invoice data
- ✅ Form nhập đầy đủ theo Mẫu 04/SS-HĐĐT
- ✅ Validation chặt chẽ
- ✅ UI/UX professional

**Hiện tại thiếu:** Backend API để lưu và xử lý thông báo sai sót.

---

## 🎯 API CẦN BACKEND IMPLEMENT

### **1. CREATE TAX ERROR NOTIFICATION**

**Endpoint:**
```
POST /api/TaxErrorNotification/create
```

**Mục đích:** Lưu thông báo sai sót vào database, chuẩn bị cho việc ký số và gửi CQT sau.

**Authentication:** Required (Bearer Token)

**Request Body:**

```typescript
{
  // ==================== SECTION A: HEADER INFO ====================
  "header": {
    "notificationType": "Thông báo hủy/giải trình của Người nộp thuế",
    "notificationNumber": "TB-14012026_1430",        // Auto-generated by FE
    "taxAuthority": "Cục Thuế TP. Hà Nội",
    "taxpayerName": "Công ty ABC",
    "taxCode": "0316882091",
    "createdDate": "2026-01-14",                      // ISO date format
    "place": "Hà Nội"
  },
  
  // ==================== SECTION B: INVOICE DETAILS ====================
  "details": [
    {
      "stt": 1,
      "invoiceId": 148,                                // ID hóa đơn gốc
      "templateCode": "1",                             // Mẫu số
      "serial": "1C25TAA",                             // Ký hiệu
      "invoiceNumber": "0000148",                      // Số HĐ (7 digits with padding)
      "invoiceDate": "2026-01-10",                     // ISO date format
      "invoiceType": "Hóa đơn gốc (theo NĐ123/2020/NĐ-CP)",
      "errorType": 1,                                  // 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
      "reason": "Thông tin khách hàng không chính xác, cần điều chỉnh địa chỉ và mã số thuế",
      "taxAuthorityCode": "TCT/9F36ABD123..."         // Mã CQT (34 chars)
    }
  ]
}
```

**Response Success (201):**

```json
{
  "success": true,
  "message": "Đã lưu thông báo sai sót thành công",
  "data": {
    "notificationId": 1,
    "notificationNumber": "TB-14012026_1430",
    "status": "draft",                    // draft, signed, submitted, accepted, rejected
    "createdAt": "2026-01-14T14:30:00Z",
    "createdBy": 5                        // User ID
  }
}
```

**Response Error (400/500):**

```json
{
  "success": false,
  "message": "Lỗi khi lưu thông báo sai sót",
  "errors": [
    {
      "field": "details[0].invoiceId",
      "message": "Invoice ID không tồn tại"
    }
  ]
}
```

---

## 🗄️ DATABASE SCHEMA ĐỀ XUẤT

### **Table: TaxErrorNotifications**

```sql
CREATE TABLE TaxErrorNotifications (
    -- Primary Key
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    
    -- Header Info (Section A)
    NotificationType NVARCHAR(200) NOT NULL,
    NotificationNumber NVARCHAR(50) NOT NULL UNIQUE,  -- TB-DDMMYYYY_HHMM
    TaxAuthority NVARCHAR(200) NOT NULL,
    TaxpayerName NVARCHAR(500) NOT NULL,
    TaxCode NVARCHAR(20) NOT NULL,
    CreatedDate DATE NOT NULL,
    Place NVARCHAR(200) NOT NULL,
    
    -- Status & Workflow
    StatusID INT NOT NULL DEFAULT 0,  -- 0=Draft, 1=Signed, 2=Submitted, 3=Accepted, 4=Rejected
    
    -- Digital Signature (after signing)
    DigitalSignature NVARCHAR(MAX) NULL,
    SignedDate DATETIME NULL,
    SignedBy INT NULL,  -- UserID
    
    -- XML & CQT Response
    XMLData NVARCHAR(MAX) NULL,
    HashValue NVARCHAR(500) NULL,
    TaxAuthorityResponse NVARCHAR(MAX) NULL,
    SubmittedDate DATETIME NULL,
    
    -- Audit Fields
    CompanyID INT NOT NULL,
    CreatedBy INT NOT NULL,  -- UserID
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    -- Indexes
    INDEX IX_NotificationNumber (NotificationNumber),
    INDEX IX_TaxCode (TaxCode),
    INDEX IX_StatusID (StatusID),
    INDEX IX_CreatedDate (CreatedDate)
)
```

### **Table: TaxErrorNotificationDetails**

```sql
CREATE TABLE TaxErrorNotificationDetails (
    -- Primary Key
    DetailID INT PRIMARY KEY IDENTITY(1,1),
    
    -- Foreign Key
    NotificationID INT NOT NULL,
    FOREIGN KEY (NotificationID) REFERENCES TaxErrorNotifications(NotificationID) ON DELETE CASCADE,
    
    -- Invoice Info (Section B)
    STT INT NOT NULL,                       -- Số thứ tự
    InvoiceID INT NOT NULL,                 -- FK to Invoices table
    TemplateCode NVARCHAR(10) NOT NULL,     -- Mẫu số
    Serial NVARCHAR(20) NOT NULL,           -- Ký hiệu
    InvoiceNumber NVARCHAR(20) NOT NULL,    -- Số HĐ
    InvoiceDate DATE NOT NULL,
    InvoiceType NVARCHAR(200) NOT NULL,
    
    -- Error Info
    ErrorType INT NOT NULL,                 -- 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
    Reason NVARCHAR(1000) NOT NULL,         -- Lý do sai sót
    TaxAuthorityCode NVARCHAR(50) NOT NULL, -- Mã CQT
    
    -- Audit
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    -- Indexes
    INDEX IX_NotificationID (NotificationID),
    INDEX IX_InvoiceID (InvoiceID),
    INDEX IX_ErrorType (ErrorType)
)
```

---

## 🔗 TÍCH HỢP VỚI API HIỆN CÓ

**API đã có (có thể reuse logic):**

```
✅ POST /api/TaxErrorNotification/preview
✅ POST /api/TaxErrorNotification/submit
✅ GET  /api/TaxErrorNotification/invoice/{invoiceId}
```

**Luồng hoàn chỉnh sẽ là:**

```
1. POST /api/TaxErrorNotification/create          [NEW - CẦN IMPLEMENT]
   ↓ (Lưu draft vào DB)
   
2. POST /api/TaxErrorNotification/preview         [ĐÃ CÓ]
   ↓ (Generate XML & Hash)
   
3. [FE] Ký số bằng USB Token
   ↓
   
4. POST /api/TaxErrorNotification/submit          [ĐÃ CÓ]
   ↓ (Gửi lên CQT)
   
5. GET  /api/TaxErrorNotification/invoice/{id}    [ĐÃ CÓ]
   (Tra cứu lịch sử thông báo)
```

---

## ✅ VALIDATION RULES (Backend phải check)

### **Header Validation:**
- ✅ `notificationNumber`: Required, unique, format `TB-DDMMYYYY_HHMM`
- ✅ `taxCode`: Required, phải khớp với company's tax code
- ✅ `place`: Required, min 2 characters
- ✅ `createdDate`: Required, không được là ngày tương lai

### **Details Validation:**
- ✅ `invoiceId`: Required, phải tồn tại trong DB
- ✅ `errorType`: Required, phải là 1, 2, 3, hoặc 4
- ✅ `reason`: Required, min 10 characters
- ✅ `taxAuthorityCode`: Required, phải khớp với invoice's taxAuthorityCode
- ✅ Mỗi `invoiceId` chỉ được xuất hiện 1 lần trong 1 thông báo

### **Business Logic:**
- ✅ Không được tạo thông báo cho invoice đã bị hủy
- ✅ Không được tạo duplicate notification cho cùng 1 invoice (check by invoiceId + errorType)
- ⚠️ (Tùy chọn) Có thể limit số lần sửa/hủy cho 1 invoice

---

## 🧪 TEST CASES ĐỀ XUẤT

### **Test Case 1: Create Success**
**Request:**
```json
{
  "header": {
    "notificationType": "Thông báo hủy/giải trình của Người nộp thuế",
    "notificationNumber": "TB-14012026_1430",
    "taxAuthority": "Cục Thuế TP. Hà Nội",
    "taxpayerName": "Công ty ABC",
    "taxCode": "0316882091",
    "createdDate": "2026-01-14",
    "place": "Hà Nội"
  },
  "details": [
    {
      "stt": 1,
      "invoiceId": 148,
      "templateCode": "1",
      "serial": "1C25TAA",
      "invoiceNumber": "0000148",
      "invoiceDate": "2026-01-10",
      "invoiceType": "Hóa đơn gốc (theo NĐ123/2020/NĐ-CP)",
      "errorType": 1,
      "reason": "Thông tin khách hàng không chính xác",
      "taxAuthorityCode": "TCT/ABC123..."
    }
  ]
}
```
**Expected:** 201 Created với notificationId

### **Test Case 2: Missing Required Field**
**Request:** Thiếu `place`
**Expected:** 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "header.place",
      "message": "Nơi lập là bắt buộc"
    }
  ]
}
```

### **Test Case 3: Invalid Invoice ID**
**Request:** `invoiceId: 99999` (không tồn tại)
**Expected:** 400 Bad Request
```json
{
  "success": false,
  "message": "Invoice ID 99999 không tồn tại"
}
```

### **Test Case 4: Duplicate Notification Number**
**Request:** `notificationNumber` đã tồn tại
**Expected:** 409 Conflict
```json
{
  "success": false,
  "message": "Số thông báo TB-14012026_1430 đã tồn tại"
}
```

---

## 📊 RESPONSE STATUS CODES

| Code | Meaning | Usage |
|------|---------|-------|
| **201** | Created | Tạo thông báo thành công |
| **400** | Bad Request | Validation error, missing fields |
| **401** | Unauthorized | Token invalid/expired |
| **404** | Not Found | Invoice ID không tồn tại |
| **409** | Conflict | Duplicate notification number |
| **500** | Server Error | Database error, unexpected error |

---

## 🔒 SECURITY & PERMISSIONS

### **Role Requirements:**
- ✅ **Accountant (Role = 3)**: Có thể tạo thông báo sai sót
- ✅ **Admin (Role = 1)**: Full access
- ❌ **Sales (Role = 4)**: Không được phép

### **Authorization Logic:**
```csharp
// Check user role from JWT token
if (currentUser.RoleID != 1 && currentUser.RoleID != 3) 
{
    return Unauthorized("Bạn không có quyền tạo thông báo sai sót");
}

// Check company ownership
if (invoice.CompanyID != currentUser.CompanyID) 
{
    return Forbidden("Hóa đơn không thuộc công ty của bạn");
}
```

---

## 📝 NOTES CHO BACKEND

### **1. Data Mapping:**
- Frontend gửi `errorType` dạng số (1-4)
- Backend nên map thành enum:
  ```csharp
  public enum ErrorNotificationType 
  {
      Cancel = 1,      // Hủy
      Adjust = 2,      // Điều chỉnh
      Replace = 3,     // Thay thế
      Explain = 4      // Giải trình
  }
  ```

### **2. NotificationNumber Generation:**
- Frontend đã generate format `TB-DDMMYYYY_HHMM`
- Backend NÊN validate format và uniqueness
- Hoặc backend có thể tự generate và override FE's value

### **3. Transaction Safety:**
- Nên dùng transaction khi insert vào 2 tables
- Rollback nếu insert vào `TaxErrorNotificationDetails` fail

### **4. Audit Trail:**
- Log mọi thao tác create/update/delete
- Lưu UserID, timestamp, IP address

### **5. Future Enhancement:**
- Support multiple invoices trong 1 notification (hiện tại FE chỉ support 1)
- Support file attachments (PDF, images)
- Support workflow: Draft → Pending Approval → Approved → Signed → Submitted

---

## 🎯 PRIORITY & TIMELINE (UPDATED)

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| ✅ ~~Create API endpoint~~ | 🔴 High | 2 hours | ✅ Done (cần sửa) |
| Sửa request body (thêm 6 fields) | 🔴 High | 1 hour | ⏳ Pending |
| Xóa taxAuthorityCode param | 🔴 High | 0.5 hour | ⏳ Pending |
| Thêm validation rules | 🟡 Medium | 1 hour | ⏳ Pending |
| Fix response structure | 🟡 Medium | 0.5 hour | ⏳ Pending |
| Unit tests | 🟡 Medium | 1 hour | ⏳ Pending |
| Integration testing với FE | 🔴 High | 1 hour | ⏳ Pending |

**Total Estimate:** ~5 hours (API đã có, chỉ cần sửa)

---

## 📞 CONTACT

**Frontend Lead:** Frontend Team  
**Question/Clarification:** Slack #backend-support hoặc email backend-team@company.com

**Related Files:**
- `/src/components/TaxErrorNotificationModal_v2.tsx`
- `/src/services/taxErrorNotificationService.ts`
- `/docs/TAX_ERROR_NOTIFICATION_API_REQUIREMENTS.md` (file này)

---

## ✅ CHECKLIST CHO BACKEND

### **PHASE 1: Fix API (URGENT)**
- [ ] Thêm 6 fields header vào request model (notificationType, notificationNumber, taxAuthority, taxpayerName, taxCode, createdDate)
- [ ] Xóa `taxAuthorityCode` param khỏi top-level request body
- [ ] Auto-query taxAuthorityCode từ Invoices table
- [ ] Validate errorType range (1-4)
- [ ] Validate reason min length (10 chars)
- [ ] Validate notificationNumber unique
- [ ] Fix response structure theo mẫu

### **PHASE 2: Testing & Deploy**
- [ ] Update Swagger documentation
- [ ] Test với Postman
- [ ] Deploy lên DEV environment
- [ ] Thông báo FE để integration testing
- [ ] Code review & merge
- [ ] Deploy lên PROD

---

## 🔄 CHANGELOG

**Version 2.0 (14/01/2026):**
- ✅ BE đã tạo endpoint: `POST /api/Tax/Create-Form04SS-Draft`
- ⚠️ Phát hiện API thiếu 6 fields header quan trọng
- ⚠️ Field `taxAuthorityCode` ở sai vị trí (cần xóa)
- 📝 Đã ghi chú chi tiết các vấn đề cần sửa

**Version 1.0 (14/01/2026):**
- 📄 Tạo tài liệu yêu cầu API ban đầu
- 📋 Define database schema
- 📝 Viết test cases

---

**Last Updated:** 14/01/2026 - Version 2.0 (API Review)
