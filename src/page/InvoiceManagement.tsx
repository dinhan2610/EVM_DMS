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
import { Snackbar, Alert } from '@mui/material'
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
  symbol: string // Ký hiệu hoá đơn (template serial)
  customerName: string // Tên khách hàng
  taxCode: string // Mã số thuế khách hàng
  taxAuthority: string // Mã của CQT
  issueDate: string
  internalStatusId: number // ID trạng thái nội bộ (0-5)
  internalStatus: string // Label trạng thái nội bộ
  taxStatusId: number | null // ID trạng thái thuế CQT (từ TaxApiStatus)
  taxStatus: string // Label trạng thái thuế
  taxStatusCode: string | null // Mã trạng thái (PENDING, TB01, KQ01, etc.)
  amount: number
  
  // Invoice type fields
  invoiceType: number // 1=Gốc, 2=Điều chỉnh, 3=Thay thế, 4=Hủy, 5=Giải trình
  originalInvoiceID: number | null
  originalInvoiceNumber?: number
  originalInvoiceSignDate?: string | null // Ngày ký HĐ gốc
  originalInvoiceSymbol?: string | null   // Ký hiệu HĐ gốc
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
  
  // Xác định trạng thái thuế:
  // - Nếu có taxApiStatusID từ backend → dùng nó
  // - Nếu không có nhưng có taxAuthorityCode → legacy ACCEPTED
  // - Nếu không có gì → NOT_SENT
  let taxStatusId: number | null = null
  let taxStatusLabel = 'Chưa gửi CQT'
  
  if (item.taxApiStatusID !== null && item.taxApiStatusID !== undefined) {
    // Có tax API status ID từ backend
    taxStatusId = item.taxApiStatusID
    taxStatusLabel = item.taxStatusName || getTaxStatusLabel(item.taxApiStatusID)
  } else if (item.taxAuthorityCode) {
    // Legacy: có mã CQT nhưng chưa có taxApiStatusID
    taxStatusId = TAX_AUTHORITY_STATUS.ACCEPTED
    taxStatusLabel = 'Đã cấp mã'
  } else {
    // Chưa gửi CQT
    taxStatusId = TAX_AUTHORITY_STATUS.NOT_SENT
    taxStatusLabel = 'Chưa gửi CQT'
  }
  
  return {
    id: item.invoiceID.toString(),
    invoiceNumber: item.invoiceNumber?.toString() || '0', // ✅ Dùng invoiceNumber từ backend
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
    
    // Invoice type fields
    invoiceType: item.invoiceType || INVOICE_TYPE.ORIGINAL,
    originalInvoiceID: item.originalInvoiceID,
    originalInvoiceNumber: item.originalInvoiceNumber,
    originalInvoiceSignDate: item.originalInvoiceSignDate, // ✅ Từ backend
    originalInvoiceSymbol: item.originalInvoiceSymbol,     // ✅ Từ backend
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
  //   + VÀ CHƯA CÓ SỐ (chưa ký)
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

          // Nếu là link item
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

const InvoiceManagement = () => {
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
  
  // State quản lý bộ lọc - sử dụng InvoiceFilterState
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

  // Load invoices từ API
  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication first
      if (!authContext?.isAuthenticated) {
        setError('Vui lòng đăng nhập để xem danh sách hóa đơn')
        navigate('/auth/sign-in')
        return
      }
      
      // Load all data in parallel
      const [invoicesData, templatesData, customersData] = await Promise.all([
        invoiceService.getAllInvoices(),
        templateService.getAllTemplates(),
        customerService.getAllCustomers(),
      ])
      
      // Create maps for quick lookup
      const templateMap = new Map(
        templatesData.map(t => [t.templateID, t.serial])
      )
      const customerMap = new Map(
        customersData.map(c => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      // Map invoices with real data
      const mappedData = invoicesData.map(item => mapInvoiceToUI(item, templateMap, customerMap))
      setInvoices(mappedData)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
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

  // Gửi hóa đơn cho Kế toán trưởng (update status 1 -> 6)
  const handleSendForApproval = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      
      // Gọi API gửi duyệt
      await invoiceService.sendForApproval(parseInt(invoiceId))
      
      // Update UI optimistically
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, internalStatusId: 6, internalStatus: INVOICE_INTERNAL_STATUS_LABELS[6] }
          : inv
      ))
      
      setSnackbar({
        open: true,
        message: 'Đã gửi hóa đơn cho Kế toán trưởng',
        severity: 'success'
      })
      
      // Reload data
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Không thể gửi hóa đơn',
        severity: 'error'
      })
    } finally {
      setSubmittingId(null)
    }
  }
  
  // Handler mở dialog ký số
  const handleOpenSignDialog = (invoiceId: string, invoiceNumber: string) => {
    setSignDialog({
      open: true,
      invoiceId,
      invoiceNumber,
    })
  }
  
  // Handler đóng dialog ký số
  const handleCloseSignDialog = () => {
    setSignDialog({
      open: false,
      invoiceId: '',
      invoiceNumber: '',
    })
  }
  
  // Handler xác nhẫn ký số (CHỈ ký, không phát hành)
  const handleConfirmSign = async () => {
    const userId = parseInt(localStorage.getItem('userId') || '1')
    const invoiceId = parseInt(signDialog.invoiceId)
    
    // Check if already signing this invoice
    if (signingInProgress.current.has(invoiceId)) {
      console.warn(`🚫 Duplicate sign request blocked for invoice ${invoiceId}`)
      return
    }
    
    // Mark as in-progress
    signingInProgress.current.add(invoiceId)
    setIsSigningInvoice(true)
    
    try {
      // Ký số hóa đơn (service will fetch invoice + template internally)
      const signResponse = await invoiceService.signInvoice(invoiceId, userId)
      
      console.log('✅ Ký số thành công')
      console.log('🔍 signResponse.invoiceNumber:', signResponse.invoiceNumber, '(type:', typeof signResponse.invoiceNumber, ')')
      console.log('🔍 signResponse.invoiceStatusID:', signResponse.invoiceStatusID)
      
      // ⚠️ CRITICAL: Kiểm tra xem signResponse có invoiceNumber không
      if (!signResponse.invoiceNumber || signResponse.invoiceNumber === 0) {
        console.error('❌ LỖI: Backend /sign trả về invoiceNumber = 0!')
        console.error('📊 Full signResponse:', JSON.stringify(signResponse, null, 2))
      }
      
      // BƯỚC 2: Lấy lại thông tin hóa đơn mới nhất từ backend
      // Vì backend sign API không trả về full data
      const updatedInvoice = await invoiceService.getInvoiceById(invoiceId)
      
      console.log('📊 Backend trả về invoiceStatusID:', updatedInvoice.invoiceStatusID)
      console.log('📋 Invoice Number:', updatedInvoice.invoiceNumber, '(type:', typeof updatedInvoice.invoiceNumber, ')')
      console.log('🔐 Digital Signature:', updatedInvoice.digitalSignature ? 'Có' : 'Không')
      
      // ⚠️ CRITICAL CHECK: Kiểm tra invoiceNumber sau khi getInvoiceById
      if (!updatedInvoice.invoiceNumber || updatedInvoice.invoiceNumber === 0) {
        console.error('❌ LỖI NGHIÊM TRỌNG: Backend đã ký nhưng invoiceNumber vẫn là 0!')
        console.error('📊 Full invoice data:', JSON.stringify(updatedInvoice, null, 2))
        console.error('👉 Backend /sign API CHƯA cấp số! Cần kiểm tra lại backend code!')
        
        setSnackbar({
          open: true,
          message: '⚠️ Đã ký số thành công nhưng hệ thống CHƯA cấp số!\n🔑 Chữ ký số: Có\n📋 Số hóa đơn: 0 (chưa cấp)\n\n👉 Backend /sign API chưa cấp số. Liên hệ IT kiểm tra!',
          severity: 'error',
        })
        
        handleCloseSignDialog()
        await loadInvoices()
        return
      }
      
      console.log('Full invoice data:', JSON.stringify(updatedInvoice, null, 2))
      
      // BƯỚC 3: Reload danh sách để hiển thị trạng thái mới
      await loadInvoices()
      
      // ✅ Backend đã cấp số khi sign - hiển thị số cho user
      const invoiceNumberMsg = updatedInvoice.invoiceNumber && updatedInvoice.invoiceNumber > 0
        ? `\n📋 Số hóa đơn: ${updatedInvoice.invoiceNumber}`
        : ''
      
      setSnackbar({
        open: true,
        message: `✅ Đã ký số thành công!${invoiceNumberMsg}\n🔑 Hóa đơn đã có chữ ký số điện tử.\n➡️ Hãy nhấn "Phát hành" để gửi lên CQT.`,
        severity: 'success',
      })
      
      handleCloseSignDialog()
      
    } catch (err) {
      console.error('❌ Sign error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Lỗi không xác định'
      
      // RECOVERY: Check if invoice was actually signed despite error
      try {
        const recoveryCheck = await invoiceService.getInvoiceById(invoiceId)
        console.log('🔄 Recovery check - Status:', recoveryCheck.invoiceStatusID, 'Number:', recoveryCheck.invoiceNumber)
        
        // Case 1: Invoice has number now - sign was actually successful!
        if (recoveryCheck.invoiceNumber && recoveryCheck.invoiceNumber > 0) {
          console.log('✅ Recovery successful - Invoice was signed despite error')
          setSnackbar({
            open: true,
            message: `✅ Đã ký số thành công!\n📋 Số hóa đơn: ${recoveryCheck.invoiceNumber}\n🔑 Hóa đơn đã có chữ ký số điện tử.\n➡️ Hãy nhấn "Phát hành" để gửi lên CQT.`,
            severity: 'success',
          })
          handleCloseSignDialog()
          await loadInvoices()
          return
        }
        
        // Case 2: Status changed to 8 (SIGNED) but no invoice number yet
        // Backend signed but failed to generate number - retry will work!
        if (recoveryCheck.invoiceStatusID === 8 && (!recoveryCheck.invoiceNumber || recoveryCheck.invoiceNumber === 0)) {
          console.log('⚠️ Invoice signed (status=8) but no number generated - backend issue, retry recommended')
          setSnackbar({
            open: true,
            message: `⚠️ Backend đã ký nhưng chưa cấp số!\n🔑 Trạng thái: Đã ký (8)\n📋 Số hóa đơn: 0 (chưa cấp)\n\n🔄 Vui lòng nhấn "Ký số" lại một lần nữa để backend cấp số.`,
            severity: 'error',
          })
          handleCloseSignDialog()
          await loadInvoices()
          return
        }
      } catch (recoveryErr) {
        console.error('❌ Recovery check failed:', recoveryErr)
      }
      
      // Show original error
      setSnackbar({
        open: true,
        message: `❌ Ký số thất bại: ${errorMsg}`,
        severity: 'error',
      })
    } finally {
      setIsSigningInvoice(false)
      signingInProgress.current.delete(invoiceId)
    }
  }
  
  // Handler phát hành hóa đơn
  const handleIssueInvoice = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      const userId = parseInt(localStorage.getItem('userId') || '1')
      const id = parseInt(invoiceId)
      
      // Verify invoice is signed and has number
      const currentInvoice = await invoiceService.getInvoiceById(id)
      
      if (!currentInvoice.invoiceNumber || currentInvoice.invoiceNumber === 0) {
        throw new Error('❌ Hóa đơn chưa được ký số và cấp số. Vui lòng ký số trước khi phát hành!')
      }
      
      // Step 1: Submit to tax authority
      const taxCode = await invoiceService.submitToTaxAuthority(id)
      
      // Step 2: Issue invoice (change status to ISSUED)
      await invoiceService.issueInvoice(id, userId)
      
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
  
  // Handler gửi lại CQT (cho hóa đơn đã ký nhưng có lỗi Tax Status)
  const handleResendToTax = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setSubmittingId(invoiceId)
      
      console.log(`🔄 Gửi lại hóa đơn ${invoiceNumber} lên cơ quan thuế...`)
      
      const taxCode = await invoiceService.submitToTaxAuthority(parseInt(invoiceId))
      
      console.log('✅ Gửi lại thành công. Mã CQT:', taxCode)
      
      // Gửi thành công → Chuyển sang ISSUED (2) và lưu mã CQT
      await invoiceService.markIssued(parseInt(invoiceId), taxCode)
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi lại hóa đơn ${invoiceNumber} thành công!\nMã CQT: ${taxCode}`,
        severity: 'success',
      })
      
      // Reload data
      await loadInvoices()
      
    } catch (err) {
      // Gửi lại vẫn thất bại
      setSnackbar({
        open: true,
        message: `❌ Gửi lại cơ quan thuế thất bại.\n${err instanceof Error ? err.message : 'Vui lòng kiểm tra lại.'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Handler hủy hóa đơn (chuyển về DRAFT)
  const handleCancelInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      console.log(`🚫 Hủy hóa đơn ${invoiceNumber}...`)
      
      // Confirm trước khi hủy
      if (!window.confirm(`Bạn có chắc chắn muốn hủy hóa đơn ${invoiceNumber || invoiceId}?\nHóa đơn sẽ quay về trạng thái Nháp.`)) {
        return
      }
      
      await invoiceService.cancelInvoice(parseInt(invoiceId))
      
      setSnackbar({
        open: true,
        message: `✅ Đã hủy hóa đơn ${invoiceNumber || invoiceId}!`,
        severity: 'success',
      })
      
      // Reload data
      await loadInvoices()
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Hủy hóa đơn thất bại.\n${err instanceof Error ? err.message : 'Vui lòng thử lại.'}`,
        severity: 'error',
      })
    }
  }

  // 🆕 Handler xem preview & in hóa đơn (sử dụng modal)
  const handlePrintInvoice = (invoiceId: string, invoiceNumber: string) => {
    // Tìm invoice để lấy invoiceType
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

  // 🆕 Handler tải xuống PDF
  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      console.log(`📥 Đang tải PDF cho hóa đơn ${invoiceNumber}...`)
      
      setSubmittingId(invoiceId) // Show loading indicator
      
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
        if (!value) return <Typography variant="body2" sx={{ color: '#bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>-</Typography>
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
      align: 'center',
      headerAlign: 'center',
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
        if (!value) return <Typography variant="body2" sx={{ color: '#bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>-</Typography>
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
        
        // Tooltip content với thông tin chi tiết
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
        const label = getInvoiceTypeLabel(invoiceType)
        const color = getInvoiceTypeColor(invoiceType)
        
        // Badge color mapping
        const badgeColorMap: Record<string, { bg: string; text: string; border: string }> = {
          'default': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
          'warning': { bg: '#fef3c7', text: '#f59e0b', border: '#fcd34d' },
          'info': { bg: '#dbeafe', text: '#3b82f6', border: '#93c5fd' },
          'error': { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' },
          'secondary': { bg: '#f3e8ff', text: '#9c27b0', border: '#d8b4fe' },
        }
        
        const badgeColors = badgeColorMap[color] || badgeColorMap['default']
        
        // Format date helper
        const formatDate = (dateStr?: string | null): string | null => {
          if (!dateStr) return null
          try {
            return dayjs(dateStr).format('DD/MM/YYYY')
          } catch {
            return null
          }
        }
        
        // Build tooltip text for linked invoices (types 2, 3, 4, 5)
        const isLinkedInvoice = invoiceType === 2 || invoiceType === 3 || invoiceType === 4 || invoiceType === 5
        
        let tooltipContent = null
        if (isLinkedInvoice) {
          const adjustmentReason = params.row.adjustmentReason as string | null
          const replacementReason = params.row.replacementReason as string | null
          const cancellationReason = params.row.cancellationReason as string | null
          const explanationText = params.row.explanationText as string | null
          
          const actionText = 
            invoiceType === 2 ? '📝 Hóa đơn điều chỉnh' :
            invoiceType === 3 ? '🔄 Hóa đơn thay thế' :
            invoiceType === 4 ? '❌ Hóa đơn hủy' :
            invoiceType === 5 ? '📋 Hóa đơn giải trình' : ''
          
          // Get relevant reason based on invoice type
          const reason = 
            invoiceType === 2 ? adjustmentReason :
            invoiceType === 3 ? replacementReason :
            invoiceType === 4 ? cancellationReason :
            invoiceType === 5 ? explanationText : null
          
          const formattedDate = formatDate(originalInvoiceSignDate)
          
          tooltipContent = (
            <Box sx={{ py: 1, px: 0.5, minWidth: 280, maxWidth: 420 }}>
              {/* Header */}
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1.5, 
                  pb: 0.75,
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {actionText}
              </Typography>
              
              {/* Original Invoice Info - Always show if it's a linked invoice */}
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
              
              {/* Reason */}
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
        
        // If has original invoice ID, make it clickable with icon
        if (isLinkedInvoice && originalInvoiceID && tooltipContent) {
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
                  borderRadius: '20px', // Bo tròn mượt mà
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
        
        // If linked invoice type but NO originalInvoiceID, show badge with disabled icon
        if (isLinkedInvoice && !originalInvoiceID && tooltipContent) {
          return (
            <Tooltip 
              title={tooltipContent}
              arrow
              placement="top"
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  padding: '6px 14px',
                  borderRadius: '20px', // Bo tròn mượt mà
                  bgcolor: badgeColors.bg,
                  border: `1px solid ${badgeColors.border}`,
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
                    bgcolor: 'rgba(200, 200, 200, 0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <LinkIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: '#9e9e9e',
                      opacity: 0.6,
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>
          )
        }
        
        // Normal badge for original invoices (no link)
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
              borderRadius: '20px', // Bo tròn mượt mà
              '& .MuiChip-label': {
                px: 1.5,
              },
            }}
          />
        )
      },
    },
    {
      field: 'amount',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(params.value as number),
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

  // Logic lọc dữ liệu - tích hợp với InvoiceFilter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Lọc theo text search (số HĐ, ký hiệu, tên khách hàng, mã số thuế)
      const matchesSearch =
        !filters.searchText ||
        invoice.invoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.symbol.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.taxCode.toLowerCase().includes(filters.searchText.toLowerCase())

      // Lọc theo khoảng ngày
      const matchesDateFrom = !filters.dateFrom || dayjs(invoice.issueDate).isAfter(filters.dateFrom, 'day') || dayjs(invoice.issueDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo = !filters.dateTo || dayjs(invoice.issueDate).isBefore(filters.dateTo, 'day') || dayjs(invoice.issueDate).isSame(filters.dateTo, 'day')

      // Lọc theo trạng thái hóa đơn (multiselect)
      const matchesInvoiceStatus = filters.invoiceStatus.length === 0 || filters.invoiceStatus.includes(invoice.internalStatus)

      // Lọc theo trạng thái CQT
      const matchesTaxStatus = !filters.taxStatus || invoice.taxStatus === filters.taxStatus

      // Lọc theo khách hàng
      const matchesCustomer = !filters.customer || invoice.customerName === filters.customer

      // Lọc theo khoảng tiền
      const matchesAmountFrom = !filters.amountFrom || invoice.amount >= parseFloat(filters.amountFrom)
      const matchesAmountTo = !filters.amountTo || invoice.amount <= parseFloat(filters.amountTo)

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesInvoiceStatus &&
        matchesTaxStatus &&
        matchesCustomer &&
        matchesAmountFrom &&
        matchesAmountTo
      )
    })
  }, [invoices, filters])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                Quản lý Hóa đơn
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Quản lý và theo dõi các hóa đơn điện tử của doanh nghiệp
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
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
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
              {/* Table Section */}
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
                '& .MuiTablePagination-selectLabel': {
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#666',
                },
                '& .MuiTablePagination-displayedRows': {
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#666',
                },
                '& .MuiTablePagination-select': {
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiTablePagination-actions': {
                  marginLeft: '20px',
                  '& .MuiIconButton-root': {
                    padding: '8px',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                },
              }}
              autoHeight
            />
          </Paper>
        )}
        
        {/* Sign Invoice Dialog */}
        <Dialog
          open={signDialog.open}
          onClose={handleCloseSignDialog}
          maxWidth="sm"
          fullWidth>
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
              Hóa đơn đã được Kế toán trưởng duyệt. Nhấn <strong>"Ký số"</strong> để:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>
                <Typography variant="body2">✍️ Ký số điện tử vào hóa đơn</Typography>
              </li>
              <li>
                <Typography variant="body2">📝 Chuyển sang trạng thái "Đã ký"</Typography>
              </li>
              <li>
                <Typography variant="body2">⏭️ Sau đó bạn cần nhấn "Phát hành" để cấp số và gửi CQT</Typography>
              </li>
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
              startIcon={<DrawIcon />}>
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

export default InvoiceManagement