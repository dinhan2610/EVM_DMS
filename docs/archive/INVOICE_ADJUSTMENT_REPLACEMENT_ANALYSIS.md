# 📊 Phân Tích Chuyên Nghiệp: Hóa Đơn Điều Chỉnh & Thay Thế

## 🎯 Executive Summary

Đây là phân tích chi tiết về **nghiệp vụ hóa đơn điều chỉnh (Adjustment) và hóa đơn thay thế (Replacement)** theo **Nghị định 123/2020/NĐ-CP** và **Thông tư 78/2021/TT-BTC** của Bộ Tài chính Việt Nam.

---

## 📋 1. PHÂN TÍCH NGHIỆP VỤ THEO PHÁP LUẬT

### 1.1. Hóa Đơn Điều Chỉnh (Invoice Adjustment)

**Định nghĩa (Theo Thông tư 78/2021):**
> Hóa đơn điều chỉnh được lập khi phát hiện sai sót **chỉ về giá trị** (số lượng, đơn giá, thuế suất) sau khi hóa đơn đã được phát hành.

**Điều kiện áp dụng:**
- ✅ Hóa đơn gốc đã được phát hành (ISSUED)
- ✅ Thông tin người mua, người bán KHÔNG SAI
- ✅ Chỉ điều chỉnh: Số lượng, Đơn giá, Thuế suất, Tiền thuế
- ✅ Không được thay đổi tên hàng hóa/dịch vụ
- ⚠️ **KHÔNG** thay đổi thông tin khách hàng

**Kết quả:**
- Hóa đơn điều chỉnh được lập mới (có số hóa đơn riêng)
- Hóa đơn gốc **VẪN CÓ HIỆU LỰC**, không bị hủy
- Giá trị cuối cùng = Hóa đơn gốc + Hóa đơn điều chỉnh

**Ví dụ thực tế:**
```
Hóa đơn gốc: INV-001 - 10,000,000 VNĐ (10% VAT) = 11,000,000 VNĐ
Phát hiện: Thiếu 2 sản phẩm, giá trị +2,000,000 VNĐ

→ Tạo Hóa đơn điều chỉnh: INV-001-ADJ-001
  Giá trị điều chỉnh: +2,000,000 VNĐ
  Thuế VAT 10%: +200,000 VNĐ
  Tổng điều chỉnh: +2,200,000 VNĐ

→ Giá trị thực tế = 11,000,000 + 2,200,000 = 13,200,000 VNĐ
```

---

### 1.2. Hóa Đơn Thay Thế (Invoice Replacement)

**Định nghĩa (Theo Thông tư 78/2021):**
> Hóa đơn thay thế được lập khi phát hiện sai sót **về thông tin người mua, người bán, hoặc nội dung hàng hóa/dịch vụ** sau khi hóa đơn đã được phát hành.

**Điều kiện áp dụng:**
- ✅ Hóa đơn gốc đã được phát hành (ISSUED)
- ✅ Sai sót về: Tên khách hàng, Mã số thuế, Địa chỉ
- ✅ Sai sót về: Tên hàng hóa/dịch vụ
- ✅ Sai sót về: Đơn vị tính
- ✅ Có thể thay đổi toàn bộ nội dung

**Kết quả:**
- Hóa đơn thay thế được lập mới (có số hóa đơn mới)
- Hóa đơn gốc **BỊ HỦY BỎ** (không còn hiệu lực)
- Hóa đơn thay thế có ghi chú "Thay thế cho hóa đơn số XXX"

**Ví dụ thực tế:**
```
Hóa đơn gốc: INV-001
Khách hàng: Công ty ABC (MST: 0123456789)
Giá trị: 11,000,000 VNĐ

Phát hiện: Nhầm tên khách hàng, đúng phải là Công ty XYZ (MST: 9876543210)

→ Tạo Hóa đơn thay thế: INV-002
  Khách hàng MỚI: Công ty XYZ (MST: 9876543210)
  Giá trị: 11,000,000 VNĐ (giữ nguyên hoặc điều chỉnh)
  Ghi chú: "Thay thế cho hóa đơn số INV-001 ngày 01/12/2024"

→ Hóa đơn INV-001 ❌ BỊ HỦY
→ Hóa đơn INV-002 ✅ CÓ HIỆU LỰC
```

---

## 🔍 2. PHÂN TÍCH API STRUCTURE

### 2.1. API Adjustment - ⚠️ CÓ VẤN ĐỀ

```json
{
  "originalInvoiceId": 0,           // ✅ OK
  "performedBy": 0,                 // ✅ OK - User ID thực hiện
  "adjustmentReason": "string",     // ✅ OK - Lý do điều chỉnh
  "newCustomerId": 0,               // ❌ SAI - KHÔNG ĐƯỢC THAY ĐỔI KHÁCH HÀNG!
  "adjustmentItems": [              // ✅ OK
    {
      "productID": 0,               // ✅ OK
      "quantity": 0,                // ✅ OK
      "unitPrice": 0,               // ✅ OK
      "overrideVATRate": 0          // ✅ OK
    }
  ]
}
```

**🚨 VẤN ĐỀ NGHIÊM TRỌNG:**

1. **`newCustomerId` không hợp lệ trong Adjustment API**
   - Theo quy định, hóa đơn điều chỉnh **KHÔNG ĐƯỢC** thay đổi thông tin khách hàng
   - Nếu cần đổi khách hàng → Phải dùng **Replacement API**
   - **Khuyến nghị:** Loại bỏ field `newCustomerId` khỏi Adjustment API

2. **Thiếu field quan trọng:**
   - ❌ `adjustmentType`: "INCREASE" | "DECREASE" - Điều chỉnh tăng hay giảm
   - ❌ `originalInvoiceNumber`: Số hóa đơn gốc (để hiển thị)
   - ❌ `adjustmentDate`: Ngày lập hóa đơn điều chỉnh

---

### 2.2. API Replacement - ✅ HỢP LỆ

```json
{
  "originalInvoiceId": 0,          // ✅ OK
  "performedBy": 0,                // ✅ OK
  "reason": "string",              // ✅ OK - Lý do thay thế
  "customerId": 0,                 // ✅ OK - Cho phép đổi khách hàng
  "note": "string",                // ✅ OK - Ghi chú
  "items": [                       // ✅ OK
    {
      "productID": 0,
      "quantity": 0,
      "unitPrice": 0,
      "overrideVATRate": 0
    }
  ]
}
```

**✅ API này hợp lệ nhưng cần cải thiện:**

1. **Thiếu thông tin khách hàng chi tiết:**
   - ❌ `customerName`: Tên khách hàng mới
   - ❌ `customerTaxCode`: MST mới
   - ❌ `customerAddress`: Địa chỉ mới
   - ❌ `customerEmail`: Email mới
   - ❌ `customerPhone`: SĐT mới

2. **Thiếu validation:**
   - ❌ Kiểm tra hóa đơn gốc có ở trạng thái ISSUED không
   - ❌ Kiểm tra hóa đơn gốc chưa bị thay thế trước đó

---

## 🎨 3. PHÂN TÍCH UI/UX

### 3.1. Hóa Đơn Điều Chỉnh UI - ✅ TỐT nhưng có thể cải thiện

**✅ Điểm mạnh:**
1. ✅ Hiển thị rõ thông tin hóa đơn gốc (số HĐ, giá trị, ngày phát hành)
2. ✅ Thông tin khách hàng DISABLED (không cho sửa) - **Đúng nghiệp vụ**
3. ✅ Có field nhập lý do điều chỉnh
4. ✅ Tính toán tự động: Subtotal, Tax, Total
5. ✅ Cho phép thêm/xóa dòng sản phẩm

**⚠️ Thiếu các tính năng quan trọng:**

1. **Không có chế độ "Điều chỉnh tăng/giảm":**
   ```tsx
   // Nên có dropdown chọn:
   <Select value={adjustmentType}>
     <MenuItem value="INCREASE">Điều chỉnh TĂNG (+)</MenuItem>
     <MenuItem value="DECREASE">Điều chỉnh GIẢM (-)</MenuItem>
   </Select>
   ```

2. **Không hiển thị so sánh Before/After:**
   ```tsx
   // Nên có bảng so sánh:
   ┌─────────────────┬──────────────┬───────────────┬─────────────┐
   │                 │ Hóa đơn gốc  │ Điều chỉnh    │ Tổng cuối   │
   ├─────────────────┼──────────────┼───────────────┼─────────────┤
   │ Tổng tiền       │ 10,000,000   │ +2,000,000    │ 12,000,000  │
   │ VAT 10%         │  1,000,000   │   +200,000    │  1,200,000  │
   │ TỔNG CỘNG       │ 11,000,000   │ +2,200,000    │ 13,200,000  │
   └─────────────────┴──────────────┴───────────────┴─────────────┘
   ```

3. **Không có xác nhận trước khi phát hành:**
   - Nên có modal xác nhận với thông tin tóm tắt
   - Hiển thị: "Bạn có chắc chắn muốn phát hành hóa đơn điều chỉnh này?"
   - Cảnh báo: "Hóa đơn điều chỉnh sau khi phát hành không thể hủy"

4. **Không có tải lên file đính kèm:**
   - Theo quy định, cần có văn bản giải trình lý do điều chỉnh
   - Nên có chức năng upload file PDF/DOC

---

### 3.2. Hóa Đơn Thay Thế UI - ✅ TỐT nhưng cần cải thiện

**✅ Điểm mạnh:**
1. ✅ Hiển thị cảnh báo rõ ràng (Warning Alert)
2. ✅ Cho phép thay đổi toàn bộ thông tin (khách hàng, items)
3. ✅ Có DatePicker cho ngày phát hành mới
4. ✅ Có field nhập lý do thay thế

**⚠️ Thiếu các tính năng quan trọng:**

1. **Không có nút "Copy từ hóa đơn gốc":**
   ```tsx
   // Nên có nút để copy dữ liệu cũ:
   <Button onClick={handleCopyFromOriginal}>
     📋 Sao chép từ hóa đơn gốc
   </Button>
   ```

2. **Không hiển thị hóa đơn gốc để so sánh:**
   - Nên có 2 cột: Cũ vs Mới
   - Highlight phần khác biệt bằng màu

3. **Không có xác nhận nghiêm ngặt:**
   ```tsx
   // Nên có checkbox confirm:
   <Checkbox checked={confirmUnderstand}>
     Tôi hiểu rằng hóa đơn gốc INV-001 sẽ BỊ HỦY BỎ và không còn hiệu lực
   </Checkbox>
   <Checkbox checked={confirmAccuracy}>
     Tôi đã kiểm tra kỹ thông tin trên hóa đơn thay thế
   </Checkbox>
   ```

4. **Không có preview PDF:**
   - Nên có nút "Xem trước" để xem hóa đơn PDF trước khi phát hành

---

## 🔧 4. KHUYẾN NGHỊ CẢI TIẾN

### 4.1. Backend API Improvements

#### **Adjustment API - Cần sửa ngay:**

```typescript
// ❌ CURRENT (SAI):
interface AdjustmentRequest {
  originalInvoiceId: number
  performedBy: number
  adjustmentReason: string
  newCustomerId: number           // ❌ LOẠI BỎ FIELD NÀY
  adjustmentItems: AdjustmentItem[]
}

// ✅ RECOMMENDED (ĐÚNG):
interface AdjustmentRequest {
  originalInvoiceId: number
  performedBy: number
  adjustmentType: 'INCREASE' | 'DECREASE'  // ✅ THÊM
  adjustmentReason: string
  adjustmentDate?: string          // ✅ THÊM (optional, default = today)
  adjustmentItems: AdjustmentItem[]
  attachments?: File[]             // ✅ THÊM - Văn bản giải trình
}

interface AdjustmentItem {
  productID: number
  description?: string             // ✅ THÊM - Mô tả điều chỉnh
  quantity: number                 // Có thể âm nếu giảm
  unitPrice: number
  overrideVATRate?: number
}
```

#### **Replacement API - Cần bổ sung:**

```typescript
// ❌ CURRENT (THIẾU):
interface ReplacementRequest {
  originalInvoiceId: number
  performedBy: number
  reason: string
  customerId: number               // ❌ KHÔNG ĐỦ
  note: string
  items: ReplacementItem[]
}

// ✅ RECOMMENDED (ĐẦY ĐỦ):
interface ReplacementRequest {
  originalInvoiceId: number
  performedBy: number
  reason: string
  replacementDate?: string         // ✅ THÊM
  
  // ✅ Thông tin khách hàng ĐẦY ĐỦ:
  customer: {
    id?: number                    // Optional nếu là khách hàng mới
    name: string
    taxCode: string
    address: string
    email: string
    phone: string
  }
  
  note: string
  items: ReplacementItem[]
  attachments?: File[]             // ✅ THÊM
}
```

---

### 4.2. Frontend UI/UX Improvements

#### **Hóa Đơn Điều Chỉnh:**

1. **Thêm Adjustment Type Selector:**
```tsx
<FormControl fullWidth>
  <InputLabel>Loại điều chỉnh</InputLabel>
  <Select value={adjustmentType} onChange={handleTypeChange}>
    <MenuItem value="INCREASE">
      <Stack direction="row" spacing={1} alignItems="center">
        <TrendingUpIcon color="success" />
        <Typography>Điều chỉnh TĂNG giá trị</Typography>
      </Stack>
    </MenuItem>
    <MenuItem value="DECREASE">
      <Stack direction="row" spacing={1} alignItems="center">
        <TrendingDownIcon color="error" />
        <Typography>Điều chỉnh GIẢM giá trị</Typography>
      </Stack>
    </MenuItem>
  </Select>
</FormControl>
```

2. **Thêm Comparison Table:**
```tsx
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Chỉ tiêu</TableCell>
        <TableCell align="right">Hóa đơn gốc</TableCell>
        <TableCell align="right">Điều chỉnh</TableCell>
        <TableCell align="right">Tổng cuối</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Tổng tiền hàng</TableCell>
        <TableCell align="right">{formatCurrency(originalSubtotal)}</TableCell>
        <TableCell align="right" sx={{ color: adjustmentType === 'INCREASE' ? 'green' : 'red' }}>
          {adjustmentType === 'INCREASE' ? '+' : '-'}{formatCurrency(adjustmentSubtotal)}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
          {formatCurrency(finalSubtotal)}
        </TableCell>
      </TableRow>
      {/* Tương tự cho VAT và Total */}
    </TableBody>
  </Table>
</TableContainer>
```

3. **Thêm File Upload:**
```tsx
<Box sx={{ mt: 3 }}>
  <Typography variant="subtitle1" sx={{ mb: 1 }}>
    Văn bản giải trình (bắt buộc)
  </Typography>
  <Button
    variant="outlined"
    component="label"
    startIcon={<AttachFileIcon />}
  >
    Tải lên file đính kèm
    <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
  </Button>
  {attachments.length > 0 && (
    <List>
      {attachments.map((file, index) => (
        <ListItem key={index}>
          <ListItemIcon><DescriptionIcon /></ListItemIcon>
          <ListItemText primary={file.name} secondary={formatFileSize(file.size)} />
          <IconButton onClick={() => handleRemoveFile(index)}>
            <DeleteIcon />
          </IconButton>
        </ListItem>
      ))}
    </List>
  )}
</Box>
```

4. **Thêm Confirmation Modal:**
```tsx
<Dialog open={showConfirmModal} maxWidth="md" fullWidth>
  <DialogTitle>
    <Stack direction="row" spacing={1} alignItems="center">
      <WarningIcon color="warning" />
      <Typography variant="h6">Xác nhận phát hành hóa đơn điều chỉnh</Typography>
    </Stack>
  </DialogTitle>
  <DialogContent>
    <Alert severity="warning" sx={{ mb: 2 }}>
      Hóa đơn điều chỉnh sau khi phát hành không thể hủy hoặc chỉnh sửa
    </Alert>
    
    <Typography variant="subtitle1" sx={{ mb: 2 }}>Thông tin tóm tắt:</Typography>
    
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography color="text.secondary">Hóa đơn gốc:</Typography>
        <Typography fontWeight="bold">{originalInvoiceNumber}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography color="text.secondary">Loại điều chỉnh:</Typography>
        <Typography fontWeight="bold" color={adjustmentType === 'INCREASE' ? 'success.main' : 'error.main'}>
          {adjustmentType === 'INCREASE' ? 'TĂNG' : 'GIẢM'} giá trị
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography color="text.secondary">Giá trị điều chỉnh:</Typography>
        <Typography fontWeight="bold" fontSize="1.2rem">
          {adjustmentType === 'INCREASE' ? '+' : '-'}{formatCurrency(totalAdjustment)}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography color="text.secondary">Giá trị cuối cùng:</Typography>
        <Typography fontWeight="bold" fontSize="1.3rem" color="primary">
          {formatCurrency(finalTotal)}
        </Typography>
      </Box>
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseModal}>Hủy</Button>
    <Button variant="contained" onClick={handleConfirmIssue}>
      Xác nhận phát hành
    </Button>
  </DialogActions>
</Dialog>
```

---

#### **Hóa Đơn Thay Thế:**

1. **Thêm Copy Button:**
```tsx
<Box sx={{ mb: 2 }}>
  <Button
    variant="outlined"
    startIcon={<ContentCopyIcon />}
    onClick={handleCopyFromOriginal}
  >
    📋 Sao chép thông tin từ hóa đơn gốc
  </Button>
</Box>
```

2. **Thêm Side-by-Side Comparison:**
```tsx
<Grid container spacing={2}>
  {/* Cột BÊN TRÁI: Hóa đơn gốc (Read-only) */}
  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
        ❌ Hóa đơn gốc (sẽ bị hủy)
      </Typography>
      <TextField
        fullWidth
        label="Tên khách hàng"
        value={originalInvoice.customerName}
        disabled
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Mã số thuế"
        value={originalInvoice.customerTaxCode}
        disabled
        sx={{ mb: 2 }}
      />
      {/* ... các field khác */}
    </Paper>
  </Grid>
  
  {/* Cột BÊN PHẢI: Hóa đơn thay thế (Editable) */}
  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
        ✅ Hóa đơn thay thế (mới)
      </Typography>
      <TextField
        fullWidth
        label="Tên khách hàng"
        value={formData.customerName}
        onChange={(e) => handleChange('customerName', e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Mã số thuế"
        value={formData.customerTaxCode}
        onChange={(e) => handleChange('customerTaxCode', e.target.value)}
        sx={{ mb: 2 }}
      />
      {/* ... các field khác */}
    </Paper>
  </Grid>
</Grid>
```

3. **Thêm Strict Confirmation:**
```tsx
<Box sx={{ mt: 3, p: 2, border: '2px solid #ff9800', borderRadius: 1, backgroundColor: '#fff3e0' }}>
  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00' }}>
    ⚠️ Xác nhận thông tin (Bắt buộc)
  </Typography>
  
  <FormControlLabel
    control={
      <Checkbox
        checked={confirmations.understandCancel}
        onChange={(e) => handleConfirmationChange('understandCancel', e.target.checked)}
      />
    }
    label={
      <Typography>
        Tôi hiểu rằng hóa đơn gốc <strong>{originalInvoiceNumber}</strong> sẽ BỊ HỦY BỎ hoàn toàn và không còn hiệu lực pháp lý
      </Typography>
    }
  />
  
  <FormControlLabel
    control={
      <Checkbox
        checked={confirmations.verifiedAccuracy}
        onChange={(e) => handleConfirmationChange('verifiedAccuracy', e.target.checked)}
      />
    }
    label={
      <Typography>
        Tôi đã kiểm tra kỹ lưỡng tất cả thông tin trên hóa đơn thay thế và xác nhận thông tin chính xác 100%
      </Typography>
    }
  />
  
  <FormControlLabel
    control={
      <Checkbox
        checked={confirmations.notifiedCustomer}
        onChange={(e) => handleConfirmationChange('notifiedCustomer', e.target.checked)}
      />
    }
    label={
      <Typography>
        Tôi sẽ thông báo cho khách hàng về việc thay thế hóa đơn và gửi hóa đơn mới
      </Typography>
    }
  />
</Box>

<Button
  variant="contained"
  fullWidth
  disabled={!Object.values(confirmations).every(v => v)}
  onClick={handleIssueReplacement}
  sx={{ mt: 2 }}
>
  Phát hành hóa đơn thay thế
</Button>
```

---

### 4.3. Business Logic Improvements

#### **Validation Rules:**

1. **Adjustment Invoice:**
```typescript
const validateAdjustment = (data: AdjustmentData): ValidationResult => {
  const errors: string[] = []
  
  // 1. Check hóa đơn gốc phải ở trạng thái ISSUED
  if (originalInvoice.status !== 'ISSUED') {
    errors.push('Chỉ có thể điều chỉnh hóa đơn đã phát hành')
  }
  
  // 2. Check hóa đơn gốc không được bị hủy hoặc thay thế
  if (originalInvoice.isCancelled || originalInvoice.isReplaced) {
    errors.push('Hóa đơn gốc đã bị hủy hoặc thay thế, không thể điều chỉnh')
  }
  
  // 3. Check phải có ít nhất 1 item điều chỉnh
  if (data.adjustmentItems.length === 0) {
    errors.push('Phải có ít nhất 1 sản phẩm/dịch vụ điều chỉnh')
  }
  
  // 4. Check giá trị điều chỉnh không được bằng 0
  const totalAdjustment = calculateTotalAdjustment(data.adjustmentItems)
  if (totalAdjustment === 0) {
    errors.push('Giá trị điều chỉnh phải khác 0')
  }
  
  // 5. Check phải có lý do điều chỉnh
  if (!data.adjustmentReason || data.adjustmentReason.trim().length < 10) {
    errors.push('Lý do điều chỉnh phải có ít nhất 10 ký tự')
  }
  
  // 6. Check phải có file đính kèm (văn bản giải trình)
  if (!data.attachments || data.attachments.length === 0) {
    errors.push('Phải có văn bản giải trình lý do điều chỉnh')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

2. **Replacement Invoice:**
```typescript
const validateReplacement = (data: ReplacementData): ValidationResult => {
  const errors: string[] = []
  
  // 1. Check hóa đơn gốc phải ở trạng thái ISSUED
  if (originalInvoice.status !== 'ISSUED') {
    errors.push('Chỉ có thể thay thế hóa đơn đã phát hành')
  }
  
  // 2. Check hóa đơn gốc chưa bị thay thế trước đó
  if (originalInvoice.isReplaced) {
    errors.push('Hóa đơn gốc đã được thay thế, không thể thay thế lại')
  }
  
  // 3. Check phải có thay đổi so với hóa đơn gốc
  if (isIdenticalToOriginal(data, originalInvoice)) {
    errors.push('Hóa đơn thay thế phải có ít nhất 1 thay đổi so với hóa đơn gốc')
  }
  
  // 4. Check thông tin khách hàng đầy đủ
  if (!data.customer.name || !data.customer.taxCode || !data.customer.address) {
    errors.push('Thông tin khách hàng không đầy đủ')
  }
  
  // 5. Check mã số thuế hợp lệ
  if (!isValidTaxCode(data.customer.taxCode)) {
    errors.push('Mã số thuế không hợp lệ')
  }
  
  // 6. Check phải có lý do thay thế
  if (!data.reason || data.reason.trim().length < 20) {
    errors.push('Lý do thay thế phải có ít nhất 20 ký tự và giải thích rõ ràng')
  }
  
  // 7. Check user confirmations
  if (!data.confirmations?.understandCancel || 
      !data.confirmations?.verifiedAccuracy ||
      !data.confirmations?.notifiedCustomer) {
    errors.push('Phải xác nhận đầy đủ các thông tin trước khi phát hành')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

---

### 4.4. Database Schema Improvements

```sql
-- Table: invoice_adjustments
CREATE TABLE invoice_adjustments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  adjustment_number VARCHAR(50) UNIQUE NOT NULL, -- INV-001-ADJ-001
  original_invoice_id BIGINT NOT NULL,
  adjustment_type ENUM('INCREASE', 'DECREASE') NOT NULL,
  adjustment_reason TEXT NOT NULL,
  adjustment_date DATETIME NOT NULL,
  performed_by BIGINT NOT NULL,
  
  -- Financial info
  original_subtotal DECIMAL(18,2) NOT NULL,
  original_vat_amount DECIMAL(18,2) NOT NULL,
  original_total DECIMAL(18,2) NOT NULL,
  
  adjustment_subtotal DECIMAL(18,2) NOT NULL,
  adjustment_vat_amount DECIMAL(18,2) NOT NULL,
  adjustment_total DECIMAL(18,2) NOT NULL,
  
  final_subtotal DECIMAL(18,2) NOT NULL,
  final_vat_amount DECIMAL(18,2) NOT NULL,
  final_total DECIMAL(18,2) NOT NULL,
  
  -- Metadata
  status ENUM('DRAFT', 'ISSUED') DEFAULT 'DRAFT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (original_invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (performed_by) REFERENCES users(id),
  INDEX idx_original_invoice (original_invoice_id),
  INDEX idx_adjustment_date (adjustment_date)
);

-- Table: invoice_adjustment_items
CREATE TABLE invoice_adjustment_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  adjustment_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  description TEXT,
  quantity INT NOT NULL, -- Có thể âm nếu giảm
  unit_price DECIMAL(18,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  line_total DECIMAL(18,2) NOT NULL,
  
  FOREIGN KEY (adjustment_id) REFERENCES invoice_adjustments(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Table: invoice_replacements
CREATE TABLE invoice_replacements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  replacement_invoice_id BIGINT UNIQUE NOT NULL, -- ID của hóa đơn thay thế mới
  original_invoice_id BIGINT UNIQUE NOT NULL,    -- Mỗi HĐ gốc chỉ được thay thế 1 lần
  replacement_reason TEXT NOT NULL,
  replacement_date DATETIME NOT NULL,
  performed_by BIGINT NOT NULL,
  
  -- Customer info changes (có thể NULL nếu không đổi)
  new_customer_id BIGINT,
  new_customer_name VARCHAR(255),
  new_customer_tax_code VARCHAR(20),
  new_customer_address TEXT,
  new_customer_email VARCHAR(255),
  new_customer_phone VARCHAR(20),
  
  -- Metadata
  status ENUM('COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (replacement_invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (original_invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (performed_by) REFERENCES users(id),
  FOREIGN KEY (new_customer_id) REFERENCES customers(id),
  
  INDEX idx_original_invoice (original_invoice_id),
  INDEX idx_replacement_date (replacement_date)
);

-- Add columns to invoices table
ALTER TABLE invoices ADD COLUMN is_adjustment BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN is_replacement BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN original_invoice_id BIGINT NULL;
ALTER TABLE invoices ADD COLUMN replaced_by_invoice_id BIGINT NULL;

ALTER TABLE invoices ADD FOREIGN KEY (original_invoice_id) REFERENCES invoices(id);
ALTER TABLE invoices ADD FOREIGN KEY (replaced_by_invoice_id) REFERENCES invoices(id);
```

---

## 📊 5. WORKFLOW COMPARISON

### 5.1. Adjustment Workflow

```
┌────────────────────────────────────────────────────────────┐
│         LUỒNG XỬ LÝ HÓA ĐƠN ĐIỀU CHỈNH                    │
└────────────────────────────────────────────────────────────┘

1. User chọn "Tạo HĐ điều chỉnh" từ hóa đơn gốc
   │
   ▼
2. System kiểm tra:
   ✓ Hóa đơn gốc status = ISSUED?
   ✓ Chưa bị hủy?
   ✓ Chưa bị thay thế?
   │
   ├─ ❌ Không đạt → Hiển thị lỗi
   │
   └─ ✅ Đạt → Chuyển đến trang tạo điều chỉnh
       │
       ▼
3. User nhập:
   • Chọn loại: TĂNG / GIẢM
   • Nhập lý do điều chỉnh
   • Thêm/sửa items
   • Upload file giải trình
   │
   ▼
4. System tính toán:
   • Giá trị điều chỉnh = Σ (quantity × unitPrice)
   • VAT điều chỉnh = Giá trị × VAT rate
   • Tổng điều chỉnh = Giá trị + VAT
   │
   • Giá trị cuối = Gốc + Điều chỉnh
   │
   ▼
5. User click "Phát hành"
   │
   ▼
6. System hiển thị Modal xác nhận:
   • Tóm tắt thông tin
   • Cảnh báo không thể hủy
   │
   ├─ User click "Hủy" → Quay lại form
   │
   └─ User click "Xác nhận"
       │
       ▼
7. System gọi API:
   POST /api/Invoice/adjustment
   {
     "originalInvoiceId": 123,
     "adjustmentType": "INCREASE",
     "adjustmentReason": "...",
     "adjustmentItems": [...]
   }
   │
   ▼
8. Backend xử lý:
   • Tạo record mới trong invoice_adjustments
   • Tạo invoice_adjustment_items
   • Cập nhật financial summary của invoice gốc
   • Ghi audit log
   │
   ▼
9. Response:
   • Status: 200 OK
   • Data: { adjustmentId, adjustmentNumber, ... }
   │
   ▼
10. Frontend:
    • Hiển thị thông báo thành công
    • Redirect về trang chi tiết HĐ gốc
    • Hiển thị lịch sử điều chỉnh
```

---

### 5.2. Replacement Workflow

```
┌────────────────────────────────────────────────────────────┐
│          LUỒNG XỬ LÝ HÓA ĐƠN THAY THẾ                     │
└────────────────────────────────────────────────────────────┘

1. User chọn "Tạo HĐ thay thế" từ hóa đơn gốc
   │
   ▼
2. System kiểm tra:
   ✓ Hóa đơn gốc status = ISSUED?
   ✓ Chưa bị thay thế trước đó?
   │
   ├─ ❌ Không đạt → Hiển thị lỗi
   │
   └─ ✅ Đạt → Chuyển đến trang tạo thay thế
       │
       ▼
3. System hiển thị:
   • Cột BÊN TRÁI: Hóa đơn gốc (read-only)
   • Cột BÊN PHẢI: Hóa đơn thay thế (editable)
   │
   ▼
4. User có thể:
   • Click "Sao chép từ gốc" → Auto-fill form
   • Sửa thông tin khách hàng
   • Sửa items
   • Nhập lý do thay thế
   │
   ▼
5. System validation real-time:
   ✓ Có thay đổi so với gốc?
   ✓ MST hợp lệ?
   ✓ Lý do >= 20 ký tự?
   │
   ▼
6. User check 3 confirmations:
   ☑ Hiểu hóa đơn gốc bị hủy
   ☑ Đã kiểm tra kỹ
   ☑ Sẽ thông báo khách hàng
   │
   ▼
7. User click "Phát hành" (disabled nếu chưa check đủ)
   │
   ▼
8. System hiển thị Modal xác nhận NGHIÊM NGẶT:
   ⚠️ WARNING: Hóa đơn gốc INV-001 sẽ BỊ HỦY BỎ
   ⚠️ Không thể hoàn tác
   
   Yêu cầu nhập lại số hóa đơn gốc để xác nhận:
   [ Nhập INV-001 để xác nhận ]
   │
   ├─ Nhập sai → Không cho phát hành
   │
   └─ Nhập đúng → Cho phép tiếp tục
       │
       ▼
9. System gọi API:
   POST /api/Invoice/replacement
   {
     "originalInvoiceId": 123,
     "reason": "...",
     "customer": { ... },
     "items": [ ... ]
   }
   │
   ▼
10. Backend xử lý (TRANSACTION):
    BEGIN TRANSACTION;
    
    • Tạo invoice mới với số mới
    • Copy customer, items từ request
    • Set is_replacement = TRUE
    • Set original_invoice_id = 123
    
    • Update invoice gốc:
      - status = CANCELLED
      - cancelled_reason = "Replaced by INV-XXX"
      - replaced_by_invoice_id = new_invoice_id
    
    • Tạo record trong invoice_replacements
    • Ghi audit log
    
    COMMIT;
    │
    ▼
11. Response:
    • Status: 200 OK
    • Data: { 
        newInvoiceId, 
        newInvoiceNumber,
        originalInvoiceId 
      }
    │
    ▼
12. Frontend:
    • Hiển thị modal thành công với 2 buttons:
      [Xem hóa đơn mới] [Quay về danh sách]
    • Highlight hóa đơn mới trong danh sách
```

---

## 🎯 6. TỔNG KẾT & PRIORITY

### 🚨 Critical Issues (Fix ngay):

1. **❌ API Adjustment có field `newCustomerId` SAI NGHIỆP VỤ**
   - Priority: **P0 - BLOCKER**
   - Impact: Vi phạm quy định pháp luật
   - Action: Loại bỏ field này ngay lập tức

2. **❌ Thiếu validation hóa đơn gốc**
   - Priority: **P0 - BLOCKER**
   - Impact: Có thể điều chỉnh/thay thế hóa đơn không hợp lệ
   - Action: Thêm validation ở cả frontend và backend

3. **❌ Không có confirmation modal nghiêm ngặt**
   - Priority: **P1 - CRITICAL**
   - Impact: User có thể phát hành nhầm
   - Action: Thêm modal xác nhận với checkboxes

---

### ⚠️ Important Improvements (Cần có):

4. **Thiếu field `adjustmentType` trong API**
   - Priority: **P1 - CRITICAL**
   - Impact: Không phân biệt được tăng/giảm
   - Action: Thêm vào API request

5. **Không có so sánh Before/After**
   - Priority: **P2 - HIGH**
   - Impact: User khó kiểm tra
   - Action: Thêm comparison table

6. **Thiếu file upload giải trình**
   - Priority: **P2 - HIGH**
   - Impact: Thiếu căn cứ pháp lý
   - Action: Thêm file upload component

---

### ✅ Nice-to-have Features:

7. **Preview PDF**
8. **Email notification tự động**
9. **Audit trail chi tiết**
10. **Export báo cáo điều chỉnh/thay thế**

---

## 📌 7. ACTION ITEMS

### For Backend Team:

- [ ] **URGENT:** Loại bỏ `newCustomerId` từ Adjustment API
- [ ] Thêm `adjustmentType` enum vào Adjustment API
- [ ] Thêm validation status hóa đơn gốc
- [ ] Thêm check hóa đơn gốc chưa bị thay thế
- [ ] Bổ sung thông tin khách hàng đầy đủ vào Replacement API
- [ ] Tạo database schema cho adjustments/replacements
- [ ] Implement transaction cho replacement (cancel old + create new)
- [ ] Thêm audit log chi tiết

### For Frontend Team:

- [ ] **URGENT:** Xóa logic liên quan đến `newCustomerId` trong Adjustment UI
- [ ] Thêm Adjustment Type Selector (INCREASE/DECREASE)
- [ ] Thêm Comparison Table (Before/After/Final)
- [ ] Thêm Confirmation Modal với checkboxes
- [ ] Thêm File Upload component
- [ ] Implement Side-by-Side comparison cho Replacement
- [ ] Thêm "Copy từ gốc" button
- [ ] Thêm strict confirmation với type-to-confirm
- [ ] Improve error handling và validation messages

### For QA Team:

- [ ] Test case: Không được điều chỉnh hóa đơn DRAFT
- [ ] Test case: Không được điều chỉnh hóa đơn đã thay thế
- [ ] Test case: Không được thay thế hóa đơn đã thay thế
- [ ] Test case: Validation file upload
- [ ] Test case: Transaction rollback khi replacement fail
- [ ] Test case: Audit log ghi đầy đủ thông tin

---

**Generated by:** Claude Sonnet 4.5  
**Date:** January 2, 2026  
**Version:** 1.0.0
