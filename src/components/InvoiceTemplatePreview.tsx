import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { numberToWords } from '@/utils/numberToWords';
import logoKns from '/logokns.png';
import type {
  InvoiceTemplatePreviewProps,
} from '@/types/invoiceTemplate';
import {
  DEFAULT_CUSTOMER_VISIBILITY,
  DEFAULT_INVOICE_SYMBOL,
  TEMPLATE_DEFAULTS,
  INVOICE_PAGINATION,
} from '@/types/invoiceTemplate';

const InvoiceTemplatePreview: React.FC<InvoiceTemplatePreviewProps> = ({ 
  config,
  visibility = {},
  products = [], // NEW: Support actual product data
  totals: externalTotals, // NEW: Pre-calculated totals from parent
  blankRows = TEMPLATE_DEFAULTS.BLANK_ROWS,
  backgroundFrame = TEMPLATE_DEFAULTS.BACKGROUND_FRAME,
  bilingual = false,
  invoiceType = TEMPLATE_DEFAULTS.INVOICE_TYPE,
  symbol = DEFAULT_INVOICE_SYMBOL,
  customerVisibility = DEFAULT_CUSTOMER_VISIBILITY,
  customerInfo, // NEW: Actual customer data
  paymentMethod, // NEW: Payment method
  invoiceNumber, // NEW: Actual invoice number
  taxAuthorityCode, // NEW: Tax authority code
  notes, // NEW: Invoice notes
}) => {
  const {
    showQrCode = true,
    showCustomerInfo = true,
    showPaymentInfo = true,
    showSignature = true,
    showCompanyName = true,
    showCompanyTaxCode = true,
    showCompanyAddress = true,
    showCompanyPhone = true,
    showCompanyBankAccount = true,
  } = visibility;

  // **PAGINATION LOGIC - Professional approach**
  const { ROWS_PER_FIRST_PAGE, ROWS_PER_NEXT_PAGE } = INVOICE_PAGINATION;
  
  // Determine if we're using actual products or blank rows
  const hasProducts = products && products.length > 0;
  const totalRows = hasProducts ? products.length : blankRows;
  
  // Calculate page distribution
  const calculatePages = (): Array<{ start: number; end: number; isFirst: boolean }> => {
    if (totalRows <= ROWS_PER_FIRST_PAGE) {
      return [{ start: 0, end: totalRows, isFirst: true }];
    }
    
    const pages = [];
    pages.push({ start: 0, end: ROWS_PER_FIRST_PAGE, isFirst: true });
    
    let remaining = totalRows - ROWS_PER_FIRST_PAGE;
    let currentStart = ROWS_PER_FIRST_PAGE;
    
    while (remaining > 0) {
      const rowsInPage = Math.min(remaining, ROWS_PER_NEXT_PAGE);
      pages.push({ start: currentStart, end: currentStart + rowsInPage, isFirst: false });
      currentStart += rowsInPage;
      remaining -= rowsInPage;
    }
    
    return pages;
  };
  
  const pages = calculatePages();
  
  // ✅ Calculate totals: Use external totals if provided, otherwise calculate from products
  const calculateTotals = () => {
    // If external totals provided (from CreateVatInvoice), use them directly
    if (externalTotals) {
      return externalTotals;
    }

    // Otherwise, calculate from products (for backward compatibility)
    if (!hasProducts) return { subtotal: 0, discount: 0, subtotalAfterDiscount: 0, tax: 0, total: 0 };
    
    const subtotal = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const discount = products.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
    const subtotalAfterDiscount = subtotal - discount;
    const tax = products.reduce((sum, p) => sum + (p.vatAmount || 0), 0);
    const total = subtotalAfterDiscount + tax;
    
    return { subtotal, discount, subtotalAfterDiscount, tax, total };
  };
  
  const totals = calculateTotals();

  // **Helper: Render bilingual text**
  const renderBilingual = (vn: string, en: string) => {
    if (!bilingual) return vn;
    return (
      <Box component="span">
        {vn}
        <Box component="span" sx={{ fontSize: '0.85em', fontStyle: 'italic', ml: 0.5 }}>
          ({en})
        </Box>
      </Box>
    );
  };

  // **Helper: Format date (Vietnamese only, no bilingual)**
  const formatDate = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    return `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  };

  // **Helper: Render Table Header (2 lines bilingual)**
  const renderTableHeader = (vn: string, en: string, align: 'left' | 'center' | 'right' = 'center') => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : (align === 'right' ? 'flex-end' : 'flex-start') }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1.3 }}>
        {vn}
      </Typography>
      {bilingual && (
        <Typography sx={{ fontSize: '0.7rem', fontStyle: 'italic', lineHeight: 1.3 }}>
          ({en})
        </Typography>
      )}
    </Box>
  );

  // **Component: Page Break Indicator**
  const PageBreak: React.FC<{ pageNumber: number }> = () => (
    <Box sx={{ my: 2 }}>
      <Divider 
        sx={{ 
          borderStyle: 'dashed', 
          borderColor: '#d0d0d0',
          borderWidth: 1,
        }} 
      />
    </Box>
  );

  return (
    <>
      {pages.map((page, pageIndex) => (
        <React.Fragment key={`page-${pageIndex}`}>
          <Paper
            elevation={0}
            sx={{
              backgroundImage: `url("${backgroundFrame}")`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              margin: '0 auto',
              padding: '1.5cm 1.2cm',
              width: '100%',
              maxWidth: '210mm', // A4 width standard
              minHeight: '297mm', // A4 height standard
              boxSizing: 'border-box',
              bgcolor: 'white',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              // Responsive: scale down on smaller screens
              '@media print': {
                width: '210mm',
                maxWidth: '210mm',
                padding: '1.2cm 1cm',
                boxShadow: 'none',
              },
              '@media (max-width: 900px)': {
                width: '100%',
                maxWidth: '100%',
                padding: '1.5rem 1rem',
                minHeight: 'auto',
              },
            }}
            data-invoice-page
          >
            {/* ✅ Watermark "BẢN NHÁP" nếu chưa có invoice number */}
            {(!invoiceNumber || String(invoiceNumber).trim() === '') && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-45deg)',
                  fontSize: '120px',
                  fontWeight: 900,
                  color: 'rgba(255, 107, 107, 0.15)',
                  textTransform: 'uppercase',
                  letterSpacing: '20px',
                  pointerEvents: 'none',
                  zIndex: 0,
                  userSelect: 'none',
                }}
              >
                BẢN NHÁP
              </Box>
            )}

            <Box position="relative" sx={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
              {/* Phần 1: Header - LUÔN HIỆN Ở TẤT CẢ TRANG */}
              {/* Logo + Tiêu đề - CÙNG 1 HÀNG */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, mt: 0.5, position: 'relative', minHeight: '80px' }}>
                {/* Cột Trái: Logo cố định - LUÔN HIỂN THỊ */}
                <Box sx={{ 
                  flex: 0,
                  minWidth: '130px',
                  position: 'relative',
                }}>
                  <Box sx={{ 
                    position: 'relative',
                    width: '120px',
                    height: 'auto',
                  }}>
                    <img
                      src={logoKns}
                      alt="Company Logo"
                      style={{
                        width: '120px',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        marginTop: '-55px',
                      }}
                    />
                  </Box>
                </Box>

                {/* Cột Giữa: Tiêu đề - LUÔN CĂN GIỮA TUYỆT ĐỐI */}
                <Box sx={{ 
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  maxWidth: '500px',
                  textAlign: 'center',
                  zIndex: 1,
                }}>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ 
                      textTransform: 'uppercase', 
                      fontSize: '1.65rem', 
                      lineHeight: 1.3,
                      letterSpacing: 0,
                      mb: 0.2,
                      whiteSpace: 'nowrap',
                      maxWidth: '95%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                  </Typography>
                  {bilingual && (
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ 
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                        letterSpacing: 0,
                        mb: 0.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      (VAT INVOICE)
                    </Typography>
                  )}
                </Box>

                {/* Cột Phải: Trống (để cân đối) */}
                <Box sx={{ flex: 1 }} />
              </Box>

              {/* Ký hiệu/Số và Mã CQT/Ngày - HÀNG RIÊNG */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, mt: -1 }}>
                {/* Cột Trái: Trống */}
                <Box sx={{ flex: 1 }} />

                {/* Cột Giữa: Mã CQT và Ngày */}
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  {invoiceType === 'withCode' && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.2, lineHeight: 1.5 }}>
                      {renderBilingual('Mã CQT', 'Tax Code')}: <strong>{taxAuthorityCode || ''}</strong>
                    </Typography>
                  )}
                  <Typography variant="body2" fontStyle="italic" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {formatDate()}
                  </Typography>
                </Box>

                {/* Cột Phải: Ký hiệu và Số */}
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.8 }}>
                    {renderBilingual('Ký hiệu', 'Symbol')}: <strong>{symbol.invoiceType}{symbol.taxCode}{symbol.year}{symbol.invoiceForm}{symbol.management}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8 }}>
                    {renderBilingual('Số', 'No.')}: {
                      (invoiceNumber && String(invoiceNumber).trim() !== '') ? 
                        <strong>{String(invoiceNumber).padStart(7, '0')}</strong> : 
                        <Box component="span" sx={{ 
                          color: '#ff6b6b', 
                          fontWeight: 600,
                          fontStyle: 'italic',
                          backgroundColor: '#fff3cd',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          border: '1px solid #ffc107'
                        }}>
                          {renderBilingual('BẢN NHÁP', 'DRAFT')}
                        </Box>
                    }
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Phần 2: Thông tin Công ty & QR (2 cột với Box) */}
              <Box sx={{ display: 'flex', gap: 3, mb: 1.2 }}>
                {/* Cột Trái: Thông tin Công ty - 82% */}
                <Box sx={{ flex: 82 }}>
                  {/* Đơn vị bán - Dòng đầy đủ */}
                  {showCompanyName && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {renderBilingual('Đơn vị bán', 'Seller')}: <strong>{config.companyName || 'Công ty Cổ phần Giải pháp Tổng thể Kỷ Nguyên Số'}</strong>
                    </Typography>
                  )}
                      
                  {/* Mã số thuế và Điện thoại - Cùng hàng */}
                  {(showCompanyTaxCode || showCompanyPhone) && (
                    <Box sx={{ display: 'flex', gap: 3, mb: 0.3 }}>
                      <Box sx={{ width: 'calc(50% - 12px)' }}>
                        {showCompanyTaxCode && (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, overflow: 'hidden' }}>
                            {renderBilingual('Mã số thuế', 'Tax ID')}: <strong>{config.companyTaxCode || '0316882091'}</strong>
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 'calc(50% - 12px)' }}>
                        {showCompanyPhone && (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, overflow: 'hidden' }}>
                            {renderBilingual('Điện thoại', 'Phone')}: <strong>{config.companyPhone || '(028) 38 995 822'}</strong>
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Địa chỉ - Dòng đầy đủ */}
                  {showCompanyAddress && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Địa chỉ', 'Address')}: <strong>{config.companyAddress || 'Tòa nhà ABC, 123 Đường XYZ, Phường Tân Định, Quận 1, Thành phố Hồ Chí Minh, Việt Nam.'}</strong>
                    </Typography>
                  )}
                  
                  {/* Số tài khoản - Dòng cuối */}
                  {showCompanyBankAccount && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Số tài khoản', 'Account No.')}: <strong>{config.companyBankAccount || '245889119 - Ngân hàng TMCP Á Châu - Chi Nhánh Sài Gòn'}</strong>
                    </Typography>
                  )}
                </Box>
                
                {/* Cột Phải: QR Code - 18% */}
                {showQrCode && (
                  <Box sx={{ flex: 18, textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box
                        sx={{
                          width: 65,
                          height: 65,
                          border: '1px dashed #999',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#f9f9f9',
                          borderRadius: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>QR</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Phần 3: Thông tin Người mua - LUÔN HIỆN Ở TẤT CẢ TRANG */}
              {showCustomerInfo && (
                <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                  {/* Cột Trái: Thông tin Khách hàng - 82% (giống phần Công ty) */}
                  <Box sx={{ flex: 82 }}>
                  {/* Họ tên người mua - Dòng đầy đủ */}
                  {customerVisibility.customerName && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Họ tên người mua hàng', 'Buyer Name')}: <strong>{customerInfo?.buyerName || ''}</strong>
                    </Typography>
                  )}
                  
                  {/* Tên đơn vị - Dòng đầy đủ */}
                  {customerVisibility.customerName && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Đơn vị mua: ', 'Company Name')}: <strong>{customerInfo?.name || ''}</strong>
                    </Typography>
                  )}
                  
                  {/* Mã số thuế và Điện thoại - Cùng hàng */}
                  {(customerVisibility.customerTaxCode || customerVisibility.customerPhone) && (
                    <Box sx={{ display: 'flex', gap: 3, mb: 0.3 }}>
                      <Box sx={{ width: 'calc(50% - 12px)' }}>
                        {customerVisibility.customerTaxCode && (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, overflow: 'hidden' }}>
                            {renderBilingual('Mã số thuế', 'Tax ID')}: <strong>{customerInfo?.taxCode || ''}</strong>
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 'calc(50% - 12px)' }}>
                        {customerVisibility.customerPhone && (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, overflow: 'hidden' }}>
                            {renderBilingual('Điện thoại', 'Phone')}: <strong>{customerInfo?.phone || ''}</strong>
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Địa chỉ - Dòng đầy đủ */}
                  {customerVisibility.customerAddress && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Địa chỉ', 'Address')}: <strong>{customerInfo?.address || ''}</strong>
                    </Typography>
                  )}
                  
                  {/* Email - Dòng đầy đủ */}
                  {customerVisibility.customerEmail && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Email', 'Email')}: <strong>{customerInfo?.email || ''}</strong>
                    </Typography>
                  )}
                  
                  {/* Hình thức thanh toán - Dòng cuối */}
                  {showPaymentInfo && customerVisibility.paymentMethod && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, overflow: 'hidden' }}>
                      {renderBilingual('Hình thức thanh toán', 'Payment Method')}: <strong>{paymentMethod || ''}</strong>
                    </Typography>
                  )}
                  </Box>
                  
                  {/* Cột Phải: Trống - 18% (để cân bằng với phần Công ty) */}
                  <Box sx={{ flex: 18 }} />
                </Box>
              )}

              {/* Phần 4: Bảng Hàng hóa - HIỆN Ở TẤT CẢ TRANG */}
              <TableContainer sx={{ my: 1, bgcolor: 'transparent' }}>
                <Table size="small" sx={{ border: '1px solid #000', bgcolor: 'transparent' }}>
                  {/* Table Header - LUÔN HIỆN Ở TẤT CẢ TRANG */}
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', width: '40px' }}>
                        {renderTableHeader('STT', 'No.')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', minWidth: '180px' }}>
                        {renderTableHeader('Tên hàng hóa, dịch vụ', 'Description', 'center')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', width: '50px' }}>
                        {renderTableHeader('ĐVT', 'Unit')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', width: '60px' }}>
                        {renderTableHeader('Số lượng', 'Quantity')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', width: '85px' }}>
                        {renderTableHeader('Đơn giá', 'Unit Price', 'center')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', width: '55px' }}>
                        {renderTableHeader('Thuế suất', 'VAT %', 'center')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent', width: '90px' }}>
                        {renderTableHeader('Thành tiền', 'Amount', 'center')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Render products or blank rows */}
                    {[...Array(page.end - page.start)].map((_, index) => {
                      const globalIndex = page.start + index;
                      const product = hasProducts ? products[globalIndex] : null;
                      
                      return (
                        <TableRow key={`row-${globalIndex}`}>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {globalIndex + 1}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {product?.name || '\u00A0'}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {product?.unit || '\u00A0'}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {product?.quantity || '\u00A0'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {product ? product.unitPrice.toLocaleString('vi-VN') : '\u00A0'}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {product?.vatRate !== undefined ? `${product.vatRate}%` : '\u00A0'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem', padding: '6px 8px', border: '1px solid #000', bgcolor: 'transparent' }}>
                            {product ? (product.quantity * product.unitPrice).toLocaleString('vi-VN') : '\u00A0'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Ghi chú - CHỈ hiện ở trang cuối */}
                    {pageIndex === pages.length - 1 && (
                      <TableRow>
                        <TableCell sx={{ padding: '4px 8px', border: '1px solid #000', borderTop: 'none', bgcolor: 'transparent' }} />
                        <TableCell 
                          colSpan={6}
                          sx={{ 
                            fontStyle: 'italic',
                            pt: 0, 
                            pl: 3,
                            fontSize: '0.75rem', 
                            padding: '0 8px 4px 24px',
                            color: notes ? 'text.secondary' : '#aaa',
                            border: '1px solid #000', 
                            borderTop: 'none', 
                            bgcolor: 'transparent' 
                          }}>
                          {notes ? `(Ghi chú: ${notes})` : renderBilingual('Nhập ghi chú nếu có', 'Notes if any')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Phần 5: Tổng tiền và Chữ ký - CHỈ HIỆN Ở TRANG CUỐI */}
              {pageIndex === pages.length - 1 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: '50%' }}>
                      <Stack spacing={0.4}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {renderBilingual('Tổng tiền hàng', 'Subtotal')}:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                            {hasProducts ? totals.subtotal.toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                        {totals.discount > 0 && (
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'error.main' }}>
                              {renderBilingual('Chiết khấu', 'Discount')}:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', color: 'error.main' }}>
                              -{hasProducts ? totals.discount.toLocaleString('vi-VN') : ''}
                            </Typography>
                          </Stack>
                        )}
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {renderBilingual('Tiền sau chiết khấu', 'After Discount')}:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                            {hasProducts ? totals.subtotalAfterDiscount.toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {renderBilingual('Tiền thuế GTGT', 'VAT Amount')}:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                            {hasProducts ? totals.tax.toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                        <Divider sx={{ my: 0.4 }} />
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                            {renderBilingual('Tổng tiền thanh toán', 'Total Amount')}:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem', color: 'primary.main' }}>
                            {hasProducts ? totals.total.toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {renderBilingual('Số tiền viết bằng chữ', 'Amount in words')}: <strong>{hasProducts ? numberToWords(totals.total) : ''}</strong>
                  </Typography>

                  {/* Chữ ký */}
                  {showSignature && (
                    <Box sx={{ display: 'flex', gap: 3, mt: 1.8 }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', mb: 0.4 }}>
                          {renderBilingual('Người mua hàng', 'Buyer')}
                        </Typography>
                        <Typography variant="caption" fontStyle="italic" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          ({renderBilingual('Chữ ký số (nếu có)', 'Digital Signature (if any)')})
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', mb: 0.4 }}>
                          {renderBilingual('Người bán hàng', 'Seller')}
                        </Typography>
                        <Typography variant="caption" fontStyle="italic" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 1 }}>
                          ({renderBilingual('Chữ ký điện tử, Chữ ký số', 'Digital Signature')})
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Paper>
          
          {/* Page break indicator between pages */}
          {pageIndex < pages.length - 1 && <PageBreak pageNumber={pageIndex + 2} />}
        </React.Fragment>
      ))}
    </>
  );
};

export default InvoiceTemplatePreview;
