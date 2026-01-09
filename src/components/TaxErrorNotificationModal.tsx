/**
 * 🔔 TAX ERROR NOTIFICATION MODAL (MẪU 04/SS-HĐĐT)
 * Modal gửi thông báo sai sót hóa đơn điện tử
 * 
 * @component TaxErrorNotificationModal
 * @description Modal để lập và gửi thông báo sai sót hóa đơn điện tử theo mẫu 04/SS-HĐĐT
 * 
 * Features:
 * - Auto-fill thông tin hóa đơn từ invoice data
 * - Chọn tính chất sai sót (Hủy/Điều chỉnh/Thay thế/Giải trình)
 * - Nhập lý do sai sót (textarea với validation)
 * - Digital signature workflow (Preview → Sign → Submit)
 * - Professional UI/UX with Material-UI
 * 
 * @author EIMS Team
 * @created 2026-01-09
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
  Chip,
  Alert,
  Divider,
  Grid,
  MenuItem,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import {
  Close as CloseIcon,
  ErrorOutline as ErrorIcon,
  Description as DocumentIcon,
  Edit as SignIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import type { InvoiceListItem } from '@/services/invoiceService'
import { Company } from '@/services/companyService'
import taxErrorNotificationService, { ErrorNotificationType } from '@/services/taxErrorNotificationService'

// ==================== TYPES ====================

/**
 * Labels hiển thị cho từng loại sai sót
 */
const ERROR_NOTIFICATION_TYPE_LABELS: Record<ErrorNotificationType, string> = {
  [ErrorNotificationType.CANCEL]: '1 - Hủy hóa đơn',
  [ErrorNotificationType.ADJUST]: '2 - Điều chỉnh',
  [ErrorNotificationType.REPLACE]: '3 - Thay thế',
  [ErrorNotificationType.EXPLAIN]: '4 - Giải trình',
}

/**
 * Workflow steps
 */
enum NotificationStep {
  FILL_FORM = 0,       // Điền thông tin
  PREVIEW = 1,         // Preview XML/Hash
  SIGN = 2,            // Ký số
  SUBMIT = 3,          // Gửi CQT
}

/**
 * API Preview response
 */
interface TaxErrorNotificationPreview {
  xml: string
  hash: string
  notificationCode: string
}

/**
 * Props
 */
interface TaxErrorNotificationModalProps {
  open: boolean
  onClose: () => void
  invoice: InvoiceListItem | null
  company: Company | null
  onSuccess?: () => void
}

// ==================== COMPONENT ====================

const TaxErrorNotificationModal: React.FC<TaxErrorNotificationModalProps> = ({
  open,
  onClose,
  invoice,
  company,
  // onSuccess - TODO: Will use when implement submit to CQT
}) => {
  // ==================== STATE ====================
  
  // Form data
  const [place, setPlace] = useState<string>('Hà Nội')
  const [notificationType, setNotificationType] = useState<ErrorNotificationType | ''>('')
  const [reason, setReason] = useState<string>('')
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<NotificationStep>(NotificationStep.FILL_FORM)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<TaxErrorNotificationPreview | null>(null)
  const [, setSignature] = useState<string | null>(null) // TODO: signature will be used when implement submit to CQT

  // ==================== EFFECTS ====================
  
  /**
   * Reset form khi modal mở
   */
  useEffect(() => {
    if (open && company) {
      // Auto-fill place from company address
      const cityMatch = company.address.match(/,\s*([^,]+)$/i)
      const defaultCity = cityMatch ? cityMatch[1].trim() : 'Hà Nội'
      setPlace(defaultCity)
      
      // Reset states
      setNotificationType('')
      setReason('')
      setCurrentStep(NotificationStep.FILL_FORM)
      setLoading(false)
      setError(null)
      setPreview(null)
      setSignature(null)
    }
  }, [open, company])

  // ==================== VALIDATION ====================
  
  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    if (!place.trim()) {
      return 'Vui lòng nhập địa danh'
    }
    if (!notificationType) {
      return 'Vui lòng chọn tính chất sai sót'
    }
    if (!reason.trim()) {
      return 'Vui lòng nhập lý do'
    }
    if (reason.trim().length < 10) {
      return 'Lý do phải có ít nhất 10 ký tự'
    }
    return null
  }

  // ==================== HANDLERS ====================
  
  /**
   * Handle notification type change
   */
  const handleNotificationTypeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value
    setNotificationType(value ? parseInt(value) as ErrorNotificationType : '')
  }

  /**
   * Handle close modal
   */
  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  /**
   * STEP 1: Preview XML/Hash
   */
  const handlePreview = async () => {
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!invoice) {
      setError('Không tìm thấy thông tin hóa đơn')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // ✅ Call API Preview
      const response = await taxErrorNotificationService.preview({
        invoiceId: invoice.invoiceID,
        place,
        notificationType: notificationType as ErrorNotificationType,
        reason,
      })

      setPreview({
        xml: response.data.xml,
        hash: response.data.hash,
        notificationCode: response.data.notificationCode,
      })
      setCurrentStep(NotificationStep.PREVIEW)
      
    } catch (err) {
      console.error('Preview error:', err)
      setError(err instanceof Error ? err.message : 'Không thể tạo preview thông báo')
    } finally {
      setLoading(false)
    }
  }

  /**
   * STEP 2: Digital Signature
   */
  const handleSign = async () => {
    if (!preview) {
      setError('Không có dữ liệu preview')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setCurrentStep(NotificationStep.SIGN)

      // TODO: Call Digital Signature Plugin
      // const signedData = await window.vnptInvoicePlugin?.sign(preview.hash)

      // Mock digital signature (2s delay)
      await new Promise(resolve => setTimeout(resolve, 2000))
      const mockSignature = `SIG_${Date.now()}_${Math.random().toString(36).substring(7)}`

      setSignature(mockSignature)
      
    } catch (err) {
      console.error('Sign error:', err)
      setError(err instanceof Error ? err.message : 'Không thể ký số thông báo')
      setCurrentStep(NotificationStep.PREVIEW) // Rollback to preview
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle back to form
   */
  const handleBackToForm = () => {
    setCurrentStep(NotificationStep.FILL_FORM)
    setPreview(null)
    setSignature(null)
    setError(null)
  }

  // ==================== RENDER ====================
  
  if (!invoice) {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* ==================== HEADER ==================== */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ErrorIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Lập thông báo sai sót (Mẫu 04/SS-HĐĐT)
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ==================== STEPPER ==================== */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          <Step>
            <StepLabel>Điền thông tin</StepLabel>
          </Step>
          <Step>
            <StepLabel>Preview XML</StepLabel>
          </Step>
          <Step>
            <StepLabel>Ký số</StepLabel>
          </Step>
          <Step>
            <StepLabel>Gửi CQT</StepLabel>
          </Step>
        </Stepper>
      </Box>

      <Divider />

      {/* ==================== CONTENT ==================== */}
      <DialogContent sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* STEP 0: FILL FORM */}
        {currentStep === NotificationStep.FILL_FORM && (
          <Stack spacing={3}>
            {/* Section 1: Read-only Invoice Info */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 1.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              >
                <InfoIcon fontSize="small" />
                Thông tin hóa đơn
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Số hóa đơn
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {invoice.invoiceNumber > 0 ? invoice.invoiceNumber.toString().padStart(7, '0') : 'Chưa cấp số'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Ký hiệu
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {invoice.originalInvoiceSymbol || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Ngày phát hành
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {invoice.signDate ? new Date(invoice.signDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Mã CQT
                    </Typography>
                    <Chip
                      label={invoice.taxAuthorityCode || 'Chưa có'}
                      size="small"
                      color={invoice.taxAuthorityCode ? 'success' : 'default'}
                      sx={{ fontWeight: 500, fontSize: '0.8rem' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: User Input */}
            <Stack spacing={2.5}>
              {/* Place */}
              <TextField
                fullWidth
                label="Địa danh"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Nhập địa danh (ví dụ: Hà Nội)"
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                required
                helperText="Địa danh nơi lập thông báo (mặc định: Thành phố công ty)"
              />

              {/* Notification Type */}
              <FormControl fullWidth required>
                <InputLabel>Tính chất sai sót</InputLabel>
                <Select
                  value={notificationType.toString()}
                  onChange={handleNotificationTypeChange}
                  label="Tính chất sai sót"
                >
                  {Object.entries(ERROR_NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Reason */}
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Lý do sai sót"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do sai sót chi tiết (tối thiểu 10 ký tự)..."
                required
                helperText={`${reason.length}/500 ký tự - Tối thiểu 10 ký tự`}
                inputProps={{
                  maxLength: 500,
                }}
                error={reason.length > 0 && reason.length < 10}
              />
            </Stack>

            {/* Info Alert */}
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                <strong>Lưu ý:</strong> Thông báo sai sót sẽ được ký số và gửi đến Cơ quan thuế. Vui lòng kiểm tra kỹ
                thông tin trước khi gửi.
              </Typography>
            </Alert>
          </Stack>
        )}

        {/* STEP 1: PREVIEW */}
        {currentStep === NotificationStep.PREVIEW && preview && (
          <Stack spacing={2}>
            <Alert severity="success" icon={<CheckIcon />}>
              ✅ Đã tạo preview thành công! Vui lòng kiểm tra XML và tiến hành ký số.
            </Alert>

            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                📄 Mã thông báo
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                {preview.notificationCode}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                🔑 Hash
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'text.secondary' }}
              >
                {preview.hash}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1.5, maxHeight: 300, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                📝 XML Preview
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {preview.xml}
              </Typography>
            </Paper>
          </Stack>
        )}

        {/* STEP 2: SIGNING */}
        {currentStep === NotificationStep.SIGN && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
              🔏 Đang ký số điện tử...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Vui lòng đợi trong giây lát
            </Typography>
          </Box>
        )}

        {/* STEP 3: SUBMITTING */}
        {currentStep === NotificationStep.SUBMIT && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} thickness={4} color="success" />
            <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
              📤 Đang gửi đến Cơ quan thuế...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Thông báo đang được xử lý
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* ==================== ACTIONS ==================== */}
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none', fontWeight: 500 }}>
          {currentStep === NotificationStep.FILL_FORM ? 'Hủy' : 'Đóng'}
        </Button>

        {currentStep === NotificationStep.FILL_FORM && (
          <Button
            variant="contained"
            onClick={handlePreview}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DocumentIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 180,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
              },
            }}
          >
            {loading ? 'Đang xử lý...' : 'Preview XML'}
          </Button>
        )}

        {currentStep === NotificationStep.PREVIEW && !loading && (
          <>
            <Button onClick={handleBackToForm} sx={{ textTransform: 'none', fontWeight: 500 }}>
              ← Quay lại
            </Button>
            <Button
              variant="contained"
              onClick={handleSign}
              disabled={loading}
              startIcon={<SignIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 180,
                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                },
              }}
            >
              Ký số & Gửi
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default TaxErrorNotificationModal
