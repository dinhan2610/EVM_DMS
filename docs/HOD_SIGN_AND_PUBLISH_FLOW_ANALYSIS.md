# Phân tích Logic Ký Số và Phát Hành - Kế Toán Trưởng

## 📋 Tổng Quan

**File:** [HODInvoiceManagement.tsx](../src/components/dashboard/HODInvoiceManagement.tsx)

**Vấn đề ban đầu:** Hóa đơn không gửi lên cơ quan thuế được sau khi ký số

**Nguyên nhân:** Bước gửi CQT (`submitToTaxAuthority`) bị comment out trong luồng tự động

---

## 🔍 Vấn Đề Đã Phát Hiện

### ❌ Code Lỗi (Trước khi fix)

```typescript
// Bước 2: Gửi CQT
setSigningProgress({ step: 'submitting', message: '🏛️ Gửi lên Cơ quan Thuế...' })

// ⚠️ THIẾU DÒNG NÀY - Không gọi API submitToTaxAuthority
// const taxCode = await invoiceService.submitToTaxAuthority(invoiceIdNum)

// 🔄 Load sau khi gửi CQT
await loadInvoices()

// Bước 3: Phát hành
setSigningProgress({ step: 'issuing', message: '✅ Phát hành hóa đơn...' })
```

**Hậu quả:**
- UI hiển thị "Gửi lên Cơ quan Thuế..." nhưng không thực sự gọi API
- Bước 3 (Phát hành) chạy nhưng hóa đơn chưa có mã CQT
- Backend có thể reject hoặc trạng thái không đồng bộ

---

## ✅ Giải Pháp Đã Áp Dụng

### 1. Thêm Bước Gửi CQT Hoàn Chỉnh

```typescript
// Bước 2: Gửi CQT
setSigningProgress({ step: 'submitting', message: '🏛️ Gửi lên Cơ quan Thuế...' })

if (import.meta.env.DEV) {
  console.log(`🔵 [HOD] Submitting invoice ${invoiceIdNum} to Tax Authority...`)
}

const taxCode = await invoiceService.submitToTaxAuthority(invoiceIdNum)

if (import.meta.env.DEV) {
  console.log(`✅ [HOD] Tax submission successful. Tax Code: ${taxCode}`)
}

// 🔄 Load sau khi gửi CQT
await loadInvoices()
```

### 2. Cập Nhật Success Message

```typescript
// ✅ Hoàn tất - hiển thị snackbar với mã CQT
setSnackbar({
  open: true,
  message: `✅ Đã ký số, gửi CQT và phát hành hóa đơn ${invoiceNumber} thành công!\n🏛️ Mã CQT: ${taxCode}`,
  severity: 'success',
})
```

---

## 🔄 Luồng Hoàn Chỉnh (Sau khi fix)

### Flow Diagram

```
User nhấn "Ký số" (với autoIssueAfterSign = true)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: KÝ SỐ ĐIỆN TỬ                                       │
├─────────────────────────────────────────────────────────────┤
│ setSigningProgress({ step: 'signing', ... })               │
│ await invoiceService.signInvoice(invoiceId, userId)        │
│ await loadInvoices() // Reload để cập nhật status          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: GỬI LÊN CƠ QUAN THUẾ                               │
├─────────────────────────────────────────────────────────────┤
│ setSigningProgress({ step: 'submitting', ... })            │
│ const taxCode = await submitToTaxAuthority(invoiceId)      │
│   → POST /api/Tax/submit?invoiceId={id}                    │
│   → Response: { mccqt, soTBao, status, message }           │
│ await loadInvoices() // Reload để cập nhật trạng thái CQT  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: PHÁT HÀNH HÓA ĐƠN                                  │
├─────────────────────────────────────────────────────────────┤
│ setSigningProgress({ step: 'issuing', ... })               │
│ await invoiceService.issueInvoice(invoiceId, userId)       │
│   → Backend cấp số hóa đơn (invoiceNumber)                 │
│   → Timeout protection: 30s max                            │
│ await loadInvoices() // Reload cuối cùng                   │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ SUCCESS                                                     │
├─────────────────────────────────────────────────────────────┤
│ Snackbar: "✅ Đã ký số, gửi CQT và phát hành hóa đơn       │
│            {invoiceNumber} thành công!                     │
│            🏛️ Mã CQT: {taxCode}"                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 API Chi Tiết

### 1. Sign Invoice - Ký Số

**Endpoint:** `POST /api/Invoice/{id}/sign`

**Request:**
```http
POST /api/Invoice/72/sign
Authorization: Bearer {token}
Content-Type: application/json

{} // Empty body hoặc { "serial": "AA/26E" }
```

**Response:**
```json
{
  "invoiceID": 72,
  "invoiceStatusID": 10, // SIGNED
  "invoiceNumber": 123456, // Backend tự cấp
  "signDate": "2026-01-25T08:30:00Z"
}
```

**Chức năng:**
- Chuyển trạng thái từ 7 (Chờ ký) → 10 (Đã ký)
- Backend tự động cấp `invoiceNumber` (số hóa đơn)
- Lưu thời gian ký (`signDate`)

---

### 2. Submit to Tax Authority - Gửi CQT

**Endpoint:** `POST /api/Tax/submit?invoiceId={id}`

**Request:**
```http
POST /api/Tax/submit?invoiceId=72
Authorization: Bearer {token}

(Empty body)
```

**Response:**
```json
{
  "mtDiep": "TCT4B1FE26B304641D3B3F27A54A1C855B9",
  "mltDiep": "202",
  "soTBao": "TB/2026/609584408",
  "mccqt": "A237B12D63A0C4D9A8ED3314A345B068F2",
  "status": "1",
  "message": "CQT đã tiếp nhận hóa đơn",
  "receivedAt": "2026-01-25T08:31:52.0966529Z"
}
```

**Chức năng:**
- Gửi XML hóa đơn lên Cơ quan Thuế
- Nhận mã tra cứu (`mccqt`)
- Nhận số thông báo (`soTBao`)
- Cập nhật `taxStatusId` và `taxStatusCode`

**⚠️ Quan trọng:** API này KHÔNG thay đổi `invoiceStatusId` (internal status), chỉ cập nhật `taxStatusId` (tax authority status)

---

### 3. Issue Invoice - Phát Hành

**Endpoint:** `POST /api/Invoice/{id}/issue`

**Request:**
```http
POST /api/Invoice/72/issue
Authorization: Bearer {token}
Content-Type: application/json

{
  "issuerId": 1
}
```

**Response:**
```json
{
  "invoiceID": 72,
  "invoiceStatusID": 2, // ISSUED
  "taxAuthorityCode": "A237B12D63A0C4D9A8ED3314A345B068F2",
  "issueDate": "2026-01-25T08:32:00Z"
}
```

**Chức năng:**
- Chuyển trạng thái từ 10 (Đã ký) → 2 (Đã phát hành)
- Lưu mã CQT vào database
- Lưu thời gian phát hành (`issueDate`)
- **HOÀN TẤT** quá trình xử lý hóa đơn

---

## 🎯 Trạng Thái Hóa Đơn (Internal Status)

| ID | Tên Trạng Thái | Mô Tả | Có thể làm gì |
|----|----------------|-------|---------------|
| 1 | Draft | Nháp | Chỉnh sửa, xóa |
| 6 | Pending Approval | Chờ duyệt | KTT duyệt/từ chối |
| 7 | Pending Sign | Chờ ký | KTT ký số |
| 10 | Signed | Đã ký | KTT phát hành (sau khi gửi CQT) |
| 2 | Issued | Đã phát hành | Gửi email, in, xuất PDF |
| 3 | Cancelled | Đã hủy | Không thể thao tác |

---

## 🏛️ Trạng Thái CQT (Tax Authority Status)

| ID | Tên | Mô Tả |
|----|-----|-------|
| 1 | Accepted | CQT đã tiếp nhận |
| 2 | Processing | Đang xử lý |
| 3 | Approved | CQT đã duyệt |
| 4 | Rejected | CQT từ chối |
| 5 | Cancelled | Đã hủy |

---

## 🔐 Error Handling

### Case 1: Lỗi khi Ký Số

```typescript
catch (err) {
  // currentStep = 'signing'
  setSnackbar({
    open: true,
    message: `❌ Lỗi khi ký số: ${err.message}`,
    severity: 'error',
  })
  await loadInvoices() // Reload để cập nhật trạng thái mới nhất
}
```

**Ví dụ lỗi:**
- "Hóa đơn không ở trạng thái Chờ ký (7)"
- "Template không có serial"
- "Không tìm thấy hóa đơn"

---

### Case 2: Lỗi khi Gửi CQT

```typescript
catch (err) {
  // currentStep = 'submitting'
  setSnackbar({
    open: true,
    message: `❌ Lỗi khi gửi CQT: ${err.message}`,
    severity: 'error',
  })
  // Hóa đơn đã ký số nhưng chưa gửi CQT
  // User có thể thử gửi lại bằng nút "Gửi lại CQT"
}
```

**Ví dụ lỗi:**
- "Network error - Không kết nối được CQT"
- "XML không hợp lệ"
- "Hóa đơn đã được gửi trước đó"

**Recovery:** User có thể dùng nút "Gửi lại CQT" trong menu actions

---

### Case 3: Lỗi khi Phát Hành

```typescript
catch (err) {
  // currentStep = 'issuing'
  setSnackbar({
    open: true,
    message: `❌ Lỗi khi phát hành: ${err.message}`,
    severity: 'error',
  })
  // Hóa đơn đã ký số và đã gửi CQT, nhưng chưa phát hành
  // User có thể thử phát hành lại
}
```

**Ví dụ lỗi:**
- "Timeout 30s - Phát hành quá lâu"
- "Backend error khi cập nhật status"

**Recovery:** Hóa đơn vẫn ở trạng thái 10 (Đã ký), có thể thử phát hành lại

---

## 🧪 Testing Checklist

### ✅ Scenario 1: Happy Path - Thành công hoàn toàn

**Điều kiện:**
- Hóa đơn ở trạng thái 7 (Chờ ký)
- Backend và CQT hoạt động bình thường

**Kết quả mong đợi:**
1. Dialog hiển thị 3 bước: Ký số → Gửi CQT → Phát hành
2. Mỗi bước có progress message riêng
3. Snackbar cuối cùng hiển thị "✅ Đã ký số, gửi CQT và phát hành hóa đơn {số} thành công! 🏛️ Mã CQT: {mã}"
4. DataGrid reload và hiển thị trạng thái mới (2 - Issued, Tax Status: Accepted)
5. Console log hiển thị đầy đủ 3 bước

---

### ⚠️ Scenario 2: Lỗi ở bước Gửi CQT

**Mô phỏng:**
- Mock `submitToTaxAuthority()` throw error

**Kết quả mong đợi:**
1. Bước 1 (Ký số) hoàn thành → Status = 10 (Signed)
2. Bước 2 (Gửi CQT) thất bại → Hiển thị error "❌ Lỗi khi gửi CQT: ..."
3. Không chạy bước 3 (Phát hành)
4. DataGrid reload, hóa đơn ở trạng thái 10 (Signed)
5. User có thể dùng nút "Gửi lại CQT" để retry

---

### 🔄 Scenario 3: Gửi lại CQT

**Điều kiện:**
- Hóa đơn ở trạng thái 10 (Signed)
- Đã ký số nhưng chưa gửi CQT hoặc gửi thất bại

**Test:**
1. Click menu "⋮" → "Gửi lại CQT"
2. API `submitToTaxAuthority()` được gọi
3. Nhận được mã CQT
4. API `markIssued()` được gọi để lưu mã CQT
5. Snackbar: "✅ Đã gửi lại hóa đơn {số} thành công! Mã CQT: {mã}"
6. DataGrid reload, trạng thái = 2 (Issued)

---

## 📊 Logs Mẫu (Development Mode)

### Successful Flow

```
🔵 [HOD] Starting sign flow for invoice 72...
🔏 Ký số điện tử...
✅ [signInvoice] Invoice signed successfully

🔵 [HOD] Submitting invoice 72 to Tax Authority...
🏛️ Gửi lên Cơ quan Thuế...
[submitToTaxAuthority] ✅ Success - Invoice submitted to tax authority
[submitToTaxAuthority] Response: { mccqt: "A237B...", soTBao: "TB/2026/..." }
✅ [HOD] Tax submission successful. Tax Code: A237B12D63A0C4D9A8ED3314A345B068F2

🔵 [HOD] Starting issueInvoice for invoice 72...
✅ Phát hành hóa đơn...
✅ [HOD] issueInvoice completed successfully

📊 [HODInvoiceManagement] Loaded data: { count: 15, ... }
```

---

## 🚀 Cải Tiến Đã Thực Hiện

### Before Fix ❌

```typescript
// Bước 2: Gửi CQT
setSigningProgress({ step: 'submitting', message: '🏛️ Gửi lên Cơ quan Thuế...' })
// ⚠️ THIẾU: const taxCode = await invoiceService.submitToTaxAuthority(invoiceIdNum)
await loadInvoices()

// Snackbar không có mã CQT
setSnackbar({
  open: true,
  message: `Đã ký số và phát hành hóa đơn thành công!`,
  severity: 'success',
})
```

**Vấn đề:**
- Không gửi CQT thực tế
- Không có mã CQT trong response
- Backend/CQT không nhận được thông báo

---

### After Fix ✅

```typescript
// Bước 2: Gửi CQT
setSigningProgress({ step: 'submitting', message: '🏛️ Gửi lên Cơ quan Thuế...' })

if (import.meta.env.DEV) {
  console.log(`🔵 [HOD] Submitting invoice ${invoiceIdNum} to Tax Authority...`)
}

const taxCode = await invoiceService.submitToTaxAuthority(invoiceIdNum)

if (import.meta.env.DEV) {
  console.log(`✅ [HOD] Tax submission successful. Tax Code: ${taxCode}`)
}

await loadInvoices()

// Snackbar hiển thị mã CQT
setSnackbar({
  open: true,
  message: `✅ Đã ký số, gửi CQT và phát hành hóa đơn ${invoiceNumber} thành công!\n🏛️ Mã CQT: ${taxCode}`,
  severity: 'success',
})
```

**Cải thiện:**
- ✅ Gọi API CQT thực tế
- ✅ Lưu mã CQT vào database
- ✅ Hiển thị mã CQT cho user
- ✅ Logs chi tiết để debug
- ✅ Đồng bộ trạng thái với backend

---

## 📝 Notes

1. **Thứ tự quan trọng:** PHẢI ký số → gửi CQT → phát hành. Không được đảo thứ tự.

2. **Reload sau mỗi bước:** Đảm bảo DataGrid luôn hiển thị trạng thái mới nhất từ backend.

3. **Timeout protection:** API `issueInvoice()` có timeout 30s để tránh UI bị treo.

4. **Error recovery:** Mỗi bước có handler riêng, user có thể retry từ bước thất bại.

5. **Dev logs:** Chỉ hiển thị trong môi trường development (`import.meta.env.DEV`).

6. **Mã CQT:** Cần thiết để tra cứu hóa đơn trên hệ thống thuế điện tử.

---

## 🔗 Related Files

- [HODInvoiceManagement.tsx](../src/components/dashboard/HODInvoiceManagement.tsx) - Component chính
- [invoiceService.ts](../src/services/invoiceService.ts) - API services
- [invoiceStatus.ts](../src/constants/invoiceStatus.ts) - Status constants
- [BACKEND_HOD_DASHBOARD_REQUIREMENTS.md](./BACKEND_HOD_DASHBOARD_REQUIREMENTS.md) - Backend specs

---

**Ngày cập nhật:** 2026-01-25  
**Version:** 1.0.0  
**Tác giả:** Development Team
