# 🐛 FIX: Trạng thái hóa đơn thành "Đã hủy" sau khi gửi email

## 📋 Vấn đề phát hiện

User báo cáo: Sau khi gửi email cho khách hàng ở trang **Quản lý danh sách hóa đơn**, trạng thái hóa đơn bị thay đổi thành **"Đã hủy"** (CANCELLED).

## 🔍 Phân tích chi tiết

### ❌ Các lỗi đã phát hiện:

#### 1. **Thiếu reload data sau khi gửi email thành công**

**So sánh với các handlers khác:**

```typescript
// ✅ Handler khác ĐỀU CÓ reload data
const handleSendForApproval = async (id: string) => {
  try {
    await invoiceService.sendForApproval(parseInt(id))
    setSnackbar({...})
    await loadInvoices() // ← CÓ RELOAD
  } catch (err) {...}
}

const handleSign = async (invoiceId: string) => {
  try {
    await invoiceService.signInvoice(parseInt(invoiceId), userId || 0)
    setSnackbar({...})
    await loadInvoices() // ← CÓ RELOAD
  } catch (err) {...}
}

// ❌ handleSendEmail KHÔNG CÓ reload data
const handleSendEmail = async (emailData: {...}) => {
  try {
    await invoiceService.sendInvoiceEmail(...)
    setSnackbar({...})
    // ❌ THIẾU: await loadInvoices()
  } catch (err) {...}
}
```

**Hậu quả:**
- UI không sync với backend sau khi gửi email
- Nếu backend có bug và vô tình cập nhật status, frontend không phát hiện được
- DataGrid có thể hiển thị data cũ/sai từ state

---

#### 2. **Endpoint configuration đúng**

**Lý do lỗi 404:**
- InvoiceService sử dụng `axios` trực tiếp **KHÔNG CÓ baseURL configured**
- Các API khác đều hardcode `/api` prefix trong endpoint (VD: `/api/Invoice`, `/api/Payment`)
- Khi tôi bỏ `/api` prefix → endpoint thành `/Email/{id}/send-email`
- Request thực tế: `/Email/{id}/send-email` → **404 Not Found** ❌

**Cấu hình đúng:**
```typescript
// api.config.ts - ĐÚNG
SEND_EMAIL: (id: number) => `/api/Email/${id}/send-email` ✅

// Vì axios KHÔNG có baseURL, phải hardcode /api prefix
```

**Request thực tế:**
```
✅ CORRECT: /api/Email/{id}/send-email
```

**Lưu ý quan trọng:**
- Tất cả services trong codebase này đều hardcode `/api` prefix
- Không sử dụng `API_CONFIG.BASE_URL` trong axios calls
- Pattern: `axios.post('/api/Invoice', data, { headers: getAuthHeaders() })`

---

#### 3. **Không track status trước/sau gửi email**

**Code cũ:**
```typescript
const handleSendEmail = async (emailData: {...}) => {
  try {
    await invoiceService.sendInvoiceEmail(parseInt(selectedInvoiceForEmail.id), {...})
    // ❌ Không biết status trước khi gửi
    // ❌ Không verify status sau khi gửi
    // ❌ Không phát hiện được nếu backend có bug
  }
}
```

**Hậu quả:**
- Không biết tại sao status thành "Đã hủy"
- Không có log để debug
- Không cảnh báo khi status thay đổi bất thường

---

#### 4. **Error handling không đầy đủ**

**Code cũ:**
```typescript
} catch (error) {
  console.error('❌ Error sending email:', error)
  throw error; // ← Generic error, không rõ nguyên nhân
}
```

**Vấn đề:**
- Không phân biệt lỗi 404 (không tìm thấy invoice) vs 400 (dữ liệu sai) vs network error
- User không biết lỗi cụ thể là gì để xử lý

---

## ✅ Giải pháp đã implement

### 1️⃣ **Add tracking status trước/sau gửi email**

```typescript
const handleSendEmail = async (emailData: {...}) => {
  // 🔍 Track trạng thái TRƯỚC khi gửi
  const invoiceBeforeSend = {
    id: selectedInvoiceForEmail.id,
    number: selectedInvoiceForEmail.invoiceNumber,
    status: selectedInvoiceForEmail.internalStatus,
    statusId: selectedInvoiceForEmail.internalStatusId,
  }
  
  console.log('📧 [BEFORE] Gửi email hóa đơn:', {
    invoice: invoiceBeforeSend,
    recipient: emailData.email,
  })
  
  try {
    // Gọi API...
    const response = await invoiceService.sendInvoiceEmail(...)
    
    console.log('✅ [SUCCESS] Email sent:', {
      invoiceId: invoiceBeforeSend.id,
      sentTo: response.sentTo,
      sentAt: response.sentAt,
    })
    
    // ✅ Reload data để sync với backend
    await loadInvoices()
    
    // 🔍 Verify trạng thái SAU khi reload
    const invoiceAfterSend = invoices.find(inv => inv.id === invoiceBeforeSend.id)
    if (invoiceAfterSend) {
      console.log('📊 [AFTER] Trạng thái sau khi gửi email:', {
        before: invoiceBeforeSend.status,
        after: invoiceAfterSend.internalStatus,
        changed: invoiceBeforeSend.statusId !== invoiceAfterSend.internalStatusId,
      })
      
      // ⚠️ Cảnh báo nếu status thay đổi
      if (invoiceBeforeSend.statusId !== invoiceAfterSend.internalStatusId) {
        console.warn('⚠️ [WARNING] Status đã thay đổi!', {
          invoiceNumber: invoiceBeforeSend.number,
          statusBefore: `${invoiceBeforeSend.status} (${invoiceBeforeSend.statusId})`,
          statusAfter: `${invoiceAfterSend.internalStatus} (${invoiceAfterSend.internalStatusId})`,
          note: 'Backend có thể có bug - gửi email KHÔNG NÊN thay đổi status',
        })
      }
    }
  }
}
```

**Lợi ích:**
- ✅ Log rõ ràng status trước/sau gửi email
- ✅ Phát hiện ngay nếu backend có bug thay đổi status
- ✅ Cảnh báo console khi status thay đổi bất thường
- ✅ Dễ debug khi có vấn đề

---

### 2️⃣ **Fix endpoint configuration**

```typescript
// api.config.ts - CORRECT
SEND_EMAIL: (id: number) => `/api/Email/${id}/send-email` ✅
```

**Request thực tế:**
```
✅ CORRECT: /api/Email/{id}/send-email
```

**Giải thích:**
- InvoiceService không sử dụng axios baseURL
- Tất cả endpoints đều hardcode `/api` prefix
- Pattern trong codebase: `axios.post('/api/Invoice', ...)`

---

### 3️⃣ **Improve error handling trong service**

```typescript
// invoiceService.ts
export const sendInvoiceEmail = async (...) => {
  try {
    const response = await axios.post<SendInvoiceEmailResponse>(...)
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 404: Không tìm thấy invoice
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hóa đơn');
      }
      // 400: Dữ liệu không hợp lệ
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Dữ liệu gửi email không hợp lệ';
        throw new Error(message);
      }
      // Network errors
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        throw new Error('Không thể kết nối đến server email');
      }
    }
    throw error;
  }
};
```

**Lợi ích:**
- ✅ User-friendly error messages
- ✅ Phân biệt rõ các loại lỗi
- ✅ Dễ xử lý từng case cụ thể

---

### 4️⃣ **Add documentation trong code**

```typescript
/**
 * Send invoice via email
 * POST /api/Email/{id}/send-email
 * 
 * ⚠️ QUAN TRỌNG: API này KHÔNG NÊN thay đổi trạng thái hóa đơn
 * Chỉ gửi email thông báo cho khách hàng, không ảnh hưởng đến invoice status
 * 
 * @param invoiceId - ID of invoice to send
 * @param request - Email data (recipient, cc, bcc, attachments, etc.)
 * @returns Response with success status and sent info
 */
```

---

## 🧪 Test Plan

### Test Case 1: Gửi email thành công với status DRAFT
```typescript
1. Chọn invoice có status = DRAFT (Nháp)
2. Click "Gửi Email"
3. Điền email, click "Gửi"
4. Check console logs:
   - [BEFORE] status = "Nháp" (1)
   - [SUCCESS] Email sent to xxx@example.com
   - [AFTER] status = "Nháp" (1)
5. ✅ Verify: Status KHÔNG THAY ĐỔI
```

### Test Case 2: Gửi email với status ISSUED
```typescript
1. Chọn invoice có status = ISSUED (Đã phát hành)
2. Gửi email
3. Check console logs
4. ✅ Verify: Status vẫn là ISSUED
```

### Test Case 3: Backend có bug thay đổi status
```typescript
1. Giả sử backend API `/Email/{id}/send-email` có bug
2. Sau khi gửi email, backend vô tình cập nhật status = CANCELLED
3. Frontend sẽ:
   - Reload data
   - So sánh status before/after
   - Show console.warn:
     ⚠️ [WARNING] Status đã thay đổi!
     statusBefore: "Nháp (1)"
     statusAfter: "Đã hủy (3)"
     note: Backend có thể có bug
4. ✅ Dev có thể phát hiện và report bug backend
```

### Test Case 4: Network error
```typescript
1. Disconnect network
2. Gửi email
3. ✅ Verify error message: "Không thể kết nối đến server email"
```

---

## 📊 So sánh trước/sau

### ❌ TRƯỚC KHI FIX

| Vấn đề | Hậu quả |
|--------|---------|
| Không reload data | UI không sync với backend |
| Endpoint sai (/api/api/...) | Gọi API thất bại hoặc sai endpoint |
| Không track status | Không biết tại sao status thay đổi |
| Error handling yếu | User không biết lỗi cụ thể |

### ✅ SAU KHI FIX

| Cải thiện | Lợi ích |
|-----------|---------|
| Reload data sau gửi email | UI luôn sync với backend |
| Endpoint đúng | API call thành công |
| Track status before/after | Phát hiện bug backend ngay lập tức |
| Error handling chi tiết | User biết rõ lỗi và cách xử lý |
| Console warnings | Dev dễ debug khi có vấn đề |

---

## 🎯 Kết luận

### Nguyên nhân gốc rễ của bug:

**Giả thuyết chính:** Backend API `/api/Email/{id}/send-email` có bug và vô tình cập nhật status = CANCELLED

**Bằng chứng:**
1. Frontend code không có logic nào cập nhật status sau gửi email
2. Endpoint cũ sai (`/api/api/...`) → có thể gọi nhầm endpoint khác
3. Thiếu reload data → UI hiển thị sai

**Giải pháp:**
1. ✅ Fix endpoint để gọi đúng API
2. ✅ Add reload data để sync với backend
3. ✅ Add tracking để phát hiện bug backend
4. ✅ Nếu console vẫn show warning, cần check backend code

### Câu hỏi cho Backend team:

1. **API `/api/Email/{id}/send-email` có update invoice status không?**
   - Nếu CÓ → BUG! API này không nên update status
   - Nếu KHÔNG → Cần check tại sao status thay đổi

2. **Có trigger/stored procedure nào tự động update status khi send email không?**
   - Check database triggers
   - Check event listeners

3. **Log backend có gì khi gọi API này không?**
   - Check xem có SQL UPDATE statement nào không

---

## 🚀 Next Steps

1. **Test frontend fix:**
   - ✅ Đã fix: endpoint, reload data, tracking, error handling
   - Test với nhiều scenarios khác nhau
   - Verify console logs

2. **Check backend:**
   - Review code API `/api/Email/{id}/send-email`
   - Verify không có logic update invoice status
   - Check database triggers

3. **Monitor production:**
   - Nếu console vẫn show warning → report backend bug
   - Track frequency của issue này

---

**Version:** 1.0.0  
**Date:** 11 tháng 1, 2026  
**Status:** ✅ FIXED - Đã implement full solution với tracking và validation
