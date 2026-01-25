import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Alert, CircularProgress, Paper, Chip } from '@mui/material'
import { CalendarMonth, AccessTime } from '@mui/icons-material'
import OverviewStatsCards from '../components/dashboard/OverviewStatsCards'
import FinancialHealthCards from '../components/dashboard/FinancialHealthCards'
import DebtAgingChart from '../components/dashboard/DebtAgingChart'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import dashboardService from '@/services/dashboardService'
import type { HODDashboardData } from '@/types/dashboard.types'
import { USER_ROLES } from '@/constants/roles'

const HODDashboard = () => {
  usePageTitle('Dashboard - Kế toán trưởng')

  const [data, setData] = useState<HODDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch HOD Dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getHODDashboard()
      setData(response)
      console.log('✅ [HODDashboard] Data loaded successfully:', response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard')
      console.error('❌ Failed to fetch HOD dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // 🔥 SignalR Realtime Updates
  useSignalR({
    onDashboardChanged: (payload) => {
      console.log('📨 [HODDashboard] DashboardChanged event:', payload)

      // HOD chỉ refresh khi scope = Invoices
      if (payload.scope === 'Invoices' && payload.roles.includes(USER_ROLES.HOD)) {
        console.log('🔄 [HODDashboard] Refreshing dashboard data...')
        fetchDashboardData()
      }
    },
    onInvoiceChanged: (payload) => {
      console.log('📨 [HODDashboard] InvoiceChanged event:', payload)
      // Refresh dashboard khi có invoice thay đổi
      if (payload.roles.includes(USER_ROLES.HOD)) {
        console.log('🔄 [HODDashboard] Invoice changed, refreshing...')
        fetchDashboardData()
      }
    },
  })

  // Resync data khi SignalR reconnect
  useSignalRReconnect(() => {
    console.log('🔄 [HODDashboard] SignalR reconnected, resyncing data...')
    fetchDashboardData()
  })

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

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  // No data state
  if (!data) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          Không có dữ liệu
        </Alert>
      </Box>
    )
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const generatedTime = formatDateTime(data.generatedAt)

  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        minHeight: '100vh',
        pb: 4,
      }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
          borderRadius: 0,
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          mb: 4,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            opacity: 0.5,
          },
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
                  lineHeight: 1.2,
                }}>
                Dashboard Kế toán trưởng
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 400,
                  mt: 0.5,
                  letterSpacing: '0.01em',
                }}>
                Phân tích tài chính nâng cao & Quản lý dòng tiền toàn diện
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              mt: 3,
            }}>
            <Chip
              icon={<CalendarMonth sx={{ color: '#fff !important', fontSize: 18 }} />}
              label={`Kỳ kế toán: ${data.fiscalMonth}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                px: 1,
                '& .MuiChip-icon': {
                  color: '#fff',
                },
              }}
            />
            <Chip
              icon={<AccessTime sx={{ color: '#fff !important', fontSize: 18 }} />}
              label={`Cập nhật lúc: ${generatedTime.time} - ${generatedTime.date}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                px: 1,
                '& .MuiChip-icon': {
                  color: '#fff',
                },
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Section 1: Overview Statistics */}
        <Box sx={{ mb: 5 }}>
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#1e293b',
                letterSpacing: '-0.02em',
                fontSize: '1.125rem',
              }}>
              Tổng quan hoạt động
            </Typography>
          </Box>
          <OverviewStatsCards data={data.overviewStats} />
        </Box>

        {/* Section 2: Financial Health KPIs */}
        <Box sx={{ mb: 5 }}>
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#1e293b',
                letterSpacing: '-0.02em',
                fontSize: '1.125rem',
              }}>
              Tình hình tài chính
            </Typography>
          </Box>
          <FinancialHealthCards data={data.financials} />
        </Box>

        {/* Section 3: Analytics Charts */}
        <Box sx={{ mb: 5 }}>
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#1e293b',
                letterSpacing: '-0.02em',
                fontSize: '1.125rem',
              }}>
              Phân tích chuyên sâu
            </Typography>
          </Box>
          <DebtAgingChart data={data.debtAging} />
        </Box>
      </Box>
    </Box>
  )
}

export default HODDashboard
