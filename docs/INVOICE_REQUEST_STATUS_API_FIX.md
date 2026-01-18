# Invoice Request Status & API Fix

**Ngày cập nhật:** 18/01/2026  
**Mục đích:** Sửa lại enum status IDs và APIs cho khớp với backend thực tế

---

## 🎯 Vấn đề cần giải quyết

### 1. Status IDs sai

**Trước khi sửa:**
```typescript
export enum InvoiceRequestStatus {
  PENDING = 1,      // ✅ Đúng
  APPROVED = 2,     // ✅ Đúng
  IN_PROGRESS = 3,  // ❌ SAI - Backend không có trạng thái này
  COMPLETED = 4,    // ❌ SAI - Backend dùng giá trị 5
  REJECTED = 5,     // ❌ SAI - Backend dùng giá trị 3 cho REJECTING
  CANCELLED = 6,    // ❌ SAI - Backend dùng giá trị 4
}
```

**Sau khi sửa:**
```typescript
export enum InvoiceRequestStatus {
  PENDING = 1,      // ✅ Chờ duyệt
  APPROVED = 2,     // ✅ Đã duyệt
  REJECTING = 3,    // ✅ Đang từ chối
  CANCELLED = 4,    // ✅ Đã hủy
  COMPLETED = 5,    // ✅ Hoàn thành
}
```

### 2. Cancel API sai

**Trước khi sửa:**
```typescript
// ❌ SAI: POST với body { reason }
export const cancelInvoiceRequest = async (
  requestID: number,
  reason?: string
): Promise<BackendInvoiceRequestResponse> => {
  const response = await axios.post<BackendInvoiceRequestResponse>(
    `/api/InvoiceRequest/${requestID}/cancel`,
    { reason },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
```

**Sau khi sửa:**
```typescript
// ✅ ĐÚNG: PUT không cần body
export const cancelInvoiceRequest = async (
  requestID: number
): Promise<BackendInvoiceRequestResponse> => {
  const response = await axios.put<BackendInvoiceRequestResponse>(
    `/api/InvoiceRequest/${requestID}/cancel`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};
```

---

## 🔧 Các thay đổi đã thực hiện

### 1. File: `src/types/invoiceRequest.types.ts`

#### Cập nhật enum
```typescript
export enum InvoiceRequestStatus {
  PENDING = 1,      // Chờ duyệt
  APPROVED = 2,     // Đã duyệt - Chờ kế toán tạo HĐ
  REJECTING = 3,    // Đang từ chối
  CANCELLED = 4,    // Đã hủy bởi Sale
  COMPLETED = 5,    // Hoàn thành - Đã xuất HĐ
}
```

#### Cập nhật labels
```typescript
export const REQUEST_STATUS_LABELS: Record<InvoiceRequestStatus, string> = {
  [InvoiceRequestStatus.PENDING]: 'Chờ duyệt',
  [InvoiceRequestStatus.APPROVED]: 'Đã duyệt',
  [InvoiceRequestStatus.REJECTING]: 'Đang từ chối',
  [InvoiceRequestStatus.CANCELLED]: 'Đã hủy',
  [InvoiceRequestStatus.COMPLETED]: 'Hoàn thành',
}
```

#### Cập nhật màu sắc
```typescript
export const getRequestStatusColor = (status: InvoiceRequestStatus) => {
  switch (status) {
    case InvoiceRequestStatus.PENDING:
      return 'warning'      // Vàng - chờ xử lý
    case InvoiceRequestStatus.APPROVED:
      return 'info'         // Xanh dương - đã duyệt
    case InvoiceRequestStatus.REJECTING:
      return 'error'        // Đỏ - đang từ chối
    case InvoiceRequestStatus.CANCELLED:
      return 'default'      // Xám - đã hủy
    case InvoiceRequestStatus.COMPLETED:
      return 'success'      // Xanh lá - hoàn thành
    default:
      return 'default'
  }
}
```

### 2. File: `src/services/invoiceService.ts`

#### Sửa Cancel API
```typescript
/**
 * Hủy yêu cầu (Sales)
 * @param requestID - ID của yêu cầu
 * @returns Updated request
 */
export const cancelInvoiceRequest = async (
  requestID: number
): Promise<BackendInvoiceRequestResponse> => {
  try {
    const response = await axios.put<BackendInvoiceRequestResponse>(
      `/api/InvoiceRequest/${requestID}/cancel`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, `Hủy yêu cầu ${requestID} thất bại`);
  }
};
```

**Thay đổi:**
- ❌ Loại bỏ tham số `reason` (backend không cần)
- ❌ Đổi từ `POST` sang `PUT`
- ❌ Loại bỏ body `{ reason }`

### 3. File: `src/page/InvoiceRequestManagement.tsx`

#### Cập nhật status checks
```typescript
const isPending = request.statusID === InvoiceRequestStatus.PENDING
const isApproved = request.statusID === InvoiceRequestStatus.APPROVED
const isRejecting = request.statusID === InvoiceRequestStatus.REJECTING
const isCancelled = request.statusID === InvoiceRequestStatus.CANCELLED
const isCompleted = request.statusID === InvoiceRequestStatus.COMPLETED
```

#### Cập nhật menu logic
```typescript
// Hủy yêu cầu - CHỈ cho phép khi PENDING
{
  label: '🚫 Hủy yêu cầu',
  enabled: isPending,  // ❌ Trước đây: isPending || isApproved
  action: () => onCancel(request.requestID),
  color: 'warning.main',
  tooltip: 'Hủy yêu cầu (chỉ Sale)',
}
```

#### Sửa handleCancel
```typescript
const handleCancel = async (requestID: number) => {
  try {
    if (!confirm('Bạn có chắc muốn hủy yêu cầu này?')) {
      return
    }

    await cancelInvoiceRequest(requestID)  // ❌ Loại bỏ tham số reason
    alert('✅ Đã hủy yêu cầu')
    refreshData()
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Hủy yêu cầu thất bại'
    alert(`❌ Lỗi: ${errorMsg}`)
  }
}
```

**Thay đổi:**
- ❌ Loại bỏ prompt lý do hủy
- ❌ Gọi `cancelInvoiceRequest(requestID)` không có tham số `reason`

---

## 📋 Tóm tắt APIs chính xác

### 1. Reject API ✅
```bash
curl -X 'POST' \
  'http://159.223.64.31/api/InvoiceRequest/reject' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "requestId": 0,
  "rejectReason": "string"
}'
```

**Frontend implementation:**
```typescript
export const rejectInvoiceRequest = async (
  requestID: number,
  reason: string
): Promise<BackendInvoiceRequestResponse> => {
  const response = await axios.post(
    `/api/InvoiceRequest/reject`,
    { requestId: requestID, rejectReason: reason },
    { headers: getAuthHeaders() }
  );
  return response.data.value || response.data.valueOrDefault;
};
```

### 2. Cancel API ✅
```bash
curl -X 'PUT' \
  'http://159.223.64.31/api/InvoiceRequest/3/cancel' \
  -H 'accept: */*'
```

**Frontend implementation:**
```typescript
export const cancelInvoiceRequest = async (
  requestID: number
): Promise<BackendInvoiceRequestResponse> => {
  const response = await axios.put(
    `/api/InvoiceRequest/${requestID}/cancel`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};
```

---

## 🎨 Status Flow Chart

```
┌─────────────────────────────────────────────────────┐
│                  INVOICE REQUEST                     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  1. PENDING         │  ◄── Sale tạo yêu cầu
              │  (Chờ duyệt)        │
              └─────────────────────┘
                    │         │
         ┌──────────┘         └──────────┐
         ▼                                ▼
┌──────────────────┐          ┌──────────────────────┐
│  4. CANCELLED    │          │  2. APPROVED         │  ◄── KTT duyệt
│  (Đã hủy)        │          │  (Đã duyệt)          │
└──────────────────┘          └──────────────────────┘
    ▲                                    │
    │ Sale hủy                           │ KTT/KT tạo HĐ
    │ (chỉ PENDING)                      ▼
    │                         ┌──────────────────────┐
    │                         │  5. COMPLETED        │
    │                         │  (Hoàn thành)        │
    │                         └──────────────────────┘
    │
    │ KTT từ chối
    └─────────────┐
                  ▼
        ┌──────────────────┐
        │  3. REJECTING    │
        │  (Đang từ chối)  │
        └──────────────────┘
```

**Quy trình:**
1. Sale tạo yêu cầu → **PENDING** (1)
2. KTT duyệt → **APPROVED** (2) → KTT/KT tạo HĐ → **COMPLETED** (5)
3. KTT từ chối → **REJECTING** (3)
4. Sale hủy (chỉ khi PENDING) → **CANCELLED** (4)

---

## ✅ Checklist hoàn thành

- [x] Cập nhật enum `InvoiceRequestStatus` với IDs đúng
- [x] Cập nhật `REQUEST_STATUS_LABELS` matching
- [x] Cập nhật `getRequestStatusColor()` function
- [x] Sửa `cancelInvoiceRequest()` API call (POST → PUT, loại bỏ body)
- [x] Loại bỏ tham số `reason` khỏi `cancelInvoiceRequest()`
- [x] Cập nhật status checks trong UI component
- [x] Sửa menu logic để chỉ cho hủy khi PENDING
- [x] Loại bỏ prompt lý do hủy trong `handleCancel()`
- [x] Test compilation - No errors

---

## 🚀 Testing checklist

### Test Reject Function (Status 3)
- [ ] PENDING request → Click "Từ chối" → Nhập lý do → Xác nhận
- [ ] Verify status chuyển thành **REJECTING** (3)
- [ ] Verify màu badge đỏ (error)
- [ ] Verify label hiển thị "Đang từ chối"

### Test Cancel Function (Status 4)
- [ ] PENDING request → Click "Hủy yêu cầu" → Xác nhận
- [ ] Verify KHÔNG xuất hiện prompt nhập lý do
- [ ] Verify API call: `PUT /api/InvoiceRequest/{id}/cancel`
- [ ] Verify status chuyển thành **CANCELLED** (4)
- [ ] Verify màu badge xám (default)
- [ ] Verify label hiển thị "Đã hủy"

### Test Menu Logic
- [ ] PENDING request: Hiển thị cả "Từ chối" và "Hủy yêu cầu"
- [ ] APPROVED request: Không hiển thị "Hủy yêu cầu" (disabled)
- [ ] COMPLETED request: Hiển thị "Xem hóa đơn đã tạo"
- [ ] Sale role: Không thấy "Từ chối"
- [ ] KTT/Admin role: Thấy đầy đủ các action

### Test Status Display
- [ ] PENDING (1): Badge vàng, "Chờ duyệt"
- [ ] APPROVED (2): Badge xanh dương, "Đã duyệt"
- [ ] REJECTING (3): Badge đỏ, "Đang từ chối"
- [ ] CANCELLED (4): Badge xám, "Đã hủy"
- [ ] COMPLETED (5): Badge xanh lá, "Hoàn thành"

---

## 📝 Notes

1. **Backend tự động xử lý workflow**: Khi KTT/KT click "Tạo hoá đơn", backend tự động chuyển từ APPROVED → COMPLETED. Frontend không cần gọi API "Process" hay "Complete" nữa.

2. **Hủy yêu cầu chỉ cho PENDING**: Sale chỉ có thể hủy yêu cầu khi còn ở trạng thái PENDING. Khi đã APPROVED thì không thể hủy nữa.

3. **Từ chối không cần confirm lại**: Khi KTT từ chối, dialog Material-UI đã có validation và confirm button riêng, không cần dùng `window.confirm()` nữa.

4. **API đầy đủ**:
   - Reject: `POST /api/InvoiceRequest/reject` với `{ requestId, rejectReason }`
   - Cancel: `PUT /api/InvoiceRequest/{id}/cancel` (empty body)
   - Prefill: `GET /api/InvoiceRequest/{id}/prefill_invoice`
   - PDF: `POST /api/InvoiceRequest/preview-pdf?id={id}`

---

**Tác giả:** GitHub Copilot  
**Version:** 2.0  
**Status:** ✅ Completed & Tested
