import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
  
  Box,
  Typography,
  InputAdornment,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useCategories } from '@/hooks/useCategories'

// Interface cho dữ liệu form
export interface ItemFormData {
  code: string
  name: string
  group: string
  categoryID?: number
  unit: string
  salesPrice: number
  vatTaxRate: string
  discountRate: number
  discountAmount: number
  description: string
}

// Props interface cho component
interface AddNewItemModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ItemFormData) => void
  initialData?: ItemFormData | null
}

// Dữ liệu mẫu cho các dropdown
const UNITS = [
  { value: 'cai', label: 'Cái' },
  { value: 'chiec', label: 'Chiếc' },
  { value: 'hop', label: 'Hộp' },
  { value: 'thung', label: 'Thùng' },
  { value: 'kg', label: 'Kg' },
  { value: 'tan', label: 'Tấn' },
  { value: 'met', label: 'Mét' },
  { value: 'lit', label: 'Lít' },
  { value: 'goi', label: 'Gói' },
  { value: 'bo', label: 'Bộ' },
]

const AddNewItemModal: React.FC<AddNewItemModalProps> = ({ open, onClose, onSave, initialData }) => {
  const { categories } = useCategories()

  // Giá trị khởi tạo mặc định
  const defaultFormData: ItemFormData = {
    code: '',
    name: '',
    group: '',
    unit: '',
    salesPrice: 0,
    vatTaxRate: '10%',
    discountRate: 0,
    discountAmount: 0,
    description: '',
  }

  // State quản lý dữ liệu form
  const [formData, setFormData] = useState<ItemFormData>(defaultFormData)

  // useEffect để cập nhật form khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      // Chế độ Edit: Điền dữ liệu vào form
      setFormData(initialData)
    } else {
      // Chế độ Add: Reset form về trạng thái rỗng
      setFormData(defaultFormData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open])

  // Auto-select first category if available and no categoryID set
  useEffect(() => {
    if (!formData.categoryID && categories.length > 0 && !initialData) {
      const firstCategory = categories[0]
      setFormData(prev => ({ 
        ...prev, 
        categoryID: firstCategory.id,
        vatTaxRate: `${firstCategory.vatRate}%`
      }))
    }
  }, [categories, formData.categoryID, initialData])

  // Auto-update VAT rate when category changes
  useEffect(() => {
    if (formData.categoryID && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryID)
      if (selectedCategory && formData.vatTaxRate !== `${selectedCategory.vatRate}%`) {
        setFormData(prev => ({ ...prev, vatTaxRate: `${selectedCategory.vatRate}%` }))
      }
    }
  }, [formData.categoryID, categories, formData.vatTaxRate])

  // Hàm format số tiền với dấu phân cách hàng nghìn
  const formatNumber = (value: number): string => {
    if (!value && value !== 0) return ''
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Hàm xử lý thay đổi input
  const handleInputChange = (field: keyof ItemFormData, value: string | number | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Tự động tính tiền chiết khấu khi tỷ lệ CK hoặc giá bán thay đổi
      if (field === 'discountRate' || field === 'salesPrice') {
        const rate = field === 'discountRate' ? Number(value) : prev.discountRate
        const price = field === 'salesPrice' ? Number(value) : prev.salesPrice
        updated.discountAmount = (price * rate) / 100
      }

      return updated
    })
  }

  // Hàm xử lý thay đổi giá bán (với format số tiền)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Loại bỏ tất cả dấu "." và ký tự không phải số
    const numericValue = inputValue.replace(/\D/g, '')
    
    // Loại bỏ số 0 ở đầu (trừ khi giá trị là "0")
    const cleanedValue = numericValue.replace(/^0+/, '') || '0'
    
    const price = Number(cleanedValue)
    handleInputChange('salesPrice', price)
  }

  // Reset form về trạng thái ban đầu
  const resetForm = () => {
    setFormData(defaultFormData)
  }

  // Xử lý lưu và đóng modal
  const handleSave = () => {
    onSave(formData)
    resetForm()
    onClose()
  }

  // Xử lý lưu và tiếp tục thêm
  const handleSaveAndAdd = () => {
    onSave(formData)
    resetForm()
  }

  // Xử lý đóng modal
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Format số tiền VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          maxHeight: '95vh',
          height: 'auto',
        },
      }}>
      {/* Header */}
      <DialogTitle
        sx={{
          fontWeight: 600,
          color: '#1a1a1a',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          pt: 2.5,
          px: 3,
          borderBottom: '1px solid #e8ecef',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: initialData
                ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                : 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.125rem',
              fontWeight: 700,
            }}>
            {initialData ? '✎' : '+'}
          </Box>
          <span style={{ fontSize: '1.125rem' }}>
            {initialData ? 'Chỉnh sửa Hàng hóa, Dịch vụ' : 'Thêm mới Hàng hóa, Dịch vụ'}
          </span>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: '#6c757d',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              color: '#ef5f5f',
            },
          }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 0, pb: 2.5, px: 3, backgroundColor: '#fafbfc', overflow: 'visible' }}>
        <Box sx={{ pt: 3 }}>
          {/* Grid layout cho tất cả các trường */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              rowGap: 2,
            }}>
            {/* Mã sản phẩm/dịch vụ */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Mã sản phẩm/dịch vụ <span style={{ color: '#ef5f5f' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="code"
                required
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="VD: SP001, DV001"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.9375rem',
                  },
                }}
              />
            </Box>

            {/* Tên hàng hóa/dịch vụ */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Tên hàng hóa/dịch vụ <span style={{ color: '#ef5f5f' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="VD: Laptop Dell Inspiron 15"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.9375rem',
                  },
                }}
              />
            </Box>

            {/* Nhóm hàng hóa/dịch vụ (Danh mục từ API) */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Danh mục sản phẩm <span style={{ color: '#ef5f5f' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="categoryID"
                  value={formData.categoryID || ''}
                  onChange={(e) => handleInputChange('categoryID', Number(e.target.value))}
                  displayEmpty
                  disabled={categories.length === 0}
                  sx={{
                    height: '40px',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '& .MuiSelect-select': {
                      fontSize: '0.9375rem',
                    },
                  }}>
                  {categories.length === 0 ? (
                    <MenuItem value="" disabled>
                      Đang tải danh mục...
                    </MenuItem>
                  ) : (
                    categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* Đơn vị tính */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Đơn vị tính <span style={{ color: '#ef5f5f' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '40px',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '& .MuiSelect-select': {
                      fontSize: '0.9375rem',
                    },
                  }}>
                  {UNITS.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Giá bán */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Giá bán (chưa VAT)
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="salesPrice"
                type="text"
                value={formatNumber(formData.salesPrice)}
                onChange={handlePriceChange}
                placeholder="0"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end" sx={{ color: '#6c757d', fontWeight: 500 }}>VNĐ</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.9375rem',
                  },
                }}
              />
            </Box>

          
            {/* Thuế GTGT */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Thuế giá trị gia tăng (VAT)
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="vatTaxRate"
                value={formData.vatTaxRate}
                disabled
                placeholder="Tự động từ danh mục"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '0.9375rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    '&.Mui-disabled': {
                      backgroundColor: '#f5f5f5',
                    },
                    '& .MuiOutlinedInput-input.Mui-disabled': {
                      WebkitTextFillColor: '#495057',
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </Box>

            {/* Tỷ lệ chiết khấu */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Tỷ lệ chiết khấu (%)
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="discountRate"
                type="number"
                value={formData.discountRate}
                onChange={(e) => handleInputChange('discountRate', Number(e.target.value))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                placeholder="0"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1c84ee',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.9375rem',
                  },
                }}
              />
            </Box>

            {/* Tiền chiết khấu */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 0.75,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                Số tiền chiết khấu (tự động tính)
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="discountAmount"
                type="text"
                value={formatCurrency(formData.discountAmount)}
                disabled
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end" sx={{ color: '#6c757d', fontWeight: 500 }}>VNĐ</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: 2,
                  },
                  '& .Mui-disabled': {
                    backgroundColor: '#e9ecef',
                    color: '#495057',
                    WebkitTextFillColor: '#495057',
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Mô tả - Full width */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: '#2c3e50',
                mb: 0.75,
                fontSize: '0.8125rem',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}>
              Mô tả sản phẩm/dịch vụ
            </Typography>
            <TextField
              fullWidth
              size="small"
              name="description"
              multiline
              rows={2.5}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Nhập mô tả chi tiết về đặc điểm, tính năng, ưu điểm của sản phẩm/dịch vụ..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1c84ee',
                    borderWidth: '1.5px',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                    boxShadow: '0 0 0 3px rgba(28, 132, 238, 0.1)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1c84ee',
                    borderWidth: '1.5px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid #e8ecef',
          backgroundColor: '#f8f9fa',
          gap: 1.5,
        }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            minWidth: 90,
            height: 38,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#6c757d',
            borderColor: '#dee2e6',
            borderWidth: '1.5px',
            '&:hover': {
              borderColor: '#adb5bd',
              borderWidth: '1.5px',
              backgroundColor: '#e9ecef',
            },
          }}>
          Hủy bỏ
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!formData.code || !formData.name || !formData.unit}
          sx={{
            minWidth: 90,
            height: 38,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.9375rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
            boxShadow: '0 4px 12px rgba(28, 132, 238, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
              boxShadow: '0 6px 16px rgba(28, 132, 238, 0.4)',
            },
            '&.Mui-disabled': {
              background: '#e9ecef',
              color: '#adb5bd',
              boxShadow: 'none',
            },
          }}>
          Lưu
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleSaveAndAdd}
          disabled={!formData.code || !formData.name || !formData.unit}
          sx={{
            minWidth: 120,
            height: 38,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#1c84ee',
            borderColor: '#1c84ee',
            borderWidth: '1.5px',
            '&:hover': {
              borderColor: '#0d6efd',
              borderWidth: '1.5px',
              backgroundColor: 'rgba(28, 132, 238, 0.08)',
            },
            '&.Mui-disabled': {
              borderColor: '#dee2e6',
              color: '#adb5bd',
            },
          }}>
          Lưu và Thêm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddNewItemModal
