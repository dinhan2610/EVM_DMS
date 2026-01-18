# 📱 Title Management System - EIMS-KNS

## 🎯 Mục tiêu đã đạt được

Tối ưu hóa title trình duyệt (tab name) cho dự án EIMS-KNS theo **best practices UX** của các ông lớn như Google, AWS, Salesforce.

### Before ❌
```
Reback React | Responsive Admin Dashboard Template
```
- Tên dài, không chuyên nghiệp
- Không phân biệt được trang nào khi mở nhiều tab
- Không có thông báo real-time

### After ✅
```
Tổng quan - Admin | EIMS
(5) Duyệt hóa đơn | EIMS
HD-2026-150 - Chi tiết hóa đơn | EIMS
Hãy quay lại! 🥺 (khi user rời tab)
```
- Ngắn gọn, chuyên nghiệp
- Dễ phân biệt từng tab
- Hiển thị số lượng thông báo
- Friendly UX với message khi user rời tab

---

## 📂 Cấu trúc Files

```
EIMS-KNS/
├── index.html                          ✅ Updated: Title mặc định
├── src/
│   ├── hooks/
│   │   └── usePageTitle.ts            ✅ NEW: Core hook
│   ├── context/
│   │   └── constants.ts               ✅ Updated: APP_NAME, APP_FULL_NAME
│   ├── components/
│   │   └── wrappers/
│   │       └── AppProvidersWrapper.tsx ✅ Updated: Removed old handler
│   └── page/
│       ├── AdminDashboard.tsx         ✅ Applied
│       ├── HODDashboard.tsx           ✅ Applied
│       ├── StaffDashboard.tsx         ✅ Applied
│       ├── InvoiceManagement.tsx      ⏳ Pending
│       ├── InvoiceDetail.tsx          ⏳ Pending
│       └── ... (20+ pages pending)
└── docs/
    ├── TITLE_MANAGEMENT_SUMMARY.md        📖 Tổng quan implementation
    ├── USEPAGE_TITLE_GUIDE.md             📖 Hướng dẫn sử dụng chi tiết
    ├── QUICK_MIGRATION_SCRIPT.tsx         📖 Script copy-paste nhanh
    ├── EXAMPLES_HOD_INVOICE_WITH_COUNT.tsx 📖 Example: Dynamic count
    ├── EXAMPLES_INVOICE_DETAIL_DYNAMIC_TITLE.tsx 📖 Example: Dynamic title
    └── TITLE_MANAGEMENT_README.md         📖 File này
```

---

## 🚀 Quick Start - Áp dụng cho 1 trang mới

### 3 bước đơn giản:

```tsx
// Step 1: Import hook
import { usePageTitle } from '@/hooks/usePageTitle'

// Step 2: Sử dụng trong component
const MyPage = () => {
  usePageTitle('Tên Trang')  // → "Tên Trang | EIMS"
  
  return <div>...</div>
}

// Step 3: Done! ✅
```

---

## 📚 Documentation Files

### 1. **[TITLE_MANAGEMENT_SUMMARY.md](./TITLE_MANAGEMENT_SUMMARY.md)** 
📋 **File chính - Đọc file này trước!**

- Implementation progress (3/30 pages completed)
- Title mapping cho tất cả routes
- Features & benefits
- Next steps với timeline
- Quality checklist

### 2. **[USEPAGE_TITLE_GUIDE.md](./USEPAGE_TITLE_GUIDE.md)**
📖 **Hướng dẫn sử dụng đầy đủ**

- 5 patterns sử dụng hook
- Mapping title cho từng trang
- Priority implementation phases
- Technical notes & performance
- Migration checklist

### 3. **[QUICK_MIGRATION_SCRIPT.tsx](./QUICK_MIGRATION_SCRIPT.tsx)**
⚡ **Copy-paste script nhanh**

- Ready-to-use code snippets
- All pages organized by category
- Complete examples
- Testing checklist
- Troubleshooting guide

### 4. **[EXAMPLES_HOD_INVOICE_WITH_COUNT.tsx](./EXAMPLES_HOD_INVOICE_WITH_COUNT.tsx)**
💡 **Example: Notification count**

- HOD Invoice Management với dynamic count
- Real-time polling để update count
- Timeline của title changes
- Best practices implementation

### 5. **[EXAMPLES_INVOICE_DETAIL_DYNAMIC_TITLE.tsx](./EXAMPLES_INVOICE_DETAIL_DYNAMIC_TITLE.tsx)**
💡 **Example: Dynamic title**

- Invoice Detail với mã hóa đơn trên title
- Update title sau khi load data
- Multi-tab scenario
- Type-safe implementation

---

## 🎨 Format & Examples

### Basic Format
```
[Tên Trang] | EIMS
```

**Examples:**
- `Quản lý hóa đơn | EIMS`
- `Tổng quan - Admin | EIMS`
- `Không gian làm việc | EIMS`

### With Notification Count
```
(count) [Tên Trang] | EIMS
```

**Examples:**
- `(5) Duyệt hóa đơn | EIMS` ← 5 hóa đơn chờ
- `(3) Thông báo | EIMS` ← 3 thông báo chưa đọc
- `Duyệt hóa đơn | EIMS` ← 0 thì không hiện badge

### Dynamic Content
```
[Content] - [Tên Trang] | EIMS
```

**Examples:**
- `HD-2026-150 - Chi tiết hóa đơn | EIMS`
- `Công ty ABC - Hồ sơ khách hàng | EIMS`

### Visibility Change
```
Hãy quay lại! 🥺
```
- Hiển thị khi user switch sang tab khác
- Tự động restore về title gốc khi user quay lại

---

## 📊 Implementation Status

| Phase | Description | Progress | Priority |
|-------|-------------|----------|----------|
| **Phase 1** | Core Dashboard Pages | 3/3 ✅ | DONE |
| **Phase 2** | Invoice Pages | 0/7 ⏳ | HIGH |
| **Phase 3** | Management Pages | 0/10 ⏳ | MEDIUM |
| **Phase 4** | Other Pages | 0/6 ⏳ | MEDIUM |
| **Phase 5** | Auth Pages | 0/2 ⏳ | LOW |

**Total:** 3/28 pages completed (10.7%)

---

## 🔥 Priority Pages - Làm trước

### Week 1 - CRITICAL

1. ⚠️ **HODInvoiceManagement** - `(count) Duyệt hóa đơn | EIMS`
   - QUAN TRỌNG NHẤT: Hiển thị số hóa đơn chờ duyệt
   - File: `/src/page/InvoiceApproval.tsx` hoặc component HOD Invoice

2. 🔍 **InvoiceDetail** - `HD-XXX - Chi tiết hóa đơn | EIMS`
   - Hiển thị mã hóa đơn cụ thể
   - File: `/src/page/InvoiceDetail.tsx`

3. ➕ **CreateVatInvoice** - `Lập hóa đơn mới | EIMS`
   - Trang tạo hóa đơn
   - File: `/src/page/CreateVatInvoice.tsx`

### Week 2 - IMPORTANT

4. InvoiceManagement
5. CustomerManagement
6. DebtManagement
7. StatementManagement

---

## 🎓 Usage Patterns

### Pattern 1: Basic Title
```tsx
usePageTitle('Quản lý hóa đơn')
```

### Pattern 2: With Notification Count
```tsx
const [count, setCount] = useState(0)
usePageTitle('Duyệt hóa đơn', count)
```

### Pattern 3: Dynamic Update
```tsx
const { setTitle } = usePageTitle('Chi tiết hóa đơn')

useEffect(() => {
  if (invoice?.invoiceNumber) {
    setTitle(`${invoice.invoiceNumber} - Chi tiết hóa đơn`)
  }
}, [invoice])
```

### Pattern 4: No Brand (Auth pages)
```tsx
usePageTitle('Đăng nhập', 0, false)
```

---

## ✨ Features & Benefits

### For Users 👥

- ✅ Dễ phân biệt tabs khi mở nhiều trang
- ✅ Thấy ngay số lượng việc cần làm (notification badge)
- ✅ Friendly message "Hãy quay lại!" khi rời tab
- ✅ Professional branding với "EIMS"

### For Developers 👨‍💻

- ✅ Reusable hook - 1 hook cho toàn bộ app
- ✅ Type-safe với TypeScript strict mode
- ✅ Easy to use - chỉ 1 dòng code
- ✅ No memory leaks - auto cleanup
- ✅ Performance optimized

### For Product/Brand 🎯

- ✅ Consistent branding - "EIMS" xuất hiện khắp nơi
- ✅ SEO friendly titles
- ✅ Professional image
- ✅ Better user experience

---

## 🧪 Testing Checklist

Sau khi apply usePageTitle cho 1 trang, test các scenarios:

- [ ] Page load: Title hiển thị đúng
- [ ] Switch tab (Cmd+Tab): Title = "Hãy quay lại! 🥺"
- [ ] Switch back: Title restore về original
- [ ] Multiple tabs: Mỗi tab có title khác nhau
- [ ] Notification count: Update real-time khi count thay đổi
- [ ] Dynamic title: Update khi data load xong
- [ ] Route change: Title update khi navigate
- [ ] No console errors
- [ ] No memory leaks

---

## 🐛 Troubleshooting

### Issue: Title không update
**Solution:** Check dependencies trong `usePageTitle()` hook

### Issue: Title bị reset về default
**Solution:** Tìm và xóa code cũ `document.title = ...`

### Issue: Memory leak warning
**Solution:** Ensure cleanup trong `useEffect` return

### Issue: Count không update real-time
**Solution:** `pendingCount` phải tính từ state, không hardcode

### Issue: Multiple "| EIMS" trong title
**Solution:** Chỉ gọi `usePageTitle()` 1 lần trong component

---

## 📞 Support & Questions

### Read Documentation First

1. 📖 **[USEPAGE_TITLE_GUIDE.md](./USEPAGE_TITLE_GUIDE.md)** - Hướng dẫn đầy đủ
2. ⚡ **[QUICK_MIGRATION_SCRIPT.tsx](./QUICK_MIGRATION_SCRIPT.tsx)** - Copy-paste code
3. 💡 **[EXAMPLES](./EXAMPLES_HOD_INVOICE_WITH_COUNT.tsx)** - Examples thực tế

### Still Have Questions?

- Check [TITLE_MANAGEMENT_SUMMARY.md](./TITLE_MANAGEMENT_SUMMARY.md) for overview
- Review example files for real-world usage
- Ask team lead nếu còn thắc mắc

---

## 🎯 Next Steps

### For Developers

1. **Đọc docs:** Bắt đầu với [USEPAGE_TITLE_GUIDE.md](./USEPAGE_TITLE_GUIDE.md)
2. **Review examples:** Xem 2 file examples để hiểu cách dùng
3. **Apply to 1 page:** Test với 1 trang đơn giản trước
4. **Apply to priority pages:** Follow checklist trong SUMMARY
5. **Test thoroughly:** Run through testing checklist

### For Team Lead

1. **Review implementation:** Check hook code quality
2. **Assign tasks:** Phân công pages cho team members
3. **Set timeline:** 2-3 tuần để complete all pages
4. **Monitor progress:** Track completion status
5. **QA approval:** Final testing before deployment

---

## 📈 Timeline

### Week 1: Priority Pages
- [ ] HODInvoiceManagement (with count)
- [ ] InvoiceDetail (dynamic title)
- [ ] CreateVatInvoice
- [ ] InvoiceManagement

### Week 2: Management Pages
- [ ] CustomerManagement
- [ ] DebtManagement
- [ ] StatementManagement
- [ ] UserManagement
- [ ] TemplateManagement
- [ ] ReportsPage

### Week 3: Remaining Pages
- [ ] All other pages (15+ pages)
- [ ] Auth pages
- [ ] Final testing
- [ ] QA approval

---

## 🏆 Success Metrics

- ✅ 100% pages have proper titles
- ✅ No "Reback React" anywhere
- ✅ Notification count working on priority pages
- ✅ No memory leaks or errors
- ✅ User feedback positive
- ✅ Team satisfaction high (easy to use hook)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 17/01/2026 | Initial implementation: Hook, constants, 3 dashboards |

---

**Status:** ✅ Core implementation complete, ready for rollout  
**Completion:** 3/28 pages (10.7%)  
**Next:** Apply to HODInvoiceManagement (PRIORITY 1)  

---

*Maintained by: Development Team*  
*Last updated: 17/01/2026*
