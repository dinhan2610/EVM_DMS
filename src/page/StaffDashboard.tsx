import { Box, Typography } from '@mui/material';
import StaffKPIs from '../components/staffdashboard/StaffKPIs';
import TaskQueue from '../components/staffdashboard/TaskQueue';
import MyRecentInvoices from '../components/staffdashboard/MyRecentInvoices';
import {
  mockStaffKPI,
  mockTaskQueue,
  mockRecentInvoices,
  currentUser,
} from '../types/staff.mockdata';

const StaffDashboard = () => {
  // Event Handlers
  const handleFixNow = (taskId: string, actionUrl: string) => {
    console.log('Fix task:', taskId, '→', actionUrl);
    // TODO: Navigate to edit page
    // navigate(actionUrl);
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Không gian làm việc - {currentUser}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Quản lý công việc hàng ngày và tăng hiệu suất
          </Typography>
        </Box>

        {/* Row 1: Personal KPIs (Workload Status) */}
        <Box sx={{ mb: 3 }}>
          <StaffKPIs data={mockStaffKPI} />
        </Box>

        {/* Row 2: Main Workspace (Task Queue Full Width) */}
        <Box sx={{ mb: 3 }}>
          <TaskQueue tasks={mockTaskQueue} onFixNow={handleFixNow} />
        </Box>

        {/* Row 3: My Recent Invoices (DataGrid) */}
        <Box>
          <MyRecentInvoices invoices={mockRecentInvoices} />
        </Box>
      </Box>
    </Box>
  );
};

export default StaffDashboard;
