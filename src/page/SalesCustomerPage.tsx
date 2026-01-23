import { useState, useMemo, useEffect, useCallback } from 'react'
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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import CustomerHistoryDrawer from '../components/CustomerHistoryDrawer'
import { useAuthContext } from '@/context/useAuthContext'
import { Customer, getCustomersBySaleId } from '@/services/customerService'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ==================== INTERFACES ====================

export interface ISalesCustomer {
  id: string
  customerID: number
  saleID: number
  taxCode: string
  name: string
  address: string
  phone: string
  email: string
  contactPerson: string
  isActive: boolean
  currentMonthRevenue: number // Doanh số tháng này (TODO: cần API riêng)
  lastOrderDate: string | null // Ngày mua gần nhất (TODO: cần API riêng)
  status: 'Potential' | 'Active' | 'Churned'
}

// ✅ Map Customer từ API sang ISalesCustomer cho UI
const mapCustomerToSalesCustomer = (customer: Customer): ISalesCustomer => {
  return {
    id: String(customer.customerID),
    customerID: customer.customerID,
    saleID: customer.saleID,
    taxCode: customer.taxCode,
    name: customer.customerName,
    address: customer.address,
    phone: customer.contactPhone,
    email: customer.contactEmail,
    contactPerson: customer.contactPerson,
    isActive: customer.isActive,
    // TODO: Các field này cần API riêng để lấy thống kê
    currentMonthRevenue: 0,
    lastOrderDate: null,
    status: customer.isActive ? 'Active' : 'Potential',
  }
}

// ==================== MAIN COMPONENT ====================

const SalesCustomerPage = () => {
  usePageTitle('Khách hàng của tôi')
  
  const navigate = useNavigate()
  const { user } = useAuthContext()
  
  // State
  const [customers, setCustomers] = useState<ISalesCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // ✅ Load customers từ API
  const loadCustomers = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ No user ID found')
      setError('Không tìm thấy thông tin người dùng')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const saleId = Number(user.id)
      console.log('📥 Loading customers for saleId:', saleId)
      
      const customersData = await getCustomersBySaleId(saleId)
      
      // ✅ FILTER: Chỉ lấy customers có saleID khớp với user đang đăng nhập
      // Backend có thể trả về tất cả, nên cần filter ở client
      const filteredCustomers = customersData.filter(c => c.saleID === saleId)
      const mappedCustomers = filteredCustomers.map(mapCustomerToSalesCustomer)
      
      console.log('✅ Total customers from API:', customersData.length)
      console.log('✅ Filtered customers (saleID === ' + saleId + '):', mappedCustomers.length)
      setCustomers(mappedCustomers)
    } catch (err) {
      console.error('❌ Error loading customers:', err)
      setError('Không thể tải danh sách khách hàng')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load customers on mount
  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])
  
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
  
  // ✅ Handle view debt (navigate to debt management with customerId)
  const handleViewDebt = (customer: ISalesCustomer) => {
    navigate(`/debt-management?customerId=${customer.customerID}`)
  }
  
  // Handle close add modal
  const handleCloseAddModal = () => {
    setOpenAddModal(false)
    setTaxCodeInput('')
    setCustomerForm({ name: '', address: '', phone: '', email: '' })
    setTaxCodeError('')
  }
  
  // DataGrid columns - ✅ Match 100% với CustomerManagement
  const columns: GridColDef[] = [
    {
      field: 'customerName',
      headerName: 'Tên Khách hàng',
      flex: 1,
      minWidth: 200,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', pl: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#2c3e50' }}>
            {params.row.name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'taxCode',
      headerName: 'Mã số thuế',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', letterSpacing: '0.02em', fontWeight: 500, color: '#546e7a' }}>
            {params.row.taxCode}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#546e7a' }}>
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Số điện thoại',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', letterSpacing: '0.02em', fontWeight: 500, color: '#1976d2' }}>
            {params.row.phone}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Chip
            label={params.row.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
            color={params.row.isActive ? 'success' : 'default'}
            size="small"
            variant={params.row.isActive ? 'filled' : 'outlined'}
            sx={{ fontWeight: 500, fontSize: '0.8125rem' }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams<ISalesCustomer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Stack direction="row" spacing={0.5}>
            {/* Lên đơn Button */}
            <Tooltip title="Lên đơn" arrow>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleCreateInvoice(params.row)}
              >
                <ShoppingCartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Xem lịch sử Button */}
            <Tooltip title="Xem lịch sử" arrow>
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleViewHistory(params.row)}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* ✅ Xem công nợ Button */}
            <Tooltip title="Xem công nợ" arrow>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleViewDebt(params.row)}
              >
                <AccountBalanceIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
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

      {/* Loading State */}
      {loading && (
        <Paper
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Đang tải danh sách khách hàng...
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadCustomers}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      {!loading && !error && (
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
            localeText={{
              noRowsLabel: 'Chưa có khách hàng nào',
            }}
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
      )}
      
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
