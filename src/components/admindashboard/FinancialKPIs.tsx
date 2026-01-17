import React, { useMemo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  HourglassEmpty as HourglassIcon,
} from '@mui/icons-material'
import type { CurrentMonthStats, InvoiceCounts, UserStats } from '@/types/dashboard.types'
import { formatCurrencyStandard } from '@/utils/currency'

interface FinancialKPIsProps {
  currentMonthStats: CurrentMonthStats
  invoiceCounts: InvoiceCounts
  userStats: UserStats
  revenueGrowth?: number
}

const FinancialKPIs: React.FC<FinancialKPIsProps> = ({
  currentMonthStats,
  invoiceCounts,
  userStats,
  revenueGrowth,
}) => {
  // Memoize kpis array để tránh recreation khi props không đổi
  const kpis = useMemo(() => [
    {
      id: 'revenue',
      label: 'Doanh thu tháng này',
      value: formatCurrencyStandard(currentMonthStats.totalRevenue),
      icon: <MoneyIcon sx={{ fontSize: 28 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      trend: revenueGrowth ? { value: revenueGrowth, isPositive: revenueGrowth > 0 } : undefined,
    },
    {
      id: 'profit',
      label: 'Lợi nhuận ròng',
      value: formatCurrencyStandard(currentMonthStats.netProfit),
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      id: 'invoices',
      label: 'Tổng hóa đơn',
      value: invoiceCounts.total,
      icon: <ReceiptIcon sx={{ fontSize: 28 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
      subtitle: `${invoiceCounts.unpaid} chưa thanh toán`,
    },
    {
      id: 'users',
      label: 'Tổng người dùng',
      value: userStats.totalUsers,
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      subtitle: `+${userStats.newUsersThisMonth} user mới`,
    },
    {
      id: 'collected',
      label: 'Đã thu',
      value: formatCurrencyStandard(currentMonthStats.collectedAmount),
      icon: <AccountBalanceIcon sx={{ fontSize: 28 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      id: 'outstanding',
      label: 'Còn nợ',
      value: formatCurrencyStandard(currentMonthStats.outstandingAmount),
      icon: <HourglassIcon sx={{ fontSize: 28 }} />,
      color: '#d32f2f',
      bgColor: '#ffebee',
      subtitle: currentMonthStats.overdueAmount > 0 ? `${formatCurrencyStandard(currentMonthStats.overdueAmount)} quá hạn` : undefined,
    },
  ], [currentMonthStats, invoiceCounts, userStats, revenueGrowth])

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(6, 1fr)',
        },
        gap: 3,
      }}
    >
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          sx={{
            height: '100%',
            borderLeft: `4px solid ${kpi.color}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
          }}
        >
          <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: kpi.bgColor,
                    color: kpi.color,
                  }}
                >
                  {kpi.icon}
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {kpi.label}
              </Typography>

              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: 'text.primary', mb: 0.5 }}
              >
                {kpi.value}
              </Typography>

              {/* Trend Indicator */}
              {kpi.trend && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUpIcon
                    sx={{
                      fontSize: 16,
                      color: kpi.trend.isPositive ? '#2e7d32' : '#d32f2f',
                      transform: kpi.trend.isPositive ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: kpi.trend.isPositive ? '#2e7d32' : '#d32f2f',
                      fontWeight: 600,
                    }}
                  >
                    {kpi.trend.isPositive ? '+' : ''}{kpi.trend.value.toFixed(1)}%
                  </Typography>
                </Box>
              )}

              {/* Subtitle */}
              {kpi.subtitle && !kpi.trend && (
                <Typography variant="caption" color="text.secondary">
                  {kpi.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
      ))}
    </Box>
  )
}

export default FinancialKPIs
