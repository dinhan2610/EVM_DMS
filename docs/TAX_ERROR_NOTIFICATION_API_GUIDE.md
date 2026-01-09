# 🔔 BACKEND API - TAX ERROR NOTIFICATION (THÔNG BÁO SAI SÓT - MẪU 04/SS-HĐĐT)

## 📋 **TỔNG QUAN**

API để lập và gửi thông báo sai sót hóa đơn điện tử theo **Mẫu số 04/SS-HĐĐT** theo quy định của Tổng cục Thuế.

---

## 🎯 **YÊU CẦU CHỨC NĂNG**

### **Use Case:**
1. Người dùng mở Invoice Detail page
2. Click nút "Thao tác" → chọn "Gửi thông báo sai sót (04)"
3. Modal mở với form:
   - **Read-only:** Invoice Number, Serial, Date, Tax Authority Code
   - **Input:** Place (Địa danh), Notification Type (1-4), Reason (Lý do)
4. Workflow:
   - **Step 1:** Preview XML/Hash
   - **Step 2:** Digital Signature (frontend simulation)
   - **Step 3:** Submit to Tax Authority

---

## 🚀 **API ENDPOINTS**

### **1️⃣ POST /api/TaxErrorNotification/preview**

**Mô tả:** Tạo preview XML và Hash để chuẩn bị ký số

**Authentication:** ✅ Required (Bearer Token)

**Request Body:**

```json
{
  "invoiceId": 123,
  "place": "Hà Nội",
  "notificationType": 1,
  "reason": "Lỗi thông tin khách hàng trên hóa đơn"
}
```

**Request Schema:**

| Field              | Type    | Required | Description                                           | Valid Values         |
|-------------------|---------|----------|-------------------------------------------------------|----------------------|
| invoiceId         | number  | ✅       | ID hóa đơn cần lập thông báo                          | > 0                  |
| place             | string  | ✅       | Địa danh nơi lập thông báo                            | 1-100 chars          |
| notificationType  | number  | ✅       | Tính chất sai sót                                     | 1, 2, 3, 4           |
| reason            | string  | ✅       | Lý do sai sót chi tiết                                | 10-500 chars         |

**Notification Type Values:**

| Value | Label          | Description                          |
|-------|----------------|--------------------------------------|
| 1     | Hủy hóa đơn    | Thông báo hủy hóa đơn               |
| 2     | Điều chỉnh     | Thông báo điều chỉnh thông tin       |
| 3     | Thay thế       | Thông báo thay thế hóa đơn          |
| 4     | Giải trình     | Thông báo giải trình                 |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Tạo preview thành công",
  "data": {
    "notificationCode": "TB04-0000001-1736402400000",
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<TBSaiSot>\n  <TTChung>\n    <PBan>2.0.0</PBan>\n    <MauSoTBSS>04/SS-HĐĐT</MauSoTBSS>\n    <Ten>THÔNG BÁO SAI SÓT HÓA ĐƠN</Ten>\n    <DLap>Hà Nội</DLap>\n    <NLap>2026-01-09</NLap>\n  </TTChung>\n  <TTHDLQuan>\n    <SHDon>0000001</SHDon>\n    <KHMSHDon>K24TNT</KHMSHDon>\n    <NHDon>2024-12-25</NHDon>\n    <MCQTCap>CKS24A1B2C3D4E5</MCQTCap>\n  </TTHDLQuan>\n  <NoiDung>\n    <TChatSaiSot>1</TChatSaiSot>\n    <LDo>Lỗi thông tin khách hàng trên hóa đơn</LDo>\n  </NoiDung>\n</TBSaiSot>",
    "hash": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6",
    "createdAt": "2026-01-09T10:30:00Z"
  }
}
```

**Response Schema:**

| Field                | Type    | Description                                    |
|---------------------|---------|------------------------------------------------|
| success             | boolean | Trạng thái thành công                          |
| message             | string  | Thông báo kết quả                              |
| data.notificationCode | string | Mã thông báo duy nhất (để tracking)           |
| data.xml            | string  | XML content theo chuẩn CQT (Mẫu 04)           |
| data.hash           | string  | Hash của XML để ký số                          |
| data.createdAt      | string  | Thời gian tạo (ISO 8601)                       |

**Error Responses:**

```json
// 400 Bad Request - Invalid input
{
  "success": false,
  "message": "Lý do phải có ít nhất 10 ký tự",
  "errorCode": "INVALID_REASON"
}

// 404 Not Found - Invoice not found
{
  "success": false,
  "message": "Không tìm thấy hóa đơn với ID: 123",
  "errorCode": "INVOICE_NOT_FOUND"
}

// 400 Bad Request - Invoice not issued yet
{
  "success": false,
  "message": "Hóa đơn chưa được phát hành. Không thể lập thông báo sai sót",
  "errorCode": "INVOICE_NOT_ISSUED"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Lỗi hệ thống khi tạo XML",
  "errorCode": "INTERNAL_ERROR"
}
```

---

### **2️⃣ POST /api/TaxErrorNotification/submit**

**Mô tả:** Gửi thông báo sai sót đã ký số đến Cơ quan Thuế

**Authentication:** ✅ Required (Bearer Token)

**Request Body:**

```json
{
  "invoiceId": 123,
  "notificationCode": "TB04-0000001-1736402400000",
  "signature": "MIIEvQYJKoZIhvcNAQcCoIIErjCCBKoCAQExDzAN...",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<TBSaiSot>...</TBSaiSot>"
}
```

**Request Schema:**

| Field              | Type    | Required | Description                                  |
|-------------------|---------|----------|----------------------------------------------|
| invoiceId         | number  | ✅       | ID hóa đơn                                   |
| notificationCode  | string  | ✅       | Mã thông báo (từ preview response)           |
| signature         | string  | ✅       | Chữ ký số điện tử (Base64)                   |
| xml               | string  | ✅       | XML content đã được ký                       |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Gửi thông báo sai sót thành công",
  "data": {
    "notificationId": 456,
    "notificationCode": "TB04-0000001-1736402400000",
    "taxAuthorityResponse": "TB01_RECEIVED",
    "submittedAt": "2026-01-09T10:35:00Z"
  }
}
```

**Response Schema:**

| Field                        | Type    | Description                                    |
|-----------------------------|---------|------------------------------------------------|
| success                     | boolean | Trạng thái thành công                          |
| message                     | string  | Thông báo kết quả                              |
| data.notificationId         | number  | ID thông báo trong database                    |
| data.notificationCode       | string  | Mã thông báo                                   |
| data.taxAuthorityResponse   | string  | Mã phản hồi từ CQT                             |
| data.submittedAt            | string  | Thời gian gửi (ISO 8601)                       |

**Error Responses:**

```json
// 400 Bad Request - Invalid signature
{
  "success": false,
  "message": "Chữ ký số không hợp lệ",
  "errorCode": "INVALID_SIGNATURE"
}

// 404 Not Found - Notification code not found
{
  "success": false,
  "message": "Không tìm thấy thông báo với mã: TB04-0000001-1736402400000",
  "errorCode": "NOTIFICATION_NOT_FOUND"
}

// 500 Internal Server Error - Tax Authority API error
{
  "success": false,
  "message": "Lỗi kết nối với API Cơ quan Thuế",
  "errorCode": "TAX_API_ERROR"
}
```

---

### **3️⃣ GET /api/TaxErrorNotification/invoice/{invoiceId}**

**Mô tả:** Lấy danh sách thông báo sai sót của 1 hóa đơn (Optional - để hiển thị lịch sử)

**Authentication:** ✅ Required (Bearer Token)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [
    {
      "notificationId": 456,
      "notificationCode": "TB04-0000001-1736402400000",
      "notificationType": 1,
      "notificationTypeName": "Hủy hóa đơn",
      "reason": "Lỗi thông tin khách hàng",
      "status": "SUBMITTED",
      "taxAuthorityResponse": "TB01_RECEIVED",
      "createdAt": "2026-01-09T10:30:00Z",
      "submittedAt": "2026-01-09T10:35:00Z"
    }
  ]
}
```

---

## 🗄️ **DATABASE REQUIREMENTS**

### **Bảng: TaxErrorNotification**

```sql
CREATE TABLE TaxErrorNotification (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    InvoiceID INT NOT NULL,
    NotificationCode NVARCHAR(100) NOT NULL UNIQUE,
    NotificationType INT NOT NULL,  -- 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
    Place NVARCHAR(100) NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    XMLContent NVARCHAR(MAX) NOT NULL,
    Hash NVARCHAR(200) NOT NULL,
    Signature NVARCHAR(MAX) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, SIGNED, SUBMITTED, ACCEPTED, REJECTED
    TaxAuthorityResponse NVARCHAR(100) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    SubmittedAt DATETIME NULL,
    CreatedBy INT NOT NULL,
    
    CONSTRAINT FK_TaxErrorNotification_Invoice 
        FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID),
    CONSTRAINT FK_TaxErrorNotification_User 
        FOREIGN KEY (CreatedBy) REFERENCES [User](UserID)
);

-- Index để query theo invoice
CREATE INDEX IX_TaxErrorNotification_InvoiceID 
ON TaxErrorNotification(InvoiceID);

-- Index để query theo notification code
CREATE UNIQUE INDEX IX_TaxErrorNotification_NotificationCode 
ON TaxErrorNotification(NotificationCode);
```

**Status Values:**

| Status     | Description                                |
|------------|--------------------------------------------|
| DRAFT      | Mới tạo preview, chưa ký                   |
| SIGNED     | Đã ký số, chưa gửi CQT                     |
| SUBMITTED  | Đã gửi CQT, chờ xử lý                      |
| ACCEPTED   | CQT đã tiếp nhận và xử lý thành công       |
| REJECTED   | CQT từ chối (lỗi)                          |

---

## 💻 **BACKEND IMPLEMENTATION GUIDE**

### **Controller: TaxErrorNotificationController.cs**

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text;

namespace EIMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaxErrorNotificationController : ControllerBase
    {
        private readonly ITaxErrorNotificationService _service;
        private readonly ILogger<TaxErrorNotificationController> _logger;

        public TaxErrorNotificationController(
            ITaxErrorNotificationService service,
            ILogger<TaxErrorNotificationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Step 1: Preview XML/Hash
        /// </summary>
        [HttpPost("preview")]
        public async Task<IActionResult> Preview([FromBody] PreviewRequest request)
        {
            try
            {
                // ==================== VALIDATION ====================
                if (request.InvoiceId <= 0)
                    return BadRequest(new { success = false, message = "Invoice ID không hợp lệ", errorCode = "INVALID_INVOICE_ID" });

                if (string.IsNullOrWhiteSpace(request.Place) || request.Place.Length > 100)
                    return BadRequest(new { success = false, message = "Địa danh không hợp lệ", errorCode = "INVALID_PLACE" });

                if (request.NotificationType < 1 || request.NotificationType > 4)
                    return BadRequest(new { success = false, message = "Tính chất sai sót không hợp lệ", errorCode = "INVALID_NOTIFICATION_TYPE" });

                if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length < 10 || request.Reason.Length > 500)
                    return BadRequest(new { success = false, message = "Lý do phải từ 10-500 ký tự", errorCode = "INVALID_REASON" });

                // ==================== GET INVOICE ====================
                var invoice = await _service.GetInvoiceByIdAsync(request.InvoiceId);
                if (invoice == null)
                    return NotFound(new { success = false, message = $"Không tìm thấy hóa đơn với ID: {request.InvoiceId}", errorCode = "INVOICE_NOT_FOUND" });

                // Check if invoice is issued
                if (invoice.InvoiceNumber <= 0 || invoice.InvoiceStatusID < 2)
                    return BadRequest(new { success = false, message = "Hóa đơn chưa được phát hành", errorCode = "INVOICE_NOT_ISSUED" });

                // ==================== GENERATE XML ====================
                var notificationCode = GenerateNotificationCode(invoice.InvoiceNumber);
                var xml = GenerateXml(invoice, request.Place, request.NotificationType, request.Reason);
                var hash = ComputeHash(xml);

                // ==================== SAVE TO DATABASE ====================
                var userId = GetCurrentUserId();
                var notificationId = await _service.SaveNotificationAsync(new TaxErrorNotification
                {
                    InvoiceID = request.InvoiceId,
                    NotificationCode = notificationCode,
                    NotificationType = request.NotificationType,
                    Place = request.Place,
                    Reason = request.Reason,
                    XMLContent = xml,
                    Hash = hash,
                    Status = "DRAFT",
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow
                });

                // ==================== RESPONSE ====================
                return Ok(new
                {
                    success = true,
                    message = "Tạo preview thành công",
                    data = new
                    {
                        notificationCode,
                        xml,
                        hash,
                        createdAt = DateTime.UtcNow.ToString("o")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification preview");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errorCode = "INTERNAL_ERROR" });
            }
        }

        /// <summary>
        /// Step 2: Submit to Tax Authority
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] SubmitRequest request)
        {
            try
            {
                // ==================== VALIDATION ====================
                if (string.IsNullOrWhiteSpace(request.NotificationCode))
                    return BadRequest(new { success = false, message = "Notification code không hợp lệ", errorCode = "INVALID_NOTIFICATION_CODE" });

                if (string.IsNullOrWhiteSpace(request.Signature))
                    return BadRequest(new { success = false, message = "Chữ ký số không hợp lệ", errorCode = "INVALID_SIGNATURE" });

                // ==================== GET NOTIFICATION ====================
                var notification = await _service.GetNotificationByCodeAsync(request.NotificationCode);
                if (notification == null)
                    return NotFound(new { success = false, message = "Không tìm thấy thông báo", errorCode = "NOTIFICATION_NOT_FOUND" });

                // ==================== UPDATE SIGNATURE ====================
                notification.Signature = request.Signature;
                notification.Status = "SIGNED";
                await _service.UpdateNotificationAsync(notification);

                // ==================== SUBMIT TO TAX AUTHORITY ====================
                var taxResponse = await _service.SubmitToTaxAuthorityAsync(notification);

                // ==================== UPDATE STATUS ====================
                notification.Status = "SUBMITTED";
                notification.TaxAuthorityResponse = taxResponse.ResponseCode;
                notification.SubmittedAt = DateTime.UtcNow;
                await _service.UpdateNotificationAsync(notification);

                // ==================== RESPONSE ====================
                return Ok(new
                {
                    success = true,
                    message = "Gửi thông báo sai sót thành công",
                    data = new
                    {
                        notificationId = notification.NotificationID,
                        notificationCode = notification.NotificationCode,
                        taxAuthorityResponse = taxResponse.ResponseCode,
                        submittedAt = notification.SubmittedAt?.ToString("o")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting notification to tax authority");
                return StatusCode(500, new { success = false, message = "Lỗi gửi CQT", errorCode = "TAX_API_ERROR" });
            }
        }

        // ==================== HELPER METHODS ====================

        private string GenerateNotificationCode(int invoiceNumber)
        {
            return $"TB04-{invoiceNumber:D7}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        }

        private string GenerateXml(Invoice invoice, string place, int notificationType, string reason)
        {
            var xml = $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<TBSaiSot>
  <TTChung>
    <PBan>2.0.0</PBan>
    <MauSoTBSS>04/SS-HĐĐT</MauSoTBSS>
    <Ten>THÔNG BÁO SAI SÓT HÓA ĐƠN</Ten>
    <DLap>{place}</DLap>
    <NLap>{DateTime.UtcNow:yyyy-MM-dd}</NLap>
  </TTChung>
  <TTHDLQuan>
    <SHDon>{invoice.InvoiceNumber:D7}</SHDon>
    <KHMSHDon>{invoice.Template?.Serial}</KHMSHDon>
    <NHDon>{invoice.SignDate:yyyy-MM-dd}</NHDon>
    <MCQTCap>{invoice.TaxAuthorityCode}</MCQTCap>
  </TTHDLQuan>
  <NoiDung>
    <TChatSaiSot>{notificationType}</TChatSaiSot>
    <LDo>{System.Security.SecurityElement.Escape(reason)}</LDo>
  </NoiDung>
</TBSaiSot>";

            return xml;
        }

        private string ComputeHash(string xml)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(xml);
                var hashBytes = sha256.ComputeHash(bytes);
                return Convert.ToBase64String(hashBytes);
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 1;
        }
    }

    // ==================== REQUEST DTOs ====================

    public class PreviewRequest
    {
        public int InvoiceId { get; set; }
        public string Place { get; set; } = "";
        public int NotificationType { get; set; }
        public string Reason { get; set; } = "";
    }

    public class SubmitRequest
    {
        public int InvoiceId { get; set; }
        public string NotificationCode { get; set; } = "";
        public string Signature { get; set; } = "";
        public string Xml { get; set; } = "";
    }
}
```

---

## 🧪 **TESTING**

### **Postman Collection:**

```json
{
  "name": "Tax Error Notification",
  "item": [
    {
      "name": "1. Preview",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/TaxErrorNotification/preview",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invoiceId\": 123,\n  \"place\": \"Hà Nội\",\n  \"notificationType\": 1,\n  \"reason\": \"Lỗi thông tin khách hàng trên hóa đơn\"\n}"
        }
      }
    },
    {
      "name": "2. Submit",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/TaxErrorNotification/submit",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invoiceId\": 123,\n  \"notificationCode\": \"TB04-0000001-1736402400000\",\n  \"signature\": \"MIIEvQYJKoZIhvcNAQcCoIIErjCCBKoCAQExDzAN...\",\n  \"xml\": \"<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>\\n<TBSaiSot>...</TBSaiSot>\"\n}"
        }
      }
    }
  ]
}
```

---

## 📂 **FILES CREATED**

### **Frontend:**
1. ✅ `/src/components/TaxErrorNotificationModal.tsx` - Modal component (680 lines)
2. ✅ `/src/services/taxErrorNotificationService.ts` - API service (200 lines)
3. ✅ `/src/page/InvoiceDetail.tsx` - Updated with Actions menu + Modal integration

### **Backend (TODO):**
1. ⏳ `/Controllers/TaxErrorNotificationController.cs` - API controller
2. ⏳ `/Services/ITaxErrorNotificationService.cs` - Service interface
3. ⏳ `/Services/TaxErrorNotificationService.cs` - Service implementation
4. ⏳ `/Models/TaxErrorNotification.cs` - Database model
5. ⏳ Database migration script

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Database migration (tạo bảng TaxErrorNotification)
- [ ] Deploy backend API endpoints
- [ ] Test Preview API với Postman
- [ ] Test Submit API với Postman
- [ ] Frontend integration testing
- [ ] Digital signature plugin integration (production)
- [ ] Tax Authority API integration (production)
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation update

---

**Created:** 2026-01-09  
**Version:** 1.0  
**Status:** 🚀 Ready for Backend Implementation  
**Estimated Time:** 2-3 days development + 1 day testing
