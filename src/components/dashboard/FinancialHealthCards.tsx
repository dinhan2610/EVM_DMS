import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Chip } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Dangerous as DangerousIcon,
} from '@mui/icons-material';
import type { FinancialHealthKPI } from '../../types/dashboard.types';

interface FinancialHealthCardsProps {
  data: FinancialHealthKPI;
}

const FinancialHealthCards: React.FC<FinancialHealthCardsProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      id: 'net-revenue',
      title: 'Doanh thu thuần',
      subtitle: 'Tháng này',
      value: formatCurrency(data.netRevenue),
      icon: TrendingUpIcon,
      color: '#0d9488', // Teal
      bgColor: '#f0fdfa',
      progress: null,
    },
    {
      id: 'cash-collected',
      title: 'Thực thu',
      subtitle: `${data.collectionRate.toFixed(1)}% của doanh thu`,
      value: formatCurrency(data.cashCollected),
      icon: PaymentIcon,
      color: '#10b981', // Emerald
      bgColor: '#ecfdf5',
      progress: data.collectionRate,
      progressLabel: 'Tỷ lệ thu',
    },
    {
      id: 'vat-payable',
      title: 'Thuế GTGT phải nộp',
      subtitle: 'Ước tính tháng này',
      value: formatCurrency(data.estimatedVAT),
      icon: ReceiptIcon,
      color: '#f59e0b', // Amber
      bgColor: '#fffbeb',
      progress: null,
      badge: 'Quan trọng',
    },
    {
      id: 'critical-debt',
      title: 'Nợ quá hạn >90 ngày',
      subtitle: `${data.criticalDebtCount} khách hàng`,
      value: formatCurrency(data.criticalDebt),
      icon: DangerousIcon,
      color: '#dc2626', // Red
      bgColor: '#fef2f2',
      progress: null,
      urgent: true,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 2.5,
      }}
    >
      {cards.map((card) => {
        const IconComponent = card.icon;

        return (
          <Card
            key={card.id}
            elevation={0}
            sx={{
              position: 'relative',
              borderLeft: `4px solid ${card.color}`,
              borderRadius: 2,
              bgcolor: '#fff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px ${card.color}20`,
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              {/* Header Row */}
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: card.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  <IconComponent sx={{ fontSize: 24 }} />
                </Box>

                {card.badge && (
                  <Chip
                    label={card.badge}
                    size="small"
                    sx={{
                      bgcolor: `${card.color}15`,
                      color: card.color,
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  />
                )}

                {card.urgent && (
                  <Chip
                    label="Cần xử lý"
                    size="small"
                    color="error"
                    sx={{ fontWeight: 600, fontSize: '11px' }}
                  />
                )}
              </Box>

              {/* Title */}
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  mb: 0.5,
                  fontSize: '13px',
                }}
              >
                {card.title}
              </Typography>

              {/* Value */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: card.urgent ? card.color : '#1e293b',
                  mb: 1,
                  fontSize: '28px',
                }}
              >
                {card.value}
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontSize: '12px',
                }}
              >
                {card.subtitle}
              </Typography>

              {/* Progress Bar (for Cash Collected) */}
              {card.progress !== null && (
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                      {card.progressLabel}
                    </Typography>
                    <Typography variant="caption" sx={{ color: card.color, fontSize: '11px', fontWeight: 700 }}>
                      {card.progress.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(card.progress, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: `${card.color}15`,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: card.color,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default FinancialHealthCards;
