import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Grid,
  Divider,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface InvoiceSymbolGuideModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Invoice Symbol Structure Guide Modal
 * Explains the structure of Vietnamese Invoice Series Code (Ký hiệu hóa đơn)
 * According to Circular 78
 */
const InvoiceSymbolGuideModal: React.FC<InvoiceSymbolGuideModalProps> = ({ open, onClose }) => {
  // Symbol segments with colors
  const symbolSegments = [
    { char: '1', label: 'Loại', color: '#1976d2', bg: '#e3f2fd' },
    { char: 'C', label: 'Mã CQT', color: '#2e7d32', bg: '#e8f5e9' },
    { char: '26', label: 'Năm', color: '#ed6c02', bg: '#fff4e6' },
    { char: 'T', label: 'Loại hình', color: '#9c27b0', bg: '#f3e5f5' },
    { char: 'AA', label: 'Nội bộ', color: '#d32f2f', bg: '#ffebee' },
  ];

  // Explanation sections (2 columns grid)
  const explanations = [
    {
      position: '1',
      title: 'Loại hóa đơn',
      color: '#1976d2',
      items: [
        { code: '1', desc: 'Hóa đơn GTGT (Giá trị gia tăng)' },
        { code: '2', desc: 'Hóa đơn bán hàng' },
      ],
    },
    {
      position: '2',
      title: 'Mã Cơ quan thuế',
      color: '#2e7d32',
      items: [
        { code: 'C', desc: 'Có mã CQT (Cơ quan thuế cấp)' },
        { code: 'K', desc: 'Không mã CQT' },
      ],
    },
    {
      position: '3-4',
      title: 'Năm phát hành',
      color: '#ed6c02',
      items: [
        { code: '26', desc: '2 số cuối năm (VD: 26 = 2026)' },
        { code: '25', desc: 'Năm 2025' },
      ],
    },
    {
      position: '5',
      title: 'Loại hình doanh nghiệp',
      color: '#9c27b0',
      items: [
        { code: 'T', desc: 'Doanh nghiệp thông thường' },
        { code: 'D', desc: 'Doanh nghiệp nhỏ và vừa' },
        { code: 'M', desc: 'Máy tính tiền' },
        { code: 'B', desc: 'Bưu điện' },
      ],
    },
    {
      position: '6-7',
      title: 'Ký tự quản lý nội bộ',
      color: '#d32f2f',
      items: [
        { code: 'AA', desc: '2 ký tự do DN tự quản lý' },
        { code: 'AB', desc: 'Phân biệt các mẫu hóa đơn' },
      ],
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: '750px',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InfoOutlinedIcon sx={{ color: '#1976d2', fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#1a1a1a',
              letterSpacing: '-0.01em',
            }}
          >
            Cấu trúc Ký hiệu Hóa đơn
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#666',
            '&:hover': { bgcolor: '#e0e0e0' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
        {/* Hero Section - Symbol Display */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: '#666',
              fontWeight: 600,
              mb: 2,
              fontSize: '0.8125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Ví dụ: Ký hiệu hóa đơn
          </Typography>

          {/* Symbol Segments Display */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            {symbolSegments.map((segment, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Character Box */}
                <Box
                  sx={{
                    bgcolor: segment.bg,
                    color: segment.color,
                    fontWeight: 900,
                    fontSize: segment.char.length > 1 ? '2rem' : '2.5rem',
                    width: segment.char.length > 1 ? '70px' : '60px',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    border: `2px solid ${segment.color}`,
                    fontFamily: 'monospace',
                    letterSpacing: '-1px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  {segment.char}
                </Box>
                {/* Label */}
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: '0.7rem',
                    color: '#666',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {segment.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Full Code Display */}
          <Box
            sx={{
              textAlign: 'center',
              bgcolor: '#f5f5f5',
              py: 1.5,
              borderRadius: 1,
              border: '1px dashed #d0d0d0',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#424242',
                letterSpacing: '2px',
              }}
            >
              1C26TAA
            </Typography>
          </Box>
        </Paper>

        {/* Explanation Grid - 2 Columns */}
        <Grid container spacing={2}>
          {explanations.map((section, index) => (
            <Grid key={index} size={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: section.color,
                    boxShadow: `0 2px 8px ${section.color}20`,
                  },
                }}
              >
                {/* Section Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: `${section.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: section.color,
                      }}
                    >
                      {section.position}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      lineHeight: 1.3,
                    }}
                  >
                    {section.title}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {section.items.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: '28px',
                          height: '22px',
                          bgcolor: `${section.color}10`,
                          border: `1.5px solid ${section.color}`,
                          borderRadius: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: section.color,
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.code}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          color: '#424242',
                          lineHeight: 1.5,
                          flex: 1,
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Footer Note */}
        <Box
          sx={{
            mt: 3,
            pt: 2.5,
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, color: '#1976d2' }} />
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: '#666',
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            Thông tin bắt buộc theo quy định{' '}
            <Box component="span" sx={{ fontWeight: 700, color: '#1976d2' }}>
              Cơ quan thuế (Thông tư 78/2021/TT-BTC)
            </Box>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceSymbolGuideModal;
