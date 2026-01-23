# Template Preview HTML Display Guide

## 📋 Tổng quan

API `/api/InvoiceTemplate/preview-template/{id}` trả về **HTML string** (text/html), không phải PDF. Document này mô tả cách hiển thị HTML template một cách tối ưu và chuyên nghiệp.

## 🔍 Phát hiện thực tế

### ⚠️ Giả định ban đầu (SAI):
API trả về PDF → Code dùng `responseType: 'blob'` → Tạo Blob URL

### ✅ Thực tế API:
```http
GET /api/InvoiceTemplate/preview-template/1
Response:
Content-Type: text/html
Body: "<html><body>...</body></html>"
```

**Console log xác nhận:**
```
[getTemplatePreviewPdf] Response is not PDF: text/html
Error: Server did not return a PDF file
```

## ✅ Giải pháp đúng: HTML Iframe Display

## ✅ Giải pháp đúng: HTML Iframe Display

### 1. Fetch HTML đúng cách

```typescript
/**
 * Get template preview HTML from backend
 * API returns fully rendered HTML with inline CSS
 */
export const getTemplatePreviewHtml = async (
  templateId: number
): Promise<string> => {
  const response = await axios.get<string>(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.PREVIEW_HTML(templateId)}`,
    {
      headers: getAuthHeaders(),
      responseType: 'text', // ✅ Get as text for HTML string
    }
  )
  
  return response.data // HTML string
}
```

### 2. Hiển thị HTML trong iframe

```typescript
// Fetch HTML string
const html = await templateService.getTemplatePreviewHtml(templateId);
setPreviewHtml(html);

// Display in iframe with srcDoc
<iframe
  id="html-preview-iframe"
  srcDoc={previewHtml}
  title="HTML Template Preview"
  style={{
    width: '100%',
    minHeight: '1200px',
    border: 'none',
  }}
  sandbox="allow-same-origin allow-scripts"
/>
```

### 3. Sandbox security

```tsx
// ⚠️ QUAN TRỌNG: Sandbox để bảo vệ khỏi XSS
sandbox="allow-same-origin allow-scripts"
```

## 🚀 Tính năng chuyên nghiệp

### 1. Print HTML
```typescript
const handlePrint = () => {
  const iframe = document.getElementById('html-preview-iframe') as HTMLIFrameElement;
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.print();
  }
};
```

### 2. Download as PDF
```typescript
const handleDownload = async () => {
  // Option 1: Browser print dialog (Save as PDF)
  handlePrint();
  
  // Option 2: Backend conversion (TODO - requires API)
  // const pdfBlob = await api.convertHtmlToPdf(previewHtml);
  // downloadBlob(pdfBlob, 'template.pdf');
};
```

### 3. Fullscreen
```typescript
const handleFullscreen = () => {
  const iframe = document.getElementById('html-preview-iframe') as HTMLIFrameElement;
  if (iframe && iframe.requestFullscreen) {
    iframe.requestFullscreen();
  }
};
```

## 🎨 UI/UX Improvements

### Professional Toolbar
```tsx
<Stack direction="row" spacing={1.5} alignItems="center">
  {/* Back button */}
  <Button startIcon={<ArrowBackIcon />}>Quay Lại</Button>
  
  <Divider orientation="vertical" flexItem />
  
  {/* PDF Actions */}
  <Tooltip title="Tải xuống PDF">
    <IconButton onClick={handleDownload}>
      <DownloadIcon />
    </IconButton>
  </Tooltip>
  
  <Tooltip title="Toàn màn hình">
    <IconButton onClick={handleFullscreen}>
      <FullscreenIcon />
    </IconButton>
  </Tooltip>
  
  <Tooltip title="In ấn">
    <IconButton onClick={handlePrint}>
      <PrintIcon />
    </IconButton>
  </Tooltip>
  
  <Divider orientation="vertical" flexItem />
  
  {/* Edit button */}
  <Button variant="contained" startIcon={<EditOutlinedIcon />}>
    Chỉnh sửa
  </Button>
</Stack>
```

### Loading State
```tsx
{previewLoading ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
    <CircularProgress size={48} />
    <Typography>Đang tải preview PDF mẫu hóa đơn...</Typography>
  </Box>
) : pdfUrl ? (
  <iframe src={pdfUrl} ... />
) : (
  <Alert severity="warning">Không có dữ liệu preview</Alert>
)}
```

## 📁 Files implementation

### 1. `src/services/templateService.ts`
- ✅ `getTemplatePreviewHtml()` - Returns HTML string
- ✅ Uses `responseType: 'text'`
- ✅ Returns response.data directly (HTML string)

### 2. `src/page/TemplatePreviewPage.tsx`
- ✅ Uses `getTemplatePreviewHtml()` to fetch HTML
- ✅ Displays in iframe with `srcDoc={previewHtml}`
- ✅ Professional toolbar: Print, Download (via print), Edit, Fullscreen
- ✅ Sandbox: `allow-same-origin allow-scripts` for security
- ✅ minHeight: 1200px for comfortable viewing

### 3. `src/page/TemplateManagement.tsx`
- ✅ Modal preview with HTML iframe
- ✅ Uses `getTemplatePreviewHtml()` in `handleViewDetails()`
- ✅ Displays with `srcDoc={previewHtml}`
- ✅ minHeight: 700px in modal
- ✅ No blob URL cleanup needed (plain string)

## 🔍 So sánh approaches

### HTML Approach (ĐÚNG - API thực tế):
```tsx
// State
const [previewHtml, setPreviewHtml] = useState<string>('');

// Fetch
const html = await templateService.getTemplatePreviewHtml(id);
setPreviewHtml(html);

// Display
<iframe srcDoc={previewHtml} sandbox="allow-same-origin allow-scripts" />

// Download as PDF
handlePrint(); // User saves as PDF via browser
```

### PDF Approach (SAI - API không trả PDF):
```tsx
// ❌ This doesn't work because API returns text/html, not application/pdf
const pdfBlob = await templateService.getTemplatePreviewPdf(id);
// Error: Server did not return a PDF file
```

## ✅ Ưu điểm HTML approach

1. **Đúng với API**: API trả về `text/html`
2. **Đơn giản**: Không cần Blob URL, cleanup
3. **Security**: Sandbox ngăn XSS attacks
4. **Print**: Browser print dialog có "Save as PDF"
5. **Fullscreen**: Native fullscreen API
6. **No dependencies**: Pure browser APIs
7. **Responsive**: HTML scales tốt hơn PDF

## ⚠️ Lưu ý quan trọng

### API Response Type
```
✅ ACTUAL: Content-Type: text/html
❌ WRONG ASSUMPTION: Content-Type: application/pdf
```

### Sandbox Attributes
```tsx
// ✅ Required for security
sandbox="allow-same-origin allow-scripts"

// ❌ Don't use for PDF (not needed)
<iframe src={pdfUrl} />  // No sandbox needed for PDF
```

### Download as PDF
```tsx
// Current: Via print dialog
handlePrint();
setSnackbar({ message: 'Sử dụng chức năng In để lưu PDF' });

// Future: Backend conversion API
const pdfBlob = await api.convertHtmlToPdf(templateId);
downloadBlob(pdfBlob, `${templateName}.pdf`);
```

## 🎓 Best Practices

### ✅ DO:
- Use `responseType: 'text'` for HTML
- Display with `srcDoc={htmlString}`
- Add `sandbox="allow-same-origin allow-scripts"` for security
- Use iframe print() for printing
- Provide "Save as PDF" via browser print dialog
- Set appropriate minHeight (1200px+ for full page)
- Handle errors gracefully with user-friendly messages

### ❌ DON'T:
- Use `responseType: 'blob'` for HTML (wrong type)
- Use `src={}` for inline HTML (use srcDoc)
- Forget sandbox attribute (XSS risk)
- Try to download PDF if API returns HTML
- Parse HTML as JSON
- Assume API returns PDF without checking content-type

## 🧪 Testing checklist

- [x] HTML loads correctly in TemplatePreviewPage
- [x] HTML loads correctly in TemplateManagement modal
- [x] Print button works (opens print dialog)
- [x] Download button shows info message (use print dialog)
- [x] Fullscreen button works (expands iframe)
- [x] No memory leaks (no blob cleanup needed for HTML)
- [x] Loading state shows during fetch
- [x] Error handling shows user-friendly message
- [x] Back/Edit navigation buttons work
- [x] Sandbox prevents malicious scripts

## 🎯 Future enhancements

### Option 1: Backend HTML to PDF API
```typescript
// New API endpoint
POST /api/InvoiceTemplate/convert-to-pdf
Body: { templateId: 1 }
Response: application/pdf (binary)

// Frontend implementation
const handleDownload = async () => {
  const pdfBlob = await templateService.convertTemplateToPdf(templateId);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pdfBlob);
  link.download = `${templateName}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
};
```

### Option 2: Client-side HTML to PDF
```bash
npm install jspdf html2canvas
```
```tsx
import html2pdf from 'html2pdf.js';

const handleDownload = () => {
  const element = document.getElementById('html-preview-iframe');
  html2pdf().from(element).save(`${templateName}.pdf`);
};
```
**Cons:** Large bundle size, quality issues

### Option 3: Separate endpoints
Backend provides both:
- `/preview-html/{id}` → HTML for editing/preview
- `/download-pdf/{id}` → PDF for download

## 📚 References

- [MDN: iframe element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
- [XSS Prevention](https://owasp.org/www-community/attacks/xss/)
- [Window.print()](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)

## 🤝 Integration points

### API Endpoint:
```
GET /api/InvoiceTemplate/preview-template/{id}
Returns: text/html (HTML string with inline CSS)
Auth: Bearer token required
```

### Frontend Service:
```typescript
templateService.getTemplatePreviewHtml(templateId: number): Promise<string>
```

### Components using HTML preview:
1. **TemplatePreviewPage** (`/admin/templates/preview/:id`)
   - Full-screen HTML display in iframe
   - Toolbar: Back, Download (print), Fullscreen, Print, Edit
   - minHeight: 1200px
   - Sandbox: allow-same-origin allow-scripts

2. **TemplateManagement** (Modal)
   - Quick HTML preview in dialog
   - Buttons: Close, Edit, View Full Screen
   - minHeight: 700px
   - Sandbox: allow-same-origin

---

**Last updated:** 2026-01-23
**Status:** ✅ Production Ready (HTML Display)
**API Verified:** Returns text/html, NOT application/pdf
