import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/vi'

// ==================== TYPES ====================

export interface StatementPaymentFormData {
  amount: number
  paymentMethod: string
  transactionCode: string
  note: string
  paymentDate: Dayjs
}

export interface StatementPaymentRecord {
  statementPaymentId: number
  paymentId: number
  invoiceId: number
  invoiceNumber: number
  appliedAmount: number
  invoiceRemainingAfter: number
  paymentDate: string
  paymentMethod: string
  transactionCode: string | null
  note: string | null
  createdBy: number
}

export interface StatementPaymentModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: StatementPaymentFormData) => Promise<void>
  statement: {
    statementID: number
    statementCode: string
    customerName: string
    totalAmount: number
    paidAmount: number
    openingBalance: number
    newCharges: number
  } | null
  paymentHistory?: StatementPaymentRecord[]
  isSubmitting?: boolean
}

// ==================== CONSTANTS ====================

const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Chuyển khoản',
  CASH: 'Tiền mặt',
  DEBT_OFFSET: 'Đổi trừ công nợ',
  OTHER: 'Khác',
}

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount)
}

const formatNumberInput = (value: string): string => {
  const num = parseFloat(value.replace(/[^\d]/g, ''))
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('vi-VN').format(num)
}

const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/\./g, '').replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// ==================== COMPONENT ====================

const StatementPaymentModal = ({
  open,
  onClose,
  onSubmit,
  statement,
 
  isSubmitting = false,
}: StatementPaymentModalProps) => {
  // Form state
  const [formData, setFormData] = useState<StatementPaymentFormData>({
    amount: 0,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    transactionCode: '',
    note: '',
    paymentDate: dayjs(),
  })

  // Validation errors
  const [errors, setErrors] = useState({
    amount: '',
    paymentMethod: '',
  })

  // Reset form when statement changes
  useEffect(() => {
    if (statement && open) {
      setFormData({
        amount: statement.totalAmount, // Default to full payment
        paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
        transactionCode: '',
        note: '',
        paymentDate: dayjs(),
      })
      setErrors({ amount: '', paymentMethod: '' })
    }
  }, [statement, open])

  // Validation
  const validate = (): boolean => {
    if (!statement) return false

    const newErrors = { amount: '', paymentMethod: '' }
    let isValid = true

    // Validate amount
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền thanh toán'
      isValid = false
    } else if (formData.amount > statement.totalAmount) {
      newErrors.amount = `Số tiền không được lớn hơn số nợ còn lại (${formatCurrency(statement.totalAmount)})`
      isValid = false
    }

    // Validate payment method
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Vui lòng chọn hình thức thanh toán'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return
    await onSubmit(formData)
  }

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!statement) return null

  const remainingAmount = statement.totalAmount

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
          💰 Ghi nhận thanh toán cho Bảng kê
        </Typography>
        <Typography variant="caption" sx={{ color: '#666' }}>
          Mã bảng kê: <strong>{statement.statementCode}</strong> - {statement.customerName}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Statement Summary */}
          <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Số dư đầu kỳ:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(statement.openingBalance)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Phí phát sinh mới:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(statement.newCharges)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Đã thanh toán:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  {formatCurrency(statement.paidAmount)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Còn nợ:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: '1.1rem' }}>
                  {formatCurrency(remainingAmount)}
                </Typography>
              </Box>
            </Stack>
          </Alert>

          
          {/* Payment Amount */}
          <TextField
            fullWidth
            required
            label="Số tiền thanh toán"
            type="text"
            value={formData.amount ? formatNumberInput(formData.amount.toString()) : ''}
            onChange={(e) => {
              const parsedAmount = parseFormattedNumber(e.target.value)
              setFormData({ ...formData, amount: parsedAmount })
              if (errors.amount) {
                setErrors({ ...errors, amount: '' })
              }
            }}
            error={!!errors.amount}
            helperText={
              errors.amount ||
              (formData.amount > 0 && formData.amount < remainingAmount
                ? '⚠️ Thanh toán một phần'
                : formData.amount === remainingAmount
                ? '✓ Thanh toán đầy đủ'
                : 'Ví dụ: 1.000.000 (dùng dấu chấm phân cách nghìn)')
            }
            InputProps={{
              endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
            }}
          />

          {/* Payment Method */}
          <FormControl fullWidth required error={!!errors.paymentMethod}>
            <InputLabel>Hình thức thanh toán</InputLabel>
            <Select
              value={formData.paymentMethod}
              onChange={(e) => {
                setFormData({ ...formData, paymentMethod: e.target.value })
                if (errors.paymentMethod) {
                  setErrors({ ...errors, paymentMethod: '' })
                }
              }}
              label="Hình thức thanh toán"
            >
              {Object.values(PAYMENT_METHODS).map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Transaction Code */}
          <TextField
            fullWidth
            label="Mã giao dịch (tùy chọn)"
            value={formData.transactionCode}
            onChange={(e) =>
              setFormData({ ...formData, transactionCode: e.target.value })
            }
            placeholder="VD: TXN123456789"
            helperText="Mã giao dịch ngân hàng hoặc mã tham chiếu"
          />

          {/* Payment Date */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <DateTimePicker
              label="Ngày thanh toán"
              value={formData.paymentDate}
              onChange={(newValue) =>
                setFormData({ ...formData, paymentDate: newValue || dayjs() })
              }
              format="DD/MM/YYYY HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Chọn ngày và giờ thực hiện thanh toán',
                },
              }}
            />
          </LocalizationProvider>

          {/* Note */}
          <TextField
            fullWidth
            label="Ghi chú (tùy chọn)"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            multiline
            rows={3}
            placeholder="Thông tin bổ sung về khoản thanh toán..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2.5, gap: 1, backgroundColor: '#fafafa' }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ textTransform: 'none' }}
        >
          Hủy
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : null}
          sx={{
            textTransform: 'none',
            minWidth: 160,
            fontWeight: 600,
          }}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StatementPaymentModal
