# Backend Review: Accountant Dashboard API

## 📋 API Endpoint
```
GET /api/Dashboard/accountant
Authorization: Bearer {token}
```

## ✅ Đánh giá tổng thể: **API hoạt động tốt, cần sửa vài điểm nhỏ**

---

## 🔧 Các vấn đề cần sửa

### 1. ⚠️ `currentUser.userName` trả về `null`

**Hiện tại:**
```json
"currentUser": {
  "userId": 2,
  "userName": null,  // ❌ Null
  "fullName": "Accountant User",
  "role": "Accountant",
  "email": "accountant@eims.local"
}
```

**Đề xuất sửa:**
```json
"currentUser": {
  "userId": 2,
  "userName": "accountant",  // ✅ Trả về username thật
  "fullName": "Accountant User",
  "role": "Accountant",
  "email": "accountant@eims.local"
}
```

**Lý do:** Frontend cần `userName` để hiển thị, hiện tại phải fallback sang `fullName`

---

### 2. ⚠️ `invoiceNumber` format không nhất quán

**Hiện tại:**
```json
// Trường hợp 1: Chưa có số
"invoiceNumber": "N/A"

// Trường hợp 2: Bản nháp  
"invoiceNumber": "Draft"

// Trường hợp 3: Có số thật
"invoiceNumber": "49"
```

**Đề xuất sửa:**
```json
// Trường hợp 1 & 2: Chưa có số → null
"invoiceNumber": null

// Trường hợp 3: Có số thật
"invoiceNumber": "49"
```

**Lý do:** 
- Frontend dễ check `if (invoiceNumber)` thay vì check nhiều string
- Tránh nhầm lẫn "N/A" hoặc "Draft" là số hóa đơn thật
- Consistent với các API khác

---

### 3. ⚠️ `reason` trả về empty string thay vì `null`

**Hiện tại:**
```json
{
  "invoiceId": 118,
  "reason": ""  // ❌ Empty string
}
```

**Đề xuất sửa:**
```json
{
  "invoiceId": 118,
  "reason": null  // ✅ Null khi không có
}
```

**Lý do:** 
- Empty string `""` và `null` có ý nghĩa khác nhau
- `null` = không có lý do
- `""` = có nhập nhưng để trống (?)
- Frontend dễ check `if (reason)` hơn

---

### 4. ⚠️ `taskQueue` thiếu `invoiceType` để phân biệt loại hóa đơn

**Hiện tại:**
```json
{
  "invoiceId": 78,
  "taskType": "Rejected",
  // Không biết đây là HĐ gốc hay điều chỉnh
}
```

**Đề xuất bổ sung:**
```json
{
  "invoiceId": 78,
  "taskType": "Rejected",
  "invoiceType": 1,        // ✅ 1=Gốc, 2=Điều chỉnh, 3=Thay thế
  "invoiceTypeName": "Gốc" // ✅ Tên loại HĐ
}
```

**Lý do:** Kế toán cần biết loại hóa đơn để xử lý đúng cách

---

## 💡 Đề xuất cải tiến (Optional)

### 5. Thêm `totalCount` cho danh sách

```json
{
  "taskQueue": [...],
  "taskQueueTotal": 9,      // ✅ Tổng số tasks
  "recentInvoices": [...],
  "recentInvoicesTotal": 50 // ✅ Tổng số (để pagination sau này)
}
```

### 6. Thêm KPIs bổ sung

```json
"kpis": {
  "rejectedCount": 2,
  "draftsCount": 7,
  "sentToday": 0,
  "customersToCall": 0,
  "pendingApproval": 5,     // ✅ NEW: Số HĐ chờ duyệt
  "urgentTasks": 2,         // ✅ NEW: Tasks > 24h chưa xử lý
  "averageProcessTime": 2.5 // ✅ NEW: Thời gian xử lý TB (giờ)
}
```

### 7. Thêm `daysOld` cho taskQueue drafts

```json
{
  "invoiceId": 79,
  "taskType": "Old Draft",
  "taskDate": "2025-12-28T15:13:03.6418Z",
  "daysOld": 21  // ✅ NEW: Số ngày từ khi tạo (frontend đang tính từ taskDate)
}
```

---

## 📊 Status Mapping Reference

Frontend đang map các status như sau:

| API Status | Frontend Display | Color |
|------------|------------------|-------|
| `Draft` | Bản nháp | Default |
| `Pending Approval` | Chờ duyệt | Warning |
| `Pending Sign` | Chờ ký | Warning |
| `Signed` | Đã ký | Success |
| `Issued` | Đã phát hành | Success |
| `Rejected` | Bị từ chối | Error |
| `AdjustmentInProcess` | Đang điều chỉnh | Info |

**Đề xuất:** Backend có thể trả thêm `statusColor` nếu muốn control từ BE

---

## ✅ Các điểm tốt của API hiện tại

1. ✅ Cấu trúc response rõ ràng, đầy đủ
2. ✅ KPIs chính xác và hữu ích
3. ✅ TaskQueue được sắp xếp theo priority (High → Medium)
4. ✅ RecentInvoices được sắp xếp theo thời gian mới nhất
5. ✅ Có `generatedAt` để biết thời gian cập nhật
6. ✅ `priority` và `taskType` giúp phân loại công việc

---

## 📝 Tóm tắt công việc Backend

| STT | Công việc | Mức độ | Trạng thái |
|-----|-----------|--------|------------|
| 1 | Fix `userName` null → trả giá trị thật | 🔴 Quan trọng | ⏳ Chờ fix |
| 2 | Fix `invoiceNumber` "N/A"/"Draft" → null | 🟡 Nên làm | ⏳ Chờ fix |
| 3 | Fix `reason` "" → null | 🟢 Optional | ⏳ Chờ fix |
| 4 | Thêm `invoiceType` cho taskQueue | 🟡 Nên làm | ⏳ Chờ fix |
| 5 | Thêm `totalCount` | 🟢 Optional | ⏳ Chờ làm |
| 6 | Thêm KPIs bổ sung | 🟢 Optional | ⏳ Chờ làm |
| 7 | Thêm `daysOld` | 🟢 Optional | ⏳ Chờ làm |

---

## 📅 Ngày tạo: 19/01/2026
## 👤 Người tạo: Frontend Team
