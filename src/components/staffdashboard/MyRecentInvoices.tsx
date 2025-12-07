import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { RecentInvoice } from '../../types/staff.types';

interface MyRecentInvoicesProps {
  invoices: RecentInvoice[];
}

const MyRecentInvoices: React.FC<MyRecentInvoicesProps> = ({ invoices }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (
    status: string
  ): { bgcolor: string; color: string; label: string } => {
    switch (status) {
      case 'Sent':
        return {
          bgcolor: '#f0fdf4',
          color: '#10b981',
          label: 'Đã gửi',
        };
      case 'Approved':
        return {
          bgcolor: '#eff6ff',
          color: '#3b82f6',
          label: 'Đã duyệt',
        };
      case 'Pending':
        return {
          bgcolor: '#fffbeb',
          color: '#f59e0b',
          label: 'Chờ duyệt',
        };
      case 'Rejected':
        return {
          bgcolor: '#fef2f2',
          color: '#dc2626',
          label: 'Từ chối',
        };
      case 'Draft':
        return {
          bgcolor: '#f8fafc',
          color: '#64748b',
          label: 'Nháp',
        };
      default:
        return {
          bgcolor: '#f8fafc',
          color: '#64748b',
          label: status,
        };
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Số hóa đơn',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '13px',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            fontSize: '13px',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Số tiền',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#0f172a',
            fontSize: '13px',
          }}
        >
          {formatCurrency(params.value as number)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const statusInfo = getStatusColor(params.value as string);
        return (
          <Chip
            label={statusInfo.label}
            size="small"
            sx={{
              bgcolor: statusInfo.bgcolor,
              color: statusInfo.color,
              fontWeight: 600,
              fontSize: '12px',
              height: '24px',
              borderRadius: '12px',
            }}
          />
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Thời gian',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontSize: '12px',
          }}
        >
          {formatDistanceToNow(params.value as Date, {
            addSuffix: true,
            locale: vi,
          })}
        </Typography>
      ),
    },
  ];

  return (
    <Card elevation={0} sx={{ border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={2.5}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
            Hóa đơn tôi vừa làm
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
            {invoices.length} hóa đơn gần đây
          </Typography>
        </Box>

        {/* DataGrid */}
        <Box
          sx={{
            height: 400,
            width: '100%',
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f1f5f9',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              borderRadius: '8px',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '13px',
              color: '#475569',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                bgcolor: '#f8fafc',
                cursor: 'pointer',
              },
              '&.Mui-selected': {
                bgcolor: '#eff6ff',
                '&:hover': {
                  bgcolor: '#dbeafe',
                },
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid #e2e8f0',
              bgcolor: '#f8fafc',
            },
          }}
        >
          <DataGrid
            rows={invoices}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 5, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            density="comfortable"
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
            }}
          />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 2.5,
            pt: 2.5,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
              Tổng số tiền
            </Typography>
            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '16px' }}>
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
              Đã gửi
            </Typography>
            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
              {invoices.filter((inv) => inv.status === 'Sent').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
              Đang nháp
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 700, fontSize: '16px' }}>
              {invoices.filter((inv) => inv.status === 'Draft').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
              Bị từ chối
            </Typography>
            <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '16px' }}>
              {invoices.filter((inv) => inv.status === 'Rejected').length}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MyRecentInvoices;
