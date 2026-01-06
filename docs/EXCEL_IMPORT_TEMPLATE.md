# 📋 Template Excel Mẫu - Import Bảng Kê

## Định Dạng Chuẩn

Sao chép bảng dưới đây vào Excel để tạo file import:

| Tên hàng hóa/dịch vụ | Đơn vị | Số lượng | Đơn giá | Thuế suất | Ghi chú |
|----------------------|--------|----------|---------|-----------|---------|
| Cước ADSL tháng 11/2024 | Tháng | 1 | 500000 | 10 | Gói VIP 50Mbps |
| Cước Hosting VPS | Tháng | 2 | 200000 | 10 | VPS 2GB RAM |
| Domain .vn | Năm | 1 | 400000 | 0 | khachhang.vn |
| Dịch vụ bảo trì website | Tháng | 1 | 1500000 | 10 | |
| SSL Certificate | Năm | 1 | 500000 | 0 | Wildcard SSL |

---

## 📐 Quy Tắc Từng Cột

### Cột A: Tên hàng hóa/dịch vụ ✅ **BẮT BUỘC**
- **Mô tả**: Tên sản phẩm/dịch vụ
- **Kiểu dữ liệu**: Text
- **Ví dụ**: "Cước ADSL tháng 11/2024"
- **Lưu ý**: 
  - Không được để trống
  - Tự động trim khoảng trắng thừa
  - Dòng nào không có tên → bỏ qua

### Cột B: Đơn vị
- **Mô tả**: Đơn vị tính
- **Kiểu dữ liệu**: Text
- **Mặc định**: "Cái" (nếu để trống)
- **Ví dụ**: Tháng, Năm, Cái, Bộ, GB, TB, Phút, Gói

### Cột C: Số lượng
- **Mô tả**: Số lượng hàng hóa
- **Kiểu dữ liệu**: Number (≥ 0)
- **Mặc định**: 1 (nếu để trống)
- **Ví dụ**: 1, 2.5, 10, 100
- **Lưu ý**: 
  - Chấp nhận số thập phân
  - Số âm → tự động = 0

### Cột D: Đơn giá
- **Mô tả**: Giá mỗi đơn vị (VNĐ)
- **Kiểu dữ liệu**: Number (≥ 0)
- **Mặc định**: 0 (nếu để trống)
- **Ví dụ**: 500000, 1500000, 200000
- **Lưu ý**: 
  - Không cần dấu phẩy (500000 ✅, 500,000 ❌)
  - Số âm → tự động = 0

### Cột E: Thuế suất (%)
- **Mô tả**: Thuế GTGT (%)
- **Kiểu dữ liệu**: Number (0, 5, 8, 10)
- **Mặc định**: 10 (nếu để trống)
- **Giá trị hợp lệ**: 0, 5, 8, 10
- **Lưu ý**: 
  - Nhập số khác → làm tròn đến giá trị gần nhất
  - Ví dụ: 7 → 8, 3 → 5, 12 → 10

### Cột F: Ghi chú
- **Mô tả**: Thông tin bổ sung
- **Kiểu dữ liệu**: Text
- **Mặc định**: "" (trống)
- **Ví dụ**: "Gói VIP", "Promotion -10%"
- **Lưu ý**: Không bắt buộc

---

## ✅ Ví Dụ Hợp Lệ

### Case 1: Dịch vụ viễn thông
```
Cột A: Cước ADSL tháng 12/2024
Cột B: Tháng
Cột C: 1
Cột D: 500000
Cột E: 10
Cột F: Gói VIP 100Mbps
```

### Case 2: Hosting nhiều tháng
```
Cột A: Cước Hosting VPS
Cột B: Tháng
Cột C: 6
Cột D: 200000
Cột E: 10
Cột F: Thanh toán 6 tháng
```

### Case 3: Domain không thuế
```
Cột A: Domain .com
Cột B: Năm
Cột C: 1
Cột D: 300000
Cột E: 0
Cột F:
```

---

## ⚠️ Ví Dụ Lỗi Thường Gặp

### ❌ Lỗi 1: Thiếu tên hàng hóa
```
Cột A:           <-- TRỐNG
Cột B: Tháng
Cột C: 1
Cột D: 500000
```
**Kết quả**: Dòng này bị BỎ QUA

### ❌ Lỗi 2: Số âm
```
Cột A: Giảm giá
Cột B: Lần
Cột C: -1        <-- SỐ ÂM
Cột D: -100000   <-- SỐ ÂM
```
**Kết quả**: Tự động chuyển thành 0

### ❌ Lỗi 3: Thuế suất không hợp lệ
```
Cột A: Dịch vụ A
Cột B: Cái
Cột C: 1
Cột D: 100000
Cột E: 15        <-- KHÔNG HỢP LỆ
```
**Kết quả**: Tự động làm tròn → 10

### ❌ Lỗi 4: Đơn giá có dấu phẩy
```
Cột A: Dịch vụ B
Cột D: 1,500,000  <-- CÓ DẤU PHẨY
```
**Kết quả**: Parse lỗi → 1

---

## 🎯 Best Practices

### 1. Chuẩn Bị Dữ Liệu
- Sử dụng **format Number** cho cột C, D, E
- Không merge cells
- Không có dòng trống giữa header và data

### 2. Header Row
- Dòng đầu tiên là header → hệ thống tự động skip
- Tên cột không quan trọng (hệ thống đọc theo vị trí)

### 3. Đặt Tên File
- Khuyến nghị: `bangke_khachhang_thang_nam.xlsx`
- Ví dụ: `bangke_abc_11_2024.xlsx`

### 4. Kiểm Tra Trước Khi Import
- ✅ Cột A: Không có dòng trống
- ✅ Cột C, D: Số dương
- ✅ Cột E: 0, 5, 8, hoặc 10
- ✅ File format: .xlsx (không phải .xls)

---

## 🚀 Quy Trình Khuyến Nghị

1. **Download template này**
2. **Copy bảng mẫu** vào Excel
3. **Xóa dòng mẫu**, giữ lại header
4. **Nhập dữ liệu thực tế** của bạn
5. **Lưu file** định dạng .xlsx
6. **Drag & drop** vào hệ thống
7. **Kiểm tra kết quả** import
8. **Chỉnh sửa** nếu cần trong DataGrid

---

## 📊 Template Mẫu Đầy Đủ

```excel
| Tên hàng hóa/dịch vụ           | Đơn vị | Số lượng | Đơn giá | Thuế suất | Ghi chú              |
|--------------------------------|--------|----------|---------|-----------|----------------------|
| Cước ADSL tháng 12/2024        | Tháng  | 1        | 500000  | 10        | Gói VIP 100Mbps      |
| Cước Hosting VPS               | Tháng  | 6        | 200000  | 10        | VPS 4GB RAM          |
| Domain .vn                     | Năm    | 1        | 400000  | 0         | khachhang.vn         |
| SSL Certificate Wildcard       | Năm    | 1        | 800000  | 0         | *.khachhang.vn       |
| Dịch vụ bảo trì website        | Tháng  | 3        | 1500000 | 10        | Maintenance package  |
| Email Business                 | User   | 10       | 50000   | 10        | 10 email accounts    |
| Cloud Storage                  | GB     | 100      | 5000    | 10        | Google Drive         |
| Tên miền quốc tế .com          | Năm    | 2        | 300000  | 0         | domain1.com + 2.com  |
```

---

## 💡 Tips & Tricks

### Sao chép nhanh từ hệ thống cũ
```excel
1. Export từ hệ thống cũ ra Excel
2. Sắp xếp lại cột theo thứ tự A-F
3. Xóa cột không cần thiết
4. Import vào hệ thống mới
```

### Tạo template cho từng khách hàng
```
- Lưu template riêng cho mỗi khách hàng
- Mỗi tháng chỉ cập nhật số lượng/đơn giá
- Import nhanh không cần nhập lại
```

### Batch import nhiều bảng kê
```
1. Tạo 1 file Excel với nhiều sheet
2. Mỗi sheet = 1 khách hàng
3. Copy từng sheet ra file riêng
4. Import lần lượt
```

---

## 🔗 Tài Liệu Liên Quan

- [STATEMENT_FEATURE_GUIDE.md](./STATEMENT_FEATURE_GUIDE.md) - Hướng dẫn sử dụng đầy đủ
- [BACKEND_INVOICE_API_GUIDE.md](./BACKEND_INVOICE_API_GUIDE.md) - API tích hợp

---

**📥 Sẵn sàng import? Drag & drop file Excel vào hệ thống ngay!**
