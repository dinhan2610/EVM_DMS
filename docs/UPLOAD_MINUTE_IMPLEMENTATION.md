# 📄 Upload Minute Implementation Guide

## 📋 Overview

Chức năng upload biên bản điều chỉnh/thay thế hóa đơn đã được triển khai đầy đủ cho trang **Quản lý Biên bản Điều chỉnh/Thay thế** (`AdjustmentReplacementRecordManagement`).

## 🔄 Recent Update (v2.0)

**✨ Invoice Selection Dropdown** - Thay thế text input bằng Autocomplete dropdown:
- User không cần biết Invoice ID
- Chọn từ danh sách hóa đơn đã phát hành/đã điều chỉnh
- Auto-load danh sách khi mở dialog
- **Hiển thị format: Ký hiệu - Số HĐ - Số tiền**
  - Ví dụ: `KH01/001E - HĐ123456 - 10,000,000₫`
- Search/filter trong dropdown
- Visual hierarchy: Ký hiệu (blue), Số HĐ (bold), Số tiền (green, bold)

## 🎯 Implementation Details

### 1. **API Service Layer** - `minuteService.ts`

#### Location
`src/services/minuteService.ts` (127 lines)

#### Key Components

##### Interfaces
```typescript
UploadMinuteRequest {
  invoiceId: number        // ID hóa đơn gốc (auto từ dropdown)
  minuteType: number       // 1: Điều chỉnh, 2: Thay thế
  description: string      // Mô tả/lý do
  pdfFile: File           // File PDF biên bản
}

UploadMinuteResponse {
  minuteId: number        // ID biên bản vừa tạo
  invoiceId: number       // ID hóa đơn
  minuteType: number      // Loại biên bản
  description: string     // Mô tả
  filePath: string        // Đường dẫn file trên server
  uploadedAt: string      // Thời gian upload (ISO 8601)
}
```

##### Functions

**`uploadMinute(data: UploadMinuteRequest): Promise<UploadMinuteResponse>`**
- Upload biên bản lên server
- Endpoint: `POST /api/Minute`
- Content-Type: `multipart/form-data`
- FormData fields (exact match với API spec):
  - `InvoiceId` (string) - Capital I, Capital D
  - `MinuteType` (string) - Capital M, Capital T
  - `Description` (string) - Capital D
  - `PdfFile` (File) - Capital P, Capital F
- Error handling: Parse axios errors và trả về message tiếng Việt

**`validatePdfFile(file: File): string | null`**
- Validate file PDF trước khi upload
- Checks:
  - ✅ File type: phải là `application/pdf`
  - ✅ File size: tối đa 10MB
  - ✅ Filename length: < 255 characters
- Return: `null` nếu valid, error message nếu invalid

#### API Field Mapping
```
Frontend          →  FormData Key    →  Backend
─────────────────────────────────────────────────
invoiceId         →  InvoiceId       →  int32
minuteType        →  MinuteType      →  int32
description       →  Description     →  string
pdfFile           →  PdfFile         →  binary
```

### 2. **Upload Dialog Component** - `UploadMinuteDialog.tsx`

#### Location
`src/components/UploadMinuteDialog.tsx` (259 lines)

#### Features

##### Form Fields

1. **✨ Chọn Hóa Đơn** (Autocomplete - NEW!)
   - Type: Dropdown với search
   - Data source: Hóa đơn đã phát hành (status 2) hoặc đã điều chỉnh (status 4)
   - **Display format: "KH01/001E - HĐ123456 - 10,000,000₫"**
     - Ký hiệu (symbol): Màu xanh primary, bold
     - Số hóa đơn: Bold
     - Số tiền: Màu xanh lá (success), bold, format VND
   - Features:
     - Auto-load khi mở dialog (parallel load invoices + templates)
     - Search/filter real-time
     - Loading state khi fetch data
     - Sort by invoice number (mới nhất trước)
   - Validation: Required, phải chọn 1 hóa đơn
   - Helper text: "X hóa đơn khả dụng"

2. **Loại Biên Bản** (Select)
   - Options:
     - `1` - Điều Chỉnh (Chip màu warning)
     - `2` - Thay Thế (Chip màu info)
   - Default: `1` (Điều chỉnh)
   - Required

3. **Mô Tả / Lý Do** (TextField multiline)
   - Required, max 500 characters
   - 3 rows
   - Character counter: "X/500 ký tự"
   - Placeholder: "Nhập lý do điều chỉnh/thay thế hóa đơn..."

4. **File PDF** (File input)
   - Accept: `application/pdf` only
   - Max size: 10MB
   - Visual feedback:
     - ✅ File selected: Hiển thị tên file + size với icon PDF màu đỏ
     - ❌ No file: Placeholder text "Chọn file PDF"
   - Validation: Real-time với `validatePdfFile()`

##### UI/UX Features
- 📱 Responsive dialog với `maxWidth="sm"`, `fullWidth`
- 🎨 Professional design với MUI components
- 🔄 Loading state với LinearProgress
- ⚠️ Error alerts (Alert component, severity="error")
- ✅ Success feedback với file preview
- 🚫 Disable all inputs khi đang upload
- 🔒 Prevent close khi đang loading

##### Props
```typescript
interface UploadMinuteDialogProps {
  open: boolean           // Control dialog visibility
  onClose: () => void     // Callback khi đóng dialog
  onSuccess: () => void   // Callback khi upload thành công
}
```

##### Validation Flow
1. **Client-side validation** (validateForm):
   - Selected Invoice: Must be selected (not null)
   - Description: Not empty, length ≤ 500
   - File: Must be selected, valid PDF

2. **File validation** (validatePdfFile):
   - Type check: `application/pdf`
   - Size check: ≤ 10MB
   - Filename check: < 255 chars

3. **Server-side validation**: Handled by API

##### Invoice Loading Flow
```
Dialog opens
  → useEffect triggers
  → loadAvailableInvoices()
  → Promise.all([getAllInvoices(), getAllTemplates()])
  → Create templateMap (templateID → serial)
  → Filter: status = ISSUED (2) || ADJUSTED (4)
  → Map to InvoiceOption[] {
      id, 
      symbol: templateMap.get(templateID),
      invoiceNumber,
      totalAmount,
      label: "symbol - HĐnumber - formattedAmount"
    }
  → Sort by invoice number DESC
  → Set availableInvoices state
  → Display in Autocomplete dropdown with visual formatting
```

##### Submit Flow
```
User selects invoice from dropdown
  → selectedInvoice state updated
  → User fills description & selects PDF
  → User clicks "Upload" 
  → validateForm() (checks selectedInvoice, description, file)
  → Set loading state 
  → Call uploadMinute(selectedInvoice.id, ...)
  → On success:
      → Reset form 
      → Close dialog 
      → Call onSuccess() (reload list)
  → On error:
      → Show error alert 
      → Keep dialog open
```

### 3. **Integration** - `AdjustmentReplacementRecordManagement.tsx`

#### Changes Made

##### Imports
```typescript
import UploadMinuteDialog from '@/components/UploadMinuteDialog'
```

##### State Management
```typescript
const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
```

##### Handler Functions
```typescript
// Mở dialog
const handleUploadRecord = () => {
  setUploadDialogOpen(true)
}

// Callback khi upload thành công
const handleUploadSuccess = async () => {
  await loadRecords()  // Reload danh sách
  setSnackbar({
    open: true,
    message: '✅ Upload biên bản thành công!',
    severity: 'success',
  })
}
```

##### JSX Integration
```tsx
<UploadMinuteDialog
  open={uploadDialogOpen}
  onClose={() => setUploadDialogOpen(false)}
  onSuccess={handleUploadSuccess}
/>
```

##### Button Trigger
- Existing button đã có: `<Button onClick={handleUploadRecord}><UploadIcon /></Button>`
- Line ~824 trong file

## 🔍 API Specification

### Endpoint
```
POST https://eims.site/api/Minute
```

### Headers
```
Content-Type: multipart/form-data
```

### Request Body (FormData)
```
InvoiceId: 0 (int32)
MinuteType: 1 (int32) - 1: Điều chỉnh, 2: Thay thế
Description: "string"
PdfFile: <binary>
```

### Example curl
```bash
curl -X 'POST' \
  'https://eims.site/api/Minute' \
  -H 'Content-Type: multipart/form-data' \
  -F 'InvoiceId=123' \
  -F 'MinuteType=1' \
  -F 'Description=Điều chỉnh giá sản phẩm X' \
  -F 'PdfFile=@/path/to/bien-ban.pdf'
```

### Response (Expected)
```json
{
  "minuteId": 456,
  "invoiceId": 123,
  "minuteType": 1,
  "description": "Điều chỉnh giá sản phẩm X",
  "filePath": "/uploads/minutes/456_bien-ban.pdf",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

## ✅ Validation Rules

### Client-side
1. **Invoice ID**
   - Required
   - Must be numeric
   - Must be > 0

2. **Description**
   - Required
   - Max length: 500 characters
   - Trimmed before submit

3. **PDF File**
   - Required
   - Type: `application/pdf` only
   - Max size: 10MB (10,485,760 bytes)
   - Filename length: < 255 characters

### Server-side (Expected)
- Invoice ID exists in database
- User has permission to create minute for invoice
- PDF file is not corrupted
- Storage space available

## 🎨 UI/UX Design

### Dialog Layout
```
┌─────────────────────────────────────┐
│  📤 Upload Biên Bản            [X]  │
├─────────────────────────────────────┤
│  [Loading bar if uploading]         │
│  [Error alert if error]             │
│                                      │
│  ID Hóa Đơn *                       │
│  [_________________]                │
│  ID của hóa đơn gốc                 │
│                                      │
│  Loại Biên Bản *                    │
│  [1 ▾ Điều Chỉnh        ]          │
│                                      │
│  Mô Tả / Lý Do *                    │
│  [_________________________]        │
│  [_________________________]        │
│  [_________________________]        │
│  X/500 ký tự                        │
│                                      │
│  [ 📄 Chọn file PDF ]              │
│  ┌───────────────────────────────┐ │
│  │ 📕 bien-ban.pdf    [52.3 KB] │ │
│  └───────────────────────────────┘ │
│  Chỉ chấp nhận file PDF, tối đa    │
│  10MB                               │
│                                      │
├─────────────────────────────────────┤
│              [ Hủy ]  [ Upload ]    │
└─────────────────────────────────────┘
```

### Visual Feedback
- ✅ **File selected**: Green background box với PDF icon
- ❌ **File error**: Red alert với error message
- 🔄 **Uploading**: Linear progress + disabled inputs + "Đang upload..." text
- ✓ **Success**: Dialog closes, snackbar hiển thị "✅ Upload biên bản thành công!"
- ❌ **Error**: Red alert trong dialog với error message chi tiết

## 🧪 Testing Checklist

### Manual Testing

#### ✅ Form Validation
- [ ] Invoice ID: Empty → shows error
- [ ] Invoice ID: Not number → shows error  
- [ ] Invoice ID: Negative → shows error
- [ ] Invoice ID: 0 → shows error
- [ ] Description: Empty → shows error
- [ ] Description: > 500 chars → shows error
- [ ] File: Not selected → shows error
- [ ] File: Not PDF → shows error
- [ ] File: > 10MB → shows error

#### ✅ File Upload
- [ ] Select PDF < 10MB → shows preview
- [ ] Change file → updates preview
- [ ] Upload valid data → success
- [ ] Upload invalid data → shows API error
- [ ] During upload → all inputs disabled
- [ ] Close dialog during upload → prevented

#### ✅ Success Flow
- [ ] After successful upload → dialog closes
- [ ] After successful upload → snackbar shows success
- [ ] After successful upload → list reloads
- [ ] After successful upload → new minute appears in list

#### ✅ Error Handling
- [ ] Network error → shows friendly message
- [ ] API error → shows error message
- [ ] Validation error → shows specific field error
- [ ] After error → can retry

### Integration Testing
- [ ] Button "Upload" trong list page → opens dialog
- [ ] Upload thành công → reload danh sách
- [ ] Upload thất bại → không reload, giữ dialog mở
- [ ] Multiple uploads in sequence → all work correctly

## 📊 File Structure

```
src/
├── components/
│   └── UploadMinuteDialog.tsx       (259 lines) ✅ NEW
├── services/
│   └── minuteService.ts             (127 lines) ✅ NEW
└── page/
    └── AdjustmentReplacementRecord
        Management.tsx                (996 lines) ✅ UPDATED
```

## 🚀 Usage Example

```typescript
// In parent component
const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

const handleOpenUpload = () => {
  setUploadDialogOpen(true)
}

const handleUploadSuccess = async () => {
  await reloadData()
  showSuccessMessage()
}

// JSX
<Button onClick={handleOpenUpload}>
  <UploadIcon /> Upload
</Button>

<UploadMinuteDialog
  open={uploadDialogOpen}
  onClose={() => setUploadDialogOpen(false)}
  onSuccess={handleUploadSuccess}
/>
```

## 🔧 Configuration

### API Base URL
Defined in `src/config/api.config.ts`:
```typescript
BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api'
```

### File Constraints
Defined in `src/services/minuteService.ts`:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_FILENAME_LENGTH = 255
```

## 📝 Notes

### ⚠️ Important Implementation Details

1. **FormData Field Names**: Capital case (`InvoiceId`, `MinuteType`, `Description`, `PdfFile`) to match backend API spec exactly

2. **Minute Type Values**:
   - `1` = Điều chỉnh (Adjustment)
   - `2` = Thay thế (Replacement)

3. **File Validation**: Happens TWICE:
   - Client-side: Before showing file preview
   - Server-side: Backend validates uploaded file

4. **Error Messages**: User-friendly Vietnamese messages cho tất cả validation errors

5. **Loading State**: Prevents multiple submissions và dialog close during upload

### 🎯 Best Practices Followed

- ✅ TypeScript interfaces cho type safety
- ✅ Form validation comprehensive
- ✅ Loading states và error handling
- ✅ User-friendly Vietnamese messages
- ✅ Clean code structure với comments
- ✅ Reusable component design
- ✅ Proper state management
- ✅ Responsive UI design

## 🐛 Troubleshooting

### Common Issues

**Issue**: Upload button không mở dialog
**Solution**: Check `uploadDialogOpen` state và `handleUploadRecord` function

**Issue**: File validation fails với valid PDF
**Solution**: Check file MIME type (`application/pdf`) và size

**Issue**: API returns 400 Bad Request
**Solution**: Verify FormData field names (capital case: `InvoiceId`, not `invoiceId`)

**Issue**: Upload thành công nhưng list không reload
**Solution**: Check `handleUploadSuccess` callback và `loadRecords()` function

**Issue**: Dialog không close sau upload success
**Solution**: Verify `handleClose()` được gọi trong try block sau upload success

## 🔮 Future Enhancements

### Potential Improvements

1. **Auto-fill Invoice ID**: Nếu context có invoice được chọn
2. **Drag & Drop**: Hỗ trợ drag PDF file vào dialog
3. **Multiple Files**: Upload nhiều biên bản cùng lúc
4. **Preview PDF**: Xem trước PDF trong dialog trước khi upload
5. **Progress Indicator**: Show percentage cho large files
6. **History**: Hiển thị danh sách files đã upload cho invoice
7. **Template Download**: Download mẫu biên bản để điền

## ✅ Completion Status

- ✅ **API Service**: `minuteService.ts` - COMPLETE
- ✅ **Upload Dialog**: `UploadMinuteDialog.tsx` - COMPLETE  
- ✅ **Integration**: `AdjustmentReplacementRecordManagement.tsx` - COMPLETE
- ✅ **Validation**: Client-side validation - COMPLETE
- ✅ **Error Handling**: User-friendly messages - COMPLETE
- ✅ **UI/UX**: Professional design - COMPLETE
- ✅ **Documentation**: This guide - COMPLETE

**Status**: 🎉 **READY FOR TESTING**
