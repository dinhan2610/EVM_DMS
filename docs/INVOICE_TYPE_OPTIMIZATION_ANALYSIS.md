# 🔍 Phân Tích Chi Tiết: Tối Ưu Hóa Đơn Điều Chỉnh/Thay Thế/Hủy/Giải Trình

**Date:** January 6, 2026  
**Context:** Backend lưu `invoiceType` với enum:
- `1`: Hủy
- `2`: Điều chỉnh  
- `3`: Thay thế
- `4`: Giải trình

---

## 🎯 **Objective**

Phân tích và tối ưu cách hiển thị các loại hóa đơn đặc biệt (điều chỉnh, thay thế, hủy, giải trình) trong InvoiceDetail và InvoicePreviewModal để:
1. ✅ Hiển thị chính xác loại hóa đơn
2. ✅ Link đến hóa đơn gốc (nếu là adjustment/replacement)
3. ✅ Hiển thị thông tin tham chiếu
4. ✅ Visual indicators (badges, colors)
5. ✅ UX tối ưu cho từng loại

---

## 📊 **Backend Data Structure Analysis**

### **1. Current InvoiceListItem Interface**

```typescript
export interface InvoiceListItem {
  invoiceID: number;
  templateID: number;
  invoiceNumber: number;
  invoiceStatusID: number;
  companyId: number;
  customerID: number;
  issuerID: number;
  signDate: string;
  paymentDueDate: string | null;
  subtotalAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  totalAmountInWords: string;
  digitalSignature: string | null;
  taxAuthorityCode: string | null;
  taxApiStatusID: number | null;
  taxStatusCode: string | null;
  taxStatusName: string | null;
  qrCodeData: string | null;
  notes: string | null;
  filePath: string | null;
  xmlPath: string | null;
  createdAt: string;
  invoiceItems: InvoiceItemResponse[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // ❌ THIẾU CÁC FIELDS NÀY:
  // invoiceType?: number              // 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình
  // originalInvoiceID?: number        // ID hóa đơn gốc (nếu là adjustment/replacement)
  // originalInvoiceNumber?: number    // Số hóa đơn gốc
  // referenceText?: string            // Dòng tham chiếu (cho adjustment/replacement)
  // adjustmentReason?: string         // Lý do điều chỉnh
  // replacementReason?: string        // Lý do thay thế
}
```

---

## 🔍 **Detailed Analysis by Invoice Type**

### **Type 1: Hóa Đơn Hủy (Cancelled)**

#### **Characteristics:**
- Hóa đơn bị hủy bỏ, không còn hiệu lực
- Thường do lỗi phát hành hoặc yêu cầu khách hàng
- Cần hiển thị:
  * Lý do hủy
  * Ngày hủy
  * Người thực hiện
  * Watermark "ĐÃ HỦY"

#### **UI Requirements:**
```tsx
// Visual indicators
<Chip 
  label="ĐÃ HỦY" 
  color="error" 
  icon={<CancelIcon />}
  sx={{ fontWeight: 'bold' }}
/>

// Watermark on preview
<Box sx={{
  position: 'absolute',
  fontSize: '120px',
  color: 'rgba(211, 47, 47, 0.15)',
  transform: 'rotate(-45deg)',
}}>
  ĐÃ HỦY
</Box>
```

#### **Data Needed:**
```typescript
{
  invoiceType: 1,
  cancellationReason: string,
  cancelledBy: number,
  cancelledAt: string,
  cancelledByName: string,
}
```

---

### **Type 2: Hóa Đơn Điều Chỉnh (Adjustment)**

#### **Characteristics:**
- Điều chỉnh số lượng/đơn giá/thuế suất
- Hóa đơn gốc **VẪN CÓ HIỆU LỰC**
- Giá trị cuối = Hóa đơn gốc + Hóa đơn điều chỉnh
- Có thể có nhiều lần điều chỉnh cho 1 hóa đơn gốc

#### **UI Requirements:**
```tsx
// Badge with link to original
<Alert severity="info" sx={{ mb: 2 }}>
  <Stack direction="row" spacing={1} alignItems="center">
    <EditIcon />
    <Typography variant="body2">
      Đây là hóa đơn điều chỉnh của 
      <Link href={`/invoices/${originalInvoiceID}`} sx={{ mx: 0.5, fontWeight: 'bold' }}>
        Hóa đơn số {originalInvoiceNumber}
      </Link>
    </Typography>
  </Stack>
</Alert>

// Display adjustment amount
<Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1 }}>
  <Typography variant="h6" color="warning.main">
    Giá trị điều chỉnh: {formatCurrency(adjustmentAmount)}
  </Typography>
  <Typography variant="caption">
    Giá trị cuối = {formatCurrency(originalAmount)} + {formatCurrency(adjustmentAmount)} = {formatCurrency(finalAmount)}
  </Typography>
</Box>

// Reference text (legal requirement)
<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
  {referenceText}
  {/* VD: "Điều chỉnh hóa đơn số 0000031 ký hiệu 1C24TAA ngày 12/12/2024" */}
</Typography>

// Adjustment reason
<TextField
  label="Lý do điều chỉnh"
  value={adjustmentReason}
  multiline
  rows={3}
  disabled
  fullWidth
/>
```

#### **Data Needed:**
```typescript
{
  invoiceType: 2,
  originalInvoiceID: number,
  originalInvoiceNumber: number,
  originalInvoiceSerial: string,
  originalInvoiceDate: string,
  referenceText: string,
  adjustmentReason: string,
  adjustmentType: 0 | 1,  // 0=INCREASE, 1=DECREASE
  adjustmentAmount: number,
  originalAmount: number,
  finalAmount: number,
}
```

---

### **Type 3: Hóa Đơn Thay Thế (Replacement)**

#### **Characteristics:**
- Thay thế toàn bộ hóa đơn gốc
- Hóa đơn gốc **BỊ HỦY BỎ** (không còn hiệu lực)
- Cho phép thay đổi mọi thông tin (khách hàng, items, giá trị)
- Chỉ có 1 hóa đơn thay thế duy nhất cho 1 hóa đơn gốc

#### **UI Requirements:**
```tsx
// Badge with link to cancelled original
<Alert severity="warning" sx={{ mb: 2 }}>
  <Stack direction="row" spacing={1} alignItems="center">
    <SwapHorizIcon />
    <Typography variant="body2">
      Đây là hóa đơn thay thế của 
      <Link href={`/invoices/${originalInvoiceID}`} sx={{ mx: 0.5, fontWeight: 'bold', textDecoration: 'line-through' }}>
        Hóa đơn số {originalInvoiceNumber}
      </Link>
      (đã hủy)
    </Typography>
  </Stack>
</Alert>

// Show comparison table
<TableContainer>
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Thông tin</TableCell>
        <TableCell>Hóa đơn gốc (đã hủy)</TableCell>
        <TableCell>Hóa đơn thay thế (mới)</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Số hóa đơn</TableCell>
        <TableCell sx={{ textDecoration: 'line-through' }}>{originalInvoiceNumber}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{newInvoiceNumber}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Tổng tiền</TableCell>
        <TableCell sx={{ textDecoration: 'line-through' }}>{formatCurrency(originalAmount)}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{formatCurrency(newAmount)}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>

// Replacement reason
<TextField
  label="Lý do thay thế"
  value={replacementReason}
  multiline
  rows={3}
  disabled
  fullWidth
/>
```

#### **Data Needed:**
```typescript
{
  invoiceType: 3,
  originalInvoiceID: number,
  originalInvoiceNumber: number,
  originalInvoiceSerial: string,
  originalInvoiceDate: string,
  originalAmount: number,
  originalCustomerID: number,
  originalCustomerName: string,
  replacementReason: string,
  replacedAt: string,
  replacedBy: number,
  replacedByName: string,
}
```

---

### **Type 4: Hóa Đơn Giải Trình (Explanation/Clarification)**

#### **Characteristics:**
- Giải trình với cơ quan thuế về hóa đơn gốc
- Hóa đơn gốc **VẪN CÓ HIỆU LỰC**
- Không thay đổi giá trị, chỉ cung cấp thông tin bổ sung
- Thường kèm theo văn bản giải trình, chứng từ

#### **UI Requirements:**
```tsx
// Badge with link to original
<Alert severity="info" sx={{ mb: 2, bgcolor: '#e3f2fd' }}>
  <Stack direction="row" spacing={1} alignItems="center">
    <InfoIcon />
    <Typography variant="body2">
      Đây là văn bản giải trình cho 
      <Link href={`/invoices/${originalInvoiceID}`} sx={{ mx: 0.5, fontWeight: 'bold' }}>
        Hóa đơn số {originalInvoiceNumber}
      </Link>
    </Typography>
  </Stack>
</Alert>

// Explanation content
<Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
  <Typography variant="subtitle2" gutterBottom>
    Nội dung giải trình:
  </Typography>
  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
    {explanationContent}
  </Typography>
</Paper>

// Attachments
<Stack spacing={1} sx={{ mt: 2 }}>
  <Typography variant="subtitle2">Văn bản đính kèm:</Typography>
  {attachments.map(file => (
    <Chip 
      key={file.id}
      label={file.name}
      icon={<AttachFileIcon />}
      onClick={() => downloadAttachment(file.id)}
      clickable
    />
  ))}
</Stack>
```

#### **Data Needed:**
```typescript
{
  invoiceType: 4,
  originalInvoiceID: number,
  originalInvoiceNumber: number,
  originalInvoiceSerial: string,
  originalInvoiceDate: string,
  explanationContent: string,
  explanationReason: string,
  attachments: Array<{
    id: number,
    fileName: string,
    fileUrl: string,
    uploadedAt: string,
  }>,
  submittedTo: string,  // "Cục Thuế TP.HCM"
  submittedAt: string,
  submittedBy: number,
  submittedByName: string,
}
```

---

## 🎨 **UI/UX Design Patterns**

### **1. Invoice Type Badge Component**

```tsx
interface InvoiceTypeBadgeProps {
  invoiceType: 1 | 2 | 3 | 4 | null
  size?: 'small' | 'medium'
}

const InvoiceTypeBadge: React.FC<InvoiceTypeBadgeProps> = ({ invoiceType, size = 'medium' }) => {
  if (!invoiceType) return null
  
  const config = {
    1: { label: 'Đã hủy', color: 'error', icon: <CancelIcon /> },
    2: { label: 'Điều chỉnh', color: 'warning', icon: <EditIcon /> },
    3: { label: 'Thay thế', color: 'info', icon: <SwapHorizIcon /> },
    4: { label: 'Giải trình', color: 'default', icon: <InfoIcon /> },
  }
  
  const { label, color, icon } = config[invoiceType]
  
  return (
    <Chip 
      label={label}
      color={color}
      icon={icon}
      size={size}
      sx={{ fontWeight: 'bold' }}
    />
  )
}
```

### **2. Original Invoice Link Component**

```tsx
interface OriginalInvoiceLinkProps {
  invoiceType: 2 | 3 | 4
  originalInvoiceID: number
  originalInvoiceNumber: number
  isCancelled?: boolean
}

const OriginalInvoiceLink: React.FC<OriginalInvoiceLinkProps> = ({
  invoiceType,
  originalInvoiceID,
  originalInvoiceNumber,
  isCancelled = false
}) => {
  const typeLabel = {
    2: 'điều chỉnh',
    3: 'thay thế',
    4: 'giải trình',
  }[invoiceType]
  
  return (
    <Alert severity={isCancelled ? 'warning' : 'info'} sx={{ mb: 2 }}>
      <Typography variant="body2">
        Đây là hóa đơn {typeLabel} của {' '}
        <Link 
          href={`/invoices/${originalInvoiceID}`}
          sx={{ 
            fontWeight: 'bold',
            textDecoration: isCancelled ? 'line-through' : 'none',
          }}
        >
          Hóa đơn số {originalInvoiceNumber}
        </Link>
        {isCancelled && ' (đã hủy)'}
      </Typography>
    </Alert>
  )
}
```

### **3. Adjustment Summary Component**

```tsx
interface AdjustmentSummaryProps {
  originalAmount: number
  adjustmentAmount: number
  finalAmount: number
  adjustmentType: 0 | 1  // 0=INCREASE, 1=DECREASE
}

const AdjustmentSummary: React.FC<AdjustmentSummaryProps> = ({
  originalAmount,
  adjustmentAmount,
  finalAmount,
  adjustmentType
}) => {
  const isIncrease = adjustmentType === 0
  
  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: isIncrease ? '#e8f5e9' : '#fff3e0' }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">
          Tổng quan điều chỉnh:
        </Typography>
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">Giá trị gốc:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(originalAmount)}
          </Typography>
        </Stack>
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">
            Điều chỉnh {isIncrease ? 'tăng' : 'giảm'}:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold',
              color: isIncrease ? 'success.main' : 'error.main'
            }}
          >
            {isIncrease ? '+' : ''}{formatCurrency(adjustmentAmount)}
          </Typography>
        </Stack>
        
        <Divider />
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Giá trị cuối:
          </Typography>
          <Typography variant="h6" color="primary">
            {formatCurrency(finalAmount)}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
```

---

## 🛠️ **Implementation Plan**

### **Phase 1: Backend API Updates** ⚠️ **CRITICAL**

#### **1.1. Update InvoiceListItem Response**

**API Endpoints to update:**
- `GET /api/Invoice` - List all invoices
- `GET /api/Invoice/{id}` - Get invoice by ID

**Add fields:**
```typescript
{
  // ... existing fields ...
  
  // Invoice type classification
  invoiceType: number | null,          // 1=Hủy, 2=Điều chỉnh, 3=Thay thế, 4=Giải trình, null=Normal
  
  // Reference to original invoice (for types 2, 3, 4)
  originalInvoiceID: number | null,
  originalInvoiceNumber: number | null,
  originalInvoiceSerial: string | null,
  originalInvoiceDate: string | null,
  
  // Type-specific data
  referenceText: string | null,        // For adjustment/replacement
  adjustmentReason: string | null,     // For type 2
  adjustmentType: number | null,       // 0=INCREASE, 1=DECREASE (for type 2)
  adjustmentAmount: number | null,     // For type 2
  originalAmount: number | null,       // For type 2, 3
  finalAmount: number | null,          // For type 2
  
  replacementReason: string | null,    // For type 3
  replacedAt: string | null,           // For type 3
  
  explanationContent: string | null,   // For type 4
  explanationReason: string | null,    // For type 4
  submittedTo: string | null,          // For type 4
  submittedAt: string | null,          // For type 4
  
  cancellationReason: string | null,   // For type 1
  cancelledAt: string | null,          // For type 1
  cancelledBy: number | null,          // For type 1
}
```

#### **1.2. New API Endpoints**

```typescript
// Get all adjustments for an invoice
GET /api/Invoice/{id}/adjustments
Response: AdjustmentInvoice[]

// Get replacement invoice (if exists)
GET /api/Invoice/{id}/replacement
Response: ReplacementInvoice | null

// Get explanation documents
GET /api/Invoice/{id}/explanations
Response: ExplanationDocument[]

// Check if invoice can be adjusted/replaced
GET /api/Invoice/{id}/can-adjust
Response: { canAdjust: boolean, reason?: string }

GET /api/Invoice/{id}/can-replace
Response: { canReplace: boolean, reason?: string }
```

---

### **Phase 2: Frontend Type Updates**

#### **2.1. Update InvoiceListItem Interface**

```typescript
// src/services/invoiceService.ts

export enum InvoiceType {
  NORMAL = 0,        // Hóa đơn thông thường (không có invoiceType hoặc = 0)
  CANCELLED = 1,     // Hóa đơn hủy
  ADJUSTMENT = 2,    // Hóa đơn điều chỉnh
  REPLACEMENT = 3,   // Hóa đơn thay thế
  EXPLANATION = 4,   // Hóa đơn giải trình
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  [InvoiceType.NORMAL]: 'Hóa đơn thông thường',
  [InvoiceType.CANCELLED]: 'Đã hủy',
  [InvoiceType.ADJUSTMENT]: 'Hóa đơn điều chỉnh',
  [InvoiceType.REPLACEMENT]: 'Hóa đơn thay thế',
  [InvoiceType.EXPLANATION]: 'Giải trình',
}

export interface InvoiceListItem {
  // ... existing fields ...
  
  invoiceType?: InvoiceType | null
  originalInvoiceID?: number | null
  originalInvoiceNumber?: number | null
  originalInvoiceSerial?: string | null
  originalInvoiceDate?: string | null
  referenceText?: string | null
  adjustmentReason?: string | null
  adjustmentType?: 0 | 1 | null
  adjustmentAmount?: number | null
  originalAmount?: number | null
  finalAmount?: number | null
  replacementReason?: string | null
  replacedAt?: string | null
  explanationContent?: string | null
  explanationReason?: string | null
  submittedTo?: string | null
  submittedAt?: string | null
  cancellationReason?: string | null
  cancelledAt?: string | null
  cancelledBy?: number | null
}
```

---

### **Phase 3: Component Updates**

#### **3.1. InvoiceDetail.tsx Enhancements**

```tsx
// Add invoice type detection
const invoiceType = invoice?.invoiceType || InvoiceType.NORMAL
const isAdjustment = invoiceType === InvoiceType.ADJUSTMENT
const isReplacement = invoiceType === InvoiceType.REPLACEMENT
const isExplanation = invoiceType === InvoiceType.EXPLANATION
const isCancelled = invoiceType === InvoiceType.CANCELLED

// Render invoice type badge
<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
  <Chip label={status} color={getStatusColor(status)} size="small" />
  <Chip icon={getTaxStatusIcon(taxStatus)} label={taxStatus} color={getTaxStatusColor(taxStatus)} size="small" />
  <InvoiceTypeBadge invoiceType={invoiceType} size="small" />
</Stack>

// Render original invoice link
{(isAdjustment || isReplacement || isExplanation) && invoice.originalInvoiceID && (
  <OriginalInvoiceLink
    invoiceType={invoiceType}
    originalInvoiceID={invoice.originalInvoiceID}
    originalInvoiceNumber={invoice.originalInvoiceNumber}
    isCancelled={isReplacement}
  />
)}

// Render adjustment summary
{isAdjustment && (
  <AdjustmentSummary
    originalAmount={invoice.originalAmount}
    adjustmentAmount={invoice.adjustmentAmount}
    finalAmount={invoice.finalAmount}
    adjustmentType={invoice.adjustmentType}
  />
)}

// Render cancelled watermark
{isCancelled && (
  <Box sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: '120px',
    fontWeight: 900,
    color: 'rgba(211, 47, 47, 0.15)',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    zIndex: 999,
  }}>
    ĐÃ HỦY
  </Box>
)}
```

#### **3.2. InvoicePreviewModal.tsx Updates**

```tsx
// Inject watermark and badges into HTML preview
const enhanceHtmlPreview = (html: string, invoice: InvoiceListItem): string => {
  let enhancedHtml = html
  
  // Add cancelled watermark
  if (invoice.invoiceType === InvoiceType.CANCELLED) {
    const watermark = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: 900; color: rgba(211, 47, 47, 0.15); text-transform: uppercase; pointer-events: none; z-index: 999;">
        ĐÃ HỦY
      </div>
    `
    enhancedHtml = enhancedHtml.replace('</body>', `${watermark}</body>`)
  }
  
  // Add invoice type badge at top
  if (invoice.invoiceType && invoice.invoiceType !== InvoiceType.NORMAL) {
    const badge = `
      <div style="position: absolute; top: 20px; right: 20px; padding: 8px 16px; background: ${getBadgeColor(invoice.invoiceType)}; color: white; border-radius: 20px; font-weight: bold; z-index: 1000;">
        ${INVOICE_TYPE_LABELS[invoice.invoiceType]}
      </div>
    `
    enhancedHtml = enhancedHtml.replace('<body>', `<body>${badge}`)
  }
  
  return enhancedHtml
}
```

#### **3.3. InvoiceManagement.tsx (List View)**

```tsx
// Add invoice type column
{
  field: 'invoiceType',
  headerName: 'Loại',
  width: 120,
  renderCell: (params) => (
    <InvoiceTypeBadge 
      invoiceType={params.row.invoiceType} 
      size="small" 
    />
  ),
}

// Add original invoice reference column
{
  field: 'originalInvoiceNumber',
  headerName: 'HĐ gốc',
  width: 100,
  renderCell: (params) => (
    params.row.originalInvoiceNumber ? (
      <Link href={`/invoices/${params.row.originalInvoiceID}`}>
        {params.row.originalInvoiceNumber}
      </Link>
    ) : '-'
  ),
}
```

---

## 📝 **Helper Functions**

### **Invoice Type Utilities**

```typescript
// src/utils/invoiceTypeHelpers.ts

export const getInvoiceTypeLabel = (type: InvoiceType | null): string => {
  return type ? INVOICE_TYPE_LABELS[type] : INVOICE_TYPE_LABELS[InvoiceType.NORMAL]
}

export const getInvoiceTypeColor = (type: InvoiceType | null): string => {
  const colors: Record<InvoiceType, string> = {
    [InvoiceType.NORMAL]: '#1976d2',
    [InvoiceType.CANCELLED]: '#d32f2f',
    [InvoiceType.ADJUSTMENT]: '#ed6c02',
    [InvoiceType.REPLACEMENT]: '#0288d1',
    [InvoiceType.EXPLANATION]: '#757575',
  }
  return type ? colors[type] : colors[InvoiceType.NORMAL]
}

export const getInvoiceTypeIcon = (type: InvoiceType | null): JSX.Element => {
  const icons: Record<InvoiceType, JSX.Element> = {
    [InvoiceType.NORMAL]: <DescriptionIcon />,
    [InvoiceType.CANCELLED]: <CancelIcon />,
    [InvoiceType.ADJUSTMENT]: <EditIcon />,
    [InvoiceType.REPLACEMENT]: <SwapHorizIcon />,
    [InvoiceType.EXPLANATION]: <InfoIcon />,
  }
  return type ? icons[type] : icons[InvoiceType.NORMAL]
}

export const canAdjustInvoice = (invoice: InvoiceListItem): boolean => {
  // Chỉ điều chỉnh được hóa đơn đã phát hành, chưa hủy
  return (
    invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.ISSUED &&
    invoice.invoiceType !== InvoiceType.CANCELLED
  )
}

export const canReplaceInvoice = (invoice: InvoiceListItem): boolean => {
  // Chỉ thay thế được hóa đơn đã phát hành, chưa có hóa đơn thay thế
  return (
    invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.ISSUED &&
    invoice.invoiceType !== InvoiceType.REPLACEMENT &&
    invoice.invoiceType !== InvoiceType.CANCELLED
  )
}

export const formatAdjustmentAmount = (amount: number, type: 0 | 1): string => {
  const prefix = type === 0 ? '+' : ''
  return `${prefix}${formatCurrency(Math.abs(amount))}`
}
```

---

## 🧪 **Testing Scenarios**

### **Test 1: View Adjustment Invoice**
- [ ] Badge "Điều chỉnh" hiển thị
- [ ] Link đến hóa đơn gốc hoạt động
- [ ] Reference text hiển thị đầy đủ
- [ ] Adjustment summary đúng số liệu
- [ ] Lý do điều chỉnh hiển thị

### **Test 2: View Replacement Invoice**
- [ ] Badge "Thay thế" hiển thị
- [ ] Link đến hóa đơn gốc (gạch ngang)
- [ ] Comparison table hiển thị đúng
- [ ] Lý do thay thế hiển thị

### **Test 3: View Cancelled Invoice**
- [ ] Badge "Đã hủy" màu đỏ
- [ ] Watermark "ĐÃ HỦY" hiển thị
- [ ] Lý do hủy hiển thị
- [ ] Không cho phép edit/sign/send

### **Test 4: View Explanation Invoice**
- [ ] Badge "Giải trình" hiển thị
- [ ] Link đến hóa đơn gốc
- [ ] Nội dung giải trình hiển thị
- [ ] Attachments download được

### **Test 5: Print/PDF Export**
- [ ] Badge xuất hiện trong PDF
- [ ] Watermark (nếu có) xuất hiện
- [ ] Reference text in đầy đủ
- [ ] Layout đúng chuẩn

---

## 📊 **Metrics & Success Criteria**

### **Success Metrics:**
- ✅ 100% invoices display correct type badge
- ✅ Original invoice links work for all adjustment/replacement/explanation invoices
- ✅ Cancelled watermark visible in preview and PDF
- ✅ Adjustment calculations match backend
- ✅ No UI breaking for normal invoices (backward compatible)
- ✅ Loading time < 500ms for invoice detail

### **Code Quality:**
- ✅ Type-safe TypeScript interfaces
- ✅ Reusable components (Badge, Link, Summary)
- ✅ Consistent styling with MUI theme
- ✅ Accessible UI (ARIA labels, keyboard nav)
- ✅ Responsive design (mobile-friendly)

---

## ✅ **Conclusion**

### **Current Gaps:**
❌ **Backend không trả về `invoiceType` và các fields liên quan**
❌ **Không có API để query adjustments/replacements history**
❌ **Frontend chưa có logic hiển thị invoice type**

### **Required Actions:**

**Backend Team (Priority 1 - CRITICAL):**
1. Add `invoiceType` field to InvoiceListItem response
2. Add related fields (originalInvoiceID, referenceText, reasons, etc.)
3. Implement new API endpoints for adjustments/replacements history
4. Update database schema to store invoice relationships

**Frontend Team (After Backend completion):**
1. Update InvoiceListItem interface
2. Create InvoiceTypeBadge component
3. Create OriginalInvoiceLink component
4. Create AdjustmentSummary component
5. Update InvoiceDetail.tsx with type-specific rendering
6. Update InvoicePreviewModal.tsx with watermarks
7. Update InvoiceManagement.tsx list view

**Estimated Timeline:**
- Backend updates: 3-5 days
- Frontend updates: 2-3 days
- Testing: 1-2 days
- **Total: ~1.5 weeks**

---

**Status:** ⏳ **WAITING FOR BACKEND API UPDATES**
