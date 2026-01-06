# 📋 Tax API Status Integration - Technical Documentation

## 🎯 Tổng quan

Tài liệu này mô tả chi tiết việc tích hợp **Tax API Status** (Trạng thái CQT) vào hệ thống EIMS, dựa trên chuẩn hóa đơn điện tử Việt Nam.

### API Endpoint
```
GET /api/TaxApiStatus
Authorization: Bearer {token}
```

### Response Format
```json
[
  {
    "taxApiStatusID": 1,
    "code": "PENDING",
    "statusName": "Đang gửi CQT"
  },
  ...
]
```

---

## 📊 Phân loại trạng thái CQT

### **NHÓM 1: Trạng thái xử lý chung**

| ID | Code | Tên trạng thái | Màu sắc | Mô tả |
|----|------|----------------|---------|-------|
| 1 | `PENDING` | Đang gửi CQT | 🟡 Warning | Hóa đơn đang được gửi lên CQT |
| 2 | `RECEIVED` | CQT đã tiếp nhận | 🔵 Info | CQT đã nhận được hóa đơn |
| 3 | `REJECTED` | CQT từ chối | 🔴 Error | CQT từ chối toàn bộ |
| 4 | `APPROVED` | CQT đã cấp mã | 🟢 Success | ✅ Thành công - Đã có mã CQT |
| 5 | `FAILED` | Lỗi hệ thống | 🔴 Error | Lỗi kỹ thuật hệ thống |
| 6 | `PROCESSING` | Đang xử lý | 🟡 Warning | CQT đang kiểm tra |
| 7 | `NOT_FOUND` | Không tìm thấy hóa đơn | ⚪ Default | Không tìm thấy trong hệ thống CQT |

### **NHÓM 2: Thông báo tiếp nhận (TB)**

| ID | Code | Tên trạng thái | Màu sắc | Hành động yêu cầu |
|----|------|----------------|---------|-------------------|
| 10 | `TB01` | Tiếp nhận hợp lệ | 🟢 Success | ✅ Đợi kết quả cấp mã |
| 11 | `TB02` | Sai định dạng XML/XSD | 🔴 Error | ⚠️ Kiểm tra cấu trúc XML |
| 12 | `TB03` | Chữ ký số không hợp lệ | 🔴 Error | ⚠️ Ký lại với chứng thư số hợp lệ |
| 13 | `TB04` | MST không đúng | 🔴 Error | ⚠️ Kiểm tra mã số thuế |
| 14 | `TB05` | Thiếu thông tin bắt buộc | 🔴 Error | ⚠️ Bổ sung thông tin thiếu |
| 15 | `TB06` | Sai định dạng dữ liệu | 🔴 Error | ⚠️ Kiểm tra format dữ liệu |
| 16 | `TB07` | Trùng hóa đơn | 🔴 Error | ⚠️ Kiểm tra số hóa đơn đã tồn tại |
| 17 | `TB08` | Hóa đơn không được cấp mã | 🔴 Error | ⚠️ Kiểm tra điều kiện cấp mã |
| 18 | `TB09` | Không tìm thấy HĐ tham chiếu | 🔴 Error | ⚠️ Kiểm tra hóa đơn gốc |
| 19 | `TB10` | Thông tin hàng hóa không hợp lệ | 🔴 Error | ⚠️ Kiểm tra chi tiết sản phẩm |
| 20 | `TB11` | Bản PDF sai cấu trúc | 🔴 Error | ⚠️ Tạo lại file PDF |
| 21 | `TB12` | Lỗi kỹ thuật hệ thống thuế | 🔴 Error | ⚠️ Chờ CQT khắc phục hoặc thử lại |

### **NHÓM 3: Kết quả xử lý (KQ)**

| ID | Code | Tên trạng thái | Màu sắc | Ý nghĩa |
|----|------|----------------|---------|---------|
| 30 | `KQ01` | Đã cấp mã CQT | 🟢 Success | ✅ **HOÀN THÀNH** - Có mã CQT hợp lệ |
| 31 | `KQ02` | Bị từ chối khi cấp mã | 🔴 Error | ❌ CQT từ chối sau khi xử lý |
| 32 | `KQ03` | Chưa có kết quả xử lý | 🟡 Warning | ⏳ Đang chờ kết quả |
| 33 | `KQ04` | Không tìm thấy hóa đơn | ⚪ Default | Không tìm thấy trong DB CQT |

---

## 🏗️ Kiến trúc tích hợp

### **1. Type Definitions** (`src/types/tax.types.ts`)

```typescript
export interface TaxApiStatus {
  taxApiStatusID: number;
  code: string;
  statusName: string;
}

export interface InvoiceWithTaxStatus {
  invoiceID: number;
  taxAuthorityCode: string | null;
  taxApiStatusID: number | null;
  taxStatusCode: string | null;
  taxStatusName: string | null;
  taxStatusUpdatedAt: string | null;
  taxErrorMessage: string | null;
}
```

### **2. Service Layer** (`src/services/taxService.ts`)

#### Các API endpoints:

```typescript
// Lấy danh sách tất cả trạng thái CQT
getAllTaxApiStatuses(): Promise<TaxApiStatus[]>

// Lấy trạng thái theo ID
getTaxApiStatusById(statusId: number): Promise<TaxApiStatus>

// Gửi hóa đơn lên CQT
submitInvoiceToTax(invoiceId: number): Promise<string>

// Kiểm tra trạng thái hóa đơn với CQT
checkInvoiceTaxStatus(invoiceId: number): Promise<InvoiceWithTaxStatus>

// Đồng bộ trạng thái từ CQT
syncInvoiceTaxStatus(invoiceId: number): Promise<InvoiceWithTaxStatus>

// Gửi lại hóa đơn (retry)
retrySubmitInvoiceToTax(invoiceId: number): Promise<string>
```

### **3. Constants** (`src/constants/invoiceStatus.ts`)

#### Cập nhật constants với mapping đầy đủ:

```typescript
export const TAX_STATUS = {
  // Nhóm 1: Xử lý chung
  PENDING: 1,
  RECEIVED: 2,
  REJECTED: 3,
  APPROVED: 4,
  FAILED: 5,
  PROCESSING: 6,
  NOT_FOUND: 7,
  
  // Nhóm 2: Thông báo (TB)
  TB01: 10,
  TB02: 11,
  // ... (TB03 - TB12)
  
  // Nhóm 3: Kết quả (KQ)
  KQ01: 30,
  KQ02: 31,
  KQ03: 32,
  KQ04: 33,
} as const;

export const TAX_STATUS_LABELS: Record<number, string> = {
  [TAX_STATUS.PENDING]: 'Đang gửi CQT',
  // ... mapping đầy đủ
};

export const TAX_STATUS_COLORS: Record<number, ChipColor> = {
  [TAX_STATUS.PENDING]: 'warning',
  // ... màu sắc theo nghiêm trọng
};
```

#### Helper functions:

```typescript
// Kiểm tra trạng thái lỗi
isTaxStatusError(statusId: number): boolean

// Kiểm tra trạng thái thành công
isTaxStatusSuccess(statusId: number): boolean

// Kiểm tra có thể gửi lại không
canRetryTaxSubmit(statusId: number): boolean
```

### **4. UI Integration** (`src/page/InvoiceManagement.tsx`)

#### Cập nhật Invoice interface:

```typescript
export interface Invoice {
  // ... existing fields
  taxStatusId: number | null;
  taxStatus: string;
  taxStatusCode: string | null;
}
```

#### Mapper với logic thông minh:

```typescript
const mapInvoiceToUI = (item: InvoiceListItem, ...): Invoice => {
  let taxStatusId: number | null = null;
  let taxStatusLabel = 'Chưa gửi CQT';
  
  if (item.taxApiStatusID !== null) {
    // Có tax API status ID từ backend
    taxStatusId = item.taxApiStatusID;
    taxStatusLabel = item.taxStatusName || getTaxStatusLabel(item.taxApiStatusID);
  } else if (item.taxAuthorityCode) {
    // Legacy: có mã CQT nhưng chưa có taxApiStatusID
    taxStatusId = TAX_AUTHORITY_STATUS.ACCEPTED;
    taxStatusLabel = 'Đã cấp mã';
  } else {
    // Chưa gửi CQT
    taxStatusId = TAX_AUTHORITY_STATUS.NOT_SENT;
  }
  
  return { ...invoice, taxStatusId, taxStatus: taxStatusLabel };
}
```

#### DataGrid column với tooltip:

```typescript
{
  field: 'taxStatus',
  headerName: 'Trạng thái CQT',
  renderCell: (params) => {
    const taxStatusId = params.row.taxStatusId;
    const isError = isTaxStatusError(taxStatusId);
    const tooltipContent = (
      <Box>
        <Typography>Trạng thái: {params.value}</Typography>
        {taxStatusCode && <Typography>Mã: {taxStatusCode}</Typography>}
        {isError && <Typography>⚠️ Cần xử lý hoặc gửi lại</Typography>}
      </Box>
    );
    
    return (
      <Tooltip title={tooltipContent}>
        <Chip 
          label={params.value} 
          color={getTaxStatusColor(taxStatusId)}
          sx={{ animation: isError ? 'pulse 2s infinite' : 'none' }}
        />
      </Tooltip>
    );
  }
}
```

---

## 🔄 Luồng nghiệp vụ

### **Luồng gửi hóa đơn lên CQT**

```
┌─────────────────┐
│  Ký hóa đơn     │
│  (Sign)         │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Gửi lên CQT    │  ← submitInvoiceToTax()
│  (Submit)       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  PENDING (1)    │  "Đang gửi CQT"
└────────┬────────┘
         │
         v
┌─────────────────┐
│  TB01 (10)      │  "Tiếp nhận hợp lệ"
└────────┬────────┘
         │
         v
┌─────────────────┐
│  KQ01 (30)      │  "✅ Đã cấp mã CQT"
└─────────────────┘
```

### **Luồng xử lý lỗi**

```
┌─────────────────┐
│  TB02-TB12      │  Lỗi tiếp nhận
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Sửa lỗi        │  Theo hướng dẫn
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Gửi lại        │  ← retrySubmitInvoiceToTax()
└─────────────────┘
```

---

## 📝 Backend Requirements

### **InvoiceListItem Response cần bổ sung:**

```typescript
export interface InvoiceListItem {
  // ... existing fields
  taxApiStatusID: number | null;      // ✅ Thêm mới
  taxStatusCode: string | null;       // ✅ Thêm mới (PENDING, TB01, etc.)
  taxStatusName: string | null;       // ✅ Thêm mới (để hiển thị trực tiếp)
}
```

### **API endpoints cần backend hỗ trợ:**

1. **GET /api/TaxApiStatus** - ✅ Đã có
   - Lấy danh sách tất cả trạng thái

2. **POST /api/Tax/submit?invoiceId={id}** - Cần kiểm tra
   - Gửi hóa đơn lên CQT
   - Response: `{ taxAuthorityCode: string, taxApiStatusID: number }`

3. **GET /api/Tax/status/{invoiceId}** - Nên có
   - Kiểm tra trạng thái hiện tại với CQT
   - Response: `InvoiceWithTaxStatus`

4. **POST /api/Tax/sync/{invoiceId}** - Nên có
   - Đồng bộ trạng thái mới nhất từ CQT
   - Response: `InvoiceWithTaxStatus`

5. **POST /api/Tax/retry/{invoiceId}** - Nên có
   - Gửi lại hóa đơn khi bị lỗi
   - Response: `{ taxAuthorityCode: string, taxApiStatusID: number }`

---

## ✅ Checklist tích hợp

- [x] Tạo type definitions (`tax.types.ts`)
- [x] Tạo tax service với API calls (`taxService.ts`)
- [x] Cập nhật constants với mapping đầy đủ (`invoiceStatus.ts`)
- [x] Thêm helper functions (isTaxStatusError, canRetryTaxSubmit)
- [x] Cập nhật InvoiceListItem interface
- [x] Cập nhật Invoice UI interface
- [x] Cập nhật mapper với logic thông minh
- [x] Thêm cột Tax Status vào DataGrid
- [x] Thêm tooltip chi tiết cho trạng thái
- [x] Thêm animation cho trạng thái lỗi
- [ ] Test API integration với backend
- [ ] Thêm auto-sync trạng thái (polling/webhook)
- [ ] Thêm notification khi trạng thái thay đổi

---

## 🎨 UI/UX Features

### **1. Màu sắc theo nghiêm trọng**
- 🟢 **Success**: KQ01, TB01, APPROVED
- 🟡 **Warning**: PENDING, PROCESSING, KQ03
- 🔴 **Error**: TB02-TB12, REJECTED, FAILED, KQ02
- ⚪ **Default**: NOT_SENT, NOT_FOUND, KQ04
- 🔵 **Info**: RECEIVED

### **2. Animation cho trạng thái lỗi**
```typescript
sx={{
  animation: isError ? 'pulse 2s ease-in-out infinite' : 'none',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.8 },
  },
}}
```

### **3. Tooltip chi tiết**
- Tên trạng thái đầy đủ
- Mã trạng thái (code)
- Hướng dẫn xử lý (nếu có lỗi)

---

## 🔧 Cấu hình phát triển

### **Test API với curl:**

```bash
curl -X 'GET' \
  'http://159.223.64.31/api/TaxApiStatus' \
  -H 'Authorization: Bearer {YOUR_TOKEN}'
```

### **Mock data for development:**

```typescript
const mockTaxStatuses: TaxApiStatus[] = [
  { taxApiStatusID: 1, code: 'PENDING', statusName: 'Đang gửi CQT' },
  { taxApiStatusID: 10, code: 'TB01', statusName: 'Tiếp nhận hợp lệ' },
  { taxApiStatusID: 30, code: 'KQ01', statusName: 'Đã cấp mã CQT' },
];
```

---

## 📚 Tài liệu tham khảo

- [Nghị định 123/2020/NĐ-CP](https://thuvienphapluat.vn) - Quy định về hóa đơn điện tử
- [Thông tư 78/2021/TT-BTC](https://thuvienphapluat.vn) - Hướng dẫn thực hiện
- [Cổng thông tin điện tử TCT](https://www.gdt.gov.vn) - Tổng cục Thuế

---

## 👥 Team Contact

- **Frontend Lead**: Xử lý UI/UX và mapping
- **Backend Lead**: Cung cấp API và cập nhật response
- **QA**: Test integration và edge cases

---

**Version**: 1.0.0  
**Last Updated**: 19/12/2024  
**Author**: EIMS Development Team
