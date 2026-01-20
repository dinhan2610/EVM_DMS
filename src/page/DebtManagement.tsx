import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
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
import { usePageTitle } from '@/hooks/usePageTitle'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PaymentIcon from '@mui/icons-material/Payment'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import DebtFilter, { DebtFilterState } from '@/components/DebtFilter'
import { CustomerDebt, DebtInvoice, PaymentRecord, PAYMENT_METHODS } from '@/types/debt.types'
import { paymentService } from '@/services/paymentService'
import { debtService } from '@/services/debtService'
import { useAuthContext } from '@/context/useAuthContext'

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  // Handle null, undefined, or NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫'
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format number input with Vietnamese thousand separator (dot)
 * Example: 1000000 -> "1.000.000"
 */
const formatNumberInput = (value: string): string => {
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  
  // Add thousand separators (dots)
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Parse formatted input back to number
 * Example: "1.000.000" -> 1000000
 */
const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/\./g, '')
  return parseFloat(cleaned) || 0
}

const isOverdue = (dueDate: string): boolean => {
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

/**
 * Calculate payment status from amounts if backend doesn't provide it
 * This is a fallback function
 */
const calculatePaymentStatus = (
  totalAmount: number, 
  paidAmount: number, 
  remainingAmount: number
): DebtInvoice['paymentStatus'] => {
  if (remainingAmount === 0 || paidAmount === totalAmount) {
    return 'Paid'
  } else if (paidAmount > 0 && remainingAmount > 0) {
    return 'PartiallyPaid'
  } else {
    return 'Unpaid'
  }
}

/**
 * Get MUI Chip color based on payment status
 * 
 * Backend values (case-sensitive):
 * - "Unpaid" → default (gray)
 * - "PartiallyPaid" → warning (orange) 
 * - "Paid" → success (green)
 * - "Overdue" → error (red)
 * 
 * @param status Payment status from backend API
 * @returns MUI Chip color variant
 */
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

/**
 * Get Vietnamese label for payment status
 * 
 * Backend-aligned mapping:
 * - "Unpaid" → "Chưa Thanh toán"
 * - "PartiallyPaid" → "Trả một phần"
 * - "Paid" → "Đã thanh toán"
 * - "Overdue" → "Quá hạn"
 * 
 * @param status Payment status from backend API  
 * @returns Vietnamese display label
 */
const getPaymentStatusLabel = (status: DebtInvoice['paymentStatus']): string => {
  const labels = {
    Unpaid: 'Chưa Thanh toán',
    PartiallyPaid: 'Trả một phần',
    Paid: 'Đã thanh toán',
    Overdue: 'Quá hạn',
  }
  return labels[status]
}

// ==================== MAIN COMPONENT ====================

const DebtManagement = () => {
  usePageTitle('Quản lý công nợ')
  
  // Auth context
  const { user } = useAuthContext()
  
  // State - Data
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null)
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<{
    summary: {
      totalDebt: number;
      overdueDebt: number;
      totalPaid: number;
      invoiceCount: number;
      unpaidInvoiceCount: number;
      lastPaymentDate: string | null;
    };
  } | null>(null)
  // Note: Despite the backend field name 'unpaidInvoices', this should contain ALL invoices (Unpaid, PartiallyPaid, Paid)
  const [invoices, setInvoices] = useState<DebtInvoice[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
  
  // Pagination state for invoices and payments
  const [invoicePagination, setInvoicePagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })
  const [paymentPagination, setPaymentPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })
  
  // State - UI
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'history'>('invoices')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<DebtInvoice | null>(null)

  // State - Filters
  const [filters, setFilters] = useState<DebtFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    dueDateFrom: null,
    dueDateTo: null,
    paymentStatus: [],
    overdueOnly: false,
  })
  
  // State - Form
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: dayjs() as Dayjs,
    method: PAYMENT_METHODS.BANK_TRANSFER,
    transactionCode: '',
    note: '',
  })
  
  // State - Form Validation
  const [formErrors, setFormErrors] = useState({
    amount: '',
    date: '',
    method: '',
    transactionCode: '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Fetch customer debt detail when selected customer or pagination changes
   */
  useEffect(() => {
    const fetchCustomerDebtDetail = async () => {
      if (!selectedCustomer) {
        setInvoices([])
        setPaymentHistory([])
        setSelectedCustomerDetail(null)
        return
      }

      try {
        setIsLoadingDetail(true)
        
        // ✅ NEW: Use proper pagination parameters
        const response = await debtService.getCustomerDebtDetail(
          selectedCustomer.customerId,
          {
            InvoicePageSize: invoicePagination.pageSize,
            InvoicePageIndex: invoicePagination.pageIndex,
            PaymentPageSize: paymentPagination.pageSize,
            PaymentPageIndex: paymentPagination.pageIndex,
            SortBy: 'invoiceDate',
            SortOrder: 'desc',
          }
        )
        
        // 🔍 DEBUG: Check if backend now returns Paid invoices
        console.log('[DebtManagement] Raw backend response - invoice count:', response.invoices.length);
        console.log('[DebtManagement] Invoice payment statuses:', 
          response.invoices.map(inv => ({ 
            invoiceNo: inv.invoiceNumber, 
            status: inv.paymentStatus,
            remaining: inv.remainingAmount 
          }))
        );
        
        // ✅ FIXED: Backend now returns ALL invoices (including Paid) via 'invoices' field
        const mappedInvoices: DebtInvoice[] = response.invoices.map(inv => {
          // 🔧 FIX: Backend returns "Partially Paid" (with space), normalize to "PartiallyPaid"
          let normalizedStatus = inv.paymentStatus as string
          if (normalizedStatus === 'Partially Paid') {
            normalizedStatus = 'PartiallyPaid'
          }
          
          return {
            id: inv.invoiceId,
            invoiceNo: inv.invoiceNumber,
            invoiceStatusId: inv.invoiceStatusID,
            invoiceStatus: inv.invoiceStatus,
            invoiceDate: inv.invoiceDate,
            dueDate: inv.dueDate,
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            remainingAmount: inv.remainingAmount,
            paymentStatus: normalizedStatus as DebtInvoice['paymentStatus'],
            description: inv.description,
            isOverdue: inv.isOverdue,
          }
        })
        // Sort by invoiceDate descending (newest first)
        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
        
        // 🔍 DEBUG: Log payment statuses to verify ALL statuses are included
        console.log('[DebtManagement] Total invoices:', mappedInvoices.length);
        const breakdown = {
          unpaid: mappedInvoices.filter(i => i.paymentStatus === 'Unpaid').length,
          partiallyPaid: mappedInvoices.filter(i => i.paymentStatus === 'PartiallyPaid').length,
          paid: mappedInvoices.filter(i => i.paymentStatus === 'Paid').length,
          overdue: mappedInvoices.filter(i => i.paymentStatus === 'Overdue').length,
        };
        console.log('[DebtManagement] Payment status breakdown:', JSON.stringify(breakdown));

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
        
        setInvoices(mappedInvoices)
        setPaymentHistory(mappedPayments)
        
        // Store customer detail summary for header stats
        setSelectedCustomerDetail({
          summary: response.summary
        })
        
        // Update pagination state from API response
        if (response.invoicesPagination) {
          setInvoicePagination({
            pageIndex: response.invoicesPagination.pageIndex,
            pageSize: response.invoicesPagination.pageSize,
            totalCount: response.invoicesPagination.totalCount,
            totalPages: response.invoicesPagination.totalPages,
          })
        }
        if (response.paymentHistoryPagination) {
          setPaymentPagination({
            pageIndex: response.paymentHistoryPagination.pageIndex,
            pageSize: response.paymentHistoryPagination.pageSize,
            totalCount: response.paymentHistoryPagination.totalCount,
            totalPages: response.paymentHistoryPagination.totalPages,
          })
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer, invoicePagination.pageIndex, invoicePagination.pageSize, paymentPagination.pageIndex, paymentPagination.pageSize])

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
      // ✅ Use proper pagination (max 100 per backend limit)
      const response = await debtService.getCustomerDebtDetail(
        selectedCustomer.customerId,
        { 
          InvoicePageSize: invoicePagination.pageSize, 
          InvoicePageIndex: invoicePagination.pageIndex, 
          PaymentPageSize: paymentPagination.pageSize, 
          PaymentPageIndex: paymentPagination.pageIndex,
          SortBy: 'invoiceDate',
          SortOrder: 'desc',
        }
      )
      
      const mappedInvoices: DebtInvoice[] = response.invoices.map(inv => {
        // 🔧 FIX: Backend returns "Partially Paid" (with space), normalize to "PartiallyPaid"
        let normalizedStatus = inv.paymentStatus as string
        if (normalizedStatus === 'Partially Paid') {
          normalizedStatus = 'PartiallyPaid'
        }
        
        return {
          id: inv.invoiceId,
          invoiceNo: inv.invoiceNumber,
          invoiceStatusId: inv.invoiceStatusID,
          invoiceStatus: inv.invoiceStatus,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount,
          paymentStatus: normalizedStatus as DebtInvoice['paymentStatus'],
          description: inv.description,
          isOverdue: inv.isOverdue,
        }
      })
      // Sort by invoiceDate descending (newest first)
      .sort((a: DebtInvoice, b: DebtInvoice) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())

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
      // Sort by paymentDate descending (newest first)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

      setInvoices(mappedInvoices)
      setPaymentHistory(mappedPayments)
    } catch (error) {
      console.error('Failed to refresh customer detail:', error)
    }
  }, [selectedCustomer, invoicePagination.pageSize, invoicePagination.pageIndex, paymentPagination.pageSize, paymentPagination.pageIndex])

  // ==================== COMPUTED VALUES ====================
  
  // Filtered customers based on filters
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // 1. Search text filter
      if (filters.searchText?.trim()) {
        const searchLower = filters.searchText.toLowerCase()
        const matchesSearch =
          customer.customerName.toLowerCase().includes(searchLower) ||
          customer.taxCode.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // 2. Overdue only filter
      if (filters.overdueOnly && customer.overdueDebt <= 0) {
        return false
      }

      return true
    })
  }, [customers, filters])

  // Filtered invoices based on filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // 1. Invoice date range
      if (filters.dateFrom && dayjs(invoice.invoiceDate).isBefore(filters.dateFrom, 'day')) {
        return false
      }
      if (filters.dateTo && dayjs(invoice.invoiceDate).isAfter(filters.dateTo, 'day')) {
        return false
      }

      // 2. Due date range
      if (filters.dueDateFrom && dayjs(invoice.dueDate).isBefore(filters.dueDateFrom, 'day')) {
        return false
      }
      if (filters.dueDateTo && dayjs(invoice.dueDate).isAfter(filters.dueDateTo, 'day')) {
        return false
      }

      // 3. Payment status filter
      if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes('ALL')) {
        if (!filters.paymentStatus.includes(invoice.paymentStatus)) {
          return false
        }
      }

      // 4. Overdue only filter
      if (filters.overdueOnly && !invoice.isOverdue) {
        return false
      }

      return true
    })
  }, [invoices, filters])

  // ==================== FILTER HANDLERS ====================
  const handleFilterChange = useCallback((newFilters: DebtFilterState) => {
    setFilters(newFilters)
  }, [])

  const handleResetFilter = useCallback(() => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      dueDateFrom: null,
      dueDateTo: null,
      paymentStatus: [],
      overdueOnly: false,
    })
  }, [])

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
    // Reset validation errors
    setFormErrors({
      amount: '',
      date: '',
      method: '',
      transactionCode: '',
    })
    setPaymentModalOpen(true)
  }, []) // Empty deps OK - only using setters which are stable

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedInvoice || !user) return

    // Comprehensive validation for all required fields (except note)
    const errors = {
      amount: '',
      date: '',
      method: '',
      transactionCode: '',
    }

    let hasError = false

    // Validate amount (required)
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.amount = 'Vui lòng nhập số tiền thanh toán'
      hasError = true
    } else if (paymentData.amount > selectedInvoice.remainingAmount) {
      errors.amount = `Số tiền không được lớn hơn số nợ còn lại (${formatCurrency(selectedInvoice.remainingAmount)})`
      hasError = true
    }

    // Validate date (required)
    if (!paymentData.date || !paymentData.date.isValid()) {
      errors.date = 'Vui lòng chọn ngày thanh toán'
      hasError = true
    }

    // Validate payment method (required)
    if (!paymentData.method) {
      errors.method = 'Vui lòng chọn hình thức thanh toán'
      hasError = true
    }

    // Validate transaction code (required)
    if (!paymentData.transactionCode || paymentData.transactionCode.trim() === '') {
      errors.transactionCode = 'Vui lòng nhập mã giao dịch'
      hasError = true
    }

    // Update error state
    setFormErrors(errors)

    // If validation failed, show error notification
    if (hasError) {
      setSnackbar({
        open: true,
        message: '⚠️ Vui lòng điền đầy đủ thông tin bắt buộc',
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
        userId: parseInt(user.id),
      }

      const paymentResponse = await paymentService.createPayment(paymentRequest)

      // Check if invoice info is in response
      if (paymentResponse.invoice) {
        const statusText = paymentResponse.invoice.remainingAmount === 0
          ? 'Trả toàn bộ ✓'
          : 'Trả một phần'
        
        setSnackbar({
          open: true,
          message: `✅ ${statusText}\n💰 Số tiền: ${formatCurrency(paymentData.amount)}\n📊 Còn nợ: ${formatCurrency(paymentResponse.invoice.remainingAmount)}`,
          severity: paymentResponse.invoice.remainingAmount === 0 ? 'success' : 'info',
        })
      } else {
        // Fallback if invoice info not in response
        setSnackbar({
          open: true,
          message: `✅ Đã ghi nhận thanh toán thành công!\n💰 Số tiền: ${formatCurrency(paymentData.amount)}`,
          severity: 'success',
        })
      }

      // Close modal and reset
      setPaymentModalOpen(false)
      setSelectedInvoice(null)
      setPaymentData({
        amount: 0,
        date: dayjs(),
        method: PAYMENT_METHODS.BANK_TRANSFER,
        transactionCode: '',
        note: '',
      })
      setFormErrors({
        amount: '',
        date: '',
        method: '',
        transactionCode: '',
      })

      // Refresh data to show updated amounts
      await Promise.all([
        refreshCustomerList(),
        refreshCustomerDetail(),
      ])

    } catch (error) {
      console.error('❌ Payment failed:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể ghi nhận thanh toán',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedInvoice, paymentData, user, refreshCustomerList, refreshCustomerDetail]) // setFormErrors is stable, no need to include

  // DataGrid columns for invoices
  const invoiceColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'invoiceNo',
        headerName: 'Số hóa đơn',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const invoiceNo = params.value as string | null
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: invoiceNo ? '#1976d2' : '#999' }}>
                {invoiceNo || '(Chưa có số)'}
              </Typography>
            </Box>
          )
        },
      },
      {
        field: 'invoiceDate',
        headerName: 'Ngày HĐ',
        width: 100,
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
        headerName: 'Hạn TT',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const overdue = isOverdue(params.value as string)
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              {formatCurrency(params.value as number)}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'paidAmount',
        headerName: 'Đã trả',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#2e7d32' }}>
              {formatCurrency(params.value as number)}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'remainingAmount',
        headerName: 'Còn nợ',
        width: 180,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#d32f2f' }}>
              {formatCurrency(params.value as number)}
            </Typography>
          </Box>
        ),
      },
      
      {
        field: 'paymentStatus',
        headerName: 'Trạng thái',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value: unknown, row: DebtInvoice) => {
          // If backend doesn't provide status, calculate it
          return value || calculatePaymentStatus(row.totalAmount, row.paidAmount, row.remainingAmount)
        },
        renderCell: (params: GridRenderCellParams) => {
          const finalStatus = params.value as DebtInvoice['paymentStatus']
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Chip
                label={getPaymentStatusLabel(finalStatus)}
                color={getPaymentStatusColor(finalStatus)}
                size="small"
                sx={{ fontWeight: 500, fontSize: '0.7rem', minWidth: 90 }}
              />
            </Box>
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Thao tác',
        width: 90,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const invoice = params.row as DebtInvoice
          if (invoice.paymentStatus === 'Paid') return null
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                Quản lý Công nợ & Thu tiền
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Theo dõi dư nợ khách hàng và ghi nhận thanh toán
              </Typography>
            </Box>
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
            <Box>
              {/* Advanced Filter Component */}
              <DebtFilter
                onFilterChange={handleFilterChange}
                onReset={handleResetFilter}
                totalResults={customers.length}
                filteredResults={filteredCustomers.length}
              />

              {/* Customer Selection Dropdown */}
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
                <FormControl size="small" fullWidth disabled={isLoading}>
                  <InputLabel sx={{ fontSize: '0.875rem' }}>
                    {isLoading ? 'Đang tải...' : `Chọn khách hàng (${filteredCustomers.length})`}
                  </InputLabel>
                  <Select
                    value={selectedCustomer?.customerId || ''}
                    onChange={(e) => {
                      const customer = filteredCustomers.find((c) => c.customerId === e.target.value)
                      if (customer) handleCustomerClick(customer)
                    }}
                    label={isLoading ? 'Đang tải...' : `Chọn khách hàng (${filteredCustomers.length})`}
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
                          Không tìm thấy khách hàng phù hợp với bộ lọc
                        </Typography>
                      </MenuItem>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <MenuItem key={customer.customerId} value={customer.customerId}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem' }}>
                                {customer.customerName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                                MST: {customer.taxCode} • {customer.phone}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f', fontSize: '0.8rem' }}>
                                {formatCurrency(customer.totalDebt)}
                              </Typography>
                              {customer.overdueDebt > 0 && (
                                <Typography variant="caption" sx={{ color: '#ff9800', fontSize: '0.7rem' }}>
                                  Quá hạn: {formatCurrency(customer.overdueDebt)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Paper>

          {/* Main Content: Full Width */}
          {selectedCustomer && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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

                {/* KPI Inline - Professional */}
                <Stack 
                  direction="row" 
                  spacing={2.5} 
                  divider={<Box sx={{ width: '1.5px', height: 36, bgcolor: '#2c3e50', opacity: 0.8, borderRadius: '2px' }} />}
                  sx={{ pr: 1 }}
                >
                  <Box sx={{ textAlign: 'center', minWidth: 110 }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Tổng nợ
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: '1.2rem', mt: 0.5 }}>
                      {formatCurrency(selectedCustomer.totalDebt)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 110 }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Đã thanh toán
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32', fontSize: '1.2rem', mt: 0.5 }}>
                      {formatCurrency(selectedCustomerDetail?.summary.totalPaid ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 110 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Quá hạn
                      </Typography>
                      {selectedCustomer.overdueDebt > 0 && (
                        <WarningAmberIcon sx={{ fontSize: 13, color: '#ff9800' }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontSize: '1.2rem' }}>
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
                    mt: 2,
                    width: '100%',
                  }}>
                    {isLoadingDetail ? (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        minHeight: 400,
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ color: '#999' }}>
                          Đang tải dữ liệu...
                        </Typography>
                      </Box>
                    ) : selectedTab === 'invoices' ? (
                      <DataGrid
                        rows={filteredInvoices}
                        columns={invoiceColumns}
                        disableRowSelectionOnClick
                        loading={isLoadingDetail}
                        paginationMode="server"
                        rowCount={invoicePagination.totalCount}
                        paginationModel={{
                          page: invoicePagination.pageIndex - 1, // MUI uses 0-based, API uses 1-based
                          pageSize: invoicePagination.pageSize,
                        }}
                        onPaginationModelChange={(model) => {
                          setInvoicePagination(prev => ({
                            ...prev,
                            pageIndex: model.page + 1, // Convert back to 1-based
                            pageSize: model.pageSize,
                          }))
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
                        }}
                      />
                    ) : (
                        <DataGrid
                        rows={paymentHistory}
                        columns={historyColumns}
                        disableRowSelectionOnClick
                        loading={isLoadingDetail}
                        paginationMode="server"
                        rowCount={paymentPagination.totalCount}
                        paginationModel={{
                          page: paymentPagination.pageIndex - 1, // MUI uses 0-based, API uses 1-based
                          pageSize: paymentPagination.pageSize,
                        }}
                        onPaginationModelChange={(model) => {
                          setPaymentPagination(prev => ({
                            ...prev,
                            pageIndex: model.page + 1, // Convert back to 1-based
                            pageSize: model.pageSize,
                          }))
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

                  {/* Payment Amount with VN formatting */}
                  <TextField
                    fullWidth
                    required
                    label="Số tiền thanh toán"
                    type="text"
                    value={paymentData.amount ? formatNumberInput(paymentData.amount.toString()) : ''}
                    onChange={(e) => {
                      const parsedAmount = parseFormattedNumber(e.target.value)
                      setPaymentData({ ...paymentData, amount: parsedAmount })
                      // Clear error on change
                      if (formErrors.amount) {
                        setFormErrors({ ...formErrors, amount: '' })
                      }
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                    }}
                    helperText={
                      formErrors.amount ||
                      (paymentData.amount > 0 && paymentData.amount < selectedInvoice.remainingAmount
                        ? '⚠️ Thanh toán một phần - Hóa đơn sẽ chuyển sang trạng thái "Trả một phần"'
                        : paymentData.amount === selectedInvoice.remainingAmount
                        ? '✓ Thanh toán đầy đủ - Hóa đơn sẽ chuyển sang trạng thái "Trả toàn bộ"'
                        : 'Ví dụ: 1.000.000 (dùng dấu chấm phân cách nghìn)')
                    }
                    error={!!formErrors.amount || (paymentData.amount > selectedInvoice.remainingAmount)}
                    placeholder="Ví dụ: 1.000.000"
                  />

                  {/* Payment Date */}
                  <DatePicker
                    label="Ngày thanh toán"
                    value={paymentData.date}
                    onChange={(newValue) => {
                      setPaymentData({ ...paymentData, date: newValue || dayjs() })
                      // Clear error on change
                      if (formErrors.date) {
                        setFormErrors({ ...formErrors, date: '' })
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.date,
                        helperText: formErrors.date || 'Chọn ngày thực hiện thanh toán',
                      },
                    }}
                  />

                  {/* Payment Method */}
                  <FormControl fullWidth required error={!!formErrors.method}>
                    <InputLabel>Hình thức thanh toán</InputLabel>
                    <Select
                      value={paymentData.method}
                      label="Hình thức thanh toán"
                      onChange={(e) => {
                        setPaymentData({ ...paymentData, method: e.target.value })
                        // Clear error on change
                        if (formErrors.method) {
                          setFormErrors({ ...formErrors, method: '' })
                        }
                      }}
                    >
                      <MenuItem value={PAYMENT_METHODS.BANK_TRANSFER}>Chuyển khoản ngân hàng</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.CASH}>Tiền mặt</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.CREDIT_CARD}>Thẻ tín dụng</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.DEBIT_CARD}>Thẻ ghi nợ</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.EWALLET}>Ví điện tử</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.CHECK}>Séc</MenuItem>
                      <MenuItem value={PAYMENT_METHODS.OTHER}>Khác</MenuItem>
                    </Select>
                    {formErrors.method && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, ml: 1.75 }}>
                        {formErrors.method}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Transaction Code */}
                  <TextField
                    fullWidth
                    required
                    label="Mã giao dịch"
                    value={paymentData.transactionCode}
                    onChange={(e) => {
                      setPaymentData({ ...paymentData, transactionCode: e.target.value })
                      // Clear error on change
                      if (formErrors.transactionCode) {
                        setFormErrors({ ...formErrors, transactionCode: '' })
                      }
                    }}
                    placeholder="VD: TXN123456, REF789..."
                    helperText={formErrors.transactionCode || 'Mã tham chiếu giao dịch ngân hàng, mã chuyển khoản'}
                    error={!!formErrors.transactionCode}
                  />

                  {/* Note (Optional) */}
                  <TextField
                    fullWidth
                    label="Ghi chú (Tùy chọn)"
                    multiline
                    rows={3}
                    value={paymentData.note}
                    onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                    placeholder="Ví dụ: Thanh toán đợt 1, thanh toán theo hợp đồng..."
                    helperText="Thông tin bổ sung về khoản thanh toán này (không bắt buộc)"
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
                disabled={isSubmitting}
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
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default DebtManagement
