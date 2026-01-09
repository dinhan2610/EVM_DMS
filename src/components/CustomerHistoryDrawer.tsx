import { useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { ISalesCustomer } from '../page/SalesCustomerPage'
import dayjs from 'dayjs'

interface CustomerHistoryDrawerProps {
  open: boolean
  customer: ISalesCustomer | null
  onClose: () => void
}

interface InvoiceHistory {
  id: string
  invoiceNumber: string
  date: string
  amount: number
  status: 'Paid' | 'Unpaid'
}

// Mock invoice data
const MOCK_INVOICE_HISTORY: Record<string, InvoiceHistory[]> = {
  '1': [
    {
      id: '1',
      invoiceNumber: 'INV-2026-001',
      date: '2026-01-08',
      amount: 45000000,
      status: 'Paid',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-312',
      date: '2025-12-25',
      amount: 80000000,
      status: 'Paid',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2025-289',
      date: '2025-12-10',
      amount: 35000000,
      status: 'Unpaid',
    },
  ],
  '2': [
    {
      id: '4',
      invoiceNumber: 'INV-2026-002',
      date: '2026-01-09',
      amount: 85000000,
      status: 'Paid',
    },
  ],
  '4': [
    {
      id: '5',
      invoiceNumber: 'INV-2026-003',
      date: '2026-01-05',
      amount: 45000000,
      status: 'Paid',
    },
  ],
  '6': [
    {
      id: '6',
      invoiceNumber: 'INV-2026-004',
      date: '2026-01-07',
      amount: 95000000,
      status: 'Unpaid',
    },
  ],
}

const CustomerHistoryDrawer = ({ open, customer, onClose }: CustomerHistoryDrawerProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    phone: '',
    email: '',
  })

  // Get invoice history for customer
  const invoiceHistory = customer ? MOCK_INVOICE_HISTORY[customer.id] || [] : []

  // Calculate total debt (unpaid invoices)
  const totalDebt = invoiceHistory
    .filter((invoice) => invoice.status === 'Unpaid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  // Handle edit mode
  const handleStartEdit = () => {
    if (customer) {
      setEditForm({
        phone: customer.phone,
        email: customer.email,
      })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSaveEdit = () => {
    // TODO: Call API to update customer
    console.log('Save customer:', editForm)
    setIsEditing(false)
  }

  // Handle send reminder
  const handleSendReminder = () => {
    // TODO: Call API to send debt reminder
    console.log('Send reminder to:', customer)
  }

  if (!customer) return null

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500 },
          boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {customer.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                MST: {customer.taxCode}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Customer Info Section */}
          <Paper
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Thông tin liên hệ
              </Typography>

              {!isEditing ? (
                <Tooltip title="Chỉnh sửa" arrow>
                  <IconButton size="small" onClick={handleStartEdit} sx={{ color: 'primary.main' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Lưu" arrow>
                    <IconButton size="small" onClick={handleSaveEdit} sx={{ color: 'success.main' }}>
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hủy" arrow>
                    <IconButton size="small" onClick={handleCancelEdit} sx={{ color: 'error.main' }}>
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Box>

            <Stack spacing={2}>
              {/* Address */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Địa chỉ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {customer.address}
                </Typography>
              </Box>

              {/* Phone */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Số điện thoại
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
                    {customer.phone}
                  </Typography>
                )}
              </Box>

              {/* Email */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Email
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {customer.email}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* Debt Alert */}
          {totalDebt > 0 && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.main',
                bgcolor: 'error.lighter',
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.12)',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 0.5 }}>
                    Công nợ hiện tại
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatCurrency(totalDebt)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<NotificationsActiveIcon />}
                  onClick={handleSendReminder}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Nhắc nợ
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Invoice History */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Lịch sử hóa đơn
            </Typography>

            {invoiceHistory.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Chưa có hóa đơn nào
                </Typography>
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Số HĐ</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Ngày</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        Số tiền
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        TT
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceHistory.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1976d2' }}>
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                            {dayjs(invoice.date).format('DD/MM/YYYY')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {formatCurrency(invoice.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={invoice.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            color={invoice.status === 'Paid' ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default CustomerHistoryDrawer
