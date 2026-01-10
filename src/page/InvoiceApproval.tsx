import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DrawIcon from '@mui/icons-material/Draw'
import SendIcon from '@mui/icons-material/Send'
import EmailIcon from '@mui/icons-material/Email'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import FindReplaceIcon from '@mui/icons-material/FindReplace'
import RestoreIcon from '@mui/icons-material/Restore'
import { Link } from 'react-router-dom'
import InvoiceFilter, { InvoiceFilterState } from '@/components/InvoiceFilter'
import invoiceService, { InvoiceListItem } from '@/services/invoiceService'
import templateService from '@/services/templateService'
import customerService from '@/services/customerService'
import Spinner from '@/components/Spinner'
import {
  INVOICE_INTERNAL_STATUS,
  INVOICE_INTERNAL_STATUS_LABELS,
  getInternalStatusColor,
  TAX_AUTHORITY_STATUS,
  getTaxStatusLabel,
  getTaxStatusColor,
  isTaxStatusError,  // ✨ NEW
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
  taxStatusId: number
  taxStatus: string
  taxStatusCode?: string  // ✨ NEW - Tax Status Code for error checking
  amount: number
}

// Mapper từ backend response sang UI format
const mapInvoiceToUI = (
  item: InvoiceListItem,
  templateMap: Map<number, string>,
  customerMap: Map<number, { name: string; taxCode: string }>
): Invoice => {
  const template = templateMap.get(item.templateID)
  const customer = customerMap.get(item.customerID)
  
  const taxStatusId = item.taxAuthorityCode 
    ? TAX_AUTHORITY_STATUS.ACCEPTED 
    : TAX_AUTHORITY_STATUS.NOT_SENT
  
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
    taxStatus: getTaxStatusLabel(taxStatusId),
    taxStatusCode: item.taxStatusCode || '',  // ✨ NEW - Map Tax Status Code
    amount: item.totalAmount,
  }
}

// Component menu thao tác cho mỗi hóa đơn
interface InvoiceApprovalActionsMenuProps {
  invoice: Invoice
  onApprove: (id: string, invoiceNumber: string) => void
  onReject: (id: string, invoiceNumber: string) => void
  onSign: (id: string, invoiceNumber: string) => void
  onIssue: (id: string, invoiceNumber: string) => void
  onResendToTax: (id: string, invoiceNumber: string) => void  // ✨ NEW
}

const InvoiceApprovalActionsMenu = ({ invoice, onApprove, onReject, onSign, onIssue, onResendToTax }: InvoiceApprovalActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Xác định trạng thái hóa đơn
  const isPendingApproval = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_APPROVAL // 6 - Chờ duyệt
  const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7 - Đã duyệt, chờ ký
  const isSignedPendingIssue = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED // 8 - Đã ký số, chờ phát hành
  const isSigned = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.SIGNED // 8 - Đã ký
  const isIssued = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.ISSUED // 2 - Đã phát hành (đã ký + gửi)
  const hasTaxError = isTaxStatusError(invoice.taxStatusId)  // ✨ Check Tax Status error
  
  // Kiểm tra có số hóa đơn chưa - Xử lý cả number và string
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
  
  // ⚠️ Luồng đúng: 
  // Status 6 (PENDING_APPROVAL) → DUYỆT → Status 7 (PENDING_SIGN)
  // Status 7 (PENDING_SIGN) → KÝ SỐ (cấp số) → Status 8 (SIGNED_PENDING_ISSUE)
  // Status 8 (SIGNED_PENDING_ISSUE) → PHÁT HÀNH (gửi CQT) → Status 2 (ISSUED)
  
  // Logic điều khiển menu
  const canCancel = isPendingApproval || isPendingSign // Có thể hủy khi Chờ duyệt HOẶC Chờ ký
  
  // Backend workflow: /sign generates invoice number, then /issue publishes
  // Can only issue when SIGNED (status 8 or 10) AND has invoice number
  const canIssue = (isSignedPendingIssue || isSigned) && hasInvoiceNumber

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
      linkTo: `/approval/invoices/${invoice.id}`,
    },
    {
      label: 'Chỉnh sửa',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: isPendingApproval,
      action: () => {
        console.log('Chỉnh sửa:', invoice.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Duyệt',
      icon: <CheckCircleIcon fontSize="small" />,
      enabled: isPendingApproval,
      action: () => {
        onApprove(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'success.main',
    },
    {
      label: 'Ký số',
      icon: <DrawIcon fontSize="small" />,
      enabled: isPendingSign, // ⚠️ Chỉ ký được khi status = 7 (PENDING_SIGN - Chờ ký)
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
      enabled: canIssue, // ⚠️ Cho phép khi đã ký (status 7, 8, 10) và chưa có số
      action: () => {
        onIssue(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'success.main',
      tooltip: 'Cấp số hóa đơn và gửi lên Cơ quan Thuế',
    },
    { divider: true },
    {
      label: 'Gửi lại CQT',
      icon: <RestoreIcon fontSize="small" />,
      enabled: (isSigned || isIssued) && hasTaxError,  // ✨ Chỉ hiện khi có lỗi Tax Status
      action: () => {
        onResendToTax(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'warning.main',
      tooltip: 'Gửi lại hóa đơn lên Cơ quan Thuế (khi gặp lỗi)',
    },
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
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('In hóa đơn:', invoice.id)
        handleClose()
      },
      color: 'text.primary',
    },
    {
      label: 'Tải xuống',
      icon: <DownloadIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('Tải xuống:', invoice.id)
        handleClose()
      },
      color: 'text.primary',
    },
    { divider: true },
    {
      label: 'Tạo HĐ điều chỉnh',
      icon: <FindReplaceIcon fontSize="small" />,
      enabled: isIssued,
      action: () => {
        console.log('Tạo HĐ điều chỉnh:', invoice.id)
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
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Hủy',
      icon: <CancelIcon fontSize="small" />,
      enabled: canCancel, // Chờ duyệt hoặc Chờ ký (chưa phát hành)
      action: () => {
        onReject(invoice.id, invoice.invoiceNumber) // Dùng lại logic reject/cancel
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

const InvoiceApproval = () => {
  // State quản lý data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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

  // State cho dialog duyệt/từ chối
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
    action: '' as 'approve' | 'reject' | '',
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // State cho snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  })
  
  // State quản lý dialog ký số
  const [signDialog, setSignDialog] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
  })
  const [isSigningInvoice, setIsSigningInvoice] = useState(false)
  const signingInProgress = useRef<Set<number>>(new Set())

  // Load invoices từ API
  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [invoicesData, templatesData, customersData] = await Promise.all([
        invoiceService.getAllInvoices(),
        templateService.getAllTemplates(),
        customerService.getAllCustomers(),
      ])
      
      const templateMap = new Map(
        templatesData.map(t => [t.templateID, t.serial])
      )
      const customerMap = new Map(
        customersData.map(c => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      // ⭐ KẾ TOÁN TRƯỞNG XEM TẤT CẢ HÓA ĐƠN TRỪ NHÁP (status !== 1)
      const managementInvoices = invoicesData.filter(
        item => item.invoiceStatusID !== INVOICE_INTERNAL_STATUS.DRAFT
      )
      
      const mappedData = managementInvoices.map(item => mapInvoiceToUI(item, templateMap, customerMap))
      setInvoices(mappedData)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  const handleFilterChange = (newFilters: InvoiceFilterState) => {
    setFilters(newFilters)
  }

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

  const handleOpenApprovalDialog = (invoiceId: string, invoiceNumber: string, action: 'approve' | 'reject') => {
    setApprovalDialog({
      open: true,
      invoiceId,
      invoiceNumber,
      action,
    })
    setRejectionReason('')
  }

  const handleCloseApprovalDialog = () => {
    setApprovalDialog({
      open: false,
      invoiceId: '',
      invoiceNumber: '',
      action: '',
    })
    setRejectionReason('')
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
  
  // Handler xác nhận ký số
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
      // Sign the invoice (service will fetch invoice + template internally)
      void await invoiceService.signInvoice(invoiceId, userId)
      
      // Get updated invoice data
      const updatedInvoice = await invoiceService.getInvoiceById(invoiceId)
      
      // Check if backend assigned invoice number
      if (!updatedInvoice.invoiceNumber || updatedInvoice.invoiceNumber === 0) {
        setSnackbar({
          open: true,
          message: `⚠️ Đã ký số hóa đơn ${signDialog.invoiceNumber} thành công nhưng hệ thống CHƯA cấp số!\n🔑 Chữ ký số: Có\n📋 Số hóa đơn: 0 (chưa cấp)\n\n👉 Liên hệ IT để kiểm tra backend /sign API.`,
          severity: 'warning',
        })
        
        handleCloseSignDialog()
        await loadInvoices()
        return
      }
      
      // Success - backend assigned invoice number
      const invoiceNumberMsg = updatedInvoice.invoiceNumber && updatedInvoice.invoiceNumber > 0
        ? `\n📋 Số hóa đơn: ${updatedInvoice.invoiceNumber}`
        : ''
      
      setSnackbar({
        open: true,
        message: `✅ Đã ký số hóa đơn ${signDialog.invoiceNumber} thành công${invoiceNumberMsg}\n🔑 Hóa đơn đã có chữ ký số điện tử`,
        severity: 'success',
      })
      
      handleCloseSignDialog()
      await loadInvoices()
      
    } catch (err) {
      console.error('❌ Sign error:', err)
      
      // RECOVERY: Check if invoice was actually signed despite error
      try {
        const recoveryCheck = await invoiceService.getInvoiceById(invoiceId)
        console.log('🔄 Recovery check - Status:', recoveryCheck.invoiceStatusID, 'Number:', recoveryCheck.invoiceNumber)
        
        // Case 1: Invoice has number now - sign was actually successful!
        if (recoveryCheck.invoiceNumber && recoveryCheck.invoiceNumber > 0) {
          console.log('✅ Recovery successful - Invoice was signed despite error')
          setSnackbar({
            open: true,
            message: `✅ Đã ký số thành công!\n📋 Số hóa đơn: ${recoveryCheck.invoiceNumber}\n🔑 Hóa đơn đã có chữ ký số điện tử`,
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
            severity: 'warning',
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
        message: err instanceof Error ? err.message : 'Không thể ký số hóa đơn',
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
      void await invoiceService.issueInvoice(id, userId)
      
      setSnackbar({
        open: true,
        message: `✅ Đã phát hành hóa đơn thành công!\n📋 Số hóa đơn: ${currentInvoice.invoiceNumber}\n🏛️ Mã CQT: ${taxCode}`,
        severity: 'success',
      })
      
      await loadInvoices()
      
    } catch (err) {
      // PHÁT HÀNH THẤT BẠI (chưa cấp được số)
      console.error('❌ Lỗi phát hành:', err)
      
      setSnackbar({
        open: true,
        message: `❌ Phát hành thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    }
  }

  // Handler gửi lại CQT (cho hóa đơn đã ký nhưng có lỗi Tax Status)
  const handleResendToTax = async (invoiceId: string, invoiceNumber: string) => {
    try {
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
    }
  }

  const handleConfirmAction = async () => {
    if (approvalDialog.action === 'reject' && !rejectionReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập lý do từ chối',
        severity: 'error',
      })
      return
    }

    setActionLoading(true)
    try {
      // ⭐ Gọi API để update status với note
      
      if (approvalDialog.action === 'approve') {
        // ✅ Duyệt: Update status từ PENDING_APPROVAL (6) -> APPROVED (9)
        await invoiceService.approveInvoice(parseInt(approvalDialog.invoiceId))
        
        // ✅ Tự động chuyển sang PENDING_SIGN (7)
        await invoiceService.markPendingSign(parseInt(approvalDialog.invoiceId))
        
        setSnackbar({
          open: true,
          message: `Đã duyệt hóa đơn ${approvalDialog.invoiceNumber}`,
          severity: 'success',
        })
      } else {
        // ✅ Từ chối: Update status từ PENDING_APPROVAL (6) -> CANCELLED (3) với lý do
        await invoiceService.rejectInvoice(parseInt(approvalDialog.invoiceId), rejectionReason)
        
        setSnackbar({
          open: true,
          message: `Đã từ chối hóa đơn ${approvalDialog.invoiceNumber}`,
          severity: 'success',
        })
      }

      handleCloseApprovalDialog()
      
      // Reload data để refresh danh sách
      await loadInvoices()
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Không thể thực hiện thao tác',
        severity: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Định nghĩa columns với chức năng duyệt
  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Số hóa đơn',
      flex: 1,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Link
          to={`/approval/invoices/${params.row.id}`}
          style={{
            textDecoration: 'none',
            color: '#1976d2',
            fontWeight: 600,
            transition: 'color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#1565c0')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#1976d2')}>
          {params.value as string}
        </Link>
      ),
    },
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
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const taxStatusId = params.row.taxStatusId
        return (
          <Chip 
            label={params.value as string} 
            color={getTaxStatusColor(taxStatusId)} 
            size="small"
            sx={{ fontWeight: 600 }}
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
        return (
          <InvoiceApprovalActionsMenu
            invoice={params.row as Invoice}
            onApprove={(id, invoiceNumber) => handleOpenApprovalDialog(id, invoiceNumber, 'approve')}
            onReject={(id, invoiceNumber) => handleOpenApprovalDialog(id, invoiceNumber, 'reject')}
            onSign={handleOpenSignDialog}
            onIssue={handleIssueInvoice}
            onResendToTax={handleResendToTax}
          />
        )
      },
    },
  ]

  // Logic lọc dữ liệu
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !filters.searchText ||
        invoice.invoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.symbol.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.taxCode.toLowerCase().includes(filters.searchText.toLowerCase())

      const matchesDateFrom = !filters.dateFrom || dayjs(invoice.issueDate).isAfter(filters.dateFrom, 'day') || dayjs(invoice.issueDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo = !filters.dateTo || dayjs(invoice.issueDate).isBefore(filters.dateTo, 'day') || dayjs(invoice.issueDate).isSame(filters.dateTo, 'day')
      const matchesInvoiceStatus = filters.invoiceStatus.length === 0 || filters.invoiceStatus.includes(invoice.internalStatus)
      const matchesTaxStatus = !filters.taxStatus || invoice.taxStatus === filters.taxStatus
      const matchesCustomer = !filters.customer || invoice.customerName === filters.customer
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

  // Count pending approval invoices
  const pendingCount = useMemo(() => {
    return invoices.filter(inv => inv.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_APPROVAL).length
  }, [invoices])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                Duyệt Hóa đơn
              </Typography>
              {pendingCount > 0 && (
                <Chip
                  label={`${pendingCount} chờ duyệt`}
                  color="warning"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Duyệt và quản lý các hóa đơn điện tử - Dành cho Kế toán trưởng
            </Typography>
          </Box>

          {/* Bộ lọc */}
          <InvoiceFilter onFilterChange={handleFilterChange} onReset={handleResetFilter} />

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Spinner />
            </Box>
          )}

          {/* Error */}
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
        </Box>

        {/* Approval/Rejection Dialog */}
        <Dialog
          open={approvalDialog.open}
          onClose={handleCloseApprovalDialog}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>
            {approvalDialog.action === 'approve' ? 'Xác nhận duyệt hóa đơn' : 'Xác nhận từ chối hóa đơn'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {approvalDialog.action === 'approve' 
                ? `Bạn có chắc chắn muốn duyệt hóa đơn ${approvalDialog.invoiceNumber}?`
                : `Bạn có chắc chắn muốn từ chối hóa đơn ${approvalDialog.invoiceNumber}?`
              }
            </Typography>
            
            {approvalDialog.action === 'reject' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lý do từ chối *"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối hóa đơn..."
                sx={{ mt: 2 }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={handleCloseApprovalDialog} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              variant="contained"
              color={approvalDialog.action === 'approve' ? 'success' : 'error'}
              onClick={handleConfirmAction}
              disabled={actionLoading}
              startIcon={approvalDialog.action === 'approve' ? <CheckCircleIcon /> : <CancelIcon />}>
              {actionLoading ? 'Đang xử lý...' : (approvalDialog.action === 'approve' ? 'Duyệt' : 'Từ chối')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sign Invoice Dialog */}
        <Dialog
          open={signDialog.open}
          onClose={handleCloseSignDialog}
          maxWidth="sm"
          fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DrawIcon color="secondary" />
            Ký số hóa đơn
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Hóa đơn đã được Kế toán trưởng duyệt và đang chờ ký số. Bạn có thể tiến hành ký số hóa đơn.
            </Alert>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Số hóa đơn:</strong> {signDialog.invoiceNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sau khi ký số thành công, hóa đơn sẽ có chữ ký số hợp lệ.
            </Typography>
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
              {isSigningInvoice ? 'Đang ký...' : 'Xác nhận ký số'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  )
}

export default InvoiceApproval
