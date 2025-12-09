import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { CustomerInvoice } from '../../types/customer.types';

interface CustomerInvoicesTableProps {
  invoices: CustomerInvoice[];
  onDownload?: (invoiceId: string) => void;
  onView?: (invoiceId: string) => void;
}

const CustomerInvoicesTable: React.FC<CustomerInvoicesTableProps> = ({
  invoices,
  onDownload,
  onView,
}) => {
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('vi-VN');
  };

  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusChip = (status: 'paid' | 'unpaid' | 'overdue') => {
    const statusConfig = {
      paid: {
        label: 'Đã thanh toán',
        color: '#10b981' as const,
        bgColor: '#d1fae5' as const,
      },
      unpaid: {
        label: 'Chưa thanh toán',
        color: '#f59e0b' as const,
        bgColor: '#fef3c7' as const,
      },
      overdue: {
        label: 'Quá hạn',
        color: '#dc2626' as const,
        bgColor: '#fee2e2' as const,
      },
    };

    const config = statusConfig[status];

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          fontSize: '12px',
          height: '24px',
          border: 'none',
        }}
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Số hóa đơn',
      flex: 1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            color: '#1976d2',
            fontSize: '13px',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'issueDate',
      headerName: 'Ngày phát hành',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px' }}>
          {formatDate(params.value as string | Date)}
        </Typography>
      ),
    },
    {
      field: 'dueDate',
      headerName: 'Hạn thanh toán',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px' }}>
          {formatDate(params.value as string | Date)}
        </Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Số tiền',
      flex: 0.8,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            color: '#1e293b',
            fontSize: '13px',
          }}
        >
          {formatCurrency(params.value as number)} ₫
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.8,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        getStatusChip(params.value as 'paid' | 'unpaid' | 'overdue'),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.6,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Xem hóa đơn" arrow>
            <IconButton
              size="small"
              onClick={() => onView?.(params.row.id)}
              sx={{
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tải xuống PDF" arrow>
            <IconButton
              size="small"
              onClick={() => onDownload?.(params.row.id)}
              sx={{
                color: '#10b981',
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                },
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Calculate summary stats
  const totalSpent = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const unpaidCount = invoices.filter((inv) => inv.status === 'unpaid').length;
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  return (
    <Card
      sx={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Lịch sử hóa đơn
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Quản lý và theo dõi tất cả hóa đơn của bạn
            </Typography>
          </Box>

          {/* Summary Stats */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <Box textAlign="center">
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: '#10b981',
                  fontSize: '16px',
                }}
              >
                {paidCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                Đã thanh toán
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: '#f59e0b',
                  fontSize: '16px',
                }}
              >
                {unpaidCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                Chưa thanh toán
              </Typography>
            </Box>

            {overdueCount > 0 && (
              <Box textAlign="center">
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    color: '#dc2626',
                    fontSize: '16px',
                  }}
                >
                  {overdueCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                  Quá hạn
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* DataGrid */}
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={invoices}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 15]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: '1px solid #f1f5f9',
              borderRadius: '8px',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f1f5f9',
                fontSize: '13px',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f8fafc',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e2e8f0',
                backgroundColor: '#fafafa',
              },
            }}
          />
        </Box>

        {/* Total Spent Box */}
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #86efac',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#166534', fontWeight: 500 }}>
              💰 Tổng chi tiêu đã thanh toán
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: '#15803d',
                fontSize: '20px',
              }}
            >
              {formatCurrency(totalSpent)} ₫
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerInvoicesTable;
