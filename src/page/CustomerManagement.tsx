import { useState, useMemo } from 'react'
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
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

// Interface
export interface Customer {
  id: string
  customerName: string
  taxCode: string
  email: string
  phone: string
  address: string
  bankAccount?: string
  bankName?: string
  status: 'Active' | 'Inactive'
}

// Mock Data
const mockCustomers: Customer[] = [
  {
    id: '1',
    customerName: 'Công ty TNHH ABC Technology',
    taxCode: '0123456789',
    email: 'contact@abctech.com',
    phone: '0901234567',
    address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
    bankAccount: '1234567890',
    bankName: 'Vietcombank',
    status: 'Active',
  },
  {
    id: '2',
    customerName: 'Công ty Cổ phần XYZ Solutions',
    taxCode: '0987654321',
    email: 'info@xyzsolutions.vn',
    phone: '0912345678',
    address: '456 Đường Lê Lợi, Quận 3, TP.HCM',
    bankAccount: '9876543210',
    bankName: 'VietinBank',
    status: 'Active',
  },
  {
    id: '3',
    customerName: 'Doanh nghiệp Tư nhân DEF Trading',
    taxCode: '0112233445',
    email: 'sales@deftrading.com',
    phone: '0923456789',
    address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
    bankAccount: '1122334455',
    bankName: 'Techcombank',
    status: 'Active',
  },
  {
    id: '4',
    customerName: 'Công ty TNHH GHI Construction',
    taxCode: '0556677889',
    email: 'contact@ghiconstruction.vn',
    phone: '0934567890',
    address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
    bankAccount: '5566778899',
    bankName: 'ACB',
    status: 'Inactive',
  },
  {
    id: '5',
    customerName: 'Công ty Cổ phần JKL Logistics',
    taxCode: '0998877665',
    email: 'info@jkllogistics.com',
    phone: '0945678901',
    address: '654 Đường Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
    bankAccount: '9988776655',
    bankName: 'Sacombank',
    status: 'Active',
  },
  {
    id: '6',
    customerName: 'Công ty TNHH MNO Retail',
    taxCode: '0223344556',
    email: 'cs@mnoretail.vn',
    phone: '0956789012',
    address: '987 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
    status: 'Active',
  },
]

// Initial Form State
const initialFormState: Omit<Customer, 'id'> = {
  customerName: '',
  taxCode: '',
  email: '',
  phone: '',
  address: '',
  bankAccount: '',
  bankName: '',
  status: 'Active',
}

const CustomerManagement = () => {
  // Theme & Responsive
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // State
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>(initialFormState)

  // Toggle Status States
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false)
  const [selectedCustomerForToggle, setSelectedCustomerForToggle] = useState<Customer | null>(null)

  // Tax Code Validation States
  const [taxCodeError, setTaxCodeError] = useState<string>('')
  const [isCheckingTaxCode, setIsCheckingTaxCode] = useState<boolean>(false)

  // Filter State
  const [searchText, setSearchText] = useState('')

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

  // Filtered Data
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchLower = searchText.toLowerCase()
      return (
        customer.customerName.toLowerCase().includes(searchLower) ||
        customer.taxCode.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower)
      )
    })
  }, [customers, searchText])

  // Handlers
  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        customerName: customer.customerName,
        taxCode: customer.taxCode,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        bankAccount: customer.bankAccount || '',
        bankName: customer.bankName || '',
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

  const handleSaveCustomer = () => {
    // Validation
    if (!formData.customerName.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập Tên Khách hàng!',
        severity: 'error',
      })
      return
    }

    if (!formData.taxCode.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập Mã số thuế!',
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

    if (editingCustomer) {
      // Update existing customer
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === editingCustomer.id
            ? { ...customer, ...formData }
            : customer
        )
      )
      setSnackbar({
        open: true,
        message: `Cập nhật khách hàng "${formData.customerName}" thành công!`,
        severity: 'success',
      })
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: (customers.length + 1).toString(),
        ...formData,
      }
      setCustomers((prev) => [...prev, newCustomer])
      setSnackbar({
        open: true,
        message: `Thêm khách hàng "${formData.customerName}" thành công!`,
        severity: 'success',
      })
    }

    handleCloseModal()
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

  const handleConfirmToggleStatus = () => {
    if (!selectedCustomerForToggle) return
    
    const newStatus = selectedCustomerForToggle.status === 'Active' ? 'Inactive' : 'Active'
    
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === selectedCustomerForToggle.id
          ? { ...customer, status: newStatus }
          : customer
      )
    )
    
    setSnackbar({
      open: true,
      message: `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} khách hàng "${selectedCustomerForToggle.customerName}"`,
      severity: 'info',
    })
    
    handleCloseToggleModal()
  }

  // Tax Code Validation Handler
  const checkTaxCodeOnBlur = async (taxCode: string) => {
    if (!taxCode.trim()) {
      setTaxCodeError('Mã số thuế là bắt buộc')
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
      setTaxCodeError('Lỗi: Mã số thuế này đã tồn tại trong hệ thống')
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
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.row.customerName}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'taxCode',
      headerName: 'Mã số thuế',
      width: 150,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {params.row.taxCode}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.email}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Số điện thoại',
      width: 140,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.row.phone}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Chip
          label={params.row.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
          color={params.row.status === 'Active' ? 'success' : 'default'}
          size="small"
          variant={params.row.status === 'Active' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 120,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Stack direction="row" spacing={0.5}>
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

      {/* Toolbar */}
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
          }}
        >
          <TextField
            size="small"
            placeholder="Tìm kiếm theo Tên, MST, Email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              flex: 1,
              maxWidth: { sm: 400 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
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
            Thêm Khách hàng
          </Button>
        </Box>
      </Paper>

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
                label="Mã số thuế"
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
                    'Mã số thuế phải duy nhất'
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

            {/* Email */}
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

            {/* Address */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
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

            {/* Bank Account */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Số tài khoản Ngân hàng"
                value={formData.bankAccount}
                onChange={(e) => handleFormChange('bankAccount', e.target.value)}
                placeholder="1234567890"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
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

            {/* Bank Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tên Ngân hàng"
                value={formData.bankName}
                onChange={(e) => handleFormChange('bankName', e.target.value)}
                placeholder="VD: Vietcombank"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceOutlinedIcon sx={{ fontSize: 20, color: 'action.active' }} />
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
            disabled={isCheckingTaxCode || !!taxCodeError || !formData.customerName.trim() || !formData.taxCode.trim()}
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
            {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
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
                  Mã số thuế
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
