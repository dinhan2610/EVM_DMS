# 🔧 Backend API Requirements - Hóa Đơn Điều Chỉnh

> **Document Version:** 1.0  
> **Date:** 3/1/2026  
> **Author:** Frontend Team  
> **Status:** 🔴 CRITICAL - Cần implement trước khi production

---

## 📌 Executive Summary

Frontend đã hoàn thành 100% UI/UX cho tính năng **Hóa đơn điều chỉnh** với đầy đủ:
- ✅ Load thông tin hóa đơn gốc
- ✅ DataGrid với Original + Adjustment columns
- ✅ Validation: Số lượng cuối không được âm
- ✅ Calculation: `adjustmentAmount = (FinalQty × FinalPrice) - (OrigQty × OrigPrice)`
- ✅ Reference text (dòng tham chiếu pháp lý)
- ✅ Template selection
- ✅ UX: Cho phép nhập số âm, màu sắc dynamic, nút "Trả hàng toàn bộ"

**⚠️ Backend API hiện tại CHƯA ĐỦ để submit!** Document này chi tiết tất cả requirements.

---

## 🚨 CRITICAL: Backend API Schema Analysis (Updated: 4/1/2026 - 14:30)

### **Backend hiện tại (Status: ⚠️ CẢI THIỆN 50% - VẪN CẦN THÊM ORIGINAL VALUES)**

```json
{
  "originalInvoiceId": 0,
  "templateId": 0,                     // ✅ FIXED - Đã thêm
  "referenceText": "string",           // ✅ OK
  "adjustmentReason": "string",        // ✅ FIXED - Đã thêm
  "performedBy": 0,                    // ✅ OK
  "adjustmentItems": [
    {
      "productID": 0,                  // ✅ OK
      "quantity": 0,                   // ✅ ĐÚNG Ý NGHĨA - Đây là adjustment quantity (có thể âm)
      "unitPrice": 0,                  // ✅ ĐÚNG Ý NGHĨA - Đây là adjustment price (có thể âm)
      "overrideVATRate": 0             // ✅ OK
    }
  ]
}
```

### **🎯 Backend Team đã giải thích:**

> **Backend:** "`quantity` là giá trị nhận thêm hoặc trừ bớt. 
> - `quantity = 1` → cộng thêm 1
> - `quantity = -1` → giảm đi 1
> - Không điền (0) → không thay đổi"

**✅ Backend ĐÃ HIỂU ĐÚNG về Adjustment Logic!**

### **Progress Report:**

| Field | Status | Note |
|-------|--------|------|
| `templateId` | ✅ **FIXED** | Đã thêm, render PDF đúng template |
| `adjustmentReason` | ✅ **FIXED** | Đã thêm, đáp ứng audit |
| `quantity` | ✅ **ĐÚNG Ý NGHĨA** | = adjustmentQuantity (có thể âm) |
| `unitPrice` | ✅ **ĐÚNG Ý NGHĨA** | = adjustmentUnitPrice (có thể âm) |
| **Original values** | ❌ **VẪN THIẾU** | **THIẾU 2 FIELDS để validate & calculate** 👇 |

---

### **🔴 VẪN CÒN 1 VẤN ĐỀ QUAN TRỌNG: Thiếu Original Values**

**Backend hiện có:**
```typescript
{
  "productID": 101,
  "quantity": -2,         // ✅ OK - Đây là adjustment (giảm 2)
  "unitPrice": 0,         // ✅ OK - Đây là adjustment price (không đổi giá)
  "overrideVATRate": 10
}
```

**❌ Nhưng VẪN THIẾU:**

| Field | Tại sao cần? |
|-------|-------------|
| `originalQuantity` | Để validate: `final = original + adjustment >= 0` |
| `originalUnitPrice` | Để tính: `adjustmentAmount = finalTotal - originalTotal` |

---

### **💡 Giải thích chi tiết:**

#### **Kịch bản: User muốn giảm 2 sản phẩm**

**Frontend biết:**
- Original quantity: 10 (từ hóa đơn gốc)
- User nhập: -2 (giảm 2 cái)
- → Final: 10 + (-2) = 8 ✅

**Frontend GỬI:**
```json
{
  "productID": 101,
  "originalQuantity": 10,      // Frontend biết từ hóa đơn gốc
  "adjustmentQuantity": -2,    // User nhập
  "originalUnitPrice": 500000, // Frontend biết từ hóa đơn gốc
  "adjustmentUnitPrice": 0     // User nhập
}
```

**Backend hiện tại NHẬN:**
```json
{
  "productID": 101,
  "quantity": -2,              // ✅ = adjustmentQuantity
  "unitPrice": 0,              // ✅ = adjustmentUnitPrice (???)
  "overrideVATRate": 10
}
```

**❌ Backend KHÔNG BIẾT:**
- Original quantity là **10** hay **20** hay **100**?
- Original price là **500k** hay **1M** hay **5M**?

---

### **⚠️ Hậu quả:**

#### **1. Không validate được Guardrail ❌**

```csharp
// Backend chỉ biết: adjustment = -2
// Nhưng KHÔNG BIẾT original là bao nhiêu

// ❌ KHÔNG THỂ validate:
var finalQuantity = item.OriginalQuantity + item.Quantity;  // OriginalQuantity ở đâu???

if (finalQuantity < 0)
    throw new ValidationException(
        $"Số lượng cuối ({finalQuantity}) không được âm"
    );
```

**Ví dụ lỗi:**
- User có 3 sản phẩm gốc
- User nhập adjustment = -5 (trả 5 cái)
- Backend nhận `quantity: -5` nhưng không biết original = 3
- → **KHÔNG VALIDATE được** → Cho qua
- → Final = 3 + (-5) = **-2** ❌ (số lượng âm - SAI LOGIC!)

#### **2. Không tính được Adjustment Amount ❌**

```csharp
// Backend cần tính:
var adjustmentAmount = (finalQty × finalPrice) - (origQty × origPrice);

// Backend chỉ có:
// - adjustment quantity = -2
// - adjustment price = 0

// ❌ KHÔNG CÓ:
// - original quantity = ???
// - original price = ???

// → KHÔNG THỂ TÍNH adjustmentAmount
```

**Ví dụ tính sai:**
- Original: 10 cái × 500k = **5.000.000đ**
- Adjustment: -2 cái × 0đ = 0đ (sai!)
- **Đúng phải là:** (8 × 500k) - (10 × 500k) = **-1.000.000đ**

Backend không thể tính đúng vì thiếu original values!

#### **3. Không auto-detect được Type ❌**

```csharp
// Auto-detect INCREASE/DECREASE dựa vào totalAdjustmentAmount
if (totalAdjustmentAmount > 0)
    type = INCREASE;
else if (totalAdjustmentAmount < 0)
    type = DECREASE;

// Nhưng không tính được adjustmentAmount
// → Không biết đây là INCREASE hay DECREASE
```

#### **4. PDF thiếu thông tin ❌**

```
┌──────┬────────────┬────────┬────────┬────────┬─────────────┐
│ STT  │ Tên SP     │ SL Gốc │ SL Đ/C │ SL Cuối│ Thành tiền  │
├──────┼────────────┼────────┼────────┼────────┼─────────────┤
│ 1    │ Laptop     │   ?    │   -2   │   ?    │      ?      │
└──────┴────────────┴────────┴────────┴────────┴─────────────┘
         ↑ Thiếu original values → Không hiển thị được
```

---

### **✅ Giải pháp: Backend cần thêm 2 fields**

**Option 1: Đổi tên field cho rõ ràng (RECOMMENDED)**

```csharp
public class AdjustmentItemDto
{
    public int ProductID { get; set; }
    
    // 🔵 Adjustment values (đã có)
    [Required]
    public decimal AdjustmentQuantity { get; set; }  // Đổi tên từ "quantity"
    
    [Required]
    public decimal AdjustmentUnitPrice { get; set; }  // Đổi tên từ "unitPrice"
    
    // 🟢 Original values (CẦN THÊM)
    [Required]
    public decimal OriginalQuantity { get; set; }     // ✅ THÊM MỚI
    
    [Required]
    public decimal OriginalUnitPrice { get; set; }    // ✅ THÊM MỚI
    
    public decimal? OverrideVATRate { get; set; }
}
```

**Request mẫu:**
```json
{
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,          // ✅ Frontend gửi (từ hóa đơn gốc)
      "adjustmentQuantity": -2,        // ✅ Backend đã nhận (quantity)
      "originalUnitPrice": 500000,     // ✅ Frontend gửi (từ hóa đơn gốc)
      "adjustmentUnitPrice": 0,        // ✅ Backend đã nhận (unitPrice)
      "overrideVATRate": 10
    }
  ]
}
```

---

**Option 2: Giữ nguyên field name (KHÔNG KHUYẾN NGHỊ)**

```csharp
public class AdjustmentItemDto
{
    public int ProductID { get; set; }
    
    // Giữ nguyên tên (nhưng confusing)
    public decimal Quantity { get; set; }            // = adjustmentQuantity
    public decimal UnitPrice { get; set; }           // = adjustmentUnitPrice???
    
    // Thêm original
    public decimal OriginalQuantity { get; set; }    // ✅ THÊM
    public decimal OriginalUnitPrice { get; set; }   // ✅ THÊM
    
    public decimal? OverrideVATRate { get; set; }
}
```

⚠️ Vấn đề: `UnitPrice` là adjustment hay final? Không rõ ràng!

---

### **🎯 Tóm tắt:**

**Backend ĐÃ ĐÚNG:**
- ✅ `quantity` = adjustment quantity (có thể âm) - Logic đúng!
- ✅ `templateId`, `adjustmentReason` - Đã thêm

**Backend VẪN CẦN:**
- ❌ `originalQuantity` - Để validate final >= 0
- ❌ `originalUnitPrice` - Để tính adjustment amount

**Tỷ lệ hoàn thành:** 4/6 = **67%** ✅ | 2/6 = **33%** ❌
  "originalUnitPrice": 500000,     // ✅ Bắt buộc
  
  // 🔵 ĐIỀU CHỈNH (user nhập, có thể âm)
  "adjustmentQuantity": -2,        // ✅ Bắt buộc
  "adjustmentUnitPrice": 0,        // ✅ Bắt buộc
  
  "overrideVATRate": 10
}
```

**Với schema đúng, backend CÓ THỂ:**

```csharp
// ✅ 1. Calculate Final values
var finalQuantity = item.OriginalQuantity + item.AdjustmentQuantity;  // 10 + (-2) = 8
var finalPrice = item.OriginalUnitPrice + item.AdjustmentUnitPrice;   // 500k + 0 = 500k

// ✅ 2. Validate guardrails
if (finalQuantity < 0)
    throw new ValidationException(
        $"Số lượng cuối ({finalQuantity}) không được âm. " +
        $"Original: {item.OriginalQuantity}, Adjustment: {item.AdjustmentQuantity}"
    );

// ✅ 3. Calculate adjustment amount
var originalSubtotal = item.OriginalQuantity * item.OriginalUnitPrice;  // 10 × 500k = 5M
var finalSubtotal = finalQuantity * finalPrice;                         // 8 × 500k = 4M
var adjustmentAmount = finalSubtotal - originalSubtotal;                // 4M - 5M = -1M

// ✅ 4. Auto-detect type
if (adjustmentAmount > 0) type = INCREASE;
else if (adjustmentAmount < 0) type = DECREASE;  // ← -1M → DECREASE

// ✅ 5. Generate PDF với đầy đủ columns
// Original: 10  |  Adjustment: -2  |  Final: 8  |  Amount: -1M
```

---

### **🎯 Tóm tắt: Backend cần làm gì tiếp?**

#### **✅ Đã fix (Progress: 2/6 = 33%)**
- ✅ `templateId` - OK
- ✅ `adjustmentReason` - OK

#### **❌ Vẫn cần fix (CRITICAL - 4/6 = 67%)**

**Update DTO `AdjustmentItemDto`:**

```csharp
public class AdjustmentItemDto
{
    public int ProductID { get; set; }
    
    // ⚠️ XÓA 2 fields này:
    // public decimal Quantity { get; set; }        // ❌ DELETE
    // public decimal UnitPrice { get; set; }       // ❌ DELETE
    
    // ✅ THAY BẰNG 4 fields này:
    [Required]
    public decimal OriginalQuantity { get; set; }      // ✅ ADD
    
    [Required]
    public decimal AdjustmentQuantity { get; set; }    // ✅ ADD (CAN BE NEGATIVE!)
    
    [Required]
    public decimal OriginalUnitPrice { get; set; }     // ✅ ADD
    
    [Required]
    public decimal AdjustmentUnitPrice { get; set; }   // ✅ ADD (CAN BE NEGATIVE!)
    
    public decimal? OverrideVATRate { get; set; }
}
```

---

### **📊 Impact Analysis**

| Chức năng | Status với schema hiện tại | Status nếu sửa đúng |
|-----------|---------------------------|---------------------|
| Validation (final >= 0) | ❌ Broken | ✅ Works |
| Calculate adjustment amount | ❌ Broken | ✅ Works |
| Auto-detect INCREASE/DECREASE | ❌ Broken | ✅ Works |
| PDF với cột Original/Adj/Final | ❌ Broken | ✅ Works |
| Template selection | ✅ Works | ✅ Works |
| Audit trail | ✅ Works | ✅ Works |

**Kết luận:** Backend đã tiến bộ 33% (2/6 requirements) nhưng vẫn còn 67% (4/6) chưa đạt, đặc biệt là phần **core calculation logic** ❌

---

### **Schema đúng (yêu cầu bắt buộc):**

```json
{
  "originalInvoiceId": 27,
  "performedBy": 5,
  "templateID": 3,                     // ✅ BẮT BUỘC
  "adjustmentReason": "Lý do...",      // ✅ BẮT BUỘC
  "referenceText": "Điều chỉnh...",   // ✅ BẮT BUỘC
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,          // ✅ BẮT BUỘC - Từ hóa đơn gốc
      "adjustmentQuantity": -2,        // ✅ BẮT BUỘC - User nhập (có thể âm)
      "originalUnitPrice": 500000,     // ✅ BẮT BUỘC - Từ hóa đơn gốc
      "adjustmentUnitPrice": 0,        // ✅ BẮT BUỘC - User nhập (có thể âm)
      "overrideVATRate": 10            // ✅ Optional
    }
  ]
}
```

**Với schema đúng, backend có thể:**
1. ✅ Validate: `finalQty = 10 + (-2) = 8 >= 0` → OK
2. ✅ Calculate: `adjustmentAmount = (8 × 500k) - (10 × 500k) = -1M`
3. ✅ Auto-detect: Type = DECREASE (vì adjustmentAmount < 0)
4. ✅ Generate PDF: Hiển thị cột Original/Adjustment/Final

---

### **📋 Checklist sửa Backend API**

**Backend team cần update DTO:**

```csharp
public class CreateAdjustmentInvoiceRequest
{
    public int OriginalInvoiceId { get; set; }
    public int PerformedBy { get; set; }
    public string ReferenceText { get; set; }
    
    // ✅ ADD THESE FIELDS
    [Required]
    public int TemplateID { get; set; }
    
    [Required]
    [MinLength(10, ErrorMessage = "Lý do điều chỉnh phải có ít nhất 10 ký tự")]
    public string AdjustmentReason { get; set; }
    
    public List<AdjustmentItemDto> AdjustmentItems { get; set; }
}

public class AdjustmentItemDto
{
    public int ProductID { get; set; }
    
    // ✅ REPLACE quantity/unitPrice WITH THESE
    [Required]
    public decimal OriginalQuantity { get; set; }
    
    [Required]
    public decimal AdjustmentQuantity { get; set; }  // CAN BE NEGATIVE!
    
    [Required]
    public decimal OriginalUnitPrice { get; set; }
    
    [Required]
    public decimal AdjustmentUnitPrice { get; set; } // CAN BE NEGATIVE!
    
    public decimal? OverrideVATRate { get; set; }
}
```

---

## 🎯 Objectives

1. **Nhận đầy đủ dữ liệu** từ frontend (Original + Adjustment values)
2. **Validate business rules** (số lượng/giá cuối không âm)
3. **Lưu reference text** (yêu cầu pháp lý - in lên PDF)
4. **Tự động xác định** adjustment type (INCREASE/DECREASE)
5. **Generate PDF** với template đã chọn
6. **Return chi tiết** để frontend hiển thị summary

---

## 📡 API Specification

### **Endpoint: Create Adjustment Invoice**

```http
POST /api/Invoice/adjustment
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 📥 Request Schema (NEW - Chi tiết đầy đủ)

### **Root Request Object**

```typescript
{
  // ============ THÔNG TIN GỐC ============
  "originalInvoiceId": number,          // ID hóa đơn gốc (bắt buộc)
  "performedBy": number,                // User ID thực hiện điều chỉnh
  
  // ============ METADATA ============
  "templateID": number,                 // 🆕 Template ID để render PDF
  "adjustmentReason": string,           // Lý do điều chỉnh (min 10 ký tự)
  "referenceText": string,              // 🆕 BẮT BUỘC - Dòng tham chiếu pháp lý
  
  // ============ DANH SÁCH ITEMS ĐIỀU CHỈNH ============
  "adjustmentItems": [
    {
      "productID": number,
      
      // --- Giá trị GỐC (từ hóa đơn gốc) ---
      "originalQuantity": number,       // 🆕 SL gốc (để validate)
      "originalUnitPrice": number,      // 🆕 ĐG gốc (để validate)
      
      // --- Giá trị ĐIỀU CHỈNH (+/-) ---
      "adjustmentQuantity": number,     // 🆕 SL điều chỉnh (có thể âm)
      "adjustmentUnitPrice": number,    // 🆕 ĐG điều chỉnh (có thể âm)
      
      // --- Optional ---
      "overrideVATRate": number?        // Ghi đè thuế suất (optional)
    }
  ]
}
```

### **Example Request**

```json
{
  "originalInvoiceId": 27,
  "performedBy": 5,
  "templateID": 3,
  "adjustmentReason": "Điều chỉnh số lượng do nhận thiếu hàng từ nhà cung cấp",
  "referenceText": "Điều chỉnh (tăng) cho hóa đơn Mẫu số 01GTKT0/001 Ký hiệu AA/24E Số 0000027 ngày 15 tháng 12 năm 2025",
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,
      "originalUnitPrice": 500000,
      "adjustmentQuantity": -2,        // Giảm 2 cái
      "adjustmentUnitPrice": 0,        // Giá không đổi
      "overrideVATRate": 10
    },
    {
      "productID": 102,
      "originalQuantity": 5,
      "originalUnitPrice": 10000000,
      "adjustmentQuantity": 0,         // Số lượng không đổi
      "adjustmentUnitPrice": 2000000,  // Tăng giá 2 triệu
      "overrideVATRate": 10
    }
  ]
}
```

---

## 📤 Response Schema (ENHANCED)

### **Success Response (200 OK)**

```typescript
{
  "success": true,
  "data": {
    // ============ IDs & NUMBERS ============
    "adjustmentId": number,
    "adjustmentNumber": string,           // "INV-027-ADJ-001"
    "originalInvoiceId": number,
    "originalInvoiceNumber": string,
    
    // ============ TYPE (Auto-detected) ============
    "adjustmentType": 0 | 1,              // 0=INCREASE, 1=DECREASE
    
    // ============ CHI TIẾT ITEMS ============
    "adjustmentItems": [
      {
        "productID": number,
        "productName": string,
        "productCode": string,
        
        // Original values
        "originalQuantity": number,
        "originalUnitPrice": number,
        "originalSubtotal": number,       // = originalQuantity × originalUnitPrice
        
        // Adjustment values
        "adjustmentQuantity": number,
        "adjustmentUnitPrice": number,
        "adjustmentSubtotal": number,     // = adjustmentQuantity × adjustmentUnitPrice (có thể âm!)
        
        // Final values
        "finalQuantity": number,          // = original + adjustment
        "finalUnitPrice": number,         // = original + adjustment
        "finalSubtotal": number,          // = final × final
        
        // 🎯 KEY METRIC
        "adjustmentAmount": number,       // = finalSubtotal - originalSubtotal
        
        "vatRate": number,
        "adjustmentVATAmount": number     // VAT tính trên adjustmentAmount
      }
    ],
    
    // ============ FINANCIAL SUMMARY ============
    "originalSubtotal": number,           // Tổng tiền hàng gốc (chưa VAT)
    "originalVatAmount": number,          // VAT gốc
    "originalTotalAmount": number,        // Tổng gốc (bao gồm VAT)
    
    "adjustmentSubtotal": number,         // 🎯 Tổng tiền ĐIỀU CHỈNH (chưa VAT) - CÓ THỂ ÂM!
    "adjustmentVatAmount": number,        // VAT trên số điều chỉnh
    "adjustmentTotalAmount": number,      // 🎯 Tổng điều chỉnh (bao gồm VAT) - CÓ THỂ ÂM!
    
    "finalSubtotal": number,              // Tổng cuối (chưa VAT)
    "finalVatAmount": number,             // VAT cuối
    "finalTotalAmount": number,           // Tổng cuối (bao gồm VAT)
    
    // ============ METADATA ============
    "referenceText": string,              // Dòng tham chiếu đã lưu
    "templateID": number,                 // Template đã dùng
    "pdfUrl": string?,                    // URL PDF đã generate (nếu có)
    
    "createdAt": string,                  // ISO 8601
    "createdBy": number,
    "createdByName": string?
  },
  "message": "Tạo hóa đơn điều chỉnh thành công"
}
```

### **Example Success Response**

```json
{
  "success": true,
  "data": {
    "adjustmentId": 15,
    "adjustmentNumber": "INV-027-ADJ-001",
    "originalInvoiceId": 27,
    "originalInvoiceNumber": "AA/24E-0000027",
    "adjustmentType": 1,
    "adjustmentItems": [
      {
        "productID": 101,
        "productName": "Laptop Dell Inspiron 15",
        "productCode": "LAP-001",
        "originalQuantity": 10,
        "originalUnitPrice": 500000,
        "originalSubtotal": 5000000,
        "adjustmentQuantity": -2,
        "adjustmentUnitPrice": 0,
        "adjustmentSubtotal": 0,
        "finalQuantity": 8,
        "finalUnitPrice": 500000,
        "finalSubtotal": 4000000,
        "adjustmentAmount": -1000000,
        "vatRate": 10,
        "adjustmentVATAmount": -100000
      },
      {
        "productID": 102,
        "productName": "Máy chiếu Epson EB-X05",
        "productCode": "PRJ-002",
        "originalQuantity": 5,
        "originalUnitPrice": 10000000,
        "originalSubtotal": 50000000,
        "adjustmentQuantity": 0,
        "adjustmentUnitPrice": 2000000,
        "adjustmentSubtotal": 0,
        "finalQuantity": 5,
        "finalUnitPrice": 12000000,
        "finalSubtotal": 60000000,
        "adjustmentAmount": 10000000,
        "vatRate": 10,
        "adjustmentVATAmount": 1000000
      }
    ],
    "originalSubtotal": 55000000,
    "originalVatAmount": 5500000,
    "originalTotalAmount": 60500000,
    "adjustmentSubtotal": 9000000,
    "adjustmentVatAmount": 900000,
    "adjustmentTotalAmount": 9900000,
    "finalSubtotal": 64000000,
    "finalVatAmount": 6400000,
    "finalTotalAmount": 70400000,
    "referenceText": "Điều chỉnh (tăng) cho hóa đơn Mẫu số 01GTKT0/001 Ký hiệu AA/24E Số 0000027 ngày 15 tháng 12 năm 2025",
    "templateID": 3,
    "pdfUrl": "https://storage.example.com/invoices/adj/INV-027-ADJ-001.pdf",
    "createdAt": "2026-01-03T14:30:00Z",
    "createdBy": 5,
    "createdByName": "Nguyễn Văn A"
  },
  "message": "Tạo hóa đơn điều chỉnh thành công"
}
```

---

## 🛡️ Business Logic & Validations

### **1. Pre-Validation (Kiểm tra trước khi xử lý)**

```csharp
// Check invoice exists and is valid
var originalInvoice = await _db.Invoices.FindAsync(request.OriginalInvoiceId);
if (originalInvoice == null)
    throw new NotFoundException("Hóa đơn gốc không tồn tại");

// Check invoice status (chỉ điều chỉnh được hóa đơn đã phát hành)
if (originalInvoice.InvoiceStatusID != 3) // 3 = ISSUED
    throw new BusinessException("Chỉ có thể điều chỉnh hóa đơn đã phát hành");

// Check template exists
var template = await _db.Templates.FindAsync(request.TemplateID);
if (template == null || !template.IsActive)
    throw new NotFoundException("Template không tồn tại hoặc đã bị vô hiệu hóa");

// Validate reference text (yêu cầu pháp lý)
if (string.IsNullOrWhiteSpace(request.ReferenceText) || request.ReferenceText.Length < 30)
    throw new ValidationException("Reference text bắt buộc phải có ít nhất 30 ký tự (yêu cầu pháp lý)");

// Validate adjustment reason
if (string.IsNullOrWhiteSpace(request.AdjustmentReason) || request.AdjustmentReason.Length < 10)
    throw new ValidationException("Lý do điều chỉnh phải có ít nhất 10 ký tự");

// Validate items not empty
if (request.AdjustmentItems == null || request.AdjustmentItems.Count == 0)
    throw new ValidationException("Phải có ít nhất 1 sản phẩm điều chỉnh");
```

### **2. Item-Level Validation (Validate từng dòng sản phẩm)**

```csharp
foreach (var item in request.AdjustmentItems)
{
    // Check product exists
    var product = await _db.Products.FindAsync(item.ProductID);
    if (product == null)
        throw new NotFoundException($"Sản phẩm ID {item.ProductID} không tồn tại");
    
    // 🛡️ GUARDRAIL 1: Final quantity không được âm
    var finalQuantity = item.OriginalQuantity + item.AdjustmentQuantity;
    if (finalQuantity < 0)
        throw new ValidationException(
            $"Sản phẩm '{product.Name}': Số lượng cuối ({finalQuantity}) không được âm. " +
            $"Số lượng điều chỉnh ({item.AdjustmentQuantity}) vượt quá số lượng gốc ({item.OriginalQuantity})."
        );
    
    // 🛡️ GUARDRAIL 2: Final unit price phải dương (hoặc = 0 nếu trả hàng toàn bộ)
    var finalPrice = item.OriginalUnitPrice + item.AdjustmentUnitPrice;
    if (finalPrice < 0)
        throw new ValidationException(
            $"Sản phẩm '{product.Name}': Đơn giá cuối ({finalPrice:N0}) không được âm."
        );
    
    // Warning nếu final quantity = 0 (trả hàng toàn bộ)
    if (finalQuantity == 0)
        _logger.LogWarning($"Product {item.ProductID} has final quantity = 0 (full return)");
}
```

### **3. Calculation Logic (Tính toán số liệu tài chính)**

```csharp
// ⚠️ QUAN TRỌNG: Single Table Approach
// Backend chỉ cần LƯU GIÁ TRỊ CHÊNH LỆCH vào Invoices/InvoiceItems
// KHÔNG cần lưu Original/Final values riêng

foreach (var item in request.AdjustmentItems)
{
    // 1️⃣ Validate final values (frontend đã validate, backend double-check)
    var finalQuantity = item.OriginalQuantity + item.AdjustmentQuantity;
    var finalPrice = item.OriginalUnitPrice + item.AdjustmentUnitPrice;
    
    if (finalQuantity < 0)
        throw new ValidationException($"Product {item.ProductID}: Final quantity cannot be negative");
    
    if (finalPrice < 0)
        throw new ValidationException($"Product {item.ProductID}: Final price cannot be negative");
    
    // 2️⃣ Tính adjustment amount (số tiền chênh lệch)
    var originalSubtotal = item.OriginalQuantity * item.OriginalUnitPrice;
    var finalSubtotal = finalQuantity * finalPrice;
    var adjustmentAmount = finalSubtotal - originalSubtotal;
    
    // 3️⃣ Tính VAT trên adjustment amount
    var vatRate = item.OverrideVATRate ?? product.DefaultVATRate;
    var adjustmentVATAmount = adjustmentAmount * (vatRate / 100);
    
    // 4️⃣ LƯU VÀO InvoiceItems (giá trị CHÊNH LỆCH, có thể âm!)
    var adjustmentItem = new InvoiceItem
    {
        InvoiceID = newAdjustmentInvoiceId,
        ProductID = item.ProductID,
        
        // ⭐ KEY: Lưu adjustment values (CÓ THỂ ÂM!)
        Quantity = item.AdjustmentQuantity,        // -2, +5, 0, etc.
        UnitPrice = item.OriginalUnitPrice,        // Giá gốc (để tính amount)
        Amount = adjustmentAmount,                 // CÓ THỂ ÂM!
        VATRate = vatRate,
        VATAmount = adjustmentVATAmount,           // CÓ THỂ ÂM!
        
        // Metadata
        IsAdjustmentItem = true,
        OriginalItemID = originalItem?.InvoiceItemID // Link về item gốc (optional)
    };
    
    await _db.InvoiceItems.AddAsync(adjustmentItem);
}

// 5️⃣ Tính tổng cho hóa đơn điều chỉnh
var totalAdjustmentAmount = adjustmentItems.Sum(i => i.Amount);
var totalAdjustmentVAT = adjustmentItems.Sum(i => i.VATAmount);

// 6️⃣ Tạo record Invoice (hóa đơn điều chỉnh)
var adjustmentInvoice = new Invoice
{
    InvoiceNumber = GenerateAdjustmentNumber(originalInvoice),  // AA/24E-0000027-ADJ-001
    InvoiceType = 1,  // ADJUSTMENT
    OriginalInvoiceID = request.OriginalInvoiceId,
    ReferenceNote = request.ReferenceText,  // BẮT BUỘC (pháp lý)
    AdjustmentReason = request.AdjustmentReason,
    
    // ⭐ Lưu tổng CHÊNH LỆCH (có thể âm!)
    Subtotal = totalAdjustmentAmount,
    VATAmount = totalAdjustmentVAT,
    TotalAmount = totalAdjustmentAmount + totalAdjustmentVAT,
    
    // Copy metadata từ hóa đơn gốc
    CustomerID = originalInvoice.CustomerID,
    TemplateID = request.TemplateID,
    InvoiceStatusID = 3,  // ISSUED (hóa đơn điều chỉnh phát hành luôn)
    
    CreatedBy = request.PerformedBy,
    CreatedAt = DateTime.Now
};

await _db.Invoices.AddAsync(adjustmentInvoice);
await _db.SaveChangesAsync();
```

**💡 Lợi ích của Single Table:**
- ✅ Đơn giản hóa query (không cần JOIN nhiều bảng)
- ✅ Tái sử dụng logic hiện tại (PDF generation, signing, etc.)
- ✅ Dễ tracking history (tất cả hóa đơn ở 1 bảng)
- ✅ Flexible: Dễ extend cho replacement invoice sau này
```

### **4. Auto-Detect Adjustment Type**

```csharp
// Tính tổng adjustment amount
var totalAdjustmentAmount = adjustmentItems.Sum(i => i.AdjustmentAmount);

// Auto-detect type
AdjustmentType adjustmentType;
if (totalAdjustmentAmount > 0)
    adjustmentType = AdjustmentType.INCREASE; // 0
else if (totalAdjustmentAmount < 0)
    adjustmentType = AdjustmentType.DECREASE; // 1
else
    throw new ValidationException("Không có điều chỉnh nào (tất cả adjustment amount = 0)");

// Save type
dbAdjustmentInvoice.AdjustmentType = adjustmentType;
```

### **5. Generate Adjustment Number**

```csharp
// Format: {OriginalNumber}-ADJ-{Sequence}
// Example: "AA/24E-0000027-ADJ-001"

var adjustmentCount = await _db.AdjustmentInvoices
    .CountAsync(a => a.OriginalInvoiceId == request.OriginalInvoiceId);

var adjustmentNumber = $"{originalInvoice.InvoiceNumber}-ADJ-{(adjustmentCount + 1):D3}";

dbAdjustmentInvoice.AdjustmentNumber = adjustmentNumber;
```

---

## 💾 Database Schema Changes

> **✅ PHƯƠNG ÁN ĐÃ CHỐT: Single Table (Dùng chung bảng Invoices)**
>
> - Extend bảng `Invoices` và `InvoiceItems` hiện tại
> - KHÔNG tạo bảng mới
> - Hóa đơn điều chỉnh = Invoice record mới với foreign key trỏ về hóa đơn gốc
> - Items lưu giá trị CHÊNH LỆCH (có thể âm/dương)

---

### **Migration 1: Extend Table Invoices**

```sql
-- Thêm cột mới vào bảng Invoices
ALTER TABLE Invoices ADD COLUMN (
    -- 🆕 Phân loại hóa đơn
    InvoiceType INT NOT NULL DEFAULT 0 CHECK (InvoiceType IN (0, 1, 2)),
    -- 0 = NORMAL (hóa đơn thường)
    -- 1 = ADJUSTMENT (hóa đơn điều chỉnh)
    -- 2 = REPLACEMENT (hóa đơn thay thế)
    
    -- 🆕 Tham chiếu đến hóa đơn gốc (nếu là điều chỉnh/thay thế)
    OriginalInvoiceID INT NULL,
    CONSTRAINT FK_Invoices_OriginalInvoice 
        FOREIGN KEY (OriginalInvoiceID) 
        REFERENCES Invoices(InvoiceID),
    
    -- 🆕 Dòng tham chiếu pháp lý (BẮT BUỘC cho hóa đơn điều chỉnh)
    ReferenceNote NVARCHAR(500) NULL,
    
    -- 🆕 Lý do điều chỉnh/thay thế
    AdjustmentReason NVARCHAR(500) NULL
);

-- 🔍 Indexes for performance
CREATE INDEX IX_Invoices_InvoiceType ON Invoices(InvoiceType);
CREATE INDEX IX_Invoices_OriginalInvoiceID ON Invoices(OriginalInvoiceID);

-- ✅ Constraint: ReferenceNote bắt buộc khi InvoiceType = 1 (ADJUSTMENT)
ALTER TABLE Invoices ADD CONSTRAINT CK_Invoices_ReferenceNote_Required
    CHECK (
        (InvoiceType = 1 AND ReferenceNote IS NOT NULL AND LEN(ReferenceNote) >= 30)
        OR InvoiceType != 1
    );

-- ✅ Constraint: OriginalInvoiceID bắt buộc khi InvoiceType IN (1, 2)
ALTER TABLE Invoices ADD CONSTRAINT CK_Invoices_OriginalInvoiceID_Required
    CHECK (
        (InvoiceType IN (1, 2) AND OriginalInvoiceID IS NOT NULL)
        OR InvoiceType = 0
    );
```

---

### **Migration 2: Extend Table InvoiceItems**

```sql
-- Thêm metadata cho items (KHÔNG cần thay đổi cấu trúc quantity/price)
-- Items của hóa đơn điều chỉnh sẽ lưu giá trị CHÊNH LỆCH (có thể âm)

ALTER TABLE InvoiceItems ADD COLUMN (
    -- 🆕 Metadata để tracking
    IsAdjustmentItem BIT NOT NULL DEFAULT 0,
    -- TRUE nếu là item của hóa đơn điều chỉnh
    
    -- 🆕 Link đến item gốc (optional, để dễ truy vết)
    OriginalItemID INT NULL,
    CONSTRAINT FK_InvoiceItems_OriginalItem 
        FOREIGN KEY (OriginalItemID) 
        REFERENCES InvoiceItems(InvoiceItemID)
);

-- 🔍 Index
CREATE INDEX IX_InvoiceItems_OriginalItemID ON InvoiceItems(OriginalItemID);

-- ⚠️ IMPORTANT: Các cột quantity, unitPrice, amount CÓ THỂ ÂM cho adjustment items
-- Backend phải handle validation: Final values không được âm
```

---

### **Ví dụ Data Structure**

#### **Hóa đơn gốc (InvoiceID = 27)**

```sql
-- Invoices table
InvoiceID: 27
InvoiceNumber: "AA/24E-0000027"
InvoiceType: 0 (NORMAL)
OriginalInvoiceID: NULL
ReferenceNote: NULL
TotalAmount: 60.500.000
...

-- InvoiceItems table
InvoiceItemID: 101
InvoiceID: 27
ProductID: 50
Quantity: 10
UnitPrice: 500.000
Amount: 5.000.000
IsAdjustmentItem: FALSE
OriginalItemID: NULL
```

#### **Hóa đơn điều chỉnh (InvoiceID = 35)**

```sql
-- Invoices table
InvoiceID: 35
InvoiceNumber: "AA/24E-0000027-ADJ-001"  -- Auto-generated format
InvoiceType: 1 (ADJUSTMENT)
OriginalInvoiceID: 27  -- ⬅️ Trỏ về hóa đơn gốc
ReferenceNote: "Điều chỉnh (giảm) cho hóa đơn Mẫu số 01GTKT0/001..."  -- ⬅️ BẮT BUỘC
AdjustmentReason: "Trả lại 2 sản phẩm do nhận thiếu"
TotalAmount: -1.100.000  -- ⬅️ Số ÂM (giảm giá trị)
InvoiceStatusID: 3 (ISSUED)
...

-- InvoiceItems table (lưu giá trị CHÊNH LỆCH)
InvoiceItemID: 250
InvoiceID: 35  -- ⬅️ Thuộc hóa đơn điều chỉnh
ProductID: 50
Quantity: -2  -- ⬅️ SỐ ÂM (giảm 2 cái)
UnitPrice: 500.000  -- Giá không đổi
Amount: -1.000.000  -- ⬅️ SỐ ÂM (chênh lệch)
VATAmount: -100.000  -- ⬅️ VAT âm
IsAdjustmentItem: TRUE
OriginalItemID: 101  -- ⬅️ Link về item gốc (optional)
```

---

### **Query Examples**

#### **1. Lấy tất cả hóa đơn điều chỉnh của một hóa đơn gốc**

```sql
SELECT 
    i.*,
    SUM(ii.Amount) as TotalAdjustmentAmount
FROM Invoices i
LEFT JOIN InvoiceItems ii ON i.InvoiceID = ii.InvoiceID
WHERE i.OriginalInvoiceID = 27  -- Hóa đơn gốc
  AND i.InvoiceType = 1          -- ADJUSTMENT
GROUP BY i.InvoiceID
ORDER BY i.CreatedAt DESC;
```

#### **2. Tính tổng giá trị sau tất cả điều chỉnh**

```sql
-- Hóa đơn gốc + tất cả điều chỉnh
SELECT 
    original.InvoiceNumber as OriginalInvoice,
    original.TotalAmount as OriginalAmount,
    COALESCE(SUM(adj.TotalAmount), 0) as TotalAdjustmentAmount,
    original.TotalAmount + COALESCE(SUM(adj.TotalAmount), 0) as FinalAmount
FROM Invoices original
LEFT JOIN Invoices adj 
    ON adj.OriginalInvoiceID = original.InvoiceID 
    AND adj.InvoiceType = 1
WHERE original.InvoiceID = 27
GROUP BY original.InvoiceID;
```

#### **3. Lấy chi tiết items với original + adjustment**

```sql
SELECT 
    p.ProductName,
    orig.Quantity as OriginalQuantity,
    orig.UnitPrice as OriginalUnitPrice,
    orig.Amount as OriginalAmount,
    adj.Quantity as AdjustmentQuantity,
    adj.UnitPrice as AdjustmentUnitPrice,
    adj.Amount as AdjustmentAmount,
    (orig.Quantity + adj.Quantity) as FinalQuantity,
    (orig.Amount + adj.Amount) as FinalAmount
FROM InvoiceItems orig
INNER JOIN Products p ON orig.ProductID = p.ProductID
LEFT JOIN InvoiceItems adj 
    ON adj.OriginalItemID = orig.InvoiceItemID
    AND adj.IsAdjustmentItem = 1
WHERE orig.InvoiceID = 27;
```

---

## 🔴 Error Response Schema

### **Validation Error (400 Bad Request)**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Reference text bắt buộc phải có ít nhất 30 ký tự (yêu cầu pháp lý)",
    "Sản phẩm 'Laptop Dell': Số lượng cuối (-2) không được âm"
  ],
  "data": null
}
```

### **Business Rule Error (409 Conflict)**

```json
{
  "success": false,
  "message": "Chỉ có thể điều chỉnh hóa đơn đã phát hành",
  "errors": [
    "Hóa đơn hiện tại có trạng thái 'Nháp' (Draft). Chỉ điều chỉnh được hóa đơn ở trạng thái 'Đã phát hành' (Issued)."
  ],
  "data": {
    "currentStatus": "Draft",
    "requiredStatus": "Issued"
  }
}
```

---

## 📋 Testing Scenarios

### **Test Case 1: Điều chỉnh TĂNG (Normal Case)**

**Request:**
```json
{
  "originalInvoiceId": 27,
  "performedBy": 5,
  "templateID": 3,
  "adjustmentReason": "Thiếu 2 sản phẩm trong hóa đơn gốc",
  "referenceText": "Điều chỉnh (tăng) cho hóa đơn Mẫu số 01GTKT0/001 Ký hiệu AA/24E Số 0000027 ngày 15 tháng 12 năm 2025",
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,
      "originalUnitPrice": 500000,
      "adjustmentQuantity": 2,
      "adjustmentUnitPrice": 0
    }
  ]
}
```

**Expected:**
- Status: 200 OK
- `adjustmentType`: 0 (INCREASE)
- `adjustmentTotalAmount`: +1.100.000 (2 × 500.000 + VAT 10%)

---

### **Test Case 2: Điều chỉnh GIẢM (Trả hàng một phần)**

**Request:**
```json
{
  "originalInvoiceId": 27,
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,
      "originalUnitPrice": 500000,
      "adjustmentQuantity": -3,
      "adjustmentUnitPrice": 0
    }
  ]
}
```

**Expected:**
- Status: 200 OK
- `adjustmentType`: 1 (DECREASE)
- `adjustmentTotalAmount`: -1.650.000 (số âm!)

---

### **Test Case 3: Điều chỉnh GIẢM giá (Price reduction)**

**Request:**
```json
{
  "originalInvoiceId": 27,
  "adjustmentItems": [
    {
      "productID": 102,
      "originalQuantity": 5,
      "originalUnitPrice": 10000000,
      "adjustmentQuantity": 0,
      "adjustmentUnitPrice": -1000000
    }
  ]
}
```

**Expected:**
- Status: 200 OK
- `adjustmentType`: 1 (DECREASE)
- `adjustmentTotalAmount`: -5.500.000 (5 × -1.000.000 + VAT)

---

### **Test Case 4: Validation Error - Số lượng âm**

**Request:**
```json
{
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,
      "adjustmentQuantity": -15  // ❌ Vượt quá số lượng gốc
    }
  ]
}
```

**Expected:**
- Status: 400 Bad Request
- Error: "Số lượng cuối (-5) không được âm"

---

### **Test Case 5: Trả hàng toàn bộ (Edge case)**

**Request:**
```json
{
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,
      "adjustmentQuantity": -10  // Trả hết
    }
  ]
}
```

**Expected:**
- Status: 200 OK
- `finalQuantity`: 0
- Warning log: "Full return detected"

---

### **Test Case 6: Không có điều chỉnh nào**

**Request:**
```json
{
  "adjustmentItems": [
    {
      "productID": 101,
      "originalQuantity": 10,
      "adjustmentQuantity": 0,
      "adjustmentUnitPrice": 0
    }
  ]
}
```

**Expected:**
- Status: 400 Bad Request
- Error: "Không có điều chỉnh nào (tất cả adjustment amount = 0)"

---

## 🎨 PDF Generation Requirements

### **1. Reference Text Display**

```
┌─────────────────────────────────────────────────────────┐
│  HÓA ĐƠN ĐIỀU CHỈNH - GIÁ TRỊ GIA TĂNG                  │
│                                                           │
│  ⚖️ THÔNG TIN THAM CHIẾU:                               │
│  Điều chỉnh (tăng) cho hóa đơn Mẫu số 01GTKT0/001       │
│  Ký hiệu AA/24E Số 0000027 ngày 15 tháng 12 năm 2025   │
└─────────────────────────────────────────────────────────┘
```

**CSS Styling:**
- Font: Bold, 14px
- Color: #d84315 (đỏ cam)
- Background: #fff3e0 (vàng nhạt)
- Border: 2px solid #ff9800

### **2. Items Table Format**

```
┌──────┬───────────────┬─────┬────────┬────────┬────────┬─────────────┐
│ STT  │ Tên HHDV      │ ĐVT │ SL Gốc │ SL Đ/C │ SL Cuối│ Thành tiền  │
├──────┼───────────────┼─────┼────────┼────────┼────────┼─────────────┤
│ 1    │ Laptop Dell   │ Cái │   10   │   -2   │    8   │ -1.000.000  │
│      │               │     │        │  (đỏ)  │        │    (đỏ)     │
└──────┴───────────────┴─────┴────────┴────────┴────────┴─────────────┘
```

**Color Coding:**
- Adjustment columns: Xanh (+), Đỏ (-)
- Adjustment amount: Xanh (+), Đỏ (-)

### **3. Summary Section**

```
┌─────────────────────────────────────────────────────────┐
│  TỔNG KẾT ĐIỀU CHỈNH:                                   │
│                                                           │
│  Tổng tiền hóa đơn gốc:        60.500.000 đ             │
│  Số tiền điều chỉnh:           +9.900.000 đ (màu xanh)  │
│  ────────────────────────────────────────────            │
│  Tổng tiền sau điều chỉnh:     70.400.000 đ             │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Phase 1: Database (Day 1)**
1. ✅ Run migration: Extend Invoices table (InvoiceType, OriginalInvoiceID, ReferenceNote, AdjustmentReason)
2. ✅ Run migration: Extend InvoiceItems table (IsAdjustmentItem, OriginalItemID)
3. ✅ Add constraints và indexes
4. ✅ Test insert/query với sample data
5. ✅ Verify foreign key relationships

### **Phase 2: API Endpoint (Day 2-3)**
1. ✅ Create DTOs (Request/Response) - giữ nguyên schema đã định
2. ✅ Implement validation logic (guardrails)
3. ✅ Implement calculation logic (adjustment amount)
4. ✅ Auto-detect adjustment type từ totalAdjustmentAmount
5. ✅ Generate adjustment number: `{OriginalNumber}-ADJ-{Sequence}`
6. ✅ Save to Invoices + InvoiceItems (với giá trị chênh lệch)
7. ✅ Build response với chi tiết items

### **Phase 3: PDF Generation (Day 4)**
1. ✅ Update PDF template: Add ReferenceNote field (nổi bật)
2. ✅ Modify items table: Add "SL Đ/C", "ĐG Đ/C", "Thành tiền Đ/C" columns
3. ✅ Implement color coding: Xanh (+), Đỏ (-)
4. ✅ Add summary section: Original + Adjustment + Final
5. ✅ Test với tất cả templates (màu xanh, đỏ, tím, vàng)

### **Phase 4: Testing (Day 5)**
1. ✅ Unit tests: 6 test cases (normal, edge, validation errors)
2. ✅ Integration tests: End-to-end flow
3. ✅ Database integrity tests: Foreign keys, constraints
4. ✅ Load testing: 100 concurrent adjustment requests
5. ✅ PDF generation performance test

### **Phase 5: Deployment (Day 6)**
1. ✅ Deploy migration to staging
2. ✅ Deploy API to staging
3. ✅ Frontend integration testing
4. ✅ UAT với business team (test với hóa đơn thật)
5. ✅ Fix bugs nếu có
6. ✅ Deploy to production (off-peak hours)

---

## 🔄 Migration Strategy (Production)

**⚠️ QUAN TRỌNG: Cách migrate dữ liệu cũ (nếu có)**

```sql
-- Đối với các record Invoices hiện tại
UPDATE Invoices 
SET InvoiceType = 0  -- NORMAL
WHERE InvoiceType IS NULL;

-- Đối với InvoiceItems hiện tại
UPDATE InvoiceItems 
SET IsAdjustmentItem = 0
WHERE IsAdjustmentItem IS NULL;

-- Verify không có record nào bị sót
SELECT COUNT(*) FROM Invoices WHERE InvoiceType IS NULL;
SELECT COUNT(*) FROM InvoiceItems WHERE IsAdjustmentItem IS NULL;
```

---

## 📞 Support & Questions

**Frontend Team Contact:**
- File: `CreateAdjustmentInvoice.tsx`
- Location: `/src/page/CreateAdjustmentInvoice.tsx`
- Lines: 3019 total (fully implemented)

**Key Functions to Reference:**
- `loadOriginalInvoice()` - Line ~840
- `processRowUpdate()` - Line ~1345 (calculation logic)
- `handleSubmitInvoice()` - Line ~1531
- Validation: Line ~1360 (guardrails)

---

## ✅ Acceptance Criteria

**Backend implementation được coi là HOÀN THÀNH khi:**

1. ✅ **Database:** Extend Invoices + InvoiceItems với các cột mới (InvoiceType, OriginalInvoiceID, ReferenceNote, etc.)
2. ✅ **API Request:** Nhận đầy đủ Original + Adjustment values từ frontend
3. ✅ **Validation:** 6 test cases pass (guardrails hoạt động đúng)
4. ✅ **Calculation:** Tính đúng adjustment amount = (FinalTotal - OriginalTotal)
5. ✅ **Storage:** Lưu giá trị CHÊNH LỆCH (có thể âm) vào InvoiceItems
6. ✅ **Auto-detect:** Xác định đúng INCREASE/DECREASE từ total adjustment amount
7. ✅ **PDF Generation:** ReferenceNote hiển thị nổi bật + color coding
8. ✅ **Response:** Return đầy đủ schema để frontend hiển thị summary
9. ✅ **Integration:** Frontend submit thành công và navigate to invoice list

---

## 🎯 Success Metrics

- **Response Time:** < 500ms (P95)
- **Success Rate:** > 99.5%
- **PDF Generation:** < 2 seconds
- **Validation Accuracy:** 100% (no false positives/negatives)
- **Database Query:** < 100ms for adjustment history lookup

---

## 📊 Traceability Matrix

| Requirement | Frontend Status | Backend Status | Test Coverage |
|-------------|----------------|----------------|---------------|
| Load original invoice | ✅ Done | ✅ Existing API | 100% |
| Input adjustment values | ✅ Done | ⏳ Need implement | - |
| Validate final >= 0 | ✅ Done (FE) | ⏳ Need implement (BE) | Test Case 4 |
| Calculate adjustment amount | ✅ Done | ⏳ Need implement | Test Case 1-3 |
| Reference text field | ✅ Done | ⏳ Need extend DB | Test validation |
| Template selection | ✅ Done | ✅ Existing | 100% |
| Auto-detect type | ⏳ Frontend sends | ⏳ Need implement | All cases |
| PDF with reference text | - | ⏳ Need implement | Manual QA |
| Return detailed response | - | ⏳ Need implement | Integration test |

---

## 🔗 Appendix: Key Differences vs Original Design

### **BEFORE (Rejected Approach): Separate Tables**
```
❌ AdjustmentInvoices (bảng riêng)
❌ AdjustmentInvoiceItems (bảng riêng)
❌ Lưu Original + Adjustment + Final (redundant)
❌ Phức tạp khi query/report
```

### **AFTER (Approved Approach): Single Table** ✅
```
✅ Extend Invoices (thêm InvoiceType, OriginalInvoiceID, ReferenceNote)
✅ Extend InvoiceItems (thêm IsAdjustmentItem, OriginalItemID)
✅ CHỈ lưu giá trị CHÊNH LỆCH (có thể âm)
✅ Đơn giản, flexible, dễ maintain
✅ Reuse existing logic (PDF, signing, status flow)
```

---

## 💬 Q&A

**Q1: Tại sao không tạo bảng riêng AdjustmentInvoices?**  
A: Single table approach đơn giản hơn, reuse được existing logic (PDF generation, workflow, permissions), dễ query lịch sử hóa đơn (tất cả ở 1 bảng).

**Q2: Items lưu giá trị chênh lệch hay giá trị cuối?**  
A: Lưu giá trị CHÊNH LỆCH (adjustment amount). Frontend sẽ calculate final values khi cần hiển thị.

**Q3: Làm sao biết hóa đơn nào là adjustment?**  
A: Check `InvoiceType = 1` hoặc `OriginalInvoiceID IS NOT NULL`.

**Q4: Nếu sau này cần thêm Replacement Invoice thì sao?**  
A: Chỉ cần thêm `InvoiceType = 2` (REPLACEMENT), logic tương tự. Single table rất flexible!

**Q5: ReferenceNote có bắt buộc không?**  
A: BẮT BUỘC cho adjustment invoice (constraint trong DB + validation trong API). Đây là yêu cầu pháp lý.

**Q6: PDF template cần thay đổi nhiều không?**  
A: Cần thêm field `ReferenceNote` (highlight) + adjust items table để show Original/Adjustment columns. Existing templates có thể reuse 90%.

---

**Document End** 🎉
