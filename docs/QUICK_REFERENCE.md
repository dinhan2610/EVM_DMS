# 🎯 Quick Reference - New APIs

## File Service

```typescript
import fileService from '@/services/fileService';

// HTML → PDF
const pdf = await fileService.convertHtmlToPdf(html);
fileService.downloadPdfBlob(pdf, 'invoice.pdf');

// XML Generation
const xml = await fileService.generateInvoiceXml(invoiceId);
```

## Invoice Service

```typescript
import invoiceService from '@/services/invoiceService';

// Preview
const result = await invoiceService.previewInvoice(data);

// Lookup (Public - No auth)
const invoice = await invoiceService.lookupInvoice('ABC123');

// Original Invoice
const original = await invoiceService.getOriginalInvoice(id);
```

## Tax Service

```typescript
import taxService from '@/services/taxService';

// Form 04SS
const form = await taxService.createForm04SSDraft({
  companyId: 1,
  period: '01/2024',
  invoiceIds: [1, 2, 3],
  declarationType: 'monthly',
});

// Send to CQT
const result = await taxService.sendFormToCQT(form.formId);
```

## Endpoints Added

### FILE
- `POST /File/upload`
- `POST /File/uploadXML`
- `POST /File/upload-template-image`
- `POST /File/convert-pdf-xml`
- `POST /File/generate-xml/{invoiceId}`
- `POST /File/pdf-from-html` ⭐

### INVOICE
- `POST /Invoice/preview` ⭐
- `GET /Invoice/lookup/{code}` ⭐
- `GET /Invoice/{id}/original`
- `GET /Invoice/{id}/pdf`

### TAX
- `POST /Tax/Create-Form04SS-Draft` ⭐
- `POST /Tax/{id}/send-form-to-CQT` ⭐
- `GET /Tax/{id}/preview`
- `GET /Tax/{id}/pdf`
- `POST /Tax/submit`

## Files Created/Modified

### New Files
- ✅ `src/services/fileService.ts`
- ✅ `src/examples/apiUsageExamples.ts`
- ✅ `docs/API_IMPLEMENTATION_COMPLETE.md`
- ✅ `docs/BACKEND_API_ANALYSIS.md`

### Modified Files
- ✅ `src/config/api.config.ts`
- ✅ `src/services/invoiceService.ts`
- ✅ `src/services/taxService.ts`

## Next Steps

1. Import services where needed
2. Test with real data
3. Add UI components for new features
4. Handle loading & error states

See [API_IMPLEMENTATION_COMPLETE.md](./API_IMPLEMENTATION_COMPLETE.md) for detailed guide.
