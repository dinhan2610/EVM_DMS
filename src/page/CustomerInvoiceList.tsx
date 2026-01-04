import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  alpha,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import AlertCircleIcon from '@mui/icons-material/ErrorOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DescriptionIcon from '@mui/icons-material/Description'
import CodeIcon from '@mui/icons-material/Code'
import { useNavigate } from 'react-router-dom'

// ==================== TYPES ====================

interface CustomerInvoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  status: 'Paid' | 'Unpaid' | 'Overdue'
  lookupCode: string // Mã tra cứu
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

const getStatusColor = (status: CustomerInvoice['status']): 'success' | 'warning' | 'error' => {
  const colors = {
    Paid: 'success' as const,
    Unpaid: 'warning' as const,
    Overdue: 'error' as const,
  }
  return colors[status]
}

const getStatusLabel = (status: CustomerInvoice['status']): string => {
  const labels = {
    Paid: 'Đã thanh toán',
    Unpaid: 'Chưa thanh toán',
    Overdue: 'Quá hạn',
  }
  return labels[status]
}

// ==================== MOCK DATA ====================

const generateMockInvoices = (): CustomerInvoice[] => {
  const statuses: CustomerInvoice['status'][] = ['Paid', 'Unpaid', 'Overdue']
  const mockData: CustomerInvoice[] = []

  for (let i = 1; i <= 15; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    const invoiceDate = dayjs().subtract(Math.floor(Math.random() * 90), 'day')
    const dueDate = invoiceDate.add(30, 'day')

    mockData.push({
      id: `INV${i.toString().padStart(4, '0')}`,
      invoiceNo: `HD${i.toString().padStart(6, '0')}`,
      invoiceDate: invoiceDate.format('YYYY-MM-DD'),
      dueDate: dueDate.format('YYYY-MM-DD'),
      totalAmount: Math.floor(Math.random() * 50000000) + 1000000,
      status: randomStatus,
      lookupCode: `LC${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    })
  }

  return mockData.sort((a, b) => dayjs(b.invoiceDate).valueOf() - dayjs(a.invoiceDate).valueOf())
}

// ==================== MAIN COMPONENT ====================

const CustomerInvoiceList = () => {
  const navigate = useNavigate()

  // State - Data
  const [invoices] = useState<CustomerInvoice[]>(generateMockInvoices())

  // State - UI
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [fromDate, setFromDate] = useState<Dayjs | null>(null)
  const [toDate, setToDate] = useState<Dayjs | null>(null)

  // Download Menu State
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedInvoiceForDownload, setSelectedInvoiceForDownload] = useState<CustomerInvoice | null>(null)

  // ==================== COMPUTED VALUES ====================

  // Filter logic
  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Tab filter
    if (selectedTab === 0) {
      // "Cần thanh toán" - Show Unpaid and Overdue
      filtered = filtered.filter((inv) => inv.status !== 'Paid')
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(query) ||
          inv.lookupCode.toLowerCase().includes(query)
      )
    }

    // Status filter (only in "All" tab)
    if (selectedTab === 1 && statusFilter !== 'All') {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter((inv) => !dayjs(inv.invoiceDate).isBefore(fromDate, 'day'))
    }
    if (toDate) {
      filtered = filtered.filter((inv) => !dayjs(inv.invoiceDate).isAfter(toDate, 'day'))
    }

    return filtered
  }, [invoices, selectedTab, searchQuery, statusFilter, fromDate, toDate])

  // Count unpaid invoices for badge
  const unpaidCount = useMemo(() => {
    return invoices.filter((inv) => inv.status !== 'Paid').length
  }, [invoices])

  // ==================== HANDLERS ====================

  const handleViewDetail = useCallback(
    (invoice: CustomerInvoice) => {
      // Navigate to detail page
      navigate(`/customer/invoices/${invoice.id}`)
    },
    [navigate]
  )

  const handleDownloadClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, invoice: CustomerInvoice) => {
      setDownloadAnchorEl(event.currentTarget)
      setSelectedInvoiceForDownload(invoice)
    },
    []
  )

  const handleDownloadClose = useCallback(() => {
    setDownloadAnchorEl(null)
    setSelectedInvoiceForDownload(null)
  }, [])

  const handleDownloadPDF = useCallback(() => {
    if (selectedInvoiceForDownload) {
      console.log('Downloading PDF for:', selectedInvoiceForDownload.invoiceNo)
      // TODO: Implement PDF download logic
    }
    handleDownloadClose()
  }, [selectedInvoiceForDownload, handleDownloadClose])

  const handleDownloadXML = useCallback(() => {
    if (selectedInvoiceForDownload) {
      console.log('Downloading XML for:', selectedInvoiceForDownload.invoiceNo)
      // TODO: Implement XML download logic
    }
    handleDownloadClose()
  }, [selectedInvoiceForDownload, handleDownloadClose])

  // ==================== DATA GRID COLUMNS ====================

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'invoiceNo',
        headerName: 'Số HĐ',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#1976d2',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            >
              {params.value as string}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'invoiceDate',
        headerName: 'Ngày lập',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
              {dayjs(params.value as string).format('DD/MM/YYYY')}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'dueDate',
        headerName: 'Hạn thanh toán',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const invoice = params.row as CustomerInvoice
          const overdue = invoice.status === 'Overdue'
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
                  fontSize: '0.8125rem',
                  color: overdue ? '#d32f2f' : '#666',
                  fontWeight: overdue ? 600 : 400,
                }}
              >
                {dayjs(params.value as string).format('DD/MM/YYYY')}
              </Typography>
              {overdue && <AlertCircleIcon sx={{ fontSize: 16, color: '#d32f2f' }} />}
            </Box>
          )
        },
      },
      {
        field: 'totalAmount',
        headerName: 'Tổng tiền',
        width: 180,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1976d2' }}
            >
              {formatCurrency(params.value as number)}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Trạng thái',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const status = params.value as CustomerInvoice['status']
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Chip
                label={getStatusLabel(status)}
                color={getStatusColor(status)}
                size="small"
                icon={status === 'Paid' ? <CheckCircleIcon /> : undefined}
                sx={{ fontWeight: 500, fontSize: '0.7rem', minWidth: 110 }}
              />
            </Box>
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Thao tác',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const invoice = params.row as CustomerInvoice
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
              <Tooltip title="Xem chi tiết">
                <IconButton
                  size="small"
                  onClick={() => handleViewDetail(invoice)}
                  sx={{
                    color: '#1976d2',
                    '&:hover': {
                      backgroundColor: alpha('#1976d2', 0.1),
                    },
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tải hóa đơn">
                <IconButton
                  size="small"
                  onClick={(e) => handleDownloadClick(e, invoice)}
                  sx={{
                    color: '#666',
                    '&:hover': {
                      backgroundColor: alpha('#666', 0.1),
                    },
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )
        },
      },
    ],
    [handleViewDetail, handleDownloadClick]
  )

  // ==================== RENDER ====================

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Hóa đơn của tôi
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Quản lý và tải xuống hóa đơn điện tử
            </Typography>
          </Box>
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              minWidth: 200,
            }}
          >
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600 }}>
              Tổng chưa thanh toán
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f', mt: 0.5 }}>
              {unpaidCount} hóa đơn
            </Typography>
          </Paper>
        </Box>

        {/* Main Content */}
        <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{
              borderBottom: '1px solid #e0e0e0',
              px: 2.5,
              minHeight: 48,
              backgroundColor: '#fafafa',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#1976d2',
                },
              },
            }}
          >
            <Tab
              value={0}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Cần thanh toán
                  <Badge
                    badgeContent={unpaidCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        height: 18,
                        minWidth: 18,
                      },
                    }}
                  />
                </Box>
              }
            />
            <Tab value={1} label="Tất cả hóa đơn" />
          </Tabs>

          {/* Filter Bar */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                placeholder="Tìm theo số hóa đơn, mã tra cứu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <DatePicker
                label="Từ ngày"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <DatePicker
                label="Đến ngày"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              {selectedTab === 1 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Trạng thái"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <SelectMenuItem value="All">Tất cả</SelectMenuItem>
                    <SelectMenuItem value="Paid">Đã thanh toán</SelectMenuItem>
                    <SelectMenuItem value="Unpaid">Chưa thanh toán</SelectMenuItem>
                    <SelectMenuItem value="Overdue">Quá hạn</SelectMenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>

          {/* Data Grid */}
          <Box sx={{ height: 600 }}>
            <DataGrid
              rows={filteredInvoices}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
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
        </Paper>

        {/* Download Menu */}
        <Menu
          anchorEl={downloadAnchorEl}
          open={Boolean(downloadAnchorEl)}
          onClose={handleDownloadClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 200,
              borderRadius: 2,
              mt: 1,
            },
          }}
        >
          <MenuItem onClick={handleDownloadPDF}>
            <ListItemIcon>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Tải bản thể hiện (PDF)</ListItemText>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleDownloadXML}>
            <ListItemIcon>
              <CodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Tải dữ liệu (XML)</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </LocalizationProvider>
  )
}

export default CustomerInvoiceList
