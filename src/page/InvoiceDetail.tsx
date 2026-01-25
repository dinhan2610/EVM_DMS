import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Print,
  Download,
  ArrowBack,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  ErrorOutline as ErrorOutlineIcon,
  Restore as RestoreIcon,
  FindReplace as FindReplaceIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab'
import { useParams, useNavigate } from 'react-router-dom'
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal'
import TaxErrorNotificationModal from '@/components/TaxErrorNotificationModal_v2'
import CreateMinuteDialog from '@/components/CreateMinuteDialog'
import Spinner from '@/components/Spinner'
import invoiceService, { InvoiceListItem, INVOICE_TYPE } from '@/services/invoiceService'
import invoiceHistoryService, { InvoiceHistory } from '@/services/invoiceHistoryService'
import companyService, { Company } from '@/services/companyService'
import { checkAdjustmentMinuteStatus, checkReplacementMinuteStatus, type MinuteRecord } from '@/services/minuteService'
import { INVOICE_INTERNAL_STATUS } from '@/constants/invoiceStatus'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'

/**
 * 🔧 HELPER: Process HTML preview from backend API
 * - Detects missing buyer name and injects from frontend data
 * - Adds CSS overrides for page width and highlighting
 * - Validates HTML structure
 * @param html - Raw HTML from backend
 * @param invoiceData - Invoice data from frontend (for injection)
 * @returns Processed HTML with injections and boolean indicating if buyer name was missing
 */
const processInvoiceHTML = (
  html: string, 
  invoiceData: InvoiceListItem
): { processedHtml: string; hasMissingBuyerName: boolean } => {
  let processedHtml = html
  
  // 1️⃣ DETECT MISSING BUYER NAME trong HTML
  // Pattern: <span ...>Họ tên người mua hàng...</span><span ...></span> (empty second span)
  const buyerNamePattern = /Họ tên người mua hàng[^<]*<\/span>\s*<span[^>]*>\s*<\/span>/i
  const hasMissingBuyerName = buyerNamePattern.test(html)
  
  if (hasMissingBuyerName) {
    console.warn('⚠️ [processInvoiceHTML] Detected missing buyer name in HTML')
    
    // Inject buyer name from contactPerson field if available
    if (invoiceData.contactPerson && invoiceData.contactPerson.trim()) {
      processedHtml = processedHtml.replace(
        /(Họ tên người mua hàng[^<]*<\/span>\s*<span[^>]*>)\s*(<\/span>)/i,
        `$1${invoiceData.contactPerson}$2`
      )
      console.log(`✅ [processInvoiceHTML] Injected buyer name: "${invoiceData.contactPerson}"`)
    }
  }
  
  // 2️⃣ CSS OVERRIDE for page width and styling
  const cssOverride = `
    <style>
      .page-container {
        width: 209mm !important;
      }
      /* Highlight injected fields (for debugging) */
      .frontend-injected {
        background-color: #fff3cd;
        padding: 2px 4px;
        border-radius: 2px;
      }
    </style>
  `
  
  // 3️⃣ INSERT CSS before </head> tag
  if (processedHtml.includes('</head>')) {
    processedHtml = processedHtml.replace('</head>', `${cssOverride}</head>`)
  } else if (processedHtml.includes('</body>')) {
    processedHtml = processedHtml.replace('</body>', `${cssOverride}</body>`)
  } else {
    processedHtml += cssOverride
  }
  
  // 4️⃣ VALIDATION: Check if HTML is valid
  if (!processedHtml.includes('<html') && !processedHtml.includes('<body')) {
    throw new Error('Invalid HTML structure from backend')
  }
  
  return { processedHtml, hasMissingBuyerName }
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Set initial title, will update dynamically when invoice loads
  const { setTitle } = usePageTitle('Chi tiết hóa đơn')
  
  // States
  const [invoice, setInvoice] = useState<InvoiceListItem | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  
  // HTML Preview states
  const [htmlPreview, setHtmlPreview] = useState<string>('')
  const [loadingHtml, setLoadingHtml] = useState(false)
  const [htmlMissingBuyerName, setHtmlMissingBuyerName] = useState(false)
  
  // State for Actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openActionsMenu = Boolean(anchorEl)
  
  // State for Tax Error Notification Modal
  const [showTaxErrorModal, setShowTaxErrorModal] = useState(false)
  
  // State for Invoice History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyData, setHistoryData] = useState<InvoiceHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // State for Create Minute Dialog
  const [showCreateMinuteDialog, setShowCreateMinuteDialog] = useState(false)
  
  // ✅ State for Minute Status Check (Điều chỉnh/Thay thế)
  const [adjustmentMinuteStatus, setAdjustmentMinuteStatus] = useState<{
    hasValidMinute: boolean
    minute: MinuteRecord | null
    reason: string
    loading: boolean
  }>({ hasValidMinute: false, minute: null, reason: '', loading: true })
  
  const [replacementMinuteStatus, setReplacementMinuteStatus] = useState<{
    hasValidMinute: boolean
    minute: MinuteRecord | null
    reason: string
    loading: boolean
  }>({ hasValidMinute: false, minute: null, reason: '', loading: true })

  // ✅ Logic actions menu - Đồng bộ 100% với InvoiceManagement & InvoiceApproval
  const isReplacementInvoice = invoice?.invoiceType === INVOICE_TYPE.REPLACEMENT
  
  // ✅ Kiểm tra điều kiện được tạo HĐ điều chỉnh/thay thế
  const canCreateAdjustmentInvoice = adjustmentMinuteStatus.hasValidMinute
  const canCreateReplacementInvoice = replacementMinuteStatus.hasValidMinute

  // Fetch invoice detail (extracted for reusability in SignalR)
  const fetchInvoiceDetail = useCallback(async () => {
    // ✅ Validate ID từ URL
    if (!id) {
      setError('Không tìm thấy ID hóa đơn trong URL')
      setLoading(false)
      return
    }
    
    const invoiceId = Number(id)
    if (isNaN(invoiceId) || invoiceId <= 0) {
      setError(`ID hóa đơn không hợp lệ: ${id}`)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Load invoice data
      const invoiceData = await invoiceService.getInvoiceById(invoiceId)
      console.log('🔍 Invoice data loaded:', {
        invoiceID: invoiceData.invoiceID,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceStatusID: invoiceData.invoiceStatusID,
        taxAuthorityCode: invoiceData.taxAuthorityCode,
        notes: invoiceData.notes
      })
      console.log('📝 Full invoice data:', JSON.stringify(invoiceData, null, 2))
      setInvoice(invoiceData)
      
      // Load company data for invoice info display
      const companyData = await companyService.getDefaultCompany()
      setCompany(companyData)
      
      // ✨ ALWAYS try to load HTML preview from backend API
      // Backend có thể generate HTML cho BẤT KỲ invoice nào (draft hoặc issued)
      // API: GET /api/Invoice/preview-by-invoice/{id}
      // Nếu API lỗi → Fallback to error message
      
      console.log('🎯 [InvoiceDetail] Loading HTML preview from backend for invoice:', {
        invoiceID: invoiceData.invoiceID,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceType: invoiceData.invoiceType
      })
      
      setLoadingHtml(true)
      try {
        const rawHtml = await invoiceService.getInvoiceHTML(Number(id))
        
        // ==================== HTML PROCESSING & OPTIMIZATION ====================
        const { processedHtml, hasMissingBuyerName } = processInvoiceHTML(rawHtml, invoiceData)
        
        setHtmlPreview(processedHtml)
        setHtmlMissingBuyerName(hasMissingBuyerName)
        
        // Logging
        const typeLabel = invoiceData.invoiceType > 1 ? ` (Type: ${invoiceData.invoiceType})` : ''
        const injectedLabel = hasMissingBuyerName && invoiceData.contactPerson ? ' [✓ Buyer name injected]' : ''
        console.log(`✅ [InvoiceDetail] HTML preview processed${typeLabel}${injectedLabel} (width: 209mm)`)
        
      } catch (htmlError) {
        console.error('⚠️ [InvoiceDetail] HTML preview failed:', htmlError)
        setError('Không thể tải HTML preview từ backend. Vui lòng thử lại sau.')
        setHtmlMissingBuyerName(false)
      } finally {
        setLoadingHtml(false)
      }
      
    } catch (err) {
      console.error('Failed to load invoice:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết hóa đơn')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInvoiceDetail()
  }, [fetchInvoiceDetail])
  
  // ✅ Check Minute Status khi invoice load xong
  useEffect(() => {
    const checkMinuteStatus = async () => {
      if (!invoice?.invoiceID) return
      
      console.log('🔍 [InvoiceDetail] Checking minute status for invoice:', invoice.invoiceID)
      
      // Check biên bản điều chỉnh
      setAdjustmentMinuteStatus(prev => ({ ...prev, loading: true }))
      const adjustmentResult = await checkAdjustmentMinuteStatus(invoice.invoiceID)
      setAdjustmentMinuteStatus({
        ...adjustmentResult,
        loading: false,
      })
      console.log('📋 [InvoiceDetail] Adjustment minute status:', adjustmentResult)
      
      // Check biên bản thay thế
      setReplacementMinuteStatus(prev => ({ ...prev, loading: true }))
      const replacementResult = await checkReplacementMinuteStatus(invoice.invoiceID)
      setReplacementMinuteStatus({
        ...replacementResult,
        loading: false,
      })
      console.log('📋 [InvoiceDetail] Replacement minute status:', replacementResult)
    }
    
    checkMinuteStatus()
  }, [invoice?.invoiceID])

  // 🔥 SignalR Realtime Updates
  useSignalR({
    onInvoiceChanged: (payload) => {
      console.log('📨 [InvoiceDetail] InvoiceChanged event:', payload)
      
      // Chỉ refresh nếu đúng invoice đang xem
      if (payload.invoiceId.toString() === id) {
        console.log('🔄 [InvoiceDetail] Current invoice changed, reloading data...')
        fetchInvoiceDetail() // ✅ Chỉ reload data, không reload toàn trang
      }
    }
  })

  // Resync data khi SignalR reconnect
  useSignalRReconnect(() => {
    console.log('🔄 [InvoiceDetail] SignalR reconnected, resyncing data...')
    if (id) {
      fetchInvoiceDetail() // ✅ Reload data thay vì reload page
    }
  })

  // Update title when invoice data loads
  useEffect(() => {
    if (invoice?.invoiceNumber) {
      setTitle(`${invoice.invoiceNumber} - Chi tiết hóa đơn`)
    }
  }, [invoice?.invoiceNumber, setTitle])

  const handlePrint = () => {
    if (htmlPreview) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlPreview)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        alert('❌ Popup bị chặn. Vui lòng cho phép popup.')
      }
    } else {
      alert('❌ Chưa có HTML preview để in')
    }
  }

  // Handle Actions menu
  const handleOpenActionsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseActionsMenu = () => {
    setAnchorEl(null)
  }

  // Handle open Tax Error Notification Modal
  const handleOpenTaxErrorModal = () => {
    setShowTaxErrorModal(true)
    handleCloseActionsMenu()
  }

  // Handle Tax Error Notification success
  const handleTaxErrorSuccess = () => {
    // Close modal
    setShowTaxErrorModal(false)
    // Show success message
    console.log('✅ Đã gửi thông báo sai sót thành công!')
    // Note: List page sẽ tự động refresh khi navigate đến /tax-error-notifications
  }

  // Handle open Invoice History Modal
  const handleOpenHistoryModal = async () => {
    handleCloseActionsMenu()
    setShowHistoryModal(true)
    setLoadingHistory(true)
    
    try {
      if (invoice) {
        const history = await invoiceHistoryService.getInvoiceHistory(invoice.invoiceID)
        setHistoryData(history)
      }
    } catch (error) {
      console.error('Error loading invoice history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false)
  }

  // Handle Create Adjustment Report (Biên Bản ĐC/TT)
  const handleCreateAdjustmentReport = () => {
    handleCloseActionsMenu()
    console.log('📋 [InvoiceDetail] Tạo Biên Bản ĐC/TT cho invoice:', invoice?.invoiceID)
    setShowCreateMinuteDialog(true)
  }
  
  // Handle Create Minute Success
  const handleCreateMinuteSuccess = () => {
    console.log('✅ [InvoiceDetail] Biên bản đã được tạo thành công!')
    // Có thể refresh lại invoice data hoặc hiển thị thông báo success
    fetchInvoiceDetail()
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner />
      </Box>
    )
  }

  // Error state
  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy hóa đơn'}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Quay lại</Button>
      </Box>
    )
  }

  return (
    <>
      <Box 
        sx={{ 
          p: 3,
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Button Row */}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ textTransform: 'none' }}>
            Quay lại
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={async () => {
              try {
                await invoiceService.saveInvoicePDF(invoice.invoiceID, invoice.invoiceNumber)
              } catch (err) {
                alert('Không thể tải PDF: ' + (err instanceof Error ? err.message : 'Unknown'))
              }
            }}
            sx={{ textTransform: 'none' }}>
            Tải PDF
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ textTransform: 'none' }}>
            In hóa đơn
          </Button>
          
          {/* Actions Menu */}
          {invoice.invoiceNumber > 0 && (
            <Button
              variant="outlined"
              endIcon={<MoreVertIcon />}
              onClick={handleOpenActionsMenu}
              sx={{ textTransform: 'none', minWidth: 120 }}>
              Thao tác
            </Button>
          )}
        </Stack>

        {/* Info Row */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Box sx={{ maxWidth: '21cm', width: '100%' }}>
            {/* ✅ Display adjustment/replacement reason with correct label */}
            {invoice.adjustmentReason && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isReplacementInvoice ? 'Lý do thay thế:' : 'Lý do điều chỉnh:'}
                </Typography>
                <Typography variant="body2">
                  {invoice.adjustmentReason}
                </Typography>
              </Alert>
            )}
            
            {/* ✅ Display rejection reason if invoice is REJECTED */}
            {invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.REJECTED && invoice.notes && invoice.notes.includes('Từ chối:') && (
              <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  ⚠️ Hóa đơn bị từ chối duyệt
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Lý do: {invoice.notes.replace('Từ chối: ', '')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Vui lòng chỉnh sửa hóa đơn theo yêu cầu và gửi lại duyệt
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>

        {/* Actions Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={openActionsMenu}
          onClose={handleCloseActionsMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              minWidth: 280,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: 1.5,
            },
          }}>
          
          {/* Gửi thông báo sai sót (04) */}
          <MenuItem
            onClick={handleOpenTaxErrorModal}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'error.lighter',
              },
            }}>
            <ListItemIcon>
              <ErrorOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Gửi thông báo sai sót (04)"
              secondary="Thông báo sai sót đến CQT"
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
              }}
            />
          </MenuItem>
          
          <Divider />
          
          {/* Lịch sử thao tác */}
          <MenuItem
            onClick={handleOpenHistoryModal}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}>
            <ListItemIcon>
              <HistoryIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Lịch sử thao tác"
              secondary="Xem lịch sử thay đổi hóa đơn"
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
              }}
            />
          </MenuItem>
          
          <Divider />
          
          {/* Tạo Biên Bản ĐC/TT */}
          <MenuItem
            onClick={handleCreateAdjustmentReport}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'primary.lighter',
              },
            }}>
            <ListItemIcon>
              <DescriptionIcon 
                fontSize="small" 
                color="primary" 
              />
            </ListItemIcon>
            <ListItemText
              primary="Tạo Biên Bản ĐC/TT"
              secondary="Lập biên bản điều chỉnh/thay thế hóa đơn"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'primary.main',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
              }}
            />
          </MenuItem>
          
          <Divider />
          
          {/* Tạo HĐ điều chỉnh - Yêu cầu biên bản điều chỉnh đã được 2 bên thỏa thuận */}
          <MenuItem
            onClick={() => {
              if (!canCreateAdjustmentInvoice) return
              handleCloseActionsMenu()
              navigate(`/invoices/${invoice.invoiceID}/adjust`)
            }}
            disabled={!canCreateAdjustmentInvoice || adjustmentMinuteStatus.loading}
            sx={{ 
              py: 1.5,
              opacity: canCreateAdjustmentInvoice ? 1 : 0.6,
            }}>
            <ListItemIcon>
              <FindReplaceIcon 
                fontSize="small" 
                color={canCreateAdjustmentInvoice ? 'warning' : 'disabled'} 
              />
            </ListItemIcon>
            <ListItemText
              primary="Tạo HĐ điều chỉnh"
              secondary={
                adjustmentMinuteStatus.loading 
                  ? 'Đang kiểm tra biên bản...'
                  : canCreateAdjustmentInvoice
                    ? `✅ ${adjustmentMinuteStatus.minute?.minuteCode || 'Biên bản đã thỏa thuận'}`
                    : `⚠️ ${adjustmentMinuteStatus.reason}`
              }
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: canCreateAdjustmentInvoice ? 'text.primary' : 'text.disabled',
              }}
              secondaryTypographyProps={{
                fontSize: '0.7rem',
                color: canCreateAdjustmentInvoice ? 'success.main' : 'warning.main',
              }}
            />
          </MenuItem>
          
          {/* Tạo HĐ thay thế - Yêu cầu biên bản thay thế đã được 2 bên thỏa thuận */}
          <MenuItem
            onClick={() => {
              if (!canCreateReplacementInvoice) return
              handleCloseActionsMenu()
              navigate(`/invoices/${invoice.invoiceID}/replace`)
            }}
            disabled={!canCreateReplacementInvoice || replacementMinuteStatus.loading}
            sx={{ 
              py: 1.5,
              opacity: canCreateReplacementInvoice ? 1 : 0.6,
            }}>
            <ListItemIcon>
              <RestoreIcon 
                fontSize="small" 
                color={canCreateReplacementInvoice ? 'warning' : 'disabled'} 
              />
            </ListItemIcon>
            <ListItemText
              primary="Tạo HĐ thay thế"
              secondary={
                replacementMinuteStatus.loading 
                  ? 'Đang kiểm tra biên bản...'
                  : canCreateReplacementInvoice
                    ? `✅ ${replacementMinuteStatus.minute?.minuteCode || 'Biên bản đã thỏa thuận'}`
                    : `⚠️ ${replacementMinuteStatus.reason}`
              }
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: canCreateReplacementInvoice ? 'text.primary' : 'text.disabled',
              }}
              secondaryTypographyProps={{
                fontSize: '0.7rem',
                color: canCreateReplacementInvoice ? 'success.main' : 'warning.main',
              }}
            />
          </MenuItem>
        </Menu>

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden', // Prevent horizontal scroll
        }}
      >
        <Box 
          sx={{ 
            maxWidth: '21cm',
            width: '100%',
            '@media (max-width: 900px)': {
              maxWidth: '100%',
              px: 1,
            },
          }}
        >
          {/* Loading State */}
          {loadingHtml && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <Stack alignItems="center" spacing={2}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Đang tải HTML preview từ backend...
                </Typography>
              </Stack>
            </Box>
          )}
          
          {/* Warning banner nếu HTML thiếu buyer name */}
          {!loadingHtml && htmlPreview && htmlMissingBuyerName && invoice.contactPerson && (
            <Alert 
              severity="warning" 
              icon={<ErrorOutlineIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                ⚠️ <strong>Backend HTML thiếu thông tin:</strong> "Họ tên người mua hàng" đã được bổ sung từ dữ liệu frontend: <strong>{invoice.contactPerson}</strong>
              </Typography>
            </Alert>
          )}
          
          {/* HTML Preview Display */}
          {!loadingHtml && htmlPreview && (
            <Box 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                mb: 2,
              }}
            >
              <iframe
                srcDoc={htmlPreview}
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '297mm', // A4 height
                  border: 'none',
                  display: 'block',
                }}
                title={`Invoice ${invoice?.invoiceNumber || invoice?.invoiceID} Preview`}
                onLoad={(e) => {
                  const iframe = e.target as HTMLIFrameElement
                  if (iframe.contentWindow) {
                    try {
                      const contentHeight = iframe.contentWindow.document.body.scrollHeight
                      iframe.style.height = contentHeight + 'px'
                    } catch (err) {
                      console.log('Cannot access iframe content height (CORS):', err)
                    }
                  }
                }}
              />
            </Box>
          )}
          
          {/* Error State - No HTML */}
          {!loadingHtml && !htmlPreview && (
            <Alert severity="error" sx={{ mb: 2 }}>
              ❌ Không thể tải HTML preview từ backend. Vui lòng kiểm tra API hoặc thử lại sau.
            </Alert>
          )}
        </Box>
      </Box>

      </Box>

      {invoice && invoice.invoiceNumber > 0 && (
        <InvoicePreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          invoiceId={invoice.invoiceID}
          invoiceNumber={invoice.invoiceNumber.toString()}
          invoiceType={invoice.invoiceType}
          originalInvoiceNumber={invoice.originalInvoiceNumber}
          adjustmentReason={invoice.adjustmentReason || undefined}
        />
      )}
      
      {/* Tax Error Notification Modal */}
      <TaxErrorNotificationModal
        open={showTaxErrorModal}
        onClose={() => setShowTaxErrorModal(false)}
        invoice={invoice}
        company={company}
        onSuccess={handleTaxErrorSuccess}
      />

      {/* Invoice History Modal */}
      <Dialog
        open={showHistoryModal}
        onClose={handleCloseHistoryModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
          },
        }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lịch sử thao tác hóa đơn
            </Typography>
          </Box>
          <IconButton onClick={handleCloseHistoryModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Chưa có lịch sử thao tác
              </Typography>
            </Box>
          ) : (
            <Timeline position="right">
              {historyData.map((item, index) => (
                <TimelineItem key={item.historyID}>
                  <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3, py: 1.5 }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                      {new Date(item.date).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.date).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </TimelineOppositeContent>
                  
                  <TimelineSeparator>
                    <TimelineDot 
                      color={invoiceHistoryService.getActionTypeColor(item.actionType)}
                      variant={index === 0 ? 'filled' : 'outlined'}
                    />
                    {index < historyData.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  
                  <TimelineContent sx={{ py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {invoiceHistoryService.getActionTypeLabel(item.actionType)}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Người thực hiện: {item.performerName}
                      </Typography>
                      
                      {item.referenceInvoiceID && item.referenceInvoiceNumber && (
                        <Chip
                          icon={<LinkIcon sx={{ fontSize: 14 }} />}
                          label={`HĐ tham chiếu: ${item.referenceInvoiceNumber}`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseHistoryModal} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Minute Dialog (Biên Bản ĐC/TT) */}
      {invoice && (
        <CreateMinuteDialog
          open={showCreateMinuteDialog}
          onClose={() => setShowCreateMinuteDialog(false)}
          onSuccess={handleCreateMinuteSuccess}
          invoiceId={invoice.invoiceID}
          invoiceNumber={invoice.invoiceNumber}
        />
      )}
    </>
  )
}

export default InvoiceDetail