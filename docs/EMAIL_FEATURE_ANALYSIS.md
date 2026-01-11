# 📧 Phân tích Chức năng Gửi Email Hóa Đơn

## 📊 Tổng quan

Hệ thống **ĐÃ CÓ** component giao diện gửi email (`SendInvoiceEmailModal`) nhưng **CHƯA TÍCH HỢP** API backend vào InvoiceManagement.

---

## ✅ Những gì ĐÃ CÓ

### 1. **UI Component - SendInvoiceEmailModal**
**File:** `src/components/SendInvoiceEmailModal.tsx`

Component Modal đầy đủ để gửi email hóa đơn:

```typescript
interface EmailData {
  recipientName: string
  email: string
  ccEmails: string[]
  bccEmails: string[]
  attachments: File[]
  includeXml: boolean
  disableSms: boolean
  language: string
}
```

**Tính năng UI:**
- ✅ Nhập email người nhận
- ✅ CC/BCC emails
- ✅ Upload file đính kèm (max 5MB)
- ✅ Hiển thị thông tin hóa đơn
- ✅ Giao diện đẹp, user-friendly

**Đang được sử dụng ở:**
- ✅ `CreateVatInvoice.tsx`
- ✅ `CreateAdjustmentInvoice.tsx`
- ✅ `CreateReplacementInvoice.tsx`
- ✅ `CreateSalesOrder.tsx`

**NHƯNG:** Chỉ là placeholder, chưa gọi API thật!

---

### 2. **API Endpoint Configuration**
**File:** `src/config/api.config.ts`

```typescript
INVOICE: {
  SEND_EMAIL: (id: number) => `/Invoice/${id}/send-email`,
}
```

✅ Đã định nghĩa endpoint

---

### 3. **Menu Action trong InvoiceManagement**
**File:** `src/page/InvoiceManagement.tsx` (line 270-278)

```typescript
{
  label: 'Gửi email',
  icon: <EmailIcon fontSize="small" />,
  enabled: true, // ✅ Luôn dùng được
  action: () => {
    console.log('Gửi email:', invoice.id) // ⚠️ CHỈ LOG, CHƯA GỌI API
    handleClose()
  },
  color: 'info.main',
  tooltip: 'Gửi hóa đơn qua email cho khách hàng',
}
```

⚠️ **Vấn đề:** Chỉ log console, chưa mở modal hoặc gọi API!

---

## ❌ Những gì CHƯA CÓ

### 1. **API Service Function**
**File:** `src/services/invoiceService.ts`

❌ **THIẾU hoàn toàn** function `sendEmail()`:

```typescript
// ❌ KHÔNG TÌM THẤY
const sendEmail = async (
  invoiceId: number, 
  emailData: SendEmailRequest
): Promise<void> => {
  // ...
}
```

---

### 2. **Email Request Type**
Cần định nghĩa interface cho API request:

```typescript
export interface SendEmailRequest {
  emailTemplateId?: number
  recipientEmail: string
  ccEmails?: string[]
  bccEmails?: string[]
  customMessage?: string
  includeXml?: boolean
  includePdf?: boolean
  language?: string
  externalAttachmentUrls?: string[]
}
```

---

### 3. **Modal Integration trong InvoiceManagement**
InvoiceManagement chưa có:
- ❌ Import `SendInvoiceEmailModal`
- ❌ State để mở/đóng modal
- ❌ Handler để gửi email

---

## 🔍 So sánh API Backend với yêu cầu

### API Specification (từ user)
```bash
POST http://159.223.64.31/api/Email/133/send-email

Body:
{
  "emailTemplateId": 0,
  "recipientEmail": "string",
  "ccEmails": ["string"],
  "bccEmails": ["string"],
  "customMessage": "string",
  "includeXml": true,
  "includePdf": true,
  "language": "string",
  "externalAttachmentUrls": ["string"]
}
```

### ⚠️ Phát hiện BẤT NHẤT QUÁN

**1. URL Endpoint khác nhau:**
- Frontend config: `/Invoice/{id}/send-email` ✅
- Backend actual: `/api/Email/{id}/send-email` ⚠️

**Lý do:** Có thể backend có 2 endpoint:
- `/api/Invoice/{id}/send-email` (Invoice controller)
- `/api/Email/{id}/send-email` (Email controller)

**2. Request Body:**
Backend API có trường **bổ sung** mà UI chưa hỗ trợ:
- `emailTemplateId` - Chọn template email
- `externalAttachmentUrls` - File đính kèm từ URL

**3. File Attachments:**
- UI hiện tại: Upload `File[]` object (multipart/form-data)
- Backend API: Không thấy trường cho file upload, chỉ có `externalAttachmentUrls`

⚠️ **Cần làm rõ:** Backend có nhận file upload không?

---

## 🎯 Đánh giá API Specification

### ✅ Những điểm ĐÚNG:

1. **Invoice ID trong URL**: `/{id}/send-email` ✅
2. **Recipient Email**: Required field ✅
3. **CC/BCC**: Support multiple emails ✅
4. **Include XML/PDF**: Flags để đính kèm ✅
5. **Language**: i18n support ✅
6. **Custom Message**: Override default message ✅

### ⚠️ Những điểm CẦN KIỂM TRA:

1. **Email Template ID:**
   - Giá trị `0` có nghĩa là gì? Default template?
   - Cần list template IDs available không?

2. **External Attachment URLs:**
   - Format URL như thế nào?
   - Có giới hạn số lượng không?
   - Có validate URL accessibility không?

3. **Response:**
   - API trả về gì khi thành công?
   - Error handling như thế nào?

---

## 📋 Checklist Cần làm để Tích hợp

### Backend API (Cần dev backend xác nhận)

- [ ] Xác định endpoint chính xác: `/api/Invoice/{id}/send-email` hay `/api/Email/{id}/send-email`?
- [ ] Xác nhận request body structure
- [ ] Kiểm tra cách upload file attachments (multipart hay URL?)
- [ ] Test API với Postman/Thunder Client
- [ ] Lấy response structure khi success/error

### Frontend Implementation

#### 1. **Update invoiceService.ts**
```typescript
// Thêm interface
export interface SendEmailRequest {
  emailTemplateId?: number
  recipientEmail: string
  ccEmails?: string[]
  bccEmails?: string[]
  customMessage?: string
  includeXml?: boolean
  includePdf?: boolean
  language?: string
  externalAttachmentUrls?: string[]
}

// Thêm function
export const sendInvoiceEmail = async (
  invoiceId: number,
  data: SendEmailRequest
): Promise<void> => {
  try {
    await axios.post(
      `/api/Invoice/${invoiceId}/send-email`, // hoặc /api/Email/
      data,
      { headers: getAuthHeaders() }
    )
  } catch (error) {
    return handleApiError(error, 'Send email failed')
  }
}
```

#### 2. **Update InvoiceManagement.tsx**

```typescript
// Import modal
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'

// Add state
const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null)

// Update menu action
{
  label: 'Gửi email',
  icon: <EmailIcon fontSize="small" />,
  enabled: true,
  action: () => {
    setSelectedInvoiceForEmail(invoice)
    setSendEmailModalOpen(true)
    handleClose()
  },
  color: 'info.main',
  tooltip: 'Gửi hóa đơn qua email cho khách hàng',
}

// Add handler
const handleSendEmail = async (emailData: EmailData) => {
  if (!selectedInvoiceForEmail) return
  
  try {
    await invoiceService.sendInvoiceEmail(selectedInvoiceForEmail.id, {
      recipientEmail: emailData.email,
      ccEmails: emailData.ccEmails,
      bccEmails: emailData.bccEmails,
      customMessage: '',
      includeXml: emailData.includeXml,
      includePdf: true,
      language: emailData.language,
      // Handle file attachments...
    })
    
    setSnackbar({
      open: true,
      message: `✅ Đã gửi hóa đơn qua email: ${emailData.email}`,
      severity: 'success',
    })
  } catch (error) {
    setSnackbar({
      open: true,
      message: `❌ Lỗi gửi email: ${error.message}`,
      severity: 'error',
    })
  }
}

// Add modal
<SendInvoiceEmailModal
  open={sendEmailModalOpen}
  onClose={() => setSendEmailModalOpen(false)}
  onSend={handleSendEmail}
  invoiceData={{
    invoiceNumber: selectedInvoiceForEmail?.invoiceNumber,
    // ...
  }}
/>
```

#### 3. **Update SendInvoiceEmailModal.tsx** (nếu cần)

- Thêm trường `emailTemplateId` dropdown
- Xử lý file upload (nếu backend support)
- Map `File[]` sang `externalAttachmentUrls` (nếu cần)

---

## 🔧 Gợi ý Tối ưu

### 1. **Email Template Selection**
Thêm dropdown để chọn email template:
```typescript
const [emailTemplates, setEmailTemplates] = useState([
  { id: 0, name: 'Mặc định' },
  { id: 1, name: 'Template chính thức' },
  { id: 2, name: 'Template nhắc nở' },
])
```

### 2. **Pre-fill Customer Email**
Tự động điền email khách hàng từ invoice:
```typescript
const [email, setEmail] = useState(invoiceData.customerEmail || '')
```

### 3. **Email History**
Thêm tab "Lịch sử gửi email" để tracking:
- Thời gian gửi
- Email người nhận
- Trạng thái (Thành công/Thất bại)
- Nội dung email

### 4. **Batch Email**
Cho phép gửi email hàng loạt cho nhiều hóa đơn:
```typescript
const handleBatchEmail = async (invoiceIds: string[]) => {
  for (const id of invoiceIds) {
    await sendInvoiceEmail(id, emailData)
  }
}
```

---

## 🚀 Kế hoạch Triển khai

### Phase 1: Basic Integration (1-2 ngày)
- [ ] Xác nhận API endpoint với backend
- [ ] Implement `sendInvoiceEmail()` trong service
- [ ] Tích hợp modal vào InvoiceManagement
- [ ] Test gửi email đơn giản

### Phase 2: Full Features (2-3 ngày)
- [ ] Email template selection
- [ ] File attachments handling
- [ ] Pre-fill customer data
- [ ] Error handling + retry logic

### Phase 3: Advanced Features (3-5 ngày)
- [ ] Email history tracking
- [ ] Batch email sending
- [ ] Email preview before send
- [ ] Scheduled email sending

---

## 📝 Kết luận

### Trạng thái hiện tại:
- ✅ **UI Component**: Hoàn chỉnh, đẹp
- ✅ **API Config**: Đã định nghĩa endpoint
- ⚠️ **Service Layer**: **THIẾU hoàn toàn**
- ⚠️ **Integration**: **CHƯA TÍCH HỢP** vào InvoiceManagement

### API Backend:
- ✅ Endpoint structure hợp lý
- ✅ Request body đầy đủ
- ⚠️ Cần xác nhận: Endpoint URL chính xác
- ⚠️ Cần xác nhận: File upload mechanism
- ⚠️ Cần xác nhận: Response structure

### Đánh giá API Specification:
**8.5/10** - Tốt, nhưng cần làm rõ một số chi tiết:
1. Endpoint URL (`/Invoice/` vs `/Email/`)
2. File upload handling
3. Email template IDs list
4. Response format

### Ưu tiên:
1. **CAO**: Tích hợp basic send email (1-2 ngày)
2. **TRUNG**: Test và fix bugs (1 ngày)
3. **THẤP**: Advanced features (optional)

---

**Tác giả:** AI Assistant  
**Ngày:** 11/01/2026  
**Version:** 1.0
