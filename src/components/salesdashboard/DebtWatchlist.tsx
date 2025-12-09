import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { Phone, Mail } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DebtCustomer } from '../../types/sales.types';

interface DebtWatchlistProps {
  customers: DebtCustomer[];
  onCall?: (customer: DebtCustomer) => void;
  onSendReminder?: (customer: DebtCustomer) => void;
}

const DebtWatchlist: React.FC<DebtWatchlistProps> = ({
  customers,
  onCall,
  onSendReminder,
}) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  const getUrgencyConfig = (level: 'critical' | 'high' | 'medium') => {
    switch (level) {
      case 'critical':
        return { color: '#dc2626', bgColor: '#fee2e2', label: 'Khẩn cấp', icon: '🚨' };
      case 'high':
        return { color: '#f59e0b', bgColor: '#fef3c7', label: 'Cao', icon: '⚠️' };
      case 'medium':
        return { color: '#3b82f6', bgColor: '#dbeafe', label: 'Trung bình', icon: '📋' };
    }
  };

  // Sort by urgency: critical > high > medium
  const sortedCustomers = [...customers].sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
  });

  const totalDebt = customers.reduce((sum, c) => sum + c.overdueAmount, 0);

  return (
    <Card
      sx={{
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Khách hàng cần nhắc nợ
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Danh sách ưu tiên theo độ khẩn cấp
            </Typography>
          </Box>
          <Chip
            label={`${customers.length} KH`}
            color="error"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {/* Total Debt Summary */}
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: '#fef3c7',
            border: '1px solid #fbbf24',
          }}
        >
          <Typography variant="caption" sx={{ color: '#92400e', fontSize: '11px' }}>
            Tổng nợ quá hạn
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#b45309', mt: 0.5 }}>
            {formatCurrency(totalDebt)} VNĐ
          </Typography>
        </Box>

        {/* Debt List */}
        <List sx={{ p: 0 }}>
          {sortedCustomers.map((customer, index) => {
            const urgency = getUrgencyConfig(customer.urgencyLevel);
            return (
              <ListItem
                key={customer.id}
                sx={{
                  px: 0,
                  py: 2,
                  borderBottom: index < sortedCustomers.length - 1 ? '1px solid #f1f5f9' : 'none',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                {/* Customer Info */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>
                        {customer.name}
                      </Typography>
                      <Chip
                        label={urgency.label}
                        size="small"
                        sx={{
                          bgcolor: urgency.bgColor,
                          color: urgency.color,
                          fontWeight: 700,
                          fontSize: '10px',
                          height: 20,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
                      {customer.company}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Gọi điện">
                      <IconButton
                        size="small"
                        onClick={() => onCall?.(customer)}
                        sx={{
                          bgcolor: '#dbeafe',
                          color: '#1976d2',
                          '&:hover': { bgcolor: '#bfdbfe' },
                        }}
                      >
                        <Phone sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gửi email nhắc nở">
                      <IconButton
                        size="small"
                        onClick={() => onSendReminder?.(customer)}
                        sx={{
                          bgcolor: '#fee2e2',
                          color: '#ef5350',
                          '&:hover': { bgcolor: '#fecaca' },
                        }}
                      >
                        <Mail sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Debt Details */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: urgency.bgColor,
                    border: `1px solid ${urgency.color}30`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography
                      variant="caption"
                      sx={{ color: urgency.color, fontSize: '11px', fontWeight: 600 }}
                    >
                      {urgency.icon} Nợ quá hạn
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: urgency.color, fontSize: '15px' }}
                    >
                      {formatCurrency(customer.overdueAmount)} VNĐ
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px' }}>
                      Quá hạn {customer.overdueDays} ngày
                    </Typography>
                    {customer.lastContactDate && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                        Liên hệ lần cuối:{' '}
                        {formatDistanceToNow(customer.lastContactDate, {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Contact Info */}
                <Box display="flex" gap={2} mt={1}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                    📞 {customer.phone}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                    ✉️ {customer.email}
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
        </List>

        {/* Empty State */}
        {customers.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
            }}
          >
            <Typography variant="h4" sx={{ mb: 1 }}>
              ✅
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', mb: 0.5 }}>
              Tuyệt vời!
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Không có khách hàng nợ quá hạn
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DebtWatchlist;
