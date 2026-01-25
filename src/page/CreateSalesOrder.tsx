import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import invoiceService, { Template, createInvoiceRequest, type BackendInvoiceRequestPayload } from '@/services/invoiceService'
import customerService from '@/services/customerService'
import productService, { Product } from '@/services/productService'
import companyService, { Company } from '@/services/companyService'
import { mapToBackendInvoiceRequest } from '@/utils/invoiceAdapter'
import { numberToWords } from '@/utils/numberToWords'
import { getUserIdFromToken, getRoleFromToken } from '@/utils/tokenUtils'
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
  Autocomplete,
  Tooltip,
} from '@mui/material'
import {
  Public,
  VerifiedUser,
  ExpandMore,
  Close,
  Publish,
  Print,
  KeyboardArrowUp,
  KeyboardArrowDown,
  DeleteOutline,
  Warning,
  Add,
  ArrowBack,
  Info,
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
 * @returns {JSX.Element} Form tạo yêu cầu xuất hóa đơn
 */
function CreateSalesOrder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // ✅ Edit mode detection
  const editMode = searchParams.get('mode') === 'edit'
  const editInvoiceId = searchParams.get('id')
  
  // Set title based on mode
  usePageTitle(editMode ? 'Chỉnh sửa yêu cầu' : 'Tạo yêu cầu xuất hóa đơn')
  
  // Template states
  const [templates, setTemplates] = useState<Template[]>([])
  
  // Product states
  const [products, setProducts] = useState<Product[]>([])
  
  // ✅ Customer states - Chỉ load khách hàng của sale hiện tại
  const [customers, setCustomers] = useState<Array<{
    customerID: number
    customerName: string
    taxCode: string
    address: string
    contactEmail: string
    contactPhone: string
    contactPerson: string  // ✅ Người liên hệ - dùng để autofill buyerName
  }>>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  
  // Company states
  const [company, setCompany] = useState<Company | null>(null)
  
  const [showTypeColumn, setShowTypeColumn] = useState(true)
  const [discountType] = useState<string>('none') // 'none' | 'per-item' | 'total'
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false) // ✅ Preview modal
  const [invoiceNotes, setInvoiceNotes] = useState<string>('') // Ghi chú chung cho hóa đơn
  const [showInvoiceNotes, setShowInvoiceNotes] = useState(false) // Hiện/ẩn ô ghi chú
  const calculateAfterTax = false // Giá nhập vào là giá CHƯA thuế, VAT tính thêm

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

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await invoiceService.getActiveTemplates()
        console.log('📋 Available templates:', data)
        setTemplates(data)
        if (data.length === 0) {
          console.warn('⚠️ No templates available!')
        }
      } catch (error) {
        console.error('❌ Error loading templates:', error)
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
    
    // ✅ Load khách hàng của sale hiện tại - CHỈ KHÁCH HÀNG THUỘC VỀ SALE NÀY
    const loadSaleCustomers = async () => {
      try {
        setIsLoadingCustomers(true)
        
        // ✅ Verify user role
        const userRole = getRoleFromToken()
        const userId = getUserIdFromToken()
        
        console.log('🔐 [Sales Customer Filter] User Role:', userRole)
        console.log('👤 [Sales Customer Filter] User ID:', userId)
        
        if (!userId) {
          console.warn('⚠️ No user ID found in token - Cannot load customers')
          setSnackbar({
            open: true,
            message: '⚠️ Không thể xác định tài khoản. Vui lòng đăng nhập lại.',
            severity: 'warning',
          })
          return
        }
        
        // ✅ IMPORTANT: This page is for SALES role only
        // API sẽ filter khách hàng theo saleId parameter
        console.log('📍 API Call: GET /api/Customer?saleId=' + userId)
        console.log('🎯 Expected: Chỉ lấy khách hàng có saleId = ' + userId)
        
        // ✅ CHỈ gọi API với saleId parameter - Backend sẽ filter
        const data = await customerService.getCustomersBySaleId(userId)
        
        console.log('✅ [Sales Customer Filter] API Response:', data.length, 'customers')
        
        // 🚨 CRITICAL FIX: Backend API đang trả cả saleID=0, phải filter lại ở client
        // Backend bug: GET /api/Customer?saleId=3 trả về cả customers có saleID=0
        // ✅ ACTIVE FILTER: Chỉ lấy khách hàng active (isActive = true)
        const filteredData = data.filter(customer => customer.saleID === userId && customer.isActive)
        
        console.log('🔍 [Client-side Filter] Before:', data.length, 'customers')
        console.log('🔍 [Client-side Filter] After:', filteredData.length, 'customers')
        console.log('⚠️ [Backend Bug] Filtered out:', data.length - filteredData.length, 'customers (wrong saleID or inactive)')
        
        if (filteredData.length < data.length) {
          console.warn('🚨 Backend API bug detected: Returning customers with saleID !== ' + userId + ' or inactive customers')
          console.warn('🐛 Wrong/Inactive customers:', data.filter(c => c.saleID !== userId || !c.isActive).map(c => ({
            customerID: c.customerID,
            name: c.customerName,
            saleID: c.saleID,
            isActive: c.isActive,
          })))
        }
        
        console.log('🆔 Customer IDs:', filteredData.map(c => c.customerID))
        console.log('🏢 Customer Names:', filteredData.map(c => c.customerName))
        console.log('🔢 MST Codes:', filteredData.map(c => c.taxCode))
        
        // ✅ Double-check: Tất cả customers phải thuộc về sale này
        if (import.meta.env.DEV && filteredData.length > 0) {
          const allBelongToSale = filteredData.every(c => c.saleID === userId)
          console.log('✅ All customers belong to sale ID:', userId, '→', allBelongToSale)
          console.log('🔒 Security: Sale chỉ thấy KHÁCH HÀNG CỦA MÌNH, không thấy khách của sale khác')
        }
        
        setCustomers(filteredData) // ✅ Dùng filtered data
        
        if (filteredData.length === 0) {
          setSnackbar({
            open: true,
            message: '⚠️ Bạn chưa có khách hàng nào. Vui lòng liên hệ quản lý để được phân khách hàng.',
            severity: 'warning',
          })
        } else {
          console.log(`✅ Loaded ${filteredData.length} customers for sale "${userRole}" (ID: ${userId})`)
        }
      } catch (error) {
        console.error('❌ [Sales Customer Filter] Error:', error)
        setSnackbar({
          open: true,
          message: '❌ Không thể tải danh sách khách hàng của bạn',
          severity: 'error',
        })
      } finally {
        setIsLoadingCustomers(false)
      }
    }
    
    loadTemplates()
    loadProducts()
    loadCompany()
    loadSaleCustomers() // ✅ Gọi API load khách hàng
  }, [])

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
        const validPaymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Đổi trừ công nợ', 'Khác']
        let normalizedPaymentMethod = 'Tiền mặt' // Default
        
        // Check if backend returned valid value (not 'string' literal or null/undefined)
        if (invoice.paymentMethod && 
            invoice.paymentMethod !== 'string' && 
            validPaymentMethods.includes(invoice.paymentMethod)) {
          normalizedPaymentMethod = invoice.paymentMethod
        } else if (invoice.paymentMethod && invoice.paymentMethod !== 'string') {
          console.warn('⚠️ Invalid payment method from backend:', invoice.paymentMethod)
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
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt/Chuyển khoản') // ✅ Hình thức thanh toán - Default khuyến nghị
  const [invoiceCustomerType, setInvoiceCustomerType] = useState<1 | 2>(2) // ✅ Loại hóa đơn: 1=Retail/Bán lẻ, 2=Business/Doanh nghiệp
  
  // State cho customer lookup
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [customerNotFound, setCustomerNotFound] = useState(false)
  
  // ✅ Helper: Kiểm tra MST/CCCD có hợp lệ để hiện nút "Lấy thông tin"
  const isValidTaxCodeForLookup = () => {
    if (!buyerTaxCode || !buyerTaxCode.trim()) return false
    const trimmedCode = buyerTaxCode.trim()
    
    if (invoiceCustomerType === 2) {
      // B2B - MST: 10 hoặc 13 chữ số
      return /^\d{10}$|^\d{13}$/.test(trimmedCode)
    } else {
      // B2C - CCCD: 12 chữ số
      return /^\d{12}$/.test(trimmedCode)
    }
  }
  
  // Function: Tự động tìm và điền thông tin khách hàng theo MST
  // ✅ CHỈ TÌM TRONG DANH SÁCH KHÁCH HÀNG CỦA SALE HIỆN TẠI (không search toàn hệ thống)
  const handleTaxCodeLookup = async (taxCode: string) => {
    if (!taxCode || taxCode.trim().length < 10) {
      setCustomerNotFound(false)
      return
    }
    
    const trimmedTaxCode = taxCode.trim()
    
    // ✅ Validate độ dài theo invoiceCustomerType TRƯỚC KHI search
    if (invoiceCustomerType === 2) {
      // B2B - MST: CHỈ 10 hoặc 13 số
      if (!/^\d{10}$|^\d{13}$/.test(trimmedTaxCode)) {
        setSnackbar({
          open: true,
          message: `❌ Mã số thuế không hợp lệ. MST phải là 10 hoặc 13 chữ số (bạn đang nhập ${trimmedTaxCode.length} số).`,
          severity: 'error',
        })
        setCustomerNotFound(false)
        return
      }
    } else {
      // B2C - CCCD: CHỈ 12 số
      if (!/^\d{12}$/.test(trimmedTaxCode)) {
        setSnackbar({
          open: true,
          message: `❌ CCCD không hợp lệ. CCCD phải là 12 chữ số (bạn đang nhập ${trimmedTaxCode.length} số).`,
          severity: 'error',
        })
        setCustomerNotFound(false)
        return
      }
    }
    
    // ✅ Validate: Từ chối số điện thoại Việt Nam (bắt đầu bằng 0 và theo pattern SĐT)
    const phonePattern = /^0[1-9]\d{8,9}$/
    if (phonePattern.test(trimmedTaxCode)) {
      setSnackbar({
        open: true,
        message: 'Bạn đang nhập số điện thoại. Vui lòng nhập Mã số thuế (MST) hoặc CCCD của khách hàng.',
        severity: 'error',
      })
      setCustomerNotFound(false)
      return
    }
    
    // ✅ Validate: MST/CCCD chỉ chứa chữ số
    if (!/^\d+$/.test(trimmedTaxCode)) {
      setSnackbar({
        open: true,
        message: invoiceCustomerType === 2 ? 'MST chỉ được chứa chữ số.' : 'CCCD chỉ được chứa chữ số.',
        severity: 'error',
      })
      setCustomerNotFound(false)
      return
    }
    
    try {
      setIsSearchingCustomer(true)
      setCustomerNotFound(false)
      
      console.log('🔍 [MST Lookup] Searching in YOUR customers only')
      console.log('📊 Total active customers available:', customers.length)
      console.log('🔎 Searching for MST/CCCD:', trimmedTaxCode)
      
      // ✅ BƯỚC 1: Tìm trong active customers (danh sách đã filter)
      const foundActiveCustomer = customers.find(c => c.taxCode === trimmedTaxCode)
      
      if (foundActiveCustomer) {
        // ✅ Tìm thấy trong active customers - Autofill thông tin
        setBuyerCustomerID(foundActiveCustomer.customerID)
        setBuyerCompanyName(foundActiveCustomer.customerName)
        setBuyerAddress(foundActiveCustomer.address)
        setBuyerEmail(foundActiveCustomer.contactEmail)
        setBuyerPhone(foundActiveCustomer.contactPhone)
        // ✅ Autofill contactPerson vào buyerName nếu có
        if (foundActiveCustomer.contactPerson) {
          setBuyerName(foundActiveCustomer.contactPerson)
        }
        
        console.log('✅ [MST Lookup] Found active customer:', foundActiveCustomer.customerName, '(ID:', foundActiveCustomer.customerID, ')')
        setSnackbar({
          open: true,
          message: `✅ Tìm thấy: ${foundActiveCustomer.customerName}`,
          severity: 'success',
        })
        return
      }
      
      // ✅ BƯỚC 2: Không tìm thấy trong active → Check xem có phải inactive customer không
      console.log('⚠️ [MST Lookup] Not found in active customers. Checking if customer exists but is inactive...')
      
      // Gọi API để check ALL customers của sale này (cả inactive)
      const userId = getUserIdFromToken() || 0
      const allCustomersOfSale = await customerService.getCustomersBySaleId(userId)
      const foundInactiveCustomer = allCustomersOfSale.find(c => 
        c.taxCode === trimmedTaxCode && 
        c.saleID === userId &&
        !c.isActive
      )
      
      if (foundInactiveCustomer) {
        // ❌ Customer thuộc về sale nhưng đã bị vô hiệu hoá
        setBuyerCustomerID(0)
        setBuyerCompanyName('')
        setBuyerAddress('')
        setBuyerEmail('')
        setBuyerPhone('')
        setCustomerNotFound(true)
        
        console.log('🚫 [MST Lookup] Found INACTIVE customer:', foundInactiveCustomer.customerName, '(ID:', foundInactiveCustomer.customerID, ')')
        setSnackbar({
          open: true,
          message: `🚫 Khách hàng "${foundInactiveCustomer.customerName}" (MST: ${trimmedTaxCode}) đã bị vô hiệu hoá. Không thể tạo yêu cầu. Vui lòng liên hệ quản lý để kích hoạt lại.`,
          severity: 'error',
        })
      } else {
        // ❌ MST hoàn toàn không thuộc về sale này
        setBuyerCustomerID(0)
        setBuyerCompanyName('')
        setBuyerAddress('')
        setBuyerEmail('')
        setBuyerPhone('')
        setCustomerNotFound(true)
        
        console.log('⚠️ [MST Lookup] NOT FOUND in your customer list (neither active nor inactive)')
        console.log('💡 Available active MST codes:', customers.map(c => c.taxCode))
        setSnackbar({
          open: true,
          message: `🚫 MST "${trimmedTaxCode}" không thuộc khách hàng của bạn (${customers.length} KH active). Vui lòng kiểm tra lại hoặc liên hệ quản lý.`,
          severity: 'warning',
        })
      }
    } catch (error) {
      console.error('❌ [MST Lookup] Error:', error)
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

  // Xóa hàng
  const handleDeleteRow = (id: number) => {
    if (items.length === 1) {
      // Không cho xóa nếu chỉ còn 1 dòng
      return
    }
    const updatedItems = items
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, stt: index + 1 })) // Cập nhật lại STT
    setItems(updatedItems)
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
    const template = templates.length > 0 ? templates[0] : null
    if (!template || !company) return null

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
      
      // 1. Validate buyer information
      if (!buyerCompanyName || !buyerAddress) {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng điền đầy đủ Tên đơn vị và Địa chỉ người mua',
          severity: 'warning'
        })
        return
      }

      if (!buyerTaxCode || buyerTaxCode.trim() === '') {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng nhập Mã số thuế người mua',
          severity: 'warning'
        })
        return
      }

      // 3. Validate items
      if (items.length === 0) {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng thêm ít nhất một sản phẩm/dịch vụ',
          severity: 'warning'
        })
        return
      }

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

      // 4. Validate totals
      if (totals.total <= 0) {
        setSnackbar({
          open: true,
          message: '⚠️ Tổng tiền phải lớn hơn 0',
          severity: 'warning'
        })
        return
      }

      // ========== SUBMIT ==========
      
      setIsSubmitting(true)

      // Sử dụng template đầu tiên trong danh sách (hoặc 1 nếu không có)
      const templateID = templates.length > 0 ? templates[0].templateID : 1

      // Map frontend state sang backend request
      // ✅ Lấy userId từ token cho performedBy
      const currentUserId = getUserIdFromToken() || 0;
      console.log('👤 Current userId from token:', currentUserId);
      
      const backendRequest = mapToBackendInvoiceRequest(
        templateID,
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
        undefined,      // ✅ salesID không truyền (Sales Order không có salesID)
        null,           // ✅ requestID = null (không link với request)
        'B2B'           // ✅ invoiceType: Đơn hàng CHỈ cho doanh nghiệp (Business=2)
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

      // ✅ Gọi API: Tạo yêu cầu xuất hóa đơn (POST /api/InvoiceRequest)
      let response
      if (editMode && editInvoiceId) {
        // Edit mode: call updateInvoice
        console.log(`🔄 Updating invoice ID: ${editInvoiceId}`)
        response = await invoiceService.updateInvoice(parseInt(editInvoiceId), backendRequest)
      } else {
        // Create mode: call createInvoiceRequest
        // ⚠️ Map to InvoiceRequest payload (17 fields - salesID auto from token)
        const requestPayload: BackendInvoiceRequestPayload = {
          accountantId: null,
          // ❌ REMOVED: salesID - Backend tự lấy từ JWT token
          customerID: backendRequest.customerID,
          taxCode: backendRequest.taxCode,
          customerName: backendRequest.customerName,
          address: backendRequest.address,
          notes: backendRequest.notes || '',
          paymentMethod: backendRequest.paymentMethod,
          items: backendRequest.items.map(item => ({
            productId: item.productId || 0,
            productName: item.productName,
            unit: item.unit,
            quantity: item.quantity,
            amount: item.amount,
            vatAmount: item.vatAmount,
          })),
          amount: backendRequest.amount,
          taxAmount: backendRequest.taxAmount,
          totalAmount: backendRequest.totalAmount,
          minRows: backendRequest.minRows || 5,
          contactEmail: backendRequest.contactEmail || '',
          contactPerson: backendRequest.contactPerson || '',
          contactPhone: backendRequest.contactPhone || '',
          companyID: backendRequest.companyID || 1,
          invoiceCustomerType: invoiceCustomerType, // ✅ REQUIRED: 1=Retail/Bán lẻ, 2=Business/Doanh nghiệp
        }
        
        console.log('📤 Sending InvoiceRequest payload:', requestPayload)
        response = await createInvoiceRequest(requestPayload)
      }

      console.log('✅ Invoice saved:', response)

      const responseId = ('requestID' in response ? response.requestID : response.invoiceID) || 0
      const successMessage = editMode
        ? `✅ Cập nhật hóa đơn thành công! (ID: ${responseId})`
        : `✅ Tạo yêu cầu xuất hóa đơn thành công! (ID: ${responseId})\n📋 Yêu cầu đang chờ kế toán xử lý.`

      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      })

      // Navigate to invoice list after 2 seconds (để user đọc message)
      setTimeout(() => {
        navigate('/invoices')
      }, 2000)

    } catch (error: unknown) {
      console.error('❌ Error creating invoice:', error)
      
      // Parse error message từ nhiều nguồn
      let errorMessage = 'Lỗi khi tạo yêu cầu xuất hóa đơn'
      
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

  // ⭐ Gửi yêu cầu xuất hóa đơn (invoiceStatusID = 1 cho request)
  const handleSubmitRequest = async () => {
    await handleSubmitInvoice(1, 'Gửi yêu cầu xuất hóa đơn')
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
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handleDeleteRow(params.row.id)}
            disabled={items.length === 1}
            sx={{
              padding: '4px',
              color: items.length === 1 ? '#ccc' : '#d32f2f',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: items.length === 1 ? 'transparent' : '#ffebee',
                color: items.length === 1 ? '#ccc' : '#c62828',
              },
              '&.Mui-disabled': {
                color: '#ccc',
              },
            }}
          >
            <DeleteOutline sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header NGOÀI Paper */}
      <Box sx={{ px: 2, py: 1.5, maxWidth: '1600px', margin: '0 auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
            📋 Tạo Yêu cầu Xuất Hóa đơn
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
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
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 2, pt: 0, maxWidth: '1600px', margin: '0 auto' }}>
        <Paper 
          elevation={1}
          sx={{ 
            p: 2, 
            borderRadius: 1, 
            overflow: 'visible'
          }}>
          

          {/* Layout 2 cột: Thông tin bán/mua */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {/* Cột TRÁI - Thông tin đầy đủ */}
            <Box sx={{ 
              flex: '1 1 100%', 
              minWidth: '500px',
              backgroundColor: '#fafbfc',
              borderRadius: '12px',
              p: 2.5,
              border: '1px solid #e8eaed'
            }}>
              {/* Tiêu đề hóa đơn */}
              <Typography
                variant="h6"
                align="center"
                sx={{ 
                  fontWeight: 700, 
                  color: '#d32f2f', 
                  mb: 0.5, 
                  letterSpacing: 0.5, 
                  fontSize: '1.1rem',
                  textTransform: 'uppercase'
                }}>
                TẠO YÊU CẦU XUẤT HOÁ ĐƠN GTGT
              </Typography>
              <Typography variant="caption" align="center" sx={{ mb: 2, color: '#666', display: 'block', fontSize: '0.85rem' }}>
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </Typography>

             

              <Divider sx={{ my: 2 }} />

              {/* ✅ Dropdown chọn loại hóa đơn */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem', color: '#666' }}>
                  Loại hóa đơn:
                </Typography>
                <Select
                  size="small"
                  value={invoiceCustomerType}
                  onChange={(e) => setInvoiceCustomerType(e.target.value as 1 | 2)}
                  variant="outlined"
                  sx={{
                    minWidth: 280,
                    fontSize: '0.8125rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ddd',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 0.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                      },
                    },
                  }}
                >
                  <MenuItem value={2} sx={{ fontSize: '0.8125rem', py: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box component="span" sx={{ fontSize: '1rem' }}>🏢</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          Hóa đơn Doanh nghiệp
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                          Bán cho doanh nghiệp (B2B)
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                  <MenuItem value={1} sx={{ fontSize: '0.8125rem', py: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box component="span" sx={{ fontSize: '1rem' }}>👤</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          Hóa đơn Bán lẻ
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                          Bán lẻ cá nhân (B2C)
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                </Select>
                <Tooltip 
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        💡 Chọn loại hóa đơn:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', mb: 0.3 }}>
                        • <strong>Doanh nghiệp:</strong> Bán cho doanh nghiệp (B2B)
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        • <strong>Bán lẻ:</strong> Bán lẻ cho cá nhân (B2C)
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
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    {invoiceCustomerType === 2 ? 'MST người mua:' : 'CCCD:'}
                    <Box component="span" sx={{ color: '#d32f2f', ml: 0.5 }}>*</Box>
                  </Typography>
                  <TextField
                    size="small"
                    placeholder={invoiceCustomerType === 2 ? '0101243150 (10 số) hoặc 0101243150136 (13 số)' : '001234567890 (12 số)'}
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
                  {isValidTaxCodeForLookup() && (
                    <Button 
                      size="small" 
                      startIcon={<Public sx={{ fontSize: 16 }} />} 
                      sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25 }}
                      onClick={() => handleTaxCodeLookup(buyerTaxCode)}
                      disabled={isSearchingCustomer}
                    >
                      {isSearchingCustomer ? 'Đang tìm...' : 'Lấy thông tin'}
                    </Button>
                  )}
                  <Button size="small" startIcon={<VerifiedUser sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, whiteSpace: 'nowrap' }}>
                    KT tình trạng hoạt động
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    {invoiceCustomerType === 2 ? 'Tên đơn vị:' : 'Tên Khách Hàng:'}
                    <Box component="span" sx={{ color: '#d32f2f', ml: 0.5 }}>*</Box>
                  </Typography>
                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={customers}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option
                      return option.customerName
                    }}
                    value={customers.find(c => c.customerID === buyerCustomerID) || null}
                    inputValue={buyerCompanyName}
                    onInputChange={(_, newValue) => {
                      setBuyerCompanyName(newValue)
                    }}
                    onChange={(_, newValue) => {
                      if (newValue && typeof newValue !== 'string') {
                        // Auto-fill tất cả thông tin khi chọn từ dropdown
                        setBuyerCustomerID(newValue.customerID)
                        setBuyerCompanyName(newValue.customerName)
                        setBuyerTaxCode(newValue.taxCode)
                        setBuyerAddress(newValue.address)
                        setBuyerEmail(newValue.contactEmail)
                        setBuyerPhone(newValue.contactPhone)
                        // ✅ Autofill contactPerson vào buyerName nếu có
                        if (newValue.contactPerson) {
                          setBuyerName(newValue.contactPerson)
                        }
                        setCustomerNotFound(false)
                        
                        console.log('Chọn khách hàng:', newValue.customerName)
                        setSnackbar({
                          open: true,
                          message: `Đã chọn khách hàng: ${newValue.customerName}`,
                          severity: 'success',
                        })
                      } else if (newValue === null) {
                        // Clear khi xóa
                        setBuyerCustomerID(0)
                        setBuyerCompanyName('')
                        setBuyerTaxCode('')
                        setBuyerAddress('')
                        setBuyerEmail('')
                        setBuyerPhone('')
                        setBuyerName('')  // ✅ Clear buyerName khi clear customer
                        setCustomerNotFound(false)
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={invoiceCustomerType === 2 ? 'Tìm theo tên công ty...' : 'Tìm theo tên khách hàng...'}
                        variant="standard"
                        sx={{ fontSize: '0.8125rem' }}
                        helperText={
                          isLoadingCustomers 
                            ? '⏳ Đang tải khách hàng của bạn...' 
                            : customers.length === 0 
                            ? '⚠️ Bạn chưa có khách hàng nào'
                            : undefined
                        }
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.customerID}>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.customerName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            MST: {option.taxCode} | {option.address}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText="Không tìm thấy khách hàng"
                    filterOptions={(options, { inputValue }) => {
                      const search = inputValue.toLowerCase()
                      return options.filter(option => 
                        option.customerName.toLowerCase().includes(search) ||
                        option.taxCode.includes(search)
                      )
                    }}
                    sx={{
                      '& .MuiAutocomplete-inputRoot': {
                        fontSize: '0.8125rem',
                      },
                    }}
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

                {/* ✅ Chỉ hiện field "Người mua hàng" khi ở chế độ B2B (Doanh nghiệp) */}
                {invoiceCustomerType === 2 && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Tooltip 
                      title="Không bắt buộc. Nhập tên người đại diện, kế toán hoặc người liên hệ của doanh nghiệp"
                      placement="top"
                      arrow
                    >
                      <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem', cursor: 'help' }}>
                        Người mua hàng:
                      </Typography>
                    </Tooltip>
                    <TextField size="small" placeholder="Kế toán Nguyễn Văn A" variant="standard" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} sx={{ width: 160, fontSize: '0.8125rem' }} />
                    <Typography variant="caption" sx={{ minWidth: 50, fontSize: '0.8125rem' }}>
                      Email:
                      <Box component="span" sx={{ color: '#d32f2f', ml: 0.5 }}>*</Box>
                    </Typography>
                    <TextField size="small" placeholder="hoadon@gmail.com" variant="standard" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} sx={{ flex: 1, fontSize: '0.8125rem' }} />
                  </Stack>
                )}
                
                {/* ✅ Hiện Email và Phone trên cùng 1 dòng cho B2C */}
                {invoiceCustomerType === 1 && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                      Email:
                      <Box component="span" sx={{ color: '#d32f2f', ml: 0.5 }}>*</Box>
                    </Typography>
                    <TextField size="small" placeholder="hoadon@gmail.com" variant="standard" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} sx={{ flex: 1, fontSize: '0.8125rem' }} />
                  </Stack>
                )}

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Số điện thoại:
                  </Typography>
                  <TextField size="small" variant="standard" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} sx={{ width: 160, fontSize: '0.8125rem' }} />
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
                      Tiền mặt/Chuyển khoản
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
                      Chuyển khoản
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
                      Tiền mặt
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
                      Đối trừ công nợ
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

              
            </Stack>


             
          </Stack>

          {/* DataGrid với Box wrapper để có scroll ngang */}
          <Box
            sx={{
              width: '100%',
              overflowX: 'auto',
              mb: 2,
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e0e0e0',
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
                border: 'none',
                borderRadius: '12px',
                minWidth: 'max-content',
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
            <Box 
              sx={{ 
                width: 480, 
                background: '#fafbfc',
                borderRadius: '12px',
                padding: 2.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e8eaed'
              }}
            >
              <Stack spacing={1.2}>
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

                <Stack direction="row" justifyContent="space-between">
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 2, mt: 3 }}>
            

            {/* Buttons phải */}
            <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
              <Button
                size="medium"
                variant="outlined"
                startIcon={<Close fontSize="small" />}
                onClick={() => navigate('/invoices')}
                sx={{ 
                  textTransform: 'none', 
                  color: '#666', 
                  borderColor: '#d0d0d0',
                  borderRadius: '10px',
                  px: 3,
                  py: 1,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#999',
                    backgroundColor: '#f5f5f5',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}>
                Hủy bỏ
              </Button>
              <Button
                size="medium"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Publish fontSize="small" />}
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                sx={{ 
                  textTransform: 'none', 
                  background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                  minWidth: 200,
                  borderRadius: '10px',
                  px: 3,
                  py: 1,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)'
                  },
                  '&:disabled': {
                    background: '#ccc'
                  },
                  transition: 'all 0.2s ease'
                }}>
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu xuất hóa đơn'}
              </Button>
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
            {templates.length > 0 && company ? (
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
                  backgroundFrame={templates[0]?.frameUrl || ''}
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
      </Box>
    </Box>
  )
}

export default CreateSalesOrder