import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Alert, CircularProgress, Paper, Chip, Card, CardContent, Grid, LinearProgress, alpha } from '@mui/material'
import {
  AccessTime,
  TrendingUp,
  TrendingDown,
  Receipt,
  People,
  AccountBalance,
  MonetizationOn,
  CreditCard,
  Warning,
  CheckCircle,
  AdminPanelSettings,
  EmojiEvents,
  Business,
} from '@mui/icons-material'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import dashboardService from '@/services/dashboardService'
import type { AdminDashboardData } from '@/types/dashboard.types'
import { USER_ROLES } from '@/constants/roles'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { ResponsiveContainer, Cell, PieChart, Pie, Legend, Tooltip as RechartsTooltip } from 'recharts'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const AdminDashboard = () => {
  usePageTitle('Dashboard - Quản trị viên')

  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getAdminDashboard()
      setData(response)
      console.log('✅ [AdminDashboard] Data loaded:', response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard')
      console.error('❌ Failed to fetch admin dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // SignalR Updates
  useSignalR({
    onDashboardChanged: (payload) => {
      if (payload.roles.includes(USER_ROLES.ADMIN)) {
        fetchDashboardData()
      }
    },
    onInvoiceChanged: (payload) => {
      if (payload.roles.includes(USER_ROLES.ADMIN)) {
        fetchDashboardData()
      }
    },
    onUserChanged: (payload) => {
      if (payload.roles.includes(USER_ROLES.ADMIN)) {
        fetchDashboardData()
      }
    },
  })

  useSignalRReconnect(() => {
    fetchDashboardData()
  })

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatCurrencyCompact = (value: number): string => {
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B ₫`
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M ₫`
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K ₫`
    }
    return formatCurrency(value)
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#f8fafc',
        }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
            Đang tải dữ liệu dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          Không có dữ liệu
        </Alert>
      </Box>
    )
  }

  // Current Month Financial Stats
  const currentMonthStats = [
    {
      id: 'revenue',
      label: 'Doanh thu tháng',
      value: formatCurrency(data.currentMonthStats.totalRevenue),
      icon: TrendingUp,
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    },
    {
      id: 'profit',
      label: 'Lợi nhuận ròng',
      value: formatCurrency(data.currentMonthStats.netProfit),
      icon: MonetizationOn,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      id: 'tax',
      label: 'Thuế phải nộp',
      value: formatCurrency(data.currentMonthStats.taxLiability),
      icon: AccountBalance,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    {
      id: 'collected',
      label: 'Đã thu',
      value: formatCurrency(data.currentMonthStats.collectedAmount),
      icon: CheckCircle,
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    {
      id: 'outstanding',
      label: 'Còn nợ',
      value: formatCurrency(data.currentMonthStats.outstandingAmount),
      icon: CreditCard,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    {
      id: 'overdue',
      label: 'Quá hạn',
      value: formatCurrency(data.currentMonthStats.overdueAmount),
      icon: Warning,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      urgent: data.currentMonthStats.overdueAmount > 0,
    },
  ]

  // Invoice counts for pie chart
  const invoiceCountsData = [
    { name: 'Đã thanh toán', value: data.invoiceCounts.paid, color: '#22c55e' },
    { name: 'Chưa thanh toán', value: data.invoiceCounts.unpaid, color: '#f59e0b' },
    { name: 'Quá hạn', value: data.invoiceCounts.overdue, color: '#ef4444' },
    { name: 'Đã hủy', value: data.invoiceCounts.cancelled, color: '#94a3b8' },
  ].filter((item) => item.value > 0)

  // User stats for pie chart
  const usersByRoleData =
    data.userStats.usersByRole?.map((item, index) => {
      const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
      const roleLabels: Record<string, string> = {
        Admin: 'Quản trị viên',
        Accountant: 'Kế toán',
        Sale: 'Nhân viên bán hàng',
        HOD: 'Trưởng phòng',
        Customer: 'Khách hàng',
      }
      return {
        name: roleLabels[item.role] || item.role,
        value: item.count,
        color: colors[index % colors.length],
      }
    }) || []

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          borderRadius: 0,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4 },
          mb: 4,
        }}>
        <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
              <AdminPanelSettings sx={{ fontSize: 32, color: '#fff' }} />
            </Box>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  letterSpacing: '-0.025em',
                }}>
                Admin Dashboard
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 400,
                  mt: 0.5,
                }}>
                Tổng quan tài chính, người dùng và hoạt động hệ thống
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
            <Chip
              icon={<AccessTime sx={{ color: '#fff !important', fontSize: 18 }} />}
              label={`Cập nhật: ${dayjs().format('HH:mm - DD/MM/YYYY')}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                px: 1,
              }}
            />
            {data.revenueGrowthPercentage !== 0 && (
              <Chip
                icon={
                  data.revenueGrowthPercentage >= 0 ? (
                    <TrendingUp sx={{ color: '#22c55e !important', fontSize: 18 }} />
                  ) : (
                    <TrendingDown sx={{ color: '#ef4444 !important', fontSize: 18 }} />
                  )
                }
                label={`${data.revenueGrowthPercentage >= 0 ? '+' : ''}${data.revenueGrowthPercentage}% tăng trưởng`}
                sx={{
                  bgcolor: data.revenueGrowthPercentage >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: data.revenueGrowthPercentage >= 0 ? '#22c55e' : '#ef4444',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${data.revenueGrowthPercentage >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  px: 1,
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Section 1: Current Month Financial Stats */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%)',
                mr: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
              Tài chính tháng này
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
              gap: 2,
            }}>
            {currentMonthStats.map((stat) => {
              const IconComponent = stat.icon
              return (
                <Card
                  key={stat.id}
                  elevation={0}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 3,
                    bgcolor: '#fff',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(stat.color, 0.2)}`,
                      borderColor: stat.color,
                    },
                    ...(stat.urgent && {
                      borderColor: stat.color,
                      animation: 'pulse 2s infinite',
                    }),
                  }}>
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
                  <CardContent sx={{ p: 2.5, pt: 3 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: stat.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: `0 4px 12px ${alpha(stat.color, 0.3)}`,
                      }}>
                      <IconComponent sx={{ fontSize: 24, color: '#fff' }} />
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        mb: 0.5,
                        letterSpacing: '-0.02em',
                      }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>{stat.label}</Typography>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Box>

        {/* Section 2: All Time Stats Summary */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #8b5cf6 0%, #a855f7 100%)',
                mr: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
              Thống kê tổng (All Time)
            </Typography>
          </Box>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
                  gap: 3,
                }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mb: 0.5 }}>TỔNG DOANH THU</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0ea5e9' }}>
                    {formatCurrency(data.allTimeStats.totalRevenue)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mb: 0.5 }}>TỔNG LỢI NHUẬN</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(data.allTimeStats.netProfit)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mb: 0.5 }}>TỔNG THUẾ</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
                    {formatCurrency(data.allTimeStats.taxLiability)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mb: 0.5 }}>ĐÃ THU</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>
                    {formatCurrency(data.allTimeStats.collectedAmount)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mb: 0.5 }}>CÒN NỢ</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>
                    {formatCurrency(data.allTimeStats.outstandingAmount)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mb: 0.5 }}>QUÁ HẠN</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                    {formatCurrency(data.allTimeStats.overdueAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Section 3: Charts Row - Invoice Counts, User Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Invoice Counts Pie Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Receipt sx={{ fontSize: 24, color: '#f59e0b', mr: 1.5 }} />
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>Trạng thái hóa đơn</Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography sx={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>{data.invoiceCounts.total}</Typography>
                  <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Tổng hóa đơn</Typography>
                </Box>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={invoiceCountsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {invoiceCountsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span style={{ fontSize: '11px', color: '#64748b' }}>{value}</span>}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [formatNumber(value), '']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* User Stats */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ fontSize: 24, color: '#8b5cf6', mr: 1.5 }} />
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>Thống kê người dùng</Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>{data.userStats.totalUsers}</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Tổng người dùng</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>+{data.userStats.newUsersThisMonth}</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Mới tháng này</Typography>
                  </Box>
                </Box>

                {usersByRoleData.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b', mb: 2 }}>Phân bổ theo vai trò</Typography>
                    {usersByRoleData.map((role) => (
                      <Box key={role.name} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '12px', color: '#475569' }}>{role.name}</Typography>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: role.color }}>{role.value}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(role.value / data.userStats.totalUsers) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(role.color, 0.15),
                            '& .MuiLinearProgress-bar': { bgcolor: role.color, borderRadius: 3 },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Section 4: Top Customers */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #10b981 0%, #0d9488 100%)',
                mr: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
              Top 5 khách hàng
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
            {data.topCustomers.map((customer, index) => {
              const medalColors = [
                { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: '#f59e0b', text: '#78350f' },
                { bg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', border: '#64748b', text: '#1e293b' },
                { bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', border: '#b45309', text: '#451a03' },
                { bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', border: '#0284c7', text: '#082f49' },
                { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: '#7c3aed', text: '#2e1065' },
              ]
              const medal = medalColors[index] || medalColors[4]
              const maxSpent = Math.max(...data.topCustomers.map((c) => c.totalSpent))
              const percentage = maxSpent > 0 ? (customer.totalSpent / maxSpent) * 100 : 0

              return (
                <Card
                  key={index}
                  elevation={0}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 3,
                    bgcolor: '#fff',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(medal.border, 0.2)}`,
                      borderColor: medal.border,
                    },
                  }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: medal.bg,
                    }}
                  />
                  <CardContent sx={{ p: 2.5, pt: 3 }}>
                    {/* Rank Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: medal.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${alpha(medal.border, 0.3)}`,
                        }}>
                        {index < 3 ? (
                          <EmojiEvents sx={{ fontSize: 22, color: '#fff' }} />
                        ) : (
                          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{index + 1}</Typography>
                        )}
                      </Box>
                      <Chip
                        label={`${customer.invoiceCount} HĐ`}
                        size="small"
                        sx={{
                          bgcolor: alpha(medal.border, 0.1),
                          color: medal.border,
                          fontWeight: 600,
                          fontSize: '10px',
                          height: 22,
                        }}
                      />
                    </Box>

                    {/* Customer Name */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                      <Business sx={{ fontSize: 18, color: '#64748b', mt: 0.25 }} />
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1e293b',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 36,
                        }}>
                        {customer.customerName}
                      </Typography>
                    </Box>

                    {/* Total Spent */}
                    <Typography
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: medal.border,
                        mb: 1.5,
                        letterSpacing: '-0.02em',
                      }}>
                      {formatCurrencyCompact(customer.totalSpent)}
                    </Typography>

                    {/* Progress Bar */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '10px', color: '#64748b' }}>% tổng top</Typography>
                        <Typography sx={{ fontSize: '10px', fontWeight: 600, color: medal.border }}>{percentage.toFixed(0)}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(medal.border, 0.15),
                          '& .MuiLinearProgress-bar': { bgcolor: medal.border, borderRadius: 3 },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard
