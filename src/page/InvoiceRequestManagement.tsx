import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PersonIcon from '@mui/icons-material/Person'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthContext } from '@/context/useAuthContext'
import InvoiceRequestFilter, {
  InvoiceRequestFilterState,
} from '@/components/InvoiceRequestFilter'
import {
  InvoiceRequest,
  InvoiceRequestStatus,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  getRequestStatusColor,
} from '@/types/invoiceRequest.types'
import { mockInvoiceRequests } from '@/types/invoiceRequest.mockdata'
import {
  getAllInvoiceRequests,
  rejectInvoiceRequest,
  cancelInvoiceRequest,
  previewInvoiceRequestHTML,
  previewInvoiceRequestPDF,
  type BackendInvoiceRequestResponse,
} from '@/services/invoiceService'

// Setup dayjs
dayjs.extend(relativeTime)
dayjs.locale('vi')

// ==================== ACTIONS MENU COMPONENT ====================

interface RequestActionsMenuProps {
  request: InvoiceRequest
  userRole: string | undefined
  onCreateInvoice: (id: number) => void
  onReject: (id: number) => void
  onCancel: (id: number) => void
  onViewDetail: (id: number) => void
  onDownloadPDF: (id: number) => void
  onViewCreatedInvoice: (invoiceID: number) => void
}

const RequestActionsMenu = ({
  request,
  userRole,
  onCreateInvoice,
  onReject,
  onCancel,
  onViewDetail,
  onDownloadPDF,
  onViewCreatedInvoice,
}: RequestActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Xác định trạng thái
  const isPending = request.statusID === InvoiceRequestStatus.PENDING
  const hasInvoice = !!request.invoiceID  // Có invoice ID = đã tạo hóa đơn rồi
  // Note: isApproved, isRejecting, isCancelled không sử dụng trong code hiện tại

  // 🔒 Phân quyền: Sale KHÔNG thấy các chức năng quản trị
  const isSale = userRole?.toLowerCase() === 'sale'
  const canCreateInvoice = !isSale && isPending  // KTT/Accountant/Admin mới tạo hóa đơn được
  const canReject = !isSale && isPending         // KTT/Accountant/Admin mới từ chối được

  const menuItems = [
    // 🔒 KTT/Admin actions - ẨN với Sale
    ...(!isSale ? [
      {
        label: '📝 Tạo hoá đơn',
        icon: <CheckCircleOutlineIcon fontSize="small" />,
        enabled: canCreateInvoice,
        action: () => {
          onCreateInvoice(request.requestID)
          handleClose()
        },
        color: 'success.main',
        tooltip: 'Tạo hoá đơn từ yêu cầu này (dành cho KTT/KT)',
      },
      {
        label: '❌ Từ chối',
        icon: <CancelOutlinedIcon fontSize="small" />,
        enabled: canReject,
        action: () => {
          onReject(request.requestID)
          handleClose()
        },
        color: 'error.main',
        tooltip: 'Từ chối yêu cầu (dành cho KTT)',
      },
      { divider: true },
    ] : []),
    // 🔒 Sale-only action - CHỈ Sale mới có Hủy yêu cầu
    ...(isSale ? [
      {
        label: '🚫 Hủy yêu cầu',
        icon: <CancelOutlinedIcon fontSize="small" />,
        enabled: isPending,
        action: () => {
          onCancel(request.requestID)
          handleClose()
        },
        color: 'warning.main',
        tooltip: 'Hủy yêu cầu (chỉ Sale)',
      },
    ] : []),
    // Common action - Xem hóa đơn đã tạo (tất cả roles)
    {
      label: '🔗 Xem hóa đơn đã tạo',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      enabled: hasInvoice,  // Chỉ cần có invoiceID là được, không cần check COMPLETED
      action: () => {
        if (request.invoiceID) {
          onViewCreatedInvoice(request.invoiceID)
        }
        handleClose()
      },
      color: 'secondary.main',
      tooltip: `Xem hóa đơn đã được tạo${request.invoiceNumber ? ` (Số HĐ: ${request.invoiceNumber})` : ''}`,
    },
  ]

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
      {/* Icon Xem chi tiết */}
      <Tooltip title="Xem chi tiết" arrow>
        <IconButton
          onClick={() => onViewDetail(request.requestID)}
          size="small"
          sx={{
            color: 'primary.main',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'primary.light',
              transform: 'scale(1.15)',
            },
          }}>
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Icon Tải PDF */}
      <Tooltip title="Tải PDF" arrow>
        <IconButton
          onClick={() => onDownloadPDF(request.requestID)}
          size="small"
          sx={{
            color: 'error.main',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'error.light',
              transform: 'scale(1.15)',
            },
          }}>
          <PictureAsPdfIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Menu dropdown (Hủy, Xem HĐ đã tạo) */}
      <Tooltip title="Thêm" arrow>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'action.hover',
              transform: 'scale(1.15)',
            },
          }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        TransitionProps={{
          timeout: 250,
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: 240,
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
        }}>
        {menuItems.map((item, index) => {
          if ('divider' in item) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          }

          return (
            <MenuItem
              key={item.label}
              onClick={item.enabled ? item.action : undefined}
              disabled={!item.enabled}
              sx={{
                py: 1.25,
                px: 2.5,
                gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': item.enabled
                  ? {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                    }
                  : {},
                '&.Mui-disabled': {
                  opacity: 0.4,
                },
                cursor: item.enabled ? 'pointer' : 'not-allowed',
              }}>
              <ListItemIcon
                sx={{
                  color: item.enabled ? item.color : 'text.disabled',
                  minWidth: 28,
                  transition: 'color 0.2s ease',
                }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: item.enabled ? 500 : 400,
                  letterSpacing: '0.01em',
                  color: item.enabled ? 'text.primary' : 'text.disabled',
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </Box>
  )
}

// ==================== MAIN COMPONENT ====================

const InvoiceRequestManagement = () => {
  usePageTitle('Quản lý yêu cầu xuất HĐ')
  const navigate = useNavigate()
  const { user } = useAuthContext()

  // State quản lý data
  const [requests, setRequests] = useState<InvoiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity?: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', severity: 'info' })

  // Filter state
  const [filters, setFilters] = useState<InvoiceRequestFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    requiredDateFrom: null,
    requiredDateTo: null,
    statusIDs: [],
    requestTypes: [],
    customer: null,
    createdBy: null,
  })

  // Reject dialog state
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    requestID: number | null
    reason: string
    loading: boolean
  }>({ open: false, requestID: null, reason: '', loading: false })

  // 📊 Pagination state
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  })

  // ==================== FILTER HANDLERS ====================

  const handleFilterChange = useCallback((newFilters: InvoiceRequestFilterState) => {
    setFilters(newFilters)
  }, [])

  const handleResetFilter = useCallback(() => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      requiredDateFrom: null,
      requiredDateTo: null,
      statusIDs: [],
      requestTypes: [],
      customer: null,
      createdBy: null,
    })
  }, [])

  // ==================== DATA FETCHING ====================

  /**
   * Map backend response to frontend InvoiceRequest type
   */
  const mapBackendToFrontend = (backendData: BackendInvoiceRequestResponse): InvoiceRequest => {
    const statusID = backendData.statusID || backendData.statusId || 1;
    const saleName = backendData.salesName || backendData.saleName || 'N/A';
    
    return {
      requestID: backendData.requestID,
      requestCode: backendData.requestCode || `REQ-${backendData.requestID}`,
      requestType: 1,
      statusID: statusID,
      statusName: backendData.statusName || REQUEST_STATUS_LABELS[statusID as InvoiceRequestStatus] || 'Unknown',
      priority: 2,
      requestDate: backendData.requestDate || backendData.createdAt || new Date().toISOString(),
      requiredDate: undefined,
      approvedDate: backendData.approvedDate,
      completedDate: backendData.completedDate,
      requestedBy: {
        saleID: backendData.salesID || 0,
        saleName: saleName,
        saleEmail: '',
      },
      approvedBy: backendData.accountantId ? {
        userID: backendData.accountantId,
        userName: backendData.accountantName || `Accountant #${backendData.accountantId}`,
        approvedAt: backendData.approvedDate || '',
      } : undefined,
      customer: {
        customerID: backendData.customerID || 0,
        customerName: backendData.customerName,
        taxCode: backendData.taxCode || '',
        address: backendData.address || '',
        email: backendData.contactEmail,
        phone: backendData.contactPhone,
        contactPerson: backendData.contactPerson,
        paymentMethod: backendData.paymentMethod,
      },
      items: (backendData.items || []).map((item, index) => ({
        itemID: index + 1,
        itemName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice || (item.amount / item.quantity),
        unit: item.unit || 'cái',
        taxRate: item.amount > 0 ? (item.vatAmount / item.amount) * 100 : 0,
        amount: item.amount,
        taxAmount: item.vatAmount,
        totalAmount: item.amount + item.vatAmount,
      })),
      subtotal: backendData.amount || backendData.totalAmount || 0,
      totalTax: backendData.taxAmount || 0,
      totalDiscount: 0,
      totalAmount: backendData.totalAmount,
      notes: backendData.notes,
      rejectionReason: backendData.rejectionReason || backendData.rejectReason,
      invoiceID: backendData.invoiceID || backendData.createdInvoiceId || undefined,
      invoiceNumber: backendData.invoiceNumber?.toString(),
    }
  }

  /**
   * Fetch invoice requests from API
   */
  const fetchInvoiceRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getAllInvoiceRequests()
      const mappedData = response.map(mapBackendToFrontend)
      setRequests(mappedData)

      if (import.meta.env.DEV) {
        console.log('[InvoiceRequestManagement] Fetched requests:', mappedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu'
      setError(errorMessage)
      console.error('[InvoiceRequestManagement] Fetch error:', err)
      
      // Fallback to mock data in development
      if (import.meta.env.DEV) {
        console.warn('[InvoiceRequestManagement] Using mock data as fallback')
        setRequests(mockInvoiceRequests)
        setError('⚠️ Đang dùng dữ liệu mẫu (API chưa sẵn sàng)')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data on mount and when refresh triggered
  useEffect(() => {
    fetchInvoiceRequests()
  }, [refreshTrigger, fetchInvoiceRequests])

  // ==================== FILTER LOGIC ====================

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Search text
      const matchesSearch =
        !filters.searchText ||
        request.requestCode.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        request.customer.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        request.customer.taxCode?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        request.requestedBy.saleName.toLowerCase().includes(filters.searchText.toLowerCase())

      // Date range (ngày tạo)
      const matchesDateFrom =
        !filters.dateFrom ||
        dayjs(request.requestDate).isAfter(filters.dateFrom, 'day') ||
        dayjs(request.requestDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo =
        !filters.dateTo ||
        dayjs(request.requestDate).isBefore(filters.dateTo, 'day') ||
        dayjs(request.requestDate).isSame(filters.dateTo, 'day')

      // Required date range (hạn xuất)
      const matchesRequiredDateFrom =
        !filters.requiredDateFrom ||
        !request.requiredDate ||
        dayjs(request.requiredDate).isAfter(filters.requiredDateFrom, 'day') ||
        dayjs(request.requiredDate).isSame(filters.requiredDateFrom, 'day')
      const matchesRequiredDateTo =
        !filters.requiredDateTo ||
        !request.requiredDate ||
        dayjs(request.requiredDate).isBefore(filters.requiredDateTo, 'day') ||
        dayjs(request.requiredDate).isSame(filters.requiredDateTo, 'day')

      // Status
      const matchesStatus =
        filters.statusIDs.length === 0 ||
        filters.statusIDs.includes(-1) ||
        filters.statusIDs.includes(request.statusID)

      // Request type
      const matchesRequestType =
        filters.requestTypes.length === 0 ||
        filters.requestTypes.includes(-1) ||
        filters.requestTypes.includes(request.requestType)

      // Customer
      const matchesCustomer =
        !filters.customer ||
        filters.customer === 'ALL' ||
        request.customer.customerName === filters.customer

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesRequiredDateFrom &&
        matchesRequiredDateTo &&
        matchesStatus &&
        matchesRequestType &&
        matchesCustomer
      )
    })
  }, [requests, filters])

  // ==================== ACTION HANDLERS ====================

  /**
   * Refresh data after action
   */
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  /**
   * Tạo hoá đơn từ yêu cầu
   */
  const handleCreateInvoice = async (requestID: number) => {
    try {
      console.log('📝 Tạo hoá đơn từ yêu cầu:', requestID)
      
      // ✅ Navigate đến trang tạo hóa đơn với requestId
      navigate(`/create-invoice?requestId=${requestID}`)
      
      setSnackbar({
        open: true,
        message: '⏳ Đang chuyển đến trang tạo hóa đơn...',
        severity: 'info',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể chuyển trang'
      setSnackbar({
        open: true,
        message: `❌ Lỗi: ${errorMsg}`,
        severity: 'error',
      })
      console.error('[handleCreateInvoice] Error:', err)
    }
  }

  /**
   * Từ chối yêu cầu - Mở dialog
   */
  const handleReject = (requestID: number) => {
    console.log('❌ Mở dialog từ chối:', requestID)
    setRejectDialog({
      open: true,
      requestID: requestID,
      reason: '',
      loading: false,
    })
  }

  /**
   * Xác nhận từ chối yêu cầu
   */
  const handleRejectConfirm = async () => {
    const { requestID, reason } = rejectDialog

    if (!requestID) return

    // Validate reason
    if (!reason || reason.trim() === '') {
      setSnackbar({
        open: true,
        message: '⚠️ Vui lòng nhập lý do từ chối',
        severity: 'warning',
      })
      return
    }

    try {
      setRejectDialog(prev => ({ ...prev, loading: true }))

      console.log('❌ Từ chối yêu cầu:', requestID, '- Lý do:', reason)
      await rejectInvoiceRequest(requestID, reason.trim())

      // Close dialog
      setRejectDialog({ open: false, requestID: null, reason: '', loading: false })

      // Show success message
      setSnackbar({
        open: true,
        message: '✅ Đã từ chối yêu cầu thành công!',
        severity: 'success',
      })

      // Refresh data
      refreshData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Từ chối thất bại'
      setSnackbar({
        open: true,
        message: `❌ Lỗi: ${errorMsg}`,
        severity: 'error',
      })
      console.error('[handleRejectConfirm] Error:', err)
    } finally {
      setRejectDialog(prev => ({ ...prev, loading: false }))
    }
  }

  /**
   * Đóng reject dialog
   */
  const handleRejectCancel = () => {
    setRejectDialog({ open: false, requestID: null, reason: '', loading: false })
  }

  /**
   * Hủy yêu cầu
   */
  const handleCancel = async (requestID: number) => {
    try {
      console.log('🚫 Hủy yêu cầu:', requestID)
      
      if (!confirm('Bạn có chắc muốn hủy yêu cầu này?')) {
        return
      }

      await cancelInvoiceRequest(requestID)
      alert('✅ Đã hủy yêu cầu')
      refreshData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Hủy yêu cầu thất bại'
      alert(`❌ Lỗi: ${errorMsg}`)
      console.error('[handleCancel] Error:', err)
    }
  }

  /**
   * Xem chi tiết yêu cầu (mở HTML preview)
   */
  const handleViewDetail = async (requestID: number) => {
    try {
      console.log('👁️ Xem chi tiết:', requestID)
      
      setSnackbar({
        open: true,
        message: '⏳ Đang tải chi tiết hoá đơn...',
        severity: 'info',
      })

      // Gọi API lấy HTML preview
      const htmlContent = await previewInvoiceRequestHTML(requestID)
      
      // Tạo blob URL từ HTML và mở trong tab mới
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
      
      // Cleanup blob URL sau 1 phút
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      
      setSnackbar({
        open: true,
        message: '✅ Đã mở chi tiết hoá đơn!',
        severity: 'success',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể xem chi tiết'
      setSnackbar({
        open: true,
        message: `❌ Lỗi: ${errorMsg}`,
        severity: 'error',
      })
      console.error('[handleViewDetail] Error:', err)
    }
  }

  /**
   * Tải PDF của yêu cầu (download file)
   */
  const handleDownloadPDF = async (requestID: number) => {
    try {
      console.log('📥 Tải PDF:', requestID)
      
      setSnackbar({
        open: true,
        message: '⏳ Đang tải PDF... (13MB, có thể mất 10-15 giây)',
        severity: 'info',
      })

      // Gọi API lấy PDF blob
      const blob = await previewInvoiceRequestPDF(requestID)
      
      // Tạo blob URL và trigger download
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Invoice-Request-${requestID}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup blob URL sau 1 phút
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      
      setSnackbar({
        open: true,
        message: '✅ Đã tải xuống PDF thành công!',
        severity: 'success',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải PDF'
      setSnackbar({
        open: true,
        message: `❌ Lỗi: ${errorMsg}`,
        severity: 'error',
      })
      console.error('[handleDownloadPDF] Error:', err)
    }
  }

  /**
   * Xem hóa đơn đã được tạo từ yêu cầu
   */
  const handleViewCreatedInvoice = (invoiceID: number) => {
    try {
      console.log('🔗 Xem hóa đơn đã tạo, ID:', invoiceID)
      
      setSnackbar({
        open: true,
        message: '⏳ Đang chuyển đến trang hóa đơn...',
        severity: 'info',
      })

      // Navigate đến trang chi tiết hóa đơn
      navigate(`/invoices/${invoiceID}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể mở hóa đơn'
      setSnackbar({
        open: true,
        message: `❌ Lỗi: ${errorMsg}`,
        severity: 'error',
      })
      console.error('[handleViewCreatedInvoice] Error:', err)
    }
  }

  // ==================== DATA GRID COLUMNS ====================

  const columns: GridColDef[] = [
    {
      field: 'requestCode',
      headerName: 'Mã yêu cầu',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'primary.main',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
            onClick={() => handleViewDetail(params.row.requestID)}>
            {params.value as string}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'requestType',
      headerName: 'Loại YC',
      flex: 1,
      minWidth: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const type = params.value as number
        const label = REQUEST_TYPE_LABELS[type as keyof typeof REQUEST_TYPE_LABELS] || 'Không xác định'
        const colorMap = {
          1: { bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' }, // Xanh dương - Tạo mới
          2: { bg: '#fff3e0', text: '#f57c00', border: '#ffb74d' }, // Cam - Điều chỉnh
          3: { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' }, // Tím - Thay thế
        }
        const colors = colorMap[type as keyof typeof colorMap] || colorMap[1]

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '20px',
                bgcolor: colors.bg,
                border: `1px solid ${colors.border}`,
                height: 28,
              }}>
              <Typography
                variant="body2"
                sx={{
                  color: colors.text,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  lineHeight: 1,
                }}>
                {label}
              </Typography>
            </Box>
          </Box>
        )
      },
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 200,
      sortable: true,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const request = params.row as InvoiceRequest
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', pl: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#2c3e50',
              }}
            >
              {request.customer.customerName}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#546e7a',
                fontSize: '0.75rem',
              }}
            >
              MST: {request.customer.taxCode}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'requestedBy',
      headerName: 'Sale',
      flex: 1.2,
      minWidth: 160,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const request = params.row as InvoiceRequest
        return (
          <Tooltip
            title={
              <Box>
                <Typography variant="caption" display="block">
                  <strong>Email:</strong> {request.requestedBy.saleEmail}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>SĐT:</strong> {request.requestedBy.salePhone || 'N/A'}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Team:</strong> {request.requestedBy.salesTeam || 'N/A'}
                </Typography>
              </Box>
            }
            arrow
            placement="top">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: '100%' }}>
              <PersonIcon fontSize="small" sx={{ color: '#546e7a', fontSize: '1.125rem' }} />
              <Typography 
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#2c3e50',
                }}
              >
                {request.requestedBy.saleName}
              </Typography>
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'totalAmount',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%', pl: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.875rem',
              color: '#2e7d32',
            }}
          >
            {(params.value as number).toLocaleString('vi-VN')} ₫
          </Typography>
        </Box>
      ),
    },
    {
      field: 'requestDate',
      headerName: 'Ngày tạo',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const date = dayjs(params.value as string)
        return (
          <Tooltip title={date.format('HH:mm:ss - DD/MM/YYYY')} arrow>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography 
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#2c3e50',
                }}
              >
                {date.format('DD/MM/YYYY')}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#546e7a',
                  fontSize: '0.75rem',
                }}
              >
                {date.fromNow()}
              </Typography>
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'requiredDate',
      headerName: 'Hạn xuất HĐ',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ color: '#546e7a' }}>-</Typography>
            </Box>
          )
        }

        const date = dayjs(params.value as string)
        const isUrgent = date.diff(dayjs(), 'hour') < 24
        const isOverdue = date.isBefore(dayjs())

        return (
          <Tooltip title={date.format('HH:mm - DD/MM/YYYY')} arrow>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: isUrgent || isOverdue ? 600 : 500,
                  color: isOverdue ? '#d32f2f' : isUrgent ? '#ed6c02' : '#2c3e50',
                }}>
                {date.format('DD/MM/YYYY')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  color: isOverdue ? '#d32f2f' : isUrgent ? '#ed6c02' : '#546e7a',
                }}>
                {isOverdue ? '⚠️ Quá hạn' : date.fromNow()}
              </Typography>
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'statusID',
      headerName: 'Trạng thái',
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const statusID = params.value as InvoiceRequestStatus
        const statusName = REQUEST_STATUS_LABELS[statusID]
        const color = getRequestStatusColor(statusID)
        const request = params.row as InvoiceRequest

        // Build tooltip
        let tooltipContent = statusName
        if (request.approvedBy) {
          tooltipContent += `\n✅ Duyệt bởi: ${request.approvedBy.userName}`
          tooltipContent += `\n📅 ${dayjs(request.approvedBy.approvedAt).format('DD/MM/YYYY HH:mm')}`
        }
        if (request.processedBy) {
          tooltipContent += `\n🔄 Xử lý bởi: ${request.processedBy.userName}`
        }
        if (request.rejectionReason) {
          tooltipContent += `\n❌ Lý do: ${request.rejectionReason}`
        }
        if (request.invoiceNumber) {
          tooltipContent += `\n📄 HĐ: ${request.invoiceNumber}`
        }

        return (
          <Tooltip title={tooltipContent} arrow placement="top">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Chip
                label={statusName}
                color={color}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 28,
                  cursor: 'help',
                }}
              />
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.8,
      minWidth: 130,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const request = params.row as InvoiceRequest
        return (
          <RequestActionsMenu
            request={request}
            userRole={user?.role}
            onCreateInvoice={handleCreateInvoice}
            onReject={handleReject}
            onCancel={handleCancel}
            onViewDetail={handleViewDetail}
            onDownloadPDF={handleDownloadPDF}
            onViewCreatedInvoice={handleViewCreatedInvoice}
          />
        )
      },
    },
  ]

  // ==================== RENDER ====================

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              📋 Quản lý Yêu cầu xuất HĐ
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Quản lý và xử lý các yêu cầu xuất hóa đơn từ đội ngũ Sales
            </Typography>
            
          </Box>

          {/* Filter */}
          <InvoiceRequestFilter
            onFilterChange={handleFilterChange}
            onReset={handleResetFilter}
            totalResults={requests.length}
            filteredResults={filteredRequests.length}
          />

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
                  Đang tải dữ liệu...
                </Typography>
              </Box>
            </Box>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert 
              severity={error.includes('⚠️') ? 'warning' : 'error'} 
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Data Table */}
          {!loading && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
              <DataGrid
                rows={filteredRequests}
                columns={columns}
                getRowId={(row) => row.requestID}
                checkboxSelection
                disableRowSelectionOnClick
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                autoHeight={false}
                getRowHeight={() => 'auto'}
                density="comfortable"
                loading={loading}
                sx={{
                  border: 'none',
                  minHeight: 600,
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                    py: 2,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0',
                    fontWeight: 600,
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    },
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '70px !important',
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
                    justifyContent: 'flex-end !important',
                  },
                  '& .MuiTablePagination-root': {
                    display: 'flex',
                    alignItems: 'center',
                    width: 'auto',
                    marginLeft: 'auto',
                  },
                  '& .MuiTablePagination-toolbar': {
                    minHeight: '56px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flexWrap: 'nowrap',
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-selectedRowCount': {
                    display: 'none',
                  },
                }}
              />
            </Paper>
          )}
        </Box>

        {/* Snackbar for notifications */}
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

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialog.open}
          onClose={rejectDialog.loading ? undefined : handleRejectCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
            ❌ Từ chối yêu cầu xuất hóa đơn
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Vui lòng nhập lý do từ chối. Lý do này sẽ được gửi cho Sale để họ biết vấn đề và chỉnh sửa lại yêu cầu.
            </Typography>
            <TextField
              autoFocus
              multiline
              rows={4}
              fullWidth
              label="Lý do từ chối *"
              placeholder="Ví dụ: Thiếu thông tin MST, Sản phẩm không đúng, Số tiền không khớp..."
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
              disabled={rejectDialog.loading}
              required
              error={rejectDialog.reason.trim() === '' && rejectDialog.reason !== ''}
              helperText={
                rejectDialog.reason.trim() === '' && rejectDialog.reason !== ''
                  ? 'Lý do không được để trống'
                  : `${rejectDialog.reason.length}/500 ký tự`
              }
              inputProps={{ maxLength: 500 }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleRejectCancel}
              disabled={rejectDialog.loading}
              variant="outlined"
            >
              Hủy
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={rejectDialog.loading || rejectDialog.reason.trim() === ''}
              variant="contained"
              color="error"
              startIcon={rejectDialog.loading ? <CircularProgress size={20} /> : null}
            >
              {rejectDialog.loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default InvoiceRequestManagement
