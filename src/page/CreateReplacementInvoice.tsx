import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import invoiceService, { Template, InvoiceListItem } from '@/services/invoiceService'
import customerService, { Customer } from '@/services/customerService'
import productService, { Product } from '@/services/productService'
import companyService, { Company } from '@/services/companyService'
import { mapToBackendInvoiceRequest } from '@/utils/invoiceAdapter'
import { numberToWords } from '@/utils/numberToWords'
import { getUserIdFromToken } from '@/utils/tokenUtils'
import { useAuthContext } from '@/context/useAuthContext'
import { USER_ROLES } from '@/constants/roles'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'
import type { ProductItem, CustomerInfo, TemplateConfigProps} from '@/types/invoiceTemplate'
import { DEFAULT_TEMPLATE_VISIBILITY, DEFAULT_INVOICE_SYMBOL } from '@/types/invoiceTemplate'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  InputAdornment,
  SelectChangeEvent,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Autocomplete,
  Chip,
} from '@mui/material'
import {
  HelpOutline,
  Info,
  Public,
  VerifiedUser,
  ExpandMore,
  Visibility,
  Close,
  Save,
  Print,
  KeyboardArrowUp,
  KeyboardArrowDown,
  DeleteOutline,
  Warning,
  WarningAmber as WarningAmberIcon,
  Add,
  Send,
} from '@mui/icons-material'
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams } from '@mui/x-data-grid'

// Interface cho hàng hóa/dịch vụ
interface InvoiceItem {
  id: number
  productId?: number        // ✅ ID sản phẩm từ DB
  stt: number
  type: string              // Tính chất HHDV (lấy từ description của Product)
  code: string              // Mã sản phẩm
  name: string              // Tên sản phẩm
  unit: string              // Đơn vị tính
  quantity: number          // Số lượng
  priceAfterTax: number     // Đơn giá CHƯA thuế (basePrice)
  discountPercent: number   // Tỷ lệ chiết khấu (%)
  discountAmount: number    // Tiền chiết khấu
  vatRate?: number          // ✅ Thuế suất GTGT của sản phẩm (0, 5, 8, 10)
  vatTax?: number           // ✅ Tiền thuế GTGT của dòng này
  totalAfterTax: number     // Thành tiền (chưa bao gồm thuế)
}

// Component edit cell cho Tên hàng hóa/Dịch vụ - với search
const ProductNameEditCell = (params: GridRenderEditCellParams & { products?: Product[], onProductSelect?: (rowId: string | number, product: Product) => void }) => {
  const [inputValue, setInputValue] = useState(params.value || '')
  const [searchText, setSearchText] = useState('')
  
  // ✅ Wrap trong useMemo để tránh re-render
  const availableProducts = React.useMemo(() => params.products || [], [params.products])

  // ✅ Lọc sản phẩm theo tên hoặc mã khi tìm kiếm
  const filteredProducts = React.useMemo(() => {
    if (!searchText) return availableProducts
    const search = searchText.toLowerCase()
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.code.toLowerCase().includes(search)
    )
  }, [searchText, availableProducts])

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    params.api.setEditCellValue({ id: params.id, field: params.field, value: newValue })
    
    // ✅ Tìm product được chọn và auto-fill TẤT CẢ thông tin
    const selectedProduct = availableProducts.find(p => p.name === newValue)
    console.log('🔍 ProductNameEditCell - Selected:', newValue, selectedProduct)
    if (selectedProduct && params.onProductSelect) {
      console.log('✅ Calling onProductSelect for row:', params.id, selectedProduct)
      params.onProductSelect(params.id, selectedProduct)
    } else {
      console.warn('⚠️ Product not found or onProductSelect missing:', { selectedProduct, hasCallback: !!params.onProductSelect })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%', 
      height: '100%',
    }}>
      <Select
        autoFocus
        fullWidth
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        displayEmpty
        onOpen={() => setSearchText('')} // Reset search khi mở
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              maxHeight: 300,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
              border: '1.5px solid #1976d2',
              borderRadius: 1.5,
              '& .MuiList-root': {
                padding: '4px',
              },
            },
          },
          sx: {
            zIndex: 1301, // Cao hơn modal (1300) và mọi element khác
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fff',
          },
          '& .MuiSelect-select': {
            fontSize: '0.8125rem',
            padding: '4px 32px 4px 8px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
          },
          '& fieldset': {
            borderColor: '#d0d0d0',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: '#1976d2',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#1976d2',
            borderWidth: '2px',
          },
        }}
      >
        {/* ✅ Search field cố định ở đầu dropdown */}
        <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', zIndex: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Tìm theo tên hoặc mã..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '32px',
                fontSize: '0.75rem',
              },
            }}
          />
        </Box>
        
        <MenuItem value="" disabled sx={{ fontSize: '0.8125rem', color: '#999' }}>
          {availableProducts.length === 0 ? '-- Đang tải sản phẩm... --' : '-- Chọn sản phẩm --'}
        </MenuItem>
        
        {filteredProducts.length === 0 && searchText ? (
          <MenuItem disabled sx={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
            Không tìm thấy sản phẩm phù hợp
          </MenuItem>
        ) : (
          filteredProducts.map((product) => (
            <MenuItem
              key={product.id}
              value={product.name}
              sx={{
                fontSize: '0.8125rem',
                py: 0.75,
                px: 1.25,
                minHeight: 'auto',
                borderRadius: 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                },
                '&.Mui-selected': {
                  backgroundColor: '#bbdefb',
                  '&:hover': {
                    backgroundColor: '#90caf9',
                  },
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                {product.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                Mã: {product.code} | Đơn vị: {product.unit} | Giá: {product.salesPrice.toLocaleString('vi-VN')}đ
              </Typography>
            </MenuItem>
          ))
        )}
      </Select>
    </Box>
  )
}

// Component edit cell cho Mã hàng hóa - Auto-complete khi nhập mã
const ProductCodeEditCell = (params: GridRenderEditCellParams & { products?: Product[], onProductSelect?: (rowId: string | number, product: Product) => void }) => {
  const [inputValue, setInputValue] = useState(params.value || '')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // ✅ Wrap trong useMemo để tránh re-render
  const availableProducts = React.useMemo(() => params.products || [], [params.products])

  // ✅ Lọc sản phẩm khi người dùng nhập
  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = availableProducts.filter(p => 
        p.code.toUpperCase().includes(inputValue.toUpperCase())
      ).slice(0, 5) // Giới hạn 5 gợi ý
      setFilteredProducts(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredProducts([])
      setShowSuggestions(false)
    }
  }, [inputValue, availableProducts])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.toUpperCase() // Uppercase cho mã sản phẩm
    setInputValue(newValue)
    params.api.setEditCellValue({ id: params.id, field: params.field, value: newValue })
    
    // ✅ Tự động tìm và điền nếu khớp chính xác
    const exactMatch = availableProducts.find(p => p.code.toUpperCase() === newValue)
    console.log('🔍 ProductCodeEditCell - Typing:', newValue, exactMatch)
    if (exactMatch && params.onProductSelect) {
      console.log('✅ Exact match found, calling onProductSelect for row:', params.id, exactMatch)
      params.onProductSelect(params.id, exactMatch)
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (product: Product) => {
    console.log('✅ Suggestion selected:', product)
    setInputValue(product.code)
    params.api.setEditCellValue({ id: params.id, field: params.field, value: product.code })
    if (params.onProductSelect) {
      console.log('✅ Calling onProductSelect from suggestion for row:', params.id, product)
      params.onProductSelect(params.id, product)
    }
    setShowSuggestions(false)
    params.api.stopCellEditMode({ id: params.id, field: params.field })
  }

  const handleBlur = () => {
    // Delay để cho phép click vào suggestion
    setTimeout(() => {
      const selectedProduct = availableProducts.find(p => p.code.toUpperCase() === inputValue.toUpperCase())
      console.log('🔍 ProductCodeEditCell - Blur:', inputValue, selectedProduct)
      if (selectedProduct && params.onProductSelect) {
        console.log('✅ Calling onProductSelect on blur for row:', params.id, selectedProduct)
        params.onProductSelect(params.id, selectedProduct)
      }
      setShowSuggestions(false)
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }
  }

  return (
    <Box sx={{ 
      position: 'relative',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%', 
      height: '100%',
    }}>
      <TextField
        autoFocus
        fullWidth
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        placeholder="Nhập mã SP"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fff',
          },
          '& input': {
            fontSize: '0.8125rem',
            padding: '4px 8px',
            height: '28px',
            textTransform: 'uppercase',
          },
          '& fieldset': {
            borderColor: '#d0d0d0',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: '#1976d2',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#1976d2',
            borderWidth: '2px',
          },
        }}
      />
      {/* ✅ Suggestion Dropdown */}
      {showSuggestions && filteredProducts.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: '200px',
            overflow: 'auto',
            mt: 0.5,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
            border: '1px solid #1976d2',
            borderRadius: 1,
          }}
        >
          {filteredProducts.map((product) => (
            <Box
              key={product.id}
              onMouseDown={() => handleSelectSuggestion(product)}
              sx={{
                p: 1,
                cursor: 'pointer',
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                },
                borderBottom: '1px solid #f0f0f0',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976d2' }}>
                {product.code}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                {product.name}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  )
}

// Component edit cell cho Số lượng
const QuantityEditCell = (params: GridRenderEditCellParams) => {
  const [value, setValue] = useState(Number(params.value) || 1)

  const handleChange = (newValue: number) => {
    const formatted = Number(newValue.toFixed(2))
    setValue(formatted)
    params.api.setEditCellValue({ id: params.id, field: params.field, value: formatted })
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%', 
      height: '100%',
      gap: 0.5,
    }}>
      <TextField
        autoFocus
        size="small"
        type="number"
        value={value}
        onChange={(e) => handleChange(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            params.api.stopCellEditMode({ id: params.id, field: params.field })
          }
        }}
        variant="outlined"
        inputProps={{
          step: 1,
          min: 0,
          style: { textAlign: 'center' },
        }}
        sx={{
          width: '60px',
          '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fff',
            paddingRight: '2px',
            '& fieldset': {
              borderColor: '#d0d0d0',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '4px 4px 4px 8px',
            height: '28px',
            boxSizing: 'border-box',
            textAlign: 'center',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              display: 'none',
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end" sx={{ mr: 0, height: '100%' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0,
                height: '26px',
              }}>
                <IconButton
                  size="small"
                  onClick={() => handleChange(value + 1)}
                  sx={{
                    padding: '0px',
                    minWidth: '18px',
                    width: '18px',
                    height: '13px',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                  }}>
                  <KeyboardArrowUp sx={{ fontSize: 14, color: '#666' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleChange(Math.max(0, value - 1))}
                  sx={{
                    padding: '0px',
                    minWidth: '18px',
                    width: '18px',
                    height: '13px',
                    borderRadius: '0 0 3px 3px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                  }}>
                  <KeyboardArrowDown sx={{ fontSize: 14, color: '#666' }} />
                </IconButton>
              </Box>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  )
}

// Component riêng cho ô edit Đơn giá với format VND
const PriceEditCell = (params: GridRenderEditCellParams) => {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    const num = Number(params.value) || 0
    setDisplayValue(num.toLocaleString('vi-VN'))
  }, [params.value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Xóa tất cả dấu . để lấy số thuần
    const numOnly = input.replace(/\./g, '')
    
    if (numOnly === '' || /^\d+$/.test(numOnly)) {
      const num = numOnly === '' ? 0 : Number(numOnly)
      setDisplayValue(num.toLocaleString('vi-VN'))
      params.api.setEditCellValue({ id: params.id, field: params.field, value: num })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <TextField
        autoFocus
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        inputProps={{
          style: {
            textAlign: 'center',
            padding: '0 8px',
            height: '28px',
            fontSize: '0.8125rem',
          },
        }}
        sx={{
          width: '120px',
          '& .MuiOutlinedInput-root': {
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fff',
            '& fieldset': {
              borderColor: '#d0d0d0',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '4px 8px',
            height: '28px',
            boxSizing: 'border-box',
            textAlign: 'center',
          },
        }}
      />
    </Box>
  )
}

// Component riêng cho ô edit Tỷ lệ CK (%)
const DiscountPercentEditCell = (params: GridRenderEditCellParams) => {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    const num = Number(params.value) || 0
    setDisplayValue(num.toFixed(2).replace('.', ','))
  }, [params.value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\./g, ',')
    
    // Cho phép nhập số với dấu ,
    if (input === '' || /^\d*,?\d{0,2}$/.test(input)) {
      const num = input === '' ? 0 : Number(input.replace(',', '.'))
      if (num >= 0 && num <= 100) {
        setDisplayValue(input)
        params.api.setEditCellValue({ id: params.id, field: params.field, value: num })
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <TextField
        autoFocus
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        inputProps={{
          style: { textAlign: 'right', padding: '0 8px', height: '28px', fontSize: '0.8125rem' },
        }}
        sx={{
          width: '100px',
          '& .MuiOutlinedInput-root': {
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fff',
            '& fieldset': { borderColor: '#d0d0d0', borderWidth: '1px' },
            '&:hover fieldset': { borderColor: '#1976d2' },
            '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '4px 8px',
            height: '28px',
            boxSizing: 'border-box',
            textAlign: 'right',
          },
        }}
      />
    </Box>
  )
}

// Component riêng cho ô edit Tiền CK
const DiscountAmountEditCell = (params: GridRenderEditCellParams) => {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    const num = Number(params.value) || 0
    setDisplayValue(num.toLocaleString('vi-VN'))
  }, [params.value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const numOnly = input.replace(/\./g, '')
    
    if (numOnly === '' || /^\d+$/.test(numOnly)) {
      const num = numOnly === '' ? 0 : Number(numOnly)
      setDisplayValue(num.toLocaleString('vi-VN'))
      params.api.setEditCellValue({ id: params.id, field: params.field, value: num })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <TextField
        autoFocus
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        inputProps={{
          style: { textAlign: 'right', padding: '0 8px', height: '28px', fontSize: '0.8125rem' },
        }}
        sx={{
          width: '110px',
          '& .MuiOutlinedInput-root': {
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fff',
            '& fieldset': { borderColor: '#d0d0d0', borderWidth: '1px' },
            '&:hover fieldset': { borderColor: '#1976d2' },
            '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '4px 8px',
            height: '28px',
            boxSizing: 'border-box',
            textAlign: 'right',
          },
        }}
      />
    </Box>
  )
}

/**
 * CreateVatInvoice Component
 * 
 * 📋 Chức năng: Tạo hóa đơn GTGT (Giá trị gia tăng) mới với đầy đủ tính năng:
 * 
 * ✅ Các tính năng chính:
 * - Chọn mẫu hóa đơn (template) từ danh sách có sẵn
 * - Nhập thông tin người mua (có thể chọn từ DB hoặc nhập tay)
 * - Thêm/sửa/xóa sản phẩm/dịch vụ với tính VAT riêng biệt
 * - Tự động tính toán: tổng tiền, VAT, chiết khấu
 * - Lưu nháp (invoiceStatusID = 1)
 * - Gửi duyệt (invoiceStatusID = 6)
 * - Preview hóa đơn trước khi lưu
 * - Gửi email hóa đơn nháp
 * 
 * 📊 Quy trình cấp số hóa đơn:
 * 1. Tạo mới/Lưu nháp → invoiceNumber = 0 (chưa có số)
 * 2. Sau khi ký số → Backend tự động cấp số duy nhất
 * 3. Sau khi gửi CQT → Nhận mã cơ quan thuế (taxAuthorityCode)
 * 
 * ⚠️ Lưu ý quan trọng:
 * - Số hóa đơn (invoiceNumber) chỉ được cấp SAU KHI KÝ SỐ
 * - Hóa đơn nháp có invoiceNumber = 0 hoặc NULL
 * - Để ký số: Vào trang danh sách → Chọn hóa đơn → Nhấn "Ký số"
 * - Giá sản phẩm nhập vào là giá CHƯA thuế (calculateAfterTax = false)
 * - Mỗi sản phẩm có thể có thuế suất VAT khác nhau (0%, 5%, 8%, 10%)
 * 
 * 🔗 API liên quan:
 * - POST /api/Invoice - Tạo hóa đơn mới
 * - POST /api/Invoice/{id}/sign - Ký số hóa đơn (cấp số tự động)
 * - POST /api/Tax/submit - Gửi hóa đơn lên CQT
 * 
 * @component
 * @returns {JSX.Element} Form tạo hóa đơn GTGT
 */
const CreateVatInvoice: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext() // ✅ Get user role
  const [searchParams] = useSearchParams()
  const { id: originalInvoiceIdParam } = useParams<{ id: string }>()
  
  // ✅ Replacement mode detection
  const isReplacementMode = !!originalInvoiceIdParam
  const originalInvoiceId = originalInvoiceIdParam ? parseInt(originalInvoiceIdParam) : null
  
  // ✅ Edit mode detection (for normal edit)
  const editMode = searchParams.get('mode') === 'edit'
  const editInvoiceId = searchParams.get('id')
  
  // Template states
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  
  // Product states
  const [products, setProducts] = useState<Product[]>([])
  
  // Company states
  const [company, setCompany] = useState<Company | null>(null)
  
  const [showTypeColumn, setShowTypeColumn] = useState(true)
  const [discountType, setDiscountType] = useState<string>('none') // 'none' | 'per-item' | 'total'
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false) // ✅ Preview modal
  const [invoiceNotes, setInvoiceNotes] = useState<string>('') // Ghi chú chung cho hóa đơn
  const [showInvoiceNotes, setShowInvoiceNotes] = useState(false) // Hiện/ẩn ô ghi chú
  const calculateAfterTax = false // Giá nhập vào là giá CHƯA thuế, VAT tính thêm

  // ✅ State cho hóa đơn thay thế
  const [originalInvoice, setOriginalInvoice] = useState<InvoiceListItem | null>(null)
  const [replacementReason, setReplacementReason] = useState<string>('')
  
  // ✅ State cho loại hóa đơn (B2B/B2C) - Load từ hóa đơn gốc
  const [invoiceType, setInvoiceType] = useState<'B2B' | 'B2C'>('B2B') // Mặc định B2B, sẽ load từ originalInvoice
  
  // State cho loading và error
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning'
  }>({ open: false, message: '', severity: 'success' })
  
  // ✅ State cho Dialog xác nhận sản phẩm trùng
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean
    rowId: string | number
    product: Product | null
    existingItem: InvoiceItem | null
  }>({ open: false, rowId: '', product: null, existingItem: null })

  // ✅ State cho Dialog xác nhận hủy bỏ
  const [cancelDialog, setCancelDialog] = useState(false)

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      setTemplatesLoading(true)
      try {
        const data = await invoiceService.getActiveTemplates()
        console.log('📋 Available templates:', data)
        setTemplates(data)
        if (data.length > 0) {
          setSelectedTemplate(data[0]) // Auto-select first template
          console.log('✅ Auto-selected template:', data[0])
        } else {
          console.warn('⚠️ No templates available!')
        }
      } catch (error) {
        console.error('❌ Error loading templates:', error)
      } finally {
        setTemplatesLoading(false)
      }
    }
    
    const loadProducts = async () => {
      try {
        const data = await productService.getProducts()
        console.log('📦 Available products:', data)
        setProducts(data)
      } catch (error) {
        console.error('❌ Error loading products:', error)
      }
    }
    
    const loadCompany = async () => {
      try {
        const data = await companyService.getDefaultCompany()
        console.log('🏢 Company info:', data)
        setCompany(data)
      } catch (error) {
        console.error('❌ Error loading company:', error)
      }
    }
    
    loadTemplates()
    loadProducts()
    loadCompany()
  }, [])

  // ✅ Load ORIGINAL invoice data when in REPLACEMENT mode
  useEffect(() => {
    const loadOriginalInvoice = async () => {
      if (!isReplacementMode || !originalInvoiceId) return
      
      try {
        setIsSubmitting(true)
        console.log(`📥 Loading ORIGINAL invoice for replacement, ID: ${originalInvoiceId}`)
        
        const invoice = await invoiceService.getInvoiceById(originalInvoiceId)
        console.log('✅ Original invoice loaded:', invoice)
        console.log('📞 Phone fields check:', {
          contactPhone: invoice.contactPhone,
          customerData: invoice.customerID
        })
        
        // ⚠️ Lưu lại hóa đơn gốc
        setOriginalInvoice(invoice)
        
        // ✅ Load loại hóa đơn từ hóa đơn gốc
        // invoiceCustomerType: 1 hoặc 'Customer' = B2C, 2 hoặc 'Business' = B2B
        const loadedInvoiceType = 
          (invoice.invoiceCustomerType === 1 || invoice.invoiceCustomerType === 'Customer') 
            ? 'B2C' 
            : 'B2B'
        setInvoiceType(loadedInvoiceType)
        console.log('🏢 Invoice type from original invoice:', {
          invoiceCustomerType: invoice.invoiceCustomerType,
          invoiceType: loadedInvoiceType,
          description: loadedInvoiceType === 'B2C' ? 'Bán lẻ (Customer)' : 'Doanh nghiệp (Business)'
        })
        
        // ✅ PRE-FILL dữ liệu từ hóa đơn gốc
        
        // 1. Template - copy từ hóa đơn cũ
        const template = templates.find(t => t.templateID === invoice.templateID)
        if (template) {
          setSelectedTemplate(template)
        }
        
        // 2. Customer info - copy từ hóa đơn cũ
        let customerData = null
        if (invoice.customerID) {
          console.log('📥 Fetching customer data for ID:', invoice.customerID)
          const customers = await customerService.getActiveCustomers()
          customerData = customers.find(c => c.customerID === invoice.customerID)
          console.log('👤 Customer data loaded:', customerData)
        }
        
        console.log('📋 Setting buyer info:', {
          phone_invoice: invoice.contactPhone,
          phone_customer: customerData?.contactPhone,
          email_invoice: invoice.customerEmail,
          email_customer: customerData?.contactEmail,
        })
        
        setBuyerCustomerID(invoice.customerID)
        setBuyerTaxCode(invoice.taxCode || customerData?.taxCode || '')
        setBuyerCompanyName(invoice.customerName || customerData?.customerName || '')
        setBuyerAddress(invoice.customerAddress || customerData?.address || '')
        setBuyerName(invoice.contactPerson || customerData?.contactPerson || '')
        setBuyerEmail(invoice.customerEmail || customerData?.contactEmail || '') // ✅ Fix: customerEmail
        setBuyerPhone(invoice.contactPhone || customerData?.contactPhone || '') // ✅ Fix: Fallback to customer
        
        // 3. Payment method - copy từ hóa đơn cũ (normalize về 4 options mới)
        const validPaymentMethods = ['Tiền mặt/Chuyển khoản', 'Chuyển khoản', 'Tiền mặt', 'Đối trừ công nợ']
        let normalizedPaymentMethod = 'Tiền mặt/Chuyển khoản' // Default
        
        if (invoice.paymentMethod && invoice.paymentMethod !== 'string') {
          // Map old values sang new values
          if (validPaymentMethods.includes(invoice.paymentMethod)) {
            normalizedPaymentMethod = invoice.paymentMethod
          } else if (invoice.paymentMethod === 'Đổi trừ công nợ') {
            normalizedPaymentMethod = 'Đối trừ công nợ' // Fix typo
          } else if (invoice.paymentMethod === 'Khác') {
            normalizedPaymentMethod = 'Tiền mặt/Chuyển khoản' // Fallback
          }
        }
        setPaymentMethod(normalizedPaymentMethod)
        
        // 4. Notes - KHÔNG copy (để user nhập mới)
        setInvoiceNotes('')
        
        // 5. Items - copy từ hóa đơn cũ và load thông tin đầy đủ từ Product
        const mappedItems: InvoiceItem[] = await Promise.all(
          invoice.invoiceItems
            .filter(item => item.productId && item.quantity > 0)
            .map(async (item, index) => {
              const quantity = item.quantity || 1
              const amount = item.amount || 0
              const vatAmount = item.vatAmount || 0
              const priceBeforeVat = quantity > 0 ? amount / quantity : 0
              const vatRate = vatAmount > 0 && amount > 0 ? Math.round((vatAmount / amount) * 100) : 0
              const priceAfterVat = priceBeforeVat > 0 ? priceBeforeVat * (1 + vatRate / 100) : 0
              const totalAfterVat = amount + vatAmount
              
              // ✅ Load product info để lấy mã hàng (code)
              let productCode = ''
              let productType = item.productName || 'Hàng hóa'
              try {
                if (item.productId) {
                  const product = await productService.getProductById(item.productId)
                  productCode = product.code || ''
                  productType = product.description || productType
                }
              } catch (error) {
                console.warn(`⚠️ Could not load product ${item.productId}:`, error)
              }
              
              return {
                id: index + 1,
                stt: index + 1,
                productId: item.productId,
                type: productType,
                code: productCode, // ✅ Fix: Load từ Product
                name: item.productName || '',
                unit: item.unit || '',
                quantity: quantity,
                priceAfterTax: priceAfterVat,
                discountPercent: 0,
                discountAmount: 0,
                totalAfterTax: totalAfterVat,
                vatRate,
              }
            })
        )
        
        if (mappedItems.length === 0) {
          mappedItems.push({
            id: 1,
            stt: 1,
            type: 'Hàng hóa, dịch vụ',
            code: '',
            name: '',
            unit: '',
            quantity: 1,
            priceAfterTax: 0,
            discountPercent: 0,
            discountAmount: 0,
            totalAfterTax: 0,
            vatRate: 0,
          })
        }
        
        setItems(mappedItems)
        
        setSnackbar({
          open: true,
          message: `✅ Đã tải thông tin hóa đơn gốc số: ${invoice.invoiceNumber || 'N/A'}`,
          severity: 'success',
        })
        
      } catch (error) {
        console.error('❌ Error loading original invoice:', error)
        setSnackbar({
          open: true,
          message: `❌ Lỗi tải hóa đơn gốc: ${error instanceof Error ? error.message : 'Vui lòng thử lại'}`,
          severity: 'error',
        })
        setTimeout(() => navigate('/invoices'), 2000)
      } finally {
        setIsSubmitting(false)
      }
    }
    
    // Chờ templates load xong rồi mới load invoice
    if (templates.length > 0) {
      loadOriginalInvoice()
    }
  }, [isReplacementMode, originalInvoiceId, templates, navigate])

  // ✅ Load invoice data when in edit mode
  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!editMode || !editInvoiceId) return
      
      try {
        setIsSubmitting(true)
        console.log(`📥 Loading invoice data for ID: ${editInvoiceId}`)
        
        const invoice = await invoiceService.getInvoiceById(parseInt(editInvoiceId))
        console.log('✅ Invoice data loaded:', invoice)
        console.log('💳 Payment method from backend:', invoice.paymentMethod)
        
        // Set template
        const template = templates.find(t => t.templateID === invoice.templateID)
        if (template) {
          setSelectedTemplate(template)
        }
        
        // Load customer data if customerID exists but details are missing
        let customerData = null
        if (invoice.customerID && !invoice.customerName) {
          console.log('📥 Fetching customer data for ID:', invoice.customerID)
          const customers = await customerService.getActiveCustomers()
          customerData = customers.find(c => c.customerID === invoice.customerID)
          console.log('👤 Customer data:', customerData)
        }
        
        // Set buyer info (prefer invoice fields, fallback to customer data)
        setBuyerCustomerID(invoice.customerID)
        setBuyerTaxCode(invoice.taxCode || customerData?.taxCode || '')
        setBuyerCompanyName(invoice.customerName || customerData?.customerName || '')
        setBuyerAddress(invoice.customerAddress || customerData?.address || '') // ✅ Fix: customerAddress
        setBuyerName(invoice.contactPerson || customerData?.contactPerson || '')
        setBuyerEmail(invoice.contactEmail || customerData?.contactEmail || '')
        setBuyerPhone(invoice.contactPhone || customerData?.contactPhone || '')
        
        // Normalize payment method value (ensure it matches the dropdown options)
        const validPaymentMethods = ['Tiền mặt/Chuyển khoản', 'Chuyển khoản', 'Tiền mặt', 'Đối trừ công nợ']
        let normalizedPaymentMethod = 'Tiền mặt/Chuyển khoản' // Default
        
        // Check if backend returned valid value (not 'string' literal or null/undefined)
        if (invoice.paymentMethod && invoice.paymentMethod !== 'string') {
          // Map old values sang new values
          if (validPaymentMethods.includes(invoice.paymentMethod)) {
            normalizedPaymentMethod = invoice.paymentMethod
          } else if (invoice.paymentMethod === 'Đổi trừ công nợ') {
            normalizedPaymentMethod = 'Đối trừ công nợ' // Fix typo
          } else if (invoice.paymentMethod === 'Khác') {
            normalizedPaymentMethod = 'Tiền mặt/Chuyển khoản' // Fallback
          } else {
            console.warn('⚠️ Invalid payment method from backend:', invoice.paymentMethod)
          }
        }
        
        console.log('✅ Normalized payment method:', normalizedPaymentMethod)
        setPaymentMethod(normalizedPaymentMethod)
        
        setInvoiceNotes(invoice.notes || '')
        
        // Set items - calculate price and VAT correctly with validation
        const mappedItems: InvoiceItem[] = invoice.invoiceItems
          .filter(item => {
            // Filter out invalid items
            if (!item.productId || item.quantity <= 0) {
              console.warn('⚠️ Skipping invalid item:', item)
              return false
            }
            return true
          })
          .map((item, index) => {
            // Validate and calculate with safety checks
            const quantity = item.quantity || 1
            const amount = item.amount || 0
            const vatAmount = item.vatAmount || 0
            
            // Calculate price before VAT (avoid division by zero)
            const priceBeforeVat = quantity > 0 ? amount / quantity : 0
            
            // Calculate VAT rate
            const vatRate = vatAmount > 0 && amount > 0 
              ? Math.round((vatAmount / amount) * 100) 
              : 0
            
            // Calculate price after VAT
            const priceAfterVat = priceBeforeVat > 0 
              ? priceBeforeVat * (1 + vatRate / 100)
              : 0
            
            // Calculate total after VAT
            const totalAfterVat = amount + vatAmount
            
            const isValid = quantity > 0 && (amount > 0 || vatAmount > 0)
            
            console.log(`📦 Item ${index + 1}: ${item.productName}`, {
              amount,
              vatAmount,
              quantity,
              priceBeforeVat: priceBeforeVat.toFixed(2),
              vatRate,
              priceAfterVat: priceAfterVat.toFixed(2),
              totalAfterVat: totalAfterVat.toFixed(2),
              isValid: isValid ? '✅' : '⚠️'
            })
            
            if (!isValid) {
              console.warn('⚠️ Item has zero amount and quantity:', item.productName)
            }
            
            return {
              id: index + 1,
              stt: index + 1,
              productId: item.productId,
              type: item.productName || 'Hàng hóa',
              code: '', // Backend không trả về code
              name: item.productName || '',
              unit: item.unit || '',
              quantity: quantity,
              priceAfterTax: priceAfterVat,
              discountPercent: 0,
              discountAmount: 0,
              totalAfterTax: totalAfterVat,
              vatRate,
            }
          })
        
        // If no valid items, create one empty row
        if (mappedItems.length === 0) {
          console.warn('⚠️ No valid invoice items found, creating empty row')
          mappedItems.push({
            id: 1,
            stt: 1,
            type: 'Hàng hóa, dịch vụ',
            code: '',
            name: '',
            unit: '',
            quantity: 1,
            priceAfterTax: 0,
            discountPercent: 0,
            discountAmount: 0,
            totalAfterTax: 0,
            vatRate: 0,
          })
        }
        
        setItems(mappedItems)
        
        // Show appropriate message based on data completeness
        const hasInvalidItems = invoice.invoiceItems.some(item => 
          item.quantity <= 0 || (item.amount === 0 && item.vatAmount === 0)
        )
        const hasInvalidPaymentMethod = !invoice.paymentMethod || 
          invoice.paymentMethod === 'string'
        
        if (hasInvalidItems || hasInvalidPaymentMethod) {
          setSnackbar({
            open: true,
            message: '⚠️ Dữ liệu hóa đơn chưa đầy đủ. Vui lòng kiểm tra và cập nhật.',
            severity: 'warning',
          })
        } else {
          setSnackbar({
            open: true,
            message: '✅ Đã tải dữ liệu hóa đơn',
            severity: 'success',
          })
        }
        
      } catch (error) {
        console.error('❌ Error loading invoice:', error)
        setSnackbar({
          open: true,
          message: `❌ Lỗi tải dữ liệu: ${error instanceof Error ? error.message : 'Vui lòng thử lại'}`,
          severity: 'error',
        })
        
        // Redirect back on error
        setTimeout(() => navigate('/invoices'), 2000)
      } finally {
        setIsSubmitting(false)
      }
    }
    
    loadInvoiceData()
  }, [editMode, editInvoiceId, templates, navigate]) // Chờ templates load xong

  // State quản lý danh sách hàng hóa
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      stt: 1,
      type: 'Hàng hóa, dịch vụ',
      code: '',
      name: '',
      unit: '',
      quantity: 1,
      priceAfterTax: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalAfterTax: 0,
    },
  ])

  // State cho thông tin người mua
  const [buyerCustomerID, setBuyerCustomerID] = useState<number>(0) // ✅ ID customer từ DB
  const [buyerTaxCode, setBuyerTaxCode] = useState('')
  const [buyerCompanyName, setBuyerCompanyName] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt/Chuyển khoản') // Hình thức thanh toán - Default khuyến nghị
  
  // State cho customer lookup
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [customerNotFound, setCustomerNotFound] = useState(false)
  
  // ✅ State cho autocomplete suggestions
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  // ✅ State cho delete confirmation dialog
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean
    itemId: number | null
    itemName: string
  }>({ open: false, itemId: null, itemName: '' })
  
  // ✅ Search customer by name for autocomplete dropdown
  const searchCustomerByName = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setCustomerSuggestions([])
      return
    }

    try {
      setIsLoadingSuggestions(true)
      // Get active customers và filter theo tên công ty
      const allCustomers = await customerService.getActiveCustomers()
      const filtered = allCustomers.filter(c => 
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setCustomerSuggestions(filtered.slice(0, 10)) // Limit 10 results
    } catch (error) {
      console.error('Error searching customers:', error)
      setCustomerSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  // ✅ Debounced search - trigger khi nhập tên công ty (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buyerCompanyName && buyerCompanyName.trim().length >= 2) {
        searchCustomerByName(buyerCompanyName)
      } else {
        setCustomerSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [buyerCompanyName, searchCustomerByName])

  // ✅ Handle customer selection from autocomplete
  const handleCustomerSelect = (customer: Customer) => {
    if (customer) {
      setBuyerCustomerID(customer.customerID)
      setBuyerTaxCode(customer.taxCode)
      setBuyerCompanyName(customer.customerName)
      setBuyerAddress(customer.address)
      setBuyerEmail(customer.contactEmail)
      setBuyerPhone(customer.contactPhone)
      // ✅ Autofill contactPerson vào buyerName
      if (customer.contactPerson) {
        setBuyerName(customer.contactPerson)
      }
      
      // ✅ Clear suggestions và errors
      setCustomerSuggestions([])
      setCustomerNotFound(false)
      
      console.log('✅ Customer selected from dropdown:', customer.customerName)
      setSnackbar({
        open: true,
        message: `Đã chọn khách hàng: ${customer.customerName}`,
        severity: 'success',
      })
    }
  }

  // Function: Tự động tìm và điền thông tin khách hàng theo MST
  const handleTaxCodeLookup = async (taxCode: string) => {
    if (!taxCode || taxCode.trim().length < 10) {
      setCustomerNotFound(false)
      return
    }
    
    try {
      setIsSearchingCustomer(true)
      setCustomerNotFound(false)
      
      // ✅ Gọi API findCustomerByTaxCode để tìm kiếm trực tiếp
      const foundCustomer = await customerService.findCustomerByTaxCode(taxCode.trim())
      
      if (foundCustomer) {
        // 🚫 Kiểm tra xem khách hàng còn active không
        if (!foundCustomer.isActive) {
          setBuyerCustomerID(0)
          setBuyerCompanyName('')
          setBuyerAddress('')
          setBuyerEmail('')
          setBuyerPhone('')
          setCustomerNotFound(true)
          
          setSnackbar({
            open: true,
            message: `⚠️ Khách hàng "${foundCustomer.customerName}" đã bị vô hiệu hóa. Vui lòng liên hệ quản lý!`,
            severity: 'error',
          })
          return
        }
        
        // Tự động điền thông tin
        setBuyerCustomerID(foundCustomer.customerID) // ✅ Lưu customer ID
        setBuyerCompanyName(foundCustomer.customerName)
        setBuyerAddress(foundCustomer.address)
        setBuyerEmail(foundCustomer.contactEmail)
        setBuyerPhone(foundCustomer.contactPhone)
        // buyerName để trống cho người dùng tự nhập
        
        console.log('✅ Found customer:', foundCustomer.customerName)
        setSnackbar({
          open: true,
          message: `Đã tìm thấy khách hàng: ${foundCustomer.customerName}`,
          severity: 'success',
        })
      } else {
        // Không tìm thấy - xóa các field
        setBuyerCustomerID(0) // ✅ Reset customer ID
        setBuyerCompanyName('')
        setBuyerAddress('')
        setBuyerEmail('')
        setBuyerPhone('')
        // buyerName stays as user entered
        setCustomerNotFound(true)
        
        console.log('⚠️ Customer not found for tax code:', taxCode)
        setSnackbar({
          open: true,
          message: 'Không tìm thấy khách hàng với MST này. Vui lòng nhập thủ công.',
          severity: 'warning',
        })
      }
    } catch (error) {
      console.error('❌ Error looking up customer:', error)
      setSnackbar({
        open: true,
        message: 'Lỗi khi tra cứu thông tin khách hàng',
        severity: 'error',
      })
    } finally {
      setIsSearchingCustomer(false)
    }
  }
  
  // ✅ Hàm điền thông tin sản phẩm (tái sử dụng cho cả trường hợp thêm mới và tăng số lượng)
  const fillProductData = useCallback(async (rowId: string | number, product: Product) => {
    try {
      console.log('🔄 fillProductData called for row:', rowId, 'product:', product)
      
      // ✅ Gọi API để lấy thông tin đầy đủ
      const productDetail = await productService.getProductById(product.id)
      
      console.log('✅ Product detail fetched:', productDetail)
      
      const productVatRate = parseFloat(productDetail.vatTaxRate) || 0
      const basePrice = productDetail.salesPrice
      
      console.log('📊 Price calculation:', {
        basePrice,
        vatRate: productVatRate,
        vatTaxRate: productDetail.vatTaxRate,
      })
      
      // ✅ Auto-fill TẤT CẢ thông tin - Tạo object mới hoàn toàn để force re-render
      setItems(prevItems => {
        console.log('📝 Updating items, previous state:', prevItems)
        const updatedItems = prevItems.map(item => {
          if (item.id === rowId) {
            // Tính thành tiền CHƯA thuế
            const totalAfterTax = basePrice * item.quantity
            
            // ✅ Tạo object hoàn toàn mới để React detect thay đổi
            const updatedItem: InvoiceItem = {
              id: item.id,
              stt: item.stt,
              productId: productDetail.id,              // ID sản phẩm
              code: productDetail.code,                 // Mã sản phẩm (DV001)
              name: productDetail.name,                 // Tên sản phẩm
              type: productDetail.description || 'Hàng hóa', // Tính chất HHDV từ description
              unit: productDetail.unit,                 // Đơn vị tính
              quantity: item.quantity,                  // Giữ nguyên số lượng
              priceAfterTax: basePrice,                // ✅ Đơn giá CHƯA thuế
              discountPercent: item.discountPercent,   // Giữ nguyên chiết khấu
              discountAmount: item.discountAmount,     // Giữ nguyên chiết khấu
              totalAfterTax: totalAfterTax,            // ✅ Thành tiền CHƯA thuế
              vatRate: productVatRate,                 // ✅ Thuế suất của sản phẩm
            }
            console.log('✅ Updated item:', updatedItem)
            return updatedItem
          }
          return item
        })
        console.log('🔄 New items state:', updatedItems)
        return updatedItems
      })
      
      console.log(`✅ Auto-filled product for row ${rowId}:`, {
        name: productDetail.name,
        code: productDetail.code,
        unit: productDetail.unit,
        basePrice: productDetail.salesPrice,
        vatRate: productDetail.vatTaxRate,
      })
      
      // ✅ Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: `Đã tải thông tin sản phẩm: ${productDetail.name}`,
        severity: 'success',
      })
    } catch (error) {
      console.error('❌ Error fetching product details:', error)
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải thông tin sản phẩm',
        severity: 'error',
      })
    }
  }, [])
  
  // Handle product selection - Auto-fill TẤT CẢ thông tin sản phẩm
  const handleProductSelect = useCallback(async (rowId: string | number, product: Product) => {
    console.log('🎯 handleProductSelect called:', { rowId, product })
    
    // ✅ Kiểm tra xem sản phẩm đã tồn tại trong danh sách chưa (trừ dòng hiện tại)
    const existingItem = items.find(item => 
      item.productId === product.id && item.id !== rowId
    )
    
    console.log('🔍 Checking duplicate:', { existingItem, currentItems: items })
    
    if (existingItem) {
      // ⚠️ Sản phẩm đã tồn tại → Hiển thị Dialog xác nhận
      console.log('⚠️ Duplicate product found, showing dialog')
      setDuplicateDialog({
        open: true,
        rowId,
        product,
        existingItem,
      })
      return
    }
    
    // ✅ Sản phẩm chưa tồn tại → Điền thông tin bình thường
    console.log('✅ Product not duplicate, calling fillProductData')
    await fillProductData(rowId, product)
    console.log('✅ fillProductData completed')
  }, [items, fillProductData])
  
  // Handle tax code change with debounce
  const handleTaxCodeChange = (value: string) => {
    setBuyerTaxCode(value)
    setCustomerNotFound(false)
  }
  
  // ✅ Xử lý khi chọn "Tăng số lượng" cho sản phẩm trùng
  const handleIncreaseQuantity = useCallback(() => {
    const { existingItem, rowId } = duplicateDialog
    
    if (existingItem) {
      // Tăng số lượng của sản phẩm đã tồn tại
      setItems(prevItems => 
        prevItems.map(item => {
          if (item.id === existingItem.id) {
            const newQuantity = item.quantity + 1
            const totalAfterTax = item.priceAfterTax * newQuantity - (item.discountAmount || 0)
            return {
              ...item,
              quantity: newQuantity,
              totalAfterTax,
            }
          }
          return item
        })
      )
      
      // Xóa dòng trống vừa thêm
      setItems(prevItems => prevItems.filter(item => item.id !== rowId))
      
      setSnackbar({
        open: true,
        message: `Đã tăng số lượng "${existingItem.name}" lên ${existingItem.quantity + 1}`,
        severity: 'success',
      })
    }
    
    // Đóng Dialog
    setDuplicateDialog({ open: false, rowId: '', product: null, existingItem: null })
  }, [duplicateDialog])
  
  // ✅ Xử lý khi chọn "Thêm dòng mới" cho sản phẩm trùng
  const handleAddNewRow = useCallback(async () => {
    const { rowId, product } = duplicateDialog
    
    if (product) {
      // Điền thông tin cho dòng mới
      await fillProductData(rowId, product)
      
      setSnackbar({
        open: true,
        message: `Đã thêm dòng mới cho "${product.name}"`,
        severity: 'success',
      })
    }
    
    // Đóng Dialog
    setDuplicateDialog({ open: false, rowId: '', product: null, existingItem: null })
  }, [duplicateDialog, fillProductData])
  
  // Handle tax code blur (trigger lookup)
  const handleTaxCodeBlur = () => {
    if (buyerTaxCode && buyerTaxCode.trim().length >= 10) {
      handleTaxCodeLookup(buyerTaxCode)
    }
  }

  

  const handleCloseSendEmailModal = () => {
    setSendEmailModalOpen(false)
  }

  // Thêm hàng mới
  const handleAddRow = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1
    const newItem: InvoiceItem = {
      id: newId,
      stt: items.length + 1,
      type: 'Hàng hóa, dịch vụ',
      code: '',
      name: '',
      unit: '',
      quantity: 1,
      priceAfterTax: 0,
      discountPercent: 0,
      discountAmount: 0,
      vatRate: 0,              // ✅ Thuế suất mặc định 0%
      totalAfterTax: 0,
    }
    setItems([...items, newItem])
  }

  // ✅ Mở confirm dialog khi click xóa
  const handleDeleteRow = (id: number) => {
    // Tìm thông tin sản phẩm để hiển thị trong dialog
    const item = items.find(i => i.id === id)
    if (item) {
      setDeleteConfirmDialog({
        open: true,
        itemId: id,
        itemName: item.name || 'sản phẩm này',
      })
    }
  }
  
  // ✅ Xác nhận xóa sản phẩm
  const confirmDeleteRow = () => {
    const { itemId, itemName } = deleteConfirmDialog
    
    if (itemId === null) return
    
    const updatedItems = items
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, stt: index + 1 })) // Cập nhật lại STT
    
    setItems(updatedItems)
    
    // Đóng dialog
    setDeleteConfirmDialog({ open: false, itemId: null, itemName: '' })
    
    // Hiển thị success message
    const remainingCount = updatedItems.length
    if (remainingCount === 0) {
      setSnackbar({
        open: true,
        message: `✅ Đã xóa "${itemName}". Hóa đơn hiện không còn sản phẩm nào.`,
        severity: 'success',
      })
    } else {
      setSnackbar({
        open: true,
        message: `✅ Đã xóa "${itemName}" khỏi danh sách (Còn lại ${remainingCount} sản phẩm)`,
        severity: 'success',
      })
    }
    
    console.log('🗑️ Deleted item:', itemName, 'Remaining items:', updatedItems.length)
  }
  
  // ✅ Hủy xóa sản phẩm
  const cancelDeleteRow = () => {
    setDeleteConfirmDialog({ open: false, itemId: null, itemName: '' })
  }

  // Tính toán tổng tiền
  const calculateTotals = (currentItems: InvoiceItem[]) => {
    // ✅ Tính theo TỪNG DÒNG sản phẩm
    const subtotalBeforeDiscount = currentItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.priceAfterTax
      return sum + itemTotal
    }, 0)

    // Tính tổng tiền chiết khấu
    const totalDiscount = currentItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0)

    // Tổng tiền sau chiết khấu (CHƯA bao gồm thuế)
    const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscount

    // ✅ Tính thuế GTGT theo TỪNG DÒNG (vì mỗi sản phẩm có thuế suất khác nhau)
    const tax = currentItems.reduce((sum, item) => {
      // Tiền hàng của dòng này sau chiết khấu
      const itemSubtotal = (item.quantity * item.priceAfterTax) - (item.discountAmount || 0)
      // Tiền thuế = Tiền hàng × Thuế suất
      const itemTax = itemSubtotal * ((item.vatRate || 0) / 100)
      return sum + itemTax
    }, 0)
    
    // Tổng tiền thanh toán = subtotalAfterDiscount + thuế
    const total = subtotalAfterDiscount + tax

    return {
      subtotal: Math.round(subtotalAfterDiscount),     // Tổng tiền hàng CHƯA thuế (sau CK)
      discount: Math.round(totalDiscount),             // Chiết khấu
      subtotalAfterDiscount: Math.round(subtotalAfterDiscount), // Sau chiết khấu, chưa thuế
      tax: Math.round(tax),                            // ✅ Tiền thuế VAT (tổng của tất cả dòng)
      total: Math.round(total),                        // Tổng thanh toán (= subtotal + tax)
    }
  }

  // Xử lý cập nhật hàng
  const processRowUpdate = useCallback(
    (newRow: InvoiceItem, oldRow: InvoiceItem) => {
      const updatedRow = { ...newRow }

      // Tự động cập nhật ĐVT và Tính chất khi thay đổi tên hàng hóa
      if (newRow.name !== oldRow.name) {
        // Mock data: mapping tên sản phẩm -> ĐVT và Tính chất
        const productMapping: { [key: string]: { unit: string; type: string } } = {
          'Dịch vụ tư vấn': { unit: 'Giờ', type: 'Dịch vụ' },
          'Phần mềm quản lý': { unit: 'Bộ', type: 'Hàng hóa' },
          'Thiết kế website': { unit: 'Dự án', type: 'Dịch vụ' },
          'Bảo trì hệ thống': { unit: 'Tháng', type: 'Dịch vụ' },
          'Đào tạo nhân viên': { unit: 'Khóa', type: 'Dịch vụ' },
        }
        
        const mapping = productMapping[newRow.name]
        if (mapping) {
          updatedRow.unit = mapping.unit
          updatedRow.type = mapping.type
        }
      }

      // Tính toán chiết khấu và thành tiền
      const baseAmount = newRow.quantity * newRow.priceAfterTax

      // Nếu thay đổi tỷ lệ CK -> tính lại tiền CK
      if (newRow.discountPercent !== oldRow.discountPercent) {
        updatedRow.discountAmount = Math.round((baseAmount * newRow.discountPercent) / 100)
        updatedRow.discountPercent = newRow.discountPercent // Đảm bảo giữ giá trị %
      }
      // Nếu thay đổi tiền CK -> tính lại tỷ lệ CK
      else if (newRow.discountAmount !== oldRow.discountAmount) {
        updatedRow.discountAmount = newRow.discountAmount // Đảm bảo giữ giá trị tiền
        updatedRow.discountPercent = baseAmount > 0 ? Number(((newRow.discountAmount / baseAmount) * 100).toFixed(2)) : 0
      }
      // Nếu thay đổi số lượng hoặc đơn giá -> tính lại tiền CK từ %
      else if (newRow.quantity !== oldRow.quantity || newRow.priceAfterTax !== oldRow.priceAfterTax) {
        updatedRow.discountAmount = Math.round((baseAmount * newRow.discountPercent) / 100)
      }

      // Tính thành tiền sau chiết khấu
      updatedRow.totalAfterTax = baseAmount - updatedRow.discountAmount

      const updatedItems = items.map((item) => (item.id === newRow.id ? updatedRow : item))
      setItems(updatedItems)

      return updatedRow
    },
    [items]
  )

  const totals = calculateTotals(items)

  // ==================== PREVIEW MODAL - DATA MAPPING ====================
  
  /**
   * Map InvoiceItem[] → ProductItem[] cho InvoiceTemplatePreview
   * ✅ Truyền ĐẦY ĐỦ thông tin: VAT rate, discount, VAT amount
   */
  const mapItemsToProducts = (): ProductItem[] => {
    return items
      .filter(item => item.name && item.name.trim() !== '') // Chỉ lấy dòng có tên sản phẩm
      .map((item, index) => {
        // Tính VAT amount cho item này
        const itemSubtotal = item.totalAfterTax // Thành tiền sau CK, chưa VAT
        const itemVatRate = item.vatRate || 0
        const itemVatAmount = Math.round(itemSubtotal * (itemVatRate / 100))

        return {
          stt: index + 1,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.priceAfterTax, // Đơn giá chưa VAT
          discountAmount: item.discountAmount, // Tiền chiết khấu
          total: itemSubtotal, // Thành tiền sau CK, chưa VAT
          vatRate: itemVatRate, // Thuế suất GTGT
          vatAmount: itemVatAmount, // Tiền thuế GTGT
        }
      })
  }

  /**
   * Map buyer info → CustomerInfo cho InvoiceTemplatePreview
   * ✅ LUÔN return object để preview hiển thị đầy đủ template
   */
  const mapBuyerToCustomerInfo = (): CustomerInfo => {
    return {
      name: buyerCompanyName || '', // Để trống nếu chưa nhập
      email: buyerEmail || '',
      taxCode: buyerTaxCode || '',
      address: buyerAddress || '',
      phone: buyerPhone || '',
      buyerName: buyerName || '', // Họ tên người mua
    }
  }

  /**
   * Map template + company → TemplateConfigProps
   */
  const mapTemplateToConfig = (): TemplateConfigProps | null => {
    if (!selectedTemplate || !company) return null

    return {
      companyLogo: company.logoUrl || null, // ✅ Use logo from Company API
      companyName: company.companyName,
      companyTaxCode: company.taxCode,
      companyAddress: company.address,
      companyPhone: company.contactPhone,
    }
  }

  // ==================== HANDLERS ====================

  // Hàm lấy user ID từ token (cần implement)
  // Hàm submit hóa đơn
  // ⭐ Handler chung để xử lý submit
  const handleSubmitInvoice = async (invoiceStatusID: number, statusLabel: string) => {
    try {
      // ========== VALIDATION ==========
      
      // 0. Validate replacement reason (if in replacement mode)
      if (isReplacementMode && !replacementReason.trim()) {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng nhập lý do thay thế hóa đơn',
          severity: 'warning'
        })
        return
      }
      
      // ✅ BỎ VALIDATION: Template và thông tin người mua
      // - Template: User có thể đổi mẫu hóa đơn nếu muốn
      // - Thông tin người mua: Đã copy từ hóa đơn gốc, user có thể sửa nếu sai

      // ✅ CHO PHÉP HÓA ĐƠN KHÔNG CÓ SẢN PHẨM
      // - Hóa đơn thậy thế có thể không có sản phẩm (ví dụ: hủy toàn bộ)
      // - Nếu có items, validate đầy đủ thông tin
      if (items.length > 0) {
        // Validate từng item có đầy đủ thông tin
        const invalidItems = items.filter(item => 
          !item.name || 
          !item.unit || 
          item.quantity <= 0 || 
          item.priceAfterTax <= 0
        )

        if (invalidItems.length > 0) {
          setSnackbar({
            open: true,
            message: `⚠️ Có ${invalidItems.length} sản phẩm chưa điền đầy đủ thông tin (Tên, Đơn vị, Số lượng, Đơn giá)`,
            severity: 'warning'
          })
          return
        }
      }

      // 4. Validate totals - chỉ khi có sản phẩm - chỉ khi có sản phẩm
      if (items.length > 0 && totals.total <= 0) {
        setSnackbar({
          open: true,
          message: '⚠️ Tổng tiền phải lớn hơn 0',
          severity: 'warning'
        })
        return
      }
      
      // ✅ BỎ VALIDATION: Payment method theo số tiền
      // - Hình thức thanh toán là string từ hóa đơn gốc, không cần validate
      // - User có thể đổi nếu cần thiết

      // ========== SUBMIT ==========
      
      setIsSubmitting(true)

      // Map frontend state sang backend request
      // ✅ Lấy userId từ token cho performedBy
      const currentUserId = getUserIdFromToken() || 0;
      console.log('👤 Current userId from token:', currentUserId);
      
      const backendRequest = mapToBackendInvoiceRequest(
        selectedTemplate?.templateID || 0,
        {
          customerID: buyerCustomerID, // ✅ Truyền customer ID
          taxCode: buyerTaxCode,
          companyName: buyerCompanyName,
          address: buyerAddress,
          buyerName: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
        },
        items,
        totals,
        paymentMethod, // Hình thức thanh toán từ dropdown
        5,              // minRows
        invoiceStatusID, // ⭐ Status: 1=Nháp, 6=Chờ duyệt
        invoiceNotes,   // Ghi chú hóa đơn
        currentUserId,  // ✅ performedBy = userId từ token
        undefined,      // ✅ salesID không truyền (tạo thay thế không có salesID)
        null,           // ✅ requestID = null (không link với request)
        invoiceType     // ✅ invoiceType: Dynamic load từ hóa đơn gốc (B2B=2, B2C=1)
      )

      console.log(`📤 Sending invoice request (${statusLabel}):`, backendRequest)
      
      // ✅ Validate payload trước khi gửi
      console.log('🔍 Payload validation:')
      console.log('  - templateID:', backendRequest.templateID, typeof backendRequest.templateID)
      console.log('  - customerID:', backendRequest.customerID, typeof backendRequest.customerID)
      console.log('  - invoiceStatusID:', backendRequest.invoiceStatusID, typeof backendRequest.invoiceStatusID)
      console.log('  - companyID:', backendRequest.companyID, typeof backendRequest.companyID)
      console.log('  - items count:', backendRequest.items?.length)
      console.log('  - amount:', backendRequest.amount, typeof backendRequest.amount)
      console.log('  - taxAmount:', backendRequest.taxAmount, typeof backendRequest.taxAmount)
      console.log('  - totalAmount:', backendRequest.totalAmount, typeof backendRequest.totalAmount)
      console.log('  - paymentMethod:', backendRequest.paymentMethod)
      console.log('  - performedBy:', backendRequest.performedBy, typeof backendRequest.performedBy)
      console.log('  - salesID:', backendRequest.salesID, typeof backendRequest.salesID)
      console.log('  - requestID:', backendRequest.requestID, typeof backendRequest.requestID)
      
      // Validate items
      backendRequest.items.forEach((item, idx) => {
        console.log(`  - Item ${idx + 1}:`, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          amount: item.amount,
          vatAmount: item.vatAmount
        })
      })

      // ✅ Gọi API: replacement, update hoặc create tùy theo mode
      let response
      if (isReplacementMode && originalInvoiceId) {
        // ⭐ Replacement mode: call createReplacementInvoice
        console.log(`🔄 Creating REPLACEMENT invoice for original ID: ${originalInvoiceId}`)
        console.log(`📝 Replacement reason: ${replacementReason}`)
        response = await invoiceService.createReplacementInvoice(
          originalInvoiceId,
          replacementReason,
          backendRequest
        )
      } else if (editMode && editInvoiceId) {
        // Edit mode: call updateInvoice
        console.log(`🔄 Updating invoice ID: ${editInvoiceId}`)
        response = await invoiceService.updateInvoice(parseInt(editInvoiceId), backendRequest)
      } else {
        // Create mode: call createInvoice
        response = await invoiceService.createInvoice(backendRequest)
      }

      console.log('✅ Invoice saved:', response)

      // ⭐ Hiển thị thông báo chi tiết
      const successMessage = isReplacementMode
        ? `✅ Tạo hóa đơn thay thế thành công! (ID: ${response.invoiceID})\n💡 Hóa đơn gốc sẽ tự động bị hủy khi hóa đơn thay thế được phát hành.`
        : editMode
        ? `✅ Cập nhật hóa đơn thành công! (ID: ${response.invoiceID})`
        : invoiceStatusID === 1
        ? `✅ Lưu hóa đơn nháp thành công! (ID: ${response.invoiceID})\n💡 Số hóa đơn sẽ được cấp sau khi ký số tại trang danh sách hóa đơn.`
        : `✅ Gửi hóa đơn chờ duyệt thành công! (ID: ${response.invoiceID})\n📋 Hóa đơn đang chờ phê duyệt từ quản lý.`

      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      })

      // ⭐ Navigate dựa trên role: HOD → /approval/invoices, Others → /invoices
      setTimeout(() => {
        if (user?.role === USER_ROLES.HOD) {
          // KẾ TOÁN TRƯởNG: Chuyển về trang Duyệt hóa đơn
          console.log('🎯 HOD: Redirecting to /approval/invoices (Replacement)')
          navigate('/approval/invoices')
        } else {
          // KẾ TOÁN & OTHERS: Chuyển về trang Danh sách hóa đơn
          console.log('🎯 Accountant/Others: Redirecting to /invoices (Replacement)')
          navigate('/invoices')
        }
      }, 1500)

    } catch (error: unknown) {
      console.error('❌ Error creating invoice:', error)
      
      // Parse error message từ nhiều nguồn
      let errorMessage = 'Lỗi khi tạo hóa đơn'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Kiểm tra response error từ API
      const apiError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      
      if (apiError.response?.data) {
        // Nếu có message cụ thể từ backend
        if (apiError.response.data.message) {
          errorMessage = apiError.response.data.message
        }
        
        // Nếu có validation errors từ backend
        if (apiError.response.data.errors) {
          const validationErrors = Object.entries(apiError.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n')
          errorMessage = `Validation errors:\n${validationErrors}`
        }
        
        // Log chi tiết để debug
        console.error('🔍 API Error Details:', {
          status: apiError.response,
          data: apiError.response.data,
          fullError: error
        })
      }
      
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== ROLE-BASED SUBMIT FUNCTIONS ====================
  
  /**
   * ⭐ KẾ TOÁN: Lưu hóa đơn thay thế dưới dạng nháp
   * Status: 1 (DRAFT - Nháp)
   * 
   * Flow: Kế toán tạo nháp → Sau đó từ danh sách "Gửi duyệt" riêng
   */
  const handleSaveDraft = async () => {
    await handleSubmitInvoice(1, 'Lưu hóa đơn thay thế nháp')
  }

  /**
   * ⭐ KẾ TOÁN: Gửi hóa đơn thay thế cho kế toán trưởng duyệt
   * Status: 6 (PENDING_APPROVAL - Chờ duyệt)
   * 
   * Flow: Kế toán tạo → Gửi cho KTT → KTT duyệt → Chờ ký
   */
  const handleSubmitForApproval = async () => {
    await handleSubmitInvoice(6, 'Gửi hóa đơn thay thế chờ duyệt')
  }

  /**
   * ⭐ KẾ TOÁN TRƯỞNG: Tạo hóa đơn thay thế với trạng thái chờ ký
   * Status: 7 (PENDING_SIGN - Chờ ký)
   * 
   * Flow: KTT tạo → Chờ ký → Ký số → Gửi CQT
   * Lưu ý: KTT không cần gửi duyệt vì tự duyệt
   */
  const handleCreateInvoiceHOD = async () => {
    await handleSubmitInvoice(7, 'Tạo hóa đơn thay thế chờ ký')
  }

  // ==================== OTHER HANDLERS ====================

  // ⭐ Xử lý hủy bỏ - Hiển thị dialog xác nhận
  const handleCancelClick = () => {
    setCancelDialog(true)
  }

  // ⭐ Xác nhận hủy bỏ - Navigate back
  const handleConfirmCancel = () => {
    setCancelDialog(false)
    // Navigate back to invoice list or previous page
    if (isReplacementMode) {
      // Nếu đang tạo hóa đơn thay thế, quay lại trang chi tiết hóa đơn gốc
      navigate(`/invoices/${originalInvoiceId}`)
    } else {
      // Nếu đang edit hoặc tạo mới, quay lại danh sách
      navigate(-1)
    }
  }

  // ⭐ Hủy dialog xác nhận
  const handleCancelDialogClose = () => {
    setCancelDialog(false)
  }

  // Đóng snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleSendDraftEmail = (emailData: {
    recipientName: string
    email: string
    ccEmails: string[]
    bccEmails: string[]
    attachments: File[]
    includeXml: boolean
    disableSms: boolean
    language: string
  }) => {
    const invoiceSnapshot = {
      totals,
      itemsCount: items.length,
    }

    console.log('Gửi hóa đơn nháp cho khách hàng', { emailData, invoiceSnapshot })
    // TODO: Thay thế bằng API gửi email hóa đơn nháp
  }

  // Định nghĩa columns cho DataGrid
  const columns: GridColDef[] = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 60,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value}</Typography>
        </Box>
      ),
    },
    ...(showTypeColumn
      ? [
          {
            field: 'type',
            headerName: 'Tính chất HHDV',
            width: 200,
            editable: false,
            align: 'center' as const,
            headerAlign: 'center' as const,
            renderCell: (params: GridRenderCellParams) => (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%', height: '100%' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#666' }}>{params.value || ''}</Typography>
              </Box>
            ),
          },
        ]
      : []),
    {
      field: 'code',
      headerName: 'Mã hàng',
       width: 160 ,
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderEditCell: (params) => <ProductCodeEditCell {...params} products={products} onProductSelect={handleProductSelect} />,
    },
    {
      field: 'name',
      headerName: 'Tên hàng hóa/Dịch vụ',
      ...(discountType !== 'none' ? { width: 250 } : { flex: 1.5, minWidth: 200 }),
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
        </Box>
      ),
      renderEditCell: (params) => <ProductNameEditCell {...params} products={products} onProductSelect={handleProductSelect} />,
    },
    {
      field: 'unit',
      headerName: 'ĐVT',
      width: 100 ,
      editable: false,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Số lượng',
      width: 80,
      type: 'number',
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || 0}</Typography>
        </Box>
      ),
      renderEditCell: (params) => <QuantityEditCell {...params} />,
    },
    {
      field: 'priceAfterTax',
      headerName: calculateAfterTax ? 'Đơn giá ' : 'Đơn giá',
      width: 170,
      type: 'number',
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {params.value ? Number(params.value).toLocaleString('vi-VN') : '0'}
          </Typography>
        </Box>
      ),
      renderEditCell: (params) => <PriceEditCell {...params} />,
    },
    {
      field: 'vatRate',
      headerName: 'Thuế suất (%)',
      width: 100,
      type: 'number' as const,
      editable: false, // Không cho chỉnh sửa thủ công, lấy từ sản phẩm
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: params.value > 0 ? '#1976d2' : 'text.secondary' }}>
            {params.value || 0}%
          </Typography>
        </Box>
      ),
    },
    ...(discountType === 'per-item' || discountType === 'total'
      ? [
          {
            field: 'discountPercent',
            headerName: 'Tỷ lệ CK (%)',
            width: 100,
            type: 'number' as const,
            editable: true,
            align: 'center' as const,
            headerAlign: 'center' as const,
            renderCell: (params: GridRenderCellParams) => (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  {params.value ? Number(params.value).toFixed(2).replace('.', ',') : '0,00'}
                </Typography>
              </Box>
            ),
            renderEditCell: (params: GridRenderEditCellParams) => <DiscountPercentEditCell {...params} />,
          },
          {
            field: 'discountAmount',
            headerName: 'Tiền CK',
            width: 150,
            type: 'number' as const,
            editable: true,
            align: 'center' as const,
            headerAlign: 'center' as const,
            renderCell: (params: GridRenderCellParams) => (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  {params.value ? Number(params.value).toLocaleString('vi-VN') : '0'}
                </Typography>
              </Box>
            ),
            renderEditCell: (params: GridRenderEditCellParams) => <DiscountAmountEditCell {...params} />,
          },
        ]
      : []),
    {
      field: 'totalAfterTax',
      headerName: calculateAfterTax ? 'Thành tiền ' : 'Thành tiền',
      width: 170, 
      minWidth: 170,
      type: 'number',
      editable: false,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {params.value ? Number(params.value).toLocaleString('vi-VN') : '0'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => {
        const isLastItem = items.length === 1
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Tooltip 
              title={isLastItem ? 'Xóa sản phẩm cuối cùng (hóa đơn sẽ trống)' : 'Xóa sản phẩm này'}
              placement="left"
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteRow(params.row.id)}
                  sx={{
                    padding: '4px',
                    color: isLastItem ? '#ff9800' : '#d32f2f', // Vàng nếu là item cuối
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: isLastItem ? '#fff3e0' : '#ffebee',
                      color: isLastItem ? '#f57c00' : '#c62828',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <DeleteOutline sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )
      },
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header NGOÀI Paper */}
      <Box sx={{ px: 2, py: 1.5, maxWidth: '1600px', margin: '0 auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {isReplacementMode ? '🔄 Tạo hóa đơn thay thế' : editMode ? '✏️ Chỉnh sửa hóa đơn' : 'Lập hóa đơn'}
          </Typography>
        </Stack>
      </Box>

      {/* ==================== HEADER HÓA ĐƠN THAY THẾ ==================== */}
      {isReplacementMode && originalInvoice && (
        <Box sx={{ px: 2, pb: 2, maxWidth: '1600px', margin: '0 auto' }}>
          <Alert 
            severity="warning"
            icon={<WarningAmberIcon />}
            sx={{ 
              mb: 0,
              border: '1px solid #ff9800',
              backgroundColor: '#fff8e1',
              '& .MuiAlert-message': {
                width: '100%',
              }
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100' }}>
                Tạo Hóa đơn Thay thế
              </Typography>
              <Typography variant="body2" sx={{ color: '#5d4037' }}>
                Đang tạo hóa đơn thay thế cho <strong>Hóa đơn gốc số: {originalInvoice.invoiceNumber || '#N/A'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#5d4037' }}>
                Phát hành ngày: <strong>{originalInvoice.signDate ? new Date(originalInvoice.signDate).toLocaleDateString('vi-VN') : 'N/A'}</strong> • Vui lòng kiểm tra và nhập lại toàn bộ thông tin đúng.
              </Typography>
              
              {/* ✅ Input Lý do thay thế */}
              <Box sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Lý do thay thế (Bắt buộc)"
                  placeholder="Ví dụ: Sai thông tin khách hàng, sai số tiền, sai sản phẩm..."
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  required
                  error={!replacementReason}
                  helperText={!replacementReason ? 'Vui lòng nhập lý do thay thế hóa đơn' : ''}
                  sx={{
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                    }
                  }}
                />
              </Box>
              
              <Divider sx={{ my: 0.5, borderColor: '#ffcc80' }} />
             
              <Typography variant="caption" sx={{ color: '#bf360c', display: 'block', mt: 0.5 }}>
                Sau khi thay thế, hóa đơn gốc sẽ không thể chỉnh sửa, ký, hoặc gửi CQT nữa.
              </Typography>
            </Stack>
          </Alert>
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ px: 2, pt: 0, maxWidth: '1600px', margin: '0 auto' }}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 1, overflow: 'visible' }}>
          {/* Hướng dẫn lập hóa đơn và Ký hiệu số hoá đơn */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {/* Nút hướng dẫn bên trái */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<HelpOutline />}
              sx={{ textTransform: 'none', borderColor: '#1976d2', color: '#1976d2', fontSize: '0.8125rem' }}>
              Hướng dẫn lập hóa đơn
            </Button>

            {/* Ký hiệu số hoá đơn bên phải */}
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 1.5,
                backgroundColor: '#fafafa',
                minWidth: 300,
                maxWidth: 350,
              }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 55, fontSize: '0.8125rem' }}>
                    Ký hiệu:
                  </Typography>
                  <Select 
                    size="small" 
                    value={selectedTemplate?.serial || ''} 
                    onChange={(e) => {
                      const template = templates.find(t => t.serial === e.target.value)
                      setSelectedTemplate(template || null)
                    }}
                    fullWidth 
                    variant="outlined" 
                    sx={{ fontSize: '0.8125rem' }}
                    disabled={templatesLoading || templates.length === 0}
                  >
                    {templatesLoading ? (
                      <MenuItem value="">Đang tải...</MenuItem>
                    ) : templates.length === 0 ? (
                      <MenuItem value="">Không có mẫu</MenuItem>
                    ) : (
                      templates.map((template) => (
                        <MenuItem key={template.templateID} value={template.serial}>
                          {template.serial}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <IconButton size="small">
                    <ExpandMore fontSize="small" />
                  </IconButton>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 55, fontSize: '0.8125rem' }}>
                    Số:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value="<Chưa cấp số>"
                    placeholder="<Chưa cấp số>"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.8125rem',
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#999',
                        fontStyle: 'italic',
                        cursor: 'not-allowed',
                      },
                      '& .MuiOutlinedInput-root.Mui-disabled': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip 
                            title={
                              <Box sx={{ p: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  📋 Quy trình cấp số hóa đơn:
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.3 }}>
                                  • Hóa đơn nháp: Chưa có số
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.3 }}>
                                  • Sau khi ký số: Tự động cấp số
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', color: '#ffa726' }}>
                                  ⚠️ Số hóa đơn do hệ thống cấp, không thể chỉnh sửa
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                            enterDelay={300}
                          >
                            <Info fontSize="small" sx={{ color: '#1976d2', cursor: 'help' }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Layout 2 cột: Thông tin bán/mua */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {/* Cột TRÁI - Thông tin đầy đủ */}
            <Box sx={{ flex: '1 1 100%', minWidth: '500px' }}>
              {/* Tiêu đề hóa đơn */}
              <Typography
                variant="h6"
                align="center"
                sx={{ fontWeight: 700, color: '#d32f2f', mb: 0.5, letterSpacing: 0.5, fontSize: '1.1rem' }}>
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG
              </Typography>
              <Typography variant="caption" align="center" sx={{ mb: 1.5, color: '#666', display: 'block' }}>
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </Typography>

              {/* Thông tin đơn vị bán hàng */}
              <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Đơn vị bán hàng:
                  </Typography>
                  <TextField 
                    size="small" 
                    fullWidth 
                    disabled 
                    value={company?.companyName || 'Đang tải...'} 
                    variant="standard" 
                    sx={{ fontSize: '0.8125rem' }} 
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Mã số thuế:
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {(company?.taxCode || '0000000000').split('').map((digit, index) => (
                      <TextField
                        key={index}
                        size="small"
                        disabled
                        value={digit}
                        variant="outlined"
                        sx={{
                          width: 32,
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
                            padding: '6px 0',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Địa chỉ:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={company?.address || 'Đang tải...'}
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Điện thoại:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={company?.contactPhone || 'Đang tải...'}
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Số tài khoản:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={company ? `${company.accountNumber} - ${company.bankName}` : 'Đang tải...'}
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {/* ✅ Dropdown chọn loại hóa đơn - READ-ONLY (load từ hóa đơn gốc) */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem', color: '#666' }}>
                  Loại hóa đơn:
                </Typography>
                <Select
                  size="small"
                  value={invoiceType}
                  disabled // ✅ DISABLED: Loại hóa đơn xác định từ hóa đơn gốc, không cho đổi
                  variant="outlined"
                  sx={{
                    minWidth: 280,
                    fontSize: '0.8125rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ddd',
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#666' // ✅ Màu text khi disabled
                    }
                  }}
                >
                  <MenuItem value="B2B" sx={{ fontSize: '0.8125rem', py: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box component="span" sx={{ fontSize: '1rem' }}>🏢</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          Hóa đơn B2B
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                          Bán cho doanh nghiệp (bắt buộc có Tên đơn vị)
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="B2C" sx={{ fontSize: '0.8125rem', py: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box component="span" sx={{ fontSize: '1rem' }}>👤</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          Hóa đơn B2C
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                          Bán lẻ cá nhân (bắt buộc có Người mua hàng)
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                </Select>
                <Chip label="Từ hóa đơn gốc" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                <Tooltip 
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        💡 Loại hóa đơn từ hóa đơn gốc:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', mb: 0.3 }}>
                        • <strong>B2B:</strong> Bán cho doanh nghiệp (bắt buộc có Tên đơn vị)
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', mb: 0.3 }}>
                        • <strong>B2C:</strong> Bán lẻ cho cá nhân (bắt buộc có Người mua hàng)
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', color: '#ffa726', mt: 0.5 }}>
                        ⚠️ Loại hóa đơn thay thế PHẢI GIỐNG hóa đơn gốc
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="right"
                >
                  <Info sx={{ fontSize: 18, color: '#1976d2', cursor: 'help' }} />
                </Tooltip>
              </Stack>

              {/* Thông tin người mua */}
              <Stack spacing={0.8}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    {invoiceType === 'B2B' ? 'Mã Số Thuế:' : 'CCCD:'}
                  </Typography>
                  <TextField
                    size="small"
                    placeholder={invoiceType === 'B2B' ? '0101243150 (10 số) hoặc 0101243150136 (13 số)' : '001234567890 (12 số)'}
                    variant="standard"
                    value={buyerTaxCode}
                    onChange={(e) => handleTaxCodeChange(e.target.value)}
                    onBlur={handleTaxCodeBlur}
                    sx={{ width: 160, fontSize: '0.8125rem' }}
                    error={customerNotFound}
                    helperText={customerNotFound ? 'Không tìm thấy' : ''}
                    InputProps={{
                      endAdornment: isSearchingCustomer ? (
                        <InputAdornment position="end">
                          <CircularProgress size={16} />
                        </InputAdornment>
                      ) : (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <ExpandMore fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button 
                    size="small" 
                    startIcon={<Public sx={{ fontSize: 16 }} />} 
                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25 }}
                    onClick={() => handleTaxCodeLookup(buyerTaxCode)}
                    disabled={!buyerTaxCode || isSearchingCustomer}
                  >
                    {isSearchingCustomer ? 'Đang tìm...' : 'Lấy thông tin'}
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<VerifiedUser sx={{ fontSize: 16 }} />} 
                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, whiteSpace: 'nowrap' }}
                  >
                    KT tình trạng hoạt động
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    {invoiceType === 'B2B' ? 'Tên đơn vị:' : 'Tên Khách Hàng:'}
                  </Typography>
                  <Autocomplete
                    freeSolo
                    size="small"
                    fullWidth
                    options={customerSuggestions}
                    getOptionLabel={(option: Customer | string) => 
                      typeof option === 'string' ? option : option.customerName
                    }
                    renderOption={(props, option: Customer) => (
                      <li {...props} key={option.customerID}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            MST: {option.taxCode} - {option.address}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    inputValue={buyerCompanyName}
                    onInputChange={(_e, value) => {
                      setBuyerCompanyName(value)
                      setCustomerNotFound(false)
                    }}
                    onChange={(_e, value) => {
                      if (typeof value === 'object' && value !== null) {
                        handleCustomerSelect(value)
                      }
                    }}
                    loading={isLoadingSuggestions}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={invoiceType === 'B2B' ? 'CÔNG TY CỔ PHẦN MISA' : 'Nguyễn Văn A'}
                        variant="standard"
                        sx={{ fontSize: '0.8125rem' }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingSuggestions ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Địa chỉ:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Tầng 9, tòa nhà Technosoft..."
                    variant="standard"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    sx={{ fontSize: '0.8125rem' }}
                  />
                </Stack>

                {/* ✅ Chỉ hiện field "Người mua hàng" khi ở chế độ B2B */}
                {invoiceType === 'B2B' && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                      Người mua hàng:
                    </Typography>
                    <TextField 
                      size="small" 
                      placeholder="Kế toán A" 
                      variant="standard" 
                      value={buyerName} 
                      onChange={(e) => setBuyerName(e.target.value)} 
                      sx={{ width: 160, fontSize: '0.8125rem' }} 
                    />
                    <Typography variant="caption" sx={{ minWidth: 50, fontSize: '0.8125rem' }}>
                      Email:
                    </Typography>
                    <TextField 
                      size="small" 
                      placeholder="hoadon@gmail.com" 
                      variant="standard" 
                      value={buyerEmail} 
                      onChange={(e) => setBuyerEmail(e.target.value)} 
                      sx={{ flex: 1, fontSize: '0.8125rem' }} 
                    />
                  </Stack>
                )}

                {/* ✅ Khi B2C thì hiện Email ở dòng riêng */}
                {invoiceType === 'B2C' && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                      Email:
                    </Typography>
                    <TextField 
                      size="small" 
                      placeholder="hoadon@gmail.com" 
                      variant="standard" 
                      value={buyerEmail} 
                      onChange={(e) => setBuyerEmail(e.target.value)} 
                      sx={{ flex: 1, fontSize: '0.8125rem' }} 
                    />
                  </Stack>
                )}

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Số điện thoại:
                  </Typography>
                  <TextField 
                    size="small" 
                    variant="standard" 
                    value={buyerPhone} 
                    onChange={(e) => setBuyerPhone(e.target.value)} 
                    sx={{ width: 160, fontSize: '0.8125rem' }} 
                  />
                  <Typography variant="caption" sx={{ minWidth: 80, fontSize: '0.8125rem' }}>
                    Hình thức TT:
                  </Typography>
                  <Select
                    size="small"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    variant="standard"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 0.5,
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                          border: '1.5px solid #1976d2',
                          borderRadius: 1.5,
                          '& .MuiList-root': {
                            padding: '4px',
                          },
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                    }}
                    sx={{
                      width: 180,
                      fontSize: '0.8125rem',
                      transition: 'all 0.3s ease',
                      '& .MuiSelect-select': {
                        transition: 'all 0.3s ease',
                      },
                      '&:before': {
                        borderBottomColor: '#e0e0e0',
                        transition: 'border-color 0.3s ease',
                      },
                      '&:hover:before': {
                        borderBottomColor: '#1976d2 !important',
                      },
                      '&:after': {
                        borderBottomColor: '#1976d2',
                        borderBottomWidth: '2px',
                      },
                      '&.Mui-focused': {
                        '& .MuiSelect-select': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        },
                      },
                    }}>
                    <MenuItem
                      value="Tiền mặt/Chuyển khoản"
                      sx={{
                        fontSize: '0.8125rem',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#bbdefb',
                          '&:hover': {
                            backgroundColor: '#90caf9',
                          },
                        },
                      }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        Tiền mặt/Chuyển khoản
                      </Typography>
                    </MenuItem>
                    <MenuItem
                      value="Chuyển khoản"
                      sx={{
                        fontSize: '0.8125rem',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#bbdefb',
                          '&:hover': {
                            backgroundColor: '#90caf9',
                          },
                        },
                      }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        Chuyển khoản
                      </Typography>
                    </MenuItem>
                    <MenuItem
                      value="Tiền mặt"
                      sx={{
                        fontSize: '0.8125rem',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#bbdefb',
                          '&:hover': {
                            backgroundColor: '#90caf9',
                          },
                        },
                      }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        Tiền mặt
                      </Typography>
                    </MenuItem>
                    <MenuItem
                      value="Đối trừ công nợ"
                      sx={{
                        fontSize: '0.8125rem',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#bbdefb',
                          '&:hover': {
                            backgroundColor: '#90caf9',
                          },
                        },
                      }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        Đối trừ công nợ
                      </Typography>
                    </MenuItem>
                  </Select>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Checkbox options + Loại tiền, Tỷ giá, Chiết khấu */}
          <Stack spacing={1} sx={{ mb: 1.5 }}>
            {/* Dòng 0: Hàng hóa/Dịch vụ */}
            <Typography variant="caption" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Hàng hóa/Dịch vụ
            </Typography>

            {/* Dòng 1: Hiện cột + Loại tiền + Chiết khấu */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={showTypeColumn} onChange={(e) => setShowTypeColumn(e.target.checked)} size="small" />
                }
                label='Hiện cột "Tính chất HHDV"'
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
              />

              {/* Spacer để đẩy các trường sang phải */}
              <Box sx={{ flex: 1, minWidth: 20 }} />

              {/* Loại tiền - Chỉ hiển thị VNĐ (hóa đơn VAT Việt Nam) */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Loại tiền:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1976d2' }}>
                  VNĐ
                </Typography>
              </Stack>

              {/* Chiết khấu */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Chiết khấu:
                </Typography>
                <Select 
                  size="small" 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)}
                  variant="standard"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 0.5,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                        border: '1.5px solid #1976d2',
                        borderRadius: 1.5,
                        '& .MuiList-root': {
                          padding: '4px',
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                  sx={{ 
                    width: 210, 
                    fontSize: '0.8125rem',
                    transition: 'all 0.3s ease',
                    '& .MuiSelect-select': {
                      transition: 'all 0.3s ease',
                    },
                    '&:before': {
                      borderBottomColor: '#e0e0e0',
                      transition: 'border-color 0.3s ease',
                    },
                    '&:hover:before': {
                      borderBottomColor: '#1976d2 !important',
                    },
                    '&:after': {
                      borderBottomColor: '#1976d2',
                      borderBottomWidth: '2px',
                    },
                    '&.Mui-focused': {
                      '& .MuiSelect-select': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      },
                    },
                  }}
                >
                  <MenuItem value="none">Không có chiết khấu</MenuItem>
                  <MenuItem value="per-item">Theo mặt hàng</MenuItem>
                  <MenuItem value="total">Theo tổng giá trị đơn hàng</MenuItem>
                </Select>
              </Stack>
            </Stack>


             
          </Stack>

          {/* DataGrid với Box wrapper để có scroll ngang */}
          <Box
            sx={{
              width: '100%',
              overflowX: 'auto', // Scroll ngang khi nội dung tràn
              mb: 1.5,
            }}
          >
            <DataGrid
              rows={items}
              columns={columns}
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={(error) => console.error(error)}
              hideFooter
              disableRowSelectionOnClick
              disableColumnResize
              disableColumnMenu
              autoHeight
              getRowHeight={() => 40}
              columnHeaderHeight={40}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                minWidth: 'max-content', // Cho phép bảng rộng hơn container
                '& .MuiDataGrid-cell': {
                  fontSize: '0.8125rem',
                  borderRight: '1px solid #f0f0f0',
                  borderBottom: '1px solid #f0f0f0',
                  padding: '6px 4px',
                  height: '40px !important',
                  lineHeight: '28px !important',
                },
                '& .MuiDataGrid-cell--editing': {
                  padding: '0 !important',
                  borderLeft: 'none !important',
                  borderTop: 'none !important',
                  borderRight: '1px solid #f0f0f0 !important',
                  borderBottom: '1px solid #f0f0f0 !important',
                  backgroundColor: 'transparent !important',
                  boxShadow: 'none !important',
                  outline: 'none !important',
                  display: 'flex !important',
                  alignItems: 'center !important',
                  justifyContent: 'center !important',
                  height: '40px !important',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #e0e0e0',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  minHeight: '40px !important',
                  maxHeight: '40px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '1px solid #e0e0e0',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none !important',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none !important',
                },
                '& .MuiDataGrid-cell.MuiDataGrid-cell--editing:focus': {
                  outline: 'none !important',
                  borderLeft: 'none !important',
                  borderTop: 'none !important',
                  borderRight: '1px solid #f0f0f0 !important',
                  borderBottom: '1px solid #f0f0f0 !important',
                },
                '& .MuiDataGrid-cell.MuiDataGrid-cell--editing:focus-within': {
                  outline: 'none !important',
                  borderLeft: 'none !important',
                  borderTop: 'none !important',
                  borderRight: '1px solid #f0f0f0 !important',
                  borderBottom: '1px solid #f0f0f0 !important',
                },
                '& .MuiDataGrid-row': {
                  minHeight: '40px !important',
                  maxHeight: '40px !important',
                  height: '40px !important',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#fafafa',
                },
                '& .MuiDataGrid-row--editing': {
                  backgroundColor: 'transparent !important',
                  boxShadow: 'none !important',
                  height: '40px !important',
                  position: 'relative',
                },
                // Ẩn scrollbar của DataGrid vì đã có scrollbar của Box
                '& .MuiDataGrid-scrollbar': {
                  display: 'none !important',
                },
                '& .MuiDataGrid-filler': {
                  display: 'none !important',
                },
                '& .MuiDataGrid-footerContainer': {
                  display: 'none !important',
                },
              }}
            />
          </Box>

          {/* Buttons dưới bảng */}
          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'stretch' }}>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: 0.5,
                width: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}>
              <Typography variant="caption" sx={{ fontSize: '1rem', color: '#666', lineHeight: 1 }}>
                ⋮
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                borderColor: '#ccc',
                fontSize: '0.8125rem',
                py: 0.5,
              }}
              onClick={handleAddRow}>
              Thêm dòng
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowInvoiceNotes(!showInvoiceNotes)}
              startIcon={showInvoiceNotes ? <i className="ri-subtract-line" /> : <i className="ri-add-line" />}
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                fontSize: '0.8125rem',
                py: 0.25,
                px: 1,
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' }
              }}>
              {showInvoiceNotes ? 'Ẩn ghi chú' : 'Thêm ghi chú'}
            </Button>
          </Stack>

          {/* Ô nhập ghi chú hóa đơn - Tối ưu UI */}
          {showInvoiceNotes && (
            <Box sx={{ mb: 1.5, pl: 6 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="(Ghi chú: Nhập nội dung ghi chú cho hóa đơn...)"
                variant="standard"
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '0.75rem',
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    '&:before': { borderBottom: '1px dashed #e0e0e0' },
                    '&:hover:before': { borderBottom: '1px dashed #999' },
                  },
                  '& .MuiInputBase-input': {
                    padding: '4px 0',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontStyle: 'italic',
                    opacity: 0.6,
                  }
                }}
              />
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Tổng tiền - Bố cục như hình */}
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Box sx={{ width: 450 }}>
              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Tổng tiền hàng:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                    {totals.subtotal.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                {/* Dòng chiết khấu - chỉ hiện khi có chiết khấu */}
                {discountType !== 'none' && totals.discount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Chiết khấu:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8125rem', color: '#d32f2f' }}>
                      -{totals.discount.toLocaleString('vi-VN')}
                    </Typography>
                  </Stack>
                )}

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Tiền thuế GTGT:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                    {totals.tax.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Tổng tiền thanh toán:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    {totals.total.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                {/* Số tiền viết bằng chữ */}
                <Stack direction="row" sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#666' }}>
                    Số tiền viết bằng chữ: <strong>{totals.total > 0 ? numberToWords(totals.total) : ''}</strong>
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Footer Actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {/* Buttons trái */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => setPreviewModalOpen(true)}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Xem trước
              </Button>
            </Stack>

            {/* Buttons phải - Role-based */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Close fontSize="small" />}
                onClick={handleCancelClick}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Hủy bỏ
              </Button>
              
              {/* ⭐ ROLE-BASED BUTTONS */}
              {user?.role === USER_ROLES.HOD ? (
                // KẾ TOÁN TRƯỞNG: Tạo hóa đơn thay thế (Chờ ký)
                <Button
                  size="small"
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save fontSize="small" />}
                  onClick={handleCreateInvoiceHOD}
                  disabled={isSubmitting || !originalInvoice}
                  sx={{ 
                    textTransform: 'none', 
                    backgroundColor: '#f57c00', 
                    fontSize: '0.8125rem', 
                    py: 0.5,
                    minWidth: 220,
                    '&:hover': {
                      backgroundColor: '#ef6c00'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#ccc'
                    }
                  }}>
                  {isSubmitting ? 'Đang xử lý...' : '📝 Tạo hóa đơn thay thế (Chờ ký)'}
                </Button>
              ) : (
                // KẾ TOÁN: 2 nút - Lưu nháp và Gửi duyệt
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save fontSize="small" />}
                    onClick={handleSaveDraft}
                    disabled={isSubmitting || !originalInvoice}
                    sx={{ 
                      textTransform: 'none', 
                      color: '#1976d2',
                      borderColor: '#1976d2',
                      fontSize: '0.8125rem', 
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#1565c0',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      },
                      '&.Mui-disabled': {
                        borderColor: '#ccc',
                        color: '#ccc'
                      }
                    }}>
                    {isSubmitting ? 'Đang lưu...' : '💾 Lưu nháp'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Send fontSize="small" />}
                    onClick={handleSubmitForApproval}
                    disabled={isSubmitting || !originalInvoice}
                    sx={{ 
                      textTransform: 'none', 
                      backgroundColor: '#2e7d32', 
                      fontSize: '0.8125rem', 
                      py: 0.5,
                      minWidth: 180,
                      '&:hover': {
                        backgroundColor: '#1b5e20'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#ccc'
                      }
                    }}>
                    {isSubmitting ? 'Đang xử lý...' : '📤 Gửi duyệt'}
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Paper>

        <SendInvoiceEmailModal
          open={sendEmailModalOpen}
          onClose={handleCloseSendEmailModal}
          onSend={handleSendDraftEmail}
          invoiceData={{
            invoiceNumber: 'HÓA ĐƠN NHÁP',
            serialNumber: 'N/A',
            date: new Date().toLocaleDateString('vi-VN'),
            customerName: 'Khách hàng',
            totalAmount: totals.total.toLocaleString('vi-VN'),
          }}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* ==================== PREVIEW MODAL ==================== */}
        <Dialog
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              maxWidth: '900px',
              maxHeight: '90vh',
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
            pb: 2
          }}>
            <Typography variant="h6" fontWeight="bold">
              Xem trước hóa đơn
            </Typography>
            <IconButton 
              onClick={() => setPreviewModalOpen(false)}
              size="small"
              sx={{ color: '#666' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            {selectedTemplate && company ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                '& > div': { // Target InvoiceTemplatePreview wrapper
                  maxWidth: '21cm',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }
              }}>
                <InvoiceTemplatePreview
                  config={mapTemplateToConfig()!}
                  products={mapItemsToProducts()}
                  totals={totals} // ✅ Truyền totals đã tính sẵn từ form
                  blankRows={5}
                  visibility={DEFAULT_TEMPLATE_VISIBILITY}
                  bilingual={false}
                  invoiceType="withCode"
                  symbol={DEFAULT_INVOICE_SYMBOL}
                  customerVisibility={{
                    customerName: true,      // ✅ LUÔN HIỆN để xem template đầy đủ
                    customerTaxCode: true,
                    customerAddress: true,
                    customerPhone: true,
                    customerEmail: true,
                    paymentMethod: true,
                  }}
                  customerInfo={mapBuyerToCustomerInfo()}
                  paymentMethod={paymentMethod}
                  invoiceNumber={undefined} // ⚠️ KHÔNG CÓ MÃ HÓA ĐƠN - chưa tạo
                  taxAuthorityCode={null} // ⚠️ KHÔNG CÓ MÃ CQT - chưa đồng bộ
                  backgroundFrame={selectedTemplate.frameUrl || ''}
                  notes={invoiceNotes || null}
                />
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Vui lòng chọn mẫu hóa đơn để xem trước
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              variant="outlined"
              onClick={() => setPreviewModalOpen(false)}
              sx={{ textTransform: 'none' }}
            >
              Đóng
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setPreviewModalOpen(false)
                // TODO: Có thể thêm chức năng in trực tiếp từ preview
                window.print()
              }}
              startIcon={<Print />}
              sx={{ textTransform: 'none', backgroundColor: '#1976d2' }}
            >
              In hóa đơn
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ Dialog xác nhận sản phẩm trùng */}
        <Dialog
          open={duplicateDialog.open}
          onClose={() => setDuplicateDialog({ open: false, rowId: '', product: null, existingItem: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ color: '#ed6c02', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Sản phẩm đã tồn tại
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Sản phẩm <strong>"{duplicateDialog.existingItem?.name}"</strong> đã có trong danh sách với số lượng <strong>{duplicateDialog.existingItem?.quantity}</strong>.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Bạn muốn:
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              onClick={() => setDuplicateDialog({ open: false, rowId: '', product: null, existingItem: null })}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleIncreaseQuantity}
              variant="contained"
              size="small"
              startIcon={<Add />}
              sx={{ textTransform: 'none', backgroundColor: '#1976d2' }}
            >
              Tăng số lượng ({(duplicateDialog.existingItem?.quantity || 0) + 1})
            </Button>
            <Button
              onClick={handleAddNewRow}
              variant="contained"
              size="small"
              startIcon={<Add />}
              sx={{ textTransform: 'none', backgroundColor: '#2e7d32' }}
            >
              Thêm dòng mới
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ Dialog xác nhận xóa sản phẩm */}
        <Dialog
          open={deleteConfirmDialog.open}
          onClose={cancelDeleteRow}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon sx={{ color: '#ed6c02', fontSize: 28 }} />
            <Typography variant="h6" component="span">
              Xác nhận xóa sản phẩm
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi hóa đơn?
            </Typography>
            
            {/* ✅ Warning nếu đang xóa sản phẩm cuối cùng */}
            {items.length === 1 && (
              <Box sx={{ 
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: 1, 
                p: 1.5,
                mb: 1,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1
              }}>
                
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800', mb: 0.5 }}>
                    Đây là sản phẩm cuối cùng!
                  </Typography>
                 
                </Box>
              </Box>
            )}
            
            {items.length > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                💡 Lưu ý: STT các sản phẩm còn lại sẽ tự động cập nhật lại.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={cancelDeleteRow}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={confirmDeleteRow}
              variant="contained"
              size="small"
              color="error"
              startIcon={<DeleteOutline />}
              sx={{ textTransform: 'none' }}
            >
              Xác nhận xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ Dialog xác nhận hủy bỏ */}
        <Dialog
          open={cancelDialog}
          onClose={handleCancelDialogClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ color: '#ed6c02', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Xác nhận hủy bỏ
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {isReplacementMode 
                ? 'Bạn có chắc chắn muốn hủy tạo hóa đơn thay thế này không?'
                : editMode
                ? 'Bạn có chắc chắn muốn hủy chỉnh sửa hóa đơn này không?'
                : 'Bạn có chắc chắn muốn hủy tạo hóa đơn này không?'
              }
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Mọi thay đổi chưa lưu sẽ bị mất.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              onClick={handleCancelDialogClose}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Quay lại
            </Button>
            <Button
              onClick={handleConfirmCancel}
              variant="contained"
              size="small"
              color="error"
              startIcon={<Close />}
              sx={{ textTransform: 'none' }}
            >
              Xác nhận hủy
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default CreateVatInvoice
