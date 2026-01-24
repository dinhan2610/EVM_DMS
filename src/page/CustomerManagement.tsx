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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined' // ✅ Thêm icon xem chi tiết
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline' // ✅ Thêm icon contactPerson
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

// Interface (Frontend) - Map từ Backend
export interface Customer {
  id: string
  customerName: string
  taxCode: string
  email: string
  phone: string
  address: string
  contactPerson: string // ✅ Thêm contactPerson từ API
  status: 'Active' | 'Inactive'
}

// Initial Form State
const initialFormState: Omit<Customer, 'id'> = {
  customerName: '',
  taxCode: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '', // ✅ Thêm contactPerson
  status: 'Active',
}

const CustomerManagement = () => {
  usePageTitle('Quản lý khách hàng')
  
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

  // useEffect: Fetch customers on mount
  useEffect(() => {
    fetchCustomers()
  }, [])

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const data = await customerService.getAllCustomers()
      
      // Map backend Customer to frontend Customer
      const mappedCustomers: Customer[] = data.map((c) => ({
        id: c.customerID.toString(),
        customerName: c.customerName,
        taxCode: c.taxCode,
        email: c.contactEmail,
        phone: c.contactPhone,
        address: c.address,
        contactPerson: c.contactPerson || '', // ✅ Thêm contactPerson từ API
        status: c.isActive ? 'Active' : 'Inactive',
      }))
      
      setCustomers(mappedCustomers)
      console.log('✅ Loaded', mappedCustomers.length, 'customers')
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      setSnackbar({
        open: true,
        message: 'Không thể tải danh sách khách hàng. Vui lòng thử lại.',
        severity: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter State - sử dụng CustomerFilter
  const [filters, setFilters] = useState<CustomerFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    status: '',
  })

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Filtered Data - comprehensive filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase().trim()
        const matchesSearch = (
          customer.customerName.toLowerCase().includes(searchLower) ||
          customer.taxCode.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower) ||
          customer.address.toLowerCase().includes(searchLower)
        )
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status && customer.status !== filters.status) {
        return false
      }

      // Date range filter (assuming customers have a createdAt field from backend)
      // Note: Backend Customer interface would need to include createdAt/updatedAt
      // For now, we'll skip date filtering as it's not in current Customer interface
      // If backend adds createdAt field, uncomment below:
      /*
      if (filters.dateFrom) {
        const customerDate = dayjs(customer.createdAt)
        if (customerDate.isBefore(filters.dateFrom, 'day')) return false
      }
      if (filters.dateTo) {
        const customerDate = dayjs(customer.createdAt)
        if (customerDate.isAfter(filters.dateTo, 'day')) return false
      }
      */

      return true
    })
  }, [customers, filters])

  // Filter Handlers
  const handleFilterChange = (newFilters: CustomerFilterState) => {
    setFilters(newFilters)
  }

  const handleResetFilter = () => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      status: '',
    })
  }

  // Handlers
  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        customerName: customer.customerName,
        taxCode: customer.taxCode,
        email: customer.email,
        contactPerson: customer.contactPerson || '', // ✅ Thêm contactPerson khi edit
        phone: customer.phone,
        address: customer.address,
        status: customer.status,
      })
    } else {
      setEditingCustomer(null)
      setFormData(initialFormState)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    setFormData(initialFormState)
    setTaxCodeError('')
    setIsCheckingTaxCode(false)
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
          contactPerson: formData.contactPerson || formData.customerName, // ✅ Dùng contactPerson từ form, fallback customerName
          contactPhone: formData.phone,
        })
        
        setSnackbar({
          open: true,
          message: `Cập nhật khách hàng "${formData.customerName}" thành công!`,
          severity: 'success',
        })
      } else {
        // Add new customer - KHÔNG gửi contactPerson (backend sẽ tự set)
        await customerService.createCustomer({
          customerName: formData.customerName,
          taxCode: formData.taxCode,
          address: formData.address,
          contactEmail: formData.email,
          contactPerson: formData.customerName, // ✅ Khi tạo mới, dùng customerName
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

  const handleFormChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear tax code error when user starts typing
    if (field === 'taxCode') {
      setTaxCodeError('')
    }
  }

  // Toggle Status Handlers
  const handleOpenToggleModal = (customer: Customer) => {
    setSelectedCustomerForToggle(customer)
    setConfirmToggleModalOpen(true)
  }

  const handleCloseToggleModal = () => {
    setSelectedCustomerForToggle(null)
    setConfirmToggleModalOpen(false)
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedCustomerForToggle) return
    
    try {
      const customerId = parseInt(selectedCustomerForToggle.id)
      const newStatus = selectedCustomerForToggle.status === 'Active' ? 'Inactive' : 'Active'
      
      // Call API to toggle status
      if (newStatus === 'Active') {
        await customerService.setCustomerActive(customerId)
      } else {
        await customerService.setCustomerInactive(customerId)
      }
      
      setSnackbar({
        open: true,
        message: `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} khách hàng "${selectedCustomerForToggle.customerName}"`,
        severity: 'info',
      })
      
      // Refresh customer list
      await fetchCustomers()
      handleCloseToggleModal()
    } catch (error: unknown) {
      console.error('❌ Error toggling status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thay đổi trạng thái!'
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      handleCloseToggleModal()
    }
  }

  // Tax Code Validation Handler
  const checkTaxCodeOnBlur = async (taxCode: string) => {
    if (!taxCode.trim()) {
      setTaxCodeError('Mã số thuế/CCCD là bắt buộc')
      return
    }

    // Skip check if editing and tax code hasn't changed
    if (editingCustomer && editingCustomer.taxCode === taxCode) {
      setTaxCodeError('')
      return
    }

    setIsCheckingTaxCode(true)
    setTaxCodeError('')

    // Simulate API call (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if tax code already exists
    const isDuplicate = customers.some(
      c => c.taxCode === taxCode && c.id !== editingCustomer?.id
    )

    if (isDuplicate) {
      setTaxCodeError('Lỗi: Mã số thuế/CCCD này đã tồn tại trong hệ thống')
    } else {
      setTaxCodeError('') // Valid
    }

    setIsCheckingTaxCode(false)
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
            Quản lý Khách hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý thông tin khách hàng, dữ liệu nguồn cho hệ thống hóa đơn điện tử
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
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
              borderBottom: '2px solid',
              borderColor: 'divider',
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
            },
            '& .MuiTablePagination-root': {
              overflow: 'visible',
            },
            '& .MuiTablePagination-toolbar': {
              minHeight: '56px',
              paddingLeft: 2,
              paddingRight: 2,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              margin: 0,
            },
          }}
        />
      </Paper>

      {/* Add/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
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

          <Grid container spacing={2.5}>
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

            {/* Email - Full Width */}
            <Grid size={{ xs: 12 }}>
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
              mb: 2.5,
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Tên khách hàng
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedCustomerForToggle?.customerName}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Mã số thuế/CCCD
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', color: 'primary.main' }}>
                  {selectedCustomerForToggle?.taxCode}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {selectedCustomerForToggle?.email}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Alert 
            severity={selectedCustomerForToggle?.status === 'Active' ? 'warning' : 'info'}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="body2">
              {selectedCustomerForToggle?.status === 'Active' ? (
                <>
                  Khách hàng sẽ <strong>không thể thực hiện giao dịch</strong> trong hệ thống sau khi bị vô hiệu hóa.
                </>
              ) : (
                <>
                  Khách hàng sẽ có thể <strong>thực hiện giao dịch trở lại</strong> trong hệ thống sau khi được kích hoạt.
                </>
              )}
            </Typography>
          </Alert>
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
            startIcon={
              selectedCustomerForToggle?.status === 'Active' ? 
              <LockOutlinedIcon /> : 
              <LockOpenOutlinedIcon />
            }
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
            {selectedCustomerForToggle?.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
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
                        Mã số thuế
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

                {/* Email */}
                <Grid size={{ xs: 12, md: selectedCustomerForView.contactPerson ? 6 : 12 }}>
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
                      {selectedCustomerForView.email}
                    </Typography>
                  </Box>
                </Grid>

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
                      {selectedCustomerForView.phone}
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
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <LocationOnOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Địa chỉ
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedCustomerForView.address}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseViewDetailModal}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Đóng
          </Button>
          {selectedCustomerForView && (
            <Button
              onClick={() => {
                handleCloseViewDetailModal()
                handleOpenModal(selectedCustomerForView)
              }}
              variant="contained"
              startIcon={<EditOutlinedIcon />}
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
              Chỉnh sửa
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CustomerManagement
