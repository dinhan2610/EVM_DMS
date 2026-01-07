/**
 * HOD Invoice Management Component
 * Bảng quản lý hóa đơn dành cho role Kế toán trưởng (Head of Department)
 * 
 * ✨ Features (giống 100% với InvoiceManagement):
 * - DataGrid với tất cả cột: Ký hiệu, Khách hàng, MST, Ngày phát hành, Trạng thái, Trạng thái CQT, Loại HĐ
 * - Invoice type badges với rounded corners và tooltip
 * - Filter (search, date range, status, invoice type)
 * - Actions menu (view, edit, sign, issue, resend, delete)
 * - Preview modal
 * - Sign dialog
 * - Snackbar notifications
 * 
 * 🔄 API: GET /api/Invoice/hodInvoices
 */

import { useState, useMemo, useEffect, useRef } from 'react'
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import AddIcon from '@mui/icons-material/Add'
import SendIcon from '@mui/icons-material/Send'
import DrawIcon from '@mui/icons-material/Draw'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import EmailIcon from '@mui/icons-material/Email'
import PrintIcon from '@mui/icons-material/Print'
import RestoreIcon from '@mui/icons-material/Restore'
import FindReplaceIcon from '@mui/icons-material/FindReplace'
import CancelIcon from '@mui/icons-material/Cancel'
import LinkIcon from '@mui/icons-material/Link'
import { Link, useNavigate } from 'react-router-dom'
import InvoiceFilter, { InvoiceFilterState } from '@/components/InvoiceFilter'
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal'
import invoiceService, { InvoiceListItem, INVOICE_TYPE, getInvoiceTypeLabel, getInvoiceTypeColor } from '@/services/invoiceService'
import templateService from '@/services/templateService'
import customerService from '@/services/customerService'
import Spinner from '@/components/Spinner'
import { useAuthContext } from '@/context/useAuthContext'
import {
  INVOICE_INTERNAL_STATUS,
  INVOICE_INTERNAL_STATUS_LABELS,
  getInternalStatusColor,
  TAX_AUTHORITY_STATUS,
  getTaxStatusLabel,
  getTaxStatusColor,
  isTaxStatusError,
} from '@/constants/invoiceStatus'

// Định nghĩa kiểu dữ liệu hiển thị trên UI
export interface Invoice {
  id: string
  invoiceNumber: string
  symbol: string
  customerName: string
  taxCode: string
  taxAuthority: string
  issueDate: string
  internalStatusId: number
  internalStatus: string
  taxStatusId: number | null
  taxStatus: string
  taxStatusCode: string | null
  amount: number
  
  // Invoice type fields
  invoiceType: number
  originalInvoiceID: number | null
  originalInvoiceNumber?: number
  originalInvoiceSignDate?: string | null
  originalInvoiceSymbol?: string | null
  adjustmentReason?: string | null
  replacementReason?: string | null
  cancellationReason?: string | null
  explanationText?: string | null
}

// Mapper từ backend response sang UI format
const mapInvoiceToUI = (
  item: InvoiceListItem,
  templateMap: Map<number, string>,
  customerMap: Map<number, { name: string; taxCode: string }>
): Invoice => {
  const template = templateMap.get(item.templateID)
  const customer = customerMap.get(item.customerID)
  
  let taxStatusId: number | null = null
  let taxStatusLabel = 'Chưa gửi CQT'
  
  if (item.taxApiStatusID !== null && item.taxApiStatusID !== undefined) {
    taxStatusId = item.taxApiStatusID
    taxStatusLabel = item.taxStatusName || getTaxStatusLabel(item.taxApiStatusID)
  } else if (item.taxAuthorityCode) {
    taxStatusId = TAX_AUTHORITY_STATUS.ACCEPTED
    taxStatusLabel = 'Đã cấp mã'
  } else {
    taxStatusId = TAX_AUTHORITY_STATUS.NOT_SENT
    taxStatusLabel = 'Chưa gửi CQT'
  }
  
  return {
    id: item.invoiceID.toString(),
    invoiceNumber: item.invoiceNumber?.toString() || '0',
    symbol: template || '',
    customerName: customer?.name || '',
    taxCode: customer?.taxCode || '',
    taxAuthority: item.taxAuthorityCode || '',
    issueDate: item.createdAt,
    internalStatusId: item.invoiceStatusID,
    internalStatus: INVOICE_INTERNAL_STATUS_LABELS[item.invoiceStatusID] || `Không xác định (ID: ${item.invoiceStatusID})`,
    taxStatusId: taxStatusId,
    taxStatus: taxStatusLabel,
    taxStatusCode: item.taxStatusCode || null,
    amount: item.totalAmount,
    
    invoiceType: item.invoiceType || INVOICE_TYPE.ORIGINAL,
    originalInvoiceID: item.originalInvoiceID,
    originalInvoiceNumber: item.originalInvoiceNumber,
    originalInvoiceSignDate: item.originalInvoiceSignDate,
    originalInvoiceSymbol: item.originalInvoiceSymbol,
    adjustmentReason: item.adjustmentReason,
    replacementReason: item.replacementReason,
    cancellationReason: item.cancellationReason,
    explanationText: item.explanationText,
  }
}

// Component menu thao tác cho mỗi hóa đơn
interface InvoiceActionsMenuProps {
  invoice: Invoice
  onSendForApproval: (id: string) => void
  onSign: (id: string, invoiceNumber: string) => void
  onIssue: (id: string, invoiceNumber: string) => void
  onResendToTax: (id: string, invoiceNumber: string) => void
  onCancel: (id: string, invoiceNumber: string) => void
  onPrintInvoice: (id: string, invoiceNumber: string) => void
  onDownloadPDF: (id: string, invoiceNumber: string) => void
  isSending: boolean
}

const InvoiceActionsMenu = ({ invoice, onSendForApproval, onSign, onIssue, onResendToTax, onCancel, onPrintInvoice, onDownloadPDF, isSending }: InvoiceActionsMenuProps) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Xác định trạng thái hóa đơn theo luồng mới
  const isDraft = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.DRAFT // 1
  const isPendingApproval = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_APPROVAL // 6
  const isApproved = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.APPROVED // 9
  const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7 - Chờ ký
  const isSignedPendingIssue = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED_PENDING_ISSUE // 8 - Đã ký, chờ phát hành
  const isSigned = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED // 10 - Đã ký, chưa phát hành
  const isIssued = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.ISSUED // 2 - Đã phát hành
  
  // ⚠️ Kiểm tra lỗi gửi CQT từ Tax Status (không phải Internal Status)
  const hasTaxError = invoice.taxStatusId !== null && isTaxStatusError(invoice.taxStatusId)
  
  // 🔍 Kiểm tra có số hóa đơn chưa - Xử lý cả number và string
  const hasInvoiceNumber = (() => {
    if (!invoice.invoiceNumber) return false
    // Backend có thể trả về number 0 hoặc string '0'
    if (typeof invoice.invoiceNumber === 'number') {
      return invoice.invoiceNumber > 0
    }
    // Nếu là string
    const numStr = invoice.invoiceNumber.toString().trim()
    return numStr !== '' && numStr !== '0'
  })()
  
  // 🎯 Logic hiển thị nút "Ký số" và "Phát hành"
  // ✅ Backend đã sửa: /sign API cấp số luôn
  // 
  // - Ký số: Cho phép khi:
  //   + Status = 7 (PENDING_SIGN) - Chờ ký
  //   + HOẶC Status = 9 (APPROVED) - Đã duyệt
  //   + VÀ CHƯƠ CÓ SỐ (chưa ký)
  // 
  // - Phát hành: Cho phép khi:
  //   + Status = 8 (SIGNED_PENDING_ISSUE) - Đã ký, chờ phát hành
  //   + HOẶC Status = 10 (SIGNED) - Đã ký (backend có thể dùng status này)
  //   + VÀ ĐÃ CÓ SỐ (đã ký rồi mới phát hành được)
  const canSign = (isPendingSign || isApproved) && !hasInvoiceNumber
  const canIssue = (isSignedPendingIssue || isSigned) && hasInvoiceNumber
  const canCancel = isPendingApproval || isPendingSign // Có thể hủy khi Chờ duyệt HOẶC Chờ ký

  const menuItems = [
    {
      label: 'Xem chi tiết',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      enabled: true,
      action: () => {
        // Link sẽ được xử lý riêng
        handleClose()
      },
      color: 'primary.main',
      isLink: true,
      linkTo: `/invoices/${invoice.id}`,
    },
    {
      label: 'Chỉnh sửa',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: isDraft,
      action: () => {
        console.log('Chỉnh sửa:', invoice.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Gửi duyệt',
      icon: <SendIcon fontSize="small" />,
      enabled: isDraft && !isSending,
      action: () => {
        onSendForApproval(invoice.id)
        handleClose()
      },
      color: 'success.main',
    },
    {
      label: 'Ký số',
      icon: <DrawIcon fontSize="small" />,
      enabled: canSign,
      action: () => {
        onSign(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'secondary.main',
      tooltip: 'Ký chữ ký số điện tử vào hóa đơn',
    },
    {
      label: '🚀 Phát hành',
      icon: <SendIcon fontSize="small" />,
      enabled: canIssue,
      action: () => {
        onIssue(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'success.main',
      tooltip: 'Cấp số hóa đơn và gửi lên Cơ quan Thuế',
    },
    { divider: true },
    {
      label: 'Gửi email',
      icon: <EmailIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('Gửi email:', invoice.id)
        handleClose()
      },
      color: 'info.main',
    },
    {
      label: 'In hóa đơn',
      icon: <PrintIcon fontSize="small" />,
      enabled: hasInvoiceNumber, // Chỉ in khi đã có số (đã ký)
      action: () => {
        onPrintInvoice(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'text.primary',
    },
    {
      label: 'Tải PDF',
      icon: <DownloadIcon fontSize="small" />,
      enabled: hasInvoiceNumber, // Chỉ tải khi đã có số (đã ký)
      action: () => {
        onDownloadPDF(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'text.primary',
    },
    { divider: true },
    {
      label: 'Gửi lại CQT',
      icon: <RestoreIcon fontSize="small" />,
      enabled: (isSigned || isIssued) && hasTaxError,
      action: () => {
        onResendToTax(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Tạo HĐ điều chỉnh',
      icon: <FindReplaceIcon fontSize="small" />,
      enabled: isIssued,
      action: () => {
        console.log('Tạo HĐ điều chỉnh:', invoice.id)
        navigate(`/invoices/${invoice.id}/adjust`)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Tạo HĐ thay thế',
      icon: <RestoreIcon fontSize="small" />,
      enabled: isIssued,
      action: () => {
        console.log('Tạo HĐ thay thế:', invoice.id)
        navigate(`/invoices/${invoice.id}/replace`)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Hủy',
      icon: <CancelIcon fontSize="small" />,
      enabled: canCancel,
      action: () => {
        onCancel(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'error.main',
    },
    {
      label: 'Xóa',
      icon: <DeleteOutlineIcon fontSize="small" />,
      enabled: isDraft,
      action: () => {
        console.log('Xóa:', invoice.id)
        handleClose()
      },
      color: 'error.main',
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
        {menuItems.map((item, index) => {
          if ('divider' in item) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          }

          if ('isLink' in item && item.isLink) {
            return (
              <MenuItem
                key={item.label}
                component={Link}
                to={item.linkTo || '#'}
                disabled={!item.enabled}
                sx={{
                  py: 1.25,
                  px: 2.5,
                  gap: 1.5,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                  '&:hover': item.enabled ? {
                    backgroundColor: 'action.hover',
                    transform: 'translateX(4px)',
                  } : {},
                  '&.Mui-disabled': {
                    opacity: 0.4,
                  },
                  cursor: item.enabled ? 'pointer' : 'not-allowed',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: item.enabled ? item.color : 'text.disabled',
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
                    fontWeight: item.enabled ? 500 : 400,
                    letterSpacing: '0.01em',
                    color: item.enabled ? 'text.primary' : 'text.disabled',
                  }}
                />
              </MenuItem>
            )
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
                '&:hover': item.enabled ? {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(4px)',
                } : {},
                '&.Mui-disabled': {
                  opacity: 0.4,
                },
                cursor: item.enabled ? 'pointer' : 'not-allowed',
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.enabled ? item.color : 'text.disabled',
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
                  fontWeight: item.enabled ? 500 : 400,
                  letterSpacing: '0.01em',
                  color: item.enabled ? 'text.primary' : 'text.disabled',
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

const HODInvoiceManagement = () => {
  const navigate = useNavigate()
  const authContext = useAuthContext()
  
  // State quản lý data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // State quản lý dialog ký số
  const [signDialog, setSignDialog] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
  })
  const [isSigningInvoice, setIsSigningInvoice] = useState(false)
  const signingInProgress = useRef<Set<number>>(new Set())
  
  // State quản lý preview modal
  const [previewModal, setPreviewModal] = useState({
    open: false,
    invoiceId: 0,
    invoiceNumber: '',
    invoiceType: 1,
    originalInvoiceNumber: undefined as number | undefined,
    adjustmentReason: undefined as string | undefined,
  })
  
  // State quản lý bộ lọc
  const [filters, setFilters] = useState<InvoiceFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    invoiceStatus: [],
    taxStatus: '',
    customer: null,
    project: null,
    invoiceType: [],
    amountFrom: '',
    amountTo: '',
  })

  // Load invoices từ API HOD
  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!authContext?.isAuthenticated) {
        setError('Vui lòng đăng nhập để xem danh sách hóa đơn')
        navigate('/auth/sign-in')
        return
      }
      
      // Load HOD invoices và data liên quan
      const [invoicesData, templatesData, customersData] = await Promise.all([
        invoiceService.getHODInvoices(), // ✅ Sử dụng API mới
        templateService.getAllTemplates(),
        customerService.getAllCustomers(),
      ])
      
      interface Template { templateID: number; serial: string }
      interface Customer { customerID: number; customerName: string; taxCode: string }
      
      const templateMap = new Map<number, string>(
        (templatesData as Template[]).map((t: Template) => [t.templateID, t.serial])
      )
      const customerMap = new Map<number, { name: string; taxCode: string }>(
        (customersData as Customer[]).map((c: Customer) => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      const mappedData = invoicesData.map((item: InvoiceListItem) => mapInvoiceToUI(item, templateMap, customerMap))
      setInvoices(mappedData)
    } catch (err) {
      console.error('Failed to load HOD invoices:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handler khi filter thay đổi
  const handleFilterChange = (newFilters: InvoiceFilterState) => {
    setFilters(newFilters)
  }

  // Handler khi reset filter
  const handleResetFilter = () => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      invoiceStatus: [],
      taxStatus: '',
      customer: null,
      project: null,
      invoiceType: [],
      amountFrom: '',
      amountTo: '',
    })
  }

  // Lọc invoices theo filters
  const filteredInvoices = useMemo(() => {
    let result = [...invoices]

    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.customerName.toLowerCase().includes(searchLower) ||
          inv.taxCode.toLowerCase().includes(searchLower) ||
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.symbol.toLowerCase().includes(searchLower)
      )
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter((inv) => dayjs(inv.issueDate).isAfter(dayjs(filters.dateFrom)))
    }
    if (filters.dateTo) {
      result = result.filter((inv) => dayjs(inv.issueDate).isBefore(dayjs(filters.dateTo)))
    }

    // Invoice status filter
    if (filters.invoiceStatus && filters.invoiceStatus.length > 0) {
      result = result.filter((inv) => filters.invoiceStatus.includes(String(inv.internalStatusId)))
    }

    // Tax status filter
    if (filters.taxStatus) {
      const taxStatusId = parseInt(filters.taxStatus)
      result = result.filter((inv) => inv.taxStatusId === taxStatusId)
    }

    // Invoice type filter
    if (filters.invoiceType && filters.invoiceType.length > 0) {
      result = result.filter((inv) => filters.invoiceType.includes(String(inv.invoiceType)))
    }

    // Amount range filter
    if (filters.amountFrom) {
      const minAmount = parseFloat(filters.amountFrom)
      if (!isNaN(minAmount)) {
        result = result.filter((inv) => inv.amount >= minAmount)
      }
    }
    if (filters.amountTo) {
      const maxAmount = parseFloat(filters.amountTo)
      if (!isNaN(maxAmount)) {
        result = result.filter((inv) => inv.amount <= maxAmount)
      }
    }

    return result
  }, [invoices, filters])

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Handler gửi duyệt
  const handleSendForApproval = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      
      await invoiceService.sendForApproval(parseInt(invoiceId))
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi hóa đơn cho Kế toán trưởng duyệt!`,
        severity: 'success',
      })
      
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Gửi duyệt thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Handler ký số (mở dialog)
  const handleOpenSignDialog = (invoiceId: string, invoiceNumber: string) => {
    setSignDialog({
      open: true,
      invoiceId,
      invoiceNumber,
    })
  }

  const handleCloseSignDialog = () => {
    setSignDialog({
      open: false,
      invoiceId: '',
      invoiceNumber: '',
    })
  }

  const handleConfirmSign = async () => {
    const { invoiceId, invoiceNumber } = signDialog
    const invoiceIdNum = parseInt(invoiceId)

    if (signingInProgress.current.has(invoiceIdNum)) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Invoice ${invoiceId} is already being signed. Skipping...`)
      }
      return
    }

    try {
      setIsSigningInvoice(true)
      signingInProgress.current.add(invoiceIdNum)
      
      if (import.meta.env.DEV) {
        console.log(`✍️ Ký số hóa đơn ${invoiceNumber}...`)
      }
      
      const userId = authContext?.user?.id || 1
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
      await invoiceService.signInvoice(invoiceIdNum, userIdNum)
      
      setSnackbar({
        open: true,
        message: `✅ Đã ký số hóa đơn ${invoiceNumber} thành công! Bây giờ bạn có thể phát hành.`,
        severity: 'success',
      })
      
      handleCloseSignDialog()
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Ký số thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    } finally {
      setIsSigningInvoice(false)
      signingInProgress.current.delete(invoiceIdNum)
    }
  }

  // Handler phát hành hóa đơn
  const handleIssueInvoice = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      const userId = authContext?.user?.id
      if (!userId) {
        throw new Error('User ID không tồn tại')
      }
      
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
      
      const currentInvoice = invoices.find(inv => inv.id === invoiceId)
      if (!currentInvoice) {
        throw new Error('Không tìm thấy hóa đơn')
      }
      
      if (!currentInvoice.invoiceNumber || currentInvoice.invoiceNumber === '0') {
        throw new Error('❌ Hóa đơn chưa được ký số và cấp số. Vui lòng ký số trước khi phát hành!')
      }
      
      const taxCode = await invoiceService.submitToTaxAuthority(parseInt(invoiceId))
      await invoiceService.issueInvoice(parseInt(invoiceId), userIdNum)
      
      setSnackbar({
        open: true,
        message: `✅ Đã phát hành hóa đơn thành công!\n📋 Số hóa đơn: ${currentInvoice.invoiceNumber}\n🏛️ Mã CQT: ${taxCode}`,
        severity: 'success',
      })
      
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Phát hành thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Handler gửi lại CQT
  const handleResendToTax = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setSubmittingId(invoiceId)
      
      const taxCode = await invoiceService.submitToTaxAuthority(parseInt(invoiceId))
      await invoiceService.markIssued(parseInt(invoiceId), taxCode)
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi lại hóa đơn ${invoiceNumber} thành công!\nMã CQT: ${taxCode}`,
        severity: 'success',
      })
      
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Gửi lại cơ quan thuế thất bại.\n${err instanceof Error ? err.message : 'Vui lòng kiểm tra lại.'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Handler hủy hóa đơn
  const handleCancelInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      if (!window.confirm(`Bạn có chắc chắn muốn hủy hóa đơn ${invoiceNumber || invoiceId}?\nHóa đơn sẽ quay về trạng thái Nháp.`)) {
        return
      }
      
      await invoiceService.cancelInvoice(parseInt(invoiceId))
      
      setSnackbar({
        open: true,
        message: `✅ Đã hủy hóa đơn ${invoiceNumber || invoiceId}!`,
        severity: 'success',
      })
      
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Hủy hóa đơn thất bại.\n${err instanceof Error ? err.message : 'Vui lòng thử lại.'}`,
        severity: 'error',
      })
    }
  }

  // Handler xem preview & in hóa đơn
  const handlePrintInvoice = (invoiceId: string, invoiceNumber: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    
    setPreviewModal({
      open: true,
      invoiceId: parseInt(invoiceId),
      invoiceNumber: invoiceNumber,
      invoiceType: invoice?.invoiceType || 1,
      originalInvoiceNumber: invoice?.originalInvoiceNumber,
      adjustmentReason: invoice?.adjustmentReason || undefined,
    })
  }

  // Handler tải xuống PDF
  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setSubmittingId(invoiceId)
      
      await invoiceService.saveInvoicePDF(parseInt(invoiceId), invoiceNumber)
      
      setSnackbar({
        open: true,
        message: `✅ Đã tải xuống hóa đơn ${invoiceNumber}.pdf`,
        severity: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Không thể tải PDF.\n${err instanceof Error ? err.message : 'Vui lòng thử lại.'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }



  // Định nghĩa columns
  const columns: GridColDef[] = [
    {
      field: 'symbol',
      headerName: 'Ký hiệu',
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        if (!value) return (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#bdbdbd', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}
          >
            -
          </Typography>
        )
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
            {value}
          </Typography>
        )
      },
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'taxCode',
      headerName: 'Mã số thuế',
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        if (!value) return (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#bdbdbd', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}
          >
            -
          </Typography>
        )
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
            {value}
          </Typography>
        )
      },
    },
    {
      field: 'issueDate',
      headerName: 'Ngày phát hành',
      flex: 1,
      minWidth: 130,
      sortable: true,
      type: 'date',
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value: string) => new Date(value),
      renderCell: (params: GridRenderCellParams) => dayjs(params.value as Date).format('DD/MM/YYYY'),
    },
    {
      field: 'internalStatus',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const statusId = params.row.internalStatusId
        return (
          <Chip 
            label={params.value as string} 
            color={getInternalStatusColor(statusId)} 
            size="small" 
            sx={{ fontWeight: 600 }}
          />
        )
      },
    },
    {
      field: 'taxStatus',
      headerName: 'Trạng thái CQT',
      flex: 1.2,
      minWidth: 160,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const taxStatusId = params.row.taxStatusId
        const taxStatusCode = params.row.taxStatusCode
        const isError = taxStatusId !== null && isTaxStatusError(taxStatusId)
        
        const tooltipContent = (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Trạng thái: {params.value as string}
            </Typography>
            {taxStatusCode && (
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                Mã: {taxStatusCode}
              </Typography>
            )}
            {isError && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#ffeb3b' }}>
                ⚠️ Cần xử lý hoặc gửi lại
              </Typography>
            )}
          </Box>
        )
        
        return (
          <Tooltip title={tooltipContent} arrow placement="top">
            <Chip 
              label={params.value as string} 
              color={getTaxStatusColor(taxStatusId)} 
              size="small"
              sx={{ 
                fontWeight: 600,
                cursor: 'help',
                ...(isError && {
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.8 },
                  },
                }),
              }}
            />
          </Tooltip>
        )
      },
    },
    {
      field: 'invoiceType',
      headerName: 'Loại HĐ',
      flex: 1,
      minWidth: 200,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const invoiceType = params.row.invoiceType as number
        const originalInvoiceID = params.row.originalInvoiceID as number | null
        const originalInvoiceNumber = params.row.originalInvoiceNumber as number | undefined
        const originalInvoiceSignDate = params.row.originalInvoiceSignDate as string | null | undefined
        const originalInvoiceSymbol = params.row.originalInvoiceSymbol as string | null | undefined
        const adjustmentReason = params.row.adjustmentReason as string | null | undefined
        const replacementReason = params.row.replacementReason as string | null | undefined
        const cancellationReason = params.row.cancellationReason as string | null | undefined
        const explanationText = params.row.explanationText as string | null | undefined
        
        const label = getInvoiceTypeLabel(invoiceType)
        const color = getInvoiceTypeColor(invoiceType)
        
        const badgeColorMap: Record<string, { bg: string; text: string; border: string }> = {
          'default': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
          'warning': { bg: '#fef3c7', text: '#f59e0b', border: '#fcd34d' },
          'info': { bg: '#dbeafe', text: '#3b82f6', border: '#93c5fd' },
          'error': { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' },
          'secondary': { bg: '#f3e8ff', text: '#9c27b0', border: '#d8b4fe' },
        }
        const badgeColors = badgeColorMap[color] || badgeColorMap['default']
        
        const formatDate = (dateStr?: string | null): string | null => {
          if (!dateStr) return null
          try {
            return dayjs(dateStr).format('DD/MM/YYYY')
          } catch {
            return null
          }
        }
        
        const isLinkedInvoice = invoiceType === 2 || invoiceType === 3 || invoiceType === 4 || invoiceType === 5
        
        let tooltipContent: React.ReactNode = null
        if (isLinkedInvoice) {
          const actionText = 
            invoiceType === 2 ? '📝 Hóa đơn điều chỉnh' :
            invoiceType === 3 ? '🔄 Hóa đơn thay thế' :
            invoiceType === 4 ? '❌ Hóa đơn hủy' :
            invoiceType === 5 ? '📋 Hóa đơn giải trình' : ''
          
          const reason = 
            invoiceType === 2 ? adjustmentReason :
            invoiceType === 3 ? replacementReason :
            invoiceType === 4 ? cancellationReason :
            invoiceType === 5 ? explanationText : null
          
          const formattedDate = formatDate(originalInvoiceSignDate)
          
          tooltipContent = (
            <Box sx={{ py: 1, px: 0.5, minWidth: 280, maxWidth: 420 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, pb: 0.75, borderBottom: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {actionText}
              </Typography>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 0.75 }}>
                  Liên quan đến hóa đơn:
                </Typography>
                {originalInvoiceNumber && originalInvoiceNumber > 0 ? (
                  <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.4, pl: 1 }}>
                    • Số HĐ: <strong>{originalInvoiceNumber}</strong>
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.4, pl: 1, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                    • Số HĐ: <em>Chưa cấp số</em>
                  </Typography>
                )}
                {originalInvoiceSymbol && (
                  <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.4, pl: 1 }}>
                    • Ký hiệu: <strong>{originalInvoiceSymbol}</strong>
                  </Typography>
                )}
                {formattedDate && (
                  <Typography variant="body2" sx={{ fontSize: '13px', pl: 1 }}>
                    • Ngày ký: <strong>{formattedDate}</strong>
                  </Typography>
                )}
              </Box>
              
              {reason && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 0.75 }}>
                    Lý do:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '12.5px', 
                      fontStyle: 'italic',
                      pl: 1,
                      color: 'rgba(255,255,255,0.95)',
                      lineHeight: 1.5,
                    }}
                  >
                    "{reason}"
                  </Typography>
                </Box>
              )}
              
              {/* Action hint */}
              <Divider sx={{ my: 0.75, borderColor: 'rgba(255,255,255,0.2)' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '11px', 
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {originalInvoiceID ? '💡 Click để xem chi tiết hóa đơn gốc' : 'ℹ️ Chưa liên kết hóa đơn gốc'}
              </Typography>
            </Box>
          )
        }
        
        if (invoiceType === 1) {
          return (
            <Chip
              label={label}
              size="small"
              sx={{
                bgcolor: badgeColors.bg,
                color: badgeColors.text,
                border: `1px solid ${badgeColors.border}`,
                fontWeight: 600,
                fontSize: '12px',
                height: 28,
                borderRadius: '20px',
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
          )
        }
        
        if (originalInvoiceID) {
          return (
            <Tooltip 
              title={tooltipContent}
              arrow
              placement="top"
            >
              <Box
                component={Link}
                to={`/invoices/${originalInvoiceID}`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  bgcolor: badgeColors.bg,
                  border: `1px solid ${badgeColors.border}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${badgeColors.border}`,
                    bgcolor: badgeColors.bg,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: badgeColors.text,
                    fontWeight: 600,
                    fontSize: '12px',
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <LinkIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: '#1976d2',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>
          )
        }
        
        return (
          <Tooltip title={tooltipContent} arrow placement="top">
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, padding: '6px 14px', borderRadius: '20px', bgcolor: badgeColors.bg, border: `1px solid ${badgeColors.border}` }}>
              <Typography variant="body2" sx={{ color: badgeColors.text, fontWeight: 600, fontSize: '12px', lineHeight: 1.2 }}>
                {label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(200, 200, 200, 0.5)', backdropFilter: 'blur(4px)' }}>
                <LinkIcon sx={{ fontSize: 16, color: '#9e9e9e', opacity: 0.6 }} />
              </Box>
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'amount',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%',
          }}
        >
          {formatCurrency(params.value as number)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 80,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const isSending = submittingId === params.row.id
        
        return (
          <InvoiceActionsMenu
            invoice={params.row as Invoice}
            onSendForApproval={handleSendForApproval}
            onSign={handleOpenSignDialog}
            onIssue={handleIssueInvoice}
            onResendToTax={handleResendToTax}
            onCancel={handleCancelInvoice}
            onPrintInvoice={handlePrintInvoice}
            onDownloadPDF={handleDownloadPDF}
            isSending={isSending}
          />
        )
      },
    },
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                📋 Quản lý Hóa đơn (Kế toán trưởng)
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Danh sách hóa đơn cần xử lý bởi Kế toán trưởng
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/newinvoices')}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
                },
              }}>
              Tạo hóa đơn
            </Button>
          </Box>

          {/* Bộ lọc nâng cao */}
          <InvoiceFilter onFilterChange={handleFilterChange} onReset={handleResetFilter} />

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <Spinner />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Paper sx={{ p: 3, mt: 2, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
              <Typography color="error" variant="body1">
                {error}
              </Typography>
            </Paper>
          )}

          {/* Data Table */}
          {!loading && !error && (
            <Paper
              sx={{
                mt: 2,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              <DataGrid
                rows={filteredInvoices}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
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
                  },
                }}
                autoHeight
              />
            </Paper>
          )}

          {/* Sign Invoice Dialog */}
          <Dialog open={signDialog.open} onClose={handleCloseSignDialog} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DrawIcon color="secondary" />
              ✍️ Ký số hóa đơn
            </DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Bước 1: Ký số điện tử</strong>
                <br />
                Hóa đơn sẽ được ký bằng chữ ký số điện tử. Sau đó bạn cần nhấn <strong>"Phát hành"</strong> để cấp số và gửi lên CQT.
              </Alert>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Hóa đơn:</strong> {signDialog.invoiceNumber || '<Chưa cấp số>'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nhấn <strong>"Ký số"</strong> để:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <li><Typography variant="body2">✍️ Ký số điện tử vào hóa đơn</Typography></li>
                <li><Typography variant="body2">📝 Chuyển sang trạng thái "Đã ký"</Typography></li>
                <li><Typography variant="body2">⏭️ Sau đó bạn cần nhấn "Phát hành" để cấp số và gửi CQT</Typography></li>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={handleCloseSignDialog} disabled={isSigningInvoice}>
                Hủy
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleConfirmSign}
                disabled={isSigningInvoice}
                startIcon={<DrawIcon />}
              >
                {isSigningInvoice ? 'Đang ký số...' : 'Ký số'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Invoice Preview Modal */}
          <InvoicePreviewModal
            open={previewModal.open}
            onClose={() => setPreviewModal({ ...previewModal, open: false })}
            invoiceId={previewModal.invoiceId}
            invoiceNumber={previewModal.invoiceNumber}
            invoiceType={previewModal.invoiceType}
            originalInvoiceNumber={previewModal.originalInvoiceNumber}
            adjustmentReason={previewModal.adjustmentReason}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default HODInvoiceManagement
