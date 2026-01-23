import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Paper,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PaymentIcon from '@mui/icons-material/Payment'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import {
  getStatementPayments,
  type StatementPaymentHistoryResponse,
  type StatementPaymentRecord,
} from '@/services/statementService'

dayjs.locale('vi')

interface StatementPaymentHistoryModalProps {
  open: boolean
  onClose: () => void
  statementId: string
  statementCode: string
  customerName: string
}

const StatementPaymentHistoryModal: React.FC<StatementPaymentHistoryModalProps> = ({
  open,
  onClose,
  statementId,
  statementCode,
  customerName,
}) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<StatementPaymentHistoryResponse | null>(null)

  // Load payment history when modal opens
  const loadPaymentHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const history = await getStatementPayments(Number(statementId))
      setPaymentHistory(history)
    } catch (err) {
      console.error('❌ Error loading payment history:', err)
      setError('Không thể tải lịch sử thanh toán')
    } finally {
      setLoading(false)
    }
  }, [statementId])

  useEffect(() => {
    if (open) {
      loadPaymentHistory()
    }
  }, [open, loadPaymentHistory])

  // Format currency VND
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }



  
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '2px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              📜 Lịch sử thanh toán
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              {statementCode} - {customerName}
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          size="small"
          sx={{
            minWidth: 'auto',
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'action.hover' },
          }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, px: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && paymentHistory && (
          <>
            {/* Summary Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2.5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                    Tổng tiền
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {formatCurrency(paymentHistory.totalAmount)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                    Đã thanh toán
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {formatCurrency(paymentHistory.paidAmount)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                    Còn nợ
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: paymentHistory.balanceDue > 0 ? '#d32f2f' : '#2e7d32',
                    }}
                  >
                    {formatCurrency(paymentHistory.balanceDue)}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
             
              
            </Paper>

            {/* Payment History List */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <PaymentIcon sx={{ color: '#1976d2' }} />
                Lịch sử thanh toán ({paymentHistory.payments.length} lần)
              </Typography>

              {paymentHistory.payments.length === 0 ? (
                <Alert severity="info" icon={<AccountBalanceIcon />}>
                  Chưa có thanh toán nào cho bảng kê này
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {paymentHistory.payments.map((payment: StatementPaymentRecord) => (
                    <Paper
                      key={payment.statementPaymentId}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1976d2',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            {dayjs(payment.paymentDate).format('DD/MM/YYYY HH:mm')}
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: '#2e7d32', fontSize: '1.1rem' }}
                        >
                          {formatCurrency(payment.appliedAmount)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#666', minWidth: 130 }}>
                            Phương thức:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                           
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {payment.paymentMethod}
                            </Typography>
                          </Box>
                        </Box>

                        {payment.transactionCode && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666', minWidth: 130 }}>
                              Mã giao dịch:
                            </Typography>
                            <Chip
                              label={payment.transactionCode}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                            />
                          </Box>
                        )}

                        {/* ✅ Hiển thị số hóa đơn */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#666', minWidth: 130 }}>
                            Hóa đơn số:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            {String(payment.invoiceNumber).padStart(7, '0')}
                          </Typography>
                        </Box>

                        {payment.note && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666', minWidth: 130 }}>
                              Ghi chú:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
                              {payment.note}
                            </Typography>
                          </Box>
                        )}

                        {/* ✅ Hiển thị còn nợ của BẢNG KÊ sau TT (không phải hóa đơn) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#666', minWidth: 130 }}>
                            Còn nợ bảng kê:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: payment.statementBalanceAfter > 0 ? '#d32f2f' : '#2e7d32',
                            }}
                          >
                            {formatCurrency(payment.statementBalanceAfter)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StatementPaymentHistoryModal
