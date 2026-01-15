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
  MenuItem,
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
import type { Company } from '@/services/companyService'
import taxErrorNotificationService from '@/services/taxErrorNotificationService'

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
 * Error Type Enum
 */
enum ErrorType {
  CANCEL = 1,      // Hủy
  ADJUST = 2,      // Điều chỉnh
  REPLACE = 3,     // Thay thế
  EXPLAIN = 4,     // Giải trình
}

/**
 * Invoice Detail (Table Row - Section B)
 */
interface ITaxErrorDetail {
  stt: number
  invoiceId: number           // ID hóa đơn (cần cho API)
  templateCode: string        // Mẫu số
  serial: string              // Ký hiệu
  invoiceNumber: string       // Số hóa đơn
  invoiceDate: Dayjs          // Ngày hóa đơn
  invoiceType: string         // Loại hóa đơn áp dụng
  errorType: ErrorType | ''   // Tính chất thông báo
  reason: string              // Lý do sai sót (Required *)
  taxAuthorityCode: string    // Mã CQT cấp (34 chars)
}

/**
 * Component Props
 */
interface TaxErrorNotificationModalProps {
  open: boolean
  onClose: () => void
  invoice: InvoiceListItem | null
  company: Company | null
  onSuccess?: () => void
}

// ==================== CONSTANTS ====================

/**
 * Error Type Labels
 */
const ERROR_TYPE_OPTIONS = [
  { value: ErrorType.CANCEL, label: '1 - Hủy' },
  { value: ErrorType.ADJUST, label: '2 - Điều chỉnh' },
  { value: ErrorType.REPLACE, label: '3 - Thay thế' },
  { value: ErrorType.EXPLAIN, label: '4 - Giải trình' },
]

/**
 * Notification Type Options
 * Backend expects numeric codes: 1=Cancel, 2=Adjust, 3=Replace, 4=Explain
 */
const NOTIFICATION_TYPE_OPTIONS = [
  { value: 1, label: 'Thông báo hủy/giải trình của Người nộp thuế' },
  { value: 2, label: 'Thông báo điều chỉnh của Người bán' },
  { value: 3, label: 'Thông báo thay thế của Người bán' },
]

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
  onSuccess,
}) => {
  // ==================== STATE ====================

  const [headerData, setHeaderData] = useState<ITaxErrorHeader>({
    notificationType: NOTIFICATION_TYPE_OPTIONS[0].value,  // Default: 1 (Hủy/Giải trình)
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

  // ==================== EFFECTS ====================

  /**
   * Initialize data when modal opens
   */
  useEffect(() => {
    if (open && invoice && company) {
      // Generate notification number (Format: TB-DDMMYYYY_HHMM)
      const now = dayjs()
      const notificationNumber = `TB-${now.format('DDMMYYYY_HHmm')}`

      // Extract city from company address (lấy phần cuối sau dấu phẩy cuối cùng)
      const cityMatch = company.address.match(/,\s*([^,]+)$/i)
      const defaultCity = cityMatch ? cityMatch[1].trim() : 'Hà Nội'

      // Determine tax authority CODE based on city (MST của Cơ quan thuế)
      // Backend API expect mã số CQT (6 digits), NOT tên CQT
      const taxAuthorityCode = defaultCity.includes('Hà Nội') || defaultCity.includes('Hanoi')
        ? '100394'  // Cục Thuế TP. Hà Nội
        : defaultCity.includes('Hồ Chí Minh') || defaultCity.includes('Ho Chi Minh')
        ? '100395'  // Cục Thuế TP. Hồ Chí Minh
        : '100395'  // Default to HCM

      // Set header data
      setHeaderData({
        notificationType: NOTIFICATION_TYPE_OPTIONS[0].value,  // ✅ Use numeric value (1)
        notificationNumber,
        taxAuthority: taxAuthorityCode,  // ✅ Gửi mã số, không gửi text
        taxpayerName: company.companyName,
        taxCode: company.taxCode,
        createdDate: dayjs(),
        place: defaultCity,
      })

      // Format invoice number with padding (7 digits)
      const formattedInvoiceNumber = invoice.invoiceNumber > 0
        ? invoice.invoiceNumber.toString().padStart(7, '0')
        : 'Chưa cấp số'

      // Get dynamic invoice type label
      const invoiceTypeLabel = INVOICE_TYPE_LABELS[invoice.invoiceType] || 'Hóa đơn điện tử'
      const fullInvoiceType = `${invoiceTypeLabel} (theo NĐ123/2020/NĐ-CP)`

      // Validate required fields
      if (!invoice.templateID) {
        console.warn('⚠️ Invoice missing templateID')
      }
      if (!invoice.originalInvoiceSymbol) {
        console.warn('⚠️ Invoice missing originalInvoiceSymbol (serial)')
      }
      if (!invoice.taxAuthorityCode) {
        console.warn('⚠️ Invoice missing taxAuthorityCode')
      }

      // Pre-fill invoice data into table
      const invoiceDetail: ITaxErrorDetail = {
        stt: 1,
        invoiceId: invoice.invoiceID,  // ✅ Add invoiceId for API
        templateCode: invoice.templateID?.toString() || '---',
        serial: invoice.originalInvoiceSymbol || '---',
        invoiceNumber: formattedInvoiceNumber,
        invoiceDate: invoice.signDate ? dayjs(invoice.signDate) : dayjs(),
        invoiceType: fullInvoiceType,
        errorType: '',
        reason: '',
        taxAuthorityCode: invoice.taxAuthorityCode || '',
      }

      setDetailData([invoiceDetail])
      setError(null)
      setLoading(false)
    } else if (open) {
      // Handle missing data
      if (!invoice) {
        setError('❌ Không tìm thấy thông tin hóa đơn')
      } else if (!company) {
        setError('❌ Không tìm thấy thông tin công ty')
      }
    }
  }, [open, invoice, company])

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
   */
  const handleDetailChange = (index: number, field: keyof ITaxErrorDetail, value: string | number | Dayjs | ErrorType) => {
    setDetailData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    // Check if place is filled
    if (!headerData.place.trim()) {
      return 'Vui lòng nhập nơi lập thông báo'
    }

    // Check if table has at least one row
    if (detailData.length === 0) {
      return 'Chưa có hóa đơn nào để khai báo'
    }

    // Validate each row
    for (const detail of detailData) {
      if (!detail.errorType) {
        return `Vui lòng chọn tính chất thông báo cho hóa đơn số ${detail.invoiceNumber}`
      }
      if (!detail.reason.trim()) {
        return `Vui lòng nhập lý do sai sót cho hóa đơn số ${detail.invoiceNumber}`
      }
      if (detail.reason.trim().length < 10) {
        return `Lý do sai sót phải có ít nhất 10 ký tự (Hóa đơn số ${detail.invoiceNumber})`
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

    try {
      // ✅ CALL REAL API - Create Draft Notification
      console.log('[Modal_v2] Creating draft notification...')
      
      // Generate notification number
      const notificationNumber = `TB-${dayjs().format('DDMMYYYY_HHmm')}`
      
      // Build errorItems array from detailData
      const errorItems = detailData.map(detail => ({
        invoiceId: detail.invoiceId,
        errorType: detail.errorType as number,
        reason: detail.reason,
        taxpayerName: headerData.taxpayerName,
        taxCode: headerData.taxCode,
      }))
      
      const response = await taxErrorNotificationService.createDraft({
        notificationType: headerData.notificationType,
        notificationNumber,
        taxAuthority: headerData.taxAuthority || '100395',
        taxCode: headerData.taxCode,  // Top-level tax code (required by backend)
        createdDate: headerData.createdDate.toISOString(),
        place: headerData.place,
        errorItems,
      })
      
      const notificationId = response.data?.notificationId || response.notificationId || response.id
      console.log('[Modal_v2] ✅ Draft created successfully, ID:', notificationId)

      // Show success
      if (onSuccess) {
        onSuccess()
      }

      // Close modal
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
            {/* Row 1: Loại thông báo | Số thông báo */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                select
                fullWidth
                label="Loại thông báo"
                value={headerData.notificationType}
                onChange={(e) => handleHeaderChange('notificationType', Number(e.target.value))}
                size="small"
                sx={{ flex: 2 }}
              >
                {NOTIFICATION_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
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
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
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
                        fontWeight: 600,
                        color: 'text.secondary',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                      }}
                    >
                      {row.stt}
                    </TableCell>

                    {/* Mẫu số - Readonly with Tooltip */}
                    <Tooltip title="Mã mẫu hóa đơn từ hệ thống" placement="top" arrow>
                      <TableCell 
                        sx={{ 
                          py: 0.75, 
                          fontSize: '0.8125rem',
                          bgcolor: 'grey.50',
                          cursor: 'help',
                          fontFamily: 'monospace',
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
                          fontSize: '0.8125rem',
                          bgcolor: 'grey.50',
                          cursor: 'help',
                          fontFamily: 'monospace',
                          fontWeight: 500,
                        }}
                      >
                        {row.serial}
                      </TableCell>
                    </Tooltip>

                    {/* Số hóa đơn - Readonly, highlighted */}
                    <Tooltip title="Số hóa đơn được cấp" placement="top" arrow>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          py: 0.75, 
                          fontSize: '0.875rem',
                          bgcolor: 'primary.lighter',
                          color: 'primary.dark',
                          cursor: 'help',
                          fontFamily: 'monospace',
                        }}
                      >
                        {row.invoiceNumber}
                      </TableCell>
                    </Tooltip>

                    {/* Ngày hóa đơn - Readonly */}
                    <TableCell 
                      sx={{ 
                        py: 0.75, 
                        fontSize: '0.8125rem',
                        bgcolor: 'grey.50',
                        fontFamily: 'monospace',
                      }}
                    >
                      {row.invoiceDate.format('DD/MM/YYYY')}
                    </TableCell>

                    {/* Loại hóa đơn - Readonly with wrap */}
                    <TableCell 
                      sx={{ 
                        fontSize: '0.75rem', 
                        py: 0.75,
                        bgcolor: 'grey.50',
                        maxWidth: 180,
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.75rem',
                          lineHeight: 1.4,
                          display: 'block',
                        }}
                      >
                        {row.invoiceType}
                      </Typography>
                    </TableCell>

                    {/* Tính chất thông báo - Editable */}
                    <TableCell sx={{ py: 0.75, bgcolor: 'background.paper' }}>
                      <TextField
                        select
                        fullWidth
                        value={row.errorType}
                        onChange={(e) =>
                          handleDetailChange(index, 'errorType', parseInt(e.target.value) as ErrorType)
                        }
                        size="small"
                        placeholder="Chọn"
                        error={!row.errorType}
                        sx={{ 
                          '& .MuiInputBase-root': { 
                            fontSize: '0.8125rem',
                            bgcolor: 'background.paper',
                          } 
                        }}
                      >
                        {ERROR_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    {/* Lý do sai sót - Editable */}
                    <TableCell sx={{ py: 0.75, bgcolor: 'background.paper' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={row.reason}
                        onChange={(e) => handleDetailChange(index, 'reason', e.target.value)}
                        size="small"
                        placeholder="Nhập lý do sai sót (tối thiểu 10 ký tự)"
                        error={!row.reason.trim() || row.reason.trim().length < 10}
                        sx={{ 
                          '& .MuiInputBase-root': { 
                            fontSize: '0.8125rem',
                            bgcolor: 'background.paper',
                          } 
                        }}
                        InputProps={{
                          endAdornment: row.reason.trim() && (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {row.reason.trim().length}/10
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
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: row.taxAuthorityCode ? 'success.lighter' : 'error.lighter',
                            color: row.taxAuthorityCode ? 'success.dark' : 'error.dark',
                            p: 0.5,
                            borderRadius: 1,
                            display: 'block',
                            fontSize: '0.7rem',
                            cursor: 'help',
                            wordBreak: 'break-all',
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
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaxErrorNotificationModal
