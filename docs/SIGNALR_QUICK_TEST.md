# 🚀 Quick Test Guide - SignalR Realtime

## ⚡ **BƯỚC 1: Apply Fix (QUAN TRỌNG!)**

### **Fix đã apply tự động:**
✅ `vite.config.ts` - Đã thêm `/hubs` proxy với WebSocket support

### **Action Required: RESTART Vite Server!**

```bash
# Trong terminal đang chạy npm run dev
# Nhấn Ctrl+C để stop

# Sau đó start lại:
npm run dev
```

**⚠️ LƯU Ý:** Vite proxy config CHỈ load khi start server. Không restart = fix không có tác dụng!

---

## ⚡ **BƯỚC 2: Thêm Diagnostic Tool (30 giây)**

### **Option A: Test trên StaffDashboard (Kế toán)**

Mở file: `src/page/StaffDashboard.tsx`

Thêm import ở đầu file:
```typescript
import SignalRDiagnostic from '@/components/SignalRDiagnostic'
```

Thêm component trước closing tag của return:
```typescript
return (
  <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
    {/* ... existing dashboard content ... */}
    
    {/* ⭐ Add this line before closing </Box> */}
    <SignalRDiagnostic />
  </Box>
)
```

### **Option B: Test trên HODDashboard (Kế toán trưởng)**

Mở file: `src/page/HODDashboard.tsx`

Thêm import:
```typescript
import SignalRDiagnostic from '@/components/SignalRDiagnostic'
```

Thêm component:
```typescript
return (
  <Box sx={{ padding: 3 }}>
    {/* ... existing dashboard content ... */}
    
    {/* ⭐ Add this line */}
    <SignalRDiagnostic />
  </Box>
)
```

---

## ⚡ **BƯỚC 3: Test Connection (10 giây)**

1. **Login vào hệ thống** (KT hoặc KTT)
2. **Navigate to Dashboard page** (trang vừa thêm diagnostic tool)
3. **Mở browser console (F12)**
4. **Check SignalRDiagnostic panel** (góc dưới bên phải màn hình)

### **✅ Thành công nếu thấy:**

**Console logs:**
```
🔵 [App] User authenticated, initializing SignalR...
🔄 [SignalR] Initializing connection to: /hubs/notifications
✅ [SignalR] Connected successfully!
📨 [SignalR] Subscribed to InvoiceChanged event
```

**Diagnostic panel:**
```
Connection Status: ✅ Connected (màu xanh)
✅ SignalR đã kết nối thành công!
Realtime events sẽ được nhận tự động.
```

### **❌ Nếu thất bại sẽ thấy:**

**Console:**
```
❌ [SignalR] Failed to initialize: Error: ...
```

**Diagnostic panel:**
```
Connection Status: ❌ Disconnected (màu đỏ)
⚠️ SignalR chưa kết nối!
Có thể backend chưa enable SignalR Hub...
```

**→ Nếu fail:** Check `docs/SIGNALR_REALTIME_ISSUE_ANALYSIS.md` section TROUBLESHOOTING

---

## ⚡ **BƯỚC 4: Test Realtime (2 phút)**

### **Setup:**
1. **Mở 2 browser windows** (hoặc 2 Chrome profiles)
2. **Window 1:** Login as **Accountant** (Kế toán)
3. **Window 2:** Login as **HOD** (Kế toán trưởng)
4. **Cả 2 windows:** Navigate to Dashboard (có SignalRDiagnostic visible)

### **Test Case 1: Tạo hóa đơn mới**

**Window 1 (Accountant):**
1. Click "Quản lý hóa đơn" → "Tạo hóa đơn"
2. Fill form và submit
3. **Check console:** `✅ Invoice created`

**Window 2 (HOD) - CHECK AUTO UPDATE:**
1. **Diagnostic panel** hiện event: `📨 InvoiceChanged: ID=xxx, Type=Created`
2. **Console logs:**
   ```
   📨 [SignalR] InvoiceChanged received: {...}
   🔄 [HODDashboard] Refreshing dashboard data...
   ✅ [HODDashboard] Data loaded successfully
   ```
3. **Dashboard KPIs** tự động update (KHÔNG CẦN F5!)

### **Test Case 2: Duyệt hóa đơn**

**Window 2 (HOD):**
1. Navigate "Phê duyệt hóa đơn"
2. Click "Duyệt" trên invoice vừa tạo
3. Confirm

**Window 1 (Accountant) - CHECK AUTO UPDATE:**
1. **Diagnostic panel** hiện event: `📨 InvoiceChanged: Type=StatusChanged`
2. **Dashboard** tự động refresh
3. **Task queue** update

---

## 📊 **KẾT QUẢ MONG ĐỢI**

| Action | Window Thực Hiện | Window Quan Sát | Result |
|--------|------------------|-----------------|--------|
| Create Invoice | Accountant | HOD Dashboard | ✅ Auto refresh |
| Approve Invoice | HOD | Accountant Dashboard | ✅ Auto refresh |
| Update Invoice | Accountant | HOD List | ✅ Auto refresh |
| Sign Invoice | HOD | Accountant Dashboard | ✅ Auto refresh |

---

## 🐛 **TROUBLESHOOTING NHANH**

### **Issue: Diagnostic shows "Disconnected"**

1. **Check Vite server đã restart chưa?**
   ```bash
   Ctrl+C → npm run dev
   ```

2. **Check console có errors không?**
   - Look for: `❌ [SignalR] Failed to initialize`
   - Có thể backend chưa enable SignalR Hub

3. **Check JWT token:**
   ```javascript
   // Trong console
   localStorage.getItem('eims_access_token')
   // Should show: "eyJhbGci..."
   ```

### **Issue: Connected nhưng không nhận events**

1. **Check backend có gửi events không:**
   - Backend phải call `_hubContext.Clients.All.SendAsync("InvoiceChanged", payload)`
   - Check backend logs

2. **Check event payload format:**
   - Must match: `{ invoiceId, changeType, statusId, roles, ... }`
   - Event name: "InvoiceChanged" (exact case)

3. **Check roles:**
   - Payload phải có: `roles: ["Admin", "HOD", "Accountant"]`
   - Console log sẽ show role filtering logic

### **Issue: Events nhận được nhưng UI không update**

1. **Check fetch function có gọi không:**
   - Look for: `🔄 [ComponentName] Refreshing data...`

2. **Check API có fail không:**
   - F12 → Network tab
   - Look for failed API calls

---

## ✅ **VERIFICATION CHECKLIST**

Sau khi test, check các điểm sau:

- [ ] Vite server đã restart
- [ ] SignalRDiagnostic hiện "Connected"
- [ ] Console có "✅ Connected successfully!"
- [ ] Window 1 tạo invoice → Window 2 thấy event
- [ ] Window 2 duyệt invoice → Window 1 thấy event
- [ ] Diagnostic Event History có logs
- [ ] Dashboard auto refresh (không F5)
- [ ] Không có errors trong console

---

## 📝 **NOTES**

### **Remove Diagnostic Tool (sau khi test xong)**

Diagnostic tool chỉ để test, nên remove sau khi verify realtime working:

```typescript
// Remove this line:
<SignalRDiagnostic />
```

### **Nếu vẫn không work:**

1. **Backend chưa enable SignalR Hub** - Đây là nguyên nhân phổ biến nhất
   - Check với backend team
   - Refer: `docs/SIGNALR_BACKEND_REQUIREMENTS.md`

2. **CORS issues** - Backend phải allow credentials
3. **WebSocket không support** - Firewall/proxy có thể block

---

## 🎯 **EXPECTED TIMELINE**

- **Apply fix:** 10 giây (đã done tự động)
- **Restart server:** 10 giây
- **Add diagnostic:** 30 giây
- **Test connection:** 10 giây
- **Test realtime:** 2 phút

**TOTAL:** ~3 phút để verify toàn bộ realtime flow!

---

**Quick Reference:**
- Full Analysis: `docs/SIGNALR_REALTIME_ISSUE_ANALYSIS.md`
- Backend Requirements: `docs/SIGNALR_BACKEND_REQUIREMENTS.md`
- Diagnostic Component: `src/components/SignalRDiagnostic.tsx`
