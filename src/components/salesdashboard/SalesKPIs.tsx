import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  PersonAdd,
  Description,
} from '@mui/icons-material';
import type { SalesKPI } from '../../types/sales.types';

interface SalesKPIsProps {
  data: SalesKPI;
}

const SalesKPIs: React.FC<SalesKPIsProps> = ({ data }) => {
  // Calculate growth percentage vs last month
  const revenueGrowth = ((data.currentRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100;
  const isGrowthPositive = revenueGrowth >= 0;

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  const kpiCards = [
    {
      id: 'revenue',
      label: 'Doanh số tháng này',
      value: `${formatCurrency(data.currentRevenue)} VNĐ`,
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      color: '#1976d2', // Blue
      bgColor: '#e3f2fd',
      trend: {
        value: Math.abs(revenueGrowth).toFixed(1) + '%',
        isPositive: isGrowthPositive,
        label: 'so với tháng trước',
      },
    },
    {
      id: 'commission',
      label: 'Hoa hồng dự kiến',
      value: `${formatCurrency(data.estimatedCommission)} VNĐ`,
      icon: <EmojiEvents sx={{ fontSize: 32 }} />,
      color: '#f59e0b', // Gold/Orange
      bgColor: '#fef3c7',
      subtitle: `${data.commissionRate}% doanh số`,
    },
    {
      id: 'customers',
      label: 'Khách hàng mới',
      value: data.newCustomers.toString(),
      icon: <PersonAdd sx={{ fontSize: 32 }} />,
      color: '#10b981', // Green
      bgColor: '#d1fae5',
      subtitle: 'Trong tháng',
    },
    {
      id: 'invoices',
      label: 'Đơn chờ thanh toán',
      value: data.openInvoices.toString(),
      icon: <Description sx={{ fontSize: 32 }} />,
      color: '#ef5350', // Red (Needs attention)
      bgColor: '#fee2e2',
      subtitle: 'Cần theo dõi',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {kpiCards.map((card) => (
        <Card
          key={card.id}
          sx={{
            height: '100%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              borderColor: card.color,
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* Icon Circle */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: card.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color,
                mb: 2,
              }}
            >
              {card.icon}
            </Box>

            {/* Label */}
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 500,
                mb: 1,
              }}
            >
              {card.label}
            </Typography>

            {/* Value */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 1,
                fontSize: { xs: '20px', sm: '24px' },
              }}
            >
              {card.value}
            </Typography>

            {/* Trend or Subtitle */}
            {card.trend ? (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: card.trend.isPositive ? '#d1fae5' : '#fee2e2',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: card.trend.isPositive ? '#10b981' : '#ef5350',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {card.trend.isPositive ? '↑' : '↓'} {card.trend.value}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontSize: '11px',
                  }}
                >
                  {card.trend.label}
                </Typography>
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontSize: '11px',
                }}
              >
                {card.subtitle}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default SalesKPIs;
