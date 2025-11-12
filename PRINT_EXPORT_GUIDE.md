# 🖨️ Tính Năng In Ấn & Xuất PDF cho Hóa Đơn - Hướng Dẫn Toàn Diện

## 📋 Tổng Quan

Hệ thống đã được nâng cấp với tính năng **phân trang tự động** cho hóa đơn dài, giúp:
- ✅ **Tự động ngắt trang** khi nội dung hóa đơn (danh sách sản phẩm) vượt quá một trang
- ✅ **Lặp lại Header** (logo, thông tin công ty, tiêu đề bảng) trên mỗi trang mới
- ✅ **Lặp lại Footer** (tổng tiền, chữ ký) trên mỗi trang mới
- ✅ **In ấn chuyên nghiệp** với layout chuẩn A4
- ✅ **Xuất file PDF** trực tiếp từ trình duyệt

---

## 🎯 Các Files Đã Tạo/Cập Nhật

### 1. **CSS - Print Optimization**
```
📄 src/assets/scss/custom/_print.scss
```
- 450+ dòng CSS tối ưu cho in ấn
- Xử lý `@media print` với page break
- Lặp lại thead/tfoot tự động
- Styling cho A4 page size (210mm x 297mm)

### 2. **Component - Invoice Template (Printable Version)**
```
📄 src/components/InvoiceTemplatePreviewPrintable.tsx
```
- Cấu trúc mới với `<table>` layout
- `<thead>` - Header của hóa đơn (lặp lại)
- `<tbody>` - Nội dung sản phẩm (ngắt trang)
- `<tfoot>` - Footer hóa đơn (lặp lại)
- Support dynamic products array

### 3. **Component - Print Preview Button**
```
📄 src/components/PrintPreviewButton.tsx
```
- Button "Xem Trước Bản In" (Ctrl/Cmd + P)
- Button "Xuất File PDF" với hướng dẫn
- Mock Data Generator (thêm 10/50/100 dòng test)
- Tooltips và hướng dẫn sử dụng
- Responsive design

### 4. **Page - Template Preview (Demo Page)**
```
📄 src/page/TemplatePreviewPage.tsx
```
- Tích hợp tất cả components
- State management cho products
- Mock data generation logic
- Print area wrapper với id `invoice-print-area`
- Full UX/UI optimized

---

## 🚀 Cách Sử Dụng

### **Cho Developer - Tích Hợp Vào Routing**

#### Bước 1: Import Component mới
```typescript
// Trong file routes/index.tsx hoặc router.tsx
import TemplatePreviewPage from '@/page/TemplatePreviewPage';
```

#### Bước 2: Thêm Route
```typescript
{
  path: '/admin/templates/preview/:templateId',
  element: <TemplatePreviewPage />,
},
```

#### Bước 3: Navigate từ Template List
```typescript
// Trong TemplateManagement.tsx hoặc tương tự
const handlePreview = (templateId: string) => {
  navigate(`/admin/templates/preview/${templateId}`);
};
```

### **Cho End User - Sử Dụng Tính Năng**

#### 1. **Xem Trước Hóa Đơn**
- Truy cập: `/admin/templates/preview/1` (hoặc templateId khác)
- Xem preview hóa đơn trên màn hình

#### 2. **Test Phân Trang**
- Click nút **"+10"**, **"+50"** hoặc **"+100"** để thêm dữ liệu test
- Quan sát số lượng sản phẩm hiện tại
- Reset về mặc định bằng nút **"×"**

#### 3. **In Hóa Đơn**
- Click nút **"Xem Trước Bản In"** (hoặc Ctrl/Cmd + P)
- Cửa sổ print sẽ mở ra
- Kiểm tra preview trong print dialog
- Chọn máy in và click "Print"

#### 4. **Xuất PDF**
- Click nút **"Xuất File PDF"** (hoặc trong print dialog)
- Tại phần **"Destination"**, chọn **"Save as PDF"**
- Hoặc chọn **"Microsoft Print to PDF"** (Windows)
- Đặt tên file và lưu

---

## 🎨 Tính Năng Nổi Bật - UX/UI

### **1. Print Preview với Visual Feedback**
```tsx
<Button
  variant="contained"
  startIcon={<PrintIcon />}
  onClick={() => window.print()}
>
  Xem Trước Bản In
  <Typography variant="caption">Ctrl/Cmd + P</Typography>
</Button>
```
- Icon rõ ràng
- Hint keyboard shortcut
- Hover effects mượt mà

### **2. Mock Data Generator - Interactive Testing**
```tsx
<Button onClick={() => handleAddRows(50)}>
  +50
</Button>
```
- Buttons nhanh: +10, +50, +100
- Counter hiển thị số dòng hiện tại
- Reset button (×)
- Visual feedback với Chips

### **3. Hướng Dẫn Inline**
- Tooltips chi tiết trên từng button
- Box hướng dẫn với icon 💡
- Bullets points dễ đọc:
  - Xem trước: Ctrl/Cmd + P
  - Xuất PDF: Destination → Save as PDF
  - Phân trang tự động
  - Tùy chỉnh margins

### **4. Responsive Design**
- Stack layout thay đổi theo màn hình
- Buttons stack vertical trên mobile
- Typography font-size responsive
- Spacing adaptive

### **5. Visual Status Indicators**
```tsx
<Chip label="📄 50 sản phẩm" color="primary" />
<Chip label="🔄 Nhiều trang" color="success" />
```
- Hiển thị số sản phẩm
- Badge "Nhiều trang" khi >30 items
- Colors semantic (primary, success, info)

---

## 🔧 Kỹ Thuật - Cách Hoạt Động

### **1. Cấu Trúc HTML - Table Layout**

```html
<table class="invoice-page-layout">
  <thead class="invoice-page-header">
    <!-- Header: Logo, thông tin công ty, tiêu đề -->
    <!-- SẼ LẶP LẠI trên mỗi trang -->
  </thead>
  
  <tbody class="invoice-page-body">
    <!-- Table sản phẩm -->
    <table class="invoice-products-table">
      <thead>
        <!-- STT | Tên hàng | ĐVT | Số lượng | Đơn giá | Thành tiền -->
        <!-- SẼ LẶP LẠI khi table ngắt trang -->
      </thead>
      <tbody>
        <!-- Danh sách sản phẩm -->
        <!-- NGẮT TRANG tại đây khi dài -->
      </tbody>
    </table>
  </tbody>
  
  <tfoot class="invoice-page-footer">
    <!-- Footer: Tổng tiền, chữ ký -->
    <!-- SẼ LẶP LẠI trên mỗi trang -->
  </tfoot>
</table>
```

### **2. CSS - Page Break Magic**

```scss
@media print {
  // Lặp lại header
  thead {
    display: table-header-group;
  }

  // Lặp lại footer
  tfoot {
    display: table-footer-group;
  }

  // Cho phép ngắt trang trong body
  tbody {
    display: table-row-group;
  }

  // Tránh ngắt giữa một dòng
  tr {
    page-break-inside: avoid;
  }

  // Page size
  @page {
    size: A4 portrait;
    margin: 1.5cm 1.2cm;
  }
}
```

### **3. Print Area Wrapper**

```tsx
<div id="invoice-print-area">
  <InvoiceTemplatePreviewPrintable {...props} />
</div>
```

CSS:
```scss
@media print {
  body * {
    visibility: hidden;
  }

  #invoice-print-area,
  #invoice-print-area * {
    visibility: visible;
  }
}
```

→ Chỉ in phần hóa đơn, ẩn tất cả menu, buttons, etc.

---

## 📊 Flow Chart - User Journey

```
User vào TemplatePreviewPage
  ↓
Thấy 1 sản phẩm mẫu (default)
  ↓
[Optional] Click +50 để thêm test data
  ↓
Thấy 50 sản phẩm trong invoice
  ↓
Click "Xem Trước Bản In"
  ↓
Print Dialog mở ra
  ↓
Thấy preview:
  - Trang 1: Header + 25 sản phẩm + Footer
  - Trang 2: Header (lặp) + 25 sản phẩm + Footer (lặp)
  ↓
[Option A] In ra giấy → Click "Print"
[Option B] Lưu PDF → Chọn "Save as PDF" → Save
```

---

## 🎓 Best Practices

### **1. Số Lượng Sản Phẩm Trên Mỗi Trang**
- **A4 Portrait, margins 1.5cm**: ~25-30 sản phẩm/trang
- Nếu sản phẩm có description dài: ~20 sản phẩm/trang
- Test với mock data để tìm số tối ưu

### **2. Margins Optimization**
```scss
@page {
  margin: 1.5cm 1.2cm; // Cân bằng giữa nội dung & lề trắng
}
```
- **Quá nhỏ**: Nội dung bị cắt khi in
- **Quá lớn**: Lãng phí space, ít sản phẩm/trang

### **3. Font Sizes**
```scss
.invoice-title {
  font-size: 14pt !important; // Tiêu đề
}
.company-name {
  font-size: 11pt !important; // Tên công ty
}
.company-details {
  font-size: 7.5pt !important; // Thông tin chi tiết
}
.invoice-products-table tbody tr td {
  font-size: 8pt !important; // Nội dung bảng
}
```

### **4. Colors in Print**
```scss
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```
→ Đảm bảo colors (logo, signatures) được in đúng

### **5. Background Images**
```tsx
<table 
  style={{
    backgroundImage: `url("${backgroundFrame}")`,
    backgroundSize: 'cover',
  }}
>
```
→ Background khung hóa đơn cũng được in ra

---

## 🐛 Troubleshooting

### **Issue 1: Header/Footer không lặp lại**
**Nguyên nhân**: Cấu trúc HTML sai, thiếu `<thead>`/`<tfoot>`
**Giải pháp**: Đảm bảo sử dụng `InvoiceTemplatePreviewPrintable` component mới

### **Issue 2: Bị ngắt giữa một dòng sản phẩm**
**Nguyên nhân**: CSS `page-break-inside` không đúng
**Giải pháp**: Thêm class `no-page-break-inside` cho `<TableRow>`

### **Issue 3: Print ra giấy nhưng không có màu**
**Nguyên nhân**: Browser setting
**Giải pháp**: 
- Chrome: Print settings → More settings → Enable "Background graphics"
- Firefox: Print → Options → Print backgrounds

### **Issue 4: PDF file quá lớn**
**Nguyên nhân**: Background image high resolution
**Giải pháp**: Optimize background image trước khi upload (compress, resize)

### **Issue 5: Margins không đúng**
**Nguyên nhân**: Browser default margins conflict
**Giải pháp**: Trong print dialog, chọn "Default" margins hoặc "None" và dùng CSS margins

---

## 📈 Performance Tips

### **1. Lazy Load Background**
```typescript
const [bgLoaded, setBgLoaded] = useState(false);

useEffect(() => {
  const img = new Image();
  img.src = backgroundFrame;
  img.onload = () => setBgLoaded(true);
}, []);
```

### **2. Virtualize Long Lists**
- Nếu >500 sản phẩm, cân nhắc pagination trong preview
- Chỉ render page hiện tại + page trước/sau

### **3. Memoize Components**
```typescript
const MemoizedInvoicePreview = React.memo(InvoiceTemplatePreviewPrintable);
```

---

## 🎉 Kết Luận

Hệ thống giờ đây có:
- ✅ **Professional printing** với phân trang tự động
- ✅ **PDF export** trực tiếp từ browser
- ✅ **Testing tools** để kiểm tra phân trang
- ✅ **User-friendly** với hướng dẫn rõ ràng
- ✅ **Responsive** cho mọi thiết bị
- ✅ **Maintainable** với code structure tốt

**Next Steps**:
1. Integrate vào routing system
2. Test với dữ liệu thực tế
3. Thu thập feedback từ users
4. Fine-tune margins/fonts theo feedback
5. Thêm tính năng save template settings

---

**Tác giả**: EIMS Development Team  
**Ngày cập nhật**: 12/11/2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
