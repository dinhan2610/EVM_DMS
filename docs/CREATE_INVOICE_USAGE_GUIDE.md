# 🚀 HƯỚNG DẪN SỬ DỤNG - TẠO HÓA ĐƠN VAT

> **Version:** 2.0 - Optimized  
> **Last Updated:** 23/12/2025

---

## 📋 TỔNG QUAN

Component **CreateVatInvoice** được tối ưu hoàn chỉnh với các tính năng:

✅ **UI/UX cải tiến** - Tooltip, validation messages rõ ràng  
✅ **Type-safe 100%** - TypeScript strict mode  
✅ **Error handling robust** - Parse đa nguồn  
✅ **Documentation đầy đủ** - JSDoc, inline comments  
✅ **Utilities reusable** - Helper functions

---

## 🎯 QUY TRÌNH CẤP SỐ HÓA ĐƠN

```
┌──────────────────────────────────────┐
│  1. TẠO/LƯU NHÁP                     │
│  → invoiceNumber = 0                 │
│  → Status = "Nháp"                   │
│  ✅ Có thể sửa/xóa                   │
└────────────┬─────────────────────────┘
             │
             ↓ Nhấn "Ký số"
┌──────────────────────────────────────┐
│  2. KÝ SỐ                            │
│  → Backend TỰ ĐỘNG cấp số            │
│  → invoiceNumber = [số duy nhất]     │
│  → Status = "Đã ký"                  │
│  ❌ Không thể sửa/xóa                │
└────────────┬─────────────────────────┘
             │
             ↓ Nhấn "Gửi CQT"
┌──────────────────────────────────────┐
│  3. GỬI CƠ QUAN THUẾ                 │
│  → Nhận taxAuthorityCode             │
│  → Status = "Đã đồng bộ"             │
│  ✅ Hóa đơn chính thức               │
└──────────────────────────────────────┘
```

---

## 🖥️ SỬ DỤNG COMPONENT

### Import:
```typescript
import CreateVatInvoice from '@/page/CreateVatInvoice'
```

### Routing:
```typescript
<Route path="/invoices/create" element={<CreateVatInvoice />} />
```

---

## 🔧 CÁC TRƯỜNG TRONG FORM

### 1. Thông tin mẫu hóa đơn
- **Ký hiệu:** Chọn từ dropdown (VD: "1K24TXN")
- **Số:** Read-only, hiển thị `<Chưa cấp số>` với tooltip giải thích

### 2. Thông tin người mua
- **Tên đơn vị:** *(Bắt buộc)*
- **Mã số thuế:** *(Bắt buộc)*
- **Địa chỉ:** *(Bắt buộc)*
- **Người mua hàng:** (Optional)
- **Email/SĐT:** (Optional)

### 3. Danh sách sản phẩm
- Tên sản phẩm *(Bắt buộc)*
- Đơn vị *(Bắt buộc)*
- Số lượng > 0 *(Bắt buộc)*
- Đơn giá (chưa VAT) > 0 *(Bắt buộc)*
- Thuế suất VAT: 0%, 5%, 8%, 10%

### 4. Actions
- **Lưu nháp:** invoiceStatusID = 1
- **Gửi duyệt:** invoiceStatusID = 6

---

## 🛠️ UTILITY FUNCTIONS

### File: `src/utils/invoiceNumberUtils.ts`

```typescript
import { 
  formatInvoiceNumber,
  hasInvoiceNumber,
  getFullInvoiceNumber 
} from '@/utils/invoiceNumberUtils'

// Format số hóa đơn
formatInvoiceNumber(123, false) // "0000123"
formatInvoiceNumber(0, true)    // "<Chưa cấp số>"

// Kiểm tra đã cấp số chưa
hasInvoiceNumber(123) // true
hasInvoiceNumber(0)   // false

// Full display với serial
getFullInvoiceNumber("1K24TXN", 123, false) 
// → "1K24TXN - 0000123"
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Về Số hóa đơn:
- ❌ **KHÔNG THỂ** tự nhập số
- ✅ Hệ thống tự động cấp sau khi ký
- ⚠️ Số là **DUY NHẤT**, không thể thay đổi

### 2. Về Giá sản phẩm:
- Giá nhập vào là giá **CHƯA thuế**
- VAT được tính thêm dựa trên thuế suất
- VD: Giá 100,000 + VAT 10% = 110,000

### 3. Về Validation:
- Tất cả validation chạy **trước** khi gửi API
- Error messages chi tiết, dễ hiểu
- Validation errors từ backend được parse và hiển thị

### 4. Về Trạng thái:
- **Nháp (1):** Có thể sửa/xóa
- **Chờ duyệt (6):** Đợi quản lý phê duyệt
- **Đã ký (2):** Không thể sửa, có số
- **Đã hủy (4):** Không thể khôi phục

---

## 📊 API ENDPOINTS

```
POST   /api/Invoice              → Tạo hóa đơn mới
GET    /api/Invoice              → Danh sách hóa đơn
GET    /api/Invoice/{id}         → Chi tiết hóa đơn
POST   /api/Invoice/{id}/sign    → Ký số (cấp số tự động)
POST   /api/Tax/submit           → Gửi lên CQT
```

---

## 🐛 DEBUGGING

### Enable detailed logs:
```typescript
console.log('[CreateVatInvoice] Debug enabled')
// Logs sẽ hiển thị:
// 📤 Request data
// ✅ Success response
// ❌ Error details
```

### Common issues:

#### 1. "Template không hợp lệ"
- **Nguyên nhân:** Template chưa được chọn hoặc templateID <= 0
- **Giải pháp:** Chọn template từ dropdown

#### 2. "Validation errors"
- **Nguyên nhân:** Thiếu thông tin bắt buộc
- **Giải pháp:** Đọc error message, điền đầy đủ

#### 3. "Lỗi khi tạo hóa đơn"
- **Nguyên nhân:** API error
- **Giải pháp:** Check console logs, verify API endpoint

---

## 📚 TÀI LIỆU LIÊN QUAN

- [INVOICE_CREATE_API_ANALYSIS.md](./INVOICE_CREATE_API_ANALYSIS.md) - Phân tích chi tiết API
- [INVOICE_CREATE_OPTIMIZATION_SUMMARY.md](./INVOICE_CREATE_OPTIMIZATION_SUMMARY.md) - Tổng kết cải tiến
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Tài liệu API tổng quan

---

## ✅ CHECKLIST KHI SỬ DỤNG

- [ ] Đã đăng nhập và có token hợp lệ
- [ ] Đã có ít nhất 1 template active
- [ ] Biết rõ quy trình cấp số hóa đơn
- [ ] Đã đọc tooltip và validation messages
- [ ] Ready to test!

---

## 🆘 HỖ TRỢ

**Gặp vấn đề?**
1. Đọc error message trong Snackbar
2. Check console logs (F12)
3. Xem file phân tích API
4. Contact: dev@eims.local

---

**🎉 Chúc sử dụng component hiệu quả!**
