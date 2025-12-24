# 📝 Tích hợp API Ký Số Hóa Đơn

## 🎯 Tổng quan

Tài liệu này mô tả việc tích hợp API ký số hóa đơn vào hệ thống EIMS. **Chỉ những hóa đơn đã được Kế toán trưởng duyệt** (trạng thái PENDING_SIGN = 7) mới được phép ký số.

---

## 📊 Luồng nghiệp vụ ký hóa đơn

```
┌─────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH KÝ HÓA ĐƠN                     │
└─────────────────────────────────────────────────────────────┘

1. DRAFT (Nháp) - Status ID: 1
   └─> Nhân viên tạo hóa đơn
        │
        ▼
   [Gửi duyệt]
        │
        ▼
2. PENDING_APPROVAL (Chờ duyệt) - Status ID: 6
   └─> Kế toán trưởng xem xét
        │
        ├─> [Từ chối] ──> CANCELLED (Đã hủy) - Status ID: 3 ❌
        │
        └─> [Duyệt] ──> 
             │
             ▼
3. PENDING_SIGN (Chờ ký) - Status ID: 7  ✅ CHỈ TRẠNG THÁI NÀY MȚI ĐƯỢC KÝ
   └─> Người có quyền ký số
        │
        ▼
   [Ký số hóa đơn]
        │
        ▼
4. ISSUED (Đã phát hành) - Status ID: 2  ✅
   └─> Hóa đơn hoàn thành, có thể gửi khách hàng
```

---

## 🔌 API Endpoint

### **POST** `/api/Invoice/{id}/sign`

**Mô tả:** Ký số hóa đơn điện tử

**Authorization:** Bearer Token (Required)

**Path Parameters:**
- `id` (integer, required): ID của hóa đơn cần ký

**Request Body:** Empty (`{}`)

**Response:**
- **200 OK**: Ký thành công, hóa đơn chuyển sang trạng thái ISSUED (2)
- **400 Bad Request**: Hóa đơn chưa được duyệt hoặc đã được ký
- **401 Unauthorized**: Không có quyền truy cập
- **404 Not Found**: Không tìm thấy hóa đơn

---

## 📋 cURL Request Example

```bash
curl -X 'POST' \
  'http://159.223.64.31/api/Invoice/1/sign' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d ''
```

---

## 💻 Implementation

### 1️⃣ Service Layer (`invoiceService.ts`)

```typescript
/**
 * Ký số hóa đơn
 * ⚠️ CHỈ được ký khi hóa đơn ở trạng thái PENDING_SIGN (7 - Chờ ký)
 * Sau khi ký thành công, trạng thái sẽ chuyển sang ISSUED (2 - Đã phát hành)
 * @param invoiceId - ID hóa đơn cần ký
 */
export const signInvoice = async (invoiceId: number): Promise<void> => {
  try {
    console.log(`[signInvoice] Signing invoice ${invoiceId}`);
    
    // ✅ Backend API: POST /api/Invoice/{id}/sign
    await axios.post(
      `/api/Invoice/${invoiceId}/sign`,
      {}, // Empty body
      { headers: getAuthHeaders() }
    );
    
    console.log('[signInvoice] ✅ Success - Invoice signed');
  } catch (error) {
    console.error('[signInvoice] Error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error('Không thể ký hóa đơn. Hóa đơn chưa được duyệt hoặc đã được ký.');
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hóa đơn.');
      }
    }
    return handleApiError(error, 'Ký hóa đơn thất bại');
  }
};
```

**Export thêm vào invoiceService:**
```typescript
const invoiceService = {
  // Templates
  getAllTemplates,
  getActiveTemplates,
  
  // Invoices
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  signInvoice,  // ✅ Thêm mới
};
```

---

### 2️⃣ UI Component - InvoiceApproval.tsx

#### **State Management**

```typescript
// State quản lý dialog ký số
const [signDialog, setSignDialog] = useState({
  open: false,
  invoiceId: '',
  invoiceNumber: '',
})
const [isSigningInvoice, setIsSigningInvoice] = useState(false)
```

#### **Event Handlers**

```typescript
// Handler mở dialog ký số
const handleOpenSignDialog = (invoiceId: string, invoiceNumber: string) => {
  setSignDialog({
    open: true,
    invoiceId,
    invoiceNumber,
  })
}

// Handler đóng dialog ký số
const handleCloseSignDialog = () => {
  setSignDialog({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
  })
}

// Handler xác nhận ký số
const handleConfirmSign = async () => {
  setIsSigningInvoice(true)
  try {
    // ✅ Gọi API ký hóa đơn
    await invoiceService.signInvoice(parseInt(signDialog.invoiceId))
    
    setSnackbar({
      open: true,
      message: `✅ Đã ký hóa đơn ${signDialog.invoiceNumber} thành công`,
      severity: 'success',
    })
    
    handleCloseSignDialog()
    
    // Reload data để refresh danh sách
    await loadInvoices()
    
  } catch (err) {
    setSnackbar({
      open: true,
      message: err instanceof Error ? err.message : 'Không thể ký hóa đơn',
      severity: 'error',
    })
  } finally {
    setIsSigningInvoice(false)
  }
}
```

#### **Menu Integration**

```typescript
// Component menu hành động
const InvoiceApprovalActionsMenu = ({ invoice, onApprove, onReject, onSign }) => {
  const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7
  
  const menuItems = [
    // ... other items
    {
      label: 'Ký số',
      icon: <DrawIcon fontSize="small" />,
      enabled: isPendingSign,  // ✅ Chỉ enable khi status = 7
      action: () => {
        onSign(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'secondary.main',
    },
    // ... more items
  ]
}
```

#### **Dialog UI**

```tsx
{/* Sign Invoice Dialog */}
<Dialog
  open={signDialog.open}
  onClose={handleCloseSignDialog}
  maxWidth="sm"
  fullWidth>
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <DrawIcon color="secondary" />
    Ký số hóa đơn
  </DialogTitle>
  <DialogContent>
    <Alert severity="info" sx={{ mb: 2 }}>
      Hóa đơn đã được Kế toán trưởng duyệt. Bạn có thể tiến hành ký số.
    </Alert>
    <Typography variant="body1" sx={{ mb: 1 }}>
      <strong>Số hóa đơn:</strong> {signDialog.invoiceNumber}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Sau khi ký số thành công, hóa đơn sẽ chuyển sang trạng thái 
      <strong>"Đã phát hành"</strong> và có thể gửi cho khách hàng.
    </Typography>
  </DialogContent>
  <DialogActions sx={{ p: 2, pt: 0 }}>
    <Button onClick={handleCloseSignDialog} disabled={isSigningInvoice}>
      Hủy
    </Button>
    <Button
      variant="contained"
      color="secondary"
      onClick={handleConfirmSign}
      disabled={isSigningInvoice}
      startIcon={<DrawIcon />}>
      {isSigningInvoice ? 'Đang ký...' : 'Xác nhận ký'}
    </Button>
  </DialogActions>
</Dialog>
```

---

### 3️⃣ UI Component - InvoiceManagement.tsx

Tích hợp tương tự như InvoiceApproval.tsx với các điểm chính:

1. **State quản lý dialog ký số**
2. **Handler mở/đóng dialog và xác nhận ký**
3. **Menu actions với điều kiện `isPendingSign`**
4. **Dialog UI xác nhận ký số**

---

## ✅ Validation Rules

### **Frontend Validation**

1. ✅ **Kiểm tra trạng thái trước khi hiển thị nút "Ký số"**
   ```typescript
   const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7
   enabled: isPendingSign
   ```

2. ✅ **Disable nút khi đang xử lý**
   ```typescript
   disabled={isSigningInvoice}
   ```

3. ✅ **Hiển thị thông báo xác nhận**
   - Alert thông tin: "Hóa đơn đã được Kế toán trưởng duyệt"
   - Số hóa đơn cần ký
   - Giải thích trạng thái sau khi ký

### **Backend Validation** (Expected)

1. ❌ **400 Bad Request nếu:**
   - Hóa đơn không ở trạng thái PENDING_SIGN (7)
   - Hóa đơn đã được ký trước đó

2. ❌ **401 Unauthorized nếu:**
   - Token không hợp lệ hoặc hết hạn
   - Người dùng không có quyền ký

3. ❌ **404 Not Found nếu:**
   - Invoice ID không tồn tại

---

## 🔐 Security Considerations

1. **Authorization Required**
   - Tất cả request phải có Bearer Token
   - Backend kiểm tra quyền ký hóa đơn

2. **Status Validation**
   - Chỉ ký được khi status = PENDING_SIGN (7)
   - Backend từ chối các trạng thái khác

3. **Audit Trail**
   - Backend nên log thông tin người ký
   - Timestamp và IP address

---

## 🧪 Testing Checklist

### **Unit Tests**

- [ ] Service `signInvoice()` gọi đúng endpoint
- [ ] Xử lý lỗi 400, 401, 404 chính xác
- [ ] Loading state được set đúng

### **Integration Tests**

- [ ] Chỉ hiển thị nút "Ký số" khi status = 7
- [ ] Dialog mở/đóng đúng
- [ ] Sau khi ký thành công, reload danh sách
- [ ] Snackbar hiển thị thông báo chính xác

### **E2E Tests**

- [ ] **Scenario 1: Ký thành công**
  1. Tạo hóa đơn (status 1)
  2. Gửi duyệt (status 6)
  3. Kế toán trưởng duyệt (status 7)
  4. Ký số (status 2) ✅

- [ ] **Scenario 2: Ký thất bại - Chưa duyệt**
  1. Tạo hóa đơn (status 1)
  2. Thử ký trực tiếp → Lỗi 400 ❌

- [ ] **Scenario 3: Ký thất bại - Đã ký rồi**
  1. Hóa đơn đã ở status 2
  2. Thử ký lại → Lỗi 400 ❌

---

## 📂 Files Changed

### **Modified Files**

1. ✅ `/src/services/invoiceService.ts`
   - Thêm function `signInvoice()`
   - Export trong `invoiceService` object

2. ✅ `/src/page/InvoiceApproval.tsx`
   - State management cho dialog ký số
   - Handlers: `handleOpenSignDialog`, `handleCloseSignDialog`, `handleConfirmSign`
   - Dialog UI cho ký số
   - Menu integration với prop `onSign`

3. ✅ `/src/page/InvoiceManagement.tsx`
   - State management cho dialog ký số
   - Handlers tương tự InvoiceApproval
   - Dialog UI cho ký số
   - Menu integration với prop `onSign`

### **Files Using This Feature**

- ✅ `/src/page/InvoiceApproval.tsx` - Kế toán trưởng ký hóa đơn sau khi duyệt
- ✅ `/src/page/InvoiceManagement.tsx` - Quản lý và ký hóa đơn
- ✅ `/src/constants/invoiceStatus.ts` - Định nghĩa status constants

---

## 🚀 Next Steps

### **Backend Requirements**

1. ⚠️ **Kiểm tra API `/api/Invoice/{id}/sign` đã hoạt động chưa**
2. ⚠️ **Verify response khi ký thành công**
3. ⚠️ **Test error handling cho các trường hợp:**
   - Hóa đơn chưa duyệt (status ≠ 7)
   - Hóa đơn đã ký (status = 2)
   - Người dùng không có quyền

### **Frontend Enhancements**

1. 🔄 **Thêm quyền ký vào role-based access control**
   - Chỉ Admin hoặc Kế toán trưởng mới ký được

2. 📊 **Thêm audit log viewer**
   - Hiển thị lịch sử ký hóa đơn

3. 🔔 **Real-time notifications**
   - Thông báo khi có hóa đơn cần ký

---

## 📞 Support

Nếu có vấn đề khi tích hợp, kiểm tra:

1. ✅ Backend API endpoint có hoạt động không?
2. ✅ Token authorization có hợp lệ không?
3. ✅ Status hóa đơn có đúng là PENDING_SIGN (7) không?
4. ✅ Console logs có báo lỗi gì không?

---

**Tài liệu được tạo:** 14/12/2025  
**Phiên bản:** 1.0  
**Tác giả:** GitHub Copilot
