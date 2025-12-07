import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { SalesInvoice } from '../../types/sales.types';

interface MyRecentInvoicesProps {
  invoices: SalesInvoice[];
}

const MyRecentInvoices: React.FC<MyRecentInvoicesProps> = ({ invoices }) => {
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  // Status chip configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Đã thanh toán', color: '#10b981', bgColor: '#d1fae5' };
      case 'unpaid':
        return { label: 'Chưa thanh toán', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'rejected':
        return { label: 'Bị từ chối', color: '#ef5350', bgColor: '#fee2e2' };
      case 'pending':
        return { label: 'Chờ xử lý', color: '#3b82f6', bgColor: '#dbeafe' };
      default:
        return { label: status, color: '#64748b', bgColor: '#f1f5f9' };
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Số hóa đơn',
      width: 140,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
            {params.value}
          </Typography>
          {params.row.isPriority && (
            <Chip
              label="Ưu tiên"
              size="small"
              sx={{
                bgcolor: '#fee2e2',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '9px',
                height: 16,
                mt: 0.5,
              }}
            />
          )}
        </Box>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#1e293b' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Số tiền',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#1976d2' }}>
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 140,
      renderCell: (params) => {
        const config = getStatusConfig(params.value);
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              bgcolor: config.bgColor,
              color: config.color,
              fontWeight: 700,
              fontSize: '11px',
            }}
          />
        );
      },
    },
    {
      field: 'issueDate',
      headerName: 'Ngày xuất',
      width: 110,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {format(new Date(params.value), 'dd/MM/yyyy', { locale: vi })}
        </Typography>
      ),
    },
  ];

  // Calculate summary stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const rejectedCount = invoices.filter((inv) => inv.status === 'rejected').length;
  const unpaidCount = invoices.filter((inv) => inv.status === 'unpaid').length;

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
        <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
          Giao dịch gần đây
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 2 }}>
          10 hóa đơn mới nhất của bạn
        </Typography>

        {/* Summary Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px' }}>
              Tổng giá trị
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', mt: 0.5 }}>
              {formatCurrency(totalAmount)}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#d1fae5',
              border: '1px solid #10b981',
            }}
          >
            <Typography variant="caption" sx={{ color: '#047857', fontSize: '10px' }}>
              Đã thanh toán
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#059669', mt: 0.5 }}>
              {paidCount} đơn
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#fef3c7',
              border: '1px solid #f59e0b',
            }}
          >
            <Typography variant="caption" sx={{ color: '#92400e', fontSize: '10px' }}>
              Chưa thanh toán
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#b45309', mt: 0.5 }}>
              {unpaidCount} đơn
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#fee2e2',
              border: '1px solid #ef5350',
            }}
          >
            <Typography variant="caption" sx={{ color: '#991b1b', fontSize: '10px' }}>
              Bị từ chối
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#dc2626', mt: 0.5 }}>
              {rejectedCount} đơn
            </Typography>
          </Box>
        </Box>

        {/* DataGrid */}
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={invoices}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
            pageSizeOptions={[5, 10]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f1f5f9',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '13px',
                color: '#475569',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  bgcolor: '#f8fafc',
                },
                '&.Mui-selected': {
                  bgcolor: '#f1f5f9',
                  '&:hover': {
                    bgcolor: '#e2e8f0',
                  },
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e2e8f0',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MyRecentInvoices;
