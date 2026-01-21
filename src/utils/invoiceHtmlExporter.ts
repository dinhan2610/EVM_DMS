/**
 * ============================================================================
 * Invoice HTML Exporter - Convert React to Self-Contained HTML
 * ============================================================================
 * 
 * Converts InvoiceTemplatePreview React component to standalone HTML
 * that matches 100% with React UI styling.
 * 
 * Usage:
 * ```typescript
 * import { exportInvoiceToHTML } from '@/utils/invoiceHtmlExporter';
 * 
 * const html = await exportInvoiceToHTML(previewRef.current, {
 *   companyName: 'ABC Company',
 *   products: [...],
 *   // ... other data
 * });
 * 
 * // Send to backend
 * await api.saveInvoiceHTML(html);
 * ```
 */

import { numberToWords } from './numberToWords';

export interface InvoiceData {
  // Basic info
  invoiceNumber?: string;
  invoiceDate?: string;
  symbol: {
    invoiceType: string;
    taxCode: string;
    year: string;
    invoiceForm: string;
    management: string;
  };
  taxAuthorityCode?: string;
  invoiceType: 'withCode' | 'withoutCode';
  
  // Settings
  bilingual?: boolean;
  backgroundFrame?: string;
  
  // Company info
  companyName: string;
  companyTaxCode: string;
  companyPhone: string;
  companyAddress: string;
  companyBankAccount: string;
  
  // Customer info
  buyerName?: string;
  customerCompanyName?: string;
  customerTaxCode?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerEmail?: string;
  paymentMethod?: string;
  
  // Products
  products: Array<{
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>;
  
  // Totals
  totals: {
    subtotal: number;
    discount: number;
    subtotalAfterDiscount: number;
    tax: number;
    total: number;
  };
  
  // Notes
  notes?: string;
  
  // Visibility flags
  showQrCode?: boolean;
  showSignature?: boolean;
}

/**
 * Format number to Vietnamese locale (dot as thousands separator)
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString('vi-VN');
};

/**
 * Format date to Vietnamese format
 */
const formatDate = (dateStr?: string): { day: number; month: number; year: number } => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
};

/**
 * Render bilingual text
 */
const renderBilingual = (vn: string, en: string, isBilingual: boolean): string => {
  if (!isBilingual) return vn;
  return `${vn}<span class="bilingual-text">(${en})</span>`;
};

/**
 * Generate product rows HTML
 */
const generateProductRows = (products: InvoiceData['products']): string => {
  return products.map((product, index) => {
    const amount = product.quantity * product.unitPrice;
    return `
    <tr>
      <td class="td-center">${index + 1}</td>
      <td class="td-left">${product.name}</td>
      <td class="td-center">${product.unit}</td>
      <td class="td-center">${product.quantity}</td>
      <td class="td-right">${formatNumber(product.unitPrice)}</td>
      <td class="td-center">${product.vatRate}%</td>
      <td class="td-right">${formatNumber(amount)}</td>
    </tr>`;
  }).join('\n');
};

/**
 * Main export function - Generate complete HTML from invoice data
 */
export const exportInvoiceToHTML = (data: InvoiceData): string => {
  const {
    invoiceNumber,
    invoiceDate,
    symbol,
    taxAuthorityCode,
    invoiceType,
    bilingual = false,
    backgroundFrame,
    companyName,
    companyTaxCode,
    companyPhone,
    companyAddress,
    companyBankAccount,
    buyerName,
    customerCompanyName,
    customerTaxCode,
    customerPhone,
    customerAddress,
    customerEmail,
    paymentMethod,
    products,
    totals,
    notes,
    showQrCode = true,
    showSignature = true,
  } = data;

  const isDraft = !invoiceNumber || invoiceNumber.trim() === '';
  const date = formatDate(invoiceDate);
  const symbolString = `${symbol.invoiceType}${symbol.taxCode}${symbol.year}${symbol.invoiceForm}${symbol.management}`;
  const invoiceNumberFormatted = invoiceNumber ? String(invoiceNumber).padStart(7, '0') : '';
  const amountInWords = totals.total > 0 ? numberToWords(totals.total) : '';

  // Read template file content
  const templateHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hóa đơn GTGT${invoiceNumber ? ` - ${invoiceNumberFormatted}` : ' - BẢN NHÁP'}</title>
  <style>
    /* Inline all styles from invoice-template-static.html */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Roboto", "Helvetica", "Arial", sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background-color: #f5f5f5; color: rgba(0, 0, 0, 0.87); line-height: 1.5; font-size: 1rem; font-weight: 400; letter-spacing: 0.00938em; }
    .invoice-paper { margin: 0 auto; padding: 1.5cm 1.2cm; width: 100%; max-width: 210mm; min-height: 297mm; box-sizing: border-box; background-color: #fff; overflow: visible; display: flex; flex-direction: column; position: relative; box-shadow: none; background-size: 100% 100%; background-position: center; background-repeat: no-repeat; }
    @media print { body { background: white; } .invoice-paper { width: 210mm; max-width: 210mm; padding: 1.2cm 1cm; box-shadow: none; margin: 0; min-height: 0; } }
    @media (max-width: 900px) { .invoice-paper { width: 100%; max-width: 100%; padding: 1.5rem 1rem; min-height: auto; } }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: 900; color: rgba(255, 107, 107, 0.15); text-transform: uppercase; letter-spacing: 20px; pointer-events: none; z-index: 0; user-select: none; white-space: nowrap; }
    .content-wrapper { position: relative; flex: 1; display: flex; flex-direction: column; z-index: 1; }
    .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; margin-top: 4px; position: relative; min-height: 80px; }
    .logo-container { flex: 0 0 auto; min-width: 130px; position: relative; }
    .logo-wrapper { position: relative; width: 120px; height: auto; }
    .logo-wrapper img { width: 120px; height: auto; object-fit: contain; display: block; margin-top: -55px; }
    .title-container { position: absolute; left: 50%; transform: translateX(-50%); width: 60%; max-width: 500px; text-align: center; z-index: 1; }
    .main-title { text-transform: uppercase; font-size: 1.65rem; font-weight: 700; line-height: 1.3; letter-spacing: 0; margin-bottom: 1.6px; white-space: nowrap; max-width: 95%; overflow: hidden; text-overflow: ellipsis; margin-left: auto; margin-right: auto; }
    .subtitle-bilingual { font-size: 0.95rem; font-weight: 700; text-transform: uppercase; line-height: 1.2; letter-spacing: 0; margin-bottom: 4px; white-space: nowrap; }
    .header-spacer { flex: 1 1 auto; }
    .metadata-row { display: flex; justify-content: space-between; margin-bottom: 2.4px; margin-top: -8px; }
    .metadata-col { flex: 1 1 0%; }
    .metadata-col-center { text-align: center; }
    .metadata-col-right { text-align: right; }
    .metadata-text { font-size: 0.75rem; line-height: 1.5; margin-bottom: 1.6px; font-weight: 400; letter-spacing: 0.00938em; }
    .metadata-text.italic { font-style: italic; }
    .metadata-symbol { font-size: 0.75rem; line-height: 1.8; margin-bottom: 4px; font-weight: 400; }
    .draft-badge { color: #ff6b6b; font-weight: 600; font-style: italic; background-color: #fff3cd; padding: 2px 6px; border-radius: 3px; border: 1px solid #ffc107; display: inline; }
    .divider { border: none; border-top: 1px solid rgba(0, 0, 0, 0.12); margin: 8px 0; }
    .company-section { display: flex; gap: 24px; margin-bottom: 9.6px; }
    .company-info-col { flex: 82 1 0%; }
    .qr-col { flex: 18 1 0%; text-align: right; }
    .info-text { font-size: 0.75rem; line-height: 1.6; margin-bottom: 2.4px; overflow: hidden; text-overflow: ellipsis; font-weight: 400; letter-spacing: 0.00938em; }
    .info-text:last-child { margin-bottom: 0; }
    .two-col-row { display: flex; gap: 24px; margin-bottom: 2.4px; }
    .two-col-item { width: calc(50% - 12px); }
    .qr-placeholder { width: 65px; height: 65px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; border-radius: 4px; margin-left: auto; font-size: 0.7rem; color: rgba(0, 0, 0, 0.6); }
    .customer-section { display: flex; gap: 24px; margin-bottom: 8px; }
    .customer-info-col { flex: 82 1 0%; }
    .customer-spacer-col { flex: 18 1 0%; }
    .table-container { margin: 8px 0; background: transparent; }
    .product-table { width: 100%; border-collapse: collapse; border: 1px solid #000; background: transparent; font-size: 0.875rem; }
    .product-table th { font-weight: 700; font-size: 0.75rem; padding: 5px 6px; border: 1px solid #000; background: transparent; vertical-align: middle; text-align: center; }
    .th-main { font-size: 0.75rem; font-weight: 700; line-height: 1.3; }
    .th-bilingual { font-size: 0.7rem; font-style: italic; line-height: 1.3; font-weight: 400; }
    .col-stt { width: 40px; }
    .col-name { min-width: 180px; }
    .col-unit { width: 50px; }
    .col-qty { width: 60px; }
    .col-price { width: 85px; }
    .col-vat { width: 55px; }
    .col-total { width: 90px; }
    .product-table td { font-size: 0.8rem; padding: 6px 8px; border: 1px solid #000; background: transparent; vertical-align: middle; }
    .td-center { text-align: center; }
    .td-left { text-align: left; }
    .td-right { text-align: right; }
    .notes-cell-empty { padding: 4px 8px; border: 1px solid #000; border-top: none; background: transparent; }
    .notes-cell { font-style: italic; padding: 0 8px 4px 24px; font-size: 0.75rem; color: rgba(0, 0, 0, 0.6); border: 1px solid #000; border-top: none; background: transparent; }
    .notes-placeholder { color: #aaa; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 8px; align-items: flex-start; }
    .totals-box { width: 50%; }
    .totals-stack { display: flex; flex-direction: column; gap: 3.2px; }
    .totals-row { display: flex; flex-direction: row; justify-content: space-between; align-items: center; }
    .totals-label { font-size: 0.8rem; font-weight: 400; }
    .totals-value { font-size: 0.8rem; font-weight: 700; }
    .totals-discount { color: #d32f2f; }
    .totals-divider { border: none; border-top: 1px solid rgba(0, 0, 0, 0.12); margin: 3.2px 0; }
    .totals-final-label { font-size: 0.9rem; font-weight: 700; }
    .totals-final-value { font-size: 0.9rem; font-weight: 700; color: #1976d2; }
    .amount-words { margin-bottom: 12px; font-style: italic; font-size: 0.8rem; line-height: 1.6; font-weight: 400; }
    .signature-section { display: flex; gap: 24px; margin-top: 14.4px; }
    .signature-col { flex: 1 1 0%; text-align: center; }
    .signature-title { font-size: 0.8rem; font-weight: 700; margin-bottom: 3.2px; }
    .signature-subtitle { font-size: 0.75rem; font-style: italic; color: rgba(0, 0, 0, 0.6); }
    .signature-subtitle-block { display: block; margin-bottom: 8px; }
    .bilingual-text { font-size: 0.85em; font-style: italic; margin-left: 4px; }
    strong { font-weight: 700; }
    .text-bold { font-weight: 700; }
    .text-italic { font-style: italic; }
  </style>
</head>
<body>
  <div class="invoice-paper"${backgroundFrame ? ` style="background-image: url('${backgroundFrame}');"` : ''}>
    
    ${isDraft ? '<div class="watermark">BẢN NHÁP</div>' : ''}
    
    <div class="content-wrapper">
      
      <!-- HEADER: Logo + Title -->
      <div class="header-row">
        <div class="logo-container">
          <div class="logo-wrapper">
            <img src="/logokns.png" alt="Company Logo">
          </div>
        </div>
        
        <div class="title-container">
          <div class="main-title">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>
          ${bilingual ? '<div class="subtitle-bilingual">(VAT INVOICE)</div>' : ''}
        </div>
        
        <div class="header-spacer"></div>
      </div>
      
      <!-- METADATA ROW -->
      <div class="metadata-row">
        <div class="metadata-col"></div>
        
        <div class="metadata-col metadata-col-center">
          ${invoiceType === 'withCode' ? `
          <div class="metadata-text">
            ${renderBilingual('Mã CQT', 'Tax Code', bilingual)}: <strong>${taxAuthorityCode || ''}</strong>
          </div>` : ''}
          <div class="metadata-text italic">
            Ngày ${date.day} tháng ${date.month} năm ${date.year}
          </div>
        </div>
        
        <div class="metadata-col metadata-col-right">
          <div class="metadata-symbol">
            ${renderBilingual('Ký hiệu', 'Symbol', bilingual)}: <strong>${symbolString}</strong>
          </div>
          <div class="metadata-symbol">
            ${renderBilingual('Số', 'No.', bilingual)}: 
            ${isDraft 
              ? `<span class="draft-badge">${renderBilingual('BẢN NHÁP', 'DRAFT', bilingual)}</span>` 
              : `<strong>${invoiceNumberFormatted}</strong>`
            }
          </div>
        </div>
      </div>
      
      <hr class="divider">
      
      <!-- COMPANY INFO -->
      <div class="company-section">
        <div class="company-info-col">
          <div class="info-text">
            ${renderBilingual('Đơn vị bán', 'Seller', bilingual)}: <strong>${companyName}</strong>
          </div>
          
          <div class="two-col-row">
            <div class="two-col-item">
              <div class="info-text">
                ${renderBilingual('Mã số thuế', 'Tax ID', bilingual)}: <strong>${companyTaxCode}</strong>
              </div>
            </div>
            <div class="two-col-item">
              <div class="info-text">
                ${renderBilingual('Điện thoại', 'Phone', bilingual)}: <strong>${companyPhone}</strong>
              </div>
            </div>
          </div>
          
          <div class="info-text">
            ${renderBilingual('Địa chỉ', 'Address', bilingual)}: <strong>${companyAddress}</strong>
          </div>
          
          <div class="info-text">
            ${renderBilingual('Số tài khoản', 'Account No.', bilingual)}: <strong>${companyBankAccount}</strong>
          </div>
        </div>
        
        ${showQrCode ? `
        <div class="qr-col">
          <div class="qr-placeholder">QR</div>
        </div>` : ''}
      </div>
      
      <hr class="divider">
      
      <!-- CUSTOMER INFO -->
      <div class="customer-section">
        <div class="customer-info-col">
          ${buyerName ? `
          <div class="info-text">
            ${renderBilingual('Họ tên người mua hàng', 'Buyer Name', bilingual)}: <strong>${buyerName}</strong>
          </div>` : ''}
          
          ${customerCompanyName ? `
          <div class="info-text">
            ${renderBilingual('Đơn vị mua', 'Company Name', bilingual)}: <strong>${customerCompanyName}</strong>
          </div>` : ''}
          
          ${(customerTaxCode || customerPhone) ? `
          <div class="two-col-row">
            ${customerTaxCode ? `
            <div class="two-col-item">
              <div class="info-text">
                ${renderBilingual('Mã số thuế', 'Tax ID', bilingual)}: <strong>${customerTaxCode}</strong>
              </div>
            </div>` : ''}
            ${customerPhone ? `
            <div class="two-col-item">
              <div class="info-text">
                ${renderBilingual('Điện thoại', 'Phone', bilingual)}: <strong>${customerPhone}</strong>
              </div>
            </div>` : ''}
          </div>` : ''}
          
          ${customerAddress ? `
          <div class="info-text">
            ${renderBilingual('Địa chỉ', 'Address', bilingual)}: <strong>${customerAddress}</strong>
          </div>` : ''}
          
          ${customerEmail ? `
          <div class="info-text">
            ${renderBilingual('Email', 'Email', bilingual)}: <strong>${customerEmail}</strong>
          </div>` : ''}
          
          ${paymentMethod ? `
          <div class="info-text">
            ${renderBilingual('Hình thức thanh toán', 'Payment Method', bilingual)}: <strong>${paymentMethod}</strong>
          </div>` : ''}
        </div>
        
        <div class="customer-spacer-col"></div>
      </div>
      
      <!-- PRODUCT TABLE -->
      <div class="table-container">
        <table class="product-table">
          <thead>
            <tr>
              <th class="col-stt">
                <div class="th-main">STT</div>
                ${bilingual ? '<div class="th-bilingual">(No.)</div>' : ''}
              </th>
              <th class="col-name">
                <div class="th-main">Tên hàng hóa, dịch vụ</div>
                ${bilingual ? '<div class="th-bilingual">(Description)</div>' : ''}
              </th>
              <th class="col-unit">
                <div class="th-main">ĐVT</div>
                ${bilingual ? '<div class="th-bilingual">(Unit)</div>' : ''}
              </th>
              <th class="col-qty">
                <div class="th-main">Số lượng</div>
                ${bilingual ? '<div class="th-bilingual">(Quantity)</div>' : ''}
              </th>
              <th class="col-price">
                <div class="th-main">Đơn giá</div>
                ${bilingual ? '<div class="th-bilingual">(Unit Price)</div>' : ''}
              </th>
              <th class="col-vat">
                <div class="th-main">Thuế suất</div>
                ${bilingual ? '<div class="th-bilingual">(VAT %)</div>' : ''}
              </th>
              <th class="col-total">
                <div class="th-main">Thành tiền</div>
                ${bilingual ? '<div class="th-bilingual">(Amount)</div>' : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            ${generateProductRows(products)}
            
            <tr>
              <td class="notes-cell-empty"></td>
              <td colspan="6" class="notes-cell">
                ${notes 
                  ? `(Ghi chú: ${notes})` 
                  : `<span class="notes-placeholder">${renderBilingual('Nhập ghi chú nếu có', 'Notes if any', bilingual)}</span>`
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- TOTALS -->
      <div class="totals-section">
        <div class="totals-box">
          <div class="totals-stack">
            <div class="totals-row">
              <span class="totals-label">${renderBilingual('Tổng tiền hàng', 'Subtotal', bilingual)}:</span>
              <span class="totals-value">${formatNumber(totals.subtotal)}</span>
            </div>
            
            ${totals.discount > 0 ? `
            <div class="totals-row totals-discount">
              <span class="totals-label">${renderBilingual('Chiết khấu', 'Discount', bilingual)}:</span>
              <span class="totals-value">-${formatNumber(totals.discount)}</span>
            </div>` : ''}
            
            <div class="totals-row">
              <span class="totals-label">${renderBilingual('Tiền sau chiết khấu', 'After Discount', bilingual)}:</span>
              <span class="totals-value">${formatNumber(totals.subtotalAfterDiscount)}</span>
            </div>
            
            <div class="totals-row">
              <span class="totals-label">${renderBilingual('Tiền thuế GTGT', 'VAT Amount', bilingual)}:</span>
              <span class="totals-value">${formatNumber(totals.tax)}</span>
            </div>
            
            <hr class="totals-divider">
            
            <div class="totals-row">
              <span class="totals-final-label">${renderBilingual('Tổng tiền thanh toán', 'Total Amount', bilingual)}:</span>
              <span class="totals-final-value">${formatNumber(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AMOUNT IN WORDS -->
      <div class="amount-words">
        ${renderBilingual('Số tiền viết bằng chữ', 'Amount in words', bilingual)}: <strong>${amountInWords}</strong>
      </div>
      
      ${showSignature ? `
      <!-- SIGNATURE -->
      <div class="signature-section">
        <div class="signature-col">
          <div class="signature-title">
            ${renderBilingual('Người mua hàng', 'Buyer', bilingual)}
          </div>
          <div class="signature-subtitle">
            (${renderBilingual('Chữ ký số (nếu có)', 'Digital Signature (if any)', bilingual)})
          </div>
        </div>
        
        <div class="signature-col">
          <div class="signature-title">
            ${renderBilingual('Người bán hàng', 'Seller', bilingual)}
          </div>
          <div class="signature-subtitle signature-subtitle-block">
            (${renderBilingual('Chữ ký điện tử, Chữ ký số', 'Digital Signature', bilingual)})
          </div>
        </div>
      </div>` : ''}
      
    </div>
  </div>
</body>
</html>`;

  return templateHTML;
};

/**
 * Download HTML file to user's computer
 */
export const downloadInvoiceHTML = (html: string, filename: string = 'invoice.html'): void => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
