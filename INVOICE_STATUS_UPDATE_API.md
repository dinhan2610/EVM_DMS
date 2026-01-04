# 🔄 Invoice Status Update API - Technical Guide

## 📋 API Overview

### **Endpoint**
```
PATCH /api/Invoice/{invoiceId}/status
```

### **Authentication**
Required: Bearer Token

### **Content-Type**
`application/json`

---

## 📨 Request Structure

### **URL Parameters**
- `{invoiceId}`: ID của hóa đơn cần cập nhật trạng thái

### **Request Body**
```json
{
  "invoiceId": 1,
  "newStatusId": 6,
  "note": "Gửi hóa đơn chờ duyệt"
}
```

### **Body Schema**
```typescript
interface UpdateInvoiceStatusRequest {
  invoiceId: number;        // ID hóa đơn (phải khớp với URL param)
  newStatusId: number;      // Trạng thái mới (1-8)
  note?: string;            // Ghi chú khi chuyển trạng thái (optional)
}
```

---

## 🔢 Status Transitions (State Machine)

### **Valid Status IDs**

| ID | Code | Label | Description |
|----|------|-------|-------------|
| 1 | DRAFT | Nháp | Hóa đơn mới tạo |
| 2 | ISSUED | Đã phát hành | Đã ký & gửi CQT thành công |
| 3 | CANCELLED | Bị từ chối | KTT từ chối |
| 4 | ADJUSTED | Đã điều chỉnh | Hóa đơn điều chỉnh |
| 5 | REPLACED | Bị thay thế | Có HĐ thay thế mới |
| 6 | PENDING_APPROVAL | Chờ duyệt | Chờ KTT duyệt |
| 7 | PENDING_SIGN | Chờ ký | Đã duyệt, chờ ký số |
| 8 | SEND_ERROR | Lỗi gửi CQT | Đã ký nhưng gửi CQT thất bại |

### **Allowed Transitions**

```
┌──────────┐
│  DRAFT   │ (1)
│  Nháp    │
└────┬─────┘
     │ sendForApproval()
     ▼
┌──────────────────┐
│ PENDING_APPROVAL │ (6)
│   Chờ duyệt      │
└────┬──────┬──────┘
     │      │ rejectInvoice(reason)
     │      ▼
     │  ┌───────────┐
     │  │ CANCELLED │ (3)
     │  │ Bị từ chối│
     │  └───────────┘
     │
     │ approveInvoice()
     ▼
┌──────────────┐
│ PENDING_SIGN │ (7)
│   Chờ ký     │
└──────┬───────┘
       │ signInvoice() + submitToTaxAuthority()
       ├──────────┐
       │          │ (Tax Submit Failed)
       │          ▼
       │      ┌──────────────┐
       │      │  SEND_ERROR  │ (8)
       │      │ Lỗi gửi CQT  │
       │      └──────┬───────┘
       │             │ retrySubmit() → Success
       │             │
       ▼─────────────▼
   ┌────────────────┐
   │    ISSUED      │ (2)
   │ Đã phát hành   │
   └────────────────┘
```

---

## 🔧 Service Implementation

### **Base Method**
```typescript
/**
 * Cập nhật trạng thái hóa đơn
 * API: PATCH /api/Invoice/{id}/status
 */
export const updateInvoiceStatus = async (
  invoiceId: number, 
  statusId: number, 
  note?: string
): Promise<void> => {
  const requestBody: UpdateInvoiceStatusRequest = {
    invoiceId,
    newStatusId: statusId,
  };
  
  if (note && note.trim()) {
    requestBody.note = note.trim();
  }
  
  await axios.patch(
    `/api/Invoice/${invoiceId}/status`,
    requestBody,
    { headers: getAuthHeaders() }
  );
};
```

### **Helper Methods (Wrapper Functions)**

#### 1. **Send for Approval**
```typescript
/**
 * Gửi hóa đơn cho kế toán trưởng duyệt
 * 1 (DRAFT) → 6 (PENDING_APPROVAL)
 */
export const sendForApproval = async (
  invoiceId: number, 
  note?: string
): Promise<void> => {
  return updateInvoiceStatus(
    invoiceId, 
    6, 
    note || 'Gửi hóa đơn chờ duyệt'
  );
};
```

**Usage:**
```typescript
await invoiceService.sendForApproval(invoiceId);
```

#### 2. **Approve Invoice**
```typescript
/**
 * Kế toán trưởng duyệt hóa đơn
 * 6 (PENDING_APPROVAL) → 7 (PENDING_SIGN)
 */
export const approveInvoice = async (
  invoiceId: number, 
  approverNote?: string
): Promise<void> => {
  return updateInvoiceStatus(
    invoiceId, 
    7, 
    approverNote || 'Kế toán trưởng đã duyệt'
  );
};
```

**Usage:**
```typescript
await invoiceService.approveInvoice(invoiceId, 'Đã kiểm tra, phê duyệt');
```

#### 3. **Reject Invoice**
```typescript
/**
 * Kế toán trưởng từ chối hóa đơn
 * 6 (PENDING_APPROVAL) → 3 (CANCELLED)
 */
export const rejectInvoice = async (
  invoiceId: number, 
  reason: string
): Promise<void> => {
  if (!reason || !reason.trim()) {
    throw new Error('Vui lòng nhập lý do từ chối');
  }
  return updateInvoiceStatus(
    invoiceId, 
    3, 
    `Từ chối: ${reason}`
  );
};
```

**Usage:**
```typescript
await invoiceService.rejectInvoice(invoiceId, 'Sai thông tin khách hàng');
```

#### 4. **Mark Send Error**
```typescript
/**
 * Đánh dấu hóa đơn lỗi gửi CQT
 * 7 (PENDING_SIGN) → 8 (SEND_ERROR)
 */
export const markSendError = async (
  invoiceId: number, 
  errorMessage?: string
): Promise<void> => {
  return updateInvoiceStatus(
    invoiceId, 
    8, 
    errorMessage || 'Lỗi gửi cơ quan thuế'
  );
};
```

**Usage:**
```typescript
try {
  await submitToTaxAuthority(invoiceId);
} catch (error) {
  await invoiceService.markSendError(invoiceId, error.message);
}
```

#### 5. **Mark Issued**
```typescript
/**
 * Đánh dấu hóa đơn đã phát hành thành công
 * 8 (SEND_ERROR) → 2 (ISSUED) hoặc 7 (PENDING_SIGN) → 2 (ISSUED)
 */
export const markIssued = async (
  invoiceId: number, 
  taxCode?: string
): Promise<void> => {
  const note = taxCode 
    ? `Đã phát hành và gửi CQT thành công. Mã CQT: ${taxCode}` 
    : 'Đã phát hành hóa đơn';
  return updateInvoiceStatus(invoiceId, 2, note);
};
```

**Usage:**
```typescript
const taxCode = await submitToTaxAuthority(invoiceId);
await invoiceService.markIssued(invoiceId, taxCode);
```

---

## 📖 Usage Examples

### **Example 1: Gửi hóa đơn chờ duyệt**
```typescript
// UI Component
const handleSendForApproval = async (invoiceId: string) => {
  try {
    await invoiceService.sendForApproval(parseInt(invoiceId));
    
    showSuccess('Đã gửi hóa đơn cho Kế toán trưởng');
    reloadInvoices();
  } catch (error) {
    showError(error.message);
  }
};
```

**Request:**
```http
PATCH /api/Invoice/123/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "invoiceId": 123,
  "newStatusId": 6,
  "note": "Gửi hóa đơn chờ duyệt"
}
```

### **Example 2: Kế toán trưởng duyệt**
```typescript
const handleApprove = async (invoiceId: number) => {
  try {
    await invoiceService.approveInvoice(
      invoiceId, 
      'Đã kiểm tra, phê duyệt để ký số'
    );
    
    showSuccess('Đã duyệt hóa đơn');
  } catch (error) {
    showError(error.message);
  }
};
```

**Request:**
```http
PATCH /api/Invoice/123/status

{
  "invoiceId": 123,
  "newStatusId": 7,
  "note": "Đã kiểm tra, phê duyệt để ký số"
}
```

### **Example 3: Từ chối hóa đơn**
```typescript
const handleReject = async (invoiceId: number, reason: string) => {
  try {
    await invoiceService.rejectInvoice(invoiceId, reason);
    
    showSuccess('Đã từ chối hóa đơn');
  } catch (error) {
    showError(error.message);
  }
};
```

**Request:**
```http
PATCH /api/Invoice/123/status

{
  "invoiceId": 123,
  "newStatusId": 3,
  "note": "Từ chối: Sai thông tin khách hàng"
}
```

### **Example 4: Xử lý ký & gửi CQT**
```typescript
const handleSignAndSubmit = async (invoiceId: number, signerId: number) => {
  try {
    // Bước 1: Ký số
    await invoiceService.signInvoice(invoiceId, signerId);
    
    // Bước 2: Gửi lên CQT
    try {
      const taxCode = await invoiceService.submitToTaxAuthority(invoiceId);
      
      // Thành công → ISSUED
      await invoiceService.markIssued(invoiceId, taxCode);
      
      showSuccess(`Đã phát hành thành công. Mã CQT: ${taxCode}`);
      
    } catch (taxError) {
      // Lỗi gửi CQT → SEND_ERROR
      await invoiceService.markSendError(invoiceId, taxError.message);
      
      showError(`Đã ký nhưng gửi CQT thất bại: ${taxError.message}`);
    }
    
  } catch (error) {
    showError(`Lỗi ký số: ${error.message}`);
  }
};
```

### **Example 5: Gửi lại CQT (Retry)**
```typescript
const handleRetrySubmit = async (invoiceId: number) => {
  try {
    const taxCode = await invoiceService.submitToTaxAuthority(invoiceId);
    
    // Gửi lại thành công → ISSUED
    await invoiceService.markIssued(invoiceId, taxCode);
    
    showSuccess(`Đã gửi lại thành công. Mã CQT: ${taxCode}`);
    
  } catch (error) {
    showError(`Gửi lại thất bại: ${error.message}`);
  }
};
```

---

## ⚠️ Error Handling

### **HTTP Status Codes**

| Code | Meaning | Handler |
|------|---------|---------|
| 200 | Success | Trạng thái đã được cập nhật |
| 400 | Bad Request | Request body không hợp lệ |
| 404 | Not Found | Không tìm thấy hóa đơn |
| 409 | Conflict | Transition không hợp lệ |
| 401 | Unauthorized | Token hết hạn hoặc không hợp lệ |

### **Error Response Format**
```json
{
  "message": "Không thể chuyển từ trạng thái DRAFT sang ISSUED",
  "statusCode": 409,
  "errors": [
    "Invalid status transition"
  ]
}
```

### **Client Error Handling**
```typescript
try {
  await invoiceService.updateInvoiceStatus(invoiceId, newStatusId, note);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    
    switch (status) {
      case 400:
        showError('Dữ liệu không hợp lệ');
        break;
      case 404:
        showError('Không tìm thấy hóa đơn');
        break;
      case 409:
        showError('Không thể chuyển trạng thái này');
        break;
      default:
        showError(error.message);
    }
  }
}
```

---

## ✅ Validation Rules

### **Backend Validation**

1. **Invoice Exists**: Hóa đơn phải tồn tại trong DB
2. **Status Transition Valid**: Transition phải nằm trong state machine
3. **User Permission**: User phải có quyền thực hiện action
4. **Note Length**: Note không quá 500 ký tự

### **Frontend Validation**

```typescript
// Validation trước khi gọi API
const validateStatusUpdate = (
  currentStatus: number, 
  newStatus: number
): boolean => {
  const validTransitions: Record<number, number[]> = {
    1: [6],        // DRAFT → PENDING_APPROVAL
    6: [7, 3],     // PENDING_APPROVAL → PENDING_SIGN | CANCELLED
    7: [2, 8],     // PENDING_SIGN → ISSUED | SEND_ERROR
    8: [2],        // SEND_ERROR → ISSUED
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};
```

---

## 🔍 Testing

### **Test Case 1: Happy Path - Gửi duyệt**
```bash
curl -X 'PATCH' \
  'http://159.223.64.31/api/Invoice/1/status' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoiceId": 1,
    "newStatusId": 6,
    "note": "Test gửi duyệt"
  }'
```

**Expected:** Status 200, invoice status = 6

### **Test Case 2: With Note**
```bash
curl -X 'PATCH' \
  'http://159.223.64.31/api/Invoice/2/status' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoiceId": 2,
    "newStatusId": 3,
    "note": "Từ chối: Sai MST khách hàng"
  }'
```

**Expected:** Status 200, invoice status = 3, note được lưu

### **Test Case 3: Invalid Transition**
```bash
curl -X 'PATCH' \
  'http://159.223.64.31/api/Invoice/3/status' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoiceId": 3,
    "newStatusId": 2,
    "note": "Test invalid transition"
  }'
```

**Expected:** Status 409 (nếu current status ≠ 7, 8)

---

## 📊 Comparison: Old vs New API

### **Old API (PUT)**
```typescript
// PUT /api/Invoice/{id}?statusId={statusId}
await axios.put(`/api/Invoice/${invoiceId}?statusId=${statusId}`, null);
```

**Limitations:**
- ❌ Không có note/reason
- ❌ Status ID trong query param (không semantic)
- ❌ Không validation body

### **New API (PATCH)**
```typescript
// PATCH /api/Invoice/{id}/status
await axios.patch(`/api/Invoice/${invoiceId}/status`, {
  invoiceId,
  newStatusId: statusId,
  note: 'Ghi chú'
});
```

**Improvements:**
- ✅ Có trường note để ghi chú
- ✅ Request body rõ ràng, dễ validate
- ✅ RESTful hơn (PATCH cho partial update)
- ✅ Dễ mở rộng thêm fields

---

## 🎯 Best Practices

1. **Always use helper methods** thay vì gọi trực tiếp `updateInvoiceStatus`
2. **Provide meaningful notes** khi chuyển trạng thái quan trọng
3. **Validate transitions** ở frontend trước khi gọi API
4. **Handle errors properly** với user-friendly messages
5. **Log all status changes** cho audit trail

---

## 📚 Related Documentation

- [TAX_API_STATUS_INTEGRATION.md](./TAX_API_STATUS_INTEGRATION.md) - Tax Status Integration
- [INVOICE_SIGN_API_INTEGRATION.md](./INVOICE_SIGN_API_INTEGRATION.md) - Sign & Issue Flow

---

**Version**: 2.0.0  
**Last Updated**: 19/12/2024  
**API Method**: PATCH (upgraded from PUT)
