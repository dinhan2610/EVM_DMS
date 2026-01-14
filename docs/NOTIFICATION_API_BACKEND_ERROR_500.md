# 🚨 NOTIFICATION API BACKEND ERROR 500

**Ngày:** 14/01/2026  
**Vấn đề:** Backend trả về 500 Internal Server Error cho Notification API  
**Status:** ⚠️ Backend Issue (Cần team BE fix)

---

## 📋 ERROR DETAILS

### **Endpoint bị lỗi:**
1. `GET /api/Notification?pageIndex=1&pageSize=5` → 500 Error
2. `GET /api/Notification/unread-count` → 500 Error

### **Backend Response:**
```json
{
  "title": "An internal server error occurred.",
  "status": 500,
  "detail": "Value cannot be null. (Parameter 's')"
}
```

### **Error Message:**
```
Value cannot be null. (Parameter 's')
```

**Phân tích:** Backend đang expect parameter `s` (có thể là search string) nhưng nhận được `null`

---

## 🔍 ROOT CAUSE ANALYSIS

### **1. Frontend Request (Correct)**
```
GET http://159.223.64.31/api/Notification/unread-count
Headers:
  Authorization: Bearer <valid_token>
  accept: */*
```

### **2. Backend Error**
```csharp
// Backend C# code (giả định)
public IActionResult GetUnreadCount(string s)  // ❌ Required parameter 's'
{
    if (s == null)  // ❌ Throws ArgumentNullException
        throw new ArgumentNullException(nameof(s));
}
```

**Vấn đề:** Backend controller đang expect parameter mà frontend không gửi

---

## 🔬 DEBUGGING STEPS

### **1. Test với curl (Không token)**
```bash
curl -X GET "http://159.223.64.31/api/Notification/unread-count" \
  -H "accept: */*"

Response: 401 Unauthorized (Expected - no token)
```

### **2. Test với curl (Có token nhưng invalid)**
```bash
curl -X GET "http://159.223.64.31/api/Notification/unread-count" \
  -H "accept: */*" \
  -H "Authorization: Bearer fake_token"

Response: 401 Unauthorized (Expected - invalid token)
```

### **3. Test với curl (Token hợp lệ)**
```bash
curl -X GET "http://159.223.64.31/api/Notification/unread-count" \
  -H "accept: */*" \
  -H "Authorization: Bearer <real_token>"

Response: 500 Internal Server Error
Detail: "Value cannot be null. (Parameter 's')"
```

**Kết luận:** Backend có bug internal, không phải lỗi frontend

---

## 💡 POSSIBLE BACKEND ISSUES

### **Theory 1: Missing Query Parameter**
Backend expect:
```
GET /api/Notification/unread-count?s=<something>
```

Frontend gửi:
```
GET /api/Notification/unread-count
```

**Fix Backend:** Make parameter `s` optional hoặc remove nó

---

### **Theory 2: User ID Extraction Failed**
```csharp
// Backend code
var userId = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
if (string.IsNullOrEmpty(userId))  // ❌ userId is null
    throw new ArgumentNullException("s");  // Wrong parameter name in error
```

**Fix Backend:** Properly extract userId from JWT token

---

### **Theory 3: Database Connection String Null**
```csharp
var connectionString = _configuration.GetConnectionString("DefaultConnection");
// connectionString is null → throws error
```

**Fix Backend:** Check database configuration

---

## ✅ FRONTEND STATUS

### **Frontend đã làm đúng:**
- ✅ Gửi token trong Authorization header
- ✅ Sử dụng đúng endpoint `/api/Notification/unread-count`
- ✅ Không có required query parameters
- ✅ Request format đúng chuẩn REST API

### **Frontend logging added:**
```typescript
console.log('[Notification] Fetching unread count')
console.log('[Notification] Token:', token.substring(0, 50) + '...')
console.error('[Notification] Failed:', {
  error: error.message,
  status: error.response?.status,
  data: error.response?.data,
})
```

---

## 🎯 BACKEND TEAM ACTION ITEMS

### **1. Check Controller Method Signature**
```csharp
// Current (có thể sai):
[HttpGet("unread-count")]
public IActionResult GetUnreadCount(string s)  // ❌ Parameter 's' từ đâu ra?

// Should be:
[HttpGet("unread-count")]
public IActionResult GetUnreadCount()  // ✅ No parameters
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized();
    
    var count = _notificationService.GetUnreadCount(userId);
    return Ok(new { unreadCount = count });
}
```

### **2. Check JWT Token Claims**
```csharp
// Verify token contains userId claim
var userId = User.FindFirst("userId")?.Value 
           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           
Console.WriteLine($"Extracted userId: {userId}");  // Debug log
```

### **3. Check Database Connection**
```csharp
// Verify connection string is not null
var connectionString = _configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
    throw new InvalidOperationException("Database connection string is null");
```

### **4. Check Notification Table/Service**
```sql
-- Verify table exists
SELECT * FROM Notifications WHERE UserID = @userId AND IsRead = 0;

-- Check if UserID column exists
SELECT COUNT(*) FROM Notifications;
```

---

## 🔧 TEMPORARY FRONTEND WORKAROUND

Frontend đã implement graceful error handling:

```typescript
async getUnreadCount(): Promise<number> {
  try {
    const response = await httpClient.get('/Notification/unread-count')
    return response.data.unreadCount
  } catch (error) {
    console.error('[Notification] Backend error 500, returning 0')
    return 0  // ✅ Graceful fallback
  }
}
```

**Result:** UI vẫn hoạt động, chỉ không hiển thị badge count

---

## 📊 COMPARISON: SWAGGER vs FRONTEND

### **Swagger Request:**
```
GET http://159.223.64.31/api/Notification/unread-count
Authorization: Bearer <swagger_token>

Response: 500 Internal Server Error
```

### **Frontend Request:**
```
GET http://localhost:5173/api/Notification/unread-count
(proxied to http://159.223.64.31/api/Notification/unread-count)
Authorization: Bearer <frontend_token>

Response: 500 Internal Server Error
```

**Cả 2 đều lỗi 500 → Xác nhận đây là backend issue**

---

## 🎯 NEXT STEPS

### **For Backend Team:**
1. ✅ Check backend logs for full stack trace
2. ✅ Identify which parameter `s` is null
3. ✅ Fix controller method signature
4. ✅ Verify JWT token claims extraction
5. ✅ Test with Postman/Swagger after fix
6. ✅ Deploy fix to dev environment

### **For Frontend Team:**
1. ✅ Frontend code đã hoàn chỉnh (graceful error handling)
2. ⏳ Wait for backend fix
3. ⏳ Test lại sau khi backend deploy
4. ⏳ Remove workaround if needed

---

## 📝 BACKEND FIX VERIFICATION

### **After backend fix, verify:**

1. **Test với curl:**
```bash
curl -X GET "http://159.223.64.31/api/Notification/unread-count" \
  -H "Authorization: Bearer <token>"

Expected: 
{
  "unreadCount": 5
}
```

2. **Check Frontend Console:**
```
✅ [Notification] Fetching unread count
✅ [Notification] Unread count: 5
```

3. **Check UI:**
```
✅ Badge hiển thị số "5"
✅ Dropdown có 5 notifications chưa đọc
```

---

## 🚨 CRITICAL NOTE

**Backend API `/api/Notification/unread-count` is BROKEN and needs immediate fix!**

Error: `Value cannot be null. (Parameter 's')`

**Frontend cannot proceed until backend fixes this issue.**

---

**Last Updated:** 14/01/2026 - Version 1.0  
**Status:** ⚠️ Waiting for Backend Team
