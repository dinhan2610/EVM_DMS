# 🔍 DEBUG API - Vẫn thấy Mock Data

## ⚠️ Vấn đề: Vẫn thấy mock data (Nguyễn Văn An, Trần Thị Bình...)

---

## 🧪 KIỂM TRA NGAY - Paste vào Console (F12)

### **Step 1: Check Network Request**

**Mở Network Tab:**
1. F12 → Network tab
2. Filter: XHR
3. **Refresh page (F5)**
4. Tìm request **"users"** hoặc **"User/users"**

**❓ Có thấy request không?**

**Nếu CÓ request:**
```
✅ Request URL: http://159.223.64.31/api/User/users?PageNumber=1&PageSize=100
```
→ Click vào request đó → Check Response tab → Cho tôi biết response là gì

**Nếu KHÔNG có request:**
→ API không được gọi → Check console errors

---

### **Step 2: Check Console Errors**

F12 → Console tab

**Paste command này:**
```javascript
console.clear()
console.log('=== CHECK API ===')
console.log('1. Token:', localStorage.getItem('eims_access_token') ? 'YES ✅' : 'NO ❌')
console.log('2. Service exists:', typeof window.userService)

// Try import service
import('/src/services/userService.ts').then(module => {
  console.log('3. Service loaded:', module.default ? 'YES ✅' : 'NO ❌')
}).catch(err => {
  console.error('4. Service error:', err.message)
})
```

**Cho tôi biết output!**

---

### **Step 3: Manual Test API**

**Paste vào Console:**
```javascript
// Test API trực tiếp
const token = localStorage.getItem('eims_access_token')

fetch('http://159.223.64.31/api/User/users?PageNumber=1&PageSize=100', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'accept': '*/*'
  }
})
.then(res => {
  console.log('Status:', res.status)
  return res.json()
})
.then(data => {
  console.log('Response:', data)
  console.log('Number of users:', data.items?.length || 0)
})
.catch(err => {
  console.error('Error:', err)
})
```

**Kết quả:**
- ✅ Status 200 → API working
- ❌ Status 401 → Token invalid (cần login lại)
- ❌ Network Error → API server down

---

## 🔧 QUICK FIXES

### Fix 1: Hard Reload Browser
```
Ctrl + Shift + R (hoặc Cmd + Shift + R)
```

### Fix 2: Clear Browser Cache
```
Ctrl + Shift + Delete
→ Clear all
→ Hard reload
```

### Fix 3: Check if logged in
```javascript
// Console
localStorage.getItem('eims_access_token')
```

Nếu `null` → Go to `/auth/sign-in` và login lại

### Fix 4: Restart Server
```bash
# Terminal
lsof -ti:5173 | xargs kill -9
npx vite --host
```

---

## 📸 Cần bạn gửi cho tôi:

### 1. **Screenshot Network Tab**
- F12 → Network
- Filter: XHR
- Refresh page
- Screenshot danh sách requests

### 2. **Console Output**
- Paste 3 commands trên
- Screenshot kết quả

### 3. **Response Data**
- Nếu có request "users"
- Click vào → Response tab
- Screenshot

---

## 🎯 Diagnostic Script

**Paste tất cả đoạn này vào Console:**

```javascript
(async function diagnose() {
  console.clear()
  console.log('🔍 DIAGNOSTIC REPORT')
  console.log('===================\n')
  
  // 1. Token
  const token = localStorage.getItem('eims_access_token')
  console.log('1️⃣ Token:', token ? '✅ Present' : '❌ Missing')
  if (token) console.log('   First 50 chars:', token.substring(0, 50) + '...')
  
  // 2. API Test
  console.log('\n2️⃣ Testing API...')
  try {
    const res = await fetch('http://159.223.64.31/api/User/users?PageNumber=1&PageSize=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      }
    })
    
    console.log('   Status:', res.status, res.statusText)
    
    if (res.ok) {
      const data = await res.json()
      console.log('   ✅ API Working!')
      console.log('   Users count:', data.items?.length || 0)
      console.log('   First user:', data.items?.[0])
    } else {
      console.log('   ❌ API Error:', res.status)
      const text = await res.text()
      console.log('   Response:', text)
    }
  } catch (err) {
    console.log('   ❌ Network Error:', err.message)
  }
  
  // 3. Check imports
  console.log('\n3️⃣ Checking imports...')
  try {
    const service = await import('/src/services/userService.ts')
    console.log('   ✅ userService imported')
    console.log('   Methods:', Object.keys(service.default))
  } catch (err) {
    console.log('   ❌ Import error:', err.message)
  }
  
  console.log('\n===================')
  console.log('✅ Diagnostic complete!')
  console.log('\nPlease screenshot this and send to me.')
})()
```

---

## 🤔 Possible Issues

### Issue A: Browser Cache
**Symptoms:** Vẫn thấy mock data sau khi refactor

**Fix:**
- Hard reload: Ctrl+Shift+R
- Or Incognito mode

### Issue B: Token Missing
**Symptoms:** API không gọi hoặc 401

**Fix:**
- Login lại tại `/auth/sign-in`

### Issue C: Server chưa restart
**Symptoms:** Code cũ vẫn chạy

**Fix:**
```bash
lsof -ti:5173 | xargs kill -9
npx vite --host
```

### Issue D: API Error
**Symptoms:** Request có nhưng response error

**Fix:**
- Check API server running
- Check token valid
- Check network connection

---

## 🚨 TẠM THỜI: Force Clear Cache

**Trong Console:**
```javascript
// Clear all
localStorage.clear()
sessionStorage.clear()

// Reload
location.reload(true)
```

**Warning:** Sẽ logout và mất token!

---

**BÂY GIỜ: Chạy diagnostic script và gửi screenshot cho tôi!**

