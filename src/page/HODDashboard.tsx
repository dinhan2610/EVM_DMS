import { Box, Typography } from '@mui/material'
import DashboardKPIs from '../components/dashboard/DashboardKPIs'
import RevenueChart from '../components/dashboard/RevenueChart'
import InvoiceStatusChart from '../components/dashboard/InvoiceStatusChart'
import RecentActivities from '../components/dashboard/RecentActivities'
import ReportShortcuts from '../components/dashboard/ReportShortcuts'
import type { DashboardKPI } from '../types/dashboard.types'

const HODDashboard = () => {
  // Mock Data
  const kpiData: DashboardKPI = {
    revenueToday: 125000000, // 125 triệu VNĐ
    revenueMonth: 3250000000, // 3.25 tỷ VNĐ
    totalReceivable: 850000000, // 850 triệu VNĐ
    pendingSignatures: 23, // 23 hóa đơn
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Dashboard - Business Intelligence
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Tổng quan hoạt động kinh doanh và hóa đơn điện tử
          </Typography>
        </Box>

        {/* Row 1: KPI Cards */}
        <Box sx={{ mb: 4 }}>
          <DashboardKPIs data={kpiData} />
        </Box>

        {/* Row 2: Charts */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
          <RevenueChart />
          <InvoiceStatusChart />
        </Box>

        {/* Row 3: Recent Activity & Quick Reports */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <RecentActivities />
          <ReportShortcuts />
        </Box>
      </Box>
    </Box>
  )
}

export default HODDashboard
