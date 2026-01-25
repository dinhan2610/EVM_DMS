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
  TextField,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
// ❌ REMOVED: EditOutlinedIcon - Nút Chỉnh sửa đã bị xóa
import AddIcon from '@mui/icons-material/Add'
import SendIcon from '@mui/icons-material/Send'
import DrawIcon from '@mui/icons-material/Draw'
// ❌ REMOVED: DeleteOutlineIcon - Nút Xóa đã bị xóa
import DownloadIcon from '@mui/icons-material/Download'
import EmailIcon from '@mui/icons-material/Email'
import PrintIcon from '@mui/icons-material/Print'
import RestoreIcon from '@mui/icons-material/Restore'
import FindReplaceIcon from '@mui/icons-material/FindReplace'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LinkIcon from '@mui/icons-material/Link'
import { Link, useNavigate } from 'react-router-dom'
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
  notes: string | null // ✅ Ghi chú (chứa lý do từ chối)
  
  // ✅ Contact info từ invoice (để gửi email) - đồng bộ với Accountant page
  contactEmail: string | null
  contactPerson: string | null
  contactPhone: string | null
  
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
  
  // ✅ Validate invoiceID
  if (!item.invoiceID || isNaN(Number(item.invoiceID))) {
    throw new Error(`Invalid invoice data: invoiceID is ${item.invoiceID}`)
  }
  
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
  
  return {
    id: item.invoiceID.toString(),
    invoiceNumber: item.invoiceNumber?.toString() || '0',
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
    
    // ✅ Map contact info (đồng bộ với Accountant page)
    contactEmail: item.customerEmail || item.contactEmail || null,  // Ưu tiên customerEmail từ backend
    contactPerson: item.contactPerson || null,
    contactPhone: item.contactPhone || null,
    
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
  onApprove: (id: string) => void // KTT duyệt hóa đơn
  onReject: (id: string) => void  // ✅ KTT từ chối hóa đơn
  onSign: (id: string, invoiceNumber: string) => void
  onResendToTax: (id: string, invoiceNumber: string) => void
  // ❌ REMOVED: onCancel - Nút "Hủy" đã bị xóa
  onPrintInvoice: (id: string, invoiceNumber: string) => void
  isSending: boolean
  // ❌ REMOVED: hasBeenAdjusted - Theo NĐ 123/2020, có thể điều chỉnh nhiều lần
  // ✅ ADDED: Email modal props (đồng bộ với Accountant page)
  onOpenEmailModal: (invoice: Invoice) => void
}

const InvoiceActionsMenu = ({ invoice, onApprove, onReject, onSign, onResendToTax, onPrintInvoice, isSending, onOpenEmailModal }: InvoiceActionsMenuProps) => {
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
  // ❌ REMOVED: isDraft - Không còn dùng sau khi xóa nút Chỉnh sửa và Xóa
  const isPendingApproval = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_APPROVAL // 6
  const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7 - Chờ ký (sau khi KTT duyệt)
  const isSigned = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED // 8 - Đã ký
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
  
  // 🎯 Logic hiển thị nút "Ký số & Phát hành" (Gộp 1 bước)
  // ✅ Backend đã sửa: /sign API cấp số luôn
  // 
  // - Ký số & Phát hành: Cho phép khi:
  //   + Status = 7 (PENDING_SIGN) - Chờ ký (sau khi KTT duyệt)
  //   + HOẶC Status = 8 (SIGNED) - Đã ký, có thể phát hành lại
  //   + VÀ CHƯA CÓ SỐ (chưa ký)
  //   ➡️ Sau khi ký xong → TỰ ĐỘNG gửi CQT và phát hành
  const canSignAndIssue = (isPendingSign || isSigned) && !hasInvoiceNumber // ⚡ Gộp 1 bước
  // ❌ REMOVED: canCancel - Nút "Hủy" đã bị xóa khỏi menu Kế toán trưởng
  
  // 📋 Logic "Tạo HĐ điều chỉnh" - Theo NĐ 123/2020
  // Điều kiện:
  // 1. Hóa đơn đã phát hành (status = 2 ISSUED) HOẶC Đã điều chỉnh (status = 4 ADJUSTED)
  // 2. Chính nó KHÔNG phải là hóa đơn điều chỉnh (invoiceType !== ADJUSTMENT)
  // ✅ CHO PHÉP ĐIỀU CHỈNH NHIỀU LẦN theo NĐ 123/2020/NĐ-CP Điều 19
  const isAdjustmentInvoice = invoice.invoiceType === INVOICE_TYPE.ADJUSTMENT
  const isAdjusted = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.ADJUSTED // Status 4
  const canAdjust = (isIssued || isAdjusted) && !isAdjustmentInvoice

  const menuItems = [
    // ❌ REMOVED: Nút "Chỉnh sửa" - Kế toán trưởng không được chỉnh sửa hóa đơn
    {
      label: 'Duyệt',
      icon: <CheckCircleOutlineIcon fontSize="small" />,
      enabled: isPendingApproval && !isSending,
      action: () => {
        onApprove(invoice.id)
        handleClose()
      },
      color: 'success.main',
      tooltip: 'Kế toán trưởng phê duyệt hóa đơn',
    },
    {
      label: 'Từ chối',
      icon: <CancelIcon fontSize="small" />,
      enabled: isPendingApproval && !isSending,
      action: () => {
        onReject(invoice.id)
        handleClose()
      },
      color: 'error.main',
      tooltip: 'Từ chối duyệt hóa đơn (bắt buộc nhập lý do)',
    },
    {
      label: 'Ký số & Phát hành',
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
        onOpenEmailModal(invoice)  // ✅ Mở modal gửi email (đồng bộ với Accountant page)
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
        ? '⚠️ Hóa đơn điều chỉnh không thể điều chỉnh tiếp (chỉ điều chỉnh HĐ gốc)'
        : 'Tạo hóa đơn điều chỉnh (có thể nhiều lần theo NĐ 123/2020)',
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
    // ❌ REMOVED: Nút "Hủy" - Không hiển thị cho Kế toán trưởng
    // ❌ REMOVED: Nút "Xóa" - Kế toán trưởng không được xóa hóa đơn
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
  
  // ✅ State quản lý dialog từ chối
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    invoiceId: '',
    reason: '',
  })
  
  // ✅ State quản lý send email modal (đồng bộ với Accountant page)
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null)
  
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
    invoiceType: [],
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
      
      console.log('📊 [HODInvoiceManagement] Loaded data:', {
        totalInvoices: invoicesData.length,
        totalTemplates: templatesData.length,
        totalCustomers: customersData.length,
      })
      
      interface Template { templateID: number; serial: string }
      interface Customer { customerID: number; customerName: string; taxCode: string }
      
      const templateMap = new Map<number, string>(
        (templatesData as Template[]).map((t: Template) => [t.templateID, t.serial])
      )
      const customerMap = new Map<number, { name: string; taxCode: string }>(
        (customersData as Customer[]).map((c: Customer) => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      let mappedData = invoicesData.map((item: InvoiceListItem) => mapInvoiceToUI(item, templateMap, customerMap))
      
      // ✅ Preload notes cho các hóa đơn REJECTED (để hiển thị lý do từ chối trong tooltip)
      const rejectedInvoices = mappedData.filter(inv => inv.internalStatusId === INVOICE_INTERNAL_STATUS.REJECTED)
      if (rejectedInvoices.length > 0) {
        // Fetch notes từ detail API cho từng rejected invoice
        const notesPromises = rejectedInvoices.map(async (inv) => {
          try {
            const detail = await invoiceService.getInvoiceById(parseInt(inv.id))
            return { id: inv.id, notes: detail.notes }
          } catch (err) {
            console.error(`[HOD] Failed to load notes for invoice ${inv.id}:`, err)
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
      invoiceType: [],
    })
  }

  // ❌ REMOVED: adjustedInvoicesMap - Không cần nữa vì theo NĐ 123/2020, 
  // hóa đơn có thể điều chỉnh NHIỀU LẦN, không cần check "đã điều chỉnh chưa"

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

    // Invoice status filter - bỏ qua nếu có 'ALL'
    if (filters.invoiceStatus && filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('ALL')) {
      result = result.filter((inv) => filters.invoiceStatus.includes(String(inv.internalStatusId)))
    }

    // Tax status filter
    if (filters.taxStatus) {
      const taxStatusId = parseInt(filters.taxStatus)
      result = result.filter((inv) => inv.taxStatusId === taxStatusId)
    }

    // Customer filter - bỏ qua nếu là 'ALL'
    if (filters.customer && filters.customer !== 'ALL') {
      result = result.filter((inv) => inv.customerName === filters.customer)
    }

    // Invoice type filter - bỏ qua nếu có 'ALL'
    if (filters.invoiceType && filters.invoiceType.length > 0 && !filters.invoiceType.includes('ALL')) {
      result = result.filter((inv) => filters.invoiceType.includes(String(inv.invoiceType)))
    }
    
    if (import.meta.env.DEV) {
      console.log('📊 [HODInvoiceManagement] Filter result:', {
        totalInvoices: invoices.length,
        filteredInvoices: result.length,
        activeFilters: Object.entries(filters).filter(([, v]) => 
          v && (Array.isArray(v) ? v.length > 0 : true)
        ).length,
      })
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

  // Handler duyệt hóa đơn (KTT)
  const handleApprove = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      
      await invoiceService.approveInvoice(parseInt(invoiceId))
      
      setSnackbar({
        open: true,
        message: `✅ Đã duyệt hóa đơn thành công!`,
        severity: 'success',
      })
      
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Duyệt hóa đơn thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // ✅ Handler mở dialog từ chối
  const handleOpenRejectDialog = (invoiceId: string) => {
    setRejectDialog({
      open: true,
      invoiceId,
      reason: '',
    })
  }

  // ✅ Handler từ chối hóa đơn (KTT)
  const handleReject = async () => {
    if (!rejectDialog.reason.trim()) {
      setSnackbar({
        open: true,
        message: '❌ Vui lòng nhập lý do từ chối',
        severity: 'error',
      })
      return
    }

    try {
      setSubmittingId(rejectDialog.invoiceId)
      
      await invoiceService.rejectInvoice(parseInt(rejectDialog.invoiceId), rejectDialog.reason)
      
      setSnackbar({
        open: true,
        message: `✅ Đã từ chối hóa đơn thành công!`,
        severity: 'success',
      })
      
      // Đóng dialog và reset
      setRejectDialog({ open: false, invoiceId: '', reason: '' })
      
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Từ chối hóa đơn thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Handler ký số (mở dialog)
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
      
      // BƯớc 1: Ký số
      setSigningProgress({ step: 'signing', message: '🔏 Ký số điện tử...' })
      const userId = authContext?.user?.id || 1
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
      await invoiceService.signInvoice(invoiceIdNum, userIdNum)
      
      // 🔄 Load ngay sau ký để cập nhật trạng thái
      await loadInvoices()
      
      // ⚡ TỰ ĐỘNG PHÁT HÀNH sau khi ký thành công
      if (autoIssueAfterSign) {
        // Bước 2: Gửi CQT
        setSigningProgress({ step: 'submitting', message: '🏛️ Gửi lên Cơ quan Thuế...' })

        
        // 🔄 Load sau khi gửi CQT
        await loadInvoices()
        
        // Bước 3: Phát hành
        setSigningProgress({ step: 'issuing', message: '✅ Phát hành hóa đơn...' })
        
        if (import.meta.env.DEV) {
          console.log(`🔵 [HOD] Starting issueInvoice for invoice ${invoiceIdNum}...`)
        }
        
        // ⚠️ Timeout protection: Nếu API không response trong 30s, throw error
        const issuePromise = invoiceService.issueInvoice(invoiceIdNum, userIdNum)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Phát hành hóa đơn quá lâu (timeout 30s). Vui lòng kiểm tra lại trạng thái hóa đơn.')), 30000)
        )
        
        await Promise.race([issuePromise, timeoutPromise])
        
        if (import.meta.env.DEV) {
          console.log(`✅ [HOD] issueInvoice completed successfully`)
        }
        
        // 🔄 Load cuối cùng
        await loadInvoices()
        
        // ✅ Hoàn tất - hiển thị snackbar
        setSnackbar({
          open: true,
          message: `Đã ký số và phát hành hóa đơn thành công!`,
          severity: 'success',
        })
      } else {
        // Chỉ ký số, không phát hành
        setSnackbar({
          open: true,
          message: `✅ Đã ký số hóa đơn ${invoiceNumber} thành công! Bây giờ bạn có thể phát hành.`,
          severity: 'success',
        })
      }
    } catch (err) {
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
      signingInProgress.current.delete(invoiceIdNum)
      handleCloseSignDialog()
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

  // ❌ REMOVED: handleCancelInvoice - Nút "Hủy" đã bị xóa khỏi menu Kế toán trưởng
  
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

  // ✅ Handler gửi email (đồng bộ với Accountant page)
  const handleSendEmail = async (emailData: {
    recipientName: string
    email: string
    ccEmails: string[]
    bccEmails: string[]
    attachments: File[]
    includeXml: boolean
    includePdf: boolean
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
          includePdf: emailData.includePdf,
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
      try {
        const invoiceDetail = await invoiceService.getInvoiceById(parseInt(invoiceBeforeSend.id))
        
        if (invoiceBeforeSend.statusId !== invoiceDetail.invoiceStatusID) {
          console.warn('⚠️ [WARNING] Invoice status changed after email send (backend bug detected):', {
            invoiceNumber: invoiceBeforeSend.number,
            statusBefore: invoiceBeforeSend.statusId,
            statusAfter: invoiceDetail.invoiceStatusID,
            note: 'This should NOT happen - backend team needs to investigate',
          })
        }
      } catch (verifyErr) {
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
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#2c3e50',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
            {params.value as string}
          </Typography>
        </Box>
      ),
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
              💡 Kế toán viên cần sửa và gửi lại
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
        const taxStatusId = params.row.taxStatusId as number | null
        const taxAuthorityCode = params.row.taxAuthority as string // ✅ Mã CQT thực sự của hóa đơn (giống InvoiceManagement)
        const isError = taxStatusId !== null && isTaxStatusError(taxStatusId)
        
        // ✅ Tooltip content giống 100% với InvoiceManagement
        const tooltipContent = (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Trạng thái: {params.value as string}
            </Typography>
            {taxAuthorityCode && (
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                Mã CQT: <strong>{taxAuthorityCode}</strong>
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip title={tooltipContent} arrow placement="top">
              <Chip 
                label={params.value as string} 
                color={getTaxStatusColor(taxStatusId)} 
                size="small"
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 28,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  },
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
          </Box>
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
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%', pl: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#2e7d32',
            }}>
            {formatCurrency(params.value as number)}
          </Typography>
        </Box>
      ),
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
        const invoice = params.row as Invoice
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 0.5 }}>
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
              onApprove={handleApprove}
              onReject={handleOpenRejectDialog}
              onSign={handleOpenSignDialog}
              onResendToTax={handleResendToTax}
              onPrintInvoice={handlePrintInvoice}
              isSending={isSending}
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                📋 Quản lý Hóa đơn (Kế toán trưởng)
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Danh sách hóa đơn cần xử lý bởi Kế toán trưởng
              </Typography>
              
            </Box>
          </Box>

          {/* Bộ lọc nâng cao với nút Tạo hóa đơn */}
          <InvoiceFilter 
            onFilterChange={handleFilterChange} 
            onReset={handleResetFilter}
            totalResults={invoices.length}
            filteredResults={filteredInvoices.length}
            actionButton={
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create-invoice')}
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
                }}>
                Tạo hóa đơn
              </Button>
            }
          />

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
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25, 50, 100]}
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

          {/* ✅ Reject Invoice Dialog */}
          <Dialog 
            open={rejectDialog.open} 
            onClose={() => setRejectDialog({ open: false, invoiceId: '', reason: '' })} 
            maxWidth="sm" 
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
              <CancelIcon color="error" />
              ❌ Từ chối duyệt hóa đơn
            </DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>⚠️ Bắt buộc nhập lý do từ chối</strong><br />
                Lý do từ chối sẽ được gửi đến kế toán viên để sửa lại hóa đơn.
              </Alert>
              
              <TextField
                autoFocus
                fullWidth
                multiline
                rows={4}
                label="Lý do từ chối"
                placeholder="Ví dụ: Sai đơn giá mặt hàng số 2, Thiếu mã số thuế khách hàng..."
                value={rejectDialog.reason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                required
                error={!rejectDialog.reason.trim()}
                helperText={!rejectDialog.reason.trim() ? 'Vui lòng nhập lý do từ chối' : ''}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button 
                onClick={() => setRejectDialog({ open: false, invoiceId: '', reason: '' })}
                disabled={!!submittingId}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleReject}
                disabled={!!submittingId || !rejectDialog.reason.trim()}
                startIcon={<CancelIcon />}
              >
                {submittingId ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Sign Invoice Dialog */}
          <Dialog open={signDialog.open} onClose={handleCloseSignDialog} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             
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
                        <strong>Ký số & Phát hành tự động</strong><br />
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
                startIcon={<DrawIcon />}
              >
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
          
          {/* ✅ Send Email Modal (đồng bộ với Accountant page) */}
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

export default HODInvoiceManagement
