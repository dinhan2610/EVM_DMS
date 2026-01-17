import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, CircularProgress, Alert } from '@mui/material'
import FinancialKPIs from '../components/admindashboard/FinancialKPIs'
import RevenueChart from '../components/admindashboard/RevenueChart'
import TopCustomersChart from '../components/admindashboard/TopCustomersChart'
import RecentInvoicesTable from '../components/admindashboard/RecentInvoicesTable'
import AuditLogTable from '../components/admindashboard/AuditLogTable'
import auditService from '@/services/auditService'
import dashboardService from '@/services/dashboardService'
import type { AuditLog } from '../types/admin.types'
import type { AdminDashboardData } from '../types/dashboard.types'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([])
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await dashboardService.getAdminDashboard()
        setDashboardData(data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Fetch recent activity logs (10 latest)
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await auditService.getActivityLogs({
          pageIndex: 1,
          pageSize: 10, // Show 10 most recent
        })

        // Map ActivityLog to AuditLog format for AuditLogTable component
        const mappedLogs: AuditLog[] = response.items.map((log) => ({
          id: log.logId.toString(),
          timestamp: new Date(log.timestamp),
          actor: {
            name: log.userId === 'System' ? 'System' : `User ${log.userId}`,
          },
          role: log.userId === 'System' ? 'Admin' : 'Staff', // Default mapping
          action: `${auditService.getActionNameLabel(log.actionName)}: ${log.description}`,
          ip: log.ipAddress,
          status: log.status === 'Success' ? 'success' : 'failed',
        }))

        setActivityLogs(mappedLogs)
      } catch (error) {
        console.error('Failed to fetch activity logs:', error)
        setActivityLogs([])
      }
    }

    fetchActivityLogs()
  }, [])

  const handleViewAllLogs = () => {
    navigate('/admin/audit-logs')
  }

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không thể tải dữ liệu dashboard'}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tổng quan tài chính, người dùng và hoạt động hệ thống
        </Typography>
      </Box>

      {/* Row 1: Financial KPIs (6 cards) */}
      <FinancialKPIs
        currentMonthStats={dashboardData.currentMonthStats}
        invoiceCounts={dashboardData.invoiceCounts}
        userStats={dashboardData.userStats}
        revenueGrowth={dashboardData.revenueGrowthPercentage}
      />

      {/* Row 2: Revenue Chart & Top Customers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
          mt: 3,
        }}
      >
        {/* Revenue Chart (Left - 8 columns) */}
        <RevenueChart
          data={dashboardData.revenueTrend}
          growthPercentage={dashboardData.revenueGrowthPercentage}
        />

        {/* Top Customers Chart (Right - 4 columns) */}
        <TopCustomersChart data={dashboardData.topCustomers} />
      </Box>

      {/* Row 3: Recent Invoices Table */}
      <Box sx={{ mt: 3 }}>
        <RecentInvoicesTable invoices={dashboardData.recentInvoices} />
      </Box>

      {/* Row 4: Audit Logs Table (Full Width) */}
      <Box sx={{ mt: 3 }}>
        <AuditLogTable logs={activityLogs} onViewAll={handleViewAllLogs} />
      </Box>
    </Box>
  )
}

export default AdminDashboard
