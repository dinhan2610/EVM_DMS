import React from 'react';
import { Box, Typography } from '@mui/material';
import SystemKPIs from '../components/admin/SystemKPIs';
import TrafficChart from '../components/admin/TrafficChart';
import UserDistributionChart from '../components/admin/UserDistributionChart';
import AuditLogTable from '../components/admin/AuditLogTable';
import {
  mockKPIData,
  mockTrafficData,
  mockUserDistribution,
  mockAuditLogs,
} from '../types/admin.mockdata';

const AdminDashboard: React.FC = () => {
  const handleViewAllLogs = () => {
    // Navigate to detailed audit logs page
    console.log('Navigate to /admin/audit-logs');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Giám sát hệ thống, bảo mật và quản lý người dùng
        </Typography>
      </Box>

      {/* Row 1: System KPIs */}
      <SystemKPIs kpis={mockKPIData} />

      {/* Row 2: Analytics Charts */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
          mt: 3,
        }}
      >
        {/* Traffic Chart (Left - 8 columns) */}
        <TrafficChart data={mockTrafficData} />

        {/* User Distribution Chart (Right - 4 columns) */}
        <UserDistributionChart data={mockUserDistribution} />
      </Box>

      {/* Row 3: Audit Logs Table (Full Width) */}
      <Box sx={{ mt: 3 }}>
        <AuditLogTable logs={mockAuditLogs} onViewAll={handleViewAllLogs} />
      </Box>
    </Box>
  );
};

export default AdminDashboard;
