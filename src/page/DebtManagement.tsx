import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Badge,
  Chip,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  
  alpha,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PaymentIcon from '@mui/icons-material/Payment'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import { CustomerDebt, DebtInvoice, PaymentRecord } from '@/types/debt.types'

// ==================== MOCK DATA ====================

const mockCustomerDebts: CustomerDebt[] = [
  {
    customerId: '1',
    customerName: 'Công ty TNHH ABC Technology',
    taxCode: '0123456789',
    email: 'abc@company.com',
    phone: '024 1234 5678',
    address: '123 Đường Láng, Đống Đa, Hà Nội',
    totalDebt: 45000000,
    overdueDebt: 15000000,
    invoiceCount: 3,
    lastPaymentDate: '2024-11-20',
  },
  {
    customerId: '2',
    customerName: 'Công ty CP XYZ Solutions',
    taxCode: '0987654321',
    email: 'xyz@company.com',
    phone: '028 9876 5432',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    totalDebt: 28000000,
    overdueDebt: 28000000,
    invoiceCount: 2,
    lastPaymentDate: null,
  },
  {
    customerId: '3',
    customerName: 'Doanh nghiệp Minh Tuấn',
    taxCode: '0111222333',
    email: 'minhtuan@company.com',
    phone: '0236 3333 444',
    address: '789 Trần Phú, Hải Châu, Đà Nẵng',
    totalDebt: 12000000,
    overdueDebt: 0,
    invoiceCount: 1,
    lastPaymentDate: '2024-12-01',
  },
  {
    customerId: '4',
    customerName: 'Tập đoàn DEF Group',
    taxCode: '0444555666',
    email: 'def@company.com',
    phone: '0511 2222 333',
    address: '101 Lê Duẩn, Thanh Khê, Đà Nẵng',
    totalDebt: 67000000,
    overdueDebt: 25000000,
    invoiceCount: 5,
    lastPaymentDate: '2024-10-15',
  },
  {
    customerId: '5',
    customerName: 'Công ty TNHH GHI Logistics',
    taxCode: '0777888999',
    email: 'ghi@company.com',
    phone: '0254 4444 555',
    address: '202 Quang Trung, Gò Vấp, TP.HCM',
    totalDebt: 8500000,
    overdueDebt: 0,
    invoiceCount: 1,
    lastPaymentDate: '2024-12-05',
  },
]

const mockInvoices: Record<string, DebtInvoice[]> = {
  '1': [
    {
      id: 'INV-001',
      invoiceNo: 'C24TAA-001',
      invoiceDate: '2024-10-01',
      dueDate: '2024-10-31',
      totalAmount: 15000000,
      paidAmount: 10000000,
      remainingAmount: 5000000,
      paymentStatus: 'PartiallyPaid',
      description: 'Dịch vụ tư vấn tháng 10/2024',
    },
    {
      id: 'INV-002',
      invoiceNo: 'C24TAA-002',
      invoiceDate: '2024-11-01',
      dueDate: '2024-11-30',
      totalAmount: 25000000,
      paidAmount: 15000000,
      remainingAmount: 10000000,
      paymentStatus: 'Overdue',
      description: 'Cước hosting VPS tháng 11/2024',
    },
    {
      id: 'INV-003',
      invoiceNo: 'C24TAA-003',
      invoiceDate: '2024-12-01',
      dueDate: '2024-12-31',
      totalAmount: 30000000,
      paidAmount: 0,
      remainingAmount: 30000000,
      paymentStatus: 'Unpaid',
      description: 'Bảo trì hệ thống tháng 12/2024',
    },
  ],
  '2': [
    {
      id: 'INV-004',
      invoiceNo: 'C24TAB-001',
      invoiceDate: '2024-09-15',
      dueDate: '2024-10-15',
      totalAmount: 18000000,
      paidAmount: 0,
      remainingAmount: 18000000,
      paymentStatus: 'Overdue',
      description: 'Thiết kế website',
    },
    {
      id: 'INV-005',
      invoiceNo: 'C24TAB-002',
      invoiceDate: '2024-10-20',
      dueDate: '2024-11-20',
      totalAmount: 10000000,
      paidAmount: 0,
      remainingAmount: 10000000,
      paymentStatus: 'Overdue',
      description: 'Tên miền + Hosting',
    },
  ],
  '3': [
    {
      id: 'INV-006',
      invoiceNo: 'C24TAC-001',
      invoiceDate: '2024-11-25',
      dueDate: '2024-12-25',
      totalAmount: 12000000,
      paidAmount: 0,
      remainingAmount: 12000000,
      paymentStatus: 'Unpaid',
      description: 'Phần mềm quản lý',
    },
  ],
  '4': [
    {
      id: 'INV-007',
      invoiceNo: 'C24TAD-001',
      invoiceDate: '2024-09-01',
      dueDate: '2024-10-01',
      totalAmount: 20000000,
      paidAmount: 0,
      remainingAmount: 20000000,
      paymentStatus: 'Overdue',
      description: 'Tư vấn chuyển đổi số Q3/2024',
    },
    {
      id: 'INV-008',
      invoiceNo: 'C24TAD-002',
      invoiceDate: '2024-10-10',
      dueDate: '2024-11-10',
      totalAmount: 15000000,
      paidAmount: 10000000,
      remainingAmount: 5000000,
      paymentStatus: 'Overdue',
      description: 'Đào tạo nhân viên',
    },
    {
      id: 'INV-009',
      invoiceNo: 'C24TAD-003',
      invoiceDate: '2024-11-15',
      dueDate: '2024-12-15',
      totalAmount: 22000000,
      paidAmount: 0,
      remainingAmount: 22000000,
      paymentStatus: 'Unpaid',
      description: 'Dịch vụ IT Outsourcing',
    },
    {
      id: 'INV-010',
      invoiceNo: 'C24TAD-004',
      invoiceDate: '2024-12-01',
      dueDate: '2025-01-01',
      totalAmount: 10000000,
      paidAmount: 0,
      remainingAmount: 10000000,
      paymentStatus: 'Unpaid',
      description: 'Bảo trì server',
    },
  ],
  '5': [
    {
      id: 'INV-011',
      invoiceNo: 'C24TAE-001',
      invoiceDate: '2024-12-03',
      dueDate: '2025-01-03',
      totalAmount: 8500000,
      paidAmount: 0,
      remainingAmount: 8500000,
      paymentStatus: 'Unpaid',
      description: 'Phần mềm kế toán',
    },
  ],
}

const mockPaymentHistory: Record<string, PaymentRecord[]> = {
  '1': [
    {
      id: 'PAY-001',
      invoiceId: 'INV-001',
      invoiceNo: 'C24TAA-001',
      amount: 10000000,
      paymentDate: '2024-11-20',
      method: 'Transfer',
      note: 'Thanh toán đợt 1',
      createdBy: 'Admin',
    },
    {
      id: 'PAY-002',
      invoiceId: 'INV-002',
      invoiceNo: 'C24TAA-002',
      amount: 15000000,
      paymentDate: '2024-11-25',
      method: 'Cash',
      note: 'Thanh toán một phần',
      createdBy: 'Admin',
    },
  ],
  '4': [
    {
      id: 'PAY-003',
      invoiceId: 'INV-008',
      invoiceNo: 'C24TAD-002',
      amount: 10000000,
      paymentDate: '2024-11-15',
      method: 'Transfer',
      note: 'Thanh toán đợt 1 - 50%',
      createdBy: 'Kế toán',
    },
  ],
  '5': [],
  '2': [],
  '3': [],
}

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const isOverdue = (dueDate: string): boolean => {
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

const getPaymentStatusColor = (
  status: DebtInvoice['paymentStatus']
): 'default' | 'warning' | 'success' | 'error' => {
  const colors = {
    Unpaid: 'default' as const,
    PartiallyPaid: 'warning' as const,
    Paid: 'success' as const,
    Overdue: 'error' as const,
  }
  return colors[status]
}

const getPaymentStatusLabel = (status: DebtInvoice['paymentStatus']): string => {
  const labels = {
    Unpaid: 'Chưa thanh toán',
    PartiallyPaid: 'Đã trả 1 phần',
    Paid: 'Đã thanh toán',
    Overdue: 'Quá hạn',
  }
  return labels[status]
}

// ==================== MAIN COMPONENT ====================

const DebtManagement = () => {
  // State
  const [searchText, setSearchText] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(mockCustomerDebts[0])
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'history'>('invoices')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<DebtInvoice | null>(null)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: dayjs(),
    method: 'Transfer' as 'Transfer' | 'Cash',
    note: '',
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  })

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return mockCustomerDebts.filter((customer) =>
      customer.customerName.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText])

  // Get invoices for selected customer
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return []
    return mockInvoices[selectedCustomer.customerId] || []
  }, [selectedCustomer])

  // Get unpaid invoices
  const unpaidInvoices = useMemo(() => {
    return customerInvoices.filter((inv) => inv.paymentStatus !== 'Paid')
  }, [customerInvoices])

  // Get payment history
  const paymentHistory = useMemo(() => {
    if (!selectedCustomer) return []
    return mockPaymentHistory[selectedCustomer.customerId] || []
  }, [selectedCustomer])

  // Handlers
  const handleCustomerClick = useCallback((customer: CustomerDebt) => {
    setSelectedCustomer(customer)
    setSelectedTab('invoices')
  }, [])

  const handlePaymentClick = useCallback((invoice: DebtInvoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      amount: invoice.remainingAmount,
      date: dayjs(),
      method: 'Transfer',
      note: '',
    })
    setPaymentModalOpen(true)
  }, [])

  const handlePaymentSubmit = useCallback(() => {
    if (!selectedInvoice) return

    if (paymentData.amount > selectedInvoice.remainingAmount) {
      setSnackbar({
        open: true,
        message: 'Số tiền thanh toán không được lớn hơn số nợ còn lại!',
        severity: 'error',
      })
      return
    }

    if (paymentData.amount <= 0) {
      setSnackbar({
        open: true,
        message: 'Số tiền thanh toán phải lớn hơn 0!',
        severity: 'error',
      })
      return
    }

    // Simulate payment processing
    const isPartialPayment = paymentData.amount < selectedInvoice.remainingAmount

    setSnackbar({
      open: true,
      message: isPartialPayment
        ? `✓ Đã ghi nhận thanh toán một phần: ${formatCurrency(paymentData.amount)}`
        : `✓ Đã ghi nhận thanh toán đầy đủ: ${formatCurrency(paymentData.amount)}`,
      severity: 'success',
    })

    setPaymentModalOpen(false)
    setSelectedInvoice(null)
  }, [selectedInvoice, paymentData])

  // DataGrid columns for invoices
  const invoiceColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'invoiceNo',
        headerName: 'Số hóa đơn',
        flex: 1,
        minWidth: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
            {params.value as string}
          </Typography>
        ),
      },
      {
        field: 'invoiceDate',
        headerName: 'Ngày HĐ',
        width: 110,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {dayjs(params.value as string).format('DD/MM/YYYY')}
          </Typography>
        ),
      },
      {
        field: 'dueDate',
        headerName: 'Hạn TT',
        width: 110,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const overdue = isOverdue(params.value as string)
          return (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                color: overdue ? '#d32f2f' : 'inherit',
                fontWeight: overdue ? 600 : 400,
              }}
            >
              {dayjs(params.value as string).format('DD/MM/YYYY')}
            </Typography>
          )
        },
      },
      {
        field: 'totalAmount',
        headerName: 'Tổng tiền',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {formatCurrency(params.value as number)}
          </Typography>
        ),
      },
      {
        field: 'paidAmount',
        headerName: 'Đã trả',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#2e7d32' }}>
            {formatCurrency(params.value as number)}
          </Typography>
        ),
      },
      {
        field: 'remainingAmount',
        headerName: 'Còn nợ',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#d32f2f' }}>
            {formatCurrency(params.value as number)}
          </Typography>
        ),
      },
      
      {
        field: 'paymentStatus',
        headerName: 'Trạng thái',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Chip
              label={getPaymentStatusLabel(params.value as DebtInvoice['paymentStatus'])}
              color={getPaymentStatusColor(params.value as DebtInvoice['paymentStatus'])}
              size="small"
              sx={{ fontWeight: 500, fontSize: '0.75rem' }}
            />
          </Box>
        ),
      },
      {
        field: 'actions',
        headerName: 'Thao tác',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const invoice = params.row as DebtInvoice
          if (invoice.paymentStatus === 'Paid') return null
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Tooltip title="Ghi nhận thanh toán">
                <IconButton
                  size="small"
                  onClick={() => handlePaymentClick(invoice)}
                  sx={{
                    color: '#2e7d32',
                    '&:hover': {
                      backgroundColor: alpha('#2e7d32', 0.1),
                    },
                  }}
                >
                  <PaymentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )
        },
      },
    ],
    [handlePaymentClick]
  )

  // DataGrid columns for payment history
  const historyColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'paymentDate',
        headerName: 'Ngày TT',
        width: 110,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {dayjs(params.value as string).format('DD/MM/YYYY')}
          </Typography>
        ),
      },
      {
        field: 'invoiceNo',
        headerName: 'Số HĐ',
        flex: 1,
        minWidth: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
            {params.value as string}
          </Typography>
        ),
      },
      {
        field: 'amount',
        headerName: 'Số tiền',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2e7d32' }}>
            {formatCurrency(params.value as number)}
          </Typography>
        ),
      },
      {
        field: 'method',
        headerName: 'Hình thức',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value === 'Transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
            color={params.value === 'Transfer' ? 'primary' : 'default'}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        ),
      },
      {
        field: 'note',
        headerName: 'Ghi chú',
        flex: 1,
        minWidth: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#666' }}>
            {params.value as string}
          </Typography>
        ),
      },
      {
        field: 'createdBy',
        headerName: 'Người tạo',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {params.value as string}
          </Typography>
        ),
      },
    ],
    []
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Quản lý Công nợ & Thu tiền
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Theo dõi dư nợ khách hàng và ghi nhận thanh toán
            </Typography>
          </Box>

          {/* Customer Selection Bar - Compact */}
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 1.5,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {/* Search Input */}
              <TextField
                size="small"
                placeholder="Tìm kiếm khách hàng..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    backgroundColor: '#fafafa',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.875rem',
                  },
                }}
              />

              {/* Customer Select Dropdown */}
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Chọn khách hàng</InputLabel>
                <Select
                  value={selectedCustomer?.customerId || ''}
                  onChange={(e) => {
                    const customer = mockCustomerDebts.find((c) => c.customerId === e.target.value)
                    if (customer) handleCustomerClick(customer)
                  }}
                  label="Chọn khách hàng"
                  sx={{
                    backgroundColor: '#fafafa',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  {filteredCustomers.map((customer) => (
                    <MenuItem key={customer.customerId} value={customer.customerId}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {customer.customerName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                          MST: {customer.taxCode} • {customer.phone}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Main Content: Full Width */}
          {selectedCustomer && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                height: 'calc(100vh - 240px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Customer Info & KPI - Inline Compact */}
              <Box sx={{ 
                px: 2.5, 
                py: 2, 
                borderBottom: '1px solid #e0e0e0', 
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3
              }}>
                {/* Customer Info */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                    {selectedCustomer.customerName}
                  </Typography>
                  <Stack direction="row" spacing={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: '#999' }} />
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                        {selectedCustomer.taxCode}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: '#999' }} />
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                        {selectedCustomer.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 16, color: '#999' }} />
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                        {selectedCustomer.email}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* KPI Inline - Compact */}
                <Stack 
                  direction="row" 
                  spacing={3} 
                  divider={<Box sx={{ width: 1, height: 40, bgcolor: '#e0e0e0' }} />}
                  sx={{ pr: 1 }}
                >
                  <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Tổng nợ
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: '1.25rem', mt: 0.5 }}>
                      {formatCurrency(selectedCustomer.totalDebt)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Đã thanh toán
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32', fontSize: '1.25rem', mt: 0.5 }}>
                      {formatCurrency(customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Quá hạn
                      </Typography>
                      {selectedCustomer.overdueDebt > 0 && (
                        <WarningAmberIcon sx={{ fontSize: 14, color: '#ff9800' }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontSize: '1.25rem' }}>
                      {formatCurrency(selectedCustomer.overdueDebt)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Tabs
                value={selectedTab}
                onChange={(_, newValue) => setSelectedTab(newValue)}
                sx={{
                  borderBottom: '1px solid #e0e0e0',
                  px: 2.5,
                  minHeight: 44,
                  backgroundColor: '#fafafa',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    minHeight: 44,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                    <Tab
                      value="invoices"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PaymentIcon sx={{ fontSize: 18 }} />
                          Hóa đơn chưa thanh toán
                          <Badge 
                            badgeContent={unpaidInvoices.length} 
                            color="error"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.65rem',
                                height: 18,
                                minWidth: 18,
                              }
                            }}
                          />
                        </Box>
                      }
                    />
                    <Tab
                      value="history"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HistoryIcon sx={{ fontSize: 18 }} />
                          Lịch sử thanh toán
                        </Box>
                      }
                    />
                  </Tabs>

                  <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {selectedTab === 'invoices' ? (
                      <DataGrid
                        rows={unpaidInvoices}
                        columns={invoiceColumns}
                        disableRowSelectionOnClick
                        hideFooter={unpaidInvoices.length <= 10}
                        sx={{
                          border: 'none',
                          flex: 1,
                          '& .MuiDataGrid-cell': {
                            borderColor: '#f5f5f5',
                            fontSize: '0.875rem',
                            py: 1.5,
                          },
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f8f9fa',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            color: '#666',
                            borderBottom: '2px solid #e0e0e0',
                          },
                          '& .MuiDataGrid-row': {
                            '&:hover': {
                              backgroundColor: '#f9fafb',
                              cursor: 'pointer',
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: '#fafbfc',
                            },
                          },
                          '& .MuiDataGrid-footerContainer': {
                            borderTop: '2px solid #e0e0e0',
                          },
                        }}
                      />
                    ) : (
                      <DataGrid
                        rows={paymentHistory}
                        columns={historyColumns}
                        disableRowSelectionOnClick
                        hideFooter={paymentHistory.length <= 10}
                        sx={{
                          border: 'none',
                          flex: 1,
                          '& .MuiDataGrid-cell': {
                            borderColor: '#f5f5f5',
                            fontSize: '0.875rem',
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f8f9fa',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            color: '#666',
                            borderBottom: '2px solid #e0e0e0',
                          },
                          '& .MuiDataGrid-row': {
                            '&:hover': {
                              backgroundColor: '#f9fafb',
                              cursor: 'pointer',
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: '#fafbfc',
                            },
                          },
                          '& .MuiDataGrid-footerContainer': {
                            borderTop: '2px solid #e0e0e0',
                          },
                        }}
                      />
                    )}
                  </Box>
                </Paper>
              )}

          {/* Payment Modal */}
          <Dialog
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                💰 Ghi nhận thanh toán
              </Typography>
              {selectedInvoice && (
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Hóa đơn: {selectedInvoice.invoiceNo}
                </Typography>
              )}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
              {selectedInvoice && (
                <Stack spacing={3}>
                  {/* Invoice Info */}
                  <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Tổng tiền hóa đơn:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(selectedInvoice.totalAmount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Đã thanh toán:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                          {formatCurrency(selectedInvoice.paidAmount)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Còn nợ:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                          {formatCurrency(selectedInvoice.remainingAmount)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Alert>

                  {/* Payment Amount */}
                  <TextField
                    fullWidth
                    label="Số tiền thanh toán"
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })
                    }
                    InputProps={{
                      endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                    }}
                    helperText={
                      paymentData.amount < selectedInvoice.remainingAmount
                        ? '⚠️ Thanh toán một phần - Hóa đơn sẽ chuyển sang trạng thái "Đã trả 1 phần"'
                        : paymentData.amount === selectedInvoice.remainingAmount
                        ? '✓ Thanh toán đầy đủ - Hóa đơn sẽ chuyển sang trạng thái "Đã thanh toán"'
                        : ''
                    }
                    error={paymentData.amount > selectedInvoice.remainingAmount}
                  />

                  {/* Payment Date */}
                  <DatePicker
                    label="Ngày thanh toán"
                    value={paymentData.date}
                    onChange={(newValue) => setPaymentData({ ...paymentData, date: newValue || dayjs() })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />

                  {/* Payment Method */}
                  <FormControl fullWidth>
                    <InputLabel>Hình thức thanh toán</InputLabel>
                    <Select
                      value={paymentData.method}
                      label="Hình thức thanh toán"
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, method: e.target.value as 'Transfer' | 'Cash' })
                      }
                    >
                      <MenuItem value="Transfer">Chuyển khoản</MenuItem>
                      <MenuItem value="Cash">Tiền mặt</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Note */}
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={3}
                    value={paymentData.note}
                    onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                    placeholder="Ví dụ: Thanh toán đợt 1, thanh toán theo hợp đồng..."
                  />
                </Stack>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setPaymentModalOpen(false)} sx={{ textTransform: 'none' }}>
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handlePaymentSubmit}
                disabled={
                  !selectedInvoice ||
                  paymentData.amount <= 0 ||
                  paymentData.amount > selectedInvoice.remainingAmount
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.24)',
                  backgroundColor: '#2e7d32',
                  '&:hover': {
                    backgroundColor: '#1b5e20',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.32)',
                  },
                }}
              >
                Xác nhận thanh toán
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
      </Box>
    </LocalizationProvider>
  )
}

export default DebtManagement
