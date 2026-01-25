import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Alert, CircularProgress } from '@mui/material'
import FinancialHealthCards from '../components/dashboard/FinancialHealthCards'
import CashFlowChart from '../components/dashboard/CashFlowChart'
import DebtAgingChart from '../components/dashboard/DebtAgingChart'
import ApprovalQueue from '../components/dashboard/ApprovalQueue'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import dashboardService from '@/services/dashboardService'
import type { HODDashboardData, PendingInvoice } from '@/types/dashboard.types'
import { USER_ROLES } from '@/constants/roles'

const HODDashboard = () => {
  usePageTitle('Tổng quan - Kế toán trưởng')
  
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
      console.log('✅ [HODDashboard] Data loaded successfully')
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
    }
  })

  // Resync data khi SignalR reconnect
  useSignalRReconnect(() => {
    console.log('🔄 [HODDashboard] SignalR reconnected, resyncing data...')
    fetchDashboardData()
  })

  // Event Handlers
  const handleBulkApprove = (invoiceIds: string[]) => {
    console.log('Bulk approve invoices:', invoiceIds)
    // TODO: Implement API call for bulk approval
  }

  const handleQuickView = (invoice: PendingInvoice) => {
    console.log('Quick view invoice:', invoice.invoiceId)
    // TODO: Open invoice detail modal
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  // No data state
  if (!data) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">Không có dữ liệu</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Dashboard - Financial Command Center
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Phân tích tài chính nâng cao & Quản lý dòng tiền
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
            Cập nhật: {new Date(data.generatedAt).toLocaleString('vi-VN')} • Kỳ: {data.fiscalMonth}
          </Typography>
        </Box>

        {/* Row 1: Financial Health KPIs */}
        <Box sx={{ mb: 3 }}>
          <FinancialHealthCards data={data.financials} />
        </Box>

        {/* Row 2: Deep Dive Charts (60% + 40%) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
            gap: 3,
            mb: 3,
          }}
        >
          <CashFlowChart data={data.cashFlow} />
          <DebtAgingChart data={data.debtAging} />
        </Box>

        {/* Row 3: Approval Queue - Action Center */}
        <Box>
          <ApprovalQueue
            invoices={data.pendingInvoices}
            onBulkApprove={handleBulkApprove}
            onQuickView={handleQuickView}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default HODDashboard
