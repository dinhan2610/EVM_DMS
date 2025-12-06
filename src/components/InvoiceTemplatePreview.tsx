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
  blankRows = TEMPLATE_DEFAULTS.BLANK_ROWS,
  backgroundFrame = TEMPLATE_DEFAULTS.BACKGROUND_FRAME,
  bilingual = false,
  invoiceDate,
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
    showLogo = true,
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
  
  // Calculate totals if we have products
  const calculateTotals = () => {
    if (!hasProducts) return { subtotal: 0, vat: 0, total: 0 };
    
    const subtotal = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const vat = subtotal * 0.1; // 10% VAT
    const total = subtotal + vat;
    
    return { subtotal, vat, total };
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
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              margin: '0 auto',
              padding: '2cm 1.5cm',
              width: '234mm',
              minHeight: '320mm',
              boxSizing: 'border-box',
              bgcolor: 'white',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <Box position="relative" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Phần 1: Header - LUÔN HIỆN Ở TẤT CẢ TRANG */}
              {/* Logo + Tiêu đề - CÙNG 1 HÀNG */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, mt: 2, marginTop: '2rem', position: 'relative' }}>
                {/* Cột Trái: Logo - CHỈ HIỆN KHI CÓ LOGO */}
                <Box sx={{ flex: 1 }}>
                  {showLogo && config.companyLogo && (
                    <img
                      src={config.companyLogo}
                      alt="Logo"
                      style={{
                        maxWidth: '130px',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  )}
                </Box>

                {/* Cột Giữa: Tiêu đề - LUÔN CĂN GIỮA TUYỆT ĐỐI */}
                <Box sx={{ 
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  zIndex: 1,
                }}>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ 
                      textTransform: 'uppercase', 
                      fontSize: '1.4rem', 
                      lineHeight: 1.5,
                      letterSpacing: 0.2,
                      mb: 0.5,
                    }}
                  >
                    HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                  </Typography>
                  {bilingual && (
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ 
                        fontSize: '1.1rem',
                        textTransform: 'uppercase',
                        lineHeight: 1.5,
                        letterSpacing: 0.2,
                        mb: 1,
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                {/* Cột Trái: Trống */}
                <Box sx={{ flex: 1 }} />

                {/* Cột Giữa: Mã CQT và Ngày */}
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  {invoiceType === 'withCode' && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.8 }}>
                      {renderBilingual('Mã CQT', 'Tax Code')}: <strong>{taxAuthorityCode || ''}</strong>
                    </Typography>
                  )}
                  <Typography variant="body2" fontStyle="italic" sx={{ fontSize: '0.75rem', lineHeight: 1.8 }}>
                    {formatDate(invoiceDate)}
                  </Typography>
                </Box>

                {/* Cột Phải: Ký hiệu và Số */}
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.8 }}>
                    {renderBilingual('Ký hiệu', 'Symbol')}: <strong>{symbol.invoiceType}{symbol.taxCode}{symbol.year}{symbol.invoiceForm}{symbol.management}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8 }}>
                    {renderBilingual('Số', 'No.')}: {
                      invoiceNumber ? 
                        <strong>{String(invoiceNumber).padStart(7, '0')}</strong> : 
                        <Box component="span" sx={{ color: 'red', fontWeight: 500 }}>[{renderBilingual('Chưa cấp số', 'Not Issued')}]</Box>
                    }
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Phần 2: Thông tin Công ty & QR (2 cột với Box) */}
              <Box sx={{ display: 'flex', gap: 3, mb: 1.2 }}>
                {/* Cột Trái: Thông tin Công ty */}
                <Box sx={{ flex: 7 }}>
                  {/* Đơn vị bán - Chung dòng */}
                  {showCompanyName && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.4, lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Đơn vị bán', 'Seller')}: <strong>{config.companyName || 'Công ty Cổ phần Giải pháp Tổng thể Kỷ Nguyên Số'}</strong>
                    </Typography>
                  )}
                      
                  {showCompanyTaxCode && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.4, lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Mã số thuế', 'Tax ID')}: <strong>{config.companyTaxCode || '0316882091'}</strong>
                    </Typography>
                  )}
                  
                  {showCompanyAddress && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.4, lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Địa chỉ', 'Address')}: <strong>{config.companyAddress || 'Tòa nhà ABC, 123 Đường XYZ, Phường Tân Định, Quận 1, Thành phố Hồ Chí Minh, Việt Nam.'}</strong>
                    </Typography>
                  )}
                  
                  {showCompanyPhone && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.4, lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Điện thoại', 'Phone')}: <strong>{config.companyPhone || '(028) 38 995 822'}</strong>
                    </Typography>
                  )}
                  
                  {showCompanyBankAccount && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Số tài khoản', 'Account No.')}: <strong>245889119</strong> - <strong>Ngân hàng TMCP Á Châu - Chi Nhánh Sài Gòn</strong>
                    </Typography>
                  )}
                </Box>
                
                {/* Cột Phải: QR Code */}
                {showQrCode && (
                  <Box sx={{ flex: 5, textAlign: 'right' }}>
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
                <Stack spacing={0.4} sx={{ mb: 1 }}>
                  {customerVisibility.customerName && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Họ tên người mua hàng', 'Buyer Name')}: <strong>{customerInfo?.buyerName || ''}</strong>
                    </Typography>
                  )}
                  {customerVisibility.customerName && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Tên đơn vị', 'Company Name')}: <strong>{customerInfo?.name || ''}</strong>
                    </Typography>
                  )}
                  {customerVisibility.customerTaxCode && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Mã số thuế', 'Tax ID')}: <strong>{customerInfo?.taxCode || ''}</strong>
                    </Typography>
                  )}
                  {customerVisibility.customerAddress && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Địa chỉ', 'Address')}: <strong>{customerInfo?.address || ''}</strong>
                    </Typography>
                  )}
                  {customerVisibility.customerPhone && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Số điện thoại', 'Phone')}: <strong>{customerInfo?.phone || ''}</strong>
                    </Typography>
                  )}
                  {customerVisibility.customerEmail && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Email', 'Email')}: <strong>{customerInfo?.email || ''}</strong>
                    </Typography>
                  )}
                  {showPaymentInfo && customerVisibility.paymentMethod && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.8, overflow: 'visible' }}>
                      {renderBilingual('Hình thức thanh toán', 'Payment Method')}: <strong>{paymentMethod || ''}</strong>
                    </Typography>
                  )}
                </Stack>
              )}

              {/* Phần 4: Bảng Hàng hóa - HIỆN Ở TẤT CẢ TRANG */}
              <TableContainer sx={{ my: 1, bgcolor: 'transparent' }}>
                <Table size="small" sx={{ border: '1px solid #000', bgcolor: 'transparent' }}>
                  {/* Table Header - LUÔN HIỆN Ở TẤT CẢ TRANG */}
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent' }}>
                        {renderTableHeader('STT', 'No.')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent' }}>
                        {renderTableHeader('Tên hàng hóa, dịch vụ', 'Description', 'center')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent' }}>
                        {renderTableHeader('ĐVT', 'Unit')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent' }}>
                        {renderTableHeader('Số lượng', 'Quantity')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent' }}>
                        {renderTableHeader('Đơn giá', 'Unit Price', 'center')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '5px 6px', border: '1px solid #000', bgcolor: 'transparent' }}>
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
                          colSpan={5}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', pt: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {renderBilingual('Thuế suất GTGT', 'VAT Rate')}: <strong>{hasProducts ? '10%' : ''}</strong>
                      </Typography>
                    </Box>
                    <Box sx={{ width: '45%' }}>
                      <Stack spacing={0.4}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {renderBilingual('Tiền hàng', 'Subtotal')}:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                            {hasProducts ? totals.subtotal.toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {renderBilingual('Tiền thuế GTGT', 'VAT Amount')}:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                            {hasProducts ? totals.vat.toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                        <Divider sx={{ my: 0.4 }} />
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                            {renderBilingual('Tổng tiền thanh toán', 'Total Amount')}:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.85rem', color: 'primary.main' }}>
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
