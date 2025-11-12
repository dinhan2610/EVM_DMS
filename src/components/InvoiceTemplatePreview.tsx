import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from '@mui/material';

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
  visibility?: TemplateVisibility; // Optional
  blankRows?: number; // Optional, default 8
  backgroundFrame?: string; // Optional, background image path
}

const InvoiceTemplatePreview: React.FC<InvoiceTemplatePreviewProps> = ({ 
  config,
  visibility = {}, // Default empty object
  blankRows = 8, // Default 8 rows
  backgroundFrame = '/khunghoadon.png', // Default background
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
  return (
    <Paper
      elevation={0}
      sx={{
        // Khung viền background - Động theo template
        backgroundImage: `url("${backgroundFrame}")`,
        backgroundSize: 'contain', // contain thay vì cover để giữ nguyên tỉ lệ
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        
        // Căn giữa Paper
        margin: '0 auto',
        
        // Kích thước chuẩn A4 (210mm × 297mm tỉ lệ) - với padding cho viền
        padding: '2cm 1.5cm', // Tăng padding để viền hiển thị đầy đủ
        width: '210mm', // Chuẩn A4 width
        minHeight: '287mm', // Min height để đảm bảo viền đủ
        boxSizing: 'border-box',
        bgcolor: 'white', // White background để thấy rõ
        overflow: 'visible', // Visible để không cắt viền
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Box position="relative" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Phần 1: Tiêu đề chính */}
        <Box sx={{ mb: 1.5, position: 'relative' }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ textTransform: 'uppercase', fontSize: '1.6rem', mb: 0.4, letterSpacing: 0.5, textAlign: 'center' }}
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

        {/* Phần 2: Thông tin Công ty & QR (2 cột với Box) */}
        <Box sx={{ display: 'flex', gap: 3, mb: 1.2 }}>
          {/* Cột Trái: Thông tin Công ty */}
          <Box sx={{ flex: 7 }}>
            {showLogo && config.companyLogo && (
              <img
                src={config.companyLogo}
                alt="Logo"
                style={{ maxHeight: 40, marginBottom: 8, objectFit: 'contain' }}
              />
            )}
            {showCompanyName && (
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.15rem', mb: 0.35 }}>
                {config.companyName || 'GLOBAL SOLUTIONS LTD'}
              </Typography>
            )}
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

        {/* Phần 3: Thông tin Người mua (Mockup) */}
        {showCustomerInfo && (
          <Stack spacing={0.25} sx={{ mb: 1 }}>
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
        )}        {/* Phần 4: Bảng Hàng hóa (Mockup) - Transparent với chỉ có đường kẻ */}
        <TableContainer sx={{ my: 1, bgcolor: 'transparent' }}>
          <Table size="small" sx={{ border: '1px solid #000', bgcolor: 'transparent' }}>
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
            <TableBody>
              <TableRow>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.8rem', 
                    padding: '6px 8px',
                    border: '1px solid #000',
                    bgcolor: 'transparent'
                  }}
                >
                  1
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontSize: '0.8rem', 
                    padding: '6px 8px',
                    border: '1px solid #000',
                    bgcolor: 'transparent'
                  }}
                >
                  Xăng RON95
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
                  Lít
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
                  2
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
                  19,055
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
                  45,455
                </TableCell>
              </TableRow>
              {/* Dòng trống động theo blankRows */}
              {[...Array(blankRows)].map((_, index) => (
                <TableRow key={`empty-${index}`}>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 8px',
                      border: '1px solid #000',
                      bgcolor: 'transparent'
                    }}
                  >
                    {index + 2}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 8px',
                      border: '1px solid #000',
                      bgcolor: 'transparent'
                    }}
                  >
                    &nbsp;
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
                    &nbsp;
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
                    &nbsp;
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
                    &nbsp;
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
                    &nbsp;
                  </TableCell>
                </TableRow>
              ))}
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
        </TableContainer>

        {/* Phần 5: Tổng tiền */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', pb: 3.2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              Thuế suất GTGT: <strong>10%</strong>
            </Typography>
          </Box>
          <Box sx={{ width: '45%' }}>
            <Stack spacing={0.4}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Cộng tiền hàng:</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>45,455</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Tiền thuế GTGT:</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>4,545</Typography>
              </Stack>
              <Divider sx={{ my: 0.4 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                  Tổng tiền thanh toán:
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.85rem', color: 'primary.main' }}>50,000</Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Số tiền viết bằng chữ: <strong>Năm mươi nghìn đồng chẵn.</strong>
        </Typography>

        {/* Phần 6: Chữ ký */}
        {showSignature && (
          <Box sx={{ display: 'flex', gap: 3, mt: 1.8 }}>
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
      </Box>
    </Paper>
  );
};

export default InvoiceTemplatePreview;
