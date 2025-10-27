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
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

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
const initialItemState: InvoiceItem = {
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
  notes: 'Hóa đơn gốc có sai sót, cần thay thế',
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
      unitPrice: 1000000,
      total: 5000000,
    },
  ],
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const CreateReplacementInvoice = () => {
  const { id: originalId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState<string | null>(null)
  const [originalIssueDate, setOriginalIssueDate] = useState<string | null>(null)
  const [replacementReason, setReplacementReason] = useState<string>('')

  // Form Data States
  const [formData, setFormData] = useState<Partial<Invoice>>({
    customerName: '',
    customerEmail: '',
    customerTaxCode: '',
    customerAddress: '',
    issueDate: '',
    dueDate: '',
    notes: '',
  })

  const [items, setItems] = useState<InvoiceItem[]>([{ ...initialItemState, id: '1' }])

  useEffect(() => {
    // Giả lập fetch dữ liệu hóa đơn gốc
    const fetchOriginalInvoice = async () => {
      setLoading(true)
      setTimeout(() => {
        // Trong thực tế: const data = await api.getInvoiceById(originalId)
        const fetchedInvoice = mockOriginalInvoice

        // Set số hóa đơn gốc để hiển thị trong Alert
        setOriginalInvoiceNumber(fetchedInvoice.invoiceNumber)
        setOriginalIssueDate(fetchedInvoice.issueDate)

        // **Điền sẵn form với dữ liệu hóa đơn gốc**
        setFormData({
          customerName: fetchedInvoice.customerName,
          customerEmail: fetchedInvoice.customerEmail,
          customerTaxCode: fetchedInvoice.customerTaxCode,
          customerAddress: fetchedInvoice.customerAddress,
          issueDate: fetchedInvoice.issueDate,
          dueDate: fetchedInvoice.dueDate,
          notes: fetchedInvoice.notes || '',
        })

        // **Điền sẵn danh sách items**
        setItems(fetchedInvoice.items.map((item) => ({ ...item })))

        setLoading(false)
      }, 500)
    }

    if (originalId) {
      fetchOriginalInvoice()
    }
  }, [originalId])

  // Handlers for Form Data
  const handleFormChange = (field: keyof Invoice, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (field: 'issueDate' | 'dueDate', value: Dayjs | null) => {
    if (value) {
      setFormData((prev) => ({ ...prev, [field]: value.format('YYYY-MM-DD') }))
    }
  }

  // Handlers for Items
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Auto calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }

    setItems(updatedItems)
  }

  const handleAddItem = () => {
    const newId = (items.length + 1).toString()
    setItems([...items, { ...initialItemState, id: newId }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Calculations
  const { subtotal, taxAmount, totalAmount } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * 0.1 // 10% VAT
    const totalAmount = subtotal + taxAmount
    return { subtotal, taxAmount, totalAmount }
  }, [items])

  // Form Actions
  const handleCancel = () => {
    navigate(`/invoices/${originalId}`)
  }

  const handleIssueReplacement = () => {
    const replacementData = {
      originalId,
      originalInvoiceNumber,
      replacementReason,
      formData: {
        ...formData,
        subtotal,
        taxAmount,
        totalAmount,
      },
      items,
      status: 'Đã phát hành',
    }
    console.log('Phát hành Hóa đơn Thay thế:', replacementData)
    // API call để tạo hóa đơn thay thế
    alert('Đã phát hành hóa đơn thay thế thành công!')
    navigate('/invoices')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Đang tải dữ liệu hóa đơn gốc...</Typography>
      </Box>
    )
  }

  if (!originalInvoiceNumber) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy hóa đơn gốc</Alert>
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
              Tạo Hóa đơn Thay thế
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Thay thế hóa đơn có sai sót bằng hóa đơn mới với thông tin chính xác
            </Typography>
          </Box>

          {/* Warning Alert */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid #fff3e0',
              borderRadius: 0,
              backgroundColor: '#fff3e0',
              overflow: 'hidden',
            }}>
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{
                backgroundColor: 'transparent',
                border: 'none',
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}>
              <Stack direction="column" spacing={1}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Đang tạo hóa đơn thay thế cho Hóa đơn gốc số: #{originalInvoiceNumber}
                </Typography>
                <Typography variant="body2">
                  Phát hành ngày: {originalIssueDate && formatDate(originalIssueDate)} • Vui lòng kiểm tra và
                  nhập lại <strong>toàn bộ thông tin đúng</strong>.
                </Typography>
                <Typography variant="caption" sx={{ color: '#e65100' }}>
                  ⚠️ Hóa đơn gốc sẽ bị hủy sau khi hóa đơn thay thế được phát hành thành công.
                </Typography>
              </Stack>
            </Alert>
          </Paper>

          {/* Replacement Reason */}
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
                Lý do Thay thế
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mô tả lý do thay thế hóa đơn"
                placeholder="Ví dụ: Sai thông tin khách hàng, sai số lượng hàng hóa, sai giá..."
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
                required
              />
            </Box>
          </Paper>

          {/* Customer Information (Editable) */}
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
                Thông tin Khách hàng (Chỉnh sửa nếu cần)
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tên khách hàng"
                    value={formData.customerName}
                    onChange={(e) => handleFormChange('customerName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mã số thuế"
                    value={formData.customerTaxCode}
                    onChange={(e) => handleFormChange('customerTaxCode', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Địa chỉ"
                    value={formData.customerAddress}
                    onChange={(e) => handleFormChange('customerAddress', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Invoice Details (Editable) */}
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
                Thông tin Hóa đơn
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Ngày phát hành"
                    value={formData.issueDate ? dayjs(formData.issueDate) : null}
                    onChange={(value) => handleDateChange('issueDate', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Ngày hết hạn"
                    value={formData.dueDate ? dayjs(formData.dueDate) : null}
                    onChange={(value) => handleDateChange('dueDate', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Ghi chú"
                    placeholder="Thông tin bổ sung..."
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Items (Editable) */}
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
                Chi tiết Hàng hóa/Dịch vụ (Thông tin đúng)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                * Kiểm tra và chỉnh sửa lại thông tin cho chính xác
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {items.map((item, index) => (
                  <Grid container spacing={2} alignItems="center" key={item.id || index}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mô tả hàng hóa/dịch vụ"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label="Số lượng"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 1 }}
                        required
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label="Đơn giá"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0 }}
                        required
                      />
                    </Grid>
                    <Grid item xs={10} md={3}>
                      <TextField
                        fullWidth
                        label="Thành tiền"
                        value={formatCurrency(item.total)}
                        disabled
                        size="small"
                        sx={{
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: '#1976d2',
                            fontWeight: 600,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={2} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ mt: 2, textTransform: 'none', fontWeight: 500 }}>
                Thêm dòng hàng hóa
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
                Tổng kết Hóa đơn Mới
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Tạm tính:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {formatCurrency(subtotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Thuế VAT (10%):
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {formatCurrency(taxAmount)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Tổng cộng:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
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
                onClick={handleIssueReplacement}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 200,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
                  },
                }}>
                Phát hành Hóa đơn Thay thế
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default CreateReplacementInvoice
