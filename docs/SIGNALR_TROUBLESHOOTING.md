# 🐛 SignalR Troubleshooting Guide

## ❓ Vấn đề: "Các trang không auto realtime"

### ✅ **Các bước đã fix (25/01/2026)**

#### 🔴 **BUG #1: useEffect Dependencies Race Condition**

**Vấn đề:**
```typescript
// ❌ SAI - Handler functions làm dependencies
useEffect(() => {
  signalRService.onInvoiceChanged(onInvoiceChanged) // New function mỗi render!
}, [enabled, onInvoiceChanged, onUserChanged, onDashboardChanged])
```

**Hậu quả:**
- Component re-render → Tạo handler functions mới
- useEffect detect dependency change → Cleanup & re-run
- **Unsubscribe old handlers TRƯỚC KHI events đến!**
- Events bị miss vì không có handlers nào nghe

**Đã fix:**
```typescript
// ✅ ĐÚNG - Store handlers trong ref, chỉ subscribe ONCE
const handlersRef = useRef({ onInvoiceChanged, onUserChanged, onDashboardChanged })

useEffect(() => {
  handlersRef.current = { onInvoiceChanged, onUserChanged, onDashboardChanged }
}, [onInvoiceChanged, onUserChanged, onDashboardChanged])

useEffect(() => {
  // Wrapper functions call current handlers from ref
  const wrapper = (payload) => handlersRef.current.onInvoiceChanged?.(payload)
  signalRService.onInvoiceChanged(wrapper)
  return () => signalRService.connection.off('InvoiceChanged', wrapper)
}, [enabled]) // ✅ CHỈ phụ thuộc vào enabled
```

**File:** `src/hooks/useSignalR.ts`

---

#### 🔴 **BUG #2: Unsubscribe Không Hoạt Động**

**Vấn đề:**
```typescript
// ❌ SAI - Unsubscribe sai handler
this.connection.on('InvoiceChanged', (payload) => {
  handler(payload) // Wrapper function
})

return () => {
  this.connection.off('InvoiceChanged', handler) // ❌ Xóa original handler!
}
```

**Hậu quả:**
- SignalR lưu **wrapper function**: `(payload) => handler(payload)`
- `.off()` cố xóa **original handler**: `handler`
- Hai references KHÁC NHAU → Không xóa được
- **Event handlers tích lũy theo thời gian** → Memory leak + duplicate events

**Đã fix:**
```typescript
// ✅ ĐÚNG - Store wrapper và unsubscribe đúng wrapper
const wrapper = (payload) => {
  console.log('📨 Event received:', payload)
  handler(payload)
}

this.connection.on('InvoiceChanged', wrapper)

return () => {
  this.connection.off('InvoiceChanged', wrapper) // ✅ Xóa đúng wrapper
}
```

**File:** `src/services/signalrService.ts`

---

#### 🔴 **BUG #3: useSignalRReconnect Hook có vấn đề tương tự**

**Vấn đề:**
```typescript
// ❌ SAI - Callback làm dependency
useEffect(() => {
  window.addEventListener('signalr:reconnected', onReconnected)
  return () => window.removeEventListener('signalr:reconnected', onReconnected)
}, [onReconnected]) // ❌ Re-subscribe mỗi render
```

**Đã fix:**
```typescript
// ✅ ĐÚNG - Store callback trong ref
const callbackRef = useRef(onReconnected)

useEffect(() => {
  callbackRef.current = onReconnected
}, [onReconnected])

useEffect(() => {
  const wrapper = () => callbackRef.current()
  window.addEventListener('signalr:reconnected', wrapper)
  return () => window.removeEventListener('signalr:reconnected', wrapper)
}, []) // ✅ Empty deps - subscribe ONCE
```

**File:** `src/hooks/useSignalR.ts`

---

## 🧪 **Cách kiểm tra SignalR đã hoạt động**

### **Option 1: Sử dụng Diagnostic Component**

1. Mở file bất kỳ (ví dụ: `src/page/StaffDashboard.tsx`)
2. Import component:
   ```typescript
   import SignalRDiagnostic from '@/components/SignalRDiagnostic'
   ```
3. Add vào JSX (cuối page):
   ```tsx
   return (
     <Box>
       {/* Existing content */}
       
       {/* Add this */}
       <SignalRDiagnostic />
     </Box>
   )
   ```
4. Reload page → Diagnostic panel hiện góc dưới phải màn hình

**Kết quả mong đợi:**
- ✅ **Nếu backend đã enable:** Status = "✅ Connected", logs sẽ hiện events
- ❌ **Nếu backend chưa enable:** Status = "❌ Disconnected", có warning message

---

### **Option 2: Kiểm tra Browser Console**

Mở Console (F12) và search các logs:

**1. SignalR Initialization:**
```
🔄 [SignalR] Initializing connection to: https://api.com/hubs/notifications
✅ [SignalR] Connected successfully!
```

**2. Event Subscription:**
```
🔵 [useSignalR] Setting up SignalR subscriptions...
📨 [useSignalR] Subscribed to InvoiceChanged
📨 [useSignalR] Subscribed to DashboardChanged
```

**3. Events Received:**
```
📨 [SignalR] InvoiceChanged received: {invoiceId: 123, changeType: "Created", ...}
📨 [StaffDashboard] InvoiceChanged event: {invoiceId: 123, ...}
🔄 [StaffDashboard] Refreshing dashboard data...
```

**4. Reconnection:**
```
🔄 [SignalR] Reconnecting... (Attempt 1)
✅ [SignalR] Reconnected successfully!
🔄 [useSignalRReconnect] Reconnected, triggering callback
```

---

### **Option 3: Test với Backend Fake Events**

Backend có thể test bằng cách gửi fake event:

```csharp
// Trong controller hoặc test endpoint
[HttpPost("test-signalr")]
public async Task<IActionResult> TestSignalR()
{
    await _hubContext.Clients.All.SendAsync("InvoiceChanged", new
    {
        invoiceId = 999,
        changeType = "Created",
        statusId = 1,
        customerId = 100,
        roles = new[] { "Admin", "HOD", "Accountant", "Sales" },
        occurredAt = DateTime.UtcNow.ToString("o")
    });
    
    return Ok("Event sent!");
}
```

**Test:**
1. Call API: `POST /api/test-signalr`
2. Check frontend console → Should see event logs
3. Check dashboard → Should auto refresh

---

## 🚨 **Common Issues & Solutions**

### Issue 1: "❌ [SignalR] Failed to initialize: Status code '404'"

**Nguyên nhân:** Backend chưa enable SignalR Hub

**Giải pháp:**
1. Check backend có file `NotificationHub.cs` không
2. Verify `Program.cs` có:
   ```csharp
   app.MapHub<NotificationHub>("/hubs/notifications");
   ```
3. Test endpoint: `curl -X POST https://api.com/hubs/notifications/negotiate`

---

### Issue 2: "❌ [SignalR] Failed to initialize: Status code '401'"

**Nguyên nhân:** JWT authentication failed

**Giải pháp:**
1. Check localStorage có token không:
   ```javascript
   console.log(localStorage.getItem('eims_access_token'))
   ```
2. Verify backend hub có `[Authorize]` attribute:
   ```csharp
   [Authorize]
   public class NotificationHub : Hub { ... }
   ```
3. Check backend JWT configuration có support SignalR:
   ```csharp
   options.Events = new JwtBearerEvents
   {
       OnMessageReceived = context =>
       {
           var token = context.Request.Query["access_token"];
           if (!string.IsNullOrEmpty(token) && 
               context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
           {
               context.Token = token;
           }
           return Task.CompletedTask;
       }
   };
   ```

---

### Issue 3: "⚠️ [SignalR] Connection closed"

**Nguyên nhân:** Backend stopped hoặc network issue

**Giải pháp:**
- Frontend tự động reconnect (exponential backoff)
- Check backend logs xem có crash không
- Verify network connection

---

### Issue 4: "Connected nhưng không nhận events"

**Nguyên nhân:** Event name sai hoặc backend không gửi events

**Giải pháp:**
1. Check event names (case-sensitive):
   - ✅ `"InvoiceChanged"` (đúng)
   - ❌ `"invoiceChanged"` (sai)
   - ❌ `"InvoiceChange"` (sai)

2. Verify backend có gửi events không:
   ```csharp
   Console.WriteLine($"📨 Sending event: {eventName}");
   await _hubContext.Clients.All.SendAsync(eventName, payload);
   ```

3. Check payload structure có đúng không (xem `src/types/signalr.types.ts`)

---

### Issue 5: "Events nhận được nhưng component không refresh"

**Nguyên nhân:** Role filtering hoặc logic bug

**Giải pháp:**
1. Check roles trong payload:
   ```typescript
   console.log('Event roles:', payload.roles)
   console.log('Current user role:', USER_ROLES.ACCOUNTANT)
   ```

2. Verify role filtering logic:
   ```typescript
   if (payload.roles.includes(USER_ROLES.ACCOUNTANT)) {
     fetchData() // ✅ Should call this
   }
   ```

3. Check `fetchData()` có được gọi không:
   ```typescript
   const fetchData = useCallback(async () => {
     console.log('🔄 Fetching data...') // Add this log
     // ...
   }, [dependencies])
   ```

---

## 📊 **Performance Monitoring**

### Kiểm tra số lượng subscriptions

Mở Console và chạy:
```javascript
// Đếm số event listeners
performance.mark('check-subscriptions')
console.log('SignalR state:', window.__SIGNALR_SERVICE_STATE__)
```

**Expected:**
- 1 connection per app (singleton)
- 1-3 event subscriptions per page (InvoiceChanged, DashboardChanged, UserChanged)
- **Không** tích lũy subscriptions theo thời gian

### Kiểm tra memory leaks

1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Navigate giữa các pages
4. Take snapshot lại
5. Compare snapshots → SignalR objects should NOT accumulate

---

## 📚 **Related Files**

- `src/hooks/useSignalR.ts` - React hooks (FIXED)
- `src/services/signalrService.ts` - Core service (FIXED)
- `src/components/SignalRDiagnostic.tsx` - Diagnostic tool (NEW)
- `docs/SIGNALR_BACKEND_REQUIREMENTS.md` - Backend guide
- All pages using SignalR (13 files) - Using fixed hooks

---

## ✅ **Verification Checklist**

- [x] Fix useEffect dependencies race condition
- [x] Fix unsubscribe không hoạt động
- [x] Fix useSignalRReconnect dependencies
- [x] Tạo SignalRDiagnostic component
- [x] 0 TypeScript errors
- [ ] **Backend enable SignalR Hub** (cần backend team)
- [ ] Test connection với diagnostic tool
- [ ] Test events với fake data
- [ ] Test realtime auto refresh

---

## 🎯 **Next Steps**

1. **Add SignalRDiagnostic** vào 1 page để test (recommend: StaffDashboard)
2. **Check console logs** khi load page
3. **Nếu Status = "❌ Disconnected":**
   - Backend chưa enable → Contact backend team
   - Share file: `docs/SIGNALR_BACKEND_REQUIREMENTS.md`
4. **Nếu Status = "✅ Connected":**
   - Test bằng cách tạo invoice mới → Check dashboard có auto refresh không
   - Nếu không refresh → Check console logs để debug

---

**Last Updated:** January 25, 2026  
**Status:** ✅ Frontend bugs fixed, waiting for backend SignalR Hub
