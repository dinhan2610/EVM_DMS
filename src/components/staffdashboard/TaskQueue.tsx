import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, List, ListItem } from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  AccessTime as ClockIcon,
  Warning as WarningIcon,
  East as ArrowIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { TaskItem } from '../../types/staff.types';

interface TaskQueueProps {
  tasks: TaskItem[];
  onFixNow: (taskId: string, actionUrl: string) => void;
}

const TaskQueue: React.FC<TaskQueueProps> = ({ tasks, onFixNow }) => {
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'rejected':
        return <ErrorIcon sx={{ fontSize: 24, color: '#dc2626' }} />;
      case 'draft':
        return <ClockIcon sx={{ fontSize: 24, color: '#f59e0b' }} />;
      case 'overdue':
        return <WarningIcon sx={{ fontSize: 24, color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getTaskBgColor = (type: string) => {
    switch (type) {
      case 'rejected':
        return '#fef2f2';
      case 'draft':
        return '#fffbeb';
      case 'overdue':
        return '#fff1f2';
      default:
        return '#f8fafc';
    }
  };

  const getTaskBorderColor = (type: string) => {
    switch (type) {
      case 'rejected':
        return '#dc2626';
      case 'draft':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      default:
        return '#e2e8f0';
    }
  };

  const getTaskTitle = (task: TaskItem): string => {
    if (task.type === 'rejected') {
      return `Hóa đơn ${task.invoiceNumber} bị từ chối`;
    }
    if (task.type === 'draft') {
      return `Hóa đơn ${task.invoiceNumber} đang nháp (${task.daysOld} ngày)`;
    }
    if (task.type === 'overdue') {
      return `Công nợ ${task.customerName} quá hạn ${task.daysOld} ngày`;
    }
    return '';
  };

  // Sort: Rejected first, then by createdDate
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.type === 'rejected' && b.type !== 'rejected') return -1;
    if (a.type !== 'rejected' && b.type === 'rejected') return 1;
    return b.createdDate.getTime() - a.createdDate.getTime();
  });

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box mb={2.5}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
            Việc cần xử lý ngay
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
            {sortedTasks.length} nhiệm vụ đang chờ
          </Typography>
        </Box>

        {/* Task List */}
        {sortedTasks.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 32 }}>✓</Typography>
            </Box>
            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
              Tuyệt vời!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Không có việc cần xử lý khẩn cấp
            </Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {sortedTasks.map((task) => (
              <ListItem
                key={task.id}
                sx={{
                  p: 0,
                  mb: 2,
                  '&:last-child': { mb: 0 },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    p: 2,
                    borderRadius: '12px',
                    border: `2px solid ${getTaskBorderColor(task.type)}`,
                    bgcolor: getTaskBgColor(task.type),
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <Box display="flex" gap={2}>
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getTaskIcon(task.type)}
                    </Box>

                    {/* Content */}
                    <Box flex={1}>
                      {/* Title */}
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#1e293b',
                          fontWeight: 600,
                          fontSize: '14px',
                          mb: 0.5,
                        }}
                      >
                        {getTaskTitle(task)}
                      </Typography>

                      {/* Customer */}
                      {task.customerName && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748b',
                            fontSize: '12px',
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {task.customerName}
                          {task.amount && ` • ${formatCurrency(task.amount)}`}
                        </Typography>
                      )}

                      {/* Rejection Reason */}
                      {task.reason && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1.5,
                            bgcolor: 'white',
                            borderRadius: '8px',
                            borderLeft: '3px solid #dc2626',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            💬 Lý do: {task.reason}
                          </Typography>
                        </Box>
                      )}

                      {/* Footer: Time + Action */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mt={1.5}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#94a3b8',
                            fontSize: '11px',
                          }}
                        >
                          {formatDistanceToNow(task.createdDate, {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </Typography>

                        <Button
                          size="small"
                          variant="contained"
                          endIcon={<ArrowIcon />}
                          onClick={() => onFixNow(task.id, task.actionUrl)}
                          sx={{
                            bgcolor: task.type === 'rejected' ? '#dc2626' : '#f59e0b',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '12px',
                            px: 2,
                            py: 0.75,
                            textTransform: 'none',
                            borderRadius: '8px',
                            '&:hover': {
                              bgcolor: task.type === 'rejected' ? '#b91c1c' : '#d97706',
                            },
                          }}
                        >
                          {task.type === 'rejected' ? 'Sửa ngay' : 'Xử lý'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {/* Priority Legend */}
        {sortedTasks.length > 0 && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Chip
              icon={<ErrorIcon sx={{ fontSize: 14 }} />}
              label="Từ chối"
              size="small"
              sx={{
                bgcolor: '#fef2f2',
                color: '#dc2626',
                fontSize: '11px',
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<ClockIcon sx={{ fontSize: 14 }} />}
              label="Nháp cũ"
              size="small"
              sx={{
                bgcolor: '#fffbeb',
                color: '#f59e0b',
                fontSize: '11px',
                fontWeight: 600,
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskQueue;
