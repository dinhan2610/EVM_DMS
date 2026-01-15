import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import SystemKPIs from '../components/admindashboard/SystemKPIs';
import TrafficChart from '../components/admindashboard/TrafficChart';
import UserDistributionChart from '../components/admindashboard/UserDistributionChart';
import AuditLogTable from '../components/admindashboard/AuditLogTable';
import auditService from '@/services/auditService';
import {
  mockKPIData,
  mockTrafficData,
  mockUserDistribution,
} from '../types/admin.mockdata';
import type { AuditLog } from '../types/admin.types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);

  // Fetch recent activity logs (10 latest)
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await auditService.getActivityLogs({
          pageIndex: 1,
          pageSize: 10, // Show 10 most recent
        });

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
        }));

        setActivityLogs(mappedLogs);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        setActivityLogs([]);
      }
    };

    fetchActivityLogs();
  }, []);

  const handleViewAllLogs = () => {
    navigate('/admin/audit-logs');
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
        <AuditLogTable logs={activityLogs} onViewAll={handleViewAllLogs} />
      </Box>
    </Box>
  );
};

export default AdminDashboard;
