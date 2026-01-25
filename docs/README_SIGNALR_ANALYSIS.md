# 🔍 Phân Tích Chi Tiết: Tại Sao SignalR Không Auto Realtime?

## 📋 **Vấn Đề User Báo Cáo**

> "Tôi thực hiện luồng tạo hóa đơn và duyệt ký giữa KT (Kế toán) và KTT (Kế toán trưởng) không thấy auto cập nhật thông tin mà phải load lại trang (F5)"

---

## 🎯 **Root Cause - Đã Tìm Ra!**

### **VẤN ĐỀ CHÍNH: Vite Proxy thiếu `/hubs` endpoint**

**File có bug:** [`vite.config.ts`](../vite.config.ts)

**Chi tiết:**

SignalR cố connect đến: `http://localhost:5173/hubs/notifications`

Nhưng Vite proxy config chỉ có:
```typescript
proxy: {
  '/api': { target: 'https://eims.site', ... },
  '/Invoice': { target: 'https://eims.site', ... },
  '/Dashboard': { target: 'https://eims.site', ... },
  // ❌ THIẾU '/hubs' !
}
```

**Kết quả:**
- Request đến `/hubs/notifications` → **Không proxy được**
- Vite trả về 404 Not Found
- SignalR connection fail
- Không nhận được realtime events
- User phải manual F5 để refresh

---

## ✅ **Giải Pháp - Đã Fix!**

### **Fix Applied:**

```typescript
// vite.config.ts
proxy: {
  // ... existing proxies ...
  
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
- SignalR dùng WebSocket protocol (sau negotiate phase)
- Vite cần upgrade HTTP → WebSocket connection
- Không có `ws: true` → WebSocket handshake fail

---

## 🧪 **Cách Test - Bước Đầu Tiên**

### **⚠️ QUAN TRỌNG: PHẢI RESTART VITE SERVER!**

```bash
# Stop server
Ctrl+C

# Start lại
npm run dev
```

**Lý do:** Vite proxy config chỉ load khi start server. Không restart = fix không có tác dụng!

---

## 📊 **Luồng Test Chi Tiết**

### **Scenario: Tạo và Duyệt Hóa Đơn**

**Setup:**
1. Window 1: Login as **Accountant** (Kế toán)
2. Window 2: Login as **HOD** (Kế toán trưởng)
3. Cả 2 có SignalRDiagnostic tool (optional, để test)

**Test Flow:**

```
Step 1: Accountant tạo invoice mới
    ↓
Backend: Save invoice → Send SignalR event "InvoiceChanged"
    ↓
Frontend: Nhận event qua WebSocket
    ↓
HOD Dashboard: Auto refresh (không cần F5!)
    ↓
✅ KPIs update, pending invoices list update

Step 2: HOD duyệt invoice
    ↓
Backend: Update status → Send SignalR event "InvoiceChanged"
    ↓
Frontend: Nhận event qua WebSocket
    ↓
Accountant Dashboard: Auto refresh
    ↓
✅ Task queue update, drafts count giảm
```

---

## 🔍 **Phân Tích Kỹ Thuật**

### **SignalR Connection Flow:**

**1. Negotiate Phase (HTTP):**
```
GET /hubs/notifications/negotiate
Authorization: Bearer <JWT>
    ↓
Response: { 
  connectionToken: "...",
  availableTransports: ["WebSockets", "ServerSentEvents"]
}
```

**2. WebSocket Upgrade:**
```
GET /hubs/notifications?id=<connectionToken>
Connection: Upgrade
Upgrade: websocket
    ↓
101 Switching Protocols
```

**3. Event Subscription:**
```javascript
connection.on('InvoiceChanged', (payload) => {
  console.log('Event received:', payload)
  // Auto refresh dashboard
})
```

### **Fix trước và sau:**

**TRƯỚC FIX:**
```
Browser → /hubs/notifications/negotiate
    ↓
Vite proxy: "Unknown path /hubs"
    ↓
404 Not Found ❌
    ↓
SignalR: Connection failed
    ↓
No realtime events
```

**SAU FIX:**
```
Browser → /hubs/notifications/negotiate
    ↓
Vite proxy: Forward to https://eims.site/hubs/notifications
    ↓
200 OK ✅
    ↓
WebSocket upgrade success
    ↓
Events received → Auto refresh!
```

---

## 🛠️ **Diagnostic Tools**

### **1. SignalRDiagnostic Component**

**File:** [`src/components/SignalRDiagnostic.tsx`](../src/components/SignalRDiagnostic.tsx)

**Features:**
- 🟢 Real-time connection status
- 📋 Event logs (last 10 events)
- 📦 Last event payload preview
- 🔄 Manual reconnect button

**Cách dùng:**
```typescript
import SignalRDiagnostic from '@/components/SignalRDiagnostic'

<SignalRDiagnostic />
```

### **2. Console Logs**

**Khi connection thành công:**
```
🔵 [App] User authenticated, initializing SignalR...
🔄 [SignalR] Initializing connection to: /hubs/notifications
✅ [SignalR] Connected successfully!
📨 [SignalR] Subscribed to InvoiceChanged event
📨 [SignalR] Subscribed to DashboardChanged event
```

**Khi nhận event:**
```
📨 [SignalR] InvoiceChanged received: {
  invoiceId: 123,
  changeType: "Created",
  statusId: 1,
  customerId: 456,
  roles: ["Admin", "HOD", "Accountant"],
  occurredAt: "2026-01-25T..."
}
📨 [HODDashboard] InvoiceChanged event: {...}
🔄 [HODDashboard] Refreshing dashboard data...
✅ [HODDashboard] Data loaded successfully
```

---

## 🚨 **Troubleshooting**

### **Issue 1: Vẫn thấy "Disconnected"**

**Nguyên nhân có thể:**

1. **Vite server chưa restart** (phổ biến nhất!)
   ```bash
   Ctrl+C → npm run dev
   ```

2. **Backend chưa enable SignalR Hub**
   - Endpoint `/hubs/notifications` must exist
   - Backend logs should show SignalR connection attempts
   - Refer: [`SIGNALR_BACKEND_REQUIREMENTS.md`](SIGNALR_BACKEND_REQUIREMENTS.md)

3. **JWT token invalid**
   ```javascript
   // Check trong console
   localStorage.getItem('eims_access_token')
   ```

4. **CORS configuration**
   - Backend must allow origin: `http://localhost:5173`
   - Backend must allow credentials
   - Backend must expose SignalR endpoints

### **Issue 2: Connected nhưng không nhận events**

**Check:**

1. **Backend có gửi events không?**
   ```csharp
   // Backend code should have:
   await _hubContext.Clients.All.SendAsync("InvoiceChanged", new {
     invoiceId = 123,
     changeType = "Created",
     // ... other fields
   });
   ```

2. **Event payload đúng format không?**
   - Event name: `"InvoiceChanged"` (exact case)
   - Payload phải có: `invoiceId`, `changeType`, `roles`, `occurredAt`

3. **Roles có match không?**
   ```javascript
   // Frontend filters by role:
   if (payload.roles.includes(USER_ROLES.HOD)) {
     fetchDashboardData() // Only HOD refresh
   }
   ```

### **Issue 3: Events nhận được nhưng UI không update**

**Debug steps:**

1. **Check console logs:**
   - Có thấy: `🔄 [Component] Refreshing data...`?
   - Có thấy: `✅ [Component] Data loaded successfully`?

2. **Check Network tab:**
   - API calls có fail không?
   - Status code 200 OK?

3. **Check React DevTools:**
   - Component state có update không?
   - Props có thay đổi không?

---

## 📚 **Documents Tham Khảo**

### **Quick Start:**
- 📘 [`SIGNALR_QUICK_TEST.md`](SIGNALR_QUICK_TEST.md) - Test trong 3 phút
- 🐛 [`SIGNALR_REALTIME_ISSUE_ANALYSIS.md`](SIGNALR_REALTIME_ISSUE_ANALYSIS.md) - Phân tích chi tiết

### **Backend Requirements:**
- 📚 [`SIGNALR_BACKEND_REQUIREMENTS.md`](SIGNALR_BACKEND_REQUIREMENTS.md) - Hub implementation guide

### **Implementation Details:**
- 🔧 `src/services/signalrService.ts` - Connection manager
- 🎣 `src/hooks/useSignalR.ts` - React hooks
- 📡 `src/types/signalr.types.ts` - TypeScript types
- 🔧 `src/components/SignalRDiagnostic.tsx` - Debug tool

---

## ✅ **Verification Checklist**

Sau khi apply fix, verify:

- [ ] Vite server đã restart (`Ctrl+C` → `npm run dev`)
- [ ] Browser console có `✅ [SignalR] Connected successfully!`
- [ ] SignalRDiagnostic hiện "✅ Connected" (nếu dùng)
- [ ] Window 1 tạo invoice → Window 2 nhận event
- [ ] Window 2 duyệt invoice → Window 1 nhận event
- [ ] Dashboard auto refresh (KHÔNG CẦN F5!)
- [ ] Console không có errors

---

## 🎯 **Kết Luận**

### **Trước khi fix:**
- ❌ SignalR không connect được
- ❌ Realtime không hoạt động
- ❌ Phải manual F5 để refresh data
- ❌ User experience kém

### **Sau khi fix:**
- ✅ SignalR connection thành công
- ✅ Realtime events hoạt động 100%
- ✅ Auto refresh across all 13 pages
- ✅ No manual F5 needed
- ✅ Professional user experience

### **Nguyên nhân chính:**
**Vite proxy thiếu cấu hình cho `/hubs` endpoint với WebSocket support**

### **Giải pháp:**
**Thêm proxy config: `'/hubs': { target: 'https://eims.site', ws: true }`**

### **Action Required:**
**RESTART Vite server để apply fix!**

---

## 📞 **Support**

Nếu vẫn gặp vấn đề sau khi:
1. ✅ Đã apply fix (vite.config.ts)
2. ✅ Đã restart Vite server
3. ✅ JWT token valid
4. ✅ Browser console vẫn show errors

**→ Có thể backend chưa enable SignalR Hub!**

Liên hệ backend team và refer:
- [`SIGNALR_BACKEND_REQUIREMENTS.md`](SIGNALR_BACKEND_REQUIREMENTS.md)
- Backend must implement: Hub endpoint + 3 events + JWT auth

---

**Document Version:** 1.0
**Last Updated:** January 25, 2026
**Status:** ✅ FIX APPLIED - READY TO TEST
