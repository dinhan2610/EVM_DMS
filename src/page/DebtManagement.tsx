import { useState, useMemo, useCallback, useEffect } from 'react'
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
  CircularProgress,
  
  alpha,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PaymentIcon from '@mui/icons-material/Payment'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import { CustomerDebt, DebtInvoice, PaymentRecord, PAYMENT_METHODS } from '@/types/debt.types'
import { paymentService } from '@/services/paymentService'
import { debtService } from '@/services/debtService'
import { useAuthContext } from '@/context/useAuthContext'

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
  // Auth context
  const { user } = useAuthContext()
  
  // State - Data
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null)
  const [unpaidInvoices, setUnpaidInvoices] = useState<DebtInvoice[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
  
  // State - UI
  const [searchText, setSearchText] = useState('')
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'history'>('invoices')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<DebtInvoice | null>(null)
  
  // State - Form
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: dayjs() as Dayjs,
    method: PAYMENT_METHODS.BANK_TRANSFER,
    transactionCode: '',
    note: '',
  })
  
  // State - Feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // ==================== DATA FETCHING ====================
  
  /**
   * Fetch customer debt summary on mount
   */
  useEffect(() => {
    const fetchCustomerDebts = async () => {
      try {
        setIsLoading(true)
        const response = await debtService.getCustomerDebtSummary({
          PageIndex: 1,
          PageSize: 100, // Get all customers
          SortBy: 'totalDebt',
          SortOrder: 'desc',
        })
        
        // Defensive: Ensure data is an array
        const customerData = Array.isArray(response.data) ? response.data : []
        setCustomers(customerData)
        
        // Auto-select first customer if exists
        if (customerData.length > 0 && !selectedCustomer) {
          setSelectedCustomer(customerData[0])
        }
      } catch (error) {
        console.error('Failed to fetch customer debts:', error)
        setCustomers([]) // Set empty array on error
        setSnackbar({
          open: true,
          message: 'Không thể tải danh sách công nợ. Vui lòng thử lại.',
          severity: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomerDebts()
  }, []) // Only run once on mount

  /**
   * Fetch customer debt detail when selected customer changes
   */
  useEffect(() => {
    const fetchCustomerDebtDetail = async () => {
      if (!selectedCustomer) {
        setUnpaidInvoices([])
        setPaymentHistory([])
        return
      }

      try {
        setIsLoadingDetail(true)
        const response = await debtService.getCustomerDebtDetail(selectedCustomer.customerId)
        
        // Map backend response to frontend types
        const mappedInvoices: DebtInvoice[] = response.unpaidInvoices.map(inv => ({
          id: inv.invoiceId,
          invoiceNo: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount,
          paymentStatus: inv.paymentStatus,
          description: inv.description,
        }))

        const mappedPayments: PaymentRecord[] = response.paymentHistory.map(pay => ({
          id: pay.paymentId,
          invoiceId: pay.invoiceId,
          invoiceNo: pay.invoiceNumber,
          amount: pay.amount,
          paymentDate: pay.paymentDate,
          paymentMethod: pay.paymentMethod,
          transactionCode: pay.transactionCode || undefined,
          note: pay.note,
          userId: pay.userId,
          userName: pay.userName,
        }))

        setUnpaidInvoices(mappedInvoices)
        setPaymentHistory(mappedPayments)
      } catch (error) {
        console.error('Failed to fetch customer debt detail:', error)
        setSnackbar({
          open: true,
          message: 'Không thể tải chi tiết công nợ. Vui lòng thử lại.',
          severity: 'error',
        })
      } finally {
        setIsLoadingDetail(false)
      }
    }

    fetchCustomerDebtDetail()
  }, [selectedCustomer])

  /**
   * Refresh customer list after successful payment
   */
  const refreshCustomerList = useCallback(async () => {
    try {
      const response = await debtService.getCustomerDebtSummary({
        PageIndex: 1,
        PageSize: 100,
        SortBy: 'totalDebt',
        SortOrder: 'desc',
      })
      
      setCustomers(response.data)
      
      // Update selected customer data
      if (selectedCustomer) {
        const updatedCustomer = response.data.find(
          c => c.customerId === selectedCustomer.customerId
        )
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer)
        }
      }
    } catch (error) {
      console.error('Failed to refresh customer list:', error)
    }
  }, [selectedCustomer])

  /**
   * Refresh customer debt detail after successful payment
   */
  const refreshCustomerDetail = useCallback(async () => {
    if (!selectedCustomer) return

    try {
      const response = await debtService.getCustomerDebtDetail(selectedCustomer.customerId)
      
      const mappedInvoices: DebtInvoice[] = response.unpaidInvoices.map(inv => ({
        id: inv.invoiceId,
        invoiceNo: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        remainingAmount: inv.remainingAmount,
        paymentStatus: inv.paymentStatus,
        description: inv.description,
      }))

      const mappedPayments: PaymentRecord[] = response.paymentHistory.map(pay => ({
        id: pay.paymentId,
        invoiceId: pay.invoiceId,
        invoiceNo: pay.invoiceNumber,
        amount: pay.amount,
        paymentDate: pay.paymentDate,
        paymentMethod: pay.paymentMethod,
        transactionCode: pay.transactionCode || undefined,
        note: pay.note,
        userId: pay.userId,
        userName: pay.userName,
      }))

      setUnpaidInvoices(mappedInvoices)
      setPaymentHistory(mappedPayments)
    } catch (error) {
      console.error('Failed to refresh customer detail:', error)
    }
  }, [selectedCustomer])

  // ==================== COMPUTED VALUES ====================
  
  // Filtered customers based on search text
  const filteredCustomers = useMemo(() => {
    if (!searchText.trim()) return customers
    
    const searchLower = searchText.toLowerCase()
    return customers.filter((customer) =>
      customer.customerName.toLowerCase().includes(searchLower) ||
      customer.taxCode.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    )
  }, [customers, searchText])

  // ==================== EVENT HANDLERS ====================
  const handleCustomerClick = useCallback((customer: CustomerDebt) => {
    setSelectedCustomer(customer)
    setSelectedTab('invoices')
  }, [])

  const handlePaymentClick = useCallback((invoice: DebtInvoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      amount: invoice.remainingAmount,
      date: dayjs(),
      method: PAYMENT_METHODS.BANK_TRANSFER,
      transactionCode: '',
      note: '',
    })
    setPaymentModalOpen(true)
  }, [])

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedInvoice || !user) return

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

    setIsSubmitting(true)

    try {
      // Call API to create payment
      const paymentRequest = {
        invoiceId: selectedInvoice.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        transactionCode: paymentData.transactionCode || undefined,
        note: paymentData.note || undefined,
        paymentDate: paymentData.date.toISOString(),
        userId: parseInt(user.id), // Convert string to number
      }

      await paymentService.createPayment(paymentRequest)

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

      // ⭐ REFRESH DATA after successful payment
      await Promise.all([
        refreshCustomerList(),
        refreshCustomerDetail(),
      ])
      
    } catch (error) {
      console.error('Payment error:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi ghi nhận thanh toán. Vui lòng thử lại.',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedInvoice, paymentData, user, refreshCustomerList, refreshCustomerDetail])

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
        field: 'paymentMethod',
        headerName: 'Hình thức',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const method = params.value as string
          const methodLabels: Record<string, string> = {
            BankTransfer: 'Chuyển khoản',
            Cash: 'Tiền mặt',
            CreditCard: 'Thẻ tín dụng',
            DebitCard: 'Thẻ ghi nợ',
            EWallet: 'Ví điện tử',
            Check: 'Séc',
            Other: 'Khác',
          }
          return (
            <Chip
              label={methodLabels[method] || method}
              color={method === 'BankTransfer' ? 'primary' : 'default'}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            />
          )
        },
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
        field: 'userName',
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

          {/* Loading State */}
          {isLoading ? (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ color: '#999', mt: 2 }}>
                Đang tải danh sách công nợ...
              </Typography>
            </Paper>
          ) : customers.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ color: '#999', mb: 1 }}>
                Không có khách hàng nào có công nợ
              </Typography>
              <Typography variant="body2" sx={{ color: '#bbb' }}>
                Danh sách trống hoặc tất cả khách hàng đã thanh toán hết
              </Typography>
            </Paper>
          ) : (
            <>
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
              <FormControl size="small" sx={{ flex: 1 }} disabled={isLoading}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>
                  {isLoading ? 'Đang tải...' : 'Chọn khách hàng'}
                </InputLabel>
                <Select
                  value={selectedCustomer?.customerId || ''}
                  onChange={(e) => {
                    const customer = customers.find((c) => c.customerId === e.target.value)
                    if (customer) handleCustomerClick(customer)
                  }}
                  label={isLoading ? 'Đang tải...' : 'Chọn khách hàng'}
                  sx={{
                    backgroundColor: '#fafafa',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  {isLoading ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">Đang tải...</Typography>
                      </Box>
                    </MenuItem>
                  ) : filteredCustomers.length === 0 ? (
                    <MenuItem disabled>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        Không tìm thấy khách hàng
                      </Typography>
                    </MenuItem>
                  ) : (
                    filteredCustomers.map((customer) => (
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
                    ))
                  )}
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
                minHeight: 'calc(100vh - 240px)',
                maxHeight: 'calc(100vh - 240px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
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
                      {formatCurrency(paymentHistory.reduce((sum, payment) => sum + payment.amount, 0))}
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

                  <Box sx={{ 
                    flex: 1, 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0, // Important for flex children
                  }}>
                    {isLoadingDetail ? (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ color: '#999' }}>
                          Đang tải dữ liệu...
                        </Typography>
                      </Box>
                    ) : selectedTab === 'invoices' ? (
                      <Box sx={{ height: '100%', width: '100%' }}>
                        <DataGrid
                          rows={unpaidInvoices}
                          columns={invoiceColumns}
                          disableRowSelectionOnClick
                          hideFooter={unpaidInvoices.length <= 10}
                          loading={isLoadingDetail}
                          sx={{
                            border: 'none',
                            height: '100%',
                            width: '100%',
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
                      </Box>
                    ) : (
                      <Box sx={{ height: '100%', width: '100%' }}>
                        <DataGrid
                          rows={paymentHistory}
                          columns={historyColumns}
                          disableRowSelectionOnClick
                          hideFooter={paymentHistory.length <= 10}
                          loading={isLoadingDetail}
                          sx={{
                            border: 'none',
                            height: '100%',
                            width: '100%',
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
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </>
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
                        setPaymentData({ ...paymentData, method: e.target.value })
                      }
                    >
                      <MenuItem value={PAYMENT_METHODS.BANK_TRANSFER}>Chuyển khoản ngân hàng</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.CASH}>Tiền mặt</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.CREDIT_CARD}>Thẻ tín dụng</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.DEBIT_CARD}>Thẻ ghi nợ</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.EWALLET}>Ví điện tử</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.CHECK}>Séc</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.OTHER}>Khác</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Transaction Code */}
                  <TextField
                    fullWidth
                    label="Mã giao dịch"
                    value={paymentData.transactionCode}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionCode: e.target.value })}
                    placeholder="VD: TXN123456, REF789..."
                    helperText="Mã tham chiếu giao dịch ngân hàng (tùy chọn)"
                  />

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
              <Button 
                onClick={() => setPaymentModalOpen(false)} 
                sx={{ textTransform: 'none' }}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handlePaymentSubmit}
                disabled={
                  !selectedInvoice ||
                  paymentData.amount <= 0 ||
                  paymentData.amount > selectedInvoice.remainingAmount ||
                  isSubmitting
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
                {isSubmitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    <span>Đang xử lý...</span>
                  </Box>
                ) : (
                  'Xác nhận thanh toán'
                )}
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
