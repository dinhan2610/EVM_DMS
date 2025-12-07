import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  HighlightOff as HighlightOffIcon,
  EditNote as EditNoteIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import type { StaffKPI } from '../../types/staff.types';

interface StaffKPIsProps {
  data: StaffKPI;
}

const StaffKPIs: React.FC<StaffKPIsProps> = ({ data }) => {
  const kpis = [
    {
      id: 'rejected',
      label: 'Hóa đơn bị từ chối',
      value: data.rejectedCount,
      icon: HighlightOffIcon,
      color: '#dc2626', // Red - Critical
      bgColor: '#fef2f2',
      iconBg: '#fee2e2',
      description: 'Cần xử lý ngay',
      pulse: data.rejectedCount > 0, // Pulse animation if has rejected
    },
    {
      id: 'drafts',
      label: 'Nháp chưa hoàn thành',
      value: data.draftsCount,
      icon: EditNoteIcon,
      color: '#f59e0b', // Orange - Warning
      bgColor: '#fffbeb',
      iconBg: '#fef3c7',
      description: 'Cần hoàn thiện',
      pulse: false,
    },
    {
      id: 'sent',
      label: 'Đã gửi hôm nay',
      value: data.sentToday,
      icon: SendIcon,
      color: '#10b981', // Green - Success
      bgColor: '#f0fdf4',
      iconBg: '#d1fae5',
      description: 'Năng suất',
      pulse: false,
    },
    {
      id: 'calls',
      label: 'Khách cần gọi',
      value: data.customersToCall,
      icon: PhoneIcon,
      color: '#3b82f6', // Blue - Info
      bgColor: '#eff6ff',
      iconBg: '#dbeafe',
      description: 'Theo dõi công nợ',
      pulse: false,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2.5,
      }}
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.id}
            elevation={0}
            sx={{
              borderLeft: `4px solid ${kpi.color}`,
              bgcolor: kpi.bgColor,
              position: 'relative',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
              },
              // Pulse animation for rejected items
              ...(kpi.pulse && {
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    boxShadow: `0 0 0 0 ${kpi.color}40`,
                  },
                  '50%': {
                    boxShadow: `0 0 0 8px ${kpi.color}00`,
                  },
                },
              }),
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                {/* Left: Text */}
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {kpi.label}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      color: kpi.color,
                      fontWeight: 700,
                      fontSize: '32px',
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}
                  >
                    {kpi.description}
                  </Typography>

                  {/* Critical badge for rejected */}
                  {kpi.id === 'rejected' && kpi.value > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        bgcolor: '#dc2626',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Khẩn cấp
                    </Box>
                  )}
                </Box>

                {/* Right: Icon */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    bgcolor: kpi.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2,
                  }}
                >
                  <Icon sx={{ fontSize: 32, color: kpi.color }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default StaffKPIs;
