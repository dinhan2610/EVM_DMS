/**
 * Example Usage - Hướng dẫn sử dụng các API mới
 * File này demo cách implement các tính năng mới từ backend
 */

import fileService from '@/services/fileService';
import invoiceService from '@/services/invoiceService';
import taxService from '@/services/taxService';
import { exportTemplateToHTML } from '@/utils/templateHtmlExporter';
import type { BackendInvoiceRequest } from '@/utils/invoiceAdapter';

// ==================== 1. HTML TO PDF CONVERSION ====================

/**
 * ⭐ Export invoice template to PDF using backend rendering
 * Thay thế html2pdf.js bằng backend API cho quality tốt hơn
 */
export const exportInvoiceToPdfBackend = async (previewElement: HTMLElement) => {
  try {
    // Step 1: Export template to self-contained HTML
    const html = await exportTemplateToHTML(previewElement);
    
    // Step 2: Send to backend for PDF conversion
    const pdfBlob = await fileService.convertHtmlToPdf(html);
    
    // Step 3: Download PDF
    fileService.downloadPdfBlob(pdfBlob, 'invoice-template.pdf');
    
    // Or open in new tab
    // fileService.openPdfInNewTab(pdfBlob);
    
    console.log('✅ PDF exported successfully via backend');
  } catch (error) {
    console.error('❌ Failed to export PDF:', error);
    throw error;
  }
};

/**
 * Usage in TemplateEditor.tsx:
 * 
 * import { exportInvoiceToPdfBackend } from '@/examples/apiUsageExamples';
 * 
 * const handleExportPdf = async () => {
 *   if (!previewRef.current) return;
 *   await exportInvoiceToPdfBackend(previewRef.current);
 * };
 * 
 * <Button onClick={handleExportPdf}>
 *   Xuất PDF (Backend Render)
 * </Button>
 */

// ==================== 2. INVOICE PREVIEW ====================

/**
 * ⭐ Preview invoice before creating
 * Show preview modal to user để review trước khi save
 */
export const previewInvoiceBeforeCreate = async (invoiceData: BackendInvoiceRequest) => {
  try {
    // Backend validates and returns HTML preview
    const result = await invoiceService.previewInvoice(invoiceData);
    
    if (!result.isValid) {
      // Show validation errors
      console.error('Validation errors:', result.errors);
      alert('Dữ liệu không hợp lệ:\n' + result.errors?.join('\n'));
      return;
    }
    
    // Show preview HTML in modal/dialog
    const previewWindow = window.open('', '_blank');
    previewWindow?.document.write(result.html);
    
    console.log('✅ Preview generated successfully');
  } catch (error) {
    console.error('❌ Failed to preview invoice:', error);
    throw error;
  }
};

/**
 * Usage in CreateVatInvoice.tsx:
 * 
 * const handlePreview = async () => {
 *   const invoiceData = {
 *     templateId: selectedTemplate,
 *     customerID: customerId,
 *     items: invoiceItems,
 *     // ... other fields
 *   };
 *   
 *   await previewInvoiceBeforeCreate(invoiceData);
 * };
 * 
 * <Button onClick={handlePreview} variant="outlined">
 *   Xem Trước
 * </Button>
 */

// ==================== 3. PUBLIC INVOICE LOOKUP ====================

/**
 * ⭐ Public invoice lookup page (no authentication)
 * Customer tra cứu hóa đơn qua QR code
 */
export const lookupPublicInvoice = async (lookupCode: string) => {
  try {
    const invoice = await invoiceService.lookupInvoice(lookupCode);
    
    console.log('Invoice found:', invoice);
    
    // Display invoice info
    return {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      customer: invoice.customerName,
      total: invoice.totalAmount,
      status: invoice.status,
      qrCode: invoice.qrCodeUrl,
      pdfDownload: invoice.pdfUrl,
    };
  } catch (error) {
    console.error('❌ Invoice not found:', error);
    throw error;
  }
};

/**
 * Usage - Tạo trang tra cứu công khai:
 * 
 * // src/page/PublicInvoiceLookup.tsx
 * const PublicInvoiceLookup = () => {
 *   const [lookupCode, setLookupCode] = useState('');
 *   const [invoice, setInvoice] = useState(null);
 *   
 *   const handleLookup = async () => {
 *     const result = await lookupPublicInvoice(lookupCode);
 *     setInvoice(result);
 *   };
 *   
 *   return (
 *     <div>
 *       <input 
 *         value={lookupCode}
 *         onChange={(e) => setLookupCode(e.target.value)}
 *         placeholder="Nhập mã tra cứu"
 *       />
 *       <button onClick={handleLookup}>Tra cứu</button>
 *       {invoice && <InvoiceDetails {...invoice} />}
 *     </div>
 *   );
 * };
 */

// ==================== 4. TAX FORM 04SS ====================

/**
 * ⭐ Create and submit tax form (Tờ khai thuế GTGT)
 */
export const createAndSubmitTaxForm = async (
  period: string, // "01/2024"
  invoiceIds: number[]
) => {
  try {
    // Step 1: Create Form 04SS draft
    const form = await taxService.createForm04SSDraft({
      companyId: 1,
      period,
      invoiceIds,
      declarationType: 'monthly',
      notes: 'Tờ khai thuế tháng ' + period,
    });
    
    console.log('Form created:', form);
    console.log('Total Revenue:', form.totalRevenue);
    console.log('Total VAT:', form.totalVAT);
    
    // Step 2: Preview form (optional)
    await taxService.previewTaxForm(form.formId);
    console.log('Preview HTML available');
    
    // Step 3: Export PDF for review
    await taxService.downloadTaxFormPdf(form.formId, `Form04SS_${period}.pdf`);
    
    // Step 4: Send to CQT (after user confirms)
    const confirmSend = confirm('Xác nhận gửi tờ khai lên Cơ quan thuế?');
    if (confirmSend) {
      const result = await taxService.sendFormToCQT(form.formId);
      console.log('✅ Sent to CQT:', result);
      alert(`Gửi thành công! Mã giao dịch: ${result.transactionCode}`);
    }
    
  } catch (error) {
    console.error('❌ Tax form submission failed:', error);
    throw error;
  }
};

/**
 * Usage in Dashboard/TaxManagement:
 * 
 * const handleGenerateTaxForm = async () => {
 *   // Get all issued invoices for the month
 *   const invoices = await invoiceService.getAllInvoices({
 *     month: '01/2024',
 *     statusIds: [2] // Issued status
 *   });
 *   
 *   const invoiceIds = invoices.map(inv => inv.invoiceID);
 *   
 *   await createAndSubmitTaxForm('01/2024', invoiceIds);
 * };
 */

// ==================== 5. XML GENERATION ====================

/**
 * ⭐ Generate and download invoice XML for tax authority
 */
export const exportInvoiceXml = async (invoiceId: number) => {
  try {
    const xmlBlob = await fileService.generateInvoiceXml(invoiceId);
    
    // Download XML file
    const url = URL.createObjectURL(xmlBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceId}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ XML exported successfully');
  } catch (error) {
    console.error('❌ Failed to export XML:', error);
    throw error;
  }
};

/**
 * Usage in InvoiceManagement:
 * 
 * <MenuItem onClick={() => exportInvoiceXml(invoice.invoiceID)}>
 *   📄 Xuất XML (CQT)
 * </MenuItem>
 */

// ==================== 6. GET ORIGINAL INVOICE ====================

/**
 * ⭐ View original invoice when viewing adjusted invoice
 */
export const viewOriginalInvoice = async (adjustedInvoiceId: number) => {
  try {
    const original = await invoiceService.getOriginalInvoice(adjustedInvoiceId);
    
    console.log('Original invoice:', original);
    
    // Show comparison view
    return {
      originalNumber: original.invoiceNumber,
      originalTotal: original.totalAmount,
      // originalItems: Not available in BackendInvoiceResponse
      // ... compare with adjusted invoice
    };
  } catch (error) {
    console.error('❌ Failed to get original invoice:', error);
    throw error;
  }
};

/**
 * Usage in AdjustmentInvoiceDetail:
 * 
 * const AdjustmentInvoiceDetail = ({ invoiceId }) => {
 *   const [original, setOriginal] = useState(null);
 *   
 *   useEffect(() => {
 *     loadOriginal();
 *   }, [invoiceId]);
 *   
 *   const loadOriginal = async () => {
 *     const orig = await viewOriginalInvoice(invoiceId);
 *     setOriginal(orig);
 *   };
 *   
 *   return (
 *     <div>
 *       <h3>Hóa đơn điều chỉnh</h3>
 *       <InvoiceDisplay invoice={currentInvoice} />
 *       
 *       <h3>So sánh với hóa đơn gốc</h3>
 *       <InvoiceDisplay invoice={original} />
 *     </div>
 *   );
 * };
 */

// ==================== COMPLETE WORKFLOW EXAMPLE ====================

/**
 * Complete workflow: Create invoice → Preview → Export PDF → Submit Tax
 */
export const completeInvoiceWorkflow = async (invoiceData: BackendInvoiceRequest) => {
  try {
    // 1. Preview before creating
    console.log('Step 1: Previewing invoice...');
    const preview = await invoiceService.previewInvoice(invoiceData);
    if (!preview.isValid) {
      throw new Error('Invalid invoice data');
    }
    
    // 2. Create invoice
    console.log('Step 2: Creating invoice...');
    const invoice = await invoiceService.createInvoice(invoiceData);
    console.log('Invoice created:', invoice.invoiceID);
    
    // 3. Export PDF via backend
    console.log('Step 3: Exporting PDF...');
    const html = preview.html; // Use preview HTML
    const pdfBlob = await fileService.convertHtmlToPdf(html);
    fileService.downloadPdfBlob(pdfBlob, `invoice-${invoice.invoiceNumber}.pdf`);
    
    // 4. Generate XML for tax authority
    console.log('Step 4: Generating XML...');
    await fileService.generateInvoiceXml(invoice.invoiceID);
    // XML generated and ready for submission
    
    // 5. Submit to tax authority
    console.log('Step 5: Submitting to tax...');
    const taxCode = await taxService.submitInvoiceToTax(invoice.invoiceID);
    console.log('Tax code:', taxCode);
    
    // 6. Send email to customer
    console.log('Step 6: Sending email...');
    await invoiceService.sendInvoiceEmail(invoice.invoiceID, {
      recipientEmail: 'customer@example.com', // Use actual customer email from your system
      includePdf: true,
      includeXml: true,
    });
    
    console.log('✅ Complete workflow finished successfully!');
    
    return {
      invoiceId: invoice.invoiceID,
      invoiceNumber: invoice.invoiceNumber,
      taxCode,
      status: 'completed',
    };
    
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
};

export default {
  exportInvoiceToPdfBackend,
  previewInvoiceBeforeCreate,
  lookupPublicInvoice,
  createAndSubmitTaxForm,
  exportInvoiceXml,
  viewOriginalInvoice,
  completeInvoiceWorkflow,
};
