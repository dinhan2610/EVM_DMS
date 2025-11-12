import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from '@mui/material';

// Interface cho Product Item
interface ProductItem {
  stt: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

// Interface cho Props
interface TemplateConfigProps {
  companyLogo: string | null;
  companyName: string;
  companyTaxCode: string;
  companyAddress: string;
  companyPhone: string;
  modelCode: string;
  templateCode: string;
}

// Interface cho Visibility (tùy chọn hiển thị)
interface TemplateVisibility {
  showQrCode?: boolean;
  showLogo?: boolean;
  showCompanyInfo?: boolean;
  showCustomerInfo?: boolean;
  showPaymentInfo?: boolean;
  showSignature?: boolean;
  showCompanyName?: boolean;
  showCompanyTaxCode?: boolean;
  showCompanyAddress?: boolean;
  showCompanyPhone?: boolean;
  showCompanyBankAccount?: boolean;
}

interface InvoiceTemplatePreviewProps {
  config: TemplateConfigProps;
  visibility?: TemplateVisibility;
  products?: ProductItem[]; // Danh sách sản phẩm động
  blankRows?: number; // Số dòng trống (nếu không có products)
  backgroundFrame?: string;
}

const InvoiceTemplatePreviewPrintable: React.FC<InvoiceTemplatePreviewProps> = ({ 
  config,
  visibility = {},
  products = [], // Mặc định rỗng
  blankRows = 8,
  backgroundFrame = '/khunghoadon.png',
}) => {
  // Set default values for visibility
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

  // Nếu không có products, tạo dòng mẫu + dòng trống
  const displayProducts = products.length > 0 
    ? products 
    : [
        {
          stt: 1,
          name: 'Xăng RON95',
          unit: 'Lít',
          quantity: 2,
          price: 19055,
          total: 45455,
        },
        ...Array(blankRows).fill(null).map((_, i) => ({
          stt: i + 2,
          name: '',
          unit: '',
          quantity: 0,
          price: 0,
          total: 0,
        })),
      ];

  // Tính tổng
  const subtotal = displayProducts.reduce((sum, p) => sum + (p.total || 0), 0);
  const taxRate = 0.1; // 10%
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  return (
    <div 
      className="invoice-print-wrapper"
      style={{
        width: '100%',
        maxWidth: '210mm',
        margin: '0 auto',
        background: 'white',
        position: 'relative',
      }}
    >
      {/* TABLE CHÍNH - Cấu trúc cho Page Break */}
      <table 
        className="invoice-page-layout"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundImage: `url("${backgroundFrame}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* ============================================ */}
        {/* THEAD - HEADER CỦA HÓA ĐƠN (LẶP LẠI) */}
        {/* ============================================ */}
        <thead className="invoice-page-header">
          <tr>
            <td style={{ padding: '1.5cm 1.2cm 0.5cm 1.2cm' }}>
              <div className="invoice-header-content">
                {/* Phần 1: Tiêu đề chính */}
                <Box sx={{ mb: 1.5, position: 'relative' }}>
                  <Typography
                    className="invoice-title"
                    variant="h5"
                    fontWeight="bold"
                    sx={{ 
                      textTransform: 'uppercase', 
                      fontSize: '1.6rem', 
                      mb: 0.4, 
                      letterSpacing: 0.5, 
                      textAlign: 'center' 
                    }}
                  >
                    Hóa đơn giá trị gia tăng
                  </Typography>
                  
                  {/* Mã CQT và Ngày - Căn giữa */}
                  <Box sx={{ textAlign: 'center', mb: 0.3 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      Mã CQT: <strong>C24TTA</strong>
                    </Typography>
                    <Typography variant="body2" fontStyle="italic" sx={{ fontSize: '0.75rem' }}>
                      Ngày 05 tháng 11 năm 2024
                    </Typography>
                  </Box>

                  {/* Ký hiệu và Số - Căn phải */}
                  <Box sx={{ position: 'absolute', top: 35, right: 0 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.3, textAlign: 'right' }}>
                      Ký hiệu: <strong>{config.templateCode || 'D26TTS'}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right' }}>
                      Số: <Box component="span" sx={{ color: 'red', fontWeight: 500 }}>[Chưa cấp số]</Box>
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />
                </Box>

                {/* Phần 2: Thông tin Công ty & QR */}
                <Box sx={{ display: 'flex', gap: 3, mb: 1.2 }}>
                  {/* Cột Trái: Thông tin Công ty */}
                  <Box className="company-info" sx={{ flex: 7 }}>
                    {showLogo && config.companyLogo && (
                      <img
                        className="company-logo"
                        src={config.companyLogo}
                        alt="Logo"
                        style={{ maxHeight: 40, marginBottom: 8, objectFit: 'contain' }}
                      />
                    )}
                    {showCompanyName && (
                      <Typography className="company-name" variant="h6" fontWeight="bold" sx={{ fontSize: '1.15rem', mb: 0.35 }}>
                        {config.companyName || 'GLOBAL SOLUTIONS LTD'}
                      </Typography>
                    )}
                    <div className="company-details">
                      {showCompanyTaxCode && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.2, lineHeight: 1.5 }}>
                          Mã số thuế: {config.companyTaxCode || '6868686868-666'}
                        </Typography>
                      )}
                      {showCompanyAddress && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.2, lineHeight: 1.5 }}>
                          Địa chỉ: {config.companyAddress || '95 Nguyễn Trãi, Thanh Xuân, Hà Nội'}
                        </Typography>
                      )}
                      {showCompanyPhone && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.2, lineHeight: 1.5 }}>
                          Điện thoại: {config.companyPhone || '...............'}
                        </Typography>
                      )}
                      {showCompanyBankAccount && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                          Số tài khoản: ...............
                        </Typography>
                      )}
                    </div>
                  </Box>
                  
                  {/* Cột Phải: QR Code */}
                  {showQrCode && (
                    <Box sx={{ flex: 5, textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Box
                          className="qr-code-box"
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
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            QR
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Phần 3: Thông tin Người mua */}
                {showCustomerInfo && (
                  <Stack className="customer-info" spacing={0.25} sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                      Họ tên người mua hàng: <strong>Kế toán A</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                      Tên đơn vị: <strong>CÔNG TY CỔ PHẦN MISA</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                      Mã số thuế: <strong>0101243150-136</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                      Địa chỉ: Tầng 9, tòa nhà Technosoft, Phố Duy Tân, ...
                    </Typography>
                    {showPaymentInfo && (
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                        Hình thức thanh toán: <strong>TM/CK</strong>
                      </Typography>
                    )}
                  </Stack>
                )}
              </div>
            </td>
          </tr>
        </thead>

        {/* ============================================ */}
        {/* TBODY - NỘI DUNG HÓA ĐƠN (NGẮT TRANG) */}
        {/* ============================================ */}
        <tbody className="invoice-page-body">
          <tr>
            <td style={{ padding: '0 1.2cm' }}>
              <div className="invoice-body-content">
                {/* Bảng Hàng hóa */}
                <Table className="invoice-products-table" size="small" sx={{ border: '1px solid #000', bgcolor: 'transparent' }}>
                  {/* Header của bảng sản phẩm - LẶP LẠI trên mỗi trang */}
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem', 
                          padding: '5px 6px',
                          border: '1px solid #000',
                          bgcolor: 'transparent'
                        }}
                      >
                        STT
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem', 
                          padding: '5px 6px',
                          border: '1px solid #000',
                          bgcolor: 'transparent'
                        }}
                      >
                        Tên hàng hóa, dịch vụ
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem', 
                          padding: '5px 6px',
                          border: '1px solid #000',
                          bgcolor: 'transparent'
                        }}
                      >
                        ĐVT
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem', 
                          padding: '5px 6px',
                          border: '1px solid #000',
                          bgcolor: 'transparent'
                        }}
                      >
                        Số lượng
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem', 
                          padding: '5px 6px',
                          border: '1px solid #000',
                          bgcolor: 'transparent'
                        }}
                      >
                        Đơn giá
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem', 
                          padding: '5px 6px',
                          border: '1px solid #000',
                          bgcolor: 'transparent'
                        }}
                      >
                        Thành tiền
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  {/* Body của bảng sản phẩm - NGẮT TRANG tại đây */}
                  <TableBody>
                    {displayProducts.map((product, index) => (
                      <TableRow key={index} className="no-page-break-inside">
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 8px',
                            border: '1px solid #000',
                            bgcolor: 'transparent'
                          }}
                        >
                          {product.stt || ''}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 8px',
                            border: '1px solid #000',
                            bgcolor: 'transparent'
                          }}
                        >
                          {product.name || '\u00A0'}
                        </TableCell>
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 8px',
                            border: '1px solid #000',
                            bgcolor: 'transparent'
                          }}
                        >
                          {product.unit || '\u00A0'}
                        </TableCell>
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 8px',
                            border: '1px solid #000',
                            bgcolor: 'transparent'
                          }}
                        >
                          {product.quantity || '\u00A0'}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 8px',
                            border: '1px solid #000',
                            bgcolor: 'transparent'
                          }}
                        >
                          {product.price ? formatNumber(product.price) : '\u00A0'}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 8px',
                            border: '1px solid #000',
                            bgcolor: 'transparent'
                          }}
                        >
                          {product.total ? formatNumber(product.total) : '\u00A0'}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Dòng ghi chú */}
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          padding: '4px 8px', 
                          border: '1px solid #000',
                          borderTop: 'none',
                          bgcolor: 'transparent'
                        }} 
                      />
                      <TableCell 
                        sx={{ 
                          fontStyle: 'italic', 
                          pt: 0, 
                          pl: 1.5, 
                          fontSize: '0.75rem', 
                          padding: '0 8px 4px 16px',
                          color: 'text.secondary',
                          border: '1px solid #000',
                          borderTop: 'none',
                          bgcolor: 'transparent'
                        }}
                      >
                        Nhập ghi chú nếu có
                      </TableCell>
                      <TableCell 
                        colSpan={4} 
                        sx={{ 
                          padding: '4px 8px',
                          border: '1px solid #000',
                          borderTop: 'none',
                          bgcolor: 'transparent'
                        }} 
                      />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </td>
          </tr>
        </tbody>

        {/* ============================================ */}
        {/* TFOOT - FOOTER CỦA HÓA ĐƠN (LẶP LẠI) */}
        {/* ============================================ */}
        <tfoot className="invoice-page-footer">
          <tr>
            <td style={{ padding: '0.5cm 1.2cm 1.5cm 1.2cm' }}>
              <div className="invoice-footer-content">
                {/* Phần 5: Tổng tiền */}
                <Box className="invoice-summary" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', pb: 3.2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                      Thuế suất GTGT: <strong>10%</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ width: '45%' }}>
                    <Stack spacing={0.4}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Cộng tiền hàng:</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                          {formatNumber(subtotal)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Tiền thuế GTGT:</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                          {formatNumber(taxAmount)}
                        </Typography>
                      </Stack>
                      <Divider sx={{ my: 0.4 }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography className="invoice-total" variant="body1" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                          Tổng tiền thanh toán:
                        </Typography>
                        <Typography className="invoice-total" variant="body1" fontWeight="bold" sx={{ fontSize: '0.85rem', color: 'primary.main' }}>
                          {formatNumber(grandTotal)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.6 }}>
                  Số tiền viết bằng chữ: <strong>Năm mươi nghìn đồng chẵn.</strong>
                </Typography>

                {/* Phần 6: Chữ ký */}
                {showSignature && (
                  <Box className="invoice-signatures" sx={{ display: 'flex', gap: 3, mt: 1.8 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', mb: 0.4 }}>
                        Người mua hàng
                      </Typography>
                      <Typography variant="caption" fontStyle="italic" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        (Chữ ký số (nếu có))
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', mb: 0.4 }}>
                        Người bán hàng
                      </Typography>
                      <Typography variant="caption" fontStyle="italic" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 1 }}>
                        (Chữ ký điện tử, Chữ ký số)
                      </Typography>
                      {/* Box chữ ký (Mockup) */}
                      <Box 
                        className="signature-box has-background"
                        sx={{ 
                          mt: 0.5, 
                          p: 0.6, 
                          border: '1.5px solid #4caf50', 
                          bgcolor: '#f1f8f4', 
                          width: '75%', 
                          margin: '5px auto 0 auto',
                          fontSize: '0.75rem',
                          borderRadius: 1.5,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ fontSize: '0.75rem', mb: 0.3 }}>
                          ✓ Signature Valid
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', lineHeight: 1.4 }}>
                          Ký bởi: Admin
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                          Ký ngày: 05/11/2024
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default InvoiceTemplatePreviewPrintable;
