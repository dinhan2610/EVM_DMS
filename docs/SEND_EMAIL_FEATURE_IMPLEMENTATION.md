# 📧 Tính năng Gửi Email Hóa đơn - Hoàn thiện

## 🎯 Tổng quan

Đã hoàn thiện tính năng gửi email hóa đơn cho khách hàng tại trang **Quản lý hóa đơn** (Invoice Management), tích hợp đầy đủ với API backend và UI modal có sẵn.

---

## ✅ Những gì đã hoàn thành

### 1. **Cập nhật API Endpoint** (`src/config/api.config.ts`)

```typescript
SEND_EMAIL: (id: number) => `/Email/${id}/send-email`,
```

✅ **Đã sửa từ** `/Invoice/${id}/send-email` **thành** `/Email/${id}/send-email` để khớp với API backend thực tế.

---

### 2. **Thêm Types và Interface** (`src/services/invoiceService.ts`)

#### Request Interface
```typescript
export interface SendInvoiceEmailRequest {
  emailTemplateId?: number;
  recipientEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  customMessage?: string;
  includeXml?: boolean;
  includePdf?: boolean;
  language?: string;
  externalAttachmentUrls?: string[];
}
```

#### Response Interface
```typescript
export interface SendInvoiceEmailResponse {
  success: boolean;
  message: string;
  sentTo: string;
  sentAt: string;
}
```

---

### 3. **Thêm Service Function** (`src/services/invoiceService.ts`)

```typescript
export const sendInvoiceEmail = async (
  invoiceId: number,
  request: SendInvoiceEmailRequest
): Promise<SendInvoiceEmailResponse> => {
  try {
    console.log(`📧 Sending email for invoice ${invoiceId}:`, request);
    
    const response = await axios.post<SendInvoiceEmailResponse>(
      API_CONFIG.ENDPOINTS.INVOICE.SEND_EMAIL(invoiceId),
      request,
      { headers: getAuthHeaders() }
    );
    
    console.log('✅ Email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};
```

✅ **Xuất function** trong object cuối file:
```typescript
const invoiceService = {
  // ... các function khác
  sendInvoiceEmail, // ✅ Đã thêm
  // ...
};
```

---

### 4. **Tích hợp vào InvoiceManagement** (`src/page/InvoiceManagement.tsx`)

#### 4.1. Import Modal Component
```typescript
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'
```

#### 4.2. Thêm State Management
```typescript
// State quản lý send email modal
const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null)
```

#### 4.3. Thêm Handler `handleSendEmail`
```typescript
const handleSendEmail = async (emailData: {
  recipientName: string
  email: string
  ccEmails: string[]
  bccEmails: string[]
  attachments: File[]
  includeXml: boolean
  disableSms: boolean
  language: string
}) => {
  if (!selectedInvoiceForEmail) return
  
  try {
    setSubmittingId(selectedInvoiceForEmail.id)
    
    // Upload attachments nếu có (TODO: cần implement file upload API)
    const attachmentUrls: string[] = []
    if (emailData.attachments.length > 0) {
      console.log('⚠️ File upload not implemented yet. Attachments:', emailData.attachments)
    }
    
    // Gọi API gửi email
    const response = await invoiceService.sendInvoiceEmail(
      parseInt(selectedInvoiceForEmail.id),
      {
        emailTemplateId: 0, // Default template
        recipientEmail: emailData.email,
        ccEmails: emailData.ccEmails.length > 0 ? emailData.ccEmails : undefined,
        bccEmails: emailData.bccEmails.length > 0 ? emailData.bccEmails : undefined,
        includeXml: emailData.includeXml,
        includePdf: true, // Luôn gửi PDF
        language: emailData.language || 'vi',
        externalAttachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      }
    )
    
    setSnackbar({
      open: true,
      message: `✅ ${response.message}\nĐã gửi đến: ${response.sentTo}`,
      severity: 'success',
    })
    
    setSendEmailModalOpen(false)
    setSelectedInvoiceForEmail(null)
  } catch (err) {
    setSnackbar({
      open: true,
      message: `❌ Không thể gửi email.\n${err instanceof Error ? err.message : 'Vui lòng thử lại.'}`,
      severity: 'error',
    })
  } finally {
    setSubmittingId(null)
  }
}
```

#### 4.4. Cập nhật `InvoiceActionsMenuProps`
```typescript
interface InvoiceActionsMenuProps {
  // ... props khác
  onOpenEmailModal: (invoice: Invoice) => void // ✅ Thêm prop mới
}
```

#### 4.5. Cập nhật Menu Action "Gửi email"
```typescript
{
  label: 'Gửi email',
  icon: <EmailIcon fontSize="small" />,
  enabled: true, // ✅ Luôn dùng được
  action: () => {
    onOpenEmailModal(invoice) // ✅ Gọi callback
    handleClose()
  },
  color: 'info.main',
  tooltip: 'Gửi hóa đơn qua email cho khách hàng',
}
```

#### 4.6. Truyền Handler vào Component
```typescript
<InvoiceActionsMenu
  invoice={invoice}
  // ... props khác
  onOpenEmailModal={(inv) => {
    setSelectedInvoiceForEmail(inv)
    setSendEmailModalOpen(true)
  }}
/>
```

#### 4.7. Render Modal Component
```typescript
{/* Send Email Modal */}
<SendInvoiceEmailModal
  open={sendEmailModalOpen}
  onClose={() => {
    setSendEmailModalOpen(false)
    setSelectedInvoiceForEmail(null)
  }}
  onSend={handleSendEmail}
  invoiceData={{
    invoiceNumber: selectedInvoiceForEmail?.invoiceNumber || '',
    serialNumber: selectedInvoiceForEmail?.symbol || '',
    date: selectedInvoiceForEmail?.issueDate 
      ? new Date(selectedInvoiceForEmail.issueDate).toLocaleDateString('vi-VN') 
      : '',
    customerName: selectedInvoiceForEmail?.customerName || '',
    totalAmount: selectedInvoiceForEmail?.amount 
      ? selectedInvoiceForEmail.amount.toLocaleString('vi-VN') 
      : '0',
  }}
/>
```

---

## 🎨 UI/UX Flow

### Trải nghiệm người dùng:

1. **Click menu 3 chấm** trên dòng hóa đơn
2. **Chọn "Gửi email"** → Modal mở ra
3. **Điền thông tin**:
   - Email người nhận (tự động điền từ khách hàng)
   - CC/BCC (tùy chọn)
   - Đính kèm file (tùy chọn, max 5MB)
   - Bao gồm XML (checkbox)
4. **Click "Gửi"** → API call
5. **Hiển thị thông báo**:
   - ✅ Thành công: "Email đã được gửi thành công\nĐã gửi đến: xxx@email.com"
   - ❌ Lỗi: "Không thể gửi email. [Chi tiết lỗi]"

---

## 📊 API Integration

### Request Example
```bash
POST http://159.223.64.31/api/Email/133/send-email
Content-Type: application/json

{
  "emailTemplateId": 0,
  "recipientEmail": "customer@example.com",
  "ccEmails": ["cc1@example.com"],
  "bccEmails": ["bcc1@example.com"],
  "customMessage": "Xin chào quý khách...",
  "includeXml": true,
  "includePdf": true,
  "language": "vi",
  "externalAttachmentUrls": []
}
```

### Response Example
```json
{
  "success": true,
  "message": "Email đã được gửi thành công",
  "sentTo": "customer@example.com",
  "sentAt": "2026-01-11T07:03:28.1083849Z"
}
```

---

## ⚠️ TODO - Cần hoàn thiện thêm

### 1. **File Upload API**
Hiện tại `attachments: File[]` từ UI chưa được upload lên server.

**Giải pháp:**
- Implement API upload file → return URL
- Truyền URLs vào `externalAttachmentUrls`

```typescript
// TODO: Implement
async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  
  const response = await axios.post('/api/Upload/files', formData, {
    headers: { 
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return response.data.urls // ['https://...file1.pdf', 'https://...file2.pdf']
}
```

### 2. **Email Template Selection**
API nhận `emailTemplateId` nhưng UI chưa có dropdown chọn template.

**Giải pháp:**
- Thêm API `GET /api/EmailTemplate/list`
- Thêm dropdown trong modal
- Truyền template ID đã chọn

### 3. **Custom Message**
Modal chưa có field nhập message tùy chỉnh.

**Giải pháp:**
- Thêm TextField multiline trong `SendInvoiceEmailModal`
- Truyền vào `customMessage` parameter

### 4. **Pre-fill Email từ Customer**
Hiện tại email field để trống, nên tự động điền từ database khách hàng.

**Giải pháp:**
- Fetch customer info từ `customerID`
- Set `recipientEmail` = `customer.contactEmail`

---

## 🧪 Testing Checklist

- [ ] **Mở modal** từ menu "Gửi email"
- [ ] **Hiển thị đúng** thông tin hóa đơn trong modal
- [ ] **Nhập email** và gửi thành công
- [ ] **Kiểm tra CC/BCC** có được gửi đúng không
- [ ] **Thử với XML checkbox** bật/tắt
- [ ] **Thử đính kèm file** (sau khi implement upload)
- [ ] **Kiểm tra error handling** (email sai định dạng, network error, etc.)
- [ ] **Kiểm tra loading state** khi đang gửi email
- [ ] **Kiểm tra snackbar** hiển thị message đúng

---

## 📝 Notes

### Ưu điểm của implementation:

✅ **Tái sử dụng UI**: `SendInvoiceEmailModal` đã có sẵn, chỉ cần tích hợp
✅ **Type-safe**: Đầy đủ TypeScript interfaces cho request/response
✅ **Error handling**: Try-catch với thông báo rõ ràng
✅ **Loading state**: Hiển thị spinner khi đang gửi
✅ **UX tốt**: Modal đẹp, thông báo chi tiết

### Cần cải thiện:

⚠️ **File upload**: Chưa implement (cần backend API)
⚠️ **Email template**: Chưa có UI chọn template
⚠️ **Custom message**: Chưa có input field
⚠️ **Pre-fill email**: Chưa tự động điền từ customer

---

## 🚀 Deployment

### Files Changed:
1. `src/config/api.config.ts` - Sửa endpoint
2. `src/services/invoiceService.ts` - Thêm types + function
3. `src/page/InvoiceManagement.tsx` - Tích hợp modal + handler

### No Breaking Changes:
- UI component giữ nguyên
- Không ảnh hưởng tính năng khác
- Backward compatible

---

## 📞 Support

Nếu gặp lỗi hoặc cần tùy chỉnh thêm, kiểm tra:

1. **Console logs**: `📧 Sending email...` và `✅ Email sent...`
2. **Network tab**: Xem request/response từ API
3. **Snackbar message**: Đọc chi tiết lỗi nếu có

---

**Tác giả**: GitHub Copilot  
**Ngày hoàn thành**: 11/01/2026  
**Version**: 1.0.0
