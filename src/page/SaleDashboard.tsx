import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  Divider,
} from '@mui/material'
import {
  AccessTime,
  TrendingUp,
  TrendingDown,
  Receipt,
  People,
  AccountBalance,
  AttachMoney,
  CheckCircle,
  Cancel,
  Pending,
  Storefront,
  MonetizationOn,
  Group,
} from '@mui/icons-material'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import dashboardService from '@/services/dashboardService'
import type { SalesDashboardAPI } from '@/types/sales.types'
import { USER_ROLES } from '@/constants/roles'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const SaleDashboard = () => {
  usePageTitle('Dashboard - Sales')

  const [data, setData] = useState<SalesDashboardAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getSalesDashboard()
      setData(response)
      console.log('✅ [SaleDashboard] Data loaded:', response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard')
      console.error('❌ Failed to fetch sales dashboard:', err)
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
      if (payload.scope === 'Invoices' && payload.roles.includes(USER_ROLES.SALES)) {
        fetchDashboardData()
      }
    },
    onInvoiceChanged: (payload) => {
      if (payload.roles.includes(USER_ROLES.SALES)) {
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

  // Sales KPIs Cards
  const kpiCards = [
    {
      id: 'revenue',
      label: 'Doanh thu tháng',
      value: formatCurrency(data.salesKPIs.currentRevenue),
      icon: TrendingUp,
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    },
    {
      id: 'lastMonth',
      label: 'Tháng trước',
      value: formatCurrency(data.salesKPIs.lastMonthRevenue),
      icon: MonetizationOn,
      color: '#64748b',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    },
    {
      id: 'growth',
      label: 'Tăng trưởng',
      value: `${data.salesKPIs.revenueGrowthPercent >= 0 ? '+' : ''}${data.salesKPIs.revenueGrowthPercent}%`,
      icon: data.salesKPIs.revenueGrowthPercent >= 0 ? TrendingUp : TrendingDown,
      color: data.salesKPIs.revenueGrowthPercent >= 0 ? '#22c55e' : '#ef4444',
      gradient:
        data.salesKPIs.revenueGrowthPercent >= 0
          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
    {
      id: 'customers',
      label: 'Khách hàng',
      value: formatNumber(data.salesKPIs.totalCustomers),
      icon: People,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
  ]

  // Invoice Request Stats
  const invoiceStats = [
    { label: 'Chờ duyệt', value: data.invoiceRequestStats.pendingCount, color: '#f59e0b', bgColor: '#fef3c7' },
    { label: 'Đã duyệt', value: data.invoiceRequestStats.approvedCount, color: '#22c55e', bgColor: '#dcfce7' },
    { label: 'Từ chối', value: data.invoiceRequestStats.rejectedCount, color: '#ef4444', bgColor: '#fee2e2' },
    { label: 'Đã xuất HĐ', value: data.invoiceRequestStats.issuedCount, color: '#0ea5e9', bgColor: '#e0f2fe' },
  ]

  // Status config for recent requests
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
      Invoice_Issued: { label: 'Đã xuất HĐ', color: '#10b981', bgColor: '#d1fae5', icon: CheckCircle },
      Approved: { label: 'Đã duyệt', color: '#22c55e', bgColor: '#dcfce7', icon: CheckCircle },
      Rejected: { label: 'Từ chối', color: '#ef4444', bgColor: '#fee2e2', icon: Cancel },
      Pending: { label: 'Chờ duyệt', color: '#f59e0b', bgColor: '#fef3c7', icon: Pending },
    }
    return statusMap[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: Pending }
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
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
              <Storefront sx={{ fontSize: 32, color: '#fff' }} />
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
                Xin chào, {data.currentUser.fullName}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 400,
                  mt: 0.5,
                }}>
                Không gian làm việc của Nhân viên bán hàng
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
            {data.salesKPIs.revenueGrowthPercent !== 0 && (
              <Chip
                icon={
                  data.salesKPIs.revenueGrowthPercent >= 0 ? (
                    <TrendingUp sx={{ color: '#22c55e !important', fontSize: 18 }} />
                  ) : (
                    <TrendingDown sx={{ color: '#ef4444 !important', fontSize: 18 }} />
                  )
                }
                label={`${data.salesKPIs.revenueGrowthPercent >= 0 ? '+' : ''}${data.salesKPIs.revenueGrowthPercent}% so với tháng trước`}
                sx={{
                  bgcolor: data.salesKPIs.revenueGrowthPercent >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: data.salesKPIs.revenueGrowthPercent >= 0 ? '#22c55e' : '#ef4444',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${data.salesKPIs.revenueGrowthPercent >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  px: 1,
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Section 1: Sales KPIs */}
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
              Chỉ số bán hàng
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}>
            {kpiCards.map((kpi) => {
              const IconComponent = kpi.icon
              return (
                <Card
                  key={kpi.id}
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
                      boxShadow: `0 12px 24px ${alpha(kpi.color, 0.2)}`,
                      borderColor: kpi.color,
                    },
                  }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: kpi.gradient,
                    }}
                  />
                  <CardContent sx={{ p: 2.5, pt: 3 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: kpi.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: `0 4px 12px ${alpha(kpi.color, 0.3)}`,
                      }}>
                      <IconComponent sx={{ fontSize: 24, color: '#fff' }} />
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        mb: 0.5,
                        letterSpacing: '-0.02em',
                      }}>
                      {kpi.value}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>{kpi.label}</Typography>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Box>

        {/* Section 2: Invoice Requests & Debt Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Invoice Request Stats */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Receipt sx={{ fontSize: 24, color: '#f59e0b', mr: 1.5 }} />
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>Yêu cầu xuất hóa đơn</Typography>
                  <Chip
                    label={`${data.invoiceRequestStats.totalThisMonth} tháng này`}
                    size="small"
                    sx={{ ml: 'auto', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '10px' }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                  {invoiceStats.map((stat) => (
                    <Box key={stat.label} sx={{ textAlign: 'center', p: 2, bgcolor: stat.bgColor, borderRadius: 2 }}>
                      <Typography sx={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                      <Typography sx={{ fontSize: '10px', color: stat.color, fontWeight: 500 }}>{stat.label}</Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748b', mb: 2 }}>Yêu cầu gần đây</Typography>
                <TableContainer sx={{ maxHeight: 220 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc' }}>Khách hàng</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc' }} align="right">
                          Số tiền
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc' }} align="center">
                          Trạng thái
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.invoiceRequestStats.recentRequests.slice(0, 5).map((req) => {
                        const statusConfig = getStatusConfig(req.status)
                        return (
                          <TableRow key={req.requestId} hover>
                            <TableCell>
                              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }} noWrap>
                                {req.customerName}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: '#64748b' }}>{dayjs(req.createdDate).format('DD/MM/YYYY')}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(req.amount)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={statusConfig.label}
                                size="small"
                                sx={{
                                  bgcolor: statusConfig.bgColor,
                                  color: statusConfig.color,
                                  fontWeight: 600,
                                  fontSize: '9px',
                                  height: 20,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Debt Summary */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AccountBalance sx={{ fontSize: 24, color: '#8b5cf6', mr: 1.5 }} />
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>Tình hình công nợ</Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                  <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Group sx={{ fontSize: 18, color: '#8b5cf6' }} />
                      <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Số khách nợ</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{data.totalCustomerDebt.totalDebtors}</Typography>
                  </Box>
                  <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AttachMoney sx={{ fontSize: 18, color: '#f59e0b' }} />
                      <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Tổng chưa thu</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                      {formatCurrency(data.totalCustomerDebt.totalUnpaidAmount)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Phân bổ theo mức độ</Typography>
                  </Box>
                  {[
                    { label: 'Trung bình', value: data.totalCustomerDebt.debtByUrgency.medium, color: '#f59e0b' },
                    { label: 'Cao', value: data.totalCustomerDebt.debtByUrgency.high, color: '#f97316' },
                    { label: 'Nghiêm trọng', value: data.totalCustomerDebt.debtByUrgency.critical, color: '#ef4444' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#475569' }}>{item.label}</Typography>
                        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: item.color }}>{formatCurrency(item.value)}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={data.totalCustomerDebt.totalUnpaidAmount > 0 ? (item.value / data.totalCustomerDebt.totalUnpaidAmount) * 100 : 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(item.color, 0.15),
                          '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 },
                        }}
                      />
                    </Box>
                  ))}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: data.totalCustomerDebt.totalOverdueAmount > 0 ? '#fef2f2' : '#f0fdf4',
                    borderRadius: 2,
                  }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        color: data.totalCustomerDebt.totalOverdueAmount > 0 ? '#991b1b' : '#166534',
                        fontWeight: 500,
                      }}>
                      Quá hạn
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: data.totalCustomerDebt.totalOverdueAmount > 0 ? '#dc2626' : '#22c55e',
                      }}>
                      {formatCurrency(data.totalCustomerDebt.totalOverdueAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        color: data.totalCustomerDebt.overdueCustomerCount > 0 ? '#991b1b' : '#166534',
                        fontWeight: 500,
                      }}>
                      Số KH quá hạn
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: data.totalCustomerDebt.overdueCustomerCount > 0 ? '#dc2626' : '#22c55e',
                      }}>
                      {data.totalCustomerDebt.overdueCustomerCount}
                    </Typography>
                  </Box>
                </Box>

                {data.totalCustomerDebt.averageDebtPerCustomer > 0 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Nợ trung bình/khách</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                        {formatCurrency(data.totalCustomerDebt.averageDebtPerCustomer)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default SaleDashboard
