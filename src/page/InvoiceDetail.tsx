import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
} from '@mui/material'
import {
  Send,
  Print,
  Download,
  Cancel,
  Edit,
  Replay,
  ArrowBack,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'

// Định nghĩa Interfaces
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
}

export interface InvoiceDetail {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerTaxCode: string
  customerAddress: string
  issueDate: string
  dueDate: string
  status: 'Nháp' | 'Đã ký' | 'Đã phát hành' | 'Đã gửi' | 'Bị từ chối' | 'Đã thanh toán' | 'Đã hủy'
  taxStatus: 'Chờ đồng bộ' | 'Đã đồng bộ' | 'Lỗi'
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
}

// Mock Data Chi tiết
const mockInvoiceDetail: InvoiceDetail = {
  id: '1',
  invoiceNumber: 'INV-2024-001',
  customerName: 'Công ty TNHH ABC Technology',
  customerEmail: 'contact@abctech.com',
  customerTaxCode: '0123456789',
  customerAddress: '123 Đường Lê Lợi, Quận 1, TP.HCM',
  issueDate: '2024-10-01',
  dueDate: '2024-10-31',
  status: 'Đã phát hành',
  taxStatus: 'Đã đồng bộ',
  subtotal: 15000000,
  taxAmount: 1500000,
  totalAmount: 16500000,
  notes: 'Thanh toán trong vòng 30 ngày kể từ ngày phát hành',
  items: [
    {
      id: '1',
      description: 'Dịch vụ tư vấn công nghệ thông tin - Tháng 10/2024',
      quantity: 1,
      unitPrice: 10000000,
      total: 10000000,
    },
    {
      id: '2',
      description: 'Phát triển phần mềm quản lý kho',
      quantity: 5,
      unitPrice: 800000,
      total: 4000000,
    },
    {
      id: '3',
      description: 'Bảo trì hệ thống - 3 tháng',
      quantity: 1,
      unitPrice: 1000000,
      total: 1000000,
    },
  ],
}

const mockAuditTrail: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2024-10-01 09:00:00',
    user: 'Admin Nguyễn Văn A',
    action: 'Tạo hóa đơn mới',
  },
  {
    id: '2',
    timestamp: '2024-10-01 10:30:00',
    user: 'Kế toán Trần Thị B',
    action: 'Xác nhận và ký số hóa đơn',
  },
  {
    id: '3',
    timestamp: '2024-10-01 11:00:00',
    user: 'Hệ thống',
    action: 'Đồng bộ dữ liệu lên cơ quan thuế',
  },
  {
    id: '4',
    timestamp: '2024-10-01 11:05:00',
    user: 'Hệ thống',
    action: 'Gửi email hóa đơn đến khách hàng',
  },
]

// Helper functions
const getStatusColor = (
  status: InvoiceDetail['status']
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const statusColors = {
    'Nháp': 'default' as const,
    'Đã ký': 'info' as const,
    'Đã phát hành': 'primary' as const,
    'Đã gửi': 'secondary' as const,
    'Bị từ chối': 'error' as const,
    'Đã thanh toán': 'success' as const,
    'Đã hủy': 'warning' as const,
  }
  return statusColors[status]
}

const getTaxStatusColor = (taxStatus: InvoiceDetail['taxStatus']): 'default' | 'success' | 'warning' | 'error' => {
  const taxColors = {
    'Đã đồng bộ': 'success' as const,
    'Chờ đồng bộ': 'warning' as const,
    'Lỗi': 'error' as const,
  }
  return taxColors[taxStatus]
}

const getTaxStatusIcon = (taxStatus: InvoiceDetail['taxStatus']) => {
  const icons = {
    'Đã đồng bộ': <CheckCircle fontSize="small" />,
    'Chờ đồng bộ': <Warning fontSize="small" />,
    'Lỗi': <ErrorIcon fontSize="small" />,
  }
  return icons[taxStatus]
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Giả lập việc fetch data từ API
    const fetchInvoiceDetail = async () => {
      setLoading(true)
      // Trong thực tế, đây sẽ là API call: await api.getInvoiceById(id)
      setTimeout(() => {
        setInvoice(mockInvoiceDetail)
        setAuditTrail(mockAuditTrail)
        setLoading(false)
      }, 500)
    }

    if (id) {
      fetchInvoiceDetail()
    }
  }, [id])

  // Handlers
  const handleResendEmail = () => {
    console.log('Gửi lại email hóa đơn:', invoice?.invoiceNumber)
    // API call để gửi email
  }

  const handlePrint = () => {
    console.log('In hóa đơn:', invoice?.invoiceNumber)
    // Logic in hóa đơn
    window.print()
  }

  const handleDownload = () => {
    console.log('Tải xuống hóa đơn:', invoice?.invoiceNumber)
    // API call để download PDF/XML
  }

  const handleCancelInvoice = () => {
    console.log('Hủy hóa đơn:', invoice?.invoiceNumber)
    // API call để hủy hóa đơn
  }

  const handleAdjustInvoice = () => {
    console.log('Điều chỉnh hóa đơn:', invoice?.invoiceNumber)
    // Navigate đến trang điều chỉnh
    navigate(`/invoices/${invoice?.id}/adjust`)
  }

  const handleReplaceInvoice = () => {
    console.log('Thay thế hóa đơn:', invoice?.invoiceNumber)
    // Navigate đến trang thay thế
    navigate(`/invoices/${invoice?.id}/replace`)
  }

  const handleBack = () => {
    navigate('/invoices')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Đang tải...</Typography>
      </Box>
    )
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy hóa đơn</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{
              mb: 3,
              textTransform: 'none',
              fontWeight: 500,
              color: '#666',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}>
            Quay lại danh sách
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                Chi tiết Hóa đơn
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
                #{invoice.invoiceNumber}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="medium" />
                <Chip
                  icon={getTaxStatusIcon(invoice.taxStatus)}
                  label={invoice.taxStatus}
                  color={getTaxStatusColor(invoice.taxStatus)}
                  size="medium"
                />
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            border: '1px solid #e0e0e0',
            borderRadius: 0,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666', mb: 2 }}>
            Thao tác
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleResendEmail}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 2px 8px rgba(25,118,210,0.3)' },
              }}>
              Gửi Email
            </Button>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 2px 8px rgba(25,118,210,0.3)' },
              }}>
              In
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownload}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 2px 8px rgba(25,118,210,0.3)' },
              }}>
              Tải về PDF/XML
            </Button>

            {invoice.status === 'Đã phát hành' && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={handleCancelInvoice}
                  sx={{ textTransform: 'none', fontWeight: 500 }}>
                  Hủy
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Edit />}
                  onClick={handleAdjustInvoice}
                  sx={{ textTransform: 'none', fontWeight: 500 }}>
                  Điều chỉnh
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Replay />}
                  onClick={handleReplaceInvoice}
                  sx={{ textTransform: 'none', fontWeight: 500 }}>
                  Thay thế
                </Button>
              </>
            )}
          </Stack>
        </Paper>

        <Grid container spacing={0} sx={{ mb: 4 }}>
          {/* Thông tin Hóa đơn */}
          <Grid item xs={12} md={6} sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: { xs: 3, md: 0 } }}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                height: '100%',
                borderRadius: 2,
                transition: 'box-shadow 0.3s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}>
              <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                Thông tin Khách hàng
              </Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Tên khách hàng
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {invoice.customerName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography variant="body1">{invoice.customerEmail}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Mã số thuế
                  </Typography>
                  <Typography variant="body1">{invoice.customerTaxCode}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Địa chỉ
                  </Typography>
                  <Typography variant="body1">{invoice.customerAddress}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

          <Grid item xs={12} md={6} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                height: '100%',
                borderRadius: 2,
                transition: 'box-shadow 0.3s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5, color: '#1976d2' }}>
                  Thông tin Hóa đơn
                </Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Số hóa đơn
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {invoice.invoiceNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Ngày phát hành
                  </Typography>
                  <Typography variant="body1">{formatDate(invoice.issueDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Hạn thanh toán
                  </Typography>
                  <Typography variant="body1">{formatDate(invoice.dueDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Ghi chú
                  </Typography>
                  <Typography variant="body1">{invoice.notes || 'Không có'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        </Grid>

          {/* Chi tiết Hàng hóa */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Chi tiết Hàng hóa / Dịch vụ
                </Typography>
              </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Số lượng
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Đơn giá
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Thành tiền
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 600, borderBottom: 'none' }}>
                      Tạm tính:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, borderBottom: 'none' }}>
                      {formatCurrency(invoice.subtotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 600, borderBottom: 'none' }}>
                      Thuế VAT (10%):
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, borderBottom: 'none' }}>
                      {formatCurrency(invoice.taxAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="right"
                      sx={{ fontWeight: 700, fontSize: '1.1rem', backgroundColor: '#fafafa' }}>
                      Tổng cộng:
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1976d2', backgroundColor: '#fafafa' }}>
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Lịch sử & Hoạt động */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              p: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5, color: '#1976d2' }}>
                Lịch sử & Hoạt động
              </Typography>
              <Divider sx={{ mb: 3 }} />
            <List>
              {auditTrail.map((entry) => (
                <ListItem
                  key={entry.id}
                  sx={{
                    borderLeft: '3px solid #1976d2',
                    mb: 1,
                    backgroundColor: '#fafafa',
                    borderRadius: 1,
                  }}>
                  <ListItemText
                    primary={entry.action}
                    secondary={
                      <Box component="span">
                        <Typography component="span" variant="body2" color="text.secondary">
                          {entry.user} • {entry.timestamp}
                        </Typography>
                      </Box>
                    }
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
              </List>
            </Paper>
      </Box>
    </Box>
  )
}

export default InvoiceDetail
