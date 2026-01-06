# 🚀 Tích Hợp API Gửi Thuế - Mô Hình E-Invoice Phổ Thông (B2B)

## 📋 Tổng Quan

Tài liệu này mô tả chi tiết việc tích hợp API gửi hóa đơn lên cơ quan thuế theo **MÔ HÌNH SỐ 1** cho phần mềm E-Invoice phổ thông (B2B).

### ✨ Tính Năng Chính

- ✅ **Nút "Ký & Phát hành"**: Tự động ký + gửi cơ quan thuế
- ✅ **Xử lý lỗi thông minh**: Trạng thái SEND_ERROR + nút "Gửi lại" 
- ✅ **Hiển thị mã CQT**: Mã cơ quan thuế hiển thị ngay lập tức sau khi đồng bộ
- ✅ **UX tối ưu**: Thông báo rõ ràng, feedback tức thì

---

## 🎯 Luồng Hoạt Động (Workflow)

### 1️⃣ Luồng Chính - Thành Công

```
PENDING_SIGN (Chờ ký)
    ↓
[Nhấn "Ký & Phát hành"]
    ↓
Ký số hóa đơn (API: /api/Invoice/{id}/sign)
    ↓
Tự động gửi CQT (API: /api/Tax/submit?invoiceId={id})
    ↓
✅ Nhận mã CQT
    ↓
Cập nhật trạng thái: ISSUED (Đã phát hành)
    ↓
Hiển thị mã CQT trên bảng danh sách
```

### 2️⃣ Luồng Xử Lý Lỗi

```
PENDING_SIGN (Chờ ký)
    ↓
[Nhấn "Ký & Phát hành"]
    ↓
Ký số thành công ✅
    ↓
Gửi CQT thất bại ❌
    ↓
Cập nhật trạng thái: SEND_ERROR (Lỗi gửi CQT)
    ↓
Hiển thị nút "Gửi lại CQT"
    ↓
[Nhấn "Gửi lại CQT"]
    ↓
✅ Thành công → ISSUED
❌ Thất bại → Vẫn SEND_ERROR (thử lại tiếp)
```

---

## 🔧 Các Thay Đổi Kỹ Thuật

### 1. Cập Nhật Constants (`invoiceStatus.ts`)

#### ✅ Thêm Trạng Thái Mới

```typescript
export const INVOICE_INTERNAL_STATUS = {
  // ... các trạng thái cũ
  SEND_ERROR: 8,  // ⭐ MỚI: Lỗi gửi CQT
} as const;

export const INVOICE_INTERNAL_STATUS_LABELS: Record<number, string> = {
  // ... labels cũ
  [INVOICE_INTERNAL_STATUS.SEND_ERROR]: 'Lỗi gửi CQT',  // ⭐ MỚI
};

export const INVOICE_INTERNAL_STATUS_COLORS: Record<number, '...'> = {
  // ... colors cũ
  [INVOICE_INTERNAL_STATUS.SEND_ERROR]: 'error',  // ⭐ MỚI - Màu đỏ
};
```

---

### 2. Thêm API Service (`invoiceService.ts`)

#### ✅ API Gửi Cơ Quan Thuế

```typescript
/**
 * Gửi hóa đơn lên cơ quan thuế (Submit to Tax Authority)
 * API: POST /api/Tax/submit?invoiceId={id}
 * @param invoiceId - ID hóa đơn cần gửi
 * @returns Mã cơ quan thuế (taxAuthorityCode) nếu thành công
 */
export const submitToTaxAuthority = async (invoiceId: number): Promise<string> => {
  try {
    const response = await axios.post(
      `/api/Tax/submit?invoiceId=${invoiceId}`,
      null, // Empty body
      { headers: getAuthHeaders() }
    );
    
    // Trả về mã CQT từ response
    const taxCode = response.data?.taxAuthorityCode || response.data?.code || response.data;
    return taxCode;
  } catch (error) {
    // Xử lý lỗi chi tiết
    // ...
  }
};
```

#### 📌 Cách Sử Dụng

```typescript
import invoiceService from '@/services/invoiceService';

// Gửi hóa đơn lên CQT
const taxCode = await invoiceService.submitToTaxAuthority(30);
console.log('Mã CQT:', taxCode); // VD: "ABC123XYZ"
```

---

### 3. Tối Ưu UI/UX (`InvoiceManagement.tsx`)

#### ✅ Nút "Ký & Phát hành"

```typescript
{
  label: 'Ký & Phát hành',  // ⭐ Đổi tên từ "Ký số"
  icon: <DrawIcon fontSize="small" />,
  enabled: isPendingSign,
  action: () => {
    onSign(invoice.id, invoice.invoiceNumber)
    handleClose()
  },
  color: 'secondary.main',
}
```

#### ✅ Nút "Gửi lại CQT"

```typescript
{
  label: 'Gửi lại CQT',  // ⭐ MỚI
  icon: <RestoreIcon fontSize="small" />,
  enabled: isSendError,  // Chỉ hiện khi trạng thái = SEND_ERROR
  action: () => {
    onResendToTax(invoice.id, invoice.invoiceNumber)
    handleClose()
  },
  color: 'warning.main',
}
```

#### ✅ Handler "Ký & Phát hành"

```typescript
const handleConfirmSign = async () => {
  try {
    // BƯỚC 1: Ký số
    await invoiceService.signInvoice(invoiceId, userId);
    
    // BƯỚC 2: TỰ ĐỘNG gửi CQT (MÔ HÌNH SỐ 1)
    try {
      const taxCode = await invoiceService.submitToTaxAuthority(invoiceId);
      
      // ✅ Thành công
      setSnackbar({
        message: `✅ Đã ký & phát hành thành công!\nMã CQT: ${taxCode}`,
        severity: 'success',
      });
      
      await loadInvoices(); // Reload để hiển thị mã CQT
      
    } catch (taxError) {
      // ❌ Gửi thuế thất bại
      await invoiceService.updateInvoiceStatus(invoiceId, 8); // SEND_ERROR
      
      setSnackbar({
        message: `⚠️ Đã ký thành công nhưng gửi CQT thất bại`,
        severity: 'error',
      });
      
      await loadInvoices(); // Reload để hiển thị nút "Gửi lại"
    }
  } catch (err) {
    // ❌ Ký số thất bại
  }
};
```

#### ✅ Handler "Gửi lại CQT"

```typescript
const handleResendToTax = async (invoiceId: string, invoiceNumber: string) => {
  try {
    const taxCode = await invoiceService.submitToTaxAuthority(parseInt(invoiceId));
    
    // ✅ Gửi lại thành công
    await invoiceService.updateInvoiceStatus(parseInt(invoiceId), 2); // ISSUED
    
    setSnackbar({
      message: `✅ Đã gửi lại thành công!\nMã CQT: ${taxCode}`,
      severity: 'success',
    });
    
    await loadInvoices();
    
  } catch (err) {
    // ❌ Gửi lại vẫn thất bại
    setSnackbar({
      message: `❌ Gửi lại thất bại. Vui lòng thử lại.`,
      severity: 'error',
    });
  }
};
```

---

## 🎨 Giao Diện Người Dùng

### 1️⃣ Dialog "Ký & Phát hành"

```
╔════════════════════════════════════════╗
║  🖊️ Ký & Phát hành hóa đơn            ║
╠════════════════════════════════════════╣
║                                        ║
║  ℹ️ Mô hình E-Invoice phổ thông (B2B): ║
║  Sau khi ký số thành công, hệ thống   ║
║  sẽ TỰ ĐỘNG gửi hóa đơn lên CQT.      ║
║                                        ║
║  Số hóa đơn: 000030                   ║
║                                        ║
║  Nhấn "Ký & Phát hành" để:            ║
║  ✅ Ký số hóa đơn                      ║
║  🚀 Tự động gửi lên cơ quan thuế      ║
║  📄 Nhận mã cơ quan thuế              ║
║                                        ║
╠════════════════════════════════════════╣
║          [Hủy]  [Ký & Phát hành]      ║
╚════════════════════════════════════════╝
```

### 2️⃣ Thông Báo Thành Công

```
╔════════════════════════════════════════╗
║  ✅ Thành công                         ║
╠════════════════════════════════════════╣
║  Đã ký & phát hành hóa đơn 000030     ║
║  thành công!                           ║
║  Mã CQT: 1A2B3C4D5E                   ║
╚════════════════════════════════════════╝
```

### 3️⃣ Thông Báo Lỗi Gửi CQT

```
╔════════════════════════════════════════╗
║  ⚠️ Cảnh báo                           ║
╠════════════════════════════════════════╣
║  Đã ký thành công nhưng gửi cơ quan   ║
║  thuế thất bại.                        ║
║  Lỗi: Kết nối tới CQT timeout         ║
╚════════════════════════════════════════╝
```

### 4️⃣ Nút "Gửi lại CQT" trong Menu

Khi hóa đơn ở trạng thái **SEND_ERROR**:

```
╔═══════════════════════╗
║  Thao tác             ║
╠═══════════════════════╣
║  👁️  Xem chi tiết     ║
║  ✉️  Gửi email        ║
║  🖨️  In hóa đơn       ║
║  📥  Tải xuống        ║
║  ────────────────     ║
║  🔄  Gửi lại CQT  ⭐  ║  ← Nút mới
╚═══════════════════════╝
```

---

## 📊 Cột "Mã của CQT" trong Bảng

Mã CQT sẽ tự động hiển thị sau khi gửi thành công:

| Số HĐ  | Ký hiệu | Khách hàng | Mã CQT       | Trạng thái     |
|--------|---------|------------|--------------|----------------|
| 000029 | C22T01  | Công ty A  | -            | Chờ ký         |
| 000030 | C22T01  | Công ty B  | **1A2B3C**   | Đã phát hành ✅|
| 000031 | C22T01  | Công ty C  | -            | Lỗi gửi CQT ❌ |

---

## 🧪 Testing

### Test Case 1: Ký & Gửi Thành Công

```bash
# 1. Chuẩn bị: Hóa đơn ở trạng thái PENDING_SIGN (7)
# 2. Thao tác: Nhấn nút "Ký & Phát hành"
# 3. Kỳ vọng:
#    - Ký số thành công
#    - Gửi CQT thành công
#    - Nhận được mã CQT (VD: "1A2B3C4D5E")
#    - Trạng thái chuyển sang ISSUED (2)
#    - Mã CQT hiển thị trên bảng
```

### Test Case 2: Ký Thành Công, Gửi CQT Thất Bại

```bash
# 1. Chuẩn bị: Hóa đơn ở trạng thái PENDING_SIGN (7)
# 2. Thao tác: Nhấn "Ký & Phát hành" (giả lập lỗi mạng)
# 3. Kỳ vọng:
#    - Ký số thành công
#    - Gửi CQT thất bại
#    - Hiển thị thông báo lỗi rõ ràng
#    - Trạng thái chuyển sang SEND_ERROR (8)
#    - Xuất hiện nút "Gửi lại CQT" trong menu
```

### Test Case 3: Gửi Lại CQT Thành Công

```bash
# 1. Chuẩn bị: Hóa đơn ở trạng thái SEND_ERROR (8)
# 2. Thao tác: Nhấn "Gửi lại CQT" trong menu
# 3. Kỳ vọng:
#    - Gửi lại CQT thành công
#    - Nhận được mã CQT
#    - Trạng thái chuyển sang ISSUED (2)
#    - Mã CQT hiển thị trên bảng
#    - Nút "Gửi lại CQT" biến mất
```

---

## 🔐 API Endpoint

### POST `/api/Tax/submit`

**Mô tả**: Gửi hóa đơn lên cơ quan thuế

**Query Parameters**:
- `invoiceId` (required): ID của hóa đơn cần gửi

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: `null` (empty)

**Response (Success - 200)**:
```json
{
  "taxAuthorityCode": "1A2B3C4D5E"
}
```
hoặc
```json
"1A2B3C4D5E"
```

**Response (Error - 400)**:
```json
{
  "message": "Không thể gửi lên cơ quan thuế",
  "errors": [
    "Hóa đơn chưa được ký",
    "Kết nối CQT timeout"
  ]
}
```

---

## 📝 Checklist Triển Khai

- [x] Thêm trạng thái `SEND_ERROR` vào constants
- [x] Thêm API `submitToTaxAuthority` vào invoiceService
- [x] Đổi tên nút "Ký số" → "Ký & Phát hành"
- [x] Thêm logic tự động gửi CQT sau khi ký
- [x] Xử lý lỗi và chuyển sang trạng thái `SEND_ERROR`
- [x] Thêm nút "Gửi lại CQT" cho trạng thái `SEND_ERROR`
- [x] Hiển thị mã CQT trên bảng danh sách
- [x] Cập nhật Dialog với thông tin rõ ràng
- [x] Test toàn bộ luồng

---

## 🎓 Best Practices

### 1. Xử Lý Lỗi

```typescript
// ✅ ĐÚNG: Phân biệt rõ lỗi ký số vs lỗi gửi CQT
try {
  await signInvoice();
  try {
    await submitToTax();
  } catch (taxError) {
    // Xử lý riêng lỗi gửi thuế
    updateStatus(SEND_ERROR);
  }
} catch (signError) {
  // Xử lý riêng lỗi ký số
}

// ❌ SAI: Gộp chung xử lý lỗi
try {
  await signInvoice();
  await submitToTax();
} catch (error) {
  // Không biết lỗi ở đâu
}
```

### 2. Reload Dữ Liệu

```typescript
// ✅ ĐÚNG: Reload sau khi có thay đổi quan trọng
await submitToTax();
await loadInvoices(); // Refresh để hiển thị mã CQT mới

// ❌ SAI: Không reload, user không thấy thay đổi
await submitToTax();
// User phải F5 mới thấy mã CQT
```

### 3. Thông Báo User-Friendly

```typescript
// ✅ ĐÚNG: Thông báo chi tiết, hữu ích
setSnackbar({
  message: `✅ Đã ký & phát hành thành công!\nMã CQT: ${taxCode}`,
  severity: 'success',
});

// ❌ SAI: Thông báo chung chung
setSnackbar({
  message: 'Success',
  severity: 'success',
});
```

---

## 🚀 Tương Lai

### Cải Tiến Có Thể

1. **Retry tự động**: Tự động thử gửi lại CQT 3 lần trước khi chuyển sang SEND_ERROR
2. **Polling status**: Định kỳ kiểm tra trạng thái CQT nếu chưa nhận được response
3. **Batch submission**: Gửi nhiều hóa đơn cùng lúc
4. **Webhook**: Nhận thông báo từ CQT khi xử lý xong

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console logs (search `[submitToTaxAuthority]`)
2. Kiểm tra network tab (API `/api/Tax/submit`)
3. Kiểm tra trạng thái hóa đơn trong database

---

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 15/12/2025  
**Tác giả**: GitHub Copilot  
