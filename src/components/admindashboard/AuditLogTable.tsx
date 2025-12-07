import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { AuditLog } from '../../types/admin.types';

interface AuditLogTableProps {
  logs: AuditLog[];
  onViewAll?: () => void;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, onViewAll }) => {
  // Get role color
  const getRoleColor = (role: string): 'error' | 'primary' | 'success' | 'warning' | 'default' => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'HOD':
        return 'primary';
      case 'Staff':
        return 'success';
      case 'Sale':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get avatar color based on role
  const getAvatarColor = (role: string): string => {
    switch (role) {
      case 'Admin':
        return '#d32f2f';
      case 'HOD':
        return '#1976d2';
      case 'Staff':
        return '#2e7d32';
      case 'Sale':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Nhật ký Hoạt động Hệ thống (24h gần nhất)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi các hoạt động quan trọng để đảm bảo bảo mật
            </Typography>
          </Box>
          {onViewAll && (
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={onViewAll}
              size="small"
            >
              Xem tất cả
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Người thực hiện</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hành động</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Trạng thái
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow
                  key={log.id}
                  sx={{
                    bgcolor: index % 2 === 0 ? 'transparent' : '#f9f9f9',
                    '&:hover': {
                      bgcolor: '#e3f2fd',
                      cursor: 'pointer',
                    },
                    transition: 'background-color 0.2s',
                  }}
                >
                  {/* Time */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDistanceToNow(log.timestamp, {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.timestamp.toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </TableCell>

                  {/* Actor */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: getAvatarColor(log.role),
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                        src={log.actor.avatar}
                      >
                        {getInitials(log.actor.name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {log.actor.name}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Chip
                      label={log.role}
                      color={getRoleColor(log.role)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.action}
                    </Typography>
                  </TableCell>

                  {/* IP Address */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      color="text.secondary"
                      sx={{ fontSize: '13px' }}
                    >
                      {log.ip}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell align="center">
                    <Chip
                      label={log.status === 'success' ? 'Thành công' : 'Thất bại'}
                      color={log.status === 'success' ? 'success' : 'error'}
                      size="small"
                      sx={{ minWidth: 90 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Footer */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Hiển thị {logs.length} hoạt động gần nhất
          </Typography>
          <Box display="flex" gap={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#2e7d32',
                }}
              />
              <Typography variant="caption">
                {logs.filter((l) => l.status === 'success').length} Thành công
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#d32f2f',
                }}
              />
              <Typography variant="caption">
                {logs.filter((l) => l.status === 'failed').length} Thất bại
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AuditLogTable;
