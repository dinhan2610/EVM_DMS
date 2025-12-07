import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Modal,
  IconButton,
} from '@mui/material';
import { Payment, Close, QrCode2 } from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DebtSummary, BankInfo } from '../../types/customer.types';

interface DebtHeroCardProps {
  debtSummary: DebtSummary;
  bankInfo: BankInfo;
}

const DebtHeroCard: React.FC<DebtHeroCardProps> = ({ debtSummary, bankInfo }) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('vi-VN');
  };

  const handlePayNow = () => {
    setQrModalOpen(true);
  };

  const handleCloseModal = () => {
    setQrModalOpen(false);
  };

  // Mock QR Code generation logic
  // In production: Generate VietQR with amount + bank info
  const qrCodeUrl = `https://img.vietqr.io/image/${bankInfo.bankName}-${bankInfo.accountNumber}-compact2.png?amount=${debtSummary.totalDebt}&addInfo=THANH%20TOAN%20HOA%20DON&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  return (
    <>
      <Card
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #1976d2 0%, #7c3aed 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
        }}
      >
        {/* Decorative Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        />

        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              opacity: 0.95,
              fontSize: '16px',
            }}
          >
            Tổng dư nợ hiện tại
          </Typography>

          {/* Debt Amount */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '36px', sm: '48px' },
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {formatCurrency(debtSummary.totalDebt)} ₫
          </Typography>

          {/* Debt Details */}
          <Box sx={{ mb: 3 }}>
            {debtSummary.nearestDueDate && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  mb: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '14px' }}>
                  Hạn thanh toán tiếp theo:{' '}
                  <strong>
                    {format(debtSummary.nearestDueDate, 'dd/MM/yyyy', { locale: vi })}
                  </strong>
                </Typography>
              </Box>
            )}

            {debtSummary.overdueAmount > 0 && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(220, 38, 38, 0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
                  ⚠️ Quá hạn: {formatCurrency(debtSummary.overdueAmount)} ₫
                </Typography>
              </Box>
            )}
          </Box>

          {/* Sub Info */}
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              opacity: 0.9,
              fontSize: '13px',
            }}
          >
            {debtSummary.unpaidInvoiceCount} hóa đơn chưa thanh toán
          </Typography>

          {/* Pay Now Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<Payment sx={{ fontSize: 24 }} />}
            onClick={handlePayNow}
            sx={{
              bgcolor: '#fff',
              color: '#1976d2',
              fontWeight: 700,
              fontSize: '16px',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: '#f8f9fa',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Thanh toán ngay
          </Button>

          {/* Small hint */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              opacity: 0.8,
              fontSize: '11px',
            }}
          >
            💳 Hỗ trợ thanh toán qua QR Code - Nhanh chóng & An toàn
          </Typography>
        </CardContent>
      </Card>

      {/* QR Code Payment Modal */}
      <Modal
        open={qrModalOpen}
        onClose={handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: '#fff',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            maxWidth: 450,
            width: '90%',
            textAlign: 'center',
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: '#64748b',
            }}
          >
            <Close />
          </IconButton>

          {/* Title */}
          <QrCode2 sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: '#1e293b', mb: 1 }}>
            Thanh toán qua QR Code
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Quét mã để thanh toán tự động
          </Typography>

          {/* QR Code Image */}
          <Box
            sx={{
              p: 3,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '2px solid #e2e8f0',
              mb: 3,
            }}
          >
            <img
              src={qrCodeUrl}
              alt="VietQR Payment"
              style={{
                width: '100%',
                maxWidth: 300,
                height: 'auto',
                borderRadius: 8,
              }}
              onError={(e) => {
                // Fallback if QR generation fails
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNjQ3NDhiIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
          </Box>

          {/* Payment Details */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#fef3c7',
              borderRadius: 2,
              border: '1px solid #fbbf24',
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#92400e', fontSize: '13px', mb: 0.5 }}>
              Số tiền thanh toán
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#b45309' }}>
              {formatCurrency(debtSummary.totalDebt)} ₫
            </Typography>
          </Box>

          {/* Bank Info */}
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block', mb: 0.5 }}>
              Ngân hàng: <strong>{bankInfo.bankName}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block', mb: 0.5 }}>
              Số TK: <strong>{bankInfo.accountNumber}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
              Chủ TK: <strong>{bankInfo.accountName}</strong>
            </Typography>
          </Box>

          {/* Instructions */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              color: '#94a3b8',
              fontSize: '11px',
            }}
          >
            Mở ứng dụng ngân hàng và quét mã QR để thanh toán
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export default DebtHeroCard;
