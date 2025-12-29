import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  IconButton,
  Alert,
  Divider,
  Chip,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// MUI v7 Grid compatibility wrappers
const GridContainer = (props: Record<string, unknown>) => <Grid container {...props} />
// @ts-expect-error - MUI v7 removed 'item' prop, keeping for backward compatibility
const GridItem = (props: Record<string, unknown>) => <Grid item {...props} />

// Interfaces
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
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

// Initial States
const initialAdjustmentItem: InvoiceItem = {
  id: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
}

// Mock Original Invoice Data
const mockOriginalInvoice: Invoice = {
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
  notes: 'Hóa đơn gốc',
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
  ],
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const CreateAdjustmentInvoice = () => {
  const { id: originalId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null)
  const [adjustmentItems, setAdjustmentItems] = useState<InvoiceItem[]>([{ ...initialAdjustmentItem, id: '1' }])
  const [adjustmentReason, setAdjustmentReason] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Giả lập fetch dữ liệu hóa đơn gốc
    const fetchOriginalInvoice = async () => {
      setLoading(true)
      setTimeout(() => {
        // Trong thực tế: const data = await api.getInvoiceById(originalId)
        setOriginalInvoice(mockOriginalInvoice)
        setLoading(false)
      }, 500)
    }

    if (originalId) {
      fetchOriginalInvoice()
    }
  }, [originalId])

  // Handlers for Adjustment Items
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...adjustmentItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Auto calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }

    setAdjustmentItems(updatedItems)
  }

  const handleAddItem = () => {
    const newId = (adjustmentItems.length + 1).toString()
    setAdjustmentItems([...adjustmentItems, { ...initialAdjustmentItem, id: newId }])
  }

  const handleRemoveItem = (index: number) => {
    if (adjustmentItems.length > 1) {
      setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
    }
  }

  // Calculations
  const { subtotal, taxAmount, totalAmount } = useMemo(() => {
    const subtotal = adjustmentItems.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * 0.1 // 10% VAT
    const totalAmount = subtotal + taxAmount
    return { subtotal, taxAmount, totalAmount }
  }, [adjustmentItems])

  // Form Actions
  const handleCancel = () => {
    navigate(`/invoices/${originalId}`)
  }

  const handleIssueAdjustment = () => {
    const adjustmentData = {
      originalId,
      originalInvoiceNumber: originalInvoice?.invoiceNumber,
      adjustmentReason,
      adjustmentItems,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'Đã phát hành',
    }
    console.log('Phát hành Hóa đơn Điều chỉnh:', adjustmentData)
    // API call để tạo hóa đơn điều chỉnh
    alert('Đã phát hành hóa đơn điều chỉnh thành công!')
    navigate('/invoices')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Đang tải...</Typography>
      </Box>
    )
  }

  if (!originalInvoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy hóa đơn gốc</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{
              mb: 3,
              textTransform: 'none',
              fontWeight: 500,
              color: '#666',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}>
            Quay lại
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Tạo Hóa đơn Điều chỉnh
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Điều chỉnh tăng hoặc giảm giá trị hóa đơn đã phát hành
          </Typography>
        </Box>

        {/* Info Alert */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #e3f2fd',
            borderRadius: 0,
            backgroundColor: '#e3f2fd',
            overflow: 'hidden',
          }}>
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon />}
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Hóa đơn gốc: #{originalInvoice.invoiceNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Phát hành ngày: {formatDate(originalInvoice.issueDate)} • Giá trị:{' '}
                  {formatCurrency(originalInvoice.totalAmount)}
                </Typography>
              </Box>
              <Chip
                label={originalInvoice.status}
                color="primary"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Stack>
          </Alert>
        </Paper>

        {/* Customer Information (Read-Only) */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 0,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Thông tin Khách hàng (Không thể thay đổi)
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <GridContainer spacing={2}>
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên khách hàng"
                  value={originalInvoice.customerName}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </GridItem>
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={originalInvoice.customerEmail}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </GridItem>
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã số thuế"
                  value={originalInvoice.customerTaxCode}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </GridItem>
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Địa chỉ"
                  value={originalInvoice.customerAddress}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </GridItem>
            </GridContainer>
          </Box>
        </Paper>

        {/* Adjustment Reason */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 0,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Lý do Điều chỉnh
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mô tả lý do điều chỉnh"
              placeholder="Ví dụ: Điều chỉnh giá theo thỏa thuận bổ sung, sai sót về số lượng..."
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              required
            />
          </Box>
        </Paper>

        {/* Adjustment Items */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 0,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Nội dung Điều chỉnh (Tăng/Giảm)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              * Nhập số âm (-) vào Đơn giá để giảm giá trị, số dương (+) để tăng giá trị
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              {adjustmentItems.map((item, index) => (
                <GridContainer spacing={2} alignItems="center" key={item.id || index}>
                  <GridItem xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Nội dung điều chỉnh"
                      placeholder="Ví dụ: Điều chỉnh tăng phí dịch vụ..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      size="small"
                    />
                  </GridItem>
                  <GridItem xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Số lượng"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      size="small"
                      inputProps={{ min: 1 }}
                    />
                  </GridItem>
                  <GridItem xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Đơn giá (±)"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      size="small"
                      helperText="Âm để giảm"
                    />
                  </GridItem>
                  <GridItem xs={10} md={3}>
                    <TextField
                      fullWidth
                      label="Thành tiền"
                      value={formatCurrency(item.total)}
                      disabled
                      size="small"
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: item.total >= 0 ? '#2e7d32' : '#d32f2f',
                          fontWeight: 600,
                        },
                      }}
                    />
                  </GridItem>
                  <GridItem xs={2} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={adjustmentItems.length === 1}
                      size="small">
                      <DeleteIcon />
                    </IconButton>
                  </GridItem>
                </GridContainer>
              ))}
            </Stack>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ mt: 2, textTransform: 'none', fontWeight: 500 }}>
              Thêm dòng điều chỉnh
            </Button>
          </Box>
        </Paper>

        {/* Summary & Totals */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 0,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
              Tổng kết Điều chỉnh
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Tạm tính:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: subtotal >= 0 ? '#2e7d32' : '#d32f2f',
                  }}>
                  {formatCurrency(subtotal)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Thuế VAT (10%):
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: taxAmount >= 0 ? '#2e7d32' : '#d32f2f',
                  }}>
                  {formatCurrency(taxAmount)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Tổng giá trị điều chỉnh:
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: totalAmount >= 0 ? '#2e7d32' : '#d32f2f',
                  }}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
              <Alert severity={totalAmount >= 0 ? 'success' : 'warning'} sx={{ mt: 2 }}>
                Giá trị hóa đơn sau điều chỉnh:{' '}
                <strong>{formatCurrency(originalInvoice.totalAmount + totalAmount)}</strong>
              </Alert>
            </Stack>
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 0,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 120,
              }}>
              Hủy
            </Button>
            <Button
              variant="contained"
              startIcon={<SendOutlinedIcon />}
              onClick={handleIssueAdjustment}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 200,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
                },
              }}>
              Phát hành Hóa đơn Điều chỉnh
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}

export default CreateAdjustmentInvoice
