# 📄 Phân tích API Preview Invoice & Đề xuất Giải pháp

## 🔍 Phân tích API `/api/Invoice/preview-by-invoice/{id}`

### Đặc điểm API

**Endpoint:** `GET /api/Invoice/preview-by-invoice/83`

**Response Type:** `text/html; charset=utf-8`

**Nội dung trả về:**
- ✅ HTML hoàn chỉnh với CSS embedded
- ✅ Đầy đủ thông tin hóa đơn: Mã CQT, số HĐ, ký hiệu, ngày
- ✅ Thông tin người bán/mua chi tiết
- ✅ Bảng items với thuế
- ✅ QR Code base64
- ✅ Chữ ký điện tử
- ✅ Layout print-ready (A4 210mm x 297mm)
- ✅ Background image từ Cloudinary
- ✅ Watermark support

### Ưu điểm

1. **Print-ready**: Format sẵn để in, không cần xử lý thêm
2. **Độc lập**: Không phụ thuộc frontend template
3. **Nhất quán**: Backend control format → consistent across all clients
4. **Performance**: Server-side rendering, HTML cache được
5. **Legal compliance**: Format chuẩn theo quy định pháp luật
6. **Complete**: Có đủ mọi thông tin cần thiết

### Nhược điểm

1. **Không linh hoạt**: Không thể customize UI từ frontend
2. **Hard to integrate**: HTML string khó tích hợp với React components
3. **No interactivity**: Chỉ hiển thị, không có action buttons
4. **SEO**: HTML động không index được
5. **Accessibility**: Khó kiểm soát a11y từ frontend

---

## 🎯 Đề xuất Giải pháp Tối ưu

### Chiến lược: **Dual Approach (2 APIs)**

Sử dụng **2 APIs riêng biệt** cho **2 mục đích khác nhau**:

#### 1️⃣ **Xem chi tiết hóa đơn (Invoice Detail View)**
**Mục đích:** Hiển thị thông tin, cho phép edit, actions

**API:** `GET /api/Invoice/{id}` (JSON)

**Use case:**
- Xem thông tin chi tiết
- Edit hóa đơn (nếu còn nháp)
- Actions: Ký, Gửi CQT, Hủy, etc.
- Tracking status changes
- Audit logs

**Implementation:**
```typescript
// Existing: src/page/InvoiceDetail.tsx
// Uses: invoiceService.getInvoiceById(id)
// Returns: InvoiceListItem (JSON)
// Component: React với full interactivity
```

#### 2️⃣ **Xem trước để in/xuất PDF (Print Preview)**
**Mục đích:** Xem/In hóa đơn với format chính thức

**API:** `GET /api/Invoice/preview-by-invoice/{id}` (HTML)

**Use case:**
- In hóa đơn
- Xuất PDF
- Email hóa đơn cho khách
- Lưu trữ dạng HTML

**Implementation:** Mới - Tạo modal/page riêng

---

## 💻 Implementation Plan

### Phase 1: Tạo Preview Service

```typescript
// src/services/invoicePreviewService.ts

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

/**
 * Get invoice HTML preview for printing/PDF
 */
export const getInvoiceHtmlPreview = async (invoiceId: number): Promise<string> => {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.get<string>(
      `/api/Invoice/preview-by-invoice/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/html',
        },
        responseType: 'text'
      }
    );
    return response.data;
  } catch (error) {
    console.error('[getInvoiceHtmlPreview] Error:', error);
    throw new Error('Failed to load invoice preview');
  }
};

/**
 * Open invoice preview in new window for printing
 */
export const openInvoicePrintWindow = async (invoiceId: number): Promise<void> => {
  const htmlContent = await getInvoiceHtmlPreview(invoiceId);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Auto print after load
  printWindow.onload = () => {
    printWindow.print();
  };
};

/**
 * Download invoice as PDF (using browser print to PDF)
 */
export const downloadInvoiceAsPdf = async (
  invoiceId: number, 
  filename?: string
): Promise<void> => {
  const htmlContent = await getInvoiceHtmlPreview(invoiceId);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Set title for default PDF filename
  printWindow.document.title = filename || `Invoice_${invoiceId}`;
  
  // Show print dialog (user can save as PDF)
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

export default {
  getInvoiceHtmlPreview,
  openInvoicePrintWindow,
  downloadInvoiceAsPdf,
};
```

### Phase 2: Tạo Preview Modal Component

```typescript
// src/components/invoices/InvoicePreviewModal.tsx

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import invoicePreviewService from '@/services/invoicePreviewService';

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  invoiceNumber: string;
}

export default function InvoicePreviewModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
}: InvoicePreviewModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load HTML when modal opens
  useEffect(() => {
    if (open && invoiceId) {
      loadPreview();
    }
  }, [open, invoiceId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const html = await invoicePreviewService.getInvoiceHtmlPreview(invoiceId);
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      await invoicePreviewService.openInvoicePrintWindow(invoiceId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to print');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await invoicePreviewService.downloadInvoiceAsPdf(
        invoiceId,
        `HoaDon_${invoiceNumber}`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        Xem trước hóa đơn #{invoiceNumber}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box p={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && htmlContent && (
          <iframe
            srcDoc={htmlContent}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={`Invoice Preview ${invoiceNumber}`}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button 
          onClick={handlePrint} 
          startIcon={<PrintIcon />}
          variant="outlined"
        >
          In
        </Button>
        <Button 
          onClick={handleDownloadPdf} 
          startIcon={<DownloadIcon />}
          variant="contained"
        >
          Tải PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Phase 3: Integrate vào InvoiceManagement

```typescript
// src/page/InvoiceManagement.tsx

// Add state
const [previewModal, setPreviewModal] = useState({
  open: false,
  invoiceId: 0,
  invoiceNumber: '',
});

// Add handler
const handlePreview = (invoice: Invoice) => {
  setPreviewModal({
    open: true,
    invoiceId: Number(invoice.id),
    invoiceNumber: invoice.invoiceNumber,
  });
};

// Update menu actions
{
  icon: <VisibilityOutlinedIcon fontSize="small" />,
  label: 'Xem chi tiết',
  onClick: () => navigate(`/invoices/${invoice.id}`), // JSON detail
  color: 'primary' as const,
},
{
  icon: <PrintIcon fontSize="small" />,
  label: 'Xem trước & In',
  onClick: () => handlePreview(invoice), // HTML preview
  color: 'default' as const,
}

// Add modal at bottom
<InvoicePreviewModal
  open={previewModal.open}
  onClose={() => setPreviewModal({ ...previewModal, open: false })}
  invoiceId={previewModal.invoiceId}
  invoiceNumber={previewModal.invoiceNumber}
/>
```

---

## 📊 So sánh 2 Approach

| Tiêu chí | JSON API (Detail) | HTML API (Preview) |
|----------|-------------------|-------------------|
| **Mục đích** | Xem & tương tác | In & xuất PDF |
| **Format** | JSON | HTML |
| **Component** | React Interactive | Static HTML |
| **Actions** | Edit, Sign, Delete | Print, Download |
| **Customizable** | ✅ High | ❌ Low |
| **Print Quality** | ⚠️ Depends | ✅ Perfect |
| **Performance** | ✅ Fast | ✅ Cached |
| **Mobile** | ✅ Responsive | ⚠️ Fixed A4 |

---

## 🎨 Về việc "Xem trước khi tạo"

### Vấn đề hiện tại
> "Phần xem trước hóa đơn thì do chưa tạo nên không có id để truyền"

### Giải pháp đề xuất

#### Option 1: Preview Component (Current - Recommended)
**Sử dụng component React để preview trước khi tạo**

✅ **Ưu điểm:**
- Instant preview, không cần API call
- Full control UI/UX
- Can edit inline
- Responsive

❌ **Nhược điểm:**
- Preview khác với print (do render khác)
- Cần maintain 2 templates (React + Backend HTML)

**Implementation:** Đang dùng `InvoiceTemplatePreview` component

#### Option 2: Backend Preview API with Mock Data
**Tạo API preview nhận data JSON thay vì ID**

```typescript
// New API endpoint
POST /api/Invoice/preview-draft
Body: {
  templateId: number,
  customerData: {...},
  items: [...],
  // all invoice data
}
Response: HTML preview
```

✅ **Ưu điểm:**
- Preview giống 100% với print final
- Nhất quán template
- Validate data on backend

❌ **Nhược điểm:**
- Network call → slower
- Need backend changes
- Data might be incomplete

#### 🏆 Recommendation: **Hybrid Approach**

1. **Trước khi tạo:** Dùng React component (instant preview)
2. **Sau khi tạo:** Dùng HTML API (official preview for print)

Lý do:
- UX tốt hơn (instant preview khi đang nhập)
- Chính xác hơn khi in (HTML từ backend)
- Best of both worlds

---

## 🚀 Action Items

### Immediate (Ngay lập tức)
- [ ] Tạo `invoicePreviewService.ts`
- [ ] Tạo `InvoicePreviewModal.tsx` component
- [ ] Add preview button vào InvoiceManagement
- [ ] Test print functionality

### Short-term (Ngắn hạn)
- [ ] Add email invoice feature (sử dụng HTML preview)
- [ ] Add download PDF (client-side hoặc backend service)
- [ ] Error handling improvements
- [ ] Loading states

### Long-term (Dài hạn)
- [ ] Backend PDF generation service (better than client print-to-PDF)
- [ ] Email template service integration
- [ ] Archive old invoices as HTML/PDF
- [ ] Batch print multiple invoices

---

## 💡 Best Practices

### Khi nào dùng JSON API?
- View/Edit invoice details
- Show invoice in list/table
- Mobile app display
- Status tracking
- Audit trail

### Khi nào dùng HTML API?
- Print invoice
- Generate PDF
- Email to customer
- Legal archiving
- Official documents

### Security Considerations
```typescript
// Always check permissions
const canViewInvoice = await checkPermission(userId, invoiceId);
if (!canViewInvoice) {
  throw new Error('Unauthorized');
}

// Validate invoice belongs to user's company
const invoice = await getInvoiceById(invoiceId);
if (invoice.companyId !== user.companyId) {
  throw new Error('Access denied');
}
```

---

## 📖 References

- [InvoiceDetail.tsx](src/page/InvoiceDetail.tsx) - Current detail page
- [InvoiceManagement.tsx](src/page/InvoiceManagement.tsx) - List page
- [invoiceService.ts](src/services/invoiceService.ts) - API services
- [InvoiceTemplatePreview](src/components/InvoiceTemplatePreview.tsx) - React preview component

---

**Kết luận:** API HTML preview rất tốt cho việc IN và XUẤT PDF. Nên giữ cả 2 APIs (JSON + HTML) để phục vụ 2 mục đích khác nhau. Implement theo plan trên để có UX tốt nhất.
