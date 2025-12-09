# 📊 Hướng Dẫn Sử Dụng Tính Năng Quản Lý Bảng Kê

## ✨ Tổng Quan

Hệ thống quản lý Bảng Kê Công Nợ với 3 tính năng killer:

### 1. 📥 Excel Import (Kéo & Thả)
- Drag & drop file Excel trực tiếp
- Tự động parse và validate dữ liệu
- Hiển thị visual feedback khi kéo file

### 2. 🔄 Auto-Fetch Công Nợ Trước
- Click nút "Tải dữ liệu nợ trước" 
- Tự động lấy số nợ của khách hàng từ kỳ trước
- Loading spinner hiển thị trạng thái

### 3. ⚡ Real-time Calculations
- Tự động tính **Thành tiền** = Số lượng × Đơn giá
- Tự động tính **Tiền thuế** = Thành tiền × Thuế suất GTGT
- Tự động tính **Tổng cộng** = Tiền hàng + Tiền thuế + Công nợ trước
- Cập nhật ngay lập tức khi chỉnh sửa

---

## 🚀 Cách Sử Dụng

### A. Truy Cập Trang

1. Đăng nhập hệ thống
2. Vào menu: **Quản lý Bảng kê công nợ**
3. Click nút: **"Tạo Bảng kê mới"**

### B. Điền Thông Tin (Section A - Header)

```
┌─────────────────────────────────────────────────┐
│ 👤 Khách hàng*: [Autocomplete]                  │
│ 📅 Kỳ cước*:    [Month Picker]                  │
│ 💰 Công nợ trước: [Number] + [🔄 Tải tự động]  │
└─────────────────────────────────────────────────┘
```

**Hướng dẫn:**
- **Khách hàng**: Gõ tên hoặc MST → chọn từ danh sách
- **Kỳ cước**: Chọn tháng/năm (mặc định: tháng hiện tại)
- **Công nợ trước**: 
  - Nhập thủ công HOẶC
  - Click nút 🔄 để tải tự động

### C. Nhập Dữ Liệu (Section B - Body)

#### 🎯 Cách 1: Nhập Excel (Khuyến nghị)

**Định dạng file Excel:**

| A (Tên hàng hóa/DV) | B (Đơn vị) | C (Số lượng) | D (Đơn giá) | E (Thuế suất) | F (Ghi chú) |
|---------------------|------------|--------------|-------------|---------------|-------------|
| Cước ADSL tháng 11  | Tháng      | 1            | 500000      | 10            | Gói VIP     |
| Cước Hosting        | Tháng      | 2            | 200000      | 10            |             |
| Domain .vn          | Năm        | 1            | 400000      | 0             |             |

**Các bước:**
1. Chuẩn bị file Excel theo format trên
2. Kéo thả file vào vùng "Drag & Drop"
   - HOẶC click "Chọn file Excel" để browse
3. Hệ thống tự động parse → hiển thị trong bảng
4. Kiểm tra và chỉnh sửa nếu cần

#### ⌨️ Cách 2: Nhập Thủ Công

**Click vào ô để chỉnh sửa:**
- Gõ tên hàng hóa
- Điền số lượng, đơn giá
- Chọn thuế suất: 0%, 5%, 8%, 10%
- **Thành tiền tự động tính** ✨

**Thao tác:**
- ➕ **Thêm dòng**: Click nút "Thêm dòng"
- 🗑️ **Xóa dòng**: Click icon thùng rác ở mỗi dòng

### D. Xem Tổng Hợp (Section C - Summary)

```
┌─────────────────────────────────────────────────┐
│ 📊 TỔNG HỢP BÁO GIÁ                              │
│                                                  │
│ Tổng tiền hàng:    1.100.000 ₫                  │
│ Tổng tiền thuế:      110.000 ₫                  │
│ Công nợ trước:       500.000 ₫                  │
│ ────────────────────────────────                │
│ TỔNG CỘNG:       1.710.000 ₫  [💰]              │
└─────────────────────────────────────────────────┘
```

**Lưu ý:** Số liệu cập nhật **real-time** khi bạn thay đổi bất kỳ giá trị nào!

### E. Lưu Bảng Kê

**2 lựa chọn:**

1. **💾 Lưu nháp**
   - Lưu để chỉnh sửa sau
   - Trạng thái: "Dự thảo"

2. **📤 Lưu & Kết xuất**
   - Lưu và tạo hóa đơn điện tử
   - Chuyển sang trạng thái "Đã tạo hóa đơn"

---

## 📝 Quy Tắc Validation

### ✅ Bắt Buộc
- Khách hàng
- Kỳ cước
- Ít nhất 1 dòng hàng hóa

### 🔢 Số Liệu
- **Số lượng**: ≥ 0
- **Đơn giá**: ≥ 0
- **Thuế suất**: Chỉ nhận 0, 5, 8, 10
  - Nhập số khác → tự động làm tròn đến giá trị gần nhất

### 📋 Văn Bản
- Tên hàng hóa: Tự động trim khoảng trắng
- Đơn vị: Mặc định "Cái"
- Ghi chú: Không bắt buộc

---

## 🎨 Thiết Kế & UX

### Màu Sắc
- **Primary**: #1976d2 (Blue)
- **Background**: #f5f5f5 (Light Gray)
- **Paper**: White với border #e0e0e0
- **Hover**: #e3f2fd (Light Blue)

### Hiệu Ứng
- Drag & drop: Border color thay đổi khi hover
- Auto-fetch: Loading spinner
- Save: Snackbar notification
- Edit: Cell highlight khi focus

### Icons
- 💾 Save: Lưu nháp
- 📤 Publish: Lưu & Kết xuất
- ☁️ Upload: Import Excel
- 🔄 Autorenew: Tải công nợ
- ➕ Add: Thêm dòng
- 🗑️ Delete: Xóa dòng

---

## 🔧 Tối Ưu Kỹ Thuật

### Performance
```typescript
// 1. Memoization cho calculations
const calculations = useMemo(() => {
  const totalGoods = items.reduce((sum, item) => sum + item.amount, 0)
  const totalVAT = items.reduce((sum, item) => sum + (item.amount * item.vatRate) / 100, 0)
  return { totalGoods, totalVAT, grandTotal: totalGoods + totalVAT + previousDebt }
}, [items, previousDebt])

// 2. useCallback cho event handlers
const handleProcessRowUpdate = useCallback((newRow, oldRow) => {
  // Auto-calculate amount
  return { ...newRow, amount: newRow.quantity * newRow.unitPrice }
}, [])

// 3. DataGrid processRowUpdate
<DataGrid
  processRowUpdate={handleProcessRowUpdate}
  onProcessRowUpdateError={handleProcessRowUpdateError}
/>
```

### Validation Helpers
```typescript
// Parse number an toàn
const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

// Normalize VAT rate
const normalizeVatRate = (rate: number): number => {
  const validRates = [0, 5, 8, 10]
  return validRates.reduce((prev, curr) => 
    Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
  )
}
```

### Excel Import
```typescript
// XLSX.read() + sheet_to_json()
const workbook = XLSX.read(data, { type: 'array' })
const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

// Filter empty rows
const importedItems = jsonData
  .slice(1)  // Skip header
  .filter(row => row && row[0])  // Only rows with item name
  .map(row => ({ /* mapping logic */ }))
```

---

## 🐛 Xử Lý Lỗi

### Lỗi Thường Gặp

1. **"File Excel không có dữ liệu"**
   - Nguyên nhân: File chỉ có header, không có data
   - Giải pháp: Thêm ít nhất 1 dòng dữ liệu

2. **"Không tìm thấy dữ liệu hợp lệ"**
   - Nguyên nhân: Cột A (Tên hàng hóa) trống
   - Giải pháp: Điền tên hàng hóa ở cột A

3. **"Lỗi khi đọc file Excel"**
   - Nguyên nhân: File bị lỗi format
   - Giải pháp: Kiểm tra file .xlsx hợp lệ

4. **"Phải có ít nhất 1 dòng dữ liệu"**
   - Nguyên nhân: Xóa dòng cuối cùng
   - Giải pháp: Luôn giữ ít nhất 1 dòng

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@mui/material": "^7.3.4",
    "@mui/x-data-grid": "^8.x",
    "@mui/x-date-pickers": "^7.x",
    "dayjs": "^1.11.x",
    "react-router-dom": "^6.x",
    "xlsx": "^0.18.x"
  }
}
```

---

## 🎯 Roadmap Tương Lai

### Phase 2 (Coming Soon)
- [ ] Export to Excel
- [ ] Print preview PDF
- [ ] Email gửi bảng kê
- [ ] Duplicate statement
- [ ] Statement templates

### Phase 3
- [ ] Multi-currency support
- [ ] Custom VAT rates
- [ ] Batch operations
- [ ] Advanced search/filter

---

## 📞 Hỗ Trợ

**Gặp vấn đề?**
- Kiểm tra console log (F12)
- Xem snackbar notifications
- Liên hệ: support@eims-kns.vn

---

**🎉 Chúc bạn sử dụng hiệu quả!**
