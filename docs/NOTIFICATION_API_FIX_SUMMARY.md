# 🔧 NOTIFICATION API FIX - QUICK SUMMARY

**Vấn đề:** Admin đăng nhập nhưng không thấy thông báo (Swagger có data)

---

## 🚨 ROOT CAUSE

**Thiếu Vite proxy cho `/Notification` endpoint**

```typescript
// vite.config.ts - BEFORE
server: {
  proxy: {
    '/api': { target: 'http://159.223.64.31' },
    '/Auth': { target: 'http://159.223.64.31' },
    '/User': { target: 'http://159.223.64.31' },
    // ❌ MISSING: '/Notification'
  }
}
```

**Kết quả:** Request `/api/Notification` không được proxy → 404 Not Found

---

## ✅ FIXES

### **1. Added `/Notification` Proxy**
```typescript
// vite.config.ts - AFTER
'/Notification': {
  target: 'http://159.223.64.31',
  changeOrigin: true,
  secure: false,
},
```

### **2. Added Debug Logging**
```typescript
// notificationService.ts
console.log('[Notification] Fetching:', { url, params })
console.log('[Notification] Response:', { totalCount, itemsCount })
console.error('[Notification] API call failed:', error)
console.warn('[Notification] User not authenticated')
```

---

## 🎯 VERIFICATION

### **1. Restart Vite Dev Server** (Required!)
```bash
Ctrl+C  # Kill current server
npm run dev  # Restart
```

### **2. Check Browser Console**
```
✅ [Notification] Fetching: { url: '/Notification?pageIndex=1&pageSize=5', ... }
✅ [Notification] Response: { totalCount: 10, itemsCount: 5 }
```

### **3. Check Network Tab**
```
✅ Request URL: http://localhost:5173/api/Notification?pageIndex=1&pageSize=5
✅ Status Code: 200 OK
✅ Response: { items: [...], totalCount: N }
```

### **4. Check UI**
```
✅ Badge hiển thị số unread
✅ Dropdown hiển thị danh sách thông báo
✅ Click notification → mark as read
```

---

## 📝 FILES CHANGED

1. ✅ `vite.config.ts` - Added `/Notification` proxy
2. ✅ `src/services/notificationService.ts` - Added debug logging

---

## ⚠️ IMPORTANT

**Vite proxy changes REQUIRE server restart!**
- Stop server: `Ctrl+C`
- Start server: `npm run dev`
- Clear browser cache if needed

---

**Last Updated:** 14/01/2026
