import React, { useState } from 'react'
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
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

// Interface cho dữ liệu form
export interface ItemFormData {
  code: string
  name: string
  group: string
  unit: string
  salesPrice: number
  priceIncludesTax: boolean
  vatTaxRate: string
  discountRate: number
  discountAmount: number
  vatReduction: string
  description: string
}

// Props interface cho component
interface AddNewItemModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ItemFormData) => void
}

// Dữ liệu mẫu cho các dropdown
const PRODUCT_GROUPS = [
  { value: 'hang-hoa', label: 'Hàng hóa' },
  { value: 'dich-vu', label: 'Dịch vụ' },
  { value: 'tai-san', label: 'Tài sản' },
  { value: 'nguyen-vat-lieu', label: 'Nguyên vật liệu' },
]

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

const VAT_RATES = [
  { value: '0%', label: '0%' },
  { value: '5%', label: '5%' },
  { value: '8%', label: '8%' },
  { value: '10%', label: '10%' },
]

const VAT_REDUCTIONS = [
  { value: 'none', label: 'Không giảm' },
  { value: 'reduce-30', label: 'Giảm 30%' },
  { value: 'reduce-50', label: 'Giảm 50%' },
  { value: 'reduce-100', label: 'Giảm 100%' },
]

const AddNewItemModal: React.FC<AddNewItemModalProps> = ({ open, onClose, onSave }) => {
  // State quản lý dữ liệu form với giá trị khởi tạo
  const [formData, setFormData] = useState<ItemFormData>({
    code: '',
    name: '',
    group: '',
    unit: '',
    salesPrice: 0,
    priceIncludesTax: false,
    vatTaxRate: '10%',
    discountRate: 0,
    discountAmount: 0,
    vatReduction: 'none',
    description: '',
  })

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

  // Reset form về trạng thái ban đầu
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      group: '',
      unit: '',
      salesPrice: 0,
      priceIncludesTax: false,
      vatTaxRate: '10%',
      discountRate: 0,
      discountAmount: 0,
      vatReduction: 'none',
      description: '',
    })
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
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minHeight: '500px',
          maxHeight: '90vh',
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
          pb: 2.5,
          pt: 2.5,
          px: 3,
          borderBottom: '1px solid #eef2f7',
        }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Thêm mới hàng hóa, dịch vụ
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: '#5d7186',
            '&:hover': {
              color: '#ef5f5f',
              backgroundColor: 'rgba(239, 95, 95, 0.08)',
            },
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 0, pb: 3, px: 3 }}>
        <Box sx={{ pt: 3 }}>
          {/* Grid layout cho tất cả các trường */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              rowGap: 2.5,
            }}>
            {/* Mã sản phẩm/dịch vụ */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
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
                    height: '44px',
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                    },
                  },
                }}
              />
            </Box>

            {/* Tên hàng hóa/dịch vụ */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
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
                    height: '44px',
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                    },
                  },
                }}
              />
            </Box>

            {/* Nhóm hàng hóa/dịch vụ */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
                }}>
                Nhóm hàng hóa/dịch vụ
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="group"
                  value={formData.group}
                  onChange={(e) => handleInputChange('group', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '44px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                    },
                  }}>
                  {PRODUCT_GROUPS.map((group) => (
                    <MenuItem key={group.value} value={group.value}>
                      {group.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Đơn vị tính */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
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
                    height: '44px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
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
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
                }}>
                Giá bán (chưa VAT)
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="salesPrice"
                type="number"
                value={formData.salesPrice}
                onChange={(e) => handleInputChange('salesPrice', Number(e.target.value))}
                inputProps={{ min: 0, step: 1000 }}
                placeholder="0"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                    },
                  },
                }}
              />
            </Box>

            {/* Checkbox giá sau thuế */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
                }}>
                Loại giá
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '44px',
                  px: 1.5,
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: '#1c84ee',
                  },
                }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      name="priceIncludesTax"
                      checked={formData.priceIncludesTax}
                      onChange={(e) => handleInputChange('priceIncludesTax', e.target.checked)}
                      sx={{
                        color: '#1c84ee',
                        '&.Mui-checked': {
                          color: '#1c84ee',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#424e5a', userSelect: 'none' }}>
                      Giá bán là giá sau thuế
                    </Typography>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>
            </Box>

            {/* Thuế GTGT */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
                }}>
                Thuế giá trị gia tăng (VAT)
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="vatTaxRate"
                  value={formData.vatTaxRate}
                  onChange={(e) => handleInputChange('vatTaxRate', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '44px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                    },
                  }}>
                  {VAT_RATES.map((rate) => (
                    <MenuItem key={rate.value} value={rate.value}>
                      {rate.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Giảm thuế GTGT */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
                }}>
                Giảm thuế GTGT (nếu có)
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="vatReduction"
                  value={formData.vatReduction}
                  onChange={(e) => handleInputChange('vatReduction', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '44px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c84ee',
                    },
                  }}>
                  {VAT_REDUCTIONS.map((reduction) => (
                    <MenuItem key={reduction.value} value={reduction.value}>
                      {reduction.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Tỷ lệ chiết khấu */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
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
                    height: '44px',
                    '&:hover fieldset': {
                      borderColor: '#1c84ee',
                    },
                  },
                }}
              />
            </Box>

            {/* Tiền chiết khấu */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#424e5a',
                  mb: 1,
                  fontSize: '0.875rem',
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
                  endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                  },
                  '& .Mui-disabled': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Mô tả - Full width */}
          <Box sx={{ mt: 2.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#424e5a',
                mb: 1,
                fontSize: '0.875rem',
              }}>
              Mô tả sản phẩm/dịch vụ
            </Typography>
            <TextField
              fullWidth
              size="small"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Nhập mô tả chi tiết về đặc điểm, tính năng, ưu điểm của sản phẩm/dịch vụ..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1c84ee',
                  },
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
          pb: 3,
          pt: 2.5,
          borderTop: '1px solid #eef2f7',
          gap: 1.5,
        }}>
        <Button
          onClick={handleClose}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            color: '#5d7186',
            '&:hover': {
              backgroundColor: '#f8f9fa',
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
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100,
            boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
            },
            '&.Mui-disabled': {
              backgroundColor: '#b0b0bb',
              color: '#fff',
            },
          }}>
          Lưu
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveAndAdd}
          disabled={!formData.code || !formData.name || !formData.unit}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 140,
            boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
            },
            '&.Mui-disabled': {
              backgroundColor: '#b0b0bb',
              color: '#fff',
            },
          }}>
          Lưu và Thêm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddNewItemModal
