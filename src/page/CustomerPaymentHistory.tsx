import { useState, useMemo, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  alpha,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import QrCodeIcon from '@mui/icons-material/QrCode'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

// ==================== TYPES ====================

interface InvoiceAllocation {
  invoiceNo: string
  amount: number
}

interface PaymentTransaction {
  id: string
  transactionCode: string
  paymentDate: string
  amount: number
  paymentMethod: 'VietQR' | 'Card' | 'Transfer'
  content: string
  status: 'Success' | 'Pending' | 'Failed'
  allocations: InvoiceAllocation[]
}

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫'
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const getStatusColor = (status: PaymentTransaction['status']): 'success' | 'warning' | 'error' => {
  const colors = {
    Success: 'success' as const,
    Pending: 'warning' as const,
    Failed: 'error' as const,
  }
  return colors[status]
}

const getStatusLabel = (status: PaymentTransaction['status']): string => {
  const labels = {
    Success: 'Thành công',
    Pending: 'Đang xử lý',
    Failed: 'Thất bại',
  }
  return labels[status]
}

const getPaymentMethodIcon = (method: PaymentTransaction['paymentMethod']) => {
  const icons = {
    VietQR: <QrCodeIcon fontSize="small" />,
    Card: <CreditCardIcon fontSize="small" />,
    Transfer: <AccountBalanceIcon fontSize="small" />,
  }
  return icons[method]
}

const getPaymentMethodLabel = (method: PaymentTransaction['paymentMethod']): string => {
  const labels = {
    VietQR: 'VietQR',
    Card: 'Thẻ tín dụng',
    Transfer: 'Chuyển khoản',
  }
  return labels[method]
}

// ==================== MOCK DATA ====================

const generateMockTransactions = (): PaymentTransaction[] => {
  return [
    {
      id: 'TXN001',
      transactionCode: 'PAY2025120001',
      paymentDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 15000000,
      paymentMethod: 'VietQR',
      content: 'Thanh toán hóa đơn tháng 12/2025',
      status: 'Success',
      allocations: [
        { invoiceNo: 'HD000001', amount: 5000000 },
        { invoiceNo: 'HD000002', amount: 10000000 },
      ],
    },
    {
      id: 'TXN002',
      transactionCode: 'PAY2025110002',
      paymentDate: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 8500000,
      paymentMethod: 'Transfer',
      content: 'Thanh toán hóa đơn HD000003',
      status: 'Success',
      allocations: [{ invoiceNo: 'HD000003', amount: 8500000 }],
    },
    {
      id: 'TXN003',
      transactionCode: 'PAY2025110003',
      paymentDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 12000000,
      paymentMethod: 'Card',
      content: 'Thanh toán hóa đơn tháng 11/2025',
      status: 'Success',
      allocations: [
        { invoiceNo: 'HD000004', amount: 7000000 },
        { invoiceNo: 'HD000005', amount: 5000000 },
      ],
    },
    {
      id: 'TXN004',
      transactionCode: 'PAY2025100004',
      paymentDate: dayjs().subtract(60, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 20000000,
      paymentMethod: 'VietQR',
      content: 'Thanh toán công nợ quý 3/2025',
      status: 'Success',
      allocations: [
        { invoiceNo: 'HD000006', amount: 8000000 },
        { invoiceNo: 'HD000007', amount: 7000000 },
        { invoiceNo: 'HD000008', amount: 5000000 },
      ],
    },
    {
      id: 'TXN005',
      transactionCode: 'PAY2025090005',
      paymentDate: dayjs().subtract(90, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 5500000,
      paymentMethod: 'Transfer',
      content: 'Thanh toán hóa đơn HD000009',
      status: 'Success',
      allocations: [{ invoiceNo: 'HD000009', amount: 5500000 }],
    },
    {
      id: 'TXN006',
      transactionCode: 'PAY2025120006',
      paymentDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 3000000,
      paymentMethod: 'Card',
      content: 'Thanh toán hóa đơn HD000010',
      status: 'Pending',
      allocations: [{ invoiceNo: 'HD000010', amount: 3000000 }],
    },
  ]
}

// ==================== EXPANDABLE ROW COMPONENT ====================

interface ExpandableRowProps {
  transaction: PaymentTransaction
  isExpanded: boolean
}

const ExpandableRow = ({ transaction, isExpanded }: ExpandableRowProps) => {
  return (
    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
      <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#555' }}>
          Phân bổ thanh toán:
        </Typography>
        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fff' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Hóa đơn
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Số tiền
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transaction.allocations.map((allocation, index) => (
                <TableRow key={index} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                    {allocation.invoiceNo}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {formatCurrency(allocation.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Tổng cộng</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#2e7d32', fontFamily: 'monospace' }}
                >
                  {formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Collapse>
  )
}

// ==================== MAIN COMPONENT ====================

const CustomerPaymentHistory = () => {
  usePageTitle('Lịch sử thanh toán')
  
  // State
  const [transactions] = useState<PaymentTransaction[]>(generateMockTransactions())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // ==================== COMPUTED VALUES ====================

  // Quick stats
  const stats = useMemo(() => {
    const currentYear = dayjs().year()
    const successTransactions = transactions.filter(
      (t) => t.status === 'Success' && dayjs(t.paymentDate).year() === currentYear
    )
    const totalPaidThisYear = successTransactions.reduce((sum, t) => sum + t.amount, 0)
    const recentTransaction = transactions[0]
    const methodCounts = transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostUsedMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'VietQR'

    return {
      totalPaidThisYear,
      recentTransactionDate: recentTransaction?.paymentDate || '',
      mostUsedMethod: mostUsedMethod as PaymentTransaction['paymentMethod'],
    }
  }, [transactions])

  // ==================== HANDLERS ====================

  const handleCopyTransactionCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code)
    // TODO: Show success toast
    console.log('Copied:', code)
  }, [])

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // ==================== DATA GRID COLUMNS ====================

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'transactionCode',
        headerName: 'Mã giao dịch',
        width: 180,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const code = params.value as string
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                height: '100%',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#666',
                }}
              >
                {code}
              </Typography>
              <Tooltip title="Sao chép mã">
                <IconButton
                  size="small"
                  onClick={() => handleCopyTransactionCode(code)}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: alpha('#1976d2', 0.1),
                    },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 14, color: '#999' }} />
                </IconButton>
              </Tooltip>
            </Box>
          )
        },
      },
      {
        field: 'paymentDate',
        headerName: 'Thời gian',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const dateTime = params.value as string
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {dayjs(dateTime).format('DD/MM/YYYY')}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#999' }}>
                {dayjs(dateTime).format('HH:mm')}
              </Typography>
            </Box>
          )
        },
      },
      {
        field: 'amount',
        headerName: 'Số tiền',
        width: 180,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#2e7d32',
                fontFamily: 'monospace',
              }}
            >
              + {formatCurrency(params.value as number)}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'paymentMethod',
        headerName: 'Phương thức',
        width: 160,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const method = params.value as PaymentTransaction['paymentMethod']
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                {getPaymentMethodIcon(method)}
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                {getPaymentMethodLabel(method)}
              </Typography>
            </Box>
          )
        },
      },
      {
        field: 'content',
        headerName: 'Nội dung',
        flex: 1,
        minWidth: 200,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const content = params.value as string
          const truncated = content.length > 30 ? `${content.substring(0, 30)}...` : content
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Tooltip title={content} placement="top">
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8125rem',
                    color: '#666',
                  }}
                >
                  {truncated}
                </Typography>
              </Tooltip>
            </Box>
          )
        },
      },
      {
        field: 'status',
        headerName: 'Trạng thái',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const status = params.value as PaymentTransaction['status']
          const icon =
            status === 'Success' ? (
              <CheckCircleIcon />
            ) : status === 'Pending' ? (
              <HourglassEmptyIcon />
            ) : (
              <ErrorOutlineIcon />
            )
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Chip
                label={getStatusLabel(status)}
                color={getStatusColor(status)}
                size="small"
                icon={icon}
                sx={{ fontWeight: 500, fontSize: '0.7rem', minWidth: 100 }}
              />
            </Box>
          )
        },
      },
      {
        field: 'expand',
        headerName: 'Chi tiết',
        width: 90,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const transaction = params.row as PaymentTransaction
          const isExpanded = expandedRows.has(transaction.id)
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Tooltip title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(transaction.id)}
                  sx={{
                    color: '#666',
                    '&:hover': {
                      backgroundColor: alpha('#666', 0.1),
                    },
                  }}
                >
                  {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          )
        },
      },
    ],
    [expandedRows, handleCopyTransactionCode, handleToggleExpand]
  )

  // ==================== RENDER ====================

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Lịch sử Giao dịch
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Theo dõi dòng tiền và đối soát thanh toán
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600 }}>
              Tổng tiền đã trả (Năm nay)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32', mt: 1 }}>
              {formatCurrency(stats.totalPaidThisYear)}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600 }}>
              Giao dịch gần nhất
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mt: 1 }}>
              {stats.recentTransactionDate
                ? dayjs(stats.recentTransactionDate).format('DD/MM/YYYY HH:mm')
                : '-'}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600 }}>
              Phương thức hay dùng
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                {getPaymentMethodIcon(stats.mostUsedMethod)}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#555' }}>
                {getPaymentMethodLabel(stats.mostUsedMethod)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ height: 600 }}>
          <DataGrid
            rows={transactions}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#F8F9FA',
                borderBottom: '2px solid #e0e0e0',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                },
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                py: 1.5,
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: alpha('#1976d2', 0.04),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e0e0e0',
              },
            }}
          />
        </Box>

        {/* Expandable Details */}
        {transactions.map((transaction) => (
          <ExpandableRow
            key={transaction.id}
            transaction={transaction}
            isExpanded={expandedRows.has(transaction.id)}
          />
        ))}
      </Paper>
    </Box>
  )
}

export default CustomerPaymentHistory
