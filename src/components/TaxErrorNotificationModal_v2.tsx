/**
 * 📋 TAX ERROR NOTIFICATION MODAL - MẪU 04/SS-HĐĐT
 * Modal khai báo thông tin hóa đơn sai sót
 * Replicated from official Vietnamese E-invoice System UI
 * 
 * @component TaxErrorNotificationModal
 * @version 2.0
 * @author EIMS Team
 * @created 2026-01-14
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'  // ✅ For invoice detail navigation
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  InputAdornment,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Check as CheckIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import type { InvoiceListItem } from '@/services/invoiceService'
import { INVOICE_TYPE_LABELS } from '@/services/invoiceService'
import invoiceService from '@/services/invoiceService'  // ✅ For Mode 2
import type { Company } from '@/services/companyService'
import companyService from '@/services/companyService'  // ✅ For Mode 2
import taxErrorNotificationService from '@/services/taxErrorNotificationService'
import templateService from '@/services/templateService'

// ==================== INTERFACES ====================

/**
 * General Information (Section A)
 */
interface ITaxErrorHeader {
  notificationType: number  // 1-4: Hủy/Điều chỉnh/Thay thế/Giải trình
  notificationNumber: string
  taxAuthority: string
  taxpayerName: string
  taxCode: string
  createdDate: Dayjs
  place: string
}

/**
 * ✅ REMOVED: ErrorType enum (no longer needed - hardcoded to 2)
 * Backend chỉ hỗ trợ "Điều chỉnh" (type 2)
 */

/**
 * Invoice Detail (Table Row - Section B)
 * ✅ UPDATED: Removed errorType (always 2 - Điều chỉnh)
 */
interface ITaxErrorDetail {
  stt: number
  invoiceId: number           // ID hóa đơn (cần cho API)
  templateCode: string        // Mẫu số
  serial: string              // Ký hiệu
  invoiceNumber: string       // Số hóa đơn
  invoiceDate: Dayjs          // Ngày hóa đơn
  invoiceType: string         // Loại hóa đơn áp dụng
  // ✅ REMOVED: errorType (hardcoded to 2 in API call)
  reason: string              // Lý do sai sót (Required *)
  taxAuthorityCode: string    // Mã CQT cấp (34 chars)
}

/**
 * Component Props
 * 
 * Mode 1: Pass invoice + company directly (from InvoiceDetail page)
 * Mode 2: Pass notificationId to fetch invoice data from notification
 */
interface TaxErrorNotificationModalProps {
  open: boolean
  onClose: () => void
  invoice?: InvoiceListItem | null  // ✅ Optional: Mode 1
  company?: Company | null  // ✅ Optional: Mode 1
  notificationId?: number  // ✅ Optional: Mode 2 - fetch from notification
  onSuccess?: () => void
}

// ==================== CONSTANTS ====================

/**
 * ✅ SIMPLIFIED: Backend chỉ hỗ trợ "Điều chỉnh" (type 2)
 * Removed ERROR_TYPE_OPTIONS và NOTIFICATION_TYPE_OPTIONS
 * Hardcode notificationType = 2, errorType = 2
 */
const NOTIFICATION_TYPE_LABEL = 'Thông báo điều chỉnh của Người bán'
const ERROR_TYPE_LABEL = 'Điều chỉnh'

/**
 * Tax Authority Code to Name mapping
 */
const getTaxAuthorityName = (code: string): string => {
  const mapping: Record<string, string> = {
    '100394': 'Cục Thuế TP. Hà Nội',
    '100395': 'Cục Thuế TP. Hồ Chí Minh',
  }
  return mapping[code] || `Cơ quan thuế (${code})`
}

// ==================== COMPONENT ====================

const TaxErrorNotificationModal: React.FC<TaxErrorNotificationModalProps> = ({
  open,
  onClose,
  invoice,
  company,
  notificationId,  // ✅ Add notificationId
  onSuccess,
}) => {
  // ==================== HOOKS ====================
  
  const navigate = useNavigate()  // ✅ For invoice detail navigation

  // ==================== STATE ====================

  const [headerData, setHeaderData] = useState<ITaxErrorHeader>({
    notificationType: 2,  // ✅ HARDCODED: Điều chỉnh (only supported type)
    notificationNumber: '',
    taxAuthority: '',
    taxpayerName: '',
    taxCode: '',
    createdDate: dayjs(),
    place: 'Hà Nội',
  })

  const [detailData, setDetailData] = useState<ITaxErrorDetail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Đang xử lý...')  // ✅ Dynamic loading message

  // ==================== HELPER: Initialize Modal Data ====================
  
  /**
   * Initialize modal with invoice + company data
   * Extracted as helper to support both Mode 1 (direct props) and Mode 2 (fetch from notification)
   */
  const initializeModalData = async (invoiceData: InvoiceListItem, companyData: Company) => {
    try {
      // ✅ VALIDATION: Check if invoice has valid ID
      if (!invoiceData.invoiceID || invoiceData.invoiceID <= 0) {
        console.error('❌ [Modal_v2] Invalid invoice data:', invoiceData)
        setError('Dữ liệu hóa đơn không hợp lệ (thiếu invoiceID)')
        setLoading(false)
        return
      }
      
      console.log('📋 [Modal_v2] Initializing with invoice:', {
        invoiceID: invoiceData.invoiceID,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceType: invoiceData.invoiceType,
      })
      
      // Generate notification number (Format: TB-DDMMYYYY_HHMM)
      const now = dayjs()
      const notificationNumber = `TB-${now.format('DDMMYYYY_HHmm')}`

      // Extract city from company address
      const cityMatch = companyData.address.match(/,\s*([^,]+)$/i)
      const defaultCity = cityMatch ? cityMatch[1].trim() : 'Hà Nội'

      // Get tax authority code
      const taxAuthorityCode = invoiceData.taxAuthorityCode 
        || companyData.taxAuthorityCode 
        || (defaultCity.includes('Hà Nội') || defaultCity.includes('Hanoi') ? '100394' : '100395')

      // Set header data
      setHeaderData({
        notificationType: 2,
        notificationNumber,
        taxAuthority: taxAuthorityCode,
        taxpayerName: companyData.companyName,
        taxCode: companyData.taxCode,
        createdDate: dayjs(),
        place: defaultCity,
      })

      // Format invoice number
      const formattedInvoiceNumber = invoiceData.invoiceNumber > 0
        ? invoiceData.invoiceNumber.toString().padStart(7, '0')
        : 'Chưa cấp số'

      // Get invoice type label
      const invoiceTypeLabel = INVOICE_TYPE_LABELS[invoiceData.invoiceType] || 'Hóa đơn điện tử'
      const fullInvoiceType = `${invoiceTypeLabel} (theo NĐ123/2020/NĐ-CP)`

      // Fetch serial if needed
      let serial = invoiceData.originalInvoiceSymbol || ''
      if (!serial && invoiceData.templateID) {
        try {
          console.log('⚠️ originalInvoiceSymbol is null, fetching from template...')
          const template = await templateService.getTemplateById(invoiceData.templateID)
          serial = template.serial || '---'
          console.log('✅ Fetched serial from template:', serial)
        } catch (error) {
          console.error('❌ Failed to fetch template serial:', error)
          serial = '---'
        }
      }
      
      if (!serial) {
        serial = '---'
        console.warn('⚠️ Invoice missing serial')
      }

      // Create invoice detail row
      const invoiceDetail: ITaxErrorDetail = {
        stt: 1,
        invoiceId: invoiceData.invoiceID,
        templateCode: invoiceData.templateID?.toString() || '---',
        serial,
        invoiceNumber: formattedInvoiceNumber,
        invoiceDate: invoiceData.signDate ? dayjs(invoiceData.signDate) : dayjs(),
        invoiceType: fullInvoiceType,
        reason: '',
        taxAuthorityCode: invoiceData.taxAuthorityCode || '',
      }

      console.log('[Modal_v2] 📋 Initialized invoice data:', {
        invoiceId: invoiceData.invoiceID,
        invoiceNumber: formattedInvoiceNumber,
        serial,
        templateID: invoiceData.templateID,
      })

      setDetailData([invoiceDetail])
      setError(null)
      setLoading(false)
      
    } catch (err) {
      console.error('❌ [Modal_v2] Initialize failed:', err)
      setError(err instanceof Error ? err.message : 'Không thể khởi tạo dữ liệu')
      setLoading(false)
    }
  }

  // ==================== EFFECTS ====================

  /**
   * Initialize data when modal opens
   * Mode 1: invoice + company props provided directly
   * Mode 2: notificationId provided → fetch notification → get invoiceId → fetch invoice + company
   */
  useEffect(() => {
    // ✅ MODE 2: Fetch from notificationId
    if (open && notificationId && !invoice) {
      const fetchFromNotification = async () => {
        try {
          setLoading(true)
          setError(null)
          setLoadingMessage('Đang tải thông tin từ thông báo...')
          
          console.log(`[🔔 Mode 2] Fetching notification ${notificationId}...`)
          
          // Step 1: Get notification detail
          const notification = await taxErrorNotificationService.getNotificationById(notificationId)
          
          if (!notification.details || notification.details.length === 0) {
            throw new Error('Thông báo không có hóa đơn liên kết')
          }
          
          const firstInvoiceId = notification.details[0].invoiceId
          console.log(`[🔔 Mode 2] Found invoiceId: ${firstInvoiceId}`)
          
          setLoadingMessage('Đang tải thông tin hóa đơn...')
          
          // Step 2: Fetch invoice data
          const invoiceData = await invoiceService.getInvoiceById(firstInvoiceId)
          console.log(`[🔔 Mode 2] Invoice loaded:`, invoiceData)
          
          setLoadingMessage('Đang tải thông tin công ty...')
          
          // Step 3: Fetch company data
          const companyData = await companyService.getCompanyById(invoiceData.companyId)
          console.log(`[🔔 Mode 2] Company loaded:`, companyData)
          
          // Now initialize with fetched data
          await initializeModalData(invoiceData, companyData)
          
        } catch (err) {
          console.error('[❌ Mode 2] Failed to load from notification:', err)
          setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu từ thông báo')
          setLoading(false)
        }
      }
      
      fetchFromNotification()
      return
    }
    
    // ✅ MODE 1: Direct invoice + company props
    if (open && invoice && company) {
      setLoading(true)
      initializeModalData(invoice, company)
    } else if (open && !notificationId) {
      // Handle missing data
      if (!invoice) {
        setError('❌ Không tìm thấy thông tin hóa đơn')
      } else if (!company) {
        setError('❌ Không tìm thấy thông tin công ty')
      }
    }
  }, [open, invoice, company, notificationId])

  // ==================== HANDLERS ====================

  /**
   * Handle header field change
   */
  const handleHeaderChange = (field: keyof ITaxErrorHeader, value: string | number | Dayjs | null) => {
    setHeaderData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  /**
   * Handle detail field change (Table row)
   * ✅ UPDATED: Removed ErrorType from value union (errorType field removed)
   */
  const handleDetailChange = (index: number, field: keyof ITaxErrorDetail, value: string | number | Dayjs) => {
    setDetailData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  /**
   * Validate form data
   * ✅ FIX Bug #3: Add comprehensive validation
   */
  const validateForm = (): string | null => {
    // ✅ Validate notificationTypeCode (must be 1-4, not 0)
    if (!headerData.notificationType || headerData.notificationType === 0) {
      return '⚠️ Vui lòng chọn loại thông báo hợp lệ (không được để giá trị 0)'
    }

    // Check if place is filled
    if (!headerData.place.trim()) {
      return 'Vui lòng nhập nơi lập thông báo'
    }

    // ✅ Validate createdDate is not in future
    if (headerData.createdDate.isAfter(dayjs(), 'day')) {
      return '⚠️ Ngày lập thông báo không được là ngày tương lai'
    }

    // Check if table has at least one row
    if (detailData.length === 0) {
      return 'Chưa có hóa đơn nào để khai báo'
    }

    // Validate each row
    for (const detail of detailData) {
      // ✅ REMOVED: errorType validation (hardcoded to 2)
      
      const trimmedReason = detail.reason.trim()
      
      // ✅ Check if reason is empty
      if (!trimmedReason) {
        return `Vui lòng nhập lý do sai sót cho hóa đơn số ${detail.invoiceNumber}`
      }
      
      // ✅ Check for placeholder text
      const placeholderPatterns = [
        /^string$/i,
        /^nhập lý do/i,
        /^enter reason/i,
        /^test$/i,
        /^xxx+$/i,
      ]
      if (placeholderPatterns.some(pattern => pattern.test(trimmedReason))) {
        return `⚠️ Lý do sai sót không hợp lệ (hóa đơn số ${detail.invoiceNumber}). Vui lòng nhập nội dung thực tế.`
      }
      
      // ✅ Validate min length (10 chars)
      if (trimmedReason.length < 10) {
        return `Lý do sai sót phải có ít nhất 10 ký tự (Hóa đơn số ${detail.invoiceNumber}) - Hiện tại: ${trimmedReason.length}/10`
      }
      
      // ✅ Validate max length (500 chars)
      if (trimmedReason.length > 500) {
        return `⚠️ Lý do sai sót quá dài (tối đa 500 ký tự). Hóa đơn số ${detail.invoiceNumber} - Hiện tại: ${trimmedReason.length}/500`
      }
      
      // ✅ Validate createdDate >= invoiceDate
      if (headerData.createdDate.isBefore(detail.invoiceDate, 'day')) {
        return `⚠️ Ngày lập thông báo (${headerData.createdDate.format('DD/MM/YYYY')}) không được trước ngày hóa đơn (${detail.invoiceDate.format('DD/MM/YYYY')})`
      }
      
      if (!detail.taxAuthorityCode || detail.taxAuthorityCode === '---') {
        return `Hóa đơn số ${detail.invoiceNumber} thiếu mã cơ quan thuế. Vui lòng kiểm tra lại dữ liệu.`
      }
    }

    return null
  }

  /**
   * Handle save notification
   */
  const handleSave = async () => {
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    setLoadingMessage('Đang tạo thông báo...')  // ✅ Phase 1

    try {
      // ✅ CALL REAL API - Create Draft Notification
      console.log('[Modal_v2] Creating draft notification...')
      
      // Generate notification number
      const notificationNumber = `TB-${dayjs().format('DDMMYYYY_HHmm')}`
      
      // ✅ SIMPLIFIED: Hardcode errorType = 2 (Điều chỉnh)
      // Backend chỉ hỗ trợ loại này
      const errorItems = detailData.map(detail => ({
        invoiceId: detail.invoiceId,
        errorType: 2,  // ✅ HARDCODED: Always "Điều chỉnh"
        reason: detail.reason.trim(),  // ✅ Trim whitespace
      }))
      
      // ✅ FIX Bug #1 & #5: Use taxAuthorityCode from invoice/company (already set in headerData.taxAuthority)
      // headerData.taxAuthority already contains the 6-digit code (100394/100395)
      const taxAuthorityCode = headerData.taxAuthority || '100395'
      
      const response = await taxErrorNotificationService.createDraft({
        notificationTypeCode: 2,  // ✅ HARDCODED: Always "Điều chỉnh" (only supported type)
        notificationNumber,
        taxAuthority: getTaxAuthorityName(taxAuthorityCode),  // ✅ FIX: Convert code to name for display
        taxAuthorityCode,  // ✅ FIX: Send actual 6-digit code
        taxpayerName: headerData.taxpayerName,
        taxCode: headerData.taxCode,
        createdDate: headerData.createdDate.toISOString(),
        place: headerData.place,
        errorItems,
      })
      
      const notificationId = response.data?.notificationId || response.notificationId || response.id
      console.log('[Modal_v2] ✅ Draft created successfully, ID:', notificationId)

      // ✅ OPTIMIZATION: Auto send to CQT after creating draft
      if (!notificationId) {
        throw new Error('Không nhận được ID thông báo từ server')
      }

      console.log('[Modal_v2] 📤 Auto sending notification to CQT...')
      setLoadingMessage('Đang gửi lên CQT...')  // ✅ Phase 2
      
      try {
        const sendResponse = await taxErrorNotificationService.sendToCQT(notificationId)
        const referenceId = sendResponse.referenceId || sendResponse.data?.referenceId
        const message = sendResponse.message || 'Gửi thành công'
        
        console.log('[Modal_v2] ✅ Sent to CQT successfully')
        console.log('[Modal_v2] 📋 Reference ID:', referenceId)
        console.log('[Modal_v2] 💬 Message:', message)
        
        // Show success with reference ID
        if (onSuccess) {
          onSuccess()
        }

        // TODO: Consider showing reference ID in success toast/alert
        // For now, just log it
        
      } catch (sendError) {
        console.error('[Modal_v2] ⚠️ Failed to send to CQT:', sendError)
        // Draft created but send failed - still show success
        // User can manually resend from list page
        setError(`Tạo thông báo thành công nhưng gửi CQT thất bại: ${sendError instanceof Error ? sendError.message : 'Lỗi không xác định'}. Vui lòng thử gửi lại từ danh sách.`)
        
        // Show success callback anyway (draft is created)
        if (onSuccess) {
          onSuccess()
        }
        
        // Don't close modal yet - let user see the error
        return
      }

      // Close modal only if everything succeeds
      onClose()
    } catch (err) {
      console.error('[Modal_v2] ❌ Create draft error:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu thông báo sai sót')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle close modal
   */
  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  // ==================== RENDER ====================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '95vh',
        },
      }}
    >
      {/* ==================== HEADER ==================== */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white',
          py: 1,
          px: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Khai báo thông tin hoá đơn sai sót
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ==================== CONTENT ==================== */}
      <DialogContent sx={{ p: 2, overflow: 'auto' }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        {/* ==================== SECTION A: GENERAL INFORMATION ==================== */}
        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main', fontSize: '0.875rem' }}
          >
            A. THÔNG TIN CHUNG
          </Typography>

          <Stack spacing={1.5}>
            {/* Row 1: Loại thông báo (READ-ONLY) | Số thông báo */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {/* ✅ SIMPLIFIED: Read-only notification type */}
              <TextField
                fullWidth
                label="Loại thông báo"
                value={NOTIFICATION_TYPE_LABEL}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                sx={{
                  flex: 2,
                  '& .MuiInputBase-input': {
                    bgcolor: 'grey.100',
                  },
                }}
                helperText="Theo quy định nghiệp vụ, chỉ hỗ trợ thông báo điều chỉnh"
              />
              <TextField
                fullWidth
                label="Số thông báo"
                value={headerData.notificationNumber}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-input': {
                    bgcolor: 'grey.100',
                  },
                }}
              />
            </Box>

            {/* Row 2: Cơ quan thuế tiếp nhận */}
            <Box>
              <TextField
                fullWidth
                label="Cơ quan thuế tiếp nhận"
                value={getTaxAuthorityName(headerData.taxAuthority)}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: 'grey.100',
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                Lưu ý: Để thông báo hóa đơn sai sót Quý khách hàng cần cập nhật đúng mã cơ quan thuế quản lý{' '}
                <Link href="#" underline="always" sx={{ color: 'primary.main' }}>
                  Tại đây
                </Link>
              </Typography>
            </Box>

            {/* Row 3-4: Tên người nộp thuế | Mã số thuế */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth
                label="Tên người nộp thuế"
                value={headerData.taxpayerName}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                sx={{
                  flex: 2,
                  '& .MuiInputBase-input': {
                    bgcolor: 'grey.100',
                  },
                }}
              />
              <TextField
                fullWidth
                label="Mã số thuế"
                value={headerData.taxCode}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-input': {
                    bgcolor: 'grey.100',
                  },
                }}
              />
            </Box>

            {/* Row 5: Ngày lập | Nơi lập */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <DatePicker
                  label="Ngày lập"
                  value={headerData.createdDate}
                  onChange={(newValue) => handleHeaderChange('createdDate', newValue)}
                  format="DD/MM/YYYY"
                  maxDate={dayjs()}  // ✅ Prevent selecting future dates
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      helperText: 'Ngày lập không được là ngày tương lai',
                      sx: {
                        '& .MuiFormHelperText-root': {
                          fontSize: '0.65rem',
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
              <TextField
                fullWidth
                label="Nơi lập"
                value={headerData.place}
                onChange={(e) => handleHeaderChange('place', e.target.value)}
                size="small"
                placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh"
              />
            </Box>
          </Stack>
        </Paper>

        {/* ==================== SECTION B: INVOICE LIST ==================== */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.875rem' }}>
                B. DANH SÁCH HÓA ĐƠN
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontStyle: 'italic' }}>
                💡 Cuộn ngang để xem hết các cột
              </Typography>
            </Box>
          </Box>

          <TableContainer 
            sx={{ 
              maxHeight: 'calc(90vh - 380px)',
              overflowX: 'auto',
              overflowY: 'auto',
              position: 'relative',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'grey.100',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'grey.400',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'grey.500',
                },
              },
            }}
          >
            <Table size="small" sx={{ minWidth: 1400 }} stickyHeader>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { py: 0.75, bgcolor: 'grey.100', whiteSpace: 'nowrap' } }}>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600, 
                      width: 50, 
                      fontSize: '0.8125rem',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      bgcolor: 'grey.100',
                    }}
                  >
                    STT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 80, fontSize: '0.8125rem' }}>Mẫu số</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '0.8125rem' }}>Ký hiệu</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 110, fontSize: '0.8125rem' }}>Số hoá đơn</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 110, fontSize: '0.8125rem' }}>Ngày hoá đơn</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 200, fontSize: '0.8125rem' }}>
                    Loại hoá đơn áp dụng
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 160, fontSize: '0.8125rem' }}>
                    Tính chất thông báo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 250, fontSize: '0.8125rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Lý do sai sót
                      <Typography component="span" sx={{ color: 'error.main' }}>
                        *
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 300, fontSize: '0.8125rem' }}>
                    Mã cơ quan thuế cấp
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailData.map((row, index) => (
                  <TableRow key={index} hover>
                    {/* STT - Readonly, Sticky */}
                    <TableCell 
                      align="center" 
                      sx={{ 
                        py: 0.75, 
                        bgcolor: 'grey.50',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                        fontVariantNumeric: 'tabular-nums',  // ✅ System font với số tròn
                        color: 'text.primary',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        lineHeight: 1.6,
                      }}
                    >
                      {row.stt}
                    </TableCell>

                    {/* Mẫu số - Readonly with Tooltip */}
                    <Tooltip title="Mã mẫu hóa đơn từ hệ thống" placement="top" arrow>
                      <TableCell 
                        sx={{ 
                          py: 0.75, 
                          fontSize: '0.9375rem',
                          bgcolor: 'grey.50',
                          cursor: 'help',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          color: 'text.primary',
                          lineHeight: 1.6,
                        }}
                      >
                        {row.templateCode}
                      </TableCell>
                    </Tooltip>

                    {/* Ký hiệu - Readonly with Tooltip */}
                    <Tooltip title="Ký hiệu hóa đơn" placement="top" arrow>
                      <TableCell 
                        sx={{ 
                          py: 0.75, 
                          fontSize: '0.9375rem',
                          bgcolor: 'grey.50',
                          cursor: 'help',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          color: 'primary.dark',
                          letterSpacing: '0.05em',
                          lineHeight: 1.6,
                          textTransform: 'uppercase',
                        }}
                      >
                        {row.serial}
                      </TableCell>
                    </Tooltip>

                    {/* Số hóa đơn - Clickable, navigate to detail */}
                    <Tooltip 
                      title={
                        !row.invoiceId || row.invoiceId <= 0
                          ? "⚠️ ID hóa đơn không hợp lệ - Không thể xem chi tiết"
                          : "Click để xem chi tiết hóa đơn gốc"
                      } 
                      placement="top" 
                      arrow
                    >
                      <TableCell 
                        onClick={() => {
                          // ✅ VALIDATION: Check if invoiceId is valid
                          if (!row.invoiceId || row.invoiceId <= 0) {
                            console.error('❌ [Modal_v2] Cannot navigate: Invalid invoiceId', row)
                            setError(`⚠️ Không thể mở chi tiết: ID hóa đơn không hợp lệ (${row.invoiceId})`)
                            return
                          }
                          
                          console.log('[Modal_v2] 🔗 Navigating to invoice detail:', {
                            invoiceId: row.invoiceId,
                            invoiceNumber: row.invoiceNumber,
                            url: `/invoices/${row.invoiceId}`,
                            fullRow: row,
                          })
                          
                          // Navigate to invoice detail page
                          navigate(`/invoices/${row.invoiceId}`)
                        }}
                        sx={{ 
                          fontWeight: 800,
                          py: 0.75, 
                          fontSize: '1rem',
                          bgcolor: !row.invoiceId || row.invoiceId <= 0 
                            ? 'grey.200'  // ✅ Grey out if invalid
                            : 'primary.lighter',
                          color: !row.invoiceId || row.invoiceId <= 0
                            ? 'text.disabled'  // ✅ Disabled color
                            : 'primary.main',  // ✅ Primary color for link
                          cursor: !row.invoiceId || row.invoiceId <= 0
                            ? 'not-allowed'  // ✅ Not-allowed cursor
                            : 'pointer',  // ✅ Pointer cursor
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '0.08em',
                          lineHeight: 1.6,
                          textAlign: 'center',
                          textDecoration: 'underline',  // ✅ Underline like link
                          textDecorationColor: 'transparent',  // ✅ Hidden by default
                          transition: 'all 0.2s ease',  // ✅ Smooth transition
                          opacity: !row.invoiceId || row.invoiceId <= 0 ? 0.5 : 1,  // ✅ Fade if invalid
                          '&:hover': !row.invoiceId || row.invoiceId <= 0 
                            ? {}  // ✅ No hover effect if invalid
                            : {
                                bgcolor: 'primary.main',  // ✅ Darker background on hover
                                color: 'white',  // ✅ White text on hover
                                textDecorationColor: 'white',  // ✅ Show underline on hover
                                transform: 'scale(1.05)',  // ✅ Slight zoom effect
                                boxShadow: 2,  // ✅ Add shadow
                              },
                          '&:active': !row.invoiceId || row.invoiceId <= 0
                            ? {}
                            : {
                                transform: 'scale(0.98)',  // ✅ Press effect
                              },
                        }}
                      >
                        {row.invoiceNumber}
                        {(!row.invoiceId || row.invoiceId <= 0) && (
                          <Typography 
                            component="span" 
                            sx={{ 
                              ml: 0.5, 
                              fontSize: '0.75rem', 
                              color: 'error.main',
                              fontWeight: 600 
                            }}
                          >
                            ⚠️
                          </Typography>
                        )}
                      </TableCell>
                    </Tooltip>

                    {/* Ngày hóa đơn - Readonly */}
                    <TableCell 
                      sx={{ 
                        py: 0.75, 
                        fontSize: '0.9375rem',
                        bgcolor: 'grey.50',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: 'text.primary',
                        lineHeight: 1.6,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {row.invoiceDate.format('DD/MM/YYYY')}
                    </TableCell>

                    {/* Loại hóa đơn - Readonly with wrap */}
                    <TableCell 
                      sx={{ 
                        py: 0.75,
                        bgcolor: 'grey.50',
                        maxWidth: 200,  // ✅ Slightly wider
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.875rem',  // ✅ Larger for better readability
                          lineHeight: 1.5,  // ✅ Better line height
                          display: 'block',
                          color: 'text.primary',
                          fontWeight: 500,  // ✅ Medium weight for text
                        }}
                      >
                        {row.invoiceType}
                      </Typography>
                    </TableCell>

                    {/* Tính chất thông báo - Read-only (Always "Điều chỉnh") */}
                    <TableCell sx={{ py: 0.75, bgcolor: 'grey.50', textAlign: 'center' }}>
                      {/* ✅ SIMPLIFIED: Read-only badge */}
                      <Typography 
                        variant="body2" 
                        component="span"
                        sx={{ 
                          fontFamily: 'system-ui, -apple-system, sans-serif',  // ✅ System font for text
                          bgcolor: 'info.lighter',
                          color: 'info.dark',
                          py: 0.875,  // ✅ Larger vertical padding
                          px: 2,  // ✅ More horizontal padding
                          borderRadius: 1.5,  // ✅ Rounder corners
                          display: 'inline-block',
                          fontSize: '0.875rem',  // ✅ Larger
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          lineHeight: 1.5,
                        }}
                      >
                        {ERROR_TYPE_LABEL}
                      </Typography>
                    </TableCell>

                    {/* Lý do sai sót - Editable with character counter */}
                    <TableCell sx={{ py: 0.75, bgcolor: 'background.paper' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={row.reason}
                        onChange={(e) => {
                          // ✅ Limit max 500 characters
                          if (e.target.value.length <= 500) {
                            handleDetailChange(index, 'reason', e.target.value)
                          }
                        }}
                        size="small"
                        placeholder="Nhập lý do sai sót (10-500 ký tự)"
                        error={!row.reason.trim() || row.reason.trim().length < 10}
                        helperText={
                          row.reason.trim() && row.reason.trim().length < 10
                            ? `⚠️ Tối thiểu 10 ký tự (còn thiếu ${10 - row.reason.trim().length} ký tự)`
                            : ''
                        }
                        sx={{ 
                          '& .MuiInputBase-root': { 
                            fontSize: '0.8125rem',
                            bgcolor: 'background.paper',
                          },
                          '& .MuiFormHelperText-root': {
                            fontSize: '0.65rem',
                            mx: 0,
                            mt: 0.25,
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography 
                                variant="caption" 
                                color={row.reason.length > 450 ? 'error.main' : 'text.secondary'} 
                                sx={{ 
                                  fontSize: '0.7rem',
                                  fontWeight: row.reason.length > 450 ? 600 : 400,
                                }}
                              >
                                {row.reason.length}/500
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </TableCell>

                    {/* Mã CQT - Readonly with special styling */}
                    <Tooltip 
                      title={row.taxAuthorityCode ? "Mã cơ quan thuế cấp (34 ký tự)" : "Thiếu mã CQT"} 
                      placement="top" 
                      arrow
                    >
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography
                          variant="body2"
                          component="code"
                          sx={{
                            fontFamily: '"Roboto Mono", "Courier New", Courier, monospace',  // ✅ Roboto Mono không có slashed zero
                            fontVariantNumeric: 'tabular-nums',
                            bgcolor: row.taxAuthorityCode ? 'success.lighter' : 'error.lighter',
                            color: row.taxAuthorityCode ? 'success.dark' : 'error.dark',
                            p: 0.875,
                            px: 1.25,
                            borderRadius: 1,
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'help',
                            wordBreak: 'break-all',
                            lineHeight: 1.6,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {row.taxAuthorityCode || '⚠️ Thiếu mã CQT'}
                        </Typography>
                      </TableCell>
                    </Tooltip>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </DialogContent>

      {/* ==================== FOOTER ==================== */}
      <Divider />
      <DialogActions sx={{ p: 1.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseIcon fontSize="small" />}
          variant="outlined"
          color="inherit"
          size="small"
        >
          Đóng
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <></> : <CheckIcon fontSize="small" />}
          variant="contained"
          color="primary"
          size="small"
          sx={{ minWidth: 140 }}  // ✅ Wider for longer text
        >
          {loading ? loadingMessage : 'Tạo & Gửi CQT'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaxErrorNotificationModal
