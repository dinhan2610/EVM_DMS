import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import StaffKPIs from '../components/staffdashboard/StaffKPIs';
import TaskQueue from '../components/staffdashboard/TaskQueue';
import MyRecentInvoices from '../components/staffdashboard/MyRecentInvoices';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR';
import { USER_ROLES } from '@/constants/roles';
import dashboardService from '@/services/dashboardService';
import type { StaffKPI, TaskItem, RecentInvoice, AccountantDashboardAPI } from '@/types/staff.types';
import dayjs from 'dayjs';

const StaffDashboard = () => {
  usePageTitle('Không gian làm việc')
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('Kế toán');
  const [kpis, setKpis] = useState<StaffKPI>({
    rejectedCount: 0,
    draftsCount: 0,
    sentToday: 0,
    customersToCall: 0,
  });
  const [taskQueue, setTaskQueue] = useState<TaskItem[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Map API data to frontend types
  const mapApiToFrontend = useCallback((data: AccountantDashboardAPI) => {
    // Map current user
    const userName = data.currentUser.fullName || data.currentUser.userName || data.currentUser.email;
    setCurrentUser(userName);

    // Map KPIs
    setKpis({
      rejectedCount: data.kpis.rejectedCount,
      draftsCount: data.kpis.draftsCount,
      sentToday: data.kpis.sentToday,
      customersToCall: data.kpis.customersToCall,
    });

    // Map Task Queue
    const mappedTasks: TaskItem[] = data.taskQueue.map((task, index) => ({
      id: `task-${task.invoiceId}-${index}`,
      type: task.taskType === 'Rejected' ? 'rejected' : 'draft',
      priority: task.priority.toLowerCase() as 'high' | 'medium' | 'low',
      invoiceNumber: task.invoiceNumber === 'N/A' || task.invoiceNumber === 'Draft' 
        ? `#${task.invoiceId}` 
        : task.invoiceNumber,
      customerName: task.customerName,
      reason: task.reason || 'Không có ghi chú',
      amount: task.amount,
      createdDate: new Date(task.taskDate),
      actionUrl: `/invoices/${task.invoiceId}`,
    }));
    setTaskQueue(mappedTasks);

    // Map Recent Invoices
    const mappedInvoices: RecentInvoice[] = data.recentInvoices.map((inv) => ({
      id: inv.invoiceId.toString(),
      invoiceNumber: inv.invoiceNumber === 'Draft' ? `Nháp #${inv.invoiceId}` : inv.invoiceNumber,
      customerName: inv.customerName,
      amount: inv.totalAmount,
      status: mapStatusToFrontend(inv.status),
      createdBy: data.currentUser.fullName || 'Kế toán',
      createdAt: new Date(inv.createdAt),
    }));
    setRecentInvoices(mappedInvoices);

    // Set last updated
    setLastUpdated(dayjs(data.generatedAt).format('HH:mm:ss DD/MM/YYYY'));
  }, []);

  // Map API status to frontend status
  const mapStatusToFrontend = (status: string): RecentInvoice['status'] => {
    const statusMap: Record<string, RecentInvoice['status']> = {
      'Draft': 'Draft',
      'Pending Approval': 'Pending',
      'Pending Sign': 'Pending',
      'Signed': 'Approved',
      'Issued': 'Sent',
      'Rejected': 'Rejected',
      'AdjustmentInProcess': 'Pending',
    };
    return statusMap[status] || 'Draft';
  };

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getAccountantDashboard();
      mapApiToFrontend(data);
      
      console.log('📊 [StaffDashboard] Loaded data:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard';
      setError(errorMessage);
      console.error('[StaffDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [mapApiToFrontend]);

  // Load data on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // 🔥 SignalR Realtime Updates
  useSignalR({
    onDashboardChanged: (payload) => {
      console.log('📨 [StaffDashboard] DashboardChanged event:', payload)
      
      // Accountant refresh khi scope = Invoices
      if (payload.scope === 'Invoices' && payload.roles.includes(USER_ROLES.ACCOUNTANT)) {
        console.log('🔄 [StaffDashboard] Refreshing dashboard data...')
        fetchDashboard()
      }
    },
    onInvoiceChanged: (payload) => {
      console.log('📨 [StaffDashboard] InvoiceChanged event:', payload)
      if (payload.roles.includes(USER_ROLES.ACCOUNTANT)) {
        console.log('🔄 [StaffDashboard] Invoice changed, refreshing...')
        fetchDashboard()
      }
    }
  })

  // Resync data khi SignalR reconnect
  useSignalRReconnect(() => {
    console.log('🔄 [StaffDashboard] SignalR reconnected, resyncing data...')
    fetchDashboard()
  })

  // Event Handlers
  const handleFixNow = (taskId: string, actionUrl: string) => {
    console.log('Fix task:', taskId, '→', actionUrl);
    navigate(actionUrl);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: '#f8fafc'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2, color: '#64748b' }}>
            Đang tải dữ liệu...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              👋 Xin chào, {currentUser}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Quản lý công việc hàng ngày và tăng hiệu suất
              {lastUpdated && (
                <span style={{ marginLeft: 8 }}>
                  • Cập nhật lúc {lastUpdated}
                </span>
              )}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboard}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Làm mới
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchDashboard}>
                Thử lại
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Row 1: Personal KPIs (Workload Status) */}
        <Box sx={{ mb: 3 }}>
          <StaffKPIs data={kpis} />
        </Box>

        {/* Row 2: Main Workspace (Task Queue Full Width) */}
        <Box sx={{ mb: 3 }}>
          <TaskQueue tasks={taskQueue} onFixNow={handleFixNow} />
        </Box>

        {/* Row 3: My Recent Invoices (DataGrid) */}
        <Box>
          <MyRecentInvoices invoices={recentInvoices} />
        </Box>
      </Box>
    </Box>
  );
};

export default StaffDashboard;
