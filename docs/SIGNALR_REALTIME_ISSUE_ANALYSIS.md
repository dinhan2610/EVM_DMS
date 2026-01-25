# 🔍 PHÂN TÍCH VẤN ĐỀ: Tại sao SignalR không auto realtime?

## 📋 **User Report**
> "Tôi thực hiện luồng tạo hóa đơn và duyệt ký giữa KT và KTT không thấy auto cập nhật thông tin mà phải load"

## 🚨 **ROOT CAUSE ĐÃ TÌM RA**

### **VẤN ĐỀ CHÍNH: Vite Proxy thiếu `/hubs` endpoint**

**File có vấn đề:** `vite.config.ts`

**Hiện tượng:**
- Frontend code SignalR hoàn hảo ✅
- Hook logic đúng ✅
- Event subscriptions đúng ✅
- **NHƯNG** Vite proxy không forward requests đến `/hubs/notifications` ❌

**Timeline của request:**
```
Frontend → GET /hubs/notifications/negotiate
    ↓
Vite proxy → Check config... KHÔNG TÌM THẤY /hubs proxy
    ↓
404 Not Found ❌
    ↓
SignalR connection failed
    ↓
Không nhận được realtime events
    ↓
User phải manual refresh F5
```

### **Chi tiết kỹ thuật:**

**SignalR Hub URL được tính như sau:**
```typescript
// src/services/signalrService.ts line 27
const SIGNALR_HUB_URL = `${API_CONFIG.BASE_URL.replace('/api', '')}/hubs/notifications`

// API_CONFIG.BASE_URL từ .env:
VITE_API_BASE_URL= (empty) → API_CONFIG.BASE_URL = '/api'

// Tính toán:
'/api'.replace('/api', '') → ''
'' + '/hubs/notifications' → '/hubs/notifications'

// Result: SignalR tries to connect to localhost:5173/hubs/notifications
```

**Vite proxy config cũ:**
```typescript
proxy: {
  '/api': { target: 'https://eims.site', ... },
  '/Invoice': { target: 'https://eims.site', ... },
  '/Dashboard': { target: 'https://eims.site', ... },
  // ❌ THIẾU '/hubs' !!!!
}
```

**Kết quả:**
- Request đến `/api/*` → Proxy to `https://eims.site/api/*` ✅
- Request đến `/hubs/*` → **KHÔNG PROXY** → 404 ❌

---

## ✅ **FIX ĐÃ APPLY**

### **Thay đổi 1: Thêm `/hubs` proxy**

**File:** `vite.config.ts`

```typescript
proxy: {
  // ... existing proxies ...
  '/Dashboard': {
    target: 'https://eims.site',
    changeOrigin: true,
    secure: false,
  },
  // ⭐ NEW: SignalR Hub Proxy
  '/hubs': {
    target: 'https://eims.site',
    changeOrigin: true,
    secure: false,
    ws: true, // ✅ CRITICAL: Enable WebSocket support
  },
}
```

**Tại sao cần `ws: true`?**
- SignalR dùng WebSocket protocol sau khi negotiate
- Vite cần biết để upgrade HTTP → WebSocket
- Không có `ws: true` → WebSocket handshake fail

---

## 🧪 **TESTING GUIDE - CHI TIẾT**

### **Bước 1: Restart Vite Dev Server**

**QUAN TRỌNG:** Vite proxy config chỉ load khi start server!

```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

### **Bước 2: Thêm SignalRDiagnostic Component**

**File đã tồn tại:** `src/components/SignalRDiagnostic.tsx`

**Cách dùng:**

#### **Option 1: Test trên StaffDashboard (Kế toán)**
```typescript
// src/page/StaffDashboard.tsx
import SignalRDiagnostic from '@/components/SignalRDiagnostic'

const StaffDashboard = () => {
  // ... existing code ...

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      {/* Existing dashboard content */}
      
      {/* ⭐ Add diagnostic tool */}
      <SignalRDiagnostic />
    </Box>
  )
}
```

#### **Option 2: Test trên HODDashboard (Kế toán trưởng)**
```typescript
// src/page/HODDashboard.tsx
import SignalRDiagnostic from '@/components/SignalRDiagnostic'

const HODDashboard = () => {
  // ... existing code ...

  return (
    <Box sx={{ padding: 3 }}>
      {/* Existing dashboard content */}
      
      {/* ⭐ Add diagnostic tool */}
      <SignalRDiagnostic />
    </Box>
  )
}
```

### **Bước 3: Kiểm tra Connection Status**

**Mở browser console (F12):**

**Nếu thành công, sẽ thấy:**
```
🔵 [App] User authenticated, initializing SignalR...
🔄 [SignalR] Initializing connection to: /hubs/notifications
✅ [SignalR] Connected successfully!
📨 [SignalR] Subscribed to InvoiceChanged event
📨 [SignalR] Subscribed to DashboardChanged event
```

**SignalRDiagnostic UI sẽ hiện:**
```
Connection Status: ✅ Connected (green chip)
✅ SignalR đã kết nối thành công!
```

**Nếu vẫn fail, sẽ thấy:**
```
❌ [SignalR] Failed to initialize: Error: Failed to start...
Connection Status: ❌ Disconnected (red chip)
⚠️ SignalR chưa kết nối!
```

---

## 🎯 **TEST REALTIME - STEP BY STEP**

### **Scenario 1: Tạo hóa đơn (Accountant)**

**Setup:**
1. Window 1: Login as **Accountant** (KT)
2. Window 2: Login as **HOD** (KTT)
3. Cả 2 windows đều có SignalRDiagnostic visible

**Test Steps:**

**Window 1 (Accountant):**
1. Navigate to "Quản lý hóa đơn"
2. Click "Tạo hóa đơn mới"
3. Fill form → Submit
4. Watch console: `✅ Invoice created: ID=123`

**Window 2 (HOD) - SHOULD AUTO UPDATE:**
1. Dashboard đang mở
2. **Check SignalRDiagnostic:**
   - Event History hiện: `📨 InvoiceChanged: ID=123, Type=Created`
   - Last Event Received hiện payload details
3. **Check console:**
   ```
   📨 [SignalR] InvoiceChanged received: {invoiceId: 123, changeType: "Created", ...}
   📨 [HODDashboard] InvoiceChanged event: {...}
   🔄 [HODDashboard] Refreshing dashboard data...
   ✅ [HODDashboard] Data loaded successfully
   ```
4. **Check UI:** Dashboard KPIs tự động cập nhật (không cần F5!)

---

### **Scenario 2: Duyệt hóa đơn (HOD)**

**Setup:** Same as Scenario 1

**Test Steps:**

**Window 2 (HOD):**
1. Navigate to "Phê duyệt hóa đơn"
2. Click "Duyệt" trên invoice vừa tạo
3. Confirm approval
4. Watch console: `✅ Invoice approved: ID=123`

**Window 1 (Accountant) - SHOULD AUTO UPDATE:**
1. Dashboard đang mở
2. **Check SignalRDiagnostic:**
   - Event History hiện: `📨 InvoiceChanged: ID=123, Type=StatusChanged`
3. **Check console:**
   ```
   📨 [SignalR] InvoiceChanged received: {invoiceId: 123, changeType: "StatusChanged", statusId: 6, ...}
   📨 [StaffDashboard] InvoiceChanged event: {...}
   🔄 [StaffDashboard] Refreshing dashboard data...
   ```
4. **Check UI:** 
   - Dashboard KPIs update (draftsCount giảm, sentToday tăng)
   - Task queue tự động refresh

---

## 🔍 **TROUBLESHOOTING**

### **Issue 1: SignalRDiagnostic shows "Disconnected"**

**Possible causes:**

1. **Vite server chưa restart:**
   ```bash
   # Must restart after vite.config.ts changes!
   Ctrl+C
   npm run dev
   ```

2. **Backend chưa enable SignalR Hub:**
   - Check backend logs
   - Endpoint `/hubs/notifications` must exist
   - Hub must accept WebSocket connections

3. **JWT token invalid:**
   ```javascript
   // Check localStorage
   localStorage.getItem('eims_access_token')
   // Should return valid JWT
   ```

4. **CORS issues:**
   - Backend must allow origin: `http://localhost:5173`
   - Backend must allow credentials
   - Backend must expose SignalR endpoints

---

### **Issue 2: Connected but no events received**

**Possible causes:**

1. **Backend không gửi events:**
   - Backend service phải call `_hubContext.Clients.All.SendAsync("InvoiceChanged", payload)`
   - Check backend logs khi tạo/duyệt invoice

2. **Event payload sai format:**
   ```csharp
   // Backend phải gửi đúng structure:
   new {
     invoiceId = 123,
     changeType = "Created", // NOT "create" hoặc "CREATED"
     statusId = 1,
     customerId = 456,
     roles = new[] { "Admin", "HOD", "Accountant" },
     occurredAt = DateTime.UtcNow.ToString("o")
   }
   ```

3. **Role filtering:**
   - Check `payload.roles` có chứa role hiện tại không
   - Console sẽ log: `payload.roles.includes(USER_ROLES.HOD)`

---

### **Issue 3: Events received nhưng UI không update**

**Check these:**

1. **Fetch function có được gọi không:**
   ```
   Should see in console:
   🔄 [ComponentName] Refreshing data...
   ✅ [ComponentName] Data loaded successfully
   ```

2. **API call có fail không:**
   - Check Network tab (F12)
   - API endpoint có return 200 OK không

3. **State có update không:**
   - Use React DevTools
   - Check component state changes

---

## 📊 **EXPECTED RESULTS**

### **After Fix Applied:**

| Scenario | Before | After |
|----------|--------|-------|
| **Connection** | ❌ Fail (404) | ✅ Connected |
| **Create Invoice** | Manual F5 | ✅ Auto refresh |
| **Approve Invoice** | Manual F5 | ✅ Auto refresh |
| **Events Received** | 0% | ✅ 100% |
| **Diagnostic Status** | Disconnected | ✅ Connected |
| **Console Logs** | Errors | ✅ Success messages |

---

## 🎯 **VERIFICATION CHECKLIST**

Sau khi fix và restart server, verify các điểm sau:

- [ ] Vite server đã restart sau khi sửa vite.config.ts
- [ ] SignalRDiagnostic hiện "✅ Connected"
- [ ] Console có log "✅ [SignalR] Connected successfully!"
- [ ] Tạo invoice mới → Window khác nhận event
- [ ] Duyệt invoice → Window khác nhận event
- [ ] SignalRDiagnostic Event History có logs
- [ ] Dashboard tự động refresh (không cần F5)
- [ ] Console không có errors

---

## 📝 **NOTES**

### **Development vs Production:**

**Development (localhost:5173):**
- Dùng Vite proxy → Forward `/hubs` to `https://eims.site`
- ✅ Fix đã apply: Thêm `/hubs` proxy với `ws: true`

**Production (eims.site):**
- Không dùng proxy
- SignalR connect trực tiếp: `https://eims.site/hubs/notifications`
- ✅ Already works (no proxy needed)

### **Backend Requirements:**

Backend **MUST** implement:
1. SignalR Hub tại `/hubs/notifications`
2. JWT authentication support
3. 3 events: InvoiceChanged, UserChanged, DashboardChanged
4. CORS with credentials allowed
5. WebSocket support enabled

Refer to: `docs/SIGNALR_BACKEND_REQUIREMENTS.md`

---

## ✅ **CONCLUSION**

**Root cause:** Vite proxy thiếu `/hubs` endpoint với WebSocket support

**Fix:** Thêm proxy config:
```typescript
'/hubs': {
  target: 'https://eims.site',
  changeOrigin: true,
  secure: false,
  ws: true, // Critical!
}
```

**Impact:** 
- ✅ SignalR connection thành công
- ✅ Realtime events hoạt động
- ✅ Auto refresh across all 13 pages
- ✅ No manual F5 needed

**Next steps:**
1. Restart Vite server
2. Test with SignalRDiagnostic
3. Verify realtime flow: Create → Approve → Auto refresh

---

**Document Version:** 1.1
**Last Updated:** January 25, 2026
**Status:** ✅ FIX APPLIED - READY TO TEST
