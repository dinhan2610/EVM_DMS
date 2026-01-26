import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Button,
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
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PaymentIcon from '@mui/icons-material/Payment'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import DebtFilter, { DebtFilterState } from '@/components/DebtFilter'
import { CustomerDebt, DebtInvoice, PaymentRecord, PAYMENT_METHODS } from '@/types/debt.types'
import { paymentService } from '@/services/paymentService'
import { debtService } from '@/services/debtService'
import { useAuthContext } from '@/context/useAuthContext'
import { getCustomersBySaleId } from '@/services/customerService'
import { USER_ROLES } from '@/constants/roles'

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
 * ✅ UPDATED: Hỗ trợ số âm (negative numbers)
 * Example: 1000000 -> "1.000.000"
 * Example: -1000000 -> "-1.000.000"
 */
const formatNumberInput = (value: string): string => {
  // Check for negative sign
  const isNegative = value.startsWith('-')

  // Remove all non-digit characters (keep only digits)
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return isNegative ? '-' : ''

  // Add thousand separators (dots)
  const formatted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Add negative sign back if present
  return isNegative ? `-${formatted}` : formatted
}

/**
 * Parse formatted input back to number
 * ✅ UPDATED: Hỗ trợ số âm (negative numbers)
 * Example: "1.000.000" -> 1000000
 * Example: "-1.000.000" -> -1000000
 */
const parseFormattedNumber = (value: string): number => {
  // Keep negative sign, remove dots
  const cleaned = value.replace(/\./g, '')
  const parsed = parseFloat(cleaned)

  // Return 0 if NaN, otherwise return parsed value (supports negative)
  return isNaN(parsed) ? 0 : parsed
}

const isOverdue = (dueDate: string): boolean => {
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

/**
 * Calculate payment status from amounts if backend doesn't provide it
 * This is a fallback function
 */
const calculatePaymentStatus = (totalAmount: number, paidAmount: number, remainingAmount: number): DebtInvoice['paymentStatus'] => {
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
const getPaymentStatusColor = (status: DebtInvoice['paymentStatus']): 'default' | 'warning' | 'success' | 'error' => {
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

  // Navigation
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Auth context
  const { user } = useAuthContext()

  // ✅ Read customerID from URL params (?customerId=X)
  const urlCustomerId = searchParams.get('customerId')

  // State - Data
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null)
  // ✅ NEW: Month/Year filter for monthly debt report
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year())
  // ✅ NEW: Monthly debt summary statistics
  const [monthlySummary, setMonthlySummary] = useState<{
    totalReceivable: number
    totalPaid: number
    totalRemaining: number
    totalOverdue: number
  } | null>(null)
  // Note: Despite the backend field name 'unpaidInvoices', this should contain ALL invoices (Unpaid, PartiallyPaid, Paid)
  const [invoices, setInvoices] = useState<DebtInvoice[]>([])

  // Pagination state for invoices
  const [invoicePagination, setInvoicePagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  // State - UI
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<DebtInvoice | null>(null)
  const [selectedInvoicePayments] = useState<PaymentRecord[]>([]) // Lịch sử thanh toán của hoá đơn (kept for future use)

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
    method: PAYMENT_METHODS.BANK_TRANSFER,
    transactionCode: '',
    note: '',
  })

  // State - Form Validation
  const [formErrors, setFormErrors] = useState({
    amount: '',
    method: '',
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
   * ✅ UPDATED: Filter by saleId for Sales role, filter by customerId from URL params
   */
  useEffect(() => {
    const fetchCustomerDebts = async () => {
      try {
        setIsLoading(true)

        // ✅ Step 1: Get allowed customer IDs for Sales role
        let allowedCustomerIds: number[] | null = null

        if (user?.role === USER_ROLES.SALES && user?.id) {
          console.log('👤 [Debt - Sales Filter] Role:', user.role, 'User ID:', user.id)
          console.log('📍 API Call: GET /api/Customer?saleId=' + user.id)

          try {
            const saleCustomers = await getCustomersBySaleId(Number(user.id))
            console.log('📊 [Debt - Sales Filter] API returned:', saleCustomers.length, 'customers')

            // 🔥 CRITICAL: Backend bug - filter client-side
            // 💡 DEBT MANAGEMENT: Hiển thị TẤT CẢ customers (kể cả inactive) vì cần xem công nợ lịch sử
            const filteredCustomers = saleCustomers.filter((c) => c.saleID === Number(user.id))

            console.log('🔍 [Debt - Client Filter] Before:', saleCustomers.length, 'customers')
            console.log('🔍 [Debt - Client Filter] After:', filteredCustomers.length, 'customers')
            console.log('⚠️ [Debt - Backend Bug] Filtered out:', saleCustomers.length - filteredCustomers.length, 'customers (wrong saleID)')
            console.log('💡 [Debt Logic] Including inactive customers - need to view historical debt')

            if (filteredCustomers.length < saleCustomers.length) {
              console.warn('🚨 Backend API bug: Returning customers with saleID !=', user.id)
              console.warn(
                '🐛 Wrong customers:',
                saleCustomers
                  .filter((c) => c.saleID !== Number(user.id))
                  .map((c) => ({
                    customerID: c.customerID,
                    name: c.customerName,
                    saleID: c.saleID,
                  })),
              )
            }

            allowedCustomerIds = filteredCustomers.map((c) => c.customerID)

            console.log('✅ [Debt - Sales Filter] Allowed customer IDs:', allowedCustomerIds)
            console.log(
              '🎯 [Debt - Sales Filter] Customer names:',
              filteredCustomers.map((c) => c.customerName),
            )
          } catch (error) {
            console.error('❌ Failed to fetch sales customers:', error)
            // Continue with empty list - will show no customers
            allowedCustomerIds = []
          }
        }

        // ✅ Step 2: Fetch debt summary
        const response = await debtService.getCustomerDebtSummary({
          PageIndex: 1,
          PageSize: 100, // Get all customers
          SortBy: 'totalDebt',
          SortOrder: 'desc',
        })

        // Defensive: Ensure data is an array
        let customerData = Array.isArray(response.data) ? response.data : []
        console.log('📊 [Debt Summary] Total customers with debt:', customerData.length)

        // ✅ Step 3: Filter by allowedCustomerIds if Sales role
        if (allowedCustomerIds !== null) {
          const beforeFilter = customerData.length
          customerData = customerData.filter((c) => allowedCustomerIds!.includes(c.customerId))
          console.log(`🔒 [Debt - Security Filter] Sales can only see their customers`)
          console.log(`🔍 [Debt - Filter Result] Before: ${beforeFilter}, After: ${customerData.length}`)
          console.log(
            `✅ [Debt - Filtered] Customer IDs:`,
            customerData.map((c) => c.customerId),
          )
          console.log(
            `✅ [Debt - Filtered] Customer Names:`,
            customerData.map((c) => c.customerName),
          )
        }

        // ✅ Step 4: Filter by customerId from URL if provided
        let filteredCustomers = customerData
        if (urlCustomerId) {
          const targetId = Number(urlCustomerId)
          filteredCustomers = customerData.filter((c) => c.customerId === targetId)
          console.log(`🔍 Filtered customers by URL customerId=${targetId}:`, filteredCustomers.length)
        }

        setCustomers(filteredCustomers)

        // Auto-select first customer if exists
        if (filteredCustomers.length > 0 && !selectedCustomer) {
          setSelectedCustomer(filteredCustomers[0])
          console.log('✅ Auto-selected customer:', filteredCustomers[0].customerName)
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
  }, [urlCustomerId, user?.id, user?.role])

  /**
   * Fetch customer debt detail when selected customer, month/year, or pagination changes
   * ✅ UPDATED: Use paymentService.getMonthlyDebt() for better performance and summary statistics
   */
  useEffect(() => {
    const fetchCustomerDebtDetail = async () => {
      if (!selectedCustomer) {
        setInvoices([])
        setMonthlySummary(null)
        return
      }

      try {
        setIsLoadingDetail(true)

        // ✅ NEW: Use paymentService.getMonthlyDebt() to get summary + invoices in one call
        const monthlyDebt = await paymentService.getMonthlyDebt(selectedMonth, selectedYear, selectedCustomer.customerId)

        // ✅ Store summary statistics
        setMonthlySummary({
          totalReceivable: monthlyDebt.summary.totalReceivable,
          totalPaid: monthlyDebt.summary.totalPaid,
          totalRemaining: monthlyDebt.summary.totalRemaining,
          totalOverdue: monthlyDebt.summary.totalOverdue,
        })

        console.log('[DebtManagement] Monthly debt summary:', monthlyDebt.summary)
        console.log('[DebtManagement] Invoice count:', monthlyDebt.invoices.items.length)

        // ✅ Map invoices from monthly debt API response
        const mappedInvoices: DebtInvoice[] = monthlyDebt.invoices.items
          .map((inv) => {
            // 🔍 DEBUG: Log raw status from API
            console.log(
              `[Invoice ${inv.invoiceId}] Raw status from API:`,
              inv.status,
              '| Remaining:',
              inv.remainingAmount,
              '| Overdue:',
              inv.overdueAmount,
            )

            // ✅ Normalize payment status from API (handle all possible variations)
            let normalizedStatus: DebtInvoice['paymentStatus']
            const statusLower = (inv.status || '').toLowerCase().replace(/\s+/g, '')

            if (statusLower === 'paid' || statusLower === 'full' || statusLower === 'fullypaid') {
              normalizedStatus = 'Paid'
            } else if (statusLower === 'partiallypaid' || statusLower === 'partially' || statusLower === 'partial') {
              normalizedStatus = 'PartiallyPaid'
            } else if (statusLower === 'overdue') {
              normalizedStatus = 'Overdue'
            } else if (statusLower === 'unpaid' || statusLower === 'notpaid') {
              normalizedStatus = 'Unpaid'
            } else {
              // Fallback: Calculate from amounts if status is unknown
              console.warn(`[Invoice ${inv.invoiceId}] Unknown status: "${inv.status}", calculating from amounts...`)
              normalizedStatus = calculatePaymentStatus(inv.totalAmount, inv.paidAmount, inv.remainingAmount)
            }

            console.log(`[Invoice ${inv.invoiceId}] Normalized status:`, normalizedStatus)

            return {
              id: inv.invoiceId,
              invoiceId: inv.invoiceId, // ✅ Add invoiceId for navigation
              invoiceNo: String(inv.invoiceId), // Use invoiceId as invoice number
              invoiceStatusId: 0, // Not provided by monthly debt API
              invoiceStatus: inv.status, // Keep original status string
              invoiceDate: inv.invoiceDate,
              dueDate: inv.dueDate || inv.invoiceDate, // Fallback to invoiceDate if dueDate is null
              totalAmount: inv.totalAmount,
              paidAmount: inv.paidAmount,
              remainingAmount: inv.remainingAmount,
              paymentStatus: normalizedStatus, // ✅ Use normalized status
              description: `Khách hàng: ${inv.customerName}`,
              isOverdue: inv.overdueAmount > 0,
            }
          })
          .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())

        // 🔍 DEBUG: Log payment status breakdown
        const statusBreakdown = {
          Paid: mappedInvoices.filter((i) => i.paymentStatus === 'Paid').length,
          PartiallyPaid: mappedInvoices.filter((i) => i.paymentStatus === 'PartiallyPaid').length,
          Unpaid: mappedInvoices.filter((i) => i.paymentStatus === 'Unpaid').length,
          Overdue: mappedInvoices.filter((i) => i.paymentStatus === 'Overdue').length,
        }
        console.log('[DebtManagement] Payment status breakdown:', statusBreakdown)

        console.log('[DebtManagement] Mapped invoices:', mappedInvoices.length)

        setInvoices(mappedInvoices)

        // ✅ Update invoice pagination from monthly debt API
        setInvoicePagination({
          pageIndex: monthlyDebt.invoices.pageIndex,
          pageSize: invoicePagination.pageSize, // Keep current pageSize
          totalCount: monthlyDebt.invoices.totalCount,
          totalPages: monthlyDebt.invoices.totalPages,
        })
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
  }, [selectedCustomer, selectedMonth, selectedYear, invoicePagination.pageIndex, invoicePagination.pageSize])

  // 🔥 SignalR Realtime Updates
  useSignalR({
    onInvoiceChanged: (payload) => {
      console.log('📨 [DebtManagement] InvoiceChanged event:', payload)

      // Reload customer list khi có invoice/payment thay đổi
      if (selectedCustomer) {
        console.log('🔄 [DebtManagement] Refreshing customer debt detail...')
        // Trigger re-fetch bằng cách update refreshTrigger hoặc reload lại useEffect
        setSelectedCustomer({ ...selectedCustomer }) // Force re-render
      }
    },
  })

  // Resync data khi SignalR reconnect
  useSignalRReconnect(() => {
    console.log('🔄 [DebtManagement] SignalR reconnected, resyncing...')
    if (selectedCustomer) {
      setSelectedCustomer({ ...selectedCustomer }) // Force reload
    }
  })

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
        const updatedCustomer = response.data.find((c) => c.customerId === selectedCustomer.customerId)
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
   * ✅ UPDATED: Use paymentService.getMonthlyDebt() same as main fetch
   */
  const refreshCustomerDetail = useCallback(async () => {
    if (!selectedCustomer) return

    try {
      // ✅ Use paymentService.getMonthlyDebt() for consistency
      const monthlyDebt = await paymentService.getMonthlyDebt(selectedMonth, selectedYear, selectedCustomer.customerId)

      // ✅ Store summary statistics
      setMonthlySummary({
        totalReceivable: monthlyDebt.summary.totalReceivable,
        totalPaid: monthlyDebt.summary.totalPaid,
        totalRemaining: monthlyDebt.summary.totalRemaining,
        totalOverdue: monthlyDebt.summary.totalOverdue,
      })

      // ✅ Map invoices with same normalization logic
      const mappedInvoices: DebtInvoice[] = monthlyDebt.invoices.items
        .map((inv) => {
          // Normalize payment status from API (handle all possible variations)
          let normalizedStatus: DebtInvoice['paymentStatus']
          const statusLower = (inv.status || '').toLowerCase().replace(/\\s+/g, '')

          if (statusLower === 'paid' || statusLower === 'full' || statusLower === 'fullypaid') {
            normalizedStatus = 'Paid'
          } else if (statusLower === 'partiallypaid' || statusLower === 'partially' || statusLower === 'partial') {
            normalizedStatus = 'PartiallyPaid'
          } else if (statusLower === 'overdue') {
            normalizedStatus = 'Overdue'
          } else if (statusLower === 'unpaid' || statusLower === 'notpaid') {
            normalizedStatus = 'Unpaid'
          } else {
            // Fallback: Calculate from amounts if status is unknown
            normalizedStatus = calculatePaymentStatus(inv.totalAmount, inv.paidAmount, inv.remainingAmount)
          }

          return {
            id: inv.invoiceId,
            invoiceId: inv.invoiceId, // ✅ Add invoiceId for navigation
            invoiceNo: String(inv.invoiceId),
            invoiceStatusId: 0,
            invoiceStatus: inv.status,
            invoiceDate: inv.invoiceDate,
            dueDate: inv.dueDate || inv.invoiceDate,
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            remainingAmount: inv.remainingAmount,
            paymentStatus: normalizedStatus,
            description: `Khách hàng: ${inv.customerName}`,
            isOverdue: inv.overdueAmount > 0,
          }
        })
        .sort((a: DebtInvoice, b: DebtInvoice) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())

      setInvoices(mappedInvoices)
    } catch (error) {
      console.error('Failed to refresh customer detail:', error)
    }
  }, [selectedCustomer, selectedMonth, selectedYear])

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
  }, [])

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

    // ✅ UPDATED: Validate amount (chỉ check required, cho phép số âm và số dương)
    // Backend hỗ trợ xử lý số âm (hoàn tiền/điều chỉnh giảm)
    if (paymentData.amount === undefined || paymentData.amount === null || paymentData.amount === 0) {
      errors.amount = 'Vui lòng nhập số tiền thanh toán'
      hasError = true
    }
    // ✅ REMOVED: Không còn giới hạn amount <= 0 hoặc amount > remainingAmount

    // Validate payment method (required)
    if (!paymentData.method) {
      errors.method = 'Vui lòng chọn hình thức thanh toán'
      hasError = true
    }

    // ✅ UPDATED: Transaction code is now optional (not required by API)
    // Removed validation

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
        paymentDate: dayjs().toISOString(), // ✅ AUTO - Use today's date
        userId: parseInt(user.id),
      }

      const paymentResponse = await paymentService.createPayment(paymentRequest)

      // ✅ NEW: Display remainingAmount from API response
      const remainingAmount = paymentResponse.remainingAmount ?? paymentResponse.invoice?.remainingAmount ?? 0
      const isPaidFull = remainingAmount === 0
      const statusText = isPaidFull ? 'Trả toàn bộ ✓' : 'Trả một phần'
      const statusIcon = isPaidFull ? '✅' : '💰'

      setSnackbar({
        open: true,
        message: `${statusIcon} ${statusText}\n💰 Số tiền thanh toán: ${formatCurrency(paymentData.amount)}\n📊 Còn lại: ${formatCurrency(remainingAmount)}`,
        severity: isPaidFull ? 'success' : 'info',
      })

      // Close modal and reset
      setPaymentModalOpen(false)
      setSelectedInvoice(null)
      setPaymentData({
        amount: 0,
        method: PAYMENT_METHODS.BANK_TRANSFER,
        transactionCode: '',
        note: '',
      })
      setFormErrors({
        amount: '',
        method: '',
      })

      // Refresh data to show updated amounts
      await Promise.all([refreshCustomerList(), refreshCustomerDetail()])
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

  /**
   * Handle invoice row click - Navigate to invoice detail page
   * ✅ Click on invoice row to view invoice detail
   */
  const handleInvoiceRowClick = useCallback(
    (invoiceId: number) => {
      if (!invoiceId) {
        console.warn('[DebtManagement] Cannot navigate: invoiceId is missing')
        return
      }
      console.log(`[DebtManagement] 🔗 Navigating to invoice detail: /invoices/${invoiceId}`)
      navigate(`/invoices/${invoiceId}`)
    },
    [navigate],
  )

  // DataGrid columns for invoices
  const invoiceColumns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: 'invoiceNo',
        headerName: 'Số hóa đơn',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const invoiceNo = params.value as string | null
          const invoice = params.row as DebtInvoice
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                cursor: invoice.invoiceId ? 'pointer' : 'default',
              }}
              onClick={(e) => {
                if (invoice.invoiceId) {
                  e.stopPropagation() // Prevent row selection
                  handleInvoiceRowClick(invoice.invoiceId)
                }
              }}>
              <Tooltip title={invoice.invoiceId ? 'Click để xem chi tiết hóa đơn' : 'Chưa có số hóa đơn'} arrow>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: invoiceNo ? '#1976d2' : '#999',
                    textDecoration: invoice.invoiceId ? 'underline' : 'none',
                    '&:hover': invoice.invoiceId
                      ? {
                          color: '#1565c0',
                          textDecoration: 'underline',
                        }
                      : {},
                  }}>
                  {invoiceNo || '(Chưa có số)'}
                </Typography>
              </Tooltip>
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
                }}>
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
        renderCell: (params: GridRenderCellParams) => {
          // ✅ Use paymentStatus directly from API (already normalized in mapping)
          const status = params.value as DebtInvoice['paymentStatus']

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Chip
                label={getPaymentStatusLabel(status)}
                color={getPaymentStatusColor(status)}
                size="small"
                sx={{ fontWeight: 500, fontSize: '0.7rem', minWidth: 90 }}
              />
            </Box>
          )
        },
      },
    ]

    return baseColumns
  }, [handleInvoiceRowClick])

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
              }}>
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
              }}>
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
                }}>
                <FormControl size="small" fullWidth disabled={isLoading}>
                  <InputLabel sx={{ fontSize: '0.875rem' }}>{isLoading ? 'Đang tải...' : `Chọn khách hàng (${filteredCustomers.length})`}</InputLabel>
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
                    }}>
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
                  }}>
                  {/* ✅ NEW: Month/Year Filter */}
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', fontSize: '0.8125rem' }}>
                      Kỳ báo cáo:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Tháng</InputLabel>
                      <Select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value as number)}
                        label="Tháng"
                        sx={{ backgroundColor: '#fff' }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <MenuItem key={month} value={month}>
                            Tháng {month}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Năm</InputLabel>
                      <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value as number)}
                        label="Năm"
                        sx={{ backgroundColor: '#fff' }}>
                        {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ ml: 'auto' }}>
                      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                        Dữ liệu tháng {selectedMonth}/{selectedYear}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Customer Info & KPI - Optimized with Monthly API Data */}
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2.5,
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 3,
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

                    {/* ✅ OPTIMIZED: KPI from Monthly API (monthlySummary) */}
                    <Stack
                      direction="row"
                      spacing={2.5}
                      divider={<Box sx={{ width: '1.5px', height: 36, bgcolor: '#2c3e50', opacity: 0.8, borderRadius: '2px' }} />}
                      sx={{ pr: 1 }}>
                      <Box sx={{ textAlign: 'center', minWidth: 110 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Tổng nợ
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: '1.2rem', mt: 0.5 }}>
                          {formatCurrency(monthlySummary?.totalRemaining ?? 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: 110 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Đã thanh toán
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32', fontSize: '1.2rem', mt: 0.5 }}>
                          {formatCurrency(monthlySummary?.totalPaid ?? 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: 110 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Quá hạn
                          </Typography>
                          {(monthlySummary?.totalOverdue ?? 0) > 0 && <WarningAmberIcon sx={{ fontSize: 13, color: '#ff9800' }} />}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontSize: '1.2rem' }}>
                          {formatCurrency(monthlySummary?.totalOverdue ?? 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Invoice List Header */}
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      backgroundColor: '#fafafa',
                      borderBottom: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}>
                    <PaymentIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                      Hóa đơn chưa thanh toán
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      width: '100%',
                      px: 2.5,
                    }}>
                    {isLoadingDetail ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 400,
                          flexDirection: 'column',
                          gap: 2,
                        }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ color: '#999' }}>
                          Đang tải dữ liệu...
                        </Typography>
                      </Box>
                    ) : (
                      <DataGrid
                        rows={filteredInvoices}
                        columns={invoiceColumns}
                        disableRowSelectionOnClick
                        loading={isLoadingDetail}
                        paginationMode="server"
                        onRowClick={(params) => {
                          const invoice = params.row as DebtInvoice
                          if (invoice.invoiceId) {
                            handleInvoiceRowClick(invoice.invoiceId)
                          }
                        }}
                        rowCount={invoicePagination.totalCount}
                        paginationModel={{
                          page: invoicePagination.pageIndex - 1, // MUI uses 0-based, API uses 1-based
                          pageSize: invoicePagination.pageSize,
                        }}
                        onPaginationModelChange={(model) => {
                          setInvoicePagination((prev) => ({
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
                          '& .MuiDataGrid-row': {
                            cursor: 'pointer',
                          },
                          '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#f8f9fa',
                          },
                          '& .MuiDataGrid-footerContainer': {
                            borderTop: '2px solid #e0e0e0',
                            backgroundColor: '#fafafa',
                            minHeight: '56px',
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          },
                          '& .MuiTablePagination-root': {
                            overflow: 'visible',
                          },
                          '& .MuiTablePagination-toolbar': {
                            minHeight: '56px',
                            paddingLeft: '16px',
                            paddingRight: '8px',
                            display: 'flex',
                            alignItems: 'center',
                          },
                          '& .MuiTablePagination-selectLabel': {
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                          },
                          '& .MuiTablePagination-displayedRows': {
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                          },
                          '& .MuiTablePagination-select': {
                            display: 'flex',
                            alignItems: 'center',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                          },
                          '& .MuiTablePagination-actions': {
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '12px',
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
                }}>
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

                      {/* ✅ NEW: Payment History for this Invoice */}
                      {selectedInvoicePayments.length > 0 && (
                        <Alert severity="success" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            📜 Lịch sử thanh toán ({selectedInvoicePayments.length} lần):
                          </Typography>
                          <Stack spacing={0.5} sx={{ maxHeight: 120, overflowY: 'auto' }}>
                            {selectedInvoicePayments.map((payment, index) => (
                              <Box key={payment.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {index + 1}. {dayjs(payment.paymentDate).format('DD/MM/YYYY')} - {payment.paymentMethod}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                  {formatCurrency(payment.amount)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Alert>
                      )}

                      {/* ✅ UPDATED: Payment Amount with VN formatting - Hỗ trợ số âm */}
                      <Box>
                        <TextField
                          fullWidth
                          required
                          label="Số tiền thanh toán"
                          type="text"
                          value={paymentData.amount !== 0 ? formatNumberInput(paymentData.amount.toString()) : ''}
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
                          error={!!formErrors.amount}
                          placeholder="Ví dụ: 1.000.000 (Số âm: -500.000 cho hoàn tiền)"
                          helperText={formErrors.amount || '💡 Số dương: Thanh toán thêm | Số âm: Hoàn tiền/Điều chỉnh giảm'}
                        />
                      </Box>

                      {/* Payment Method - Simplified to common options */}
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
                          }}>
                          <MenuItem value={PAYMENT_METHODS.BANK_TRANSFER}>🏦 Chuyển khoản ngân hàng</MenuItem>
                          <MenuItem value={PAYMENT_METHODS.CASH}>💵 Tiền mặt</MenuItem>
                          <MenuItem value={PAYMENT_METHODS.EWALLET}>📱 Ví điện tử (Momo, ZaloPay...)</MenuItem>
                          <MenuItem value={PAYMENT_METHODS.OTHER}>📋 Khác</MenuItem>
                        </Select>
                        {formErrors.method && (
                          <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, ml: 1.75 }}>
                            {formErrors.method}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Transaction Code - OPTIONAL */}
                      <TextField
                        fullWidth
                        label="Mã giao dịch (Tùy chọn)"
                        value={paymentData.transactionCode}
                        onChange={(e) => {
                          setPaymentData({ ...paymentData, transactionCode: e.target.value })
                        }}
                        placeholder="VD: TXN123456, REF789..."
                        helperText="Mã tham chiếu giao dịch ngân hàng, mã chuyển khoản (không bắt buộc)"
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
                  <Button onClick={() => setPaymentModalOpen(false)} sx={{ textTransform: 'none' }} disabled={isSubmitting}>
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
                    }}>
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
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
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
