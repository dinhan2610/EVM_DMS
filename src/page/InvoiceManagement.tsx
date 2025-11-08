import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import AddIcon from '@mui/icons-material/Add'
import { Link, useNavigate } from 'react-router-dom'
import InvoiceFilter, { InvoiceFilterState } from '@/components/InvoiceFilter'

// Định nghĩa kiểu dữ liệu
export interface Invoice {
  id: string
  invoiceNumber: string
  symbol: string // Ký hiệu hoá đơn
  customerName: string
  taxCode: string // Mã số thuế
  taxAuthority: string // Mã của CQT
  issueDate: string
  status: 'Nháp' | 'Đã ký' | 'Đã phát hành' | 'Đã gửi' | 'Bị từ chối' | 'Đã thanh toán' | 'Đã hủy'
  taxStatus: 'Chờ đồng bộ' | 'Đã đồng bộ' | 'Lỗi'
  amount: number
}

// Mock Data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    symbol: 'C24TAA',
    customerName: 'Công ty TNHH ABC Technology',
    taxCode: '0123456789',
    taxAuthority: 'TCT/24E/001',
    issueDate: '2024-10-01',
    status: 'Đã thanh toán',
    taxStatus: 'Đã đồng bộ',
    amount: 15000000,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    symbol: 'C24TAB',
    customerName: 'Công ty Cổ phần XYZ Solutions',
    taxCode: '0987654321',
    taxAuthority: 'TCT/24E/002',
    issueDate: '2024-10-05',
    status: 'Đã gửi',
    taxStatus: 'Đã đồng bộ',
    amount: 25000000,
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    symbol: 'C24TAC',
    customerName: 'Doanh nghiệp Tư nhân DEF',
    taxCode: '0111222333',
    taxAuthority: 'TCT/24E/003',
    issueDate: '2024-10-10',
    status: 'Đã phát hành',
    taxStatus: 'Chờ đồng bộ',
    amount: 8500000,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    symbol: 'C24TAD',
    customerName: 'Công ty TNHH GHI Logistics',
    taxCode: '0444555666',
    taxAuthority: 'TCT/24E/004',
    issueDate: '2024-10-12',
    status: 'Đã ký',
    taxStatus: 'Đã đồng bộ',
    amount: 12000000,
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    symbol: 'C24TAE',
    customerName: 'Tập đoàn JKL Group',
    taxCode: '0777888999',
    taxAuthority: 'TCT/24E/005',
    issueDate: '2024-10-15',
    status: 'Nháp',
    taxStatus: 'Chờ đồng bộ',
    amount: 30000000,
  },
  {
    id: '6',
    invoiceNumber: 'INV-2024-006',
    symbol: 'C24TAF',
    customerName: 'Công ty CP MNO Trading',
    taxCode: '0222333444',
    taxAuthority: 'TCT/24E/006',
    issueDate: '2024-10-18',
    status: 'Bị từ chối',
    taxStatus: 'Lỗi',
    amount: 5000000,
  },
  {
    id: '7',
    invoiceNumber: 'INV-2024-007',
    symbol: 'C24TAG',
    customerName: 'Doanh nghiệp PQR Services',
    taxCode: '0555666777',
    taxAuthority: 'TCT/24E/007',
    issueDate: '2024-10-20',
    status: 'Đã thanh toán',
    taxStatus: 'Đã đồng bộ',
    amount: 18000000,
  },
  {
    id: '8',
    invoiceNumber: 'INV-2024-008',
    symbol: 'C24TAH',
    customerName: 'Công ty TNHH STU Consulting',
    taxCode: '0888999000',
    taxAuthority: 'TCT/24E/008',
    issueDate: '2024-10-22',
    status: 'Đã hủy',
    taxStatus: 'Lỗi',
    amount: 0,
  },
]

// Helper function cho màu status
const getStatusColor = (
  status: Invoice['status']
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const statusColors = {
    'Nháp': 'default' as const,
    'Đã ký': 'info' as const,
    'Đã phát hành': 'primary' as const,
    'Đã gửi': 'secondary' as const,
    'Bị từ chối': 'error' as const,
    'Đã thanh toán': 'success' as const,
    'Đã hủy': 'warning' as const,
  }
  return statusColors[status]
}

// Helper function cho màu tax status
const getTaxStatusColor = (taxStatus: Invoice['taxStatus']): 'default' | 'success' | 'warning' | 'error' => {
  const taxColors = {
    'Đã đồng bộ': 'success' as const,
    'Chờ đồng bộ': 'warning' as const,
    'Lỗi': 'error' as const,
  }
  return taxColors[taxStatus]
}

const InvoiceManagement = () => {
  const navigate = useNavigate()
  
  // State quản lý bộ lọc - sử dụng InvoiceFilterState
  const [filters, setFilters] = useState<InvoiceFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    invoiceStatus: [],
    taxStatus: '',
    customer: null,
    project: null,
    invoiceType: [],
    amountFrom: '',
    amountTo: '',
  })

  // Handler khi filter thay đổi
  const handleFilterChange = (newFilters: InvoiceFilterState) => {
    setFilters(newFilters)
  }

  // Handler khi reset filter
  const handleResetFilter = () => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      invoiceStatus: [],
      taxStatus: '',
      customer: null,
      project: null,
      invoiceType: [],
      amountFrom: '',
      amountTo: '',
    })
  }

  // Định nghĩa columns
  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Số hóa đơn',
      flex: 1,
      minWidth: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Link
          to={`/invoices/${params.row.id}`}
          style={{
            textDecoration: 'none',
            color: '#1976d2',
            fontWeight: 600,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#1565c0')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#1976d2')}>
          {params.value as string}
        </Link>
      ),
    },
    {
      field: 'symbol',
      headerName: 'Ký hiệu',
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#1976d2',
            }}>
            {params.value as string}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 180,
      sortable: true,
    },
    {
      field: 'taxCode',
      headerName: 'Mã số thuế',
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: '#2c3e50',
            }}>
            {params.value as string}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'taxAuthority',
      headerName: 'Mã của CQT',
      flex: 1,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#1976d2',
              backgroundColor: '#e3f2fd',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
            }}>
            {params.value as string}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'issueDate',
      headerName: 'Ngày phát hành',
      flex: 1,
      minWidth: 130,
      sortable: true,
      type: 'date',
      valueGetter: (value: string) => new Date(value),
      renderCell: (params: GridRenderCellParams) => dayjs(params.value as Date).format('DD/MM/YYYY'),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value as string} color={getStatusColor(params.value as Invoice['status'])} size="small" />
      ),
    },
    {
      field: 'taxStatus',
      headerName: 'Tình trạng thuế',
      flex: 1,
      minWidth: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value as string} color={getTaxStatusColor(params.value as Invoice['taxStatus'])} size="small" />
      ),
    },
    {
      field: 'amount',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(params.value as number),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Xem chi tiết" arrow>
            <IconButton
              component={Link}
              to={`/invoices/${params.row.id}`}
              size="small"
              color="info"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.08)',
                },
              }}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa" arrow>
            <IconButton
              size="small"
              color="primary"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(28, 132, 238, 0.08)',
                },
              }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  // Logic lọc dữ liệu - tích hợp với InvoiceFilter
  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter((invoice) => {
      // Lọc theo text search (số HĐ, ký hiệu, tên khách hàng, mã số thuế)
      const matchesSearch =
        !filters.searchText ||
        invoice.invoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.symbol.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.taxCode.toLowerCase().includes(filters.searchText.toLowerCase())

      // Lọc theo khoảng ngày
      const matchesDateFrom = !filters.dateFrom || dayjs(invoice.issueDate).isAfter(filters.dateFrom, 'day') || dayjs(invoice.issueDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo = !filters.dateTo || dayjs(invoice.issueDate).isBefore(filters.dateTo, 'day') || dayjs(invoice.issueDate).isSame(filters.dateTo, 'day')

      // Lọc theo trạng thái hóa đơn (multiselect)
      const matchesInvoiceStatus = filters.invoiceStatus.length === 0 || filters.invoiceStatus.includes(invoice.status)

      // Lọc theo trạng thái CQT
      const matchesTaxStatus = !filters.taxStatus || invoice.taxStatus === filters.taxStatus

      // Lọc theo khách hàng
      const matchesCustomer = !filters.customer || invoice.customerName === filters.customer

      // Lọc theo khoảng tiền
      const matchesAmountFrom = !filters.amountFrom || invoice.amount >= parseFloat(filters.amountFrom)
      const matchesAmountTo = !filters.amountTo || invoice.amount <= parseFloat(filters.amountTo)

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesInvoiceStatus &&
        matchesTaxStatus &&
        matchesCustomer &&
        matchesAmountFrom &&
        matchesAmountTo
      )
    })
  }, [filters])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                Quản lý Hóa đơn
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Quản lý và theo dõi các hóa đơn điện tử của doanh nghiệp
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/newinvoices')}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
                },
              }}>
              Tạo hóa đơn
            </Button>
          </Box>

          {/* Bộ lọc nâng cao */}
          <InvoiceFilter onFilterChange={handleFilterChange} onReset={handleResetFilter} />

          {/* Data Table */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
            {/* Table Section */}
            <DataGrid
              rows={filteredInvoices}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e0e0e0',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8f9fa',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid #e0e0e0',
                  backgroundColor: '#fafafa',
                  minHeight: '56px',
                  padding: '8px 16px',
                },
                '& .MuiTablePagination-root': {
                  overflow: 'visible',
                },
                '& .MuiTablePagination-toolbar': {
                  minHeight: '56px',
                  paddingLeft: '16px',
                  paddingRight: '8px',
                },
                '& .MuiTablePagination-selectLabel': {
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#666',
                },
                '& .MuiTablePagination-displayedRows': {
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#666',
                },
                '& .MuiTablePagination-select': {
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiTablePagination-actions': {
                  marginLeft: '20px',
                  '& .MuiIconButton-root': {
                    padding: '8px',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                },
              }}
              autoHeight
            />
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default InvoiceManagement
