import { useState, useMemo } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import CustomerHistoryDrawer from '../components/CustomerHistoryDrawer'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ==================== INTERFACES ====================

export interface ISalesCustomer {
  id: string
  taxCode: string
  name: string
  address: string
  phone: string
  email: string
  currentMonthRevenue: number // Doanh số tháng này
  lastOrderDate: string | null // Ngày mua gần nhất
  status: 'Potential' | 'Active' | 'Churned'
}

// ==================== MOCK DATA ====================

const MOCK_CUSTOMERS: ISalesCustomer[] = [
  {
    id: '1',
    taxCode: '0123456789',
    name: 'Công ty TNHH Hải Âu',
    address: 'Thủ Đức - Hồ Chí Minh',
    phone: '0935994475',
    email: 'haiau@gmail.com',
    currentMonthRevenue: 125000000,
    lastOrderDate: '2026-01-08',
    status: 'Active',
  },
  {
    id: '2',
    taxCode: '0987654321',
    name: 'Công ty CP Công nghệ ABC',
    address: 'Quận 1 - TP.HCM',
    phone: '0912345678',
    email: 'abc@tech.vn',
    currentMonthRevenue: 85000000,
    lastOrderDate: '2026-01-09',
    status: 'Active',
  },
  {
    id: '3',
    taxCode: '0111222333',
    name: 'Công ty TNHH Thương mại XYZ',
    address: 'Quận 7 - TP.HCM',
    phone: '0923456789',
    email: 'xyz@trading.com',
    currentMonthRevenue: 0,
    lastOrderDate: '2025-11-15',
    status: 'Churned',
  },
  {
    id: '4',
    taxCode: '0444555666',
    name: 'Công ty CP Đầu tư Phát triển',
    address: 'Bình Thạnh - TP.HCM',
    phone: '0934567890',
    email: 'investment@company.vn',
    currentMonthRevenue: 45000000,
    lastOrderDate: '2026-01-05',
    status: 'Active',
  },
  {
    id: '5',
    taxCode: '0777888999',
    name: 'Công ty TNHH Logistics DEF',
    address: 'Quận 2 - TP.HCM',
    phone: '0945678901',
    email: 'def@logistics.com',
    currentMonthRevenue: 0,
    lastOrderDate: null,
    status: 'Potential',
  },
  {
    id: '6',
    taxCode: '0555666777',
    name: 'Công ty CP Sản xuất GHI',
    address: 'Quận 9 - TP.HCM',
    phone: '0956789012',
    email: 'ghi@manufacturing.vn',
    currentMonthRevenue: 95000000,
    lastOrderDate: '2026-01-07',
    status: 'Active',
  },
]

// ==================== MAIN COMPONENT ====================

const SalesCustomerPage = () => {
  usePageTitle('Khách hàng của tôi')
  
  const navigate = useNavigate()
  
  // State
  const [customers] = useState<ISalesCustomer[]>(MOCK_CUSTOMERS)
  const [searchText, setSearchText] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<ISalesCustomer | null>(null)
  
  // Add Customer Modal State
  const [taxCodeInput, setTaxCodeInput] = useState('')
  const [customerForm, setCustomerForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })
  const [isSearchingTaxCode, setIsSearchingTaxCode] = useState(false)
  const [taxCodeError, setTaxCodeError] = useState('')
  
  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchLower = searchText.toLowerCase()
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.taxCode.includes(searchLower) ||
        customer.phone.includes(searchLower)
      )
    })
  }, [customers, searchText])
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }
  
  // Format last order date
  const formatLastOrderDate = (date: string | null) => {
    if (!date) return 'Chưa có đơn'
    return dayjs(date).fromNow()
  }
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success'
      case 'Potential':
        return 'info'
      case 'Churned':
        return 'default'
      default:
        return 'default'
    }
  }
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Active':
        return 'Đang hoạt động'
      case 'Potential':
        return 'Tiềm năng'
      case 'Churned':
        return 'Mất khách'
      default:
        return status
    }
  }
  
  // Handle search tax code
  const handleSearchTaxCode = async () => {
    if (!taxCodeInput.trim()) {
      setTaxCodeError('Vui lòng nhập mã số thuế')
      return
    }
    
    // Validate tax code format (10 digits)
    if (!/^\d{10}$/.test(taxCodeInput)) {
      setTaxCodeError('Mã số thuế phải có 10 chữ số')
      return
    }
    
    setIsSearchingTaxCode(true)
    setTaxCodeError('')
    
    // Simulate API call
    setTimeout(() => {
      // Mock data auto-fill
      if (taxCodeInput === '0123456789') {
        setCustomerForm({
          name: 'Công ty TNHH Hải Âu',
          address: 'Thủ Đức - Hồ Chí Minh',
          phone: '0935994475',
          email: 'haiau@gmail.com',
        })
      } else {
        setTaxCodeError('Không tìm thấy thông tin với mã số thuế này')
      }
      setIsSearchingTaxCode(false)
    }, 1000)
  }
  
  // Handle create invoice
  const handleCreateInvoice = (customer: ISalesCustomer) => {
    navigate(`/invoice/create?customerId=${customer.id}`)
  }
  
  // Handle view history
  const handleViewHistory = (customer: ISalesCustomer) => {
    setSelectedCustomer(customer)
    setDrawerOpen(true)
  }
  
  // Handle close add modal
  const handleCloseAddModal = () => {
    setOpenAddModal(false)
    setTaxCodeInput('')
    setCustomerForm({ name: '', address: '', phone: '', email: '' })
    setTaxCodeError('')
  }
  
  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'customer',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 250,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', pl: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#2c3e50' }}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#546e7a', fontSize: '0.75rem', letterSpacing: '0.02em' }}>
            MST: {params.row.taxCode}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'performance',
      headerName: 'Hiệu suất',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: params.row.currentMonthRevenue > 0 ? '#2e7d32' : '#999',
            }}
          >
            {formatCurrency(params.row.currentMonthRevenue)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#546e7a', fontSize: '0.75rem' }}>
            {formatLastOrderDate(params.row.lastOrderDate)}
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
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Chip
            label={getStatusLabel(params.row.status)}
            color={getStatusColor(params.row.status)}
            size="small"
            sx={{ fontWeight: 500, fontSize: '0.8125rem' }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', height: '100%' }}>
          <Tooltip title="Lên đơn" arrow>
            <IconButton
              size="small"
              sx={{
                color: '#1976d2',
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.16)',
                },
              }}
              onClick={() => handleCreateInvoice(params.row)}
            >
              <ShoppingCartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Xem lịch sử" arrow>
            <IconButton
              size="small"
              sx={{
                color: '#ed6c02',
                bgcolor: 'rgba(237, 108, 2, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(237, 108, 2, 0.16)',
                },
              }}
              onClick={() => handleViewHistory(params.row)}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PeopleOutlineIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Khách hàng của tôi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý khách hàng và tạo đơn hàng nhanh chóng
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddModal(true)}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Thêm khách hàng
        </Button>
      </Box>

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm theo Tên, MST, Số điện thoại..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: '#fafafa',
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
              '&.Mui-focused': {
                bgcolor: '#fff',
              },
            },
          }}
        />
      </Paper>

      <Paper
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <DataGrid
          rows={filteredCustomers}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowHeight={() => 72}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
              borderBottom: '2px solid',
              borderColor: 'divider',
              fontSize: '0.875rem',
              fontWeight: 600,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'action.hover',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid',
              borderColor: 'divider',
              minHeight: '56px',
              '& .MuiTablePagination-root': {
                overflow: 'visible',
              },
              '& .MuiTablePagination-toolbar': {
                minHeight: '56px',
                paddingLeft: 2,
                paddingRight: 2,
              },
              '& .MuiTablePagination-selectLabel': {
                margin: 0,
              },
              '& .MuiTablePagination-displayedRows': {
                margin: 0,
              },
            },
          }}
        />
      </Paper>
      
      {/* Add Customer Modal */}
      <Dialog
        open={openAddModal}
        onClose={handleCloseAddModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Thêm khách hàng mới
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Nhập mã số thuế và nhấn tìm kiếm để tự động điền thông tin khách hàng
          </Alert>
          
          <Stack spacing={2.5}>
            {/* Tax Code with Search */}
            <Box>
              <TextField
                fullWidth
                label="Mã số thuế"
                required
                value={taxCodeInput}
                onChange={(e) => {
                  setTaxCodeInput(e.target.value)
                  setTaxCodeError('')
                }}
                placeholder="VD: 0123456789"
                error={!!taxCodeError}
                helperText={taxCodeError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Tìm kiếm thông tin" arrow>
                        <IconButton
                          onClick={handleSearchTaxCode}
                          disabled={isSearchingTaxCode}
                          sx={{ color: 'primary.main' }}
                        >
                          {isSearchingTaxCode ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SearchIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
            
            {/* Name */}
            <TextField
              fullWidth
              label="Tên khách hàng"
              required
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              placeholder="VD: Công ty TNHH ABC"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            {/* Address */}
            <TextField
              fullWidth
              label="Địa chỉ"
              required
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              placeholder="VD: Quận 1 - TP.HCM"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            {/* Phone */}
            <TextField
              fullWidth
              label="Số điện thoại"
              required
              value={customerForm.phone}
              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              placeholder="VD: 0912345678"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              placeholder="VD: contact@company.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseAddModal}
            sx={{ textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            sx={{ textTransform: 'none', px: 3 }}
          >
            Lưu khách hàng
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Customer History Drawer */}
      <CustomerHistoryDrawer
        open={drawerOpen}
        customer={selectedCustomer}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedCustomer(null)
        }}
      />
    </Box>
  )
}

export default SalesCustomerPage
