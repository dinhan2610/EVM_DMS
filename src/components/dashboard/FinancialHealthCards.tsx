import React from 'react'
import { Box, Card, CardContent, Typography, LinearProgress, Chip, alpha } from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'
import type { FinancialHealthKPI } from '../../types/dashboard.types'

interface FinancialHealthCardsProps {
  data: FinancialHealthKPI
}

const FinancialHealthCards: React.FC<FinancialHealthCardsProps> = ({ data }) => {
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0 ₫'
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const safeNumber = (val: number | undefined | null): number => {
    if (val === undefined || val === null || isNaN(val)) return 0
    return val
  }

  const cards = [
    {
      id: 'net-revenue',
      title: 'Doanh thu thuần',
      subtitle: 'Tổng phát sinh trong kỳ',
      value: formatCurrency(data.netRevenue),
      icon: TrendingUpIcon,
      color: '#0d9488',
      bgColor: '#f0fdfa',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      progress: null,
    },
    {
      id: 'cash-collected',
      title: 'Đã thu',
      subtitle: `${safeNumber(data.collectionRate).toFixed(1)}% doanh thu`,
      value: formatCurrency(data.cashCollected),
      icon: WalletIcon,
      color: '#10b981',
      bgColor: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      progress: safeNumber(data.collectionRate),
      progressLabel: 'Tỷ lệ thu',
    },
    {
      id: 'outstanding',
      title: 'Còn phải thu',
      subtitle: `${safeNumber(data.outstandingRate).toFixed(1)}% chưa thu`,
      value: formatCurrency(data.outstanding),
      icon: ReceiptIcon,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      progress: safeNumber(data.outstandingRate),
      progressLabel: 'Còn nợ',
      badge: 'Theo dõi',
    },
    {
      id: 'vat-payable',
      title: 'Thuế GTGT',
      subtitle: `Thuế suất ${safeNumber(data.vatRate)}%`,
      value: formatCurrency(data.estimatedVAT),
      icon: AccountBalanceIcon,
      color: '#8b5cf6',
      bgColor: '#faf5ff',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      progress: null,
      badge: 'Quan trọng',
    },
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(3, 1fr)',
          xl: 'repeat(6, 1fr)',
        },
        gap: 2.5,
      }}>
      {cards.map((card) => {
        const IconComponent = card.icon

        return (
          <Card
            key={card.id}
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #f1f5f9',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 20px 40px ${alpha(card.color, 0.15)}`,
                borderColor: alpha(card.color, 0.3),
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: card.gradient,
              },
            }}>
            <CardContent sx={{ p: 3, pt: 3.5 }}>
              {/* Header Row */}
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2.5}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    background: card.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${alpha(card.color, 0.35)}`,
                  }}>
                  <IconComponent sx={{ fontSize: 26 }} />
                </Box>

                {card.badge && (
                  <Chip
                    label={card.badge}
                    size="small"
                    sx={{
                      bgcolor: alpha(card.color, 0.1),
                      color: card.color,
                      fontWeight: 600,
                      fontSize: '11px',
                      border: `1px solid ${alpha(card.color, 0.2)}`,
                    }}
                  />
                )}
              </Box>

              {/* Title */}
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  mb: 0.75,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                {card.title}
              </Typography>

              {/* Value */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 1,
                  fontSize: { xs: '22px', md: '24px' },
                  letterSpacing: '-0.02em',
                }}>
                {card.value}
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}>
                {card.subtitle}
              </Typography>

              {/* Progress Bar */}
              {card.progress !== null && (
                <Box mt={2.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                      {card.progressLabel}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: card.color,
                        px: 1,
                        py: 0.25,
                        borderRadius: '10px',
                      }}>
                      {card.progress.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(card.progress, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(card.color, 0.12),
                      '& .MuiLinearProgress-bar': {
                        background: card.gradient,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}

export default FinancialHealthCards
