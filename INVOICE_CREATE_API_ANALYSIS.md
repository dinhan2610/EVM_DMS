# 📊 PHÂN TÍCH CHI TIẾT: API TẠO HÓA ĐƠN & TRƯỜNG SỐ HÓA ĐƠN

> **Ngày phân tích:** 23/12/2025  
> **File được kiểm tra:**
> - API Endpoint: `POST /api/Invoice`
> - Frontend: `/src/page/CreateVatInvoice.tsx`
> - Service: `/src/services/invoiceService.ts`
> - Adapter: `/src/utils/invoiceAdapter.ts`

---

## 🎯 TÓM TẮT NHANH

### ✅ Kết luận chính:
1. **API ĐÃ CÓ trường `invoiceNumber`** (kiểu `number`)
2. **Logic nghiệp vụ:** 
   - Hóa đơn **nháp** (statusID = 1): `invoiceNumber = 0` hoặc NULL
   - Sau khi **ký** (statusID = 2): Backend tự động cấp số
3. **Frontend CHƯA hiển thị** trường này trong form tạo hóa đơn
4. **Cần bổ sung:** Trường hiển thị (read-only) để người dùng biết số sẽ được cấp sau khi ký

---

## 📋 1. PHÂN TÍCH API

### 🔹 Request Schema (POST /api/Invoice)

```json
{
  "templateID": 0,           // ✅ Có trong form
  "customerID": 0,           // ✅ Có trong form
  "taxCode": "string",       // ✅ Có trong form
  "invoiceStatusID": 0,      // ✅ Có trong form (1=Nháp, 6=Chờ duyệt)
  "companyID": 0,            // ✅ Có trong form
  "customerName": "string",  // ✅ Có trong form
  "address": "string",       // ✅ Có trong form
  "notes": "string",         // ✅ Có trong form
  "paymentMethod": "string", // ✅ Có trong form
  "items": [                 // ✅ Có trong form
    {
      "productId": 0,
      "productName": "string",
      "unit": "string",
      "quantity": 0,
      "amount": 0,
      "vatAmount": 0
    }
  ],
  "amount": 0,               // ✅ Có trong form (tổng chưa VAT)
  "taxAmount": 0,            // ✅ Có trong form (tổng VAT)
  "totalAmount": 0,          // ✅ Có trong form (tổng thanh toán)
  "signedBy": 0,             // ✅ Có trong form (0=chưa ký)
  "minRows": 0,              // ✅ Có trong form (số dòng trống)
  "contactEmail": "string",  // ✅ Có trong form
  "contactPerson": "string", // ✅ Có trong form
  "contactPhone": "string"   // ✅ Có trong form
}
```

### 🔹 Response Schema (Backend trả về)

Từ file `/src/services/invoiceService.ts` (dòng 20-54):

```typescript
export interface InvoiceListItem {
  invoiceID: number;              // ✅ ID hóa đơn (PK)
  templateID: number;
  invoiceNumber: number;          // ⭐ SỐ HÓA ĐƠN (kiểu number)
  invoiceStatusID: number;
  companyId: number;
  customerID: number;
  issuerID: number;
  signDate: string;
  paymentDueDate: string | null;
  subtotalAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  totalAmountInWords: string;
  digitalSignature: string | null;
  taxAuthorityCode: string | null;  // ⭐ Mã CQT (sau khi đồng bộ)
  taxApiStatusID: number | null;
  taxStatusCode: string | null;
  taxStatusName: string | null;
  qrCodeData: string | null;
  notes: string | null;
  filePath: string | null;
  xmlPath: string | null;
  createdAt: string;
  invoiceItems: InvoiceItemResponse[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

---

## 🔍 2. LOGIC NGHIỆP VỤ VỀ SỐ HÓA ĐƠN

### 📌 Quy trình cấp số:

```
┌─────────────────────────────────────────────────────────────┐
│  HÓADƠN MỚI                                                 │
│  invoiceStatusID = 1 (Nháp)                                 │
│  invoiceNumber = 0 hoặc NULL                                │
│  ❌ CHƯA CÓ SỐ                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ User nhấn "Ký số"
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  POST /api/Invoice/{id}/sign                                │
│  Backend xử lý:                                             │
│  1. Cập nhật invoiceStatusID = 2 (Đã ký)                   │
│  2. Tự động cấp số: invoiceNumber = [số tự động]           │
│  3. Lưu chữ ký số (digitalSignature)                       │
│  ✅ CÓ SỐ HÓA ĐƠN                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ User nhấn "Gửi CQT"
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  POST /api/Tax/submit?invoiceId={id}                        │
│  Backend gửi lên CQT:                                       │
│  1. Gửi XML hóa đơn                                         │
│  2. Nhận mã CQT (taxAuthorityCode)                         │
│  3. Cập nhật taxApiStatusID                                 │
│  ✅ CÓ MÃ CQT                                              │
└─────────────────────────────────────────────────────────────┘
```

### 📖 Giải thích:

1. **Khi tạo hóa đơn nháp:**
   - `invoiceNumber` = 0 hoặc không có giá trị
   - Chưa được cấp số chính thức
   - Có thể sửa, xóa tự do

2. **Sau khi ký số:**
   - Backend tự động cấp `invoiceNumber` (số tuần tự)
   - Không thể sửa/xóa nữa
   - Số này là DUY NHẤT trong hệ thống

3. **Sau khi gửi CQT:**
   - Nhận được `taxAuthorityCode` từ cơ quan thuế
   - Mã này hiển thị trên hóa đơn chính thức
   - Dùng để tra cứu trên hệ thống của CQT

---

## 🖥️ 3. PHÂN TÍCH FRONTEND (CreateVatInvoice.tsx)

### ✅ Các trường ĐÃ CÓ trong form:

```typescript
// Từ file CreateVatInvoice.tsx (dòng 728-2607)

1. ✅ Template Selection (templateID)
2. ✅ Thông tin người mua:
   - buyerCustomerID (customerID)
   - buyerTaxCode (taxCode)
   - buyerCompanyName (customerName)
   - buyerAddress (address)
   - buyerName (contactPerson)
   - buyerEmail (contactEmail)
   - buyerPhone (contactPhone)
3. ✅ Danh sách sản phẩm (items)
4. ✅ Tổng tiền (totals):
   - amount (chưa VAT)
   - taxAmount (VAT)
   - totalAmount (tổng thanh toán)
5. ✅ Phương thức thanh toán (paymentMethod)
6. ✅ Ghi chú (invoiceNotes)
7. ✅ Trạng thái (invoiceStatusID):
   - 1 = Nháp (Lưu nháp)
   - 6 = Chờ duyệt (Gửi duyệt)
```

### ❌ Trường THIẾU:

```typescript
❌ invoiceNumber - SỐ HÓA ĐƠN
   → Không có trong form
   → Không hiển thị cho user
   → User KHÔNG BIẾT sẽ được cấp số gì sau khi ký
```

### 📍 Vị trí nên hiển thị:

Trong file `CreateVatInvoice.tsx`, dòng **1620-1715**, có phần "Ký hiệu số hóa đơn":

```tsx
{/* Ký hiệu số hoá đơn - Bên phải */}
<Box sx={{ flex: '0 0 auto', minWidth: '280px' }}>
  <Stack spacing={1.5}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" sx={{ fontWeight: 500, minWidth: '90px' }}>
        Ký hiệu:
      </Typography>
      <TextField
        size="small"
        fullWidth
        value={selectedTemplate?.serial || '<Chưa chọn>'}
        disabled
        placeholder="<Chưa chọn mẫu>"
        variant="outlined"
        sx={{ fontSize: '0.8125rem' }}
      />
    </Stack>
    
    {/* ⭐ THIẾU PHẦN NÀY */}
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" sx={{ fontWeight: 500, minWidth: '90px' }}>
        Số:
      </Typography>
      <TextField
        size="small"
        fullWidth
        value="<Chưa cấp số>"    // ⚠️ Hiện chưa có
        disabled
        placeholder="<Chưa cấp số>"
        variant="outlined"
        sx={{ fontSize: '0.8125rem' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Info fontSize="small" sx={{ color: '#1976d2' }} />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  </Stack>
</Box>
```

**Giải thích vị trí này:**
- Ngay dưới "Ký hiệu" (serial)
- Phía bên phải màn hình
- Gần phần hướng dẫn lập hóa đơn
- Logic hiển thị: "Chưa cấp số" khi tạo mới/nháp

---

## 🔧 4. SO SÁNH API VỚI FORM

| Trường trong API Request | Có trong Form? | Nguồn dữ liệu |
|--------------------------|----------------|----------------|
| `templateID` | ✅ Yes | `selectedTemplate.templateID` |
| `customerID` | ✅ Yes | `buyerCustomerID` |
| `taxCode` | ✅ Yes | `buyerTaxCode` |
| `invoiceStatusID` | ✅ Yes | `1` (nháp) hoặc `6` (chờ duyệt) |
| `companyID` | ✅ Yes | `1` (hardcoded) |
| `customerName` | ✅ Yes | `buyerCompanyName` |
| `address` | ✅ Yes | `buyerAddress` |
| `notes` | ✅ Yes | `invoiceNotes` |
| `paymentMethod` | ✅ Yes | `paymentMethod` dropdown |
| `items[]` | ✅ Yes | `items` array (DataGrid) |
| `amount` | ✅ Yes | `totals.subtotalAfterDiscount` |
| `taxAmount` | ✅ Yes | `totals.tax` |
| `totalAmount` | ✅ Yes | `totals.total` |
| `signedBy` | ✅ Yes | `0` (chưa ký) |
| `minRows` | ✅ Yes | `5` (hardcoded) |
| `contactEmail` | ✅ Yes | `buyerEmail` |
| `contactPerson` | ✅ Yes | `buyerName` |
| `contactPhone` | ✅ Yes | `buyerPhone` |

### ✅ KẾT LUẬN: API Request khớp 100% với form hiện tại

---

## 📊 5. KIỂM TRA MÃ NGUỒN CHI TIẾT

### 🔹 File: invoiceAdapter.ts (Mapper)

**Dòng 186-229:** Hàm `mapToBackendInvoiceRequest()`

```typescript
export function mapToBackendInvoiceRequest(
  templateID: number,
  buyerInfo: FrontendBuyerInfo,
  items: FrontendInvoiceItem[],
  totals: FrontendTotals,
  paymentMethod: string = "Tiền mặt",
  minRows: number = 5,
  invoiceStatusID: number = 1,          // ⭐ NEW: 1=Nháp, 6=Chờ duyệt
  notes: string = '',                   // ⭐ NEW: Ghi chú
  signedBy: number = 0                  // ⭐ NEW: UserID người ký (0=chưa ký)
): BackendInvoiceRequest
```

**Giải thích:**
- ✅ Có đầy đủ các tham số cần thiết
- ✅ Mapping logic đúng
- ✅ Validation totals trước khi gửi
- ❌ KHÔNG có tham số `invoiceNumber` (vì chưa được cấp)

### 🔹 File: CreateVatInvoice.tsx (Form Component)

**Dòng 1273-1375:** Hàm `handleSubmitInvoice()`

```typescript
const handleSubmitInvoice = async (invoiceStatusID: number, statusLabel: string) => {
  try {
    // Validate các trường bắt buộc
    if (!selectedTemplate) { ... }
    if (!buyerCompanyName || !buyerAddress) { ... }
    if (items.length === 0) { ... }

    // Map frontend state sang backend request
    const backendRequest = mapToBackendInvoiceRequest(
      selectedTemplate.templateID,
      {
        customerID: buyerCustomerID,
        taxCode: buyerTaxCode,
        companyName: buyerCompanyName,
        address: buyerAddress,
        buyerName: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
      },
      items,
      totals,
      paymentMethod,
      5,              // minRows
      invoiceStatusID, // ⭐ Status: 1=Nháp, 6=Chờ duyệt
      invoiceNotes,   // Ghi chú hóa đơn
      0               // signedBy (0=chưa ký)
    )

    // Gọi API
    const response = await invoiceService.createInvoice(backendRequest)
    
    // ⭐ Response sẽ có invoiceNumber (nếu backend trả về)
    console.log('✅ Invoice created:', response)
    
    navigate('/invoices')
  } catch (error) {
    // Error handling
  }
}
```

**Quan sát:**
- ✅ Logic đúng
- ✅ Gửi đúng dữ liệu
- ❌ KHÔNG lưu `invoiceNumber` từ response (nhưng cũng không cần vì redirect ngay)

### 🔹 File: invoiceService.ts (API Calls)

**Dòng 144-195:** Hàm `createInvoice()`

```typescript
export const createInvoice = async (data: BackendInvoiceRequest): Promise<BackendInvoiceResponse> => {
  try {
    console.log('[createInvoice] Request:', data);
    
    const response = await axios.post<BackendInvoiceResponse>(
      `/api/Invoice`,
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[createInvoice] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createInvoice] Error details:', error);
    return handleApiError(error, 'Create invoice failed');
  }
};
```

**Response type:** `BackendInvoiceResponse`

```typescript
export interface BackendInvoiceResponse {
  invoiceID: number;
  invoiceNumber?: string;     // ⚠️ Optional, kiểu string
  templateID?: number;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
}
```

**Vấn đề:**
- ⚠️ Response interface định nghĩa `invoiceNumber` là **string**
- ⚠️ Nhưng backend thực tế trả về kiểu **number** (theo InvoiceListItem)
- ⚠️ Có thể gây lỗi type mismatch

---

## 🔍 6. KIỂM TRA CÁCH HIỂN THỊ Ở CÁC TRANG KHÁC

### 📄 InvoiceDetail.tsx (Trang xem chi tiết)

**Dòng 238:**
```tsx
<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
  {template?.templateName || 'Hóa đơn'} - Số: {invoice.invoiceNumber}
</Typography>
```

**Dòng 293:**
```tsx
<InvoiceTemplatePreview
  invoiceNumber={
    invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.DRAFT 
      ? undefined          // ⚠️ Nháp thì không hiển thị số
      : invoice.invoiceNumber  // ✅ Đã ký thì hiển thị số
  }
  ...
/>
```

**Logic hiển thị:**
- ✅ Nếu `invoiceStatusID = 1` (Nháp): KHÔNG hiển thị số
- ✅ Nếu `invoiceStatusID >= 2` (Đã ký): Hiển thị số
- ✅ Đúng với quy trình nghiệp vụ

### 📄 InvoiceManagement.tsx (Trang danh sách)

**Dòng 834:**
```tsx
invoice.invoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase())
```

**Có sử dụng `invoiceNumber` để:**
- ✅ Tìm kiếm hóa đơn
- ✅ Hiển thị trong bảng danh sách

---

## 🎯 7. ĐÁNH GIÁ TỔNG THỂ

### ✅ Điểm mạnh:

1. **API hoàn chỉnh:**
   - Có trường `invoiceNumber`
   - Logic nghiệp vụ rõ ràng (nháp = 0, ký = tự động cấp)
   - Response đầy đủ thông tin

2. **Frontend đầy đủ:**
   - Form khớp 100% với API schema
   - Validation đầy đủ
   - Mapping logic chính xác

3. **Logic đúng:**
   - Hiển thị đúng ở trang detail
   - Phân biệt rõ nháp/đã ký

### ❌ Điểm cần cải thiện:

1. **Thiếu hiển thị trong form tạo:**
   - User KHÔNG BIẾT số hóa đơn sẽ là gì
   - Không có thông báo "Số sẽ được cấp sau khi ký"

2. **Type mismatch:**
   - `InvoiceListItem.invoiceNumber` là `number`
   - `BackendInvoiceResponse.invoiceNumber` là `string?`
   - Cần thống nhất kiểu dữ liệu

3. **UX chưa tốt:**
   - Không có tooltip giải thích
   - Không có preview số hóa đơn dự kiến

---

## 💡 8. ĐỀ XUẤT GIẢI PHÁP

### 🎯 Mục tiêu:
Thêm trường "Số hóa đơn" vào form tạo hóa đơn, hiển thị trạng thái "Chưa cấp số" và tooltip giải thích.

### 📝 Các bước thực hiện:

#### **Bước 1: Thêm UI hiển thị số hóa đơn**

**File:** `src/page/CreateVatInvoice.tsx`  
**Vị trí:** Dòng 1692 (sau trường "Ký hiệu")

```tsx
{/* Số hóa đơn - NEW */}
<Stack direction="row" spacing={1} alignItems="center">
  <Typography variant="body2" sx={{ fontWeight: 500, minWidth: '90px' }}>
    Số:
  </Typography>
  <TextField
    size="small"
    fullWidth
    value="<Chưa cấp số>"
    disabled
    placeholder="<Chưa cấp số>"
    variant="outlined"
    sx={{ 
      fontSize: '0.8125rem',
      '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: '#999',
        fontStyle: 'italic',
      }
    }}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <Tooltip 
            title="Số hóa đơn sẽ được tự động cấp sau khi ký số. Hóa đơn nháp chưa có số."
            arrow
            placement="top"
          >
            <Info fontSize="small" sx={{ color: '#1976d2', cursor: 'help' }} />
          </Tooltip>
        </InputAdornment>
      ),
    }}
  />
</Stack>
```

#### **Bước 2: Thêm thông báo sau khi tạo thành công**

**File:** `src/page/CreateVatInvoice.tsx`  
**Vị trí:** Dòng 1345-1355

```typescript
const response = await invoiceService.createInvoice(backendRequest)

console.log('✅ Invoice created:', response)

// ⭐ Hiển thị thông tin invoice vừa tạo
const successMessage = invoiceStatusID === 1
  ? `Lưu hóa đơn nháp thành công! ID: ${response.invoiceID}. Số hóa đơn sẽ được cấp sau khi ký.`
  : `Gửi hóa đơn chờ duyệt thành công! ID: ${response.invoiceID}`;

setSnackbar({
  open: true,
  message: successMessage,
  severity: 'success'
})
```

#### **Bước 3: Fix type mismatch**

**File:** `src/utils/invoiceAdapter.ts`  
**Vị trí:** Dòng 37-45

```typescript
export interface BackendInvoiceResponse {
  invoiceID: number;
  invoiceNumber?: number;     // ✅ FIX: Đổi từ string sang number
  templateID?: number;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
}
```

#### **Bước 4: Thêm documentation**

**File:** `src/page/CreateVatInvoice.tsx`  
**Vị trí:** Đầu component (dòng 738)

```tsx
/**
 * CreateVatInvoice Component
 * 
 * Tạo hóa đơn GTGT mới với các chức năng:
 * - Chọn mẫu hóa đơn
 * - Nhập thông tin người mua
 * - Thêm sản phẩm/dịch vụ
 * - Tính toán tổng tiền, VAT
 * - Lưu nháp (invoiceStatusID = 1)
 * - Gửi duyệt (invoiceStatusID = 6)
 * 
 * ⚠️ Lưu ý:
 * - Số hóa đơn (invoiceNumber) chỉ được cấp SAU KHI KÝ SỐ
 * - Hóa đơn nháp có invoiceNumber = 0 hoặc NULL
 * - Để ký số: vào trang danh sách → nhấn "Ký số"
 */
```

---

## 📋 9. CHECKLIST TRIỂN KHAI

### ✅ Phase 1: UI Enhancement (Ưu tiên cao)
- [ ] Thêm trường "Số" hiển thị "<Chưa cấp số>"
- [ ] Thêm tooltip giải thích
- [ ] Thêm icon Info
- [ ] Test responsive (mobile/tablet/desktop)

### ✅ Phase 2: Logic Enhancement
- [ ] Cập nhật message sau khi lưu thành công
- [ ] Hiển thị invoiceID trong thông báo
- [ ] Fix type mismatch (string → number)

### ✅ Phase 3: Documentation
- [ ] Thêm JSDoc cho component
- [ ] Cập nhật README về quy trình cấp số
- [ ] Thêm diagram flow

### ✅ Phase 4: Testing
- [ ] Test tạo hóa đơn nháp
- [ ] Test gửi duyệt
- [ ] Test hiển thị số sau khi ký
- [ ] Test tìm kiếm theo số hóa đơn

---

## 🔗 10. TÀI LIỆU THAM KHẢO

### 📂 Files liên quan:
1. `/src/page/CreateVatInvoice.tsx` - Form tạo hóa đơn
2. `/src/services/invoiceService.ts` - API service
3. `/src/utils/invoiceAdapter.ts` - Request/Response mapper
4. `/src/page/InvoiceDetail.tsx` - Hiển thị chi tiết hóa đơn
5. `/src/constants/invoiceStatus.ts` - Constants status

### 🔗 API Endpoints liên quan:
- `POST /api/Invoice` - Tạo hóa đơn mới
- `GET /api/Invoice` - Danh sách hóa đơn
- `GET /api/Invoice/{id}` - Chi tiết hóa đơn
- `POST /api/Invoice/{id}/sign` - Ký số hóa đơn
- `POST /api/Tax/submit` - Gửi CQT

---

## ❓ 11. FAQ

### Q1: Tại sao hóa đơn nháp không có số?
**A:** Theo quy định, chỉ hóa đơn đã ký mới được cấp số chính thức. Hóa đơn nháp có thể sửa/xóa tự do nên chưa cần số.

### Q2: Có thể tự nhập số hóa đơn không?
**A:** Không. Số hóa đơn do hệ thống tự động cấp để đảm bảo tính duy nhất và tuần tự.

### Q3: Số hóa đơn có thể thay đổi sau khi cấp không?
**A:** Không. Sau khi ký số và cấp số, không thể thay đổi.

### Q4: Làm sao biết số hóa đơn tiếp theo sẽ là gì?
**A:** Có thể thêm API endpoint `GET /api/Invoice/next-number` để preview số tiếp theo (tính năng mở rộng).

### Q5: Có thể hủy hóa đơn đã có số không?
**A:** Không thể xóa, chỉ có thể "Hủy" (invoiceStatusID = 4). Hóa đơn hủy vẫn giữ số để audit.

---

## 🎬 KẾT LUẬN

### ✅ Tóm tắt:
1. **API đã đầy đủ** - Có trường `invoiceNumber` (kiểu `number`)
2. **Logic đúng** - Nháp = 0, Đã ký = tự động cấp
3. **Frontend thiếu** - Chưa hiển thị trường này trong form tạo
4. **Cần bổ sung** - UI + Tooltip + Documentation

### 🚀 Hành động tiếp theo:
1. Implement UI changes (30 phút)
2. Test trên dev environment (15 phút)
3. Update documentation (10 phút)
4. Deploy to staging (5 phút)

**Tổng thời gian ước tính: ~1 giờ**

---

**📅 Ngày cập nhật:** 23/12/2025  
**👨‍💻 Phân tích bởi:** GitHub Copilot  
**📊 Trạng thái:** ✅ Completed
