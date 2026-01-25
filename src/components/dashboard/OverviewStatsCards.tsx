import React from 'react'
import { Box, Card, CardContent, Typography, Tooltip, alpha } from '@mui/material'
import { TrendingUp, People, Receipt, Inventory, Description, PendingActions, AccountBalance } from '@mui/icons-material'

interface OverviewStatsProps {
  data: {
    totalMonthlyRevenue: number
    totalCustomers: number
    totalInvoiceRequests: number
    totalProducts: number
    totalInvoicesIssued: number
    totalInvoicesPendingApproval: number
    totalDebtAll: number
  }
}

const OverviewStatsCards: React.FC<OverviewStatsProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  const stats = [
    {
      id: 'monthly-revenue',
      label: 'Doanh thu tháng',
      value: formatCurrency(data.totalMonthlyRevenue),
      rawValue: data.totalMonthlyRevenue,
      icon: TrendingUp,
      color: '#0ea5e9',
      bgColor: '#e0f2fe',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      tooltip: 'Tổng doanh thu trong tháng này',
    },
    {
      id: 'customers',
      label: 'Khách hàng',
      value: formatNumber(data.totalCustomers),
      rawValue: data.totalCustomers,
      icon: People,
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      tooltip: 'Tổng số khách hàng',
    },
    {
      id: 'invoice-requests',
      label: 'Yêu cầu xuất HĐ',
      value: formatNumber(data.totalInvoiceRequests),
      rawValue: data.totalInvoiceRequests,
      icon: Receipt,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      tooltip: 'Tổng số yêu cầu xuất hóa đơn',
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      value: formatNumber(data.totalProducts),
      rawValue: data.totalProducts,
      icon: Inventory,
      color: '#06b6d4',
      bgColor: '#cffafe',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      tooltip: 'Tổng số sản phẩm',
    },
    {
      id: 'invoices-issued',
      label: 'HĐ đã xuất',
      value: formatNumber(data.totalInvoicesIssued),
      rawValue: data.totalInvoicesIssued,
      icon: Description,
      color: '#10b981',
      bgColor: '#d1fae5',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      tooltip: 'Tổng số hóa đơn đã xuất',
    },
    {
      id: 'pending-approval',
      label: 'Chờ duyệt',
      value: formatNumber(data.totalInvoicesPendingApproval),
      rawValue: data.totalInvoicesPendingApproval,
      icon: PendingActions,
      color: '#ef4444',
      bgColor: '#fee2e2',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      tooltip: 'Số hóa đơn chờ duyệt',
      urgent: data.totalInvoicesPendingApproval > 0,
    },
    {
      id: 'total-debt',
      label: 'Tổng công nợ',
      value: formatCurrency(data.totalDebtAll),
      rawValue: data.totalDebtAll,
      icon: AccountBalance,
      color: '#ec4899',
      bgColor: '#fce7f3',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      tooltip: 'Tổng công nợ hiện tại',
    },
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(7, 1fr)',
        },
        gap: 2,
      }}>
      {stats.map((stat) => {
        const IconComponent = stat.icon
        return (
          <Tooltip key={stat.id} title={stat.tooltip} arrow placement="top">
            <Card
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: `0 20px 40px ${alpha(stat.color, 0.2)}`,
                  borderColor: stat.color,
                  '& .stat-icon': {
                    transform: 'scale(1.1)',
                  },
                },
                ...(stat.urgent && {
                  borderColor: stat.color,
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(stat.color, 0.4)}` },
                    '50%': { boxShadow: `0 0 0 8px ${alpha(stat.color, 0)}` },
                  },
                }),
              }}>
              {/* Gradient Top Bar */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: stat.gradient,
                }}
              />

              <CardContent sx={{ p: 2.5, pt: 3, position: 'relative' }}>
                {/* Icon */}
                <Box
                  className="stat-icon"
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    background: stat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: `0 4px 12px ${alpha(stat.color, 0.3)}`,
                    transition: 'transform 0.3s ease',
                  }}>
                  <IconComponent sx={{ fontSize: 26, color: '#fff' }} />
                </Box>

                {/* Value */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    mb: 0.75,
                    fontSize: { xs: '1.25rem', sm: '1.375rem' },
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}>
                  {stat.value}
                </Typography>

                {/* Label */}
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 500,
                    display: 'block',
                    lineHeight: 1.4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                  {stat.label}
                </Typography>

                {/* Urgent Badge */}
                {stat.urgent && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: stat.color,
                      boxShadow: `0 0 0 3px ${alpha(stat.color, 0.3)}`,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Tooltip>
        )
      })}
    </Box>
  )
}

export default OverviewStatsCards
