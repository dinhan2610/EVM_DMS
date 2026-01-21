# ✅ HYBRID APPROACH - TESTING CHECKLIST

## 🧪 Manual Testing Steps

### **Test 1: Editor Real-time Preview (React)**
```
1. Go to: /admin/templates/new
2. Fill template name: "Test Template 123"
3. Upload logo
4. Change company name
5. ✅ VERIFY: Preview updates INSTANTLY (0ms lag)
6. Change background frame
7. ✅ VERIFY: Preview updates IMMEDIATELY
```

**Expected Result:** ⚡ Instant updates with NO delay

---

### **Test 2: Save & Final Preview (Backend HTML)**
```
1. Still on editor page
2. Click "Lưu" button
3. ✅ VERIFY: Success message, navigate to edit page
4. Note the templateId in URL (e.g., /admin/templates/edit/5)
5. Click "Xem Trước Cuối Cùng" button
6. ✅ VERIFY: Navigate to /admin/templates/preview/5
7. ✅ VERIFY: Loading indicator appears
8. ✅ VERIFY: Iframe loads with HTML
9. ✅ VERIFY: Preview looks EXACTLY like editor preview
```

**Expected Result:** 🎯 Backend HTML renders in < 1 second

---

### **Test 3: Print Functionality**
```
1. On preview page (/admin/templates/preview/5)
2. Click "In mẫu" button
3. ✅ VERIFY: New window opens
4. ✅ VERIFY: Print dialog appears
5. ✅ VERIFY: Preview in print dialog matches screen
6. Cancel print dialog
```

**Expected Result:** 🖨️ Print preview = Screen preview

---

### **Test 4: Zoom Controls**
```
1. On preview page
2. Click zoom in (+) button 3 times
3. ✅ VERIFY: Preview scales up, chip shows 130%
4. Click zoom out (-) button 5 times
5. ✅ VERIFY: Preview scales down, chip shows 80%
6. Click reset button
7. ✅ VERIFY: Preview back to 100%
```

**Expected Result:** 🔍 Smooth zoom transitions

---

### **Test 5: Download HTML**
```
1. On preview page
2. Click "Tải HTML" button
3. ✅ VERIFY: File downloads as template-5-preview.html
4. Open downloaded file in browser
5. ✅ VERIFY: Looks identical to preview
```

**Expected Result:** 💾 HTML file works standalone

---

### **Test 6: Reload Trigger**
```
1. On preview page
2. Open DevTools Network tab
3. Click "🔄 Tải lại" button
4. ✅ VERIFY: New API request sent
5. ✅ VERIFY: Preview refreshes
```

**Expected Result:** 🔄 Force refresh works

---

### **Test 7: Error Handling - Invalid ID**
```
1. Navigate to: /admin/templates/preview/999999
2. ✅ VERIFY: Error alert shows "Không thể tải preview"
3. ✅ VERIFY: Error message is user-friendly
```

**Expected Result:** ❌ Graceful error display

---

### **Test 8: Navigate Back**
```
1. On preview page
2. Click "Quay lại chỉnh sửa" button
3. ✅ VERIFY: Navigate back to /admin/templates/edit/5
4. ✅ VERIFY: Form still has all data
5. ✅ VERIFY: React preview still works
```

**Expected Result:** ↩️ Seamless navigation

---

### **Test 9: Keyboard Shortcuts**
```
1. On editor page
2. Press Ctrl+P (or Cmd+P on Mac)
3. ✅ VERIFY: Navigates to preview page
4. Go back to editor
5. Make a change
6. Press Ctrl+S (or Cmd+S)
7. ✅ VERIFY: Template saves
```

**Expected Result:** ⌨️ Shortcuts work

---

### **Test 10: Mobile Responsive**
```
1. Open DevTools, toggle device toolbar
2. Select iPhone 12 Pro
3. Visit editor page
4. ✅ VERIFY: Layout stacks vertically
5. Visit preview page
6. ✅ VERIFY: Controls remain accessible
7. ✅ VERIFY: Iframe scales appropriately
```

**Expected Result:** 📱 Mobile-friendly

---

## 🔍 API Testing

### **Test API Endpoint Directly**

```bash
# Test 1: Get preview HTML
curl -X 'GET' \
  'http://159.223.64.31/api/InvoiceTemplate/preview-template/1' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Expected: HTML string with <html><head>...<style>...</style></head><body>...</body></html>
```

```bash
# Test 2: Check response time
time curl -s -o /dev/null -w "%{http_code}\n" \
  'http://159.223.64.31/api/InvoiceTemplate/preview-template/1' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Expected: 200 status in < 500ms
```

---

## 🐛 Known Issues to Check

### **Issue 1: CORS**
- **Problem:** Iframe may block cross-origin
- **Check:** Console for CORS errors
- **Fix:** Backend must set correct headers

### **Issue 2: Image Loading**
- **Problem:** Images in HTML may load slowly
- **Check:** Network tab shows image requests
- **Fix:** Use CDN or optimize images

### **Issue 3: Font Rendering**
- **Problem:** Times New Roman may not render correctly
- **Check:** Text looks correct in preview
- **Fix:** Include font-family fallbacks

---

## 📊 Performance Benchmarks

### **Target Metrics:**

| Action | Target | Critical |
|--------|--------|----------|
| Editor preview update | < 16ms | < 50ms |
| Navigate to preview page | < 1s | < 3s |
| API response time | < 500ms | < 1s |
| Print dialog open | < 1s | < 2s |
| Zoom animation | < 300ms | < 500ms |

### **How to Measure:**

```javascript
// In browser console
performance.measure('preview-load')
// Check DevTools → Performance tab
```

---

## ✅ Sign-off Checklist

- [ ] All 10 manual tests pass
- [ ] API endpoint returns valid HTML
- [ ] No console errors
- [ ] No network errors
- [ ] Print preview works
- [ ] Download works
- [ ] Zoom works
- [ ] Mobile responsive
- [ ] Keyboard shortcuts work
- [ ] Error handling works
- [ ] Performance within targets
- [ ] Code has no TypeScript errors
- [ ] Documentation complete

---

## 🎯 Success Criteria

**PASS if:**
- ✅ React preview updates in < 50ms
- ✅ Backend preview loads in < 1s
- ✅ Print output matches preview
- ✅ No errors in console
- ✅ All features work on mobile

**FAIL if:**
- ❌ Preview lag > 100ms
- ❌ API errors
- ❌ Print mismatch
- ❌ TypeScript errors
- ❌ Mobile layout broken

---

## 📞 Support

**Issues?** Check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for API errors
4. [Implementation Guide](./HYBRID_TEMPLATE_PREVIEW_IMPLEMENTATION.md)

**Contact:** Dev Team
