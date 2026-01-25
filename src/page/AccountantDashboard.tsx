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
  IconButton,
  Tooltip,
  alpha,
  Divider,
} from '@mui/material'
import {
  AccessTime,
  TrendingUp,
  Receipt,
  Inventory,
  Description,
  PendingActions,
  AccountBalance,
  Visibility,
  AttachMoney,
  Group,
  CalendarMonth,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import dashboardService from '@/services/dashboardService'
import type { AccountantDashboardAPI } from '@/types/staff.types'
import { USER_ROLES } from '@/constants/roles'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const AccountantDashboard = () => {
  usePageTitle('Dashboard - Kế toán viên')
  const navigate = useNavigate()

  const [data, setData] = useState<AccountantDashboardAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getAccountantDashboard()
      setData(response)
      console.log('✅ [AccountantDashboard] Data loaded:', response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard')
      console.error('❌ Failed to fetch accountant dashboard:', err)
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
      if (payload.scope === 'Invoices' && payload.roles.includes(USER_ROLES.ACCOUNTANT)) {
        fetchDashboardData()
      }
    },
    onInvoiceChanged: (payload) => {
      if (payload.roles.includes(USER_ROLES.ACCOUNTANT)) {
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

  const generatedTime = dayjs(data.generatedAt).format('HH:mm - DD/MM/YYYY')

  // Overview Stats Cards
  const overviewStats = [
    {
      id: 'revenue',
      label: 'Doanh thu tháng',
      value: formatCurrency(data.overviewStats.totalMonthlyRevenue),
      icon: TrendingUp,
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    },
    {
      id: 'requests',
      label: 'Yêu cầu xuất HĐ',
      value: formatNumber(data.overviewStats.totalInvoiceRequests),
      icon: Receipt,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      value: formatNumber(data.overviewStats.totalProducts),
      icon: Inventory,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    },
    {
      id: 'issued',
      label: 'HĐ đã xuất',
      value: formatNumber(data.overviewStats.totalInvoicesIssued),
      icon: Description,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      id: 'pending',
      label: 'Chờ duyệt',
      value: formatNumber(data.overviewStats.totalInvoicesPendingApproval),
      icon: PendingActions,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      urgent: data.overviewStats.totalInvoicesPendingApproval > 0,
    },
    {
      id: 'debt',
      label: 'Tổng công nợ',
      value: formatCurrency(data.overviewStats.totalDebtAll),
      icon: AccountBalance,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
  ]

  // Invoice Status Mapping
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      Draft: { label: 'Nháp', color: '#64748b', bgColor: '#f1f5f9' },
      'Pending Approval': { label: 'Chờ duyệt', color: '#f59e0b', bgColor: '#fef3c7' },
      'Pending Sign': { label: 'Chờ ký', color: '#8b5cf6', bgColor: '#f3e8ff' },
      Signed: { label: 'Đã ký', color: '#0ea5e9', bgColor: '#e0f2fe' },
      Issued: { label: 'Đã phát hành', color: '#10b981', bgColor: '#d1fae5' },
      Replaced: { label: 'Đã thay thế', color: '#06b6d4', bgColor: '#cffafe' },
      Adjusted: { label: 'Đã điều chỉnh', color: '#0d9488', bgColor: '#ccfbf1' },
      Rejected: { label: 'Từ chối', color: '#ef4444', bgColor: '#fee2e2' },
      'TaxAuthority Approved': { label: 'CQT Phê duyệt', color: '#059669', bgColor: '#d1fae5' },
      'TaxAuthority Rejected': { label: 'CQT Từ chối', color: '#dc2626', bgColor: '#fecaca' },
      AdjustmentInProcess: { label: 'Đang điều chỉnh', color: '#f97316', bgColor: '#ffedd5' },
      ReplacementInProcess: { label: 'Đang thay thế', color: '#0891b2', bgColor: '#cffafe' },
      Invoice_Issued: { label: 'Đã xuất HĐ', color: '#10b981', bgColor: '#d1fae5' },
      Approved: { label: 'Đã duyệt', color: '#22c55e', bgColor: '#dcfce7' },
    }
    return statusMap[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9' }
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
          borderRadius: 0,
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          mb: 4,
        }}>
        <Box sx={{ maxWidth: 1600, mx: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
              <CalendarMonth sx={{ fontSize: 32, color: '#fff' }} />
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
                Không gian làm việc của Kế toán viên
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
            <Chip
              icon={<AccessTime sx={{ color: '#fff !important', fontSize: 18 }} />}
              label={`Cập nhật: ${generatedTime}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                px: 1,
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Section 1: Overview Stats */}
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
              Tổng quan hoạt động
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
              gap: 2,
            }}>
            {overviewStats.map((stat) => {
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
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
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

        {/* Section 2: Invoice Request Stats & Debt Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Invoice Request Stats */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Receipt sx={{ fontSize: 24, color: '#f59e0b', mr: 1.5 }} />
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>Yêu cầu xuất hóa đơn</Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{data.invoiceRequestStats.pendingCount}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#92400e', fontWeight: 500 }}>Chờ xử lý</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#dcfce7', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{data.invoiceRequestStats.processedCount}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#166534', fontWeight: 500 }}>Đã xử lý</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fee2e2', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{data.invoiceRequestStats.rejectedCount}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#991b1b', fontWeight: 500 }}>Từ chối</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e0f2fe', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#0284c7' }}>{data.invoiceRequestStats.totalThisMonth}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#075985', fontWeight: 500 }}>Tổng tháng</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748b', mb: 2 }}>Yêu cầu gần đây</Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {data.invoiceRequestStats.recentRequests.slice(0, 5).map((req) => {
                    const statusConfig = getStatusConfig(req.status)
                    return (
                      <Box
                        key={req.requestId}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1.5,
                          borderBottom: '1px solid #f1f5f9',
                          '&:last-child': { borderBottom: 'none' },
                        }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', mb: 0.25 }} noWrap>
                            {req.customerName}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#64748b' }}>{formatCurrency(req.totalAmount)}</Typography>
                        </Box>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: '10px',
                            height: 22,
                          }}
                        />
                      </Box>
                    )
                  })}
                </Box>
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
                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{data.totalMonthlyDebt.totalDebtors}</Typography>
                  </Box>
                  <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AttachMoney sx={{ fontSize: 18, color: '#f59e0b' }} />
                      <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Tổng chưa thu</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                      {formatCurrency(data.totalMonthlyDebt.totalUnpaidAmount)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Phân bổ theo mức độ</Typography>
                  </Box>
                  {[
                    { label: 'Trung bình', value: data.totalMonthlyDebt.debtByUrgency.medium, color: '#f59e0b' },
                    { label: 'Cao', value: data.totalMonthlyDebt.debtByUrgency.high, color: '#f97316' },
                    { label: 'Nghiêm trọng', value: data.totalMonthlyDebt.debtByUrgency.critical, color: '#ef4444' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#475569' }}>{item.label}</Typography>
                        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: item.color }}>{formatCurrency(item.value)}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={data.totalMonthlyDebt.totalUnpaidAmount > 0 ? (item.value / data.totalMonthlyDebt.totalUnpaidAmount) * 100 : 0}
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

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '11px', color: '#991b1b', fontWeight: 500 }}>Quá hạn</Typography>
                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                      {formatCurrency(data.totalMonthlyDebt.totalOverdueAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '11px', color: '#991b1b', fontWeight: 500 }}>Số KH quá hạn</Typography>
                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>{data.totalMonthlyDebt.overdueCustomerCount}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Section 3: Recent Invoices */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)',
                mr: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
              Hóa đơn gần đây ({data.recentInvoicesTotal})
            </Typography>
          </Box>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#64748b', bgcolor: '#f8fafc' }}>Số HĐ</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#64748b', bgcolor: '#f8fafc' }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#64748b', bgcolor: '#f8fafc' }}>Số tiền</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#64748b', bgcolor: '#f8fafc' }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#64748b', bgcolor: '#f8fafc' }}>Ngày tạo</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#64748b', bgcolor: '#f8fafc' }} align="center">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentInvoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status)
                    return (
                      <TableRow key={invoice.invoiceId} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0ea5e9' }}>
                            {invoice.invoiceNumber || `Nháp #${invoice.invoiceId}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }} noWrap>
                            {invoice.customerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(invoice.totalAmount)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              bgcolor: statusConfig.bgColor,
                              color: statusConfig.color,
                              fontWeight: 600,
                              fontSize: '10px',
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', color: '#64748b' }}>{dayjs(invoice.createdAt).format('HH:mm DD/MM/YYYY')}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton size="small" onClick={() => navigate(`/invoices/${invoice.invoiceId}`)} sx={{ color: '#0ea5e9' }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default AccountantDashboard
