import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Zoom,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import HistoryIcon from '@mui/icons-material/History'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { usePageTitle } from '@/hooks/usePageTitle'
import EmailIcon from '@mui/icons-material/Email'
import SendIcon from '@mui/icons-material/Send'
import PaymentIcon from '@mui/icons-material/Payment'
import StatementFilter, { StatementFilterState } from '@/components/StatementFilter'
import {
  getStatementStatusColor,
  getStatementStatusLabel,
  type StatementStatus,
} from '@/constants/statementStatus'
import type { StatementListItem } from '@/types/statement.types'
import { 
  fetchStatements, 
  exportStatementPDF,
  sendStatementEmail,
  sendDebtReminder,
  createStatementPayment,
  getStatementPayments,
  type CreateStatementPaymentRequest,
  type StatementPaymentRecord,
} from '@/services/statementService'
import CreateStatementModal from '@/components/CreateStatementModal'
import StatementPaymentModal, { 
  type StatementPaymentFormData,
} from '@/components/StatementPaymentModal'
import StatementPaymentHistoryModal from '@/components/StatementPaymentHistoryModal'
import { useAuthContext } from '@/context/useAuthContext'
import { getCustomersBySaleId } from '@/services/customerService'
import { USER_ROLES } from '@/constants/roles'

// ==================== INTERFACES ====================

/**
 * Interface Statement - Bảng kê công nợ (Legacy - for backward compatibility)
 * @deprecated Use StatementListItem from @/types/statement.types
 */
export interface Statement {
  id: string
  code: string                        // Mã Bảng kê (VD: ST-1-012026)
  customerName: string                // Tên khách hàng
  period: string                      // Kỳ cước (VD: "01/2026")
  totalAmount: number                 // Tổng thanh toán (còn nợ)
  status: StatementStatus             // Trạng thái
  linkedInvoiceNumber: string | null  // Số hóa đơn đã gắn
  isEmailSent: boolean                // Đã gửi email báo cước chưa
  createdDate: string                 // Ngày tạo
  // New fields from API (optional for backward compatibility)
  openingBalance?: number             // Số dư đầu kỳ
  newCharges?: number                 // Phí phát sinh mới
  paidAmount?: number                 // Số tiền đã thanh toán
  statusID?: number                   // ID trạng thái (1=Draft, 2=Pending, 3=Sent, 4=Paid)
  isOverdue?: boolean                 // Có quá hạn không
}

// Convert API response to legacy format for backward compatibility
function convertToLegacyFormat(item: StatementListItem): Statement {
  return {
    id: String(item.statementID),
    code: item.statementCode,
    customerName: item.customerName,
    period: item.period, // Now directly from API response (e.g., "01/2026")
    totalAmount: item.totalAmount, // This is the remaining amount (c\u00f2n n\u1ee3)
    status: item.status as StatementStatus, // e.g., "Sent", "Draft", "Paid"
    linkedInvoiceNumber: item.totalInvoices > 0 ? `${item.totalInvoices} H\u0110` : null,
    isEmailSent: item.statusID >= 3, // statusID=3 means "Sent", so email was sent
    createdDate: item.statementDate, // Use statementDate as createdDate
    // New fields from API\n    openingBalance: item.openingBalance,
    newCharges: item.newCharges,
    paidAmount: item.paidAmount,
    statusID: item.statusID,
    isOverdue: item.isOverdue,
  }
}

// ==================== MOCK DATA (No longer used - kept for reference) ====================
// Mock data has been replaced with real API calls to /api/Statement

// ==================== COMPONENT: ACTIONS MENU ====================

interface StatementActionsMenuProps {
  statement: Statement
  onExportPDF: (id: string, code: string) => void
  onSendEmail: (id: string, code: string, customerName: string) => void
  onSendDebtReminder: (id: string, code: string, customerName: string) => void
  onUpdatePayment: (id: string) => void
  onViewHistory: (id: string) => void
}

const StatementActionsMenu = ({ statement, onExportPDF, onSendEmail, onSendDebtReminder, onUpdatePayment, onViewHistory }: StatementActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const menuItems = [
    {
      label: 'Xem chi tiết',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      action: () => {
        console.log('Xem chi tiết:', statement.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Xuất PDF',
      icon: <PictureAsPdfIcon fontSize="small" />,
      action: () => {
        onExportPDF(statement.id, statement.code)
        handleClose()
      },
      color: 'error.main',
    },
    {
      label: 'Cập nhật thanh toán',
      icon: <PaymentIcon fontSize="small" />,
      action: () => {
        onUpdatePayment(statement.id)
        handleClose()
      },
      color: '#2e7d32',
    },
    {
      label: 'Lịch sử thanh toán',
      icon: <HistoryIcon fontSize="small" />,
      action: () => {
        onViewHistory(statement.id)
        handleClose()
      },
      color: '#9c27b0',
    },
    {
      label: 'Gửi email',
      icon: <EmailIcon fontSize="small" />,
      action: () => {
        onSendEmail(statement.id, statement.code, statement.customerName)
        handleClose()
      },
      color: 'info.main',
    },
    {
      label: 'Nhắc nợ',
      icon: <NotificationsActiveIcon fontSize="small" />,
      action: () => {
        onSendDebtReminder(statement.id, statement.code, statement.customerName)
        handleClose()
      },
      color: '#ff6f00',
    },
  ]

  return (
    <>
      <Tooltip title="Thao tác" arrow placement="left">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
              transform: 'scale(1.1)',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          timeout: 250,
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: 220,
              borderRadius: 2.5,
              mt: 0.5,
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
              border: '1px solid',
              borderColor: 'divider',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                borderLeft: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={item.action}
            sx={{
              py: 1.25,
              px: 2.5,
              gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: item.color,
                minWidth: 28,
                transition: 'color 0.2s ease',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// ==================== MAIN COMPONENT ====================

const StatementManagement = () => {
  usePageTitle('Quản lý bảng kê')
  
  // Hooks
  const navigate = useNavigate()
  const { user } = useAuthContext()

  // API State
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
  })

  // UI State
  const [selectedRowsCount, setSelectedRowsCount] = useState<number>(0)
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false)
  const [selectedStatementForPayment, setSelectedStatementForPayment] = useState<Statement | null>(null)
  const [selectedStatementPayments, setSelectedStatementPayments] = useState<StatementPaymentRecord[]>([])
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false)
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false)
  const [selectedStatementForHistory, setSelectedStatementForHistory] = useState<Statement | null>(null)
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' 
  })

  // Filter state
  const [filters, setFilters] = useState<StatementFilterState>({
    searchText: '',
    period: '',
    status: [],
    customer: null,
  })

  // ==================== API FETCH ====================

  // Fetch statements from API
  const loadStatements = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('📊 [Statement - Load] Starting fetch...')
      console.log('👤 [Statement - User] Role:', user?.role, 'ID:', user?.id)
      
      // ✅ Step 1: Get allowed customer names for Sales role
      let allowedNames: string[] | null = null
      
      if (user?.role === USER_ROLES.SALES && user?.id) {
        console.log('🔐 [Statement - Sales Filter] Fetching customers for Sale ID:', user.id)
        console.log('📡 API Call: GET /api/Customer?saleId=' + user.id)
        
        try {
          const saleCustomers = await getCustomersBySaleId(Number(user.id))
          console.log('📊 [Statement - Sales Filter] API returned:', saleCustomers.length, 'customers')
          
          // 🔥 CRITICAL: Backend bug - filter client-side
          const filteredCustomers = saleCustomers.filter(c => c.saleID === Number(user.id))
          
          console.log('🔍 [Statement - Client Filter] Before:', saleCustomers.length, 'customers')
          console.log('🔍 [Statement - Client Filter] After:', filteredCustomers.length, 'customers')
          console.log('⚠️ [Statement - Backend Bug] Filtered out:', saleCustomers.length - filteredCustomers.length, 'wrong saleID')
          
          if (filteredCustomers.length < saleCustomers.length) {
            console.warn('🚨 Backend API bug: Returning customers with saleID !=', user.id)
            console.warn('🐛 Wrong customers:', saleCustomers.filter(c => c.saleID !== Number(user.id)).map(c => ({
              customerID: c.customerID,
              name: c.customerName,
              saleID: c.saleID,
            })))
          }
          
          allowedNames = filteredCustomers.map(c => c.customerName)
          
          console.log('✅ [Statement - Sales Filter] Allowed customers:', allowedNames.length)
          console.log('🎯 [Statement - Sales Filter] Customer names:', allowedNames)
        } catch (error) {
          console.error('❌ Failed to fetch sales customers:', error)
          // Continue with empty list - will show no statements
          allowedNames = []
        }
      }
      
      // ✅ Step 2: Fetch all statements from API
      console.log('📡 [Statement - API] Fetching statements...')
      console.log('📄 [Statement - Pagination]:', {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      })
      
      const response = await fetchStatements({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      })
      
      console.log('📊 [Statement - API Response]:', {
        totalItems: response.items.length,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
        pageIndex: response.pageIndex,
        hasPreviousPage: response.hasPreviousPage,
        hasNextPage: response.hasNextPage,
        sampleItem: response.items[0] ? {
          statementCode: response.items[0].statementCode,
          customerName: response.items[0].customerName,
          period: response.items[0].period,
          totalAmount: response.items[0].totalAmount,
          status: response.items[0].status,
        } : null,
      })

      // ✅ Step 3: Convert API response to legacy format
      let convertedStatements = response.items.map(convertToLegacyFormat)
      
      // ✅ Step 4: Filter by allowedCustomerNames if Sales role
      if (allowedNames !== null) {
        const beforeFilter = convertedStatements.length
        convertedStatements = convertedStatements.filter(s => 
          allowedNames!.includes(s.customerName)
        )
        console.log('🔒 [Statement - Security Filter] Sales can only see their customers')
        console.log('🔍 [Statement - Filter Result] Before:', beforeFilter, 'After:', convertedStatements.length)
        console.log('✅ [Statement - Filtered] Statement codes:', convertedStatements.map(s => s.code))
        console.log('✅ [Statement - Filtered] Customer names:', convertedStatements.map(s => s.customerName))
      }
      
      setStatements(convertedStatements)
      
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages,
        totalCount: allowedNames !== null ? convertedStatements.length : response.totalCount,
      }))

      console.log('✅ [Statement - Load Complete]:', convertedStatements.length, 'items')
    } catch (err) {
      let errorMessage = 'Không thể tải danh sách bảng kê'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        errorMessage = axiosError.response?.data?.message || errorMessage
      }
      setError(errorMessage)
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      console.error('❌ Error loading statements:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, user?.role, user?.id])

  // Load statements on component mount
  useEffect(() => {
    loadStatements()
  }, [loadStatements])

  // ==================== HANDLERS ====================

  // Handle PDF export
  const handleExportPDF = async (id: string, code: string) => {
    try {
      setSnackbar({
        open: true,
        message: `Đang xuất PDF cho ${code}...`,
        severity: 'info',
      })
      
      await exportStatementPDF(Number(id), `${code}.pdf`)
      
      setSnackbar({
        open: true,
        message: `✅ Đã xuất PDF thành công: ${code}.pdf`,
        severity: 'success',
      })
    } catch (err) {
      let errorMessage = 'Không thể xuất PDF'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string; message?: string } } }
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      console.error('❌ Error exporting PDF:', err)
    }
  }

  // Handle send email
  const handleSendEmail = async (id: string, code: string, customerName: string) => {
    try {
      // Tìm statement để lấy thông tin đầy đủ
      const statement = statements.find(s => s.id === id)
      if (!statement) {
        throw new Error('Không tìm thấy thông tin bảng kê')
      }
      
      // Email khách hàng - giả định có field này, nếu không có thì cần thêm vào Statement interface
      // Tạm thời dùng email demo, production cần lấy từ statement data
      const customerEmail = `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`
      
      setSnackbar({
        open: true,
        message: `📧 Đang gửi email cho ${customerName}...`,
        severity: 'info',
      })
      
      await sendStatementEmail(
        Number(id),
        code,
        customerName,
        customerEmail,
        statement.period
      )
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi email thành công cho ${customerName}!`,
        severity: 'success',
      })
      
      // Reload statements to update email status
      await loadStatements()
    } catch (err) {
      let errorMessage = 'Không thể gửi email'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string; message?: string } } }
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error',
      })
      console.error('❌ Error sending email:', err)
    }
  }

  // Handle send debt reminder
  const handleSendDebtReminder = async (id: string, _code: string, customerName: string) => {
    try {
      setSnackbar({
        open: true,
        message: `🔔 Đang gửi email nhắc nợ cho ${customerName}...`,
        severity: 'info',
      })
      
      await sendDebtReminder(Number(id), true)
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi email nhắc nợ thành công cho ${customerName}!`,
        severity: 'success',
      })
    } catch (err) {
      let errorMessage = 'Không thể gửi email nhắc nợ'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string; message?: string } } }
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error',
      })
      console.error('❌ Error sending debt reminder:', err)
    }
  }

  // Handle open payment modal
  const handleOpenPaymentModal = async (statement: Statement) => {
    console.log('[handleOpenPaymentModal] Opening payment modal for:', statement.code)
    setSelectedStatementForPayment(statement)
    setPaymentModalOpen(true)
    
    // Fetch payment history for this statement
    try {
      const paymentHistory = await getStatementPayments(Number(statement.id))
      setSelectedStatementPayments(paymentHistory.payments)
      console.log(`[Statement ${statement.id}] Payment history:`, paymentHistory.payments.length, 'payments')
    } catch (error) {
      console.error('Failed to fetch statement payments:', error)
      setSelectedStatementPayments([])
    }
  }

  // Handle view payment history
  const handleViewHistory = (id: string) => {
    const statement = statements.find(s => s.id === id)
    if (statement) {
      console.log('[handleViewHistory] Opening history modal for:', statement.code)
      setSelectedStatementForHistory(statement)
      setHistoryModalOpen(true)
    }
  }

  // Handle payment submit
  const handlePaymentSubmit = async (formData: StatementPaymentFormData) => {
    if (!selectedStatementForPayment || !user) {
      console.error('Missing statement or user')
      return
    }

    setIsSubmittingPayment(true)

    try {
      const paymentRequest: CreateStatementPaymentRequest = {
        statementId: Number(selectedStatementForPayment.id),
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        transactionCode: formData.transactionCode || undefined,
        note: formData.note || undefined,
        paymentDate: formData.paymentDate.toISOString(),
        createdBy: parseInt(user.id),
      }

      console.log('[handlePaymentSubmit] Submitting payment:', paymentRequest)

      const response = await createStatementPayment(
        Number(selectedStatementForPayment.id),
        paymentRequest
      )

      // Calculate display values
      const remainingAmount = response.remainingAmount ?? 0
      const isPaidFull = remainingAmount === 0
      const statusText = isPaidFull ? 'Trả toàn bộ ✓' : 'Trả một phần'
      const statusIcon = isPaidFull ? '✅' : '💰'

      setSnackbar({
        open: true,
        message: `${statusIcon} ${statusText}\n💰 Số tiền thanh toán: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.amount)}\n📊 Còn lại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount)}`,
        severity: isPaidFull ? 'success' : 'info',
      })

      // Close modal and refresh
      setPaymentModalOpen(false)
      setSelectedStatementForPayment(null)
      
      // Reload statements to show updated amounts
      await loadStatements()

    } catch (error) {
      console.error('❌ Payment failed:', error)
      let errorMessage = 'Không thể ghi nhận thanh toán'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string; message?: string } } }
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error',
      })
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // Handle create statement from modal
  const handleCreateStatement = (customerId: number, month: number, year: number) => {
    console.log('Creating statement:', { customerId, month, year })
    
    // Navigate to create statement page with query params
    navigate(`/statements/new?customerId=${customerId}&month=${month}&year=${year}`)
    
    // Show success message
    setSnackbar({
      open: true,
      message: 'Đang tạo bảng kê...',
      severity: 'info',
    })
  }

  // ==================== FILTER LOGIC ====================

  // Filter statements based on selected tab AND filter criteria
  const filteredStatements = useMemo(() => {
    let result = statements

    // Tab filtering - currently fixed to 'all'
    // If tabs UI is added back, this will filter by status
    // switch (selectedTab) {
    //   case 'draft':
    //     result = result.filter(s => s.status !== STATEMENT_STATUS.INVOICED)
    //     break
    //   case 'invoiced':
    //     result = result.filter(s => s.status === STATEMENT_STATUS.INVOICED)
    //     break
    //   default:
    //     break
    // }

    // Advanced filtering
    result = result.filter((statement) => {
      // 1️⃣ Search text
      const matchesSearch =
        !filters.searchText ||
        statement.code.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        statement.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        statement.linkedInvoiceNumber?.toLowerCase().includes(filters.searchText.toLowerCase())

      // 2️⃣ Period (kỳ cước - exact match)
      const matchesPeriod =
        !filters.period ||
        statement.period === filters.period

      // 3️⃣ Status
      const matchesStatus =
        filters.status.length === 0 ||
        filters.status.includes('ALL') ||
        filters.status.includes(statement.status)

      // 4️⃣ Customer
      const matchesCustomer =
        !filters.customer ||
        filters.customer === 'ALL' ||
        statement.customerName === filters.customer

      return (
        matchesSearch &&
        matchesPeriod &&
        matchesStatus &&
        matchesCustomer
      )
    })

    return result
  }, [statements, filters])

  // ==================== HANDLERS ====================

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: StatementFilterState) => {
    setFilters(newFilters)
  }, [])

  // Handle reset filter
  const handleResetFilter = useCallback(() => {
    setFilters({
      searchText: '',
      period: '',
      status: [],
      customer: null,
    })
  }, [])

  // NOTE: handleDelete removed - no longer needed (Delete functionality removed from menu)

  // Handle bulk send email
  const handleBulkSendEmail = () => {
    const count = selectedRowsCount
    setSnackbar({
      open: true,
      message: `Đang gửi bảng kê cho ${count} khách hàng...`,
      severity: 'info',
    })
    
    // Simulate API call
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: `Đã gửi email thành công cho ${count} khách hàng`,
        severity: 'success',
      })
      setSelectedRowsCount(0)
    }, 1500)
  }

  // Format currency VND
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount)
  }

  // DataGrid Columns - Tối ưu căn chỉnh và bố cục
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Mã Bảng kê',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#1976d2',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 280,
      sortable: true,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: '#2c3e50',
            paddingLeft: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'period',
      headerName: 'Kỳ cước',
      width: 100,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#1976d2',
          }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'totalAmountOriginal',
      headerName: 'Tổng tiền',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => {
        const totalOriginal = (params.row.openingBalance || 0) + (params.row.newCharges || 0)
        return (
          <Typography sx={{ 
            fontWeight: 600, 
            color: '#1976d2',
            fontSize: '0.95rem',
          }}>
            {formatCurrency(totalOriginal)}
          </Typography>
        )
      },
    },
    {
      field: 'paidAmount',
      headerName: 'Đã trả',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography sx={{ 
          fontWeight: 600, 
          color: '#2e7d32',
          fontSize: '0.95rem',
        }}>
          {formatCurrency((params.row.paidAmount || 0) as number)}
        </Typography>
      ),
    },
    {
      field: 'totalAmount',
      headerName: 'Còn nợ',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography sx={{ 
          fontWeight: 700, 
          color: params.value > 0 ? '#d32f2f' : '#2e7d32',
          fontSize: '0.95rem',
        }}>
          {formatCurrency(params.value as number)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => {
        const status = params.value as StatementStatus
        const statusLabel = getStatementStatusLabel(status)
        
        return (
          <Chip
            label={statusLabel}
            color={getStatementStatusColor(status)}
            size="small"
            sx={{ 
              fontWeight: 600, 
              minWidth: 120,
              fontSize: '0.8125rem',
            }}
          />
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <StatementActionsMenu 
          statement={params.row} 
          onExportPDF={handleExportPDF}
          onSendEmail={handleSendEmail}
          onSendDebtReminder={handleSendDebtReminder}
          onUpdatePayment={(id) => {
            const statement = statements.find(s => s.id === id)
            if (statement) handleOpenPaymentModal(statement)
          }}
          onViewHistory={handleViewHistory}
        />
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
          📋 Quản lý Bảng kê công nợ
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Quản lý và theo dõi các bảng kê cước, công nợ khách hàng
        </Typography>
       
      </Box>

      {/* Statement Filter */}
      <StatementFilter
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        totalResults={pagination.totalCount}
        filteredResults={filteredStatements.length}
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              height: 42,
              minWidth: 160,
              boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Tạo Bảng kê mới
          </Button>
        }
      />

      {/* Tabs - Quick Filters */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fff',
        }}
      >
       
      </Paper>

      {/* Data Table */}
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredStatements}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRowsCount(Array.isArray(newSelection) ? newSelection.length : 0)
            }}
            paginationMode="server"
            rowCount={pagination.totalCount}
            paginationModel={{
              page: pagination.pageIndex - 1, // DataGrid uses 0-based index
              pageSize: pagination.pageSize,
            }}
            onPaginationModelChange={(model) => {
              setPagination(prev => ({
                ...prev,
                pageIndex: model.page + 1, // Convert to 1-based for API
                pageSize: model.pageSize,
              }))
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            localeText={{
              footerRowSelected: (count) => `${count} hàng được chọn`,
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 600,
                minHeight: '56px !important',
                maxHeight: '56px !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row': {
                minHeight: '64px !important',
                maxHeight: '64px !important',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e0e0e0',
                backgroundColor: '#fafafa',
                minHeight: '56px',
                padding: '8px 16px',
              },
              '& .MuiTablePagination-root': {
                marginLeft: 'auto',
                overflow: 'visible',
              },
              '& .MuiTablePagination-toolbar': {
                minHeight: '52px',
                paddingLeft: '8px',
                paddingRight: '8px',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiTablePagination-selectLabel': {
                margin: 0,
              },
              '& .MuiTablePagination-displayedRows': {
                margin: 0,
              },
            }}
            autoHeight
          />
        )}
      </Paper>

      {/* Floating Action Button - Bulk Send Email */}
      {/* Floating Action Button - Bulk Send Email */}
      <Zoom in={selectedRowsCount > 0}>
        <Fab
          variant="extended"
          color="primary"
          onClick={handleBulkSendEmail}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            boxShadow: '0 4px 16px rgba(28, 132, 238, 0.32)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(28, 132, 238, 0.4)',
            },
          }}
        >
          <SendIcon sx={{ mr: 1 }} />
          Gửi Email báo cước ({selectedRowsCount})
        </Fab>
      </Zoom>
      {/* Snackbar for notifications */}
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

      {/* Statement Payment Modal */}
      <StatementPaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false)
          setSelectedStatementForPayment(null)
          setSelectedStatementPayments([])
        }}
        onSubmit={handlePaymentSubmit}
        statement={selectedStatementForPayment ? {
          statementID: Number(selectedStatementForPayment.id),
          statementCode: selectedStatementForPayment.code,
          customerName: selectedStatementForPayment.customerName,
          totalAmount: selectedStatementForPayment.totalAmount,
          paidAmount: selectedStatementForPayment.paidAmount || 0,
          openingBalance: selectedStatementForPayment.openingBalance || 0,
          newCharges: selectedStatementForPayment.newCharges || 0,
        } : null}
        paymentHistory={selectedStatementPayments}
        isSubmitting={isSubmittingPayment}
      />

      {/* Create Statement Modal */}
      <CreateStatementModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateStatement}
      />
      {/* Payment History Modal */}
      {selectedStatementForHistory && (
        <StatementPaymentHistoryModal
          open={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false)
            setSelectedStatementForHistory(null)
          }}
          statementId={selectedStatementForHistory.id}
          statementCode={selectedStatementForHistory.code}
          customerName={selectedStatementForHistory.customerName}
        />
      )}
    </Box>
  )
}

export default StatementManagement
