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
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'
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
  notes: string | null // ✅ Ghi chú (chứa lý do từ chối)
  
  // Contact info từ invoice (để gửi email)
  contactEmail: string | null // Email khách hàng
  contactPerson: string | null // Tên người liên hệ
  contactPhone: string | null // SĐT liên hệ
  
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
  
  // 🔍 DEBUG: Log nếu status không xác định
  const statusLabel = INVOICE_INTERNAL_STATUS_LABELS[item.invoiceStatusID]
  if (!statusLabel) {
    console.warn('⚠️ [mapInvoiceToUI] Unknown invoice status:', {
      invoiceID: item.invoiceID,
      invoiceNumber: item.invoiceNumber,
      invoiceStatusID: item.invoiceStatusID,
      availableStatuses: Object.keys(INVOICE_INTERNAL_STATUS_LABELS).join(', ')
    })
  }
  
  // ✅ Safeguard: Đảm bảo invoiceID luôn là số hợp lệ
  if (!item.invoiceID || isNaN(Number(item.invoiceID))) {
    throw new Error(`Invalid invoice data: invoiceID is ${item.invoiceID}`)
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
    internalStatus: statusLabel || `Không xác định (ID: ${item.invoiceStatusID})`,
    taxStatusId: taxStatusId,
    taxStatus: taxStatusLabel,
    taxStatusCode: item.taxStatusCode || null,
    amount: item.totalAmount,
    notes: item.notes || null,  // ✅ Map notes field
    
    // Contact info từ invoice (để gửi email)
    // ✅ Backend trả về customerEmail, không phải contactEmail
    contactEmail: item.customerEmail || item.contactEmail || null,
    contactPerson: item.contactPerson || null,
    contactPhone: item.contactPhone || null,
    
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
  onResendToTax: (id: string, invoiceNumber: string) => void
  onCancel: (id: string, invoiceNumber: string) => void
  onPrintInvoice: (id: string, invoiceNumber: string) => void
  isSending: boolean
  hasBeenAdjusted: boolean // Đã có hóa đơn điều chỉnh từ hóa đơn này chưa
  // Email modal props
  onOpenEmailModal: (invoice: Invoice) => void
}

const InvoiceActionsMenu = ({ invoice, onSendForApproval, onSign, onResendToTax, onCancel, onPrintInvoice, isSending, hasBeenAdjusted, onOpenEmailModal }: InvoiceActionsMenuProps) => {
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
  const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7 - Chờ ký (sau khi KTT duyệt)
  const isSigned = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED // 8 - Đã ký
  const isIssued = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.ISSUED // 2 - Đã phát hành
  const isRejected = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.REJECTED // 16 - Bị từ chối
  
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
  
  // 🎯 Logic hiển thị nút "Ký số & Phát hành" (Gộp 1 bước)
  // ✅ Backend đã sửa: /sign API cấp số luôn
  // 
  // - Ký số & Phát hành: Cho phép khi:
  //   + Status = 7 (PENDING_SIGN) - Chờ ký (sau khi KTT duyệt)
  //   + HOẶC Status = 8 (SIGNED) - Đã ký, có thể phát hành lại
  //   + VÀ CHƯA CÓ SỐ (chưa ký)
  //   ➡️ Sau khi ký xong → TỰ ĐỘNG gửi CQT và phát hành
  // 
  // - Phát hành (fallback): Chỉ hiển thị khi:
  //   + Status = 8 (SIGNED) - Đã ký, chờ phát hành
  //   + VÀ ĐÃ CÓ SỐ (đã ký rồi)
  //   ➡️ Trường hợp ký thành công nhưng chưa phát hành (lỗi, gián đoạn)
  const canSignAndIssue = (isPendingSign || isSigned) && !hasInvoiceNumber // ⚡ Gộp 1 bước
  const canCancel = isPendingApproval || isPendingSign // Có thể hủy khi Chờ duyệt HOẶC Chờ ký
  
  // 📋 Logic "Tạo HĐ điều chỉnh"
  // Điều kiện:
  // 1. Hóa đơn đã phát hành (isIssued)
  // 2. Chưa có hóa đơn điều chỉnh con (!hasBeenAdjusted)
  // 3. Chính nó KHÔNG phải là hóa đơn điều chỉnh (invoiceType !== ADJUSTMENT)
  const isAdjustmentInvoice = invoice.invoiceType === INVOICE_TYPE.ADJUSTMENT
  const canAdjust = isIssued && !hasBeenAdjusted && !isAdjustmentInvoice

  const menuItems = [
    {
      label: 'Chỉnh sửa',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: isDraft || isRejected, // ✅ Cho phép edit cả Draft và Rejected
      action: () => {
        console.log('Chỉnh sửa hóa đơn:', invoice.id)
        // ✅ Navigate đến trang create-invoice với mode edit
        navigate(`/create-invoice?mode=edit&id=${invoice.id}`)
        handleClose()
      },
      color: 'primary.main',
      tooltip: isRejected 
        ? 'Chỉnh sửa hóa đơn bị từ chối theo yêu cầu của KTT'
        : 'Chỉnh sửa hóa đơn nháp',
    },
    {
      label: isRejected ? '🔄 Gửi lại duyệt' : 'Gửi duyệt',
      icon: <SendIcon fontSize="small" />,
      enabled: (isDraft || isRejected) && !isSending,
      action: () => {
        onSendForApproval(invoice.id)
        handleClose()
      },
      color: isRejected ? 'warning.main' : 'success.main',
      tooltip: isRejected 
        ? 'Gửi lại hóa đơn sau khi đã sửa theo yêu cầu của KTT'
        : 'Gửi hóa đơn cho Kế toán trưởng duyệt',
    },
    {
      label: '⚡ Ký số & Phát hành',
      icon: <SendIcon fontSize="small" />,
      enabled: canSignAndIssue,
      action: () => {
        onSign(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'success.main',
      tooltip: 'Ký chữ ký số điện tử và phát hành hóa đơn (1 bước)',
    },
    { divider: true },
    {
      label: 'Gửi email',
      icon: <EmailIcon fontSize="small" />,
      enabled: true, // ✅ Luôn dùng được
      action: () => {
        onOpenEmailModal(invoice)
        handleClose()
      },
      color: 'info.main',
      tooltip: 'Gửi hóa đơn qua email cho khách hàng',
    },
    {
      label: 'In hóa đơn',
      icon: <PrintIcon fontSize="small" />,
      enabled: true, // ✅ Luôn dùng được
      action: () => {
        onPrintInvoice(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'text.primary',
      tooltip: 'In hóa đơn để kiểm tra hoặc lưu trữ',
    },
    { divider: true },
    {
      label: 'Gửi lại CQT',
      icon: <RestoreIcon fontSize="small" />,
      enabled: isIssued && hasTaxError,
      action: () => {
        onResendToTax(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'warning.main',
      tooltip: 'Gửi lại hóa đơn lên Cơ quan Thuế khi có lỗi',
    },
    {
      label: 'Tạo HĐ điều chỉnh',
      icon: <FindReplaceIcon fontSize="small" />,
      enabled: canAdjust,
      action: () => {
        console.log('Tạo HĐ điều chỉnh:', invoice.id)
        navigate(`/invoices/${invoice.id}/adjust`)
        handleClose()
      },
      color: 'warning.main',
      tooltip: isAdjustmentInvoice
        ? '⚠️ Hóa đơn điều chỉnh không thể điều chỉnh tiếp'
        : hasBeenAdjusted 
          ? '⚠️ Hóa đơn này đã được điều chỉnh rồi (chỉ được điều chỉnh 1 lần)'
          : 'Tạo hóa đơn điều chỉnh từ hóa đơn gốc đã phát hành',
    },
    {
      label: 'Tạo HĐ thay thế',
      icon: <RestoreIcon fontSize="small" />,
      enabled: isIssued, // ✅ Thay thế bao nhiêu lần cũng được
      action: () => {
        console.log('Tạo HĐ thay thế:', invoice.id)
        navigate(`/invoices/${invoice.id}/replace`)
        handleClose()
      },
      color: 'warning.main',
      tooltip: 'Tạo hóa đơn thay thế (không giới hạn số lần)',
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
  
  // 📊 Pagination state
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  })
  
  // State quản lý dialog ký số
  const [signDialog, setSignDialog] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
  })
  const [isSigningInvoice, setIsSigningInvoice] = useState(false)
  const [signingProgress, setSigningProgress] = useState<{
    step: 'signing' | 'submitting' | 'issuing'
    message: string
  } | null>(null)
  const [autoIssueAfterSign, setAutoIssueAfterSign] = useState(false) // ⚡ Tự động phát hành sau khi ký
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
  
  // State quản lý send email modal
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null)
  
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
      
      console.log('📊 [InvoiceManagement] Loaded data:', {
        totalInvoices: invoicesData.length,
        totalTemplates: templatesData.length,
        totalCustomers: customersData.length,
      })
      
      console.log('📊 [InvoiceManagement] Loaded data:', {
        totalInvoices: invoicesData.length,
        totalTemplates: templatesData.length,
        totalCustomers: customersData.length,
      })
      
      // Create maps for quick lookup
      const templateMap = new Map(
        templatesData.map(t => [t.templateID, t.serial])
      )
      const customerMap = new Map(
        customersData.map(c => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      // Map invoices with real data
      let mappedData = invoicesData.map(item => mapInvoiceToUI(item, templateMap, customerMap))
      
      // ✅ Preload notes cho các hóa đơn REJECTED (để hiển thị lý do từ chối trong tooltip)
      const rejectedInvoices = mappedData.filter(inv => inv.internalStatusId === INVOICE_INTERNAL_STATUS.REJECTED)
      if (rejectedInvoices.length > 0) {
        // Fetch notes từ detail API cho từng rejected invoice
        const notesPromises = rejectedInvoices.map(async (inv) => {
          try {
            const detail = await invoiceService.getInvoiceById(parseInt(inv.id))
            return { id: inv.id, notes: detail.notes }
          } catch (err) {
            console.error(`Failed to load notes for invoice ${inv.id}:`, err)
            return { id: inv.id, notes: null }
          }
        })
        
        const notesResults = await Promise.all(notesPromises)
        const notesMap = new Map(notesResults.map(r => [r.id, r.notes]))
        
        // ⚡ Create NEW array với notes merged (để trigger React re-render)
        mappedData = mappedData.map(inv => {
          if (notesMap.has(inv.id)) {
            return { ...inv, notes: notesMap.get(inv.id) || null }
          }
          return inv
        })
      }
      
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

  // ✅ Gửi hóa đơn cho Kế toán trưởng (update status 1/16 -> 6)
  // Xử lý cả Draft (1→6) và Rejected (16→6) bằng 1 function
  const handleSendForApproval = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      
      // Kiểm tra xem có phải resubmit không
      const invoice = invoices.find(inv => inv.id === invoiceId)
      const isResubmit = invoice?.internalStatusId === INVOICE_INTERNAL_STATUS.REJECTED
      
      // Gọi API gửi duyệt (tự động thêm notes nếu resubmit)
      const note = isResubmit ? 'Đã sửa và gửi lại duyệt' : 'Gửi hóa đơn chờ duyệt'
      await invoiceService.sendForApproval(parseInt(invoiceId), note)
      
      // Update UI optimistically
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, internalStatusId: 6, internalStatus: INVOICE_INTERNAL_STATUS_LABELS[6] }
          : inv
      ))
      
      setSnackbar({
        open: true,
        message: isResubmit 
          ? '✅ Đã gửi lại hóa đơn cho Kế toán trưởng'
          : 'Đã gửi hóa đơn cho Kế toán trưởng',
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
    // ⚡ Check xem có cần tự động phát hành sau khi ký không
    const invoice = invoices.find(inv => inv.id === invoiceId)
    const shouldAutoIssue = invoice && (invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN || invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED)
    
    setAutoIssueAfterSign(shouldAutoIssue || false)
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
  
  // Handler xác nhận ký số
  const handleConfirmSign = async () => {
    const userId = parseInt(localStorage.getItem('userId') || '1')
    const invoiceId = parseInt(signDialog.invoiceId)
    
    if (signingInProgress.current.has(invoiceId)) {
      console.warn(`🚫 Duplicate sign request blocked for invoice ${invoiceId}`)
      return
    }
    
    try {
      signingInProgress.current.add(invoiceId)
      setIsSigningInvoice(true)
      
      // Bước 1: Ký số
      setSigningProgress({ step: 'signing', message: '🖊️ Ký số điện tử...' })
      await invoiceService.signInvoice(invoiceId, userId)
      
      // 🔄 Load ngay sau ký để cập nhật trạng thái
      await loadInvoices()
      
      // ⚡ TỰ ĐỘNG PHÁT HÀNH sau khi ký thành công
      if (autoIssueAfterSign) {
        // Bước 2: Gửi CQT
        setSigningProgress({ step: 'submitting', message: '🏛️ Gửi lên Cơ quan Thuế...' })
        const taxCode = await invoiceService.submitToTaxAuthority(invoiceId)
        
        // 🔄 Load sau khi gửi CQT
        await loadInvoices()
        
        // Bước 3: Phát hành
        setSigningProgress({ step: 'issuing', message: '✅ Phát hành hóa đơn...' })
        
        if (import.meta.env.DEV) {
          console.log(`🔵 [Accountant] Starting issueInvoice for invoice ${invoiceId}...`)
        }
        
        // ⚠️ Timeout protection: Nếu API không response trong 30s, throw error
        const issuePromise = invoiceService.issueInvoice(invoiceId, userId)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Phát hành hóa đơn quá lâu (timeout 30s). Vui lòng kiểm tra lại trạng thái hóa đơn.')), 30000)
        )
        
        await Promise.race([issuePromise, timeoutPromise])
        
        if (import.meta.env.DEV) {
          console.log(`✅ [Accountant] issueInvoice completed successfully`)
        }
        
        // 🔄 Load cuối cùng
        await loadInvoices()
        
        // ✅ Hoàn tất - hiển thị snackbar
        setSnackbar({
          open: true,
          message: `✅ Đã ký số và phát hành hóa đơn ${signDialog.invoiceNumber} thành công!\n🏛️ Mã CQT: ${taxCode}`,
          severity: 'success',
        })
      } else {
        // Chỉ ký số, không phát hành
        setSnackbar({
          open: true,
          message: `✅ Đã ký số hóa đơn ${signDialog.invoiceNumber} thành công!\n🔑 Hóa đơn đã có chữ ký số điện tử.`,
          severity: 'success',
        })
      }
      
    } catch (err) {
      console.error('❌ Sign error:', err)
      setAutoIssueAfterSign(false)
      setSigningProgress(null)
      
      // Xác định lỗi ở bước nào
      const currentStep = signingProgress?.step || 'signing'
      const stepLabels = {
        signing: 'ký số',
        submitting: 'gửi CQT',
        issuing: 'phát hành',
      }
      
      setSnackbar({
        open: true,
        message: `❌ Lỗi khi ${stepLabels[currentStep as keyof typeof stepLabels] || 'xử lý'}: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
      
      // Load lại dữ liệu ngay cả khi lỗi để cập nhật trạng thái mới nhất
      await loadInvoices()
      
    } finally {
      // ✅ Reset TẤT CẢ states đồng thời trong finally để đảm bảo dialog đóng đúng cách
      setIsSigningInvoice(false)
      setAutoIssueAfterSign(false)
      setSigningProgress(null)
      signingInProgress.current.delete(invoiceId)
      handleCloseSignDialog()
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
  
  // 📧 Handler gửi email hóa đơn
  const handleSendEmail = async (emailData: {
    recipientName: string
    email: string
    ccEmails: string[]
    bccEmails: string[]
    attachments: File[]
    includeXml: boolean
    disableSms: boolean
    language: string
  }) => {
    if (!selectedInvoiceForEmail) return
    
    const invoiceBeforeSend = {
      id: selectedInvoiceForEmail.id,
      number: selectedInvoiceForEmail.invoiceNumber,
      statusId: selectedInvoiceForEmail.internalStatusId,
    }
    
    try {
      setSubmittingId(selectedInvoiceForEmail.id)
      
      // Upload attachments nếu có (cần implement file upload API)
      const attachmentUrls: string[] = []
      if (emailData.attachments.length > 0) {
        console.log('⚠️ File upload not implemented yet. Attachments:', emailData.attachments)
      }
      
      // Gọi API gửi email
      const response = await invoiceService.sendInvoiceEmail(
        parseInt(selectedInvoiceForEmail.id),
        {
          emailTemplateId: 0, // Default template
          recipientEmail: emailData.email,
          ccEmails: emailData.ccEmails.length > 0 ? emailData.ccEmails : undefined,
          bccEmails: emailData.bccEmails.length > 0 ? emailData.bccEmails : undefined,
          customMessage: undefined,
          includeXml: emailData.includeXml,
          includePdf: true, // Luôn gửi PDF
          language: emailData.language || 'vi',
          externalAttachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        }
      )
      
      console.log('✅ Email sent successfully:', {
        invoiceId: invoiceBeforeSend.id,
        invoiceNumber: invoiceBeforeSend.number,
        sentTo: response.sentTo,
      })
      
      // 🔍 MONITORING: Verify status không bị thay đổi (chỉ log warning nếu có)
      // Backend đã fix bug, nhưng vẫn monitor để phát hiện sớm nếu bug quay lại
      try {
        const invoiceDetail = await invoiceService.getInvoiceById(parseInt(invoiceBeforeSend.id))
        
        if (invoiceBeforeSend.statusId !== invoiceDetail.invoiceStatusID) {
          // ⚠️ Backend bug quay lại - chỉ log warning
          console.warn('⚠️ [WARNING] Invoice status changed after email send (backend bug detected):', {
            invoiceNumber: invoiceBeforeSend.number,
            statusBefore: invoiceBeforeSend.statusId,
            statusAfter: invoiceDetail.invoiceStatusID,
            note: 'This should NOT happen - backend team needs to investigate',
          })
        }
      } catch (verifyErr) {
        // Không quan trọng nếu verify fail - chỉ log
        console.warn('⚠️ Could not verify status after email send:', verifyErr)
      }
      
      // ✅ Reload data và show success
      await loadInvoices()
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi email hóa đơn ${invoiceBeforeSend.number}\nĐến: ${response.sentTo}`,
        severity: 'success',
      })
      
      setSendEmailModalOpen(false)
      setSelectedInvoiceForEmail(null)
      
    } catch (err) {
      console.error('❌ Failed to send email:', {
        invoiceNumber: invoiceBeforeSend.number,
        error: err,
      })
      
      setSnackbar({
        open: true,
        message: `❌ Không thể gửi email hóa đơn ${invoiceBeforeSend.number}\n${err instanceof Error ? err.message : 'Vui lòng thử lại'}`,
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
        const isRejected = statusId === INVOICE_INTERNAL_STATUS.REJECTED
        const notes = params.row.notes as string | null
        
        // Extract rejection reason from notes (if available)
        const rejectionReason = isRejected && notes && notes.includes('Từ chối:') 
          ? notes.replace('Từ chối: ', '') 
          : null
        
        // Tooltip content - only show when rejection reason exists
        const tooltipContent = isRejected && rejectionReason ? (
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              ❌ Hóa đơn bị từ chối duyệt
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.5 }}>
              <strong>Lý do:</strong> {rejectionReason}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#ffeb3b' }}>
              💡 Vui lòng sửa và gửi lại duyệt
            </Typography>
          </Box>
        ) : (params.value as string)
        
        const chipElement = (
          <Chip 
            label={params.value as string} 
            color={getInternalStatusColor(statusId)} 
            size="small" 
            sx={{ 
              fontWeight: 600,
              ...(isRejected && {
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }),
            }}
          />
        )
        
        // Wrap with Tooltip ONLY when rejection reason exists
        return isRejected && rejectionReason ? (
          <Tooltip 
            title={tooltipContent} 
            arrow 
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              },
            }}
          >
            <span>{chipElement}</span>
          </Tooltip>
        ) : chipElement
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
      width: 140,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const isSending = submittingId === params.row.id
        const hasBeenAdjusted = adjustedInvoicesMap.get(params.row.id) || false
        const invoice = params.row as Invoice
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Icon 1: Xem chi tiết */}
            <Tooltip title="Xem chi tiết" arrow placement="top">
              <IconButton
                size="small"
                component={Link}
                to={`/invoices/${invoice.id}`}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Icon 2: Tải PDF */}
            <Tooltip title="Tải PDF" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'error.main',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Icon 3: Menu 3 chấm */}
            <InvoiceActionsMenu
              invoice={invoice}
              onSendForApproval={handleSendForApproval}
              onSign={handleOpenSignDialog}
              onResendToTax={handleResendToTax}
              onCancel={handleCancelInvoice}
              onPrintInvoice={handlePrintInvoice}
              isSending={isSending}
              hasBeenAdjusted={hasBeenAdjusted}
              onOpenEmailModal={(inv) => {
                setSelectedInvoiceForEmail(inv)
                setSendEmailModalOpen(true)
              }}
            />
          </Box>
        )
      },
    },
  ]

  // 🔍 Tính toán Map các hóa đơn đã bị điều chỉnh (để kiểm tra rule "chỉ điều chỉnh 1 lần")
  // Key: invoiceID của hóa đơn gốc, Value: true nếu đã có hóa đơn điều chỉnh
  const adjustedInvoicesMap = useMemo(() => {
    const map = new Map<string, boolean>()
    
    // Duyệt qua tất cả hóa đơn, tìm các hóa đơn điều chỉnh (type = 2)
    invoices.forEach(inv => {
      if (inv.invoiceType === 2 && inv.originalInvoiceID) {
        // Đánh dấu hóa đơn gốc đã bị điều chỉnh
        map.set(inv.originalInvoiceID.toString(), true)
      }
    })
    
    return map
  }, [invoices])

  // Logic lọc dữ liệu - tích hợp với InvoiceFilter
  const filteredInvoices = useMemo(() => {
    const result = invoices.filter((invoice) => {
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
    
    if (import.meta.env.DEV) {
      console.log('📊 [InvoiceManagement] Filter result:', {
        totalInvoices: invoices.length,
        filteredInvoices: result.length,
        hasActiveFilters: Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true)),
      })
    }
    
    return result
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
              {filteredInvoices.length > 0 && (
                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500, mt: 0.5 }}>
                  📊 Hiển thị {filteredInvoices.length} / {invoices.length} hóa đơn
                </Typography>
              )}
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
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25, 50, 100]}
              autoHeight={false}
              getRowHeight={() => 'auto'}
              density="comfortable"
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
            {signingProgress ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      margin: '0 auto',
                      borderRadius: '50%',
                      border: '4px solid',
                      borderColor: 'primary.main',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {signingProgress.message}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {signingProgress.step === 'signing' && 'Đang ký chữ ký số điện tử...'}
                  {signingProgress.step === 'submitting' && 'Gửi hóa đơn lên cơ quan thuế...'}
                  {signingProgress.step === 'issuing' && 'Hoàn tất quá trình phát hành...'}
                </Typography>
              </Box>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {autoIssueAfterSign ? (
                    <>
                      <strong>⚡ Ký số & Phát hành tự động</strong><br />
                      Hệ thống sẽ tự động thực hiện:<br />
                      1️⃣ Ký số điện tử<br />
                      2️⃣ Gửi lên Cơ quan Thuế<br />
                      3️⃣ Phát hành hóa đơn<br />
                      <em>(Quá trình có thể mất vài giây)</em>
                    </>
                  ) : (
                    <>
                      <strong>Bước 1: Ký số điện tử</strong><br />
                      Hóa đơn sẽ được ký bằng chữ ký số điện tử.
                    </>
                  )}
                </Alert>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Hóa đơn:</strong> {signDialog.invoiceNumber || '<Chưa cấp số>'}
                </Typography>
                {!autoIssueAfterSign && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Hóa đơn đã được Kế toán trưởng duyệt. Nhấn <strong>"Ký số"</strong> để:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                      <li><Typography variant="body2">✍️ Ký số điện tử vào hóa đơn</Typography></li>
                      <li><Typography variant="body2">📝 Chuyển sang trạng thái "Đã ký"</Typography></li>
                    </Box>
                  </>
                )}
              </>
            )}
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
              {isSigningInvoice ? 'Đang xử lý...' : autoIssueAfterSign ? 'Ký & Phát hành' : 'Ký số'}
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
        
        {/* Send Email Modal */}
        <SendInvoiceEmailModal
          open={sendEmailModalOpen}
          onClose={() => {
            setSendEmailModalOpen(false)
            setSelectedInvoiceForEmail(null)
          }}
          onSend={handleSendEmail}
          invoiceData={{
            invoiceNumber: selectedInvoiceForEmail?.invoiceNumber || '',
            serialNumber: selectedInvoiceForEmail?.symbol || '',
            date: selectedInvoiceForEmail?.issueDate ? new Date(selectedInvoiceForEmail.issueDate).toLocaleDateString('vi-VN') : '',
            customerName: selectedInvoiceForEmail?.customerName || '',
            totalAmount: selectedInvoiceForEmail?.amount ? selectedInvoiceForEmail.amount.toLocaleString('vi-VN') : '0',
            // ✅ Auto-fill email và tên người nhận từ thông tin liên hệ trong hóa đơn
            recipientEmail: selectedInvoiceForEmail?.contactEmail || '',
            recipientName: selectedInvoiceForEmail?.contactPerson || selectedInvoiceForEmail?.customerName || '',
          }}
        />
      </Box>
    </Box>
  </LocalizationProvider>
  )
}

export default InvoiceManagement