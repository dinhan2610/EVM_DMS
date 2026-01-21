# 📊 Backend API Analysis - EIMS System

**Base URL:** `https://eims.site/api`  
**Swagger:** `https://eims.site/swagger/index.html`  
**Date:** 21/01/2026

---

## 🔍 TỔNG QUAN THAY ĐỔI

### ✅ API Endpoints Structure (So sánh với Frontend)

| Module | Endpoints | Status | Frontend Code |
|--------|-----------|--------|---------------|
| **InvoiceTemplate** | 6 endpoints | ✅ Match | templateService.ts |
| **Invoice** | 20+ endpoints | ✅ Match | invoiceService.ts |
| **Company** | 3 endpoints | ✅ Match | companyService.ts |
| **File** | 6 endpoints | ✅ New | Chưa implement |
| **Serial** | 2 endpoints | ✅ Match | templateService.ts |
| **Prefix** | 1 endpoint | ✅ Match | invoiceSymbolService.ts |

---

## 📋 CHI TIẾT CÁC API GROUP

### 1. **InvoiceTemplate APIs**

```
POST   /api/InvoiceTemplate              ✅ Create template
GET    /api/InvoiceTemplate              ✅ Get all templates
GET    /api/InvoiceTemplate/{id}         ✅ Get by ID
PUT    /api/InvoiceTemplate/{id}         ✅ Update template
GET    /api/InvoiceTemplate/{id}/view    ⚠️ CHưA SỬ DỤNG (view detail)
GET    /api/InvoiceTemplate/preview-template/{templateId}  ✅ Preview HTML
```

**Frontend Implementation:**
```typescript
// src/services/templateService.ts
✅ createTemplate(data)
✅ getAllTemplates()
✅ getTemplateById(id)
✅ updateTemplate(id, data)
✅ getTemplatePreviewHtml(id) // preview-template endpoint
❌ getTemplateView(id)         // /view endpoint - CHƯA IMPLEMENT
```

**Schemas Backend:**
- `CreateTemplateRequest`: templateName, serialID, templateTypeID, layoutDefinition, templateFrameID, logoUrl, **renderedHtml?**
- `UpdateTemplateRequest`: Similar to Create

**⚠️ PHÁT HIỆN:**
- Backend đã có field `renderedHtml` trong schema (theo doc guide)
- Frontend đã implement export HTML và gửi lên
- Endpoint `/api/InvoiceTemplate/{id}/view` chưa được dùng → có thể dùng để xem template detail page

---

### 2. **Invoice APIs**

```
POST   /api/Invoice                      ✅ Create invoice
GET    /api/Invoice                      ✅ Get all (with filters)
POST   /api/Invoice/preview              ⚠️ PREVIEW (chưa implement FE)
GET    /api/Invoice/{id}                 ✅ Get by ID
PUT    /api/Invoice/{id}                 ✅ Update invoice
GET    /api/Invoice/{id}/original        ⚠️ Get original (before adjustment)
GET    /api/Invoice/hodInvoices          ✅ HOD invoices
GET    /api/Invoice/sale-assigned        ✅ Sales assigned
PUT    /api/Invoice/draft/{id}           ✅ Update draft
POST   /api/Invoice/{invoiceId}/sign     ✅ Sign invoice
POST   /api/Invoice/{id}/issue           ✅ Issue invoice
POST   /api/Invoice/adjustment           ✅ Create adjustment
POST   /api/Invoice/replacement          ✅ Create replacement
PATCH  /api/Invoice/{id}/status          ✅ Update status
POST   /api/Invoice/get-hash             ⚠️ Get hash for signing
POST   /api/Invoice/complete_signing     ⚠️ Complete signing process
GET    /api/Invoice/preview-by-invoice/{id}  ⚠️ Preview by invoice ID
GET    /api/Invoice/{id}/pdf             ✅ Export PDF
GET    /api/Invoice/user                 ✅ Get user invoices
GET    /api/Invoice/lookup/{lookupCode}  ⚠️ Lookup by code
```

**Frontend Coverage:**
```typescript
// src/services/invoiceService.ts
✅ createInvoice(data)
✅ getAllInvoices(params)
✅ getInvoiceById(id)
✅ updateInvoice(id, data)
✅ issueInvoice(invoiceId, issuerId)
✅ createAdjustmentInvoice(data)
✅ createReplacementInvoice(data)

❌ previewInvoice(data)              // POST /Invoice/preview
❌ getOriginalInvoice(id)            // GET /Invoice/{id}/original
❌ getInvoiceHash(data)              // POST /Invoice/get-hash
❌ completeSigning(data)             // POST /Invoice/complete_signing
❌ previewByInvoiceId(id)            // GET /Invoice/preview-by-invoice/{id}
❌ lookupInvoice(lookupCode)         // GET /Invoice/lookup/{code}
```

**⚠️ PHÁT HIỆN:**
- **Invoice Preview API** (`POST /api/Invoice/preview`) → có thể dùng để preview trước khi tạo invoice
- **Signing APIs** (get-hash, complete_signing) → flow ký số điện tử chưa implement đầy đủ
- **Lookup API** → search invoice by lookup code (public facing)

---

### 3. **File APIs** 🆕

```
POST   /api/File/upload                  ⚠️ Upload file
POST   /api/File/uploadXML               ⚠️ Upload XML
POST   /api/File/convert-pdf-xml         ⚠️ Convert PDF to XML
POST   /api/File/generate-xml/{invoiceId} ⚠️ Generate XML for invoice
POST   /api/File/upload-template-image   ✅ Upload template image
POST   /api/File/pdf-from-html           ⚠️ Convert HTML to PDF
```

**Frontend Implementation:**
```typescript
// src/services/templateService.ts
✅ uploadTemplateLogo(file) // Sử dụng /File/upload-template-image

❌ uploadFile(file)                   // Generic file upload
❌ uploadXML(file)                    // XML upload
❌ convertPdfToXml(file)              // PDF → XML
❌ generateInvoiceXml(invoiceId)      // Generate XML
❌ convertHtmlToPdf(html)             // HTML → PDF (Backend render)
```

**⚠️ PHÁT HIỆN:**
- **`POST /api/File/pdf-from-html`** → Backend có thể render HTML thành PDF!
  - Input: HTML string
  - Output: PDF file
  - **Use case**: Thay vì frontend export PDF, có thể gửi HTML lên backend
- **XML APIs** → Tích hợp với Cơ quan thuế (chưa implement frontend)

---

### 4. **Company APIs**

```
GET    /api/Company/{id}                 ✅ Get company info
PUT    /api/Company/{id}                 ✅ Update company
POST   /api/Company/upload-signature     ⚠️ Upload chữ ký
```

**Frontend Implementation:**
```typescript
// src/services/companyService.ts
✅ getDefaultCompany()     // GET /Company/1
✅ updateCompany(id, data) // PUT /Company/{id}

❌ uploadSignature(file)   // POST /Company/upload-signature
```

**⚠️ PHÁT HIỆN:**
- Upload signature API chưa được sử dụng
- Frontend đang hardcode `/Company/1` → có thể cần dynamic company selection

---

### 5. **Email APIs** 🆕

```
POST   /api/Email/{invoiceId}/send-email     ✅ Send invoice email
POST   /api/Email/{invoiceId}/send-minutes   ⚠️ Send meeting minutes
POST   /api/Email/preview-minutes            ⚠️ Preview minutes
```

**Frontend Implementation:**
```typescript
// Currently in invoiceService.ts
✅ sendInvoiceEmail(invoiceId, emailData)

❌ sendMinutes(invoiceId, data)
❌ previewMinutes(data)
```

---

### 6. **Tax APIs** 🆕

```
POST   /api/Tax/submit                    ⚠️ Submit to tax authority
POST   /api/Tax/Create-Form04SS-Draft     ⚠️ Create Form 04SS draft
POST   /api/Tax/{id}/send-form-to-CQT     ⚠️ Send form to CQT
GET    /api/Tax/{id}/preview              ⚠️ Preview tax form
GET    /api/Tax/{id}/pdf                  ⚠️ Export tax form PDF
```

**Frontend Implementation:**
```typescript
❌ submitToTax(data)
❌ createForm04SSDraft(data)
❌ sendFormToCQT(id)
❌ previewTaxForm(id)
❌ exportTaxFormPdf(id)
```

**⚠️ PHÁT HIỆN:**
- Toàn bộ Tax integration APIs chưa có frontend implementation
- Form 04SS (Tờ khai thuế) APIs đã ready ở backend

---

## 🚨 CÁC API QUAN TRỌNG CHƯA IMPLEMENT

### **1. Invoice Preview (Trước khi tạo)**

```
POST /api/Invoice/preview
Body: InvoiceDTO (same as create)
Response: Preview HTML or validation result
```

**Use case:**
- User điền form → Preview trước khi save
- Validate data trước khi commit
- Show preview của invoice với template

**Implementation:**
```typescript
// src/services/invoiceService.ts
export const previewInvoice = async (data: BackendInvoiceRequest): Promise<{html: string}> => {
  const response = await axios.post('/api/Invoice/preview', data);
  return response.data;
};

// Usage in CreateInvoice.tsx
const handlePreview = async () => {
  const html = await invoiceService.previewInvoice(invoiceData);
  setPreviewHtml(html);
};
```

---

### **2. HTML to PDF Conversion (Backend)**

```
POST /api/File/pdf-from-html
Body: { html: string }
Response: PDF file (blob)
```

**Use case:**
- Thay vì frontend dùng html2pdf
- Backend render PDF với font chuẩn
- Consistent formatting

**Implementation:**
```typescript
// src/services/fileService.ts
export const convertHtmlToPdf = async (html: string): Promise<Blob> => {
  const response = await axios.post('/api/File/pdf-from-html', 
    { html },
    { responseType: 'blob' }
  );
  return response.data;
};

// Usage
const pdfBlob = await fileService.convertHtmlToPdf(invoiceHtml);
const url = URL.createObjectURL(pdfBlob);
window.open(url);
```

---

### **3. XML Generation & Tax Submission**

```
POST /api/File/generate-xml/{invoiceId}
Response: XML file for tax authority

POST /api/Tax/submit
Body: Tax submission data
Response: Submission result
```

**Use case:**
- Export invoice XML theo format CQT
- Submit trực tiếp lên hệ thống thuế

---

### **4. Invoice Lookup (Public)**

```
GET /api/Invoice/lookup/{lookupCode}
Response: Invoice details (public info)
```

**Use case:**
- Khách hàng tra cứu hóa đơn không cần login
- QR code → lookup page
- Public invoice verification

---

## 📊 SO SÁNH API CONFIG

### **Frontend (api.config.ts)**
```typescript
BASE_URL: '/api'  // Relative path (proxy)

ENDPOINTS: {
  TEMPLATE: {
    CREATE: '/InvoiceTemplate',
    PREVIEW_HTML: (id) => `/InvoiceTemplate/preview-template/${id}`,
  },
  INVOICE: {
    CREATE: '/Invoice',
    SEND_EMAIL: (id) => `/api/Email/${id}/send-email`,  // ⚠️ Double /api
  }
}
```

### **Backend (Swagger)**
```
Base: https://eims.site/api

All endpoints: /api/{Controller}/{Action}
Example: /api/InvoiceTemplate
         /api/Invoice/preview
         /api/File/pdf-from-html
```

**⚠️ PHÁT HIỆN:**
- Frontend có 1 chỗ dùng `/api/Email` → double prefix
- Nên sửa thành: `SEND_EMAIL: (id) => \`/Email/\${id}/send-email\``

---

## ✅ KHUYẾN NGHỊ

### **1. Priority High - Implement ngay**

```typescript
// 1. File Service (HTML → PDF)
export const convertHtmlToPdf = async (html: string): Promise<Blob> => {
  const response = await axios.post(
    `${API_CONFIG.BASE_URL}/File/pdf-from-html`,
    { html },
    { 
      headers: getAuthHeaders(),
      responseType: 'blob' 
    }
  );
  return response.data;
};

// 2. Invoice Preview
export const previewInvoice = async (data: BackendInvoiceRequest) => {
  const response = await axios.post(
    `${API_CONFIG.BASE_URL}/Invoice/preview`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// 3. Invoice Lookup (Public)
export const lookupInvoice = async (lookupCode: string) => {
  const response = await axios.get(
    `${API_CONFIG.BASE_URL}/Invoice/lookup/${lookupCode}`
    // No auth headers - public endpoint
  );
  return response.data;
};
```

### **2. Priority Medium - Nâng cao**

- **Tax APIs**: Form 04SS, submit to CQT
- **XML Generation**: Export invoice XML
- **Signature Upload**: Company signature management
- **Original Invoice**: Get invoice before adjustment

### **3. Priority Low - Nice to have**

- **Email Minutes**: Meeting minutes feature
- **Template View**: Detailed template view page

---

## 🔧 CẦN SỬA

### **1. Fix Double /api Prefix**

```typescript
// src/config/api.config.ts
INVOICE: {
  SEND_EMAIL: (id: number) => `/Email/${id}/send-email`,  // ✅ Remove /api
}
```

### **2. Add Missing Endpoints**

```typescript
// Add to api.config.ts
FILE: {
  UPLOAD: '/File/upload',
  UPLOAD_XML: '/File/uploadXML',
  CONVERT_PDF_XML: '/File/convert-pdf-xml',
  GENERATE_XML: (invoiceId: number) => `/File/generate-xml/${invoiceId}`,
  HTML_TO_PDF: '/File/pdf-from-html',  // ⭐ Important
},
TAX: {
  SUBMIT: '/Tax/submit',
  CREATE_FORM04SS: '/Tax/Create-Form04SS-Draft',
  SEND_TO_CQT: (id: number) => `/Tax/${id}/send-form-to-CQT`,
  PREVIEW: (id: number) => `/Tax/${id}/preview`,
  EXPORT_PDF: (id: number) => `/Tax/{id}/pdf`,
}
```

---

## 📈 TỔNG KẾT

### ✅ Đã Match với Backend
- InvoiceTemplate APIs (6/6)
- Invoice Core APIs (10/20)
- Company APIs (2/3)
- Serial/Prefix APIs (100%)

### ⚠️ Chưa Implement
- File APIs (5/6 endpoints)
- Tax APIs (0/5 endpoints)
- Invoice Advanced (10 endpoints)
- Email Minutes (2 endpoints)

### 🎯 Next Steps
1. ✅ Implement `POST /File/pdf-from-html` - Export PDF ở backend
2. ✅ Implement `POST /Invoice/preview` - Preview trước khi tạo
3. ✅ Add Tax submission flows
4. ✅ Fix double `/api` prefix trong email endpoint
5. ⚠️ Test `renderedHtml` field trong template creation

**Backend API structure rất đầy đủ và chuẩn chỉnh. Frontend cần bổ sung các features nâng cao.**
