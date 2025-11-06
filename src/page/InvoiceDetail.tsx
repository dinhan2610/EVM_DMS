import React, { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
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
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'

// Định nghĩa Interfaces
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
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

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  useEffect(() => {
    // Giả lập việc fetch data từ API
    const fetchInvoiceDetail = async () => {
      setLoading(true)
      // Trong thực tế, đây sẽ là API call: await api.getInvoiceById(id)
      setTimeout(() => {
        setInvoice(mockInvoiceDetail)
        setLoading(false)
      }, 500)
    }

    if (id) {
      fetchInvoiceDetail()
    }
  }, [id])

  // Handlers
  const handleResendEmail = () => {
    setEmailModalOpen(true)
  }

  const handleSendEmail = (emailData: {
    recipientName: string
    email: string
    ccEmails: string[]
    bccEmails: string[]
    attachments: File[]
    includeXml: boolean
    disableSms: boolean
    language: string
  }) => {
    console.log('Gửi email hóa đơn:', invoice?.invoiceNumber, emailData)
    // API call để gửi email với dữ liệu từ modal
    // TODO: Implement API call
  }

  const handlePrint = () => {
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
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header - Đồng bộ với TemplatePreview */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.75rem', mb: 0.5 }}>
              Chi tiết Hóa đơn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              #{invoice.invoiceNumber}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
              <Chip
                icon={getTaxStatusIcon(invoice.taxStatus)}
                label={invoice.taxStatus}
                color={getTaxStatusColor(invoice.taxStatus)}
                size="small"
              />
            </Stack>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ textTransform: 'none' }}>
            Quay lại
          </Button>
        </Stack>

        {/* Invoice Preview - Sử dụng InvoiceTemplatePreview */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ maxWidth: '21cm', width: '100%' }}>
            <InvoiceTemplatePreview
              config={{
                companyLogo: null,
                companyName: 'CÔNG TY TNHH GIẢI PHÁP TỔNG THỂ KỶ NGUYÊN SỐ',
                companyTaxCode: '0123456789',
                companyAddress: '123 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
                companyPhone: '028 1234 5678',
                modelCode: '1K24TXN',
                templateCode: 'C25TKN',
              }}
              visibility={{
                showQrCode: true,
                showLogo: true,
                showCustomerInfo: true,
                showPaymentInfo: true,
                showSignature: true,
                showCompanyName: true,
                showCompanyTaxCode: true,
                showCompanyAddress: true,
                showCompanyPhone: true,
                showCompanyBankAccount: true,
              }}
            />
          </Box>
        </Box>

        {/* Action Buttons - Di chuyển xuống dưới hóa đơn */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: '21cm',
              width: '100%',
              p: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2.5 }}>
              Thao tác với hóa đơn
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handlePrint}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  backgroundColor: '#1976d2',
                  boxShadow: '0 2px 4px rgba(25,118,210,0.2)',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                    boxShadow: '0 4px 8px rgba(25,118,210,0.3)',
                  },
                }}>
                In hóa đơn
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  backgroundColor: '#1976d2',
                  boxShadow: '0 2px 4px rgba(25,118,210,0.2)',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                    boxShadow: '0 4px 8px rgba(25,118,210,0.3)',
                  },
                }}>
                Tải về PDF/XML
              </Button>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleResendEmail}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  backgroundColor: '#1976d2',
                  boxShadow: '0 2px 4px rgba(25,118,210,0.2)',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                    boxShadow: '0 4px 8px rgba(25,118,210,0.3)',
                  },
                }}>
                Gửi Email
              </Button>

              {invoice.status === 'Đã phát hành' && (
                <>
                  <Box sx={{ width: '100%', my: 1 }} />
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<Edit />}
                    onClick={handleAdjustInvoice}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderWidth: 1.5,
                      '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: 'rgba(237, 108, 2, 0.04)',
                      },
                    }}>
                    Điều chỉnh hóa đơn
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<Replay />}
                    onClick={handleReplaceInvoice}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderWidth: 1.5,
                      '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: 'rgba(237, 108, 2, 0.04)',
                      },
                    }}>
                    Thay thế hóa đơn
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={handleCancelInvoice}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderWidth: 1.5,
                      '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: 'rgba(211, 47, 47, 0.04)',
                      },
                    }}>
                    Hủy hóa đơn
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </Box>

        {/* Email Modal */}
        <SendInvoiceEmailModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          onSend={handleSendEmail}
          invoiceData={{
            invoiceNumber: invoice.invoiceNumber,
            serialNumber: '1K24TXN',
            date: new Date(invoice.issueDate).toLocaleDateString('vi-VN'),
            customerName: invoice.customerName,
            totalAmount: invoice.totalAmount.toLocaleString('vi-VN'),
          }}
        />
      </Box>
    </Box>
  )
}

export default InvoiceDetail
