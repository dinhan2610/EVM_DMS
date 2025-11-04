import { useState, useMemo } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Divider,
  Autocomplete,
  Alert,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { useNavigate } from 'react-router-dom'

// Interfaces
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface CustomerInfo {
  name: string
  email: string
  taxCode: string
  address: string
}

interface InvoiceDetails {
  issueDate: Dayjs | null
  dueDate: Dayjs | null
  notes: string
}

// Initial States
const initialItemState: InvoiceItem = {
  id: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
}

const initialCustomerInfo: CustomerInfo = {
  name: '',
  email: '',
  taxCode: '',
  address: '',
}

const initialInvoiceDetails: InvoiceDetails = {
  issueDate: null,
  dueDate: null,
  notes: '',
}

// Mock data cho Autocomplete
const mockContracts = [
  { id: 1, label: 'HĐ-2024-001 - Công ty ABC Technology', value: 'contract-1' },
  { id: 2, label: 'HĐ-2024-002 - Công ty XYZ Solutions', value: 'contract-2' },
  { id: 3, label: 'DA-2024-003 - Dự án Web Application', value: 'project-1' },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const CreateInvoice = () => {
  const navigate = useNavigate()
  const [creationMode, setCreationMode] = useState<'manual' | 'auto'>('manual')
  const [selectedContract, setSelectedContract] = useState<{ id: number; label: string; value: string } | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(initialCustomerInfo)
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(initialInvoiceDetails)
  const [items, setItems] = useState<InvoiceItem[]>([{ ...initialItemState, id: '1' }])

  // Handlers for Customer Info
  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  // Handlers for Invoice Details
  const handleInvoiceDetailsChange = (field: keyof InvoiceDetails, value: string | Dayjs | null) => {
    setInvoiceDetails((prev) => ({ ...prev, [field]: value }))
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
  const handleSaveDraft = () => {
    const formData = {
      creationMode,
      selectedContract,
      customerInfo,
      invoiceDetails,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'Nháp',
    }
    console.log('Lưu nháp:', formData)
    // API call để lưu nháp
    alert('Đã lưu nháp thành công!')
  }

  const handleSignAndIssue = () => {
    const formData = {
      creationMode,
      selectedContract,
      customerInfo,
      invoiceDetails,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'Đã phát hành',
    }
    console.log('Ký & Phát hành:', formData)
    // API call để ký và phát hành
    alert('Đã ký và phát hành thành công!')
    navigate('/invoices')
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Tạo Hóa đơn mới
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Vui lòng điền đầy đủ thông tin để tạo hóa đơn
            </Typography>
          </Box>

          {/* Creation Mode Selection */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666', mb: 2 }}>
              Chế độ tạo hóa đơn
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={creationMode}
                onChange={(e) => setCreationMode(e.target.value as 'manual' | 'auto')}>
                <FormControlLabel value="manual" control={<Radio />} label="Nhập thủ công" />
                <FormControlLabel value="auto" control={<Radio />} label="Tạo từ Hợp đồng/Dự án" />
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* Auto Mode: Contract/Project Selection */}
          {creationMode === 'auto' && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 0,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
                Chọn Hợp đồng/Dự án
              </Typography>
              <Autocomplete
                options={mockContracts}
                value={selectedContract}
                onChange={(_, newValue) => setSelectedContract(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Tìm kiếm Hợp đồng/Dự án" placeholder="Nhập mã hoặc tên..." />
                )}
                fullWidth
              />
              {selectedContract && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Đã chọn: {selectedContract.label}
                </Alert>
              )}
            </Paper>
          )}

          {/* Manual Mode: Full Form */}
          {creationMode === 'manual' && (
            <>
              {/* Customer Information */}
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
                    Thông tin Khách hàng
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Tên khách hàng"
                        placeholder="Nhập tên khách hàng"
                        value={customerInfo.name}
                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        placeholder="example@company.com"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Mã số thuế"
                        placeholder="0123456789"
                        value={customerInfo.taxCode}
                        onChange={(e) => handleCustomerInfoChange('taxCode', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Địa chỉ"
                        placeholder="Nhập địa chỉ"
                        value={customerInfo.address}
                        onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              {/* Invoice Details */}
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
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DatePicker
                        label="Ngày phát hành"
                        value={invoiceDetails.issueDate}
                        onChange={(newValue) => handleInvoiceDetailsChange('issueDate', newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DatePicker
                        label="Ngày hết hạn"
                        value={invoiceDetails.dueDate}
                        onChange={(newValue) => handleInvoiceDetailsChange('dueDate', newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Ghi chú"
                        placeholder="Ghi chú thêm (nếu có)"
                        value={invoiceDetails.notes}
                        onChange={(e) => handleInvoiceDetailsChange('notes', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </>
          )}

          {/* Invoice Items */}
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
                Chi tiết Hàng hóa / Dịch vụ
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {items.map((item, index) => (
                  <Grid container spacing={2} alignItems="center" key={item.id || index}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Mô tả"
                        placeholder="Nhập mô tả hàng hóa/dịch vụ"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <TextField
                        fullWidth
                        label="Số lượng"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <TextField
                        fullWidth
                        label="Đơn giá"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Thành tiền"
                        value={formatCurrency(item.total)}
                        disabled
                        size="small"
                        sx={{
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: '#1976d2',
                            fontWeight: 500,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, md: 1 }}>
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
                Thêm dòng
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
                Tổng kết
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
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSaveDraft}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 150,
                }}>
                Lưu nháp
              </Button>
              <Button
                variant="contained"
                startIcon={<SendOutlinedIcon />}
                onClick={handleSignAndIssue}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 150,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
                  },
                }}>
                Ký & Phát hành
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default CreateInvoice
