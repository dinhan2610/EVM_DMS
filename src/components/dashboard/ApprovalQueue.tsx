import React, { useState } from 'react';
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
  Checkbox,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { PendingInvoice } from '../../types/dashboard.types';

interface ApprovalQueueProps {
  invoices: PendingInvoice[];
  onBulkApprove?: (ids: string[]) => void;
  onQuickView?: (invoice: PendingInvoice) => void;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ invoices, onBulkApprove, onQuickView }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(invoices.map((inv) => inv.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (onBulkApprove) {
      onBulkApprove(selected);
      setSelected([]);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'VAT':
        return '#3b82f6';
      case 'Adjustment':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Hóa đơn chờ ký duyệt
              <Chip
                label={invoices.length}
                size="small"
                sx={{
                  ml: 1.5,
                  bgcolor: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              />
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Cần xử lý trong ngày hôm nay
            </Typography>
          </Box>

          {selected.length > 0 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleBulkApprove}
              sx={{
                bgcolor: '#10b981',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#059669',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                },
              }}
            >
              Duyệt {selected.length} hóa đơn
            </Button>
          )}
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < invoices.length}
                    checked={invoices.length > 0 && selected.length === invoices.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Số HĐ
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Khách hàng
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Số tiền
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Người tạo
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Thời gian
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Loại
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(invoice.id)}
                      onChange={() => handleSelect(invoice.id)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {invoice.priority === 'high' && (
                        <PriorityHighIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={invoice.priority === 'high' ? 700 : 500}
                        sx={{ color: '#1e293b', fontSize: '13px' }}
                      >
                        {invoice.invoiceNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {invoice.customer}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {formatCurrency(invoice.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
                      {invoice.createdBy}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px' }}>
                      {formatDistanceToNow(invoice.createdDate, {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.type}
                      size="small"
                      sx={{
                        bgcolor: `${getTypeColor(invoice.type)}15`,
                        color: getTypeColor(invoice.type),
                        fontWeight: 600,
                        fontSize: '11px',
                        height: 22,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem trước">
                      <IconButton
                        size="small"
                        onClick={() => onQuickView && onQuickView(invoice)}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            color: '#3b82f6',
                            bgcolor: '#eff6ff',
                          },
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        {invoices.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Không có hóa đơn chờ duyệt
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Tất cả hóa đơn đã được xử lý
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalQueue;
