import { useState, useMemo } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
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
  Select,
  MenuItem,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'
import IssueInvoiceModal from '@/components/IssueInvoiceModal'
import type { InvoiceItem, CustomerInfo } from '@/types/invoiceTemplate'
import {
  formatCurrency,
  calculateInvoiceAmounts,
  createInitialItem,
  updateItemWithTotal,
} from '@/utils/invoiceHelpers'

// Local interface với Dayjs type cụ thể cho component này
interface LocalInvoiceDetails {
  issueDate: Dayjs | null
  dueDate: Dayjs | null
  notes: string
}

// Initial States
const initialItemState: Partial<InvoiceItem> = {
  id: '',
  description: '',
  unit: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
}

const initialCustomerInfo: CustomerInfo = {
  name: '',
  email: '',
  taxCode: '',
  address: '',
  buyerName: '',  // ✅ Thêm buyerName
}

const initialInvoiceDetails: LocalInvoiceDetails = {
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

const CreateInvoice = () => {
  usePageTitle('Lập hóa đơn')
  
  const navigate = useNavigate()
  const [creationMode, setCreationMode] = useState<'manual' | 'auto'>('manual')
  const [selectedContract, setSelectedContract] = useState<{ id: number; label: string; value: string } | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(initialCustomerInfo)
  const [invoiceDetails, setInvoiceDetails] = useState<LocalInvoiceDetails>(initialInvoiceDetails)
  const [items, setItems] = useState<InvoiceItem[]>([{ ...initialItemState, id: '1' } as InvoiceItem])
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt/Chuyển khoản') // ✅ Hình thức thanh toán - Default khuyến nghị

  // Handlers for Customer Info
  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  // Handlers for Invoice Details
  const handleInvoiceDetailsChange = (field: keyof LocalInvoiceDetails, value: string | Dayjs | null) => {
    setInvoiceDetails((prev) => ({ ...prev, [field]: value }))
  }

  // Handlers for Items
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    const currentItem = updatedItems[index]
    if (!currentItem) return

    updatedItems[index] = updateItemWithTotal(currentItem, { [field]: value })
    setItems(updatedItems)
  }

  const handleAddItem = () => {
    const newItem = createInitialItem({ id: (items.length + 1).toString() })
    setItems([...items, newItem])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Calculations - sử dụng helper từ utils
  const { subtotal, taxAmount, totalAmount } = useMemo(() => {
    return calculateInvoiceAmounts(items)
  }, [items])

  // Form Actions
  const handleSaveDraft = () => {
    // ✅ Validation: Kiểm tra hình thức thanh toán cho hóa đơn >20M
    if (totalAmount > 20000000 && paymentMethod !== 'Chuyển khoản') {
      alert(`⚠️ Hóa đơn trên 20 triệu đồng (${(totalAmount / 1000000).toFixed(1)}M) phải chọn "Chuyển khoản" để được khấu trừ thuế theo quy định`)
      return
    }
    
    const formData = {
      creationMode,
      selectedContract,
      customerInfo,
      invoiceDetails,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paymentMethod, // ✅ Thêm payment method vào request
      status: 'Nháp',
    }
    console.log('Lưu nháp:', formData)
    console.log('💳 Payment Method:', paymentMethod)
    // API call để lưu nháp
    alert('Đã lưu nháp thành công!')
  }

  const handleSignAndIssue = () => {
    // Mở modal để xác nhận và nhập thông tin gửi email
    setIssueModalOpen(true)
  }

  const handleIssueInvoice = (issueData: {
    recipientName: string
    email: string
    ccEmails: string[]
    bccEmails: string[]
    attachments: File[]
    sendToCustomer: boolean
    disableSms: boolean
    autoSendOnlyWithEmail: boolean
    language: string
  }) => {
    // ✅ Validation: Kiểm tra hình thức thanh toán cho hóa đơn >20M
    if (totalAmount > 20000000 && paymentMethod !== 'Chuyển khoản') {
      alert(`⚠️ Hóa đơn trên 20 triệu đồng (${(totalAmount / 1000000).toFixed(1)}M) phải chọn "Chuyển khoản" để được khấu trừ thuế theo quy định`)
      return
    }
    
    const formData = {
      creationMode,
      selectedContract,
      customerInfo,
      invoiceDetails,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paymentMethod, // ✅ Thêm payment method vào request
      status: 'Đã phát hành',
      issueData,
    }
    console.log('Ký & Phát hành:', formData)
    console.log('💳 Payment Method:', paymentMethod)
    // API call để ký và phát hành với thông tin từ modal
    alert('Đã ký và phát hành thành công!')
    navigate('/invoices')
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                Tạo Hóa đơn mới
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Vui lòng điền đầy đủ thông tin để tạo hóa đơn
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  color: '#1976d2',
                },
              }}>
              Quay lại
            </Button>
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
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <Typography variant="caption" sx={{ mb: 0.5, color: '#666', fontWeight: 500 }}>
                          Hình thức thanh toán *
                        </Typography>
                        <Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e0e0e0',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                              borderWidth: '2px',
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                mt: 0.5,
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                                border: '1.5px solid #1976d2',
                                borderRadius: 1.5,
                                maxHeight: 400,
                              },
                            },
                          }}>
                          <MenuItem value="Tiền mặt/Chuyển khoản">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Tiền mặt/Chuyển khoản
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#2e7d32', fontSize: '0.7rem' }}>
                                ✅ Khuyến nghị (99% trường hợp)
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="Chuyển khoản">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Chuyển khoản
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: '0.7rem' }}>
                                🔴 Bắt buộc nếu hóa đơn &gt;20 triệu (khấu trừ thuế)
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="Tiền mặt">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Tiền mặt
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                                💵 Chỉ dùng cho khách lẻ, thu tiền ngay tại quầy
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="Đối trừ công nợ">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Đối trừ công nợ
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                                🔄 Dùng cho trường hợp hàng đổi hàng
                              </Typography>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      {formatCurrency(totalAmount)}
                    </Typography>
                    {/* ✅ Cảnh báo nếu >20M mà không chọn "Chuyển khoản" */}
                    {totalAmount > 20000000 && paymentMethod !== 'Chuyển khoản' && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: '#ed6c02',
                          backgroundColor: '#fff4e5',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                        ⚠️ Phải chuyển khoản
                      </Typography>
                    )}
                  </Box>
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

          {/* Issue Invoice Modal */}
          <IssueInvoiceModal
            open={issueModalOpen}
            onClose={() => setIssueModalOpen(false)}
            onIssue={handleIssueInvoice}
            invoiceData={{
              invoiceNumber: 'INV-2024-NEW',
              serialNumber: '1K24TXN',
              date: invoiceDetails.issueDate?.format('DD/MM/YYYY') || dayjs().format('DD/MM/YYYY'),
              customerName: customerInfo.name || 'Chưa có thông tin',
              totalAmount: totalAmount.toLocaleString('vi-VN'),
            }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default CreateInvoice
