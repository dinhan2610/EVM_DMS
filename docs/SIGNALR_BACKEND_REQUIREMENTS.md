# SignalR Backend Requirements

## 📋 Tổng quan

Frontend đã hoàn tất tích hợp SignalR realtime cho **13 pages/components**. Document này mô tả chi tiết yêu cầu backend cần implement để hệ thống hoạt động.

---

## 🔌 Hub Endpoint

### URL
```
/hubs/notifications
```

**Full URLs:**
- Development: `https://your-dev-api.com/hubs/notifications`
- Production: `https://eims.site/hubs/notifications`

### Authentication
Hub **PHẢI** support JWT Bearer token authentication:

```csharp
services.AddSignalR();

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<NotificationHub>("/hubs/notifications")
   .RequireAuthorization(); // ✅ REQUIRED
```

Frontend tự động gửi JWT token via `accessTokenFactory`:
```typescript
accessTokenFactory: () => localStorage.getItem('eims_access_token') || ''
```

---

## 📡 Events

Backend cần implement **3 events** với payload structure chính xác như sau:

### 1️⃣ InvoiceChanged Event

**Khi nào gửi:**
- Tạo mới invoice (status = Draft)
- Update invoice (bất kỳ field nào)
- Thay đổi status (Draft → Pending → Signed → Issued)
- Xóa invoice
- Điều chỉnh/thay thế invoice

**Payload Structure:**
```csharp
public class InvoiceChangedPayload
{
    public int InvoiceId { get; set; }
    
    // "Created" | "Updated" | "Deleted" | "StatusChanged"
    public string ChangeType { get; set; }
    
    public int? StatusId { get; set; } // Nullable - chỉ có khi ChangeType = "StatusChanged"
    public int? CustomerId { get; set; } // Nullable
    
    // Roles được phép nhận event này
    public List<string> Roles { get; set; }
    
    // ISO 8601 format
    public string OccurredAt { get; set; }
}
```

**Example Usage:**
```csharp
// Khi invoice thay đổi status
await Clients.All.SendAsync("InvoiceChanged", new InvoiceChangedPayload
{
    InvoiceId = 123,
    ChangeType = "StatusChanged",
    StatusId = 6, // ISSUED
    CustomerId = 456,
    Roles = new List<string> { "Admin", "HOD", "Accountant", "Sales" },
    OccurredAt = DateTime.UtcNow.ToString("o")
});

// Khi tạo invoice mới
await Clients.All.SendAsync("InvoiceChanged", new InvoiceChangedPayload
{
    InvoiceId = 124,
    ChangeType = "Created",
    StatusId = 1, // Draft
    CustomerId = 789,
    Roles = new List<string> { "Admin", "HOD", "Accountant" },
    OccurredAt = DateTime.UtcNow.ToString("o")
});
```

**Frontend Coverage:**
- ✅ InvoiceManagement (reload toàn bộ list)
- ✅ SaleInvoiceManagement (reload list)
- ✅ InvoiceRequestManagement (reload requests)
- ✅ InvoiceDetail (reload nếu đúng invoiceId)
- ✅ HODInvoiceManagement (reload list)
- ✅ StatementManagement (reload statements vì invoice ảnh hưởng)
- ✅ DebtManagement (reload debt nếu có customer đang xem)
- ✅ All Dashboard pages (reload KPIs)

---

### 2️⃣ DashboardChanged Event

**Khi nào gửi:**
- Có thay đổi lớn cần refresh dashboard (nhiều invoices cùng lúc)
- Batch operations (approve nhiều invoices, bulk delete)
- Periodic refresh trigger (optional)

**Payload Structure:**
```csharp
public class DashboardChangedPayload
{
    // "Invoices" | "Users"
    public string Scope { get; set; }
    
    // Tự do định nghĩa: "BulkApproval", "DailyRefresh", "InvoiceStatusChanged"
    public string ChangeType { get; set; }
    
    public int? EntityId { get; set; } // Nullable - ID của entity liên quan
    
    // Roles được phép nhận event
    public List<string> Roles { get; set; }
    
    public string OccurredAt { get; set; }
}
```

**Example Usage:**
```csharp
// Bulk approve invoices
await Clients.All.SendAsync("DashboardChanged", new DashboardChangedPayload
{
    Scope = "Invoices",
    ChangeType = "BulkApproval",
    EntityId = null,
    Roles = new List<string> { "Admin", "HOD", "Accountant", "Sales" },
    OccurredAt = DateTime.UtcNow.ToString("o")
});

// User management changes (chỉ Admin nhận)
await Clients.All.SendAsync("DashboardChanged", new DashboardChangedPayload
{
    Scope = "Users",
    ChangeType = "UserActivated",
    EntityId = 42,
    Roles = new List<string> { "Admin" },
    OccurredAt = DateTime.UtcNow.ToString("o")
});
```

**Frontend Coverage:**
- ✅ AdminDashboard (scope = Invoices hoặc Users)
- ✅ HODDashboard (scope = Invoices only)
- ✅ StaffDashboard (scope = Invoices only)
- ✅ SaleDashboard (scope = Invoices only)

---

### 3️⃣ UserChanged Event

**Khi nào gửi:**
- Tạo mới user
- Update user info (name, email, role)
- Kích hoạt/vô hiệu hóa user
- Xóa user
- Thay đổi role

**Payload Structure:**
```csharp
public class UserChangedPayload
{
    public int UserId { get; set; }
    
    // "Created" | "Updated" | "Deleted" | "Activated" | "Deactivated"
    public string ChangeType { get; set; }
    
    public string RoleName { get; set; } // "Admin", "HOD", "Accountant", "Sales"
    public bool IsActive { get; set; }
    
    // Chỉ Admin nhận event này
    public List<string> Roles { get; set; }
    
    public string OccurredAt { get; set; }
}
```

**Example Usage:**
```csharp
// User deactivated
await Clients.All.SendAsync("UserChanged", new UserChangedPayload
{
    UserId = 789,
    ChangeType = "Deactivated",
    RoleName = "Accountant",
    IsActive = false,
    Roles = new List<string> { "Admin" }, // ⚠️ CHỈ ADMIN
    OccurredAt = DateTime.UtcNow.ToString("o")
});
```

**Frontend Coverage:**
- ✅ AdminDashboard (chỉ Admin nhận)

---

## 🎯 Role-based Filtering

### Backend Strategy

**Option 1: Broadcast All (Recommended)**
```csharp
// Backend gửi cho tất cả connections, frontend tự filter theo role
await Clients.All.SendAsync("InvoiceChanged", payload);
```
✅ **Pros:** Đơn giản, ít lỗi  
❌ **Cons:** Bandwidth hơi nhiều (nhưng payload nhỏ nên ok)

**Option 2: Group-based (Advanced)**
```csharp
// Khi user connect, add vào group theo role
public override async Task OnConnectedAsync()
{
    var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
    
    if (!string.IsNullOrEmpty(role))
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, role);
    }
    
    await base.OnConnectedAsync();
}

// Gửi event chỉ cho group cụ thể
await Clients.Group("Admin").SendAsync("UserChanged", payload);
await Clients.Groups("Admin", "HOD", "Accountant").SendAsync("InvoiceChanged", payload);
```
✅ **Pros:** Tiết kiệm bandwidth  
❌ **Cons:** Phức tạp hơn, dễ miss roles

### Frontend Filtering

Frontend **đã implement** role-based filtering:
```typescript
useSignalR({
  onInvoiceChanged: (payload) => {
    // Chỉ refresh nếu role hiện tại có trong payload.roles
    if (payload.roles.includes(USER_ROLES.ACCOUNTANT)) {
      fetchData()
    }
  }
})
```

**Roles Frontend Sử Dụng:**
```typescript
export const USER_ROLES = {
  ADMIN: 'Admin',
  HOD: 'HOD',
  ACCOUNTANT: 'Accountant',
  SALES: 'Sales',
}
```

---

## 🔄 Reconnection Handling

### Frontend Behavior

Frontend tự động reconnect với exponential backoff:
- **Attempt 1:** 0 giây (immediate)
- **Attempt 2:** 2 giây
- **Attempt 3:** 10 giây
- **Attempt 4:** 30 giây
- **Attempt 5+:** 60 giây (max)

**Manual reconnect:** Nếu auto reconnect fail 10 lần → retry sau 5 giây

### Backend Requirements

Hub **KHÔNG CẦN** làm gì đặc biệt. ASP.NET Core SignalR tự động handle:
- Connection lifecycle
- Reconnection attempts
- Token refresh (nếu JWT còn valid)

**Chỉ cần đảm bảo:**
```csharp
services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // Development only
    options.KeepAliveInterval = TimeSpan.FromSeconds(15); // Ping every 15s
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30); // Disconnect after 30s no response
});
```

---

## 🧪 Testing Guide

### Step 1: Enable SignalR Hub

```csharp
// Program.cs or Startup.cs
builder.Services.AddSignalR();

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<NotificationHub>("/hubs/notifications")
   .RequireAuthorization();
```

### Step 2: Create NotificationHub Class

```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"✅ SignalR Connected: User {userId}, ConnectionId: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"❌ SignalR Disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }
}
```

### Step 3: Inject IHubContext Vào Service

```csharp
public class InvoiceService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public InvoiceService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task UpdateInvoiceStatus(int invoiceId, int newStatusId)
    {
        // ... update database logic ...

        // Send SignalR event
        await _hubContext.Clients.All.SendAsync("InvoiceChanged", new
        {
            invoiceId = invoiceId,
            changeType = "StatusChanged",
            statusId = newStatusId,
            customerId = invoice.CustomerId,
            roles = new[] { "Admin", "HOD", "Accountant" },
            occurredAt = DateTime.UtcNow.ToString("o")
        });
    }
}
```

### Step 4: Manual Testing

**Test 1: Connection Test**
1. Login frontend với JWT token
2. Mở browser console (F12)
3. Kiểm tra logs:
   ```
   🔄 [SignalR] Initializing connection to: https://api.com/hubs/notifications
   ✅ [SignalR] Connected successfully!
   📨 [SignalR] Subscribed to InvoiceChanged event
   ```

**Test 2: Event Test**
1. Mở 2 browser windows:
   - Window 1: Login as **Accountant**
   - Window 2: Login as **Admin**

2. Window 1: Tạo invoice mới
3. Window 2: Dashboard should auto-refresh
4. Check console:
   ```
   📨 [AdminDashboard] InvoiceChanged event: {invoiceId: 123, changeType: "Created", ...}
   🔄 [AdminDashboard] Refreshing dashboard data...
   ✅ [AdminDashboard] Data loaded successfully
   ```

**Test 3: Reconnection Test**
1. Login frontend
2. Browser DevTools → Network → Throttling → Offline
3. Wait 5 seconds
4. Network → Online
5. Console should show:
   ```
   🔄 [SignalR] Reconnecting... (Attempt 1)
   ✅ [SignalR] Reconnected successfully!
   🔄 [Component] SignalR reconnected, resyncing data...
   ```

---

## 🐛 Troubleshooting

### Issue 1: Frontend Cannot Connect

**Symptoms:**
```
❌ [SignalR] Failed to initialize: Error: Failed to complete negotiation
```

**Solutions:**
1. Kiểm tra CORS configuration:
   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("AllowFrontend", policy =>
       {
           policy.WithOrigins("https://eims.site", "http://localhost:5173")
                 .AllowAnyHeader()
                 .AllowAnyMethod()
                 .AllowCredentials(); // ✅ REQUIRED for SignalR
       });
   });
   
   app.UseCors("AllowFrontend");
   ```

2. Verify Hub endpoint:
   ```bash
   curl -X POST https://your-api.com/hubs/notifications/negotiate \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Issue 2: JWT Authentication Failed

**Symptoms:**
```
⚠️ [SignalR] No access token found!
❌ [SignalR] Failed to initialize: Status code '401'
```

**Solutions:**
1. Check JWT configuration:
   ```csharp
   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddJwtBearer(options =>
       {
           // ✅ REQUIRED for SignalR
           options.Events = new JwtBearerEvents
           {
               OnMessageReceived = context =>
               {
                   var accessToken = context.Request.Query["access_token"];
                   var path = context.HttpContext.Request.Path;
                   
                   if (!string.IsNullOrEmpty(accessToken) && 
                       path.StartsWithSegments("/hubs/notifications"))
                   {
                       context.Token = accessToken;
                   }
                   return Task.CompletedTask;
               }
           };
       });
   ```

### Issue 3: Events Not Received

**Symptoms:**
- Frontend connected successfully
- Console shows: `✅ [SignalR] Connected successfully!`
- Nhưng không thấy event logs khi có thay đổi

**Solutions:**
1. Verify backend đang gửi event:
   ```csharp
   Console.WriteLine($"📨 Sending InvoiceChanged event: {JsonSerializer.Serialize(payload)}");
   await _hubContext.Clients.All.SendAsync("InvoiceChanged", payload);
   ```

2. Check event name chính xác (case-sensitive):
   - ✅ `"InvoiceChanged"` (correct)
   - ❌ `"invoiceChanged"` (wrong)
   - ❌ `"InvoiceChange"` (wrong)

3. Verify payload structure matches frontend types

---

## 📊 Performance Considerations

### Event Frequency

**InvoiceChanged:**
- **Expected:** 10-50 events/phút (normal business)
- **Peak:** 100-200 events/phút (busy hours)
- **Impact:** LOW (payload ~200 bytes)

**DashboardChanged:**
- **Expected:** 1-5 events/phút
- **Impact:** MEDIUM (trigger multiple API calls)

**UserChanged:**
- **Expected:** 1-10 events/ngày
- **Impact:** LOW (chỉ Admin nhận)

### Optimization Tips

1. **Debounce Bulk Operations:**
   ```csharp
   // ❌ BAD: Gửi 100 events khi bulk approve
   foreach (var invoice in invoices)
   {
       await SendInvoiceChangedEvent(invoice.Id);
   }
   
   // ✅ GOOD: Gửi 1 event DashboardChanged
   await _hubContext.Clients.All.SendAsync("DashboardChanged", new {
       scope = "Invoices",
       changeType = "BulkApproval",
       roles = new[] { "Admin", "HOD", "Accountant" }
   });
   ```

2. **Avoid Sensitive Data:**
   - ❌ Không gửi invoice amount, customer name trong payload
   - ✅ Chỉ gửi IDs, frontend sẽ gọi API để lấy details

3. **Use Connection Pooling:**
   ```csharp
   services.AddSignalR()
       .AddAzureSignalR(); // Optional: scale-out với Azure SignalR Service
   ```

---

## ✅ Checklist cho Backend Team

- [ ] Tạo `NotificationHub` class kế thừa `Hub`
- [ ] Enable JWT authentication cho Hub endpoint
- [ ] Configure CORS với `AllowCredentials = true`
- [ ] Implement 3 events với đúng payload structure:
  - [ ] InvoiceChanged
  - [ ] DashboardChanged
  - [ ] UserChanged
- [ ] Inject `IHubContext<NotificationHub>` vào các services cần thiết
- [ ] Test connection với frontend (check console logs)
- [ ] Test event delivery (tạo invoice → dashboard auto refresh)
- [ ] Test reconnection (offline → online)
- [ ] Deploy to staging environment
- [ ] Performance testing (load 100+ events/minute)

---

## 📞 Support

**Frontend Implementation:**
- File: `src/services/signalrService.ts`
- Hook: `src/hooks/useSignalR.ts`
- Coverage: 13 pages/components

**Questions?**
- Check browser console logs (F12) for detailed SignalR messages
- Backend logs should show connection/disconnection events
- Use browser DevTools → Network → WS tab to inspect WebSocket traffic

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Status:** ✅ Frontend Implementation Complete - Waiting for Backend
