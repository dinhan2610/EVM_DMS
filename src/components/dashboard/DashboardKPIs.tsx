import { Box, Card, CardContent, Typography, useTheme, alpha } from '@mui/material'
import {
  AttachMoney,
  CalendarToday,
  Warning,
  Create,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material'
import type { DashboardKPI } from '../../types/dashboard.types'

interface DashboardKPIsProps {
  data: DashboardKPI
}

const DashboardKPIs = ({ data }: DashboardKPIsProps) => {
  const theme = useTheme()

  const kpiCards = [
    {
      title: 'Doanh thu hôm nay',
      value: data.revenueToday,
      icon: AttachMoney,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      format: 'currency',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Doanh thu tháng này',
      value: data.revenueMonth,
      icon: CalendarToday,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      format: 'currency',
      trend: '+8.3%',
      trendUp: true,
    },
    {
      title: 'Tổng nợ phải thu',
      value: data.totalReceivable,
      icon: Warning,
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.1),
      format: 'currency',
      trend: '-5.2%',
      trendUp: false,
      urgent: true,
    },
    {
      title: 'Chờ duyệt/Ký',
      value: data.pendingSignatures,
      icon: Create,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      format: 'number',
      trend: '15 hôm nay',
      trendUp: false,
    },
  ]

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(value)
    }
    return value.toLocaleString('vi-VN')
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
      {kpiCards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <Card
            key={index}
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'visible',
              border: '1px solid',
              borderColor: alpha(card.color, 0.2),
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 8px 24px ${alpha(card.color, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: alpha(card.color, 0.4),
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Icon Circle */}
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: card.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <IconComponent sx={{ fontSize: 28, color: card.color }} />
              </Box>

              {/* Title */}
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {card.title}
              </Typography>

              {/* Value */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1a1a1a',
                  mb: 1,
                  fontSize: { xs: '1.75rem', md: '2rem' },
                  lineHeight: 1.2,
                }}
              >
                {formatValue(card.value, card.format)}
              </Typography>

              {/* Trend */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {card.trendUp ? (
                  <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: card.trendUp ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {card.trend}
                </Typography>
              </Box>

              {/* Urgent Badge */}
              {card.urgent && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: theme.palette.error.main,
                    color: '#fff',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Quan trọng
                </Box>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}

export default DashboardKPIs
