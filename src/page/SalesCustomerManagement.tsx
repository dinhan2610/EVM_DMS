import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { usePageTitle } from '@/hooks/usePageTitle'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import customerService from '@/services/customerService'
import CustomerFilter, { CustomerFilterState } from '@/components/CustomerFilter'
import { getUserIdFromToken, getRoleFromToken } from '@/utils/tokenUtils'

// Interface (Frontend) - Map từ Backend
export interface Customer {
  id: string
  customerName: string
  taxCode: string
  email: string
  phone: string
  address: string
  contactPerson: string
  status: 'Active' | 'Inactive'
}

// Initial Form State
const initialFormState: Omit<Customer, 'id'> = {
  customerName: '',
  taxCode: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
  status: 'Active',
}

const SalesCustomerManagement = () => {
  usePageTitle('Khách hàng của tôi')
  
  // Theme & Responsive
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>(initialFormState)
  const [isSaving, setIsSaving] = useState(false)
  
  // ✅ State cho modal xem chi tiết
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false)
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<Customer | null>(null)

  // Toggle Status States
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false)
  const [selectedCustomerForToggle, setSelectedCustomerForToggle] = useState<Customer | null>(null)

  // Tax Code Validation States
  const [taxCodeError, setTaxCodeError] = useState<string>('')
  const [isCheckingTaxCode, setIsCheckingTaxCode] = useState<boolean>(false)

  // Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  })

  // Filter State
  const [filters, setFilters] = useState<CustomerFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    status: 'All',
  })

  // useEffect: Fetch customers on mount
  useEffect(() => {
    fetchCustomers()
  }, [])

  // ✅ Fetch customers từ API - SALES CHỈ LẤY KHÁCH HÀNG CỦA MÌNH
  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      
      // ✅ Lấy userId từ token
      const currentUserId = getUserIdFromToken()
      
      if (!currentUserId) {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
      }

      console.log('📥 [Sales] Loading customers for saleID:', currentUserId)
      
      // ✅ API: getCustomersBySaleId - CHỈ lấy customers có saleID = userId
      const apiCustomers = await customerService.getCustomersBySaleId(currentUserId)
      
      console.log('✅ [Sales] Loaded customers:', apiCustomers.length)

      // 💡 SALES CUSTOMER MANAGEMENT: Hiển thị TẤT CẢ customers (cả active & inactive)
      // Sales cần xem toàn bộ danh sách khách hàng của mình để quản lý & theo dõi trạng thái

      // ✅ Map sang frontend format với optional chaining
      const mappedCustomers: Customer[] = apiCustomers.map((customer) => ({
        id: String(customer.customerID),
        customerName: customer.customerName,
        taxCode: customer.taxCode,
        email: customer.contactEmail ?? '',
        phone: customer.contactPhone ?? '',
        address: customer.address ?? '',
        contactPerson: customer.contactPerson ?? '',
        status: customer.isActive ? 'Active' : 'Inactive',
      }))

      setCustomers(mappedCustomers)
    } catch (error: unknown) {
      console.error('❌ [Sales] Error fetching customers:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách khách hàng'
      
      setCustomers([]) // ✅ Reset customers on error
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter handler
  const handleFilterChange = (newFilters: CustomerFilterState) => {
    setFilters(newFilters)
  }

  const handleResetFilter = () => {
    setFilters({ searchText: '', dateFrom: null, dateTo: null, status: 'All' })
  }

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchLower = filters.searchText.toLowerCase()
      const matchesSearch =
        !filters.searchText ||
        customer.customerName.toLowerCase().includes(searchLower) ||
        customer.taxCode.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchLower)

      const matchesStatus =
        filters.status === 'All' ||
        customer.status === filters.status

      return matchesSearch && matchesStatus
    })
  }, [customers, filters])

  // Check if tax code exists
  const checkTaxCodeOnBlur = async (taxCode: string) => {
    if (!taxCode.trim()) {
      setTaxCodeError('')
      return
    }

    if (editingCustomer && editingCustomer.taxCode === taxCode) {
      setTaxCodeError('')
      return
    }

    setIsCheckingTaxCode(true)
    setTaxCodeError('')

    try {
      const customer = await customerService.findCustomerByTaxCode(taxCode)

      if (customer) {
        setTaxCodeError('Mã số thuế/CCCD này đã tồn tại!')
      } else {
        setTaxCodeError('')
      }
    } catch (error) {
      console.error('Error checking tax code:', error)
    } finally {
      setIsCheckingTaxCode(false)
    }
  }

  const handleFormChange = (field: keyof Omit<Customer, 'id'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === 'taxCode' && taxCodeError) {
      setTaxCodeError('')
    }
  }

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        customerName: customer.customerName,
        taxCode: customer.taxCode,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        contactPerson: customer.contactPerson,
        status: customer.status,
      })
    } else {
      setEditingCustomer(null)
      setFormData(initialFormState)
    }
    setTaxCodeError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    setFormData(initialFormState)
    setTaxCodeError('')
  }

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomerForView(customer)
    setViewDetailModalOpen(true)
  }

  const handleCloseViewDetailModal = () => {
    setViewDetailModalOpen(false)
    setSelectedCustomerForView(null)
  }

  const handleSaveCustomer = async () => {
    // Validation
    if (!formData.customerName.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập Tên Công Ty/Tên Khách Hàng!',
        severity: 'error',
      })
      return
    }

    if (!formData.taxCode.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập Mã số thuế/CCCD!',
        severity: 'error',
      })
      return
    }

    // Validate email format
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setSnackbar({
          open: true,
          message: 'Email không hợp lệ!',
          severity: 'error',
        })
        return
      }
    }

    try {
      setIsSaving(true)

      if (editingCustomer) {
        // Update existing customer
        await customerService.updateCustomer(parseInt(editingCustomer.id), {
          customerName: formData.customerName,
          taxCode: formData.taxCode,
          address: formData.address,
          contactEmail: formData.email,
          contactPerson: formData.contactPerson || formData.customerName,
          contactPhone: formData.phone,
        })
        
        setSnackbar({
          open: true,
          message: `Cập nhật khách hàng "${formData.customerName}" thành công!`,
          severity: 'success',
        })
      } else {
        // ✅ Xác định saleID dựa trên role của user
        const userRole = getRoleFromToken()
        const currentUserId = getUserIdFromToken()
        
        // Sales role → gán saleID = userId từ token
        // Accountant/Admin → saleID = null (unassigned)
        // ✅ Check cả 'Sale' và 'Sales' (backend có thể trả về cả 2)
        const isSalesRole = userRole === 'Sale' || userRole === 'Sales'
        const saleID = isSalesRole && currentUserId ? currentUserId : null
        
        console.log('🔐 [Create Customer] User Role:', userRole)
        console.log('👤 [Create Customer] User ID:', currentUserId)
        console.log('🎯 [Create Customer] Assigned saleID:', saleID)
        
        // ✅ Validate: Sales MUST have userId
        if (isSalesRole && !currentUserId) {
          throw new Error('Không xác định được ID nhân viên. Vui lòng đăng nhập lại.')
        }
        
        // Add new customer với saleID
        await customerService.createCustomer({
          saleID: saleID,          // ✅ Sales: userId từ token, Others: null
          customerName: formData.customerName,
          taxCode: formData.taxCode,
          address: formData.address,
          contactEmail: formData.email,
          contactPerson: '',       // ✅ Để rỗng - User sẽ nhập thủ công khi tạo hóa đơn
          contactPhone: formData.phone,
          isActive: formData.status === 'Active',
        })
        
        setSnackbar({
          open: true,
          message: `Thêm khách hàng "${formData.customerName}" thành công!`,
          severity: 'success',
        })
      }

      // Refresh customer list
      await fetchCustomers()
      handleCloseModal()
    } catch (error: unknown) {
      console.error('❌ Error saving customer:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu khách hàng!'
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle Status Handlers
  const handleOpenToggleModal = (customer: Customer) => {
    setSelectedCustomerForToggle(customer)
    setConfirmToggleModalOpen(true)
  }

  const handleCloseToggleModal = () => {
    setConfirmToggleModalOpen(false)
    setSelectedCustomerForToggle(null)
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedCustomerForToggle) return

    try {
      const newStatus = selectedCustomerForToggle.status === 'Active' ? false : true
      const customerId = parseInt(selectedCustomerForToggle.id)
      
      // ✅ Dùng API phù hợp: setCustomerActive hoặc setCustomerInactive
      if (newStatus) {
        await customerService.setCustomerActive(customerId)
      } else {
        await customerService.setCustomerInactive(customerId)
      }
      
      setSnackbar({
        open: true,
        message: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} khách hàng "${selectedCustomerForToggle.customerName}" thành công!`,
        severity: 'success',
      })

      await fetchCustomers()
      handleCloseToggleModal()
    } catch (error: unknown) {
      console.error('❌ Error toggling customer status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thay đổi trạng thái!'
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
    }
  }

  // DataGrid Columns
  const columns: GridColDef[] = [
    {
      field: 'customerName',
      headerName: 'Tên Khách hàng',
      flex: 1,
      minWidth: 200,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', pl: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#2c3e50' }}>
            {params.row.customerName}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'taxCode',
      headerName: 'Mã số thuế/CCCD',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Customer>) => (
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
      renderCell: (params: GridRenderCellParams<Customer>) => (
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
      renderCell: (params: GridRenderCellParams<Customer>) => (
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
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Chip
            label={params.row.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
            color={params.row.status === 'Active' ? 'success' : 'default'}
            size="small"
            variant={params.row.status === 'Active' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 500, fontSize: '0.8125rem' }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Stack direction="row" spacing={0.5}>
            {/* View Details Button */}
            <Tooltip title="Xem chi tiết">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleViewDetails(params.row)}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Edit Button */}
            <Tooltip title="Chỉnh sửa">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenModal(params.row)}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Toggle Status Button */}
            <Tooltip title={params.row.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
              <IconButton
                size="small"
                color={params.row.status === 'Active' ? 'error' : 'success'}
                onClick={() => handleOpenToggleModal(params.row)}
              >
                {params.row.status === 'Active' ? (
                  <LockOutlinedIcon fontSize="small" />
                ) : (
                  <LockOpenOutlinedIcon fontSize="small" />
                )}
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
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BusinessOutlinedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Khách hàng của tôi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý khách hàng được phân công cho bạn
          </Typography>
        </Box>
      </Box>

      {/* CustomerFilter Component */}
      <CustomerFilter 
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        onAddCustomer={() => handleOpenModal()}
      />

      {/* DataGrid */}
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
          loading={isLoading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          rowHeight={60}
          columnHeaderHeight={56}
          slotProps={{
            pagination: {
              labelRowsPerPage: 'Số hàng:',
              showFirstButton: true,
              showLastButton: true,
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
              padding: 0,
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
              borderBottom: 2,
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '0.875rem',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f5f5',
            },
            // ✅ Tối ưu pagination trên 1 hàng
            '& .MuiDataGrid-footerContainer': {
              minHeight: '56px',
              borderTop: '2px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            },
            '& .MuiTablePagination-root': {
              overflow: 'visible',
            },
            '& .MuiTablePagination-toolbar': {
              minHeight: '56px',
              paddingLeft: 2,
              paddingRight: 1,
            },
            '& .MuiTablePagination-selectLabel': {
              margin: 0,
              fontSize: '0.875rem',
            },
            '& .MuiTablePagination-displayedRows': {
              margin: 0,
              fontSize: '0.875rem',
            },
            '& .MuiTablePagination-select': {
              fontSize: '0.875rem',
            },
            // Responsive: compact trên mobile
            [theme.breakpoints.down('sm')]: {
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 1,
                paddingRight: 0.5,
              },
              '& .MuiTablePagination-selectLabel': {
                fontSize: '0.8125rem',
              },
              '& .MuiTablePagination-displayedRows': {
                fontSize: '0.8125rem',
              },
              '& .MuiTablePagination-actions': {
                marginLeft: 1,
              },
            },
          }}
        />
      </Paper>

      {/* Add/Edit Customer Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 600,
            p: 3,
          }}
        >
          <BusinessOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {editingCustomer ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Thông tin khách hàng sẽ được sử dụng để tạo hóa đơn điện tử. Vui lòng nhập chính xác.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Customer Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tên Khách hàng"
                required
                autoFocus
                value={formData.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                placeholder="VD: Công ty TNHH ABC"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Tax Code */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Mã số thuế/CCCD"
                required
                value={formData.taxCode}
                onChange={(e) => handleFormChange('taxCode', e.target.value)}
                onBlur={(e) => checkTaxCodeOnBlur(e.target.value)}
                placeholder="VD: 0123456789"
                error={!!taxCodeError}
                helperText={
                  isCheckingTaxCode ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircularProgress size={12} />
                      <span>Đang kiểm tra...</span>
                    </Box>
                  ) : taxCodeError ? (
                    taxCodeError
                  ) : (
                    'Mã số thuế/CCCD phải duy nhất'
                  )
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
                    </InputAdornment>
                  ),
                  endAdornment: isCheckingTaxCode ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : !taxCodeError && formData.taxCode && !isCheckingTaxCode && (editingCustomer?.taxCode !== formData.taxCode || !editingCustomer) ? (
                    <InputAdornment position="end">
                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Contact Person - Only show in Edit mode */}
            {editingCustomer && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Người liên hệ"
                  value={formData.contactPerson}
                  onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ fontSize: 20, color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  helperText="Người liên hệ có thể được cập nhật khi tạo hóa đơn"
                />
              </Grid>
            )}

            {/* Phone */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="0901234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Email - Chung hàng với Phone */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="contact@company.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Address */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Địa chỉ"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseModal}
            color="inherit"
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveCustomer}
            variant="contained"
            disabled={isSaving || isCheckingTaxCode || !!taxCodeError}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
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
            {isSaving ? 'Đang lưu...' : (editingCustomer ? 'Cập nhật' : 'Thêm mới')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog
        open={viewDetailModalOpen}
        onClose={handleCloseViewDetailModal}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 600,
            p: 3,
          }}
        >
          <VisibilityOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Chi tiết Khách hàng
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {selectedCustomerForView && (
            <>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                  Thông tin chi tiết khách hàng trong hệ thống. Bạn có thể chỉnh sửa bằng nút "Chỉnh sửa".
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                {/* Customer Name */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <BusinessOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Tên khách hàng
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedCustomerForView.customerName}
                    </Typography>
                  </Box>
                </Grid>

                {/* Tax Code */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <ReceiptLongOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Mã số thuế/CCCD
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedCustomerForView.taxCode}
                    </Typography>
                  </Box>
                </Grid>

                {/* Contact Person - Only if exists */}
                {selectedCustomerForView.contactPerson && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                        height: '100%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <PersonOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Người liên hệ
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {selectedCustomerForView.contactPerson}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Phone */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <PhoneOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Số điện thoại
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedCustomerForView.phone || '-'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Email */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <EmailOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Email liên hệ
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedCustomerForView.email || '-'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Status */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      {selectedCustomerForView.status === 'Active' ? (
                        <LockOpenOutlinedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      ) : (
                        <LockOutlinedIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Trạng thái
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedCustomerForView.status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
                      color={selectedCustomerForView.status === 'Active' ? 'success' : 'default'}
                      size="small"
                      variant={selectedCustomerForView.status === 'Active' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600, fontSize: '0.8125rem' }}
                    />
                  </Box>
                </Grid>

                {/* Address - Full Width */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <LocationOnOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Địa chỉ
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedCustomerForView.address || '-'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseViewDetailModal}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog
        open={confirmToggleModalOpen}
        onClose={handleCloseToggleModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 600,
            p: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: selectedCustomerForToggle?.status === 'Active' ? 'error.lighter' : 'success.lighter',
            }}
          >
            <WarningAmberOutlinedIcon 
              sx={{ 
                fontSize: 28, 
                color: selectedCustomerForToggle?.status === 'Active' ? 'error.main' : 'success.main' 
              }} 
            />
          </Box>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Xác nhận thay đổi trạng thái
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2.5 }}>
            Bạn có chắc chắn muốn{' '}
            <strong>
              {selectedCustomerForToggle?.status === 'Active' ? 'vô hiệu hóa' : 'kích hoạt'}
            </strong>{' '}
            khách hàng sau?
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {selectedCustomerForToggle?.customerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              MST/CCCD: {selectedCustomerForToggle?.taxCode}
            </Typography>
          </Paper>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseToggleModal}
            color="inherit"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmToggleStatus}
            variant="contained"
            color={selectedCustomerForToggle?.status === 'Active' ? 'error' : 'success'}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            {selectedCustomerForToggle?.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SalesCustomerManagement
