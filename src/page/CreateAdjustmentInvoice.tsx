import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import invoiceService, { 
  Template, 
  InvoiceListItem,
  CreateAdjustmentInvoiceRequest,
} from '@/services/invoiceService'
import customerService from '@/services/customerService'
import productService, { Product } from '@/services/productService'
import companyService, { Company } from '@/services/companyService'
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
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material'
import {
  HelpOutline,
  Info,
  ExpandMore,
  Visibility,
  Close,
  Save,
  Print,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Warning,
  Add,
  Undo, // ✅ Icon trả hàng
  Send, // ✅ Icon gửi duyệt
} from '@mui/icons-material'
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams } from '@mui/x-data-grid'

// Interface cho hàng hóa/dịch vụ - ADJUSTMENT VERSION (OPTIMIZED)
interface InvoiceItem {
  id: number
  productId?: number
  stt: number
  type: string
  code: string
  name: string
  unit: string
  
  // ✅ LOGIC ĐÚNG: Chỉ cần GỐC + ĐIỀU CHỈNH
  originalQuantity: number      // SL từ hóa đơn gốc (READ-ONLY)
  adjustmentQuantity: number    // SL điều chỉnh (+/-), default = 0 (EDITABLE)
  
  originalPrice: number         // ĐG từ hóa đơn gốc (READ-ONLY)
  adjustmentPrice: number       // ĐG điều chỉnh (+/-), default = 0 (EDITABLE)
  
  // ✅ GIÁ TRỊ SAU ĐIỀU CHỈNH (CALCULATED)
  finalQuantity: number         // = originalQuantity + adjustmentQuantity
  finalPrice: number            // = originalPrice + adjustmentPrice
  finalTotal: number            // = finalQuantity * finalPrice (Thành tiền sau điều chỉnh)
  
  // ✅ THÀNH TIỀN ĐIỀU CHỈNH (CALCULATED)
  // Công thức: finalTotal - originalTotal
  adjustmentAmount: number      // Số tiền chênh lệch thực tế
  
  // Legacy fields (để tương thích và tính tổng)
  quantity: number              // = finalQuantity (for compatibility)
  priceAfterTax: number         // = finalPrice (for compatibility)
  discountPercent: number
  discountAmount: number
  vatRate?: number
  vatTax?: number
  totalAfterTax: number         // = finalTotal (Thành tiền sau điều chỉnh)
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
  const [value, setValue] = useState(Number(params.value) || 0) // ✅ Default = 0 (không đổi)

  const handleChange = (newValue: number) => {
    const formatted = Number(newValue.toFixed(2))
    setValue(formatted)
    params.api.setEditCellValue({ id: params.id, field: params.field, value: formatted })
  }

  // ✅ Màu sắc động: xanh (dương), đỏ (âm), xám (0)
  const getColor = () => {
    if (value > 0) return '#2e7d32' // Xanh lá (tăng)
    if (value < 0) return '#d32f2f' // Đỏ (giảm)
    return '#999' // Xám (không đổi)
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
          // ✅ BỎ min: 0, cho phép nhập số âm
          style: { textAlign: 'center', color: getColor(), fontWeight: value !== 0 ? 600 : 400 },
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
                  title="Tăng số lượng (+1)"
                  sx={{
                    padding: '0px',
                    minWidth: '18px',
                    width: '18px',
                    height: '13px',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#c8e6c9', // Xanh nhạt
                    },
                  }}>
                  <KeyboardArrowUp sx={{ fontSize: 14, color: '#2e7d32' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleChange(value - 1)} // ✅ BỎ Math.max(0), cho phép âm
                  title="Giảm số lượng (-1)"
                  sx={{
                    padding: '0px',
                    minWidth: '18px',
                    width: '18px',
                    height: '13px',
                    borderRadius: '0 0 3px 3px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#ffcdd2', // Đỏ nhạt
                    },
                  }}>
                  <KeyboardArrowDown sx={{ fontSize: 14, color: '#d32f2f' }} />
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
  const [isNegative, setIsNegative] = useState(false)

  useEffect(() => {
    const num = Number(params.value) || 0
    setIsNegative(num < 0)
    // Hiển thị số âm với dấu -
    setDisplayValue(num.toLocaleString('vi-VN'))
  }, [params.value])

  // ✅ Khi focus vào ô có giá trị 0, clear để dễ nhập
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const num = Number(params.value) || 0
    if (num === 0) {
      setDisplayValue('')
    }
    // Select all để user có thể gõ đè
    e.target.select()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    
    // ✅ Cho phép input trống hoặc chỉ dấu -
    if (input === '' || input === '-') {
      setDisplayValue(input)
      setIsNegative(input === '-')
      if (input === '') {
        params.api.setEditCellValue({ id: params.id, field: params.field, value: 0 })
      }
      return
    }
    
    // ✅ Kiểm tra có dấu - ở đầu không
    const isNegativeInput = input.startsWith('-')
    
    // Xóa tất cả ký tự không phải số và dấu -
    const cleanInput = input.replace(/[^\d-]/g, '')
    
    // Chỉ giữ dấu - đầu tiên (nếu có)
    const hasMultipleMinus = (cleanInput.match(/-/g) || []).length > 1
    if (hasMultipleMinus) {
      return // Không cho phép nhiều dấu -
    }
    
    // Lấy phần số thuần (bỏ dấu -)
    const numericPart = cleanInput.replace('-', '')
    
    // Kiểm tra có phải là số hợp lệ không
    if (numericPart && !/^\d+$/.test(numericPart)) {
      return
    }
    
    // Nếu có số, tính toán và format
    if (numericPart) {
      let num = Number(numericPart)
      if (isNegativeInput) {
        num = -num
      }
      
      setIsNegative(num < 0)
      setDisplayValue(num.toLocaleString('vi-VN'))
      params.api.setEditCellValue({ id: params.id, field: params.field, value: num })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      params.api.stopCellEditMode({ id: params.id, field: params.field })
    }
  }

  // ✅ Màu động theo giá trị
  const getColor = () => {
    const num = Number(params.value) || 0
    if (num > 0) return '#2e7d32' // Xanh
    if (num < 0) return '#d32f2f' // Đỏ
    return '#666' // Xám
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
        type="text"
        value={displayValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        placeholder="0"
        inputProps={{
          style: {
            textAlign: 'center',
            padding: '0 8px',
            height: '28px',
            fontSize: '0.8125rem',
            color: getColor(),
            fontWeight: isNegative ? 600 : 500,
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
// NOTE: Currently unused but kept for future discount feature implementation
/*
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
*/

// Component riêng cho ô edit Tiền CK
// NOTE: Currently unused but kept for future discount feature implementation
/*
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
*/

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
  const { id: originalInvoiceId } = useParams<{ id: string }>() // ✅ Lấy ID hóa đơn gốc từ URL
  const { user } = useAuthContext() // ✅ Get user role
  
  // State cho hóa đơn gốc
  const [originalInvoice, setOriginalInvoice] = useState<InvoiceListItem | null>(null)
  const [loadingOriginalInvoice, setLoadingOriginalInvoice] = useState(false)
  const [referenceText, setReferenceText] = useState<string>('') // ✅ Dòng tham chiếu BẮT BUỘC (pháp lý)
  const [adjustmentReason, setAdjustmentReason] = useState<string>('') // ✅ Lý do điều chỉnh (audit trail)
  
  // ✅ State cho loại hóa đơn (B2B/B2C) - Load từ hóa đơn gốc
  const [invoiceType, setInvoiceType] = useState<'B2B' | 'B2C'>('B2B') // Mặc định B2B, sẽ load từ originalInvoice

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

  // ✅ Handlers cho nút Hủy bỏ
  const handleCancelClick = () => {
    setCancelDialog(true)
  }

  const handleConfirmCancel = () => {
    setCancelDialog(false)
    if (originalInvoiceId) {
      navigate(`/invoices/${originalInvoiceId}`)
    } else {
      navigate('/invoices')
    }
  }

  const handleCancelDialogClose = () => {
    setCancelDialog(false)
  }

  // Load templates on mount
  useEffect(() => {
    // Fetch hóa đơn gốc nếu có ID
    const loadOriginalInvoice = async () => {
      if (!originalInvoiceId) {
        console.warn('⚠️ No original invoice ID provided')
        return
      }
      
      setLoadingOriginalInvoice(true)
      try {
        const data = await invoiceService.getInvoiceById(Number(originalInvoiceId))
        console.log('📄 Original invoice loaded:', data)
        setOriginalInvoice(data)
        
        // ✅ Load loại hóa đơn từ hóa đơn gốc
        // invoiceCustomerType: 1 hoặc 'Customer' = B2C, 2 hoặc 'Business' = B2B
        const loadedInvoiceType = 
          (data.invoiceCustomerType === 1 || data.invoiceCustomerType === 'Customer') 
            ? 'B2C' 
            : 'B2B'
        setInvoiceType(loadedInvoiceType)
        console.log('🏢 Invoice type from original invoice:', {
          invoiceCustomerType: data.invoiceCustomerType,
          invoiceType: loadedInvoiceType,
          description: loadedInvoiceType === 'B2C' ? 'Bán lẻ (Customer)' : 'Doanh nghiệp (Business)'
        })
        
        // ✅ Fetch template info để lấy Mẫu số và Ký hiệu
        let templateName = 'N/A'
        let templateSerial = 'N/A'
        if (data.templateID) {
          try {
            const templates = await invoiceService.getAllTemplates()
            const template = templates.find(t => t.templateID === data.templateID)
            if (template) {
              templateName = template.templateName || 'N/A'
              templateSerial = template.serial || 'N/A'
              console.log('📝 Template info:', { templateName, templateSerial })
            }
          } catch (templateError) {
            console.warn('⚠️ Could not fetch template info:', templateError)
          }
        }
        
        // ✅ TẠO DÒNG THAM CHIẾU BẮT BUỘC (Legal requirement)
        // Fix: signDate hoặc createdAt, không phải invoiceDate
        const invoiceDateStr = data.signDate || data.createdAt || new Date().toISOString()
        const invoiceDate = new Date(invoiceDateStr)
        const adjustmentType = '(tăng/giảm)' // Sẽ tự động xác định sau khi user nhập
        
        // Validate date
        if (isNaN(invoiceDate.getTime())) {
          console.warn('⚠️ Invalid invoice date, using current date')
          invoiceDate.setTime(Date.now())
        }
        
        // ✅ Generate reference text với thông tin template thực
        const refText = `Điều chỉnh ${adjustmentType} cho hóa đơn Mẫu số ${templateName} Ký hiệu ${templateSerial} Số ${String(data.invoiceNumber).padStart(7, '0')} ngày ${invoiceDate.getDate()} tháng ${invoiceDate.getMonth() + 1} năm ${invoiceDate.getFullYear()}`
        setReferenceText(refText)
        console.log('📌 Generated reference text:', refText)
        
        // ✅ Auto-fill Customer ID từ hóa đơn gốc
        if (data.customerID) {
          setBuyerCustomerID(data.customerID)
          console.log('🎯 Customer ID from original invoice:', data.customerID)
        }
        
        // ✅ Auto-fill thông tin khách hàng từ hóa đơn gốc (READ-ONLY)
        setBuyerName(data.contactPerson || '')
        setBuyerEmail(data.customerEmail || '')  // ✅ Fix: API trả về customerEmail, không phải contactEmail
        setBuyerPhone(data.contactPhone || '')
        console.log('📧 Email from original invoice:', data.customerEmail)
        
        // ✅ Load hình thức thanh toán từ hóa đơn gốc (READ-ONLY)
        if (data.paymentMethod) {
          setPaymentMethod(data.paymentMethod)
          console.log('💳 Payment method from original invoice:', data.paymentMethod)
        }
        
        // ✅ Fetch thông tin customer đầy đủ từ customerID
        if (data.customerID) {
          try {
            const customers = await customerService.getAllCustomers()
            const customer = customers.find(c => c.customerID === data.customerID) // ✅ Fix: customerID viết hoa
            if (customer) {
              console.log('✅ Customer found:', customer)
              setBuyerTaxCode(customer.taxCode || '')
              setBuyerCompanyName(customer.customerName || '')
              setBuyerAddress(customer.address || '')
            } else {
              console.warn('⚠️ Customer not found with ID:', data.customerID)
            }
          } catch (error) {
            console.error('❌ Error loading customer details:', error)
          }
        }
        
        // ✅ Load items GỐC từ hóa đơn vào DataGrid
        if (data.invoiceItems && data.invoiceItems.length > 0) {
          // ✅ Fetch products để lấy code - Always fetch fresh to avoid race conditions
          let productsList: Product[] = []
          try {
            productsList = await productService.getProducts()
            console.log('📦 Loaded products for code mapping:', productsList.length)
          } catch (error) {
            console.warn('⚠️ Could not load products:', error)
          }
          
          const mappedItems: InvoiceItem[] = data.invoiceItems.map((item, index) => {
            // Tính ngược unit price từ amount và quantity
            const unitPrice = item.quantity > 0 ? item.amount / item.quantity : 0
            
            // Tính VAT rate từ vatAmount và amount
            const vatRate = item.amount > 0 ? (item.vatAmount / item.amount) * 100 : 10
            
            // ✅ Tìm product code từ productId
            const product = productsList.find(p => p.id === item.productId)
            const productCode = product?.code || ''
            const productType = product?.description || 'Hàng hóa, dịch vụ'
            
            console.log(`📦 Mapping item ${index + 1}:`, {
              productId: item.productId,
              foundProduct: !!product,
              code: productCode,
              name: item.productName
            })
            
            return {
              id: index + 1,
              productId: item.productId,
              stt: index + 1,
              type: productType,
              code: productCode,
              name: item.productName || '',
              unit: item.unit || '',
              
              // ✅ GỐC + ĐIỀU CHỈNH
              originalQuantity: item.quantity,
              adjustmentQuantity: 0,  // Mặc định = 0
              
              originalPrice: Math.round(unitPrice),
              adjustmentPrice: 0,     // Mặc định = 0
              
              // ✅ GIÁ TRỊ SAU ĐIỀU CHỈNH (ban đầu = gốc)
              finalQuantity: item.quantity,
              finalPrice: Math.round(unitPrice),
              finalTotal: Math.round(item.amount),
              
              // ✅ THÀNH TIỀN ĐIỀU CHỈNH = 0 (vì chưa điều chỉnh gì)
              adjustmentAmount: 0,
              
              // Legacy fields
              quantity: item.quantity,
              priceAfterTax: Math.round(unitPrice),
              discountPercent: 0,
              discountAmount: 0,
              vatRate: Math.round(vatRate),
              vatTax: Math.round(item.vatAmount),
              totalAfterTax: Math.round(item.amount), // ✅ = finalTotal
            }
          })
          
          console.log('✅ Mapped invoice items with codes:', mappedItems)
          setItems(mappedItems)
        }
      } catch (error) {
        console.error('❌ Error loading original invoice:', error)
        setSnackbar({
          open: true,
          message: 'Không thể tải thông tin hóa đơn gốc',
          severity: 'error'
        })
      } finally {
        setLoadingOriginalInvoice(false)
      }
    }
    
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
    
    loadOriginalInvoice()
    loadTemplates()
    loadProducts()
    loadCompany()
  }, [originalInvoiceId]) // ✅ Fixed: Removed products from deps to prevent infinite loop

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
      originalQuantity: 0,
      adjustmentQuantity: 0,
      originalPrice: 0,
      adjustmentPrice: 0,
      adjustmentAmount: 0,
      finalQuantity: 0,    // ✅ Add missing field
      finalPrice: 0,       // ✅ Add missing field
      finalTotal: 0,       // ✅ Add missing field
    },
  ])

  // State cho thông tin người mua (Read-only from original invoice, used for preview only)
  const [buyerCustomerID, setBuyerCustomerID] = useState(0) // ✅ Customer ID từ hóa đơn gốc (used in line 1679)
  const [buyerTaxCode, setBuyerTaxCode] = useState('')
  const [buyerCompanyName, setBuyerCompanyName] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt') // Hình thức thanh toán
  
  // Mark buyerCustomerID as used to suppress false positive TS warning
  void buyerCustomerID
  
  // Function: Tự động tìm và điền thông tin khách hàng theo MST
  // NOTE: Currently unused but kept for future lookup feature - Customer info auto-filled from original invoice
  /*
  const handleTaxCodeLookup = async (taxCode: string) => {
    if (!taxCode || taxCode.trim().length < 10) {
      return
    }
    
    try {
      // ✅ Gọi API findCustomerByTaxCode để tìm kiếm trực tiếp
      const foundCustomer = await customerService.findCustomerByTaxCode(taxCode.trim())
      
      if (foundCustomer) {
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
    }
  }
  */
  
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
            // ✅ PHÂN BIỆT: Sản phẩm mới (chưa có trong HĐ gốc) vs Sản phẩm đã tồn tại
            const isNewProduct = item.originalQuantity === 0 && item.originalPrice === 0
            
            // 🎯 SẢN PHẨM MỚI: Auto-fill adjustmentPrice = basePrice, adjustmentQuantity = 1
            const finalAdjustmentQuantity = isNewProduct ? 1 : (item.adjustmentQuantity || 0)
            const finalAdjustmentPrice = isNewProduct ? basePrice : (item.adjustmentPrice || 0)
            
            // Tính giá trị sau điều chỉnh
            const finalQty = item.originalQuantity + finalAdjustmentQuantity
            const finalPrice = item.originalPrice + finalAdjustmentPrice
            const finalTotal = finalQty * finalPrice
            
            // Tính adjustmentAmount
            const originalTotal = item.originalQuantity * item.originalPrice
            const calculatedAdjustmentAmount = finalTotal - originalTotal
            
            // ✅ Tạo object hoàn toàn mới để React detect thay đổi
            const updatedItem: InvoiceItem = {
              id: item.id,
              stt: item.stt,
              productId: productDetail.id,              // ID sản phẩm
              code: productDetail.code,                 // Mã sản phẩm (DV001)
              name: productDetail.name,                 // Tên sản phẩm
              type: productDetail.description || 'Hàng hóa', // Tính chất HHDV từ description
              unit: productDetail.unit,                 // Đơn vị tính
              quantity: finalQty,                      // ✅ = originalQuantity + adjustmentQuantity
              priceAfterTax: finalPrice,               // ✅ = originalPrice + adjustmentPrice
              discountPercent: item.discountPercent,   // Giữ nguyên chiết khấu
              discountAmount: item.discountAmount,     // Giữ nguyên chiết khấu
              totalAfterTax: finalTotal,               // ✅ Thành tiền sau điều chỉnh
              vatRate: productVatRate,                 // ✅ Thuế suất của sản phẩm
              originalQuantity: item.originalQuantity || 0,
              adjustmentQuantity: finalAdjustmentQuantity,    // ✅ Auto = 1 cho sản phẩm mới
              originalPrice: item.originalPrice || 0,
              adjustmentPrice: finalAdjustmentPrice,          // ✅ Auto = basePrice cho sản phẩm mới
              finalQuantity: finalQty,                 // ✅ Số lượng sau điều chỉnh
              finalPrice: finalPrice,                  // ✅ Đơn giá sau điều chỉnh
              finalTotal: finalTotal,                  // ✅ Tổng tiền sau điều chỉnh
              adjustmentAmount: calculatedAdjustmentAmount,   // ✅ Tính chênh lệch
            }
            console.log('✅ Updated item:', updatedItem)
            console.log(`🆕 ${isNewProduct ? 'NEW PRODUCT' : 'EXISTING PRODUCT'} detected:`, {
              isNew: isNewProduct,
              adjustmentQuantity: finalAdjustmentQuantity,
              adjustmentPrice: finalAdjustmentPrice,
              adjustmentAmount: calculatedAdjustmentAmount,
            })
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
  // const handleTaxCodeChange = (value: string) => {
  //   setBuyerTaxCode(value)
  // }
  
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
  // const handleTaxCodeBlur = () => {
  //   if (buyerTaxCode && buyerTaxCode.trim().length >= 10) {
  //     handleTaxCodeLookup(buyerTaxCode)
  //   }
  // }

  

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
      quantity: 0,
      priceAfterTax: 0,
      discountPercent: 0,
      discountAmount: 0,
      vatRate: 0,              // ✅ Thuế suất mặc định 0%
      totalAfterTax: 0,
      originalQuantity: 0,
      adjustmentQuantity: 0,
      originalPrice: 0,
      adjustmentPrice: 0,
      finalQuantity: 0,
      finalPrice: 0,
      finalTotal: 0,
      adjustmentAmount: 0,
    }
    setItems([...items, newItem])
  }

  // Tính toán tổng tiền
  const calculateTotals = (currentItems: InvoiceItem[]) => {
    // ✅ HÓA ĐƠN ĐIỀU CHỈNH: Chỉ tính CHÊNH LỆCH (adjustmentAmount), không tính tổng cuối
    // adjustmentAmount = (SL_Gốc + SL_Đ/C) × (ĐG_Gốc + ĐG_Đ/C) - (SL_Gốc × ĐG_Gốc)
    
    const subtotalBeforeDiscount = currentItems.reduce((sum, item) => {
      // ✅ Chỉ tính số tiền ĐIỀU CHỈNH (chênh lệch), không tính tổng cuối
      return sum + (item.adjustmentAmount || 0)
    }, 0)

    // Tính tổng tiền chiết khấu (nếu có)
    const totalDiscount = currentItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0)

    // Tổng tiền sau chiết khấu (CHƯA bao gồm thuế)
    const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscount

    // ✅ Tính thuế GTGT trên SỐ TIỀN ĐIỀU CHỈNH (không phải tổng cuối)
    const tax = currentItems.reduce((sum, item) => {
      // Tiền điều chỉnh của dòng này (sau chiết khấu nếu có)
      const itemAdjustment = (item.adjustmentAmount || 0) - (item.discountAmount || 0)
      // Tiền thuế = Tiền điều chỉnh × Thuế suất
      const itemTax = itemAdjustment * ((item.vatRate || 0) / 100)
      return sum + itemTax
    }, 0)
    
    // Tổng tiền thanh toán = subtotalAfterDiscount + thuế
    const total = subtotalAfterDiscount + tax

    return {
      subtotal: Math.round(subtotalAfterDiscount),     // Tổng tiền hàng ĐIỀU CHỈNH (chênh lệch)
      discount: Math.round(totalDiscount),             // Chiết khấu
      subtotalAfterDiscount: Math.round(subtotalAfterDiscount), // Sau chiết khấu, chưa thuế
      tax: Math.round(tax),                            // ✅ Tiền thuế VAT trên số tiền điều chỉnh
      total: Math.round(total),                        // Tổng thanh toán điều chỉnh (= subtotal + tax)
    }
  }

  // Xử lý cập nhật hàng - ADJUSTMENT VERSION (FIXED LOGIC + VALIDATION)
  const processRowUpdate = useCallback(
    (newRow: InvoiceItem, oldRow: InvoiceItem) => {
      const updatedRow = { ...newRow }

      // ✅ CÔNG THỨC ĐÚNG: Thành tiền điều chỉnh
      // = (SL_Gốc + SL_Đ/C) * (ĐG_Gốc + ĐG_Đ/C) - (SL_Gốc * ĐG_Gốc)
      
      const finalQty = updatedRow.originalQuantity + updatedRow.adjustmentQuantity
      const finalPrice = updatedRow.originalPrice + updatedRow.adjustmentPrice
      
      // 🛡️ GUARDRAIL: Số lượng cuối KHÔNG được âm
      if (finalQty < 0) {
        const errorMsg = `❌ Lỗi: Số lượng điều chỉnh giảm (${updatedRow.adjustmentQuantity}) không được lớn hơn số lượng gốc (${updatedRow.originalQuantity}).\n\n🔢 Số lượng còn lại không thể âm!\n\n💡 Gợi ý: Nhập tối đa -${updatedRow.originalQuantity} để trả hàng toàn bộ.`
        
        // Hiển thị thông báo lỗi
        setSnackbar({
          open: true,
          message: errorMsg,
          severity: 'error'
        })
        
        console.error('🛡️ Validation failed:', errorMsg)
        
        // Trả về giá trị cũ (không cho phép cập nhật)
        return oldRow
      }
      
      const originalTotal = updatedRow.originalQuantity * updatedRow.originalPrice
      const finalTotal = finalQty * finalPrice
      
      // 🎯 Số tiền chênh lệch (đây là số quan trọng nhất!)
      updatedRow.adjustmentAmount = finalTotal - originalTotal
      
      // ✅ Cập nhật giá trị sau điều chỉnh
      updatedRow.finalQuantity = finalQty
      updatedRow.finalPrice = finalPrice
      updatedRow.finalTotal = finalTotal
      
      // Sync legacy fields
      updatedRow.quantity = finalQty
      updatedRow.priceAfterTax = finalPrice
      updatedRow.totalAfterTax = finalTotal // ✅ Thành tiền = tổng SAU điều chỉnh
      
      // Tính VAT trên THÀNH TIỀN SAU ĐIỀU CHỈNH (không phải chỉ phần chênh lệch)
      const itemVatRate = updatedRow.vatRate || 0
      updatedRow.vatTax = Math.round(finalTotal * (itemVatRate / 100))

      // Update items state
      const updatedItems = items.map((item) => (item.id === newRow.id ? updatedRow : item))
      setItems(updatedItems)

      console.log('📊 Adjustment calculated:', {
        original: `${updatedRow.originalQuantity} x ${updatedRow.originalPrice.toLocaleString()} = ${originalTotal.toLocaleString()}`,
        adjustment: `${updatedRow.adjustmentQuantity >= 0 ? '+' : ''}${updatedRow.adjustmentQuantity} qty, ${updatedRow.adjustmentPrice >= 0 ? '+' : ''}${updatedRow.adjustmentPrice.toLocaleString()} price`,
        final: `${finalQty} x ${finalPrice.toLocaleString()} = ${finalTotal.toLocaleString()}`,
        difference: `${updatedRow.adjustmentAmount >= 0 ? '+' : ''}${updatedRow.adjustmentAmount.toLocaleString()}`
      })

      return updatedRow
    },
    [items]
  )

  // ✅ Memoize totals calculation to prevent recalculation on every render
  const totals = useMemo(() => calculateTotals(items), [items])

  // ==================== PREVIEW MODAL - DATA MAPPING ====================
  
  /**
   * Map InvoiceItem[] → ProductItem[] cho InvoiceTemplatePreview
   * ✅ Truyền ĐẦY ĐỦ thông tin: VAT rate, discount, VAT amount
   * ✅ Memoized to prevent recalculation on every render
   */
  const mapItemsToProducts = useMemo((): ProductItem[] => {
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
  }, [items])

  /**
   * Map buyer info → CustomerInfo cho InvoiceTemplatePreview
   * ✅ LUÔN return object để preview hiển thị đầy đủ template
   * ✅ Memoized to prevent object recreation on every render
   */
  const mapBuyerToCustomerInfo = useMemo((): CustomerInfo => {
    return {
      name: buyerCompanyName || '', // Để trống nếu chưa nhập
      email: buyerEmail || '',
      taxCode: buyerTaxCode || '',
      address: buyerAddress || '',
      phone: buyerPhone || '',
      buyerName: buyerName || '', // Họ tên người mua
    }
  }, [buyerCompanyName, buyerEmail, buyerTaxCode, buyerAddress, buyerPhone, buyerName])

  /**
   * Map template + company → TemplateConfigProps
   * ✅ Memoized to prevent object recreation on every render
   */
  const mapTemplateToConfig = useMemo((): TemplateConfigProps | null => {
    if (!selectedTemplate || !company) return null

    return {
      companyLogo: company.logoUrl || null, // ✅ Use logo from Company API
      companyName: company.companyName,
      companyTaxCode: company.taxCode,
      companyAddress: company.address,
      companyPhone: company.contactPhone,
    }
  }, [selectedTemplate, company])

  // ==================== HANDLERS ====================

  // Hàm lấy user ID từ token (cần implement)
  // Hàm submit hóa đơn
  // ⭐ Handler chung để xử lý submit
  // NOTE: Legacy function - not used for adjustment invoice, use handleSubmitAdjustmentInvoice instead
  /*
  const handleSubmitInvoice = async (invoiceStatusID: number, statusLabel: string) => {
    try {
      // ========== VALIDATION ==========
      
      // 1. Validate template
      if (!selectedTemplate) {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng chọn mẫu hóa đơn',
          severity: 'warning'
        })
        return
      }

      // Validate templateID exists
      if (!selectedTemplate || !selectedTemplate.templateID || selectedTemplate.templateID <= 0) {
        setSnackbar({
          open: true,
          message: `❌ Template không hợp lệ (ID: ${selectedTemplate?.templateID}). Vui lòng chọn template khác.`,
          severity: 'error'
        })
        console.error('❌ Invalid template:', selectedTemplate)
        return
      }

      // 2. Validate buyer information
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

      // Map frontend state sang backend request
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
        0,              // signedBy (0=chưa ký)
        undefined,      // ✅ salesID không truyền (điều chỉnh không có salesID)
        null,           // ✅ requestID = null (không link với request)
        invoiceType     // ✅ invoiceType: Dynamic load từ hóa đơn gốc (B2B=2, B2C=1)
      )

      console.log(`📤 Sending invoice request (${statusLabel}):`, backendRequest)

      // Gọi API
      const response = await invoiceService.createInvoice(backendRequest)

      console.log('✅ Invoice created:', response)

      // ⭐ Hiển thị thông báo chi tiết với invoiceID và hướng dẫn
      const successMessage = invoiceStatusID === 1
        ? `✅ Lưu hóa đơn nháp thành công! (ID: ${response.invoiceID})\n💡 Số hóa đơn sẽ được cấp sau khi ký số tại trang danh sách hóa đơn.`
        : `✅ Gửi hóa đơn chờ duyệt thành công! (ID: ${response.invoiceID})\n📋 Hóa đơn đang chờ phê duyệt từ quản lý.`

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
  */

  // ==================== SUBMIT HÓA ĐƠN ĐIỀU CHỈNH - ROLE-BASED ====================
  
  /**
   * ⭐ MAIN HANDLER: Tạo hóa đơn điều chỉnh với status tùy theo role
   * 
   * Logic tương tự CreateVatInvoice:
   * - KẾ TOÁN: Tạo và gửi cho KTT duyệt (status 6 - PENDING_APPROVAL)
   * - KẾ TOÁN TRƯỞNG: Tạo với trạng thái chờ ký (status 7 - PENDING_SIGN)
   * 
   * @param invoiceStatusID - Status ID để tạo invoice (6 hoặc 7)
   * @param statusLabel - Label hiển thị trong snackbar
   */
  const handleSubmitAdjustmentInvoice = async (invoiceStatusID: number, statusLabel: string = 'Tạo hóa đơn điều chỉnh') => {
    // ⭐ Lấy user ID từ token TRƯỚC (để error handler cũng access được)
    const performedByUserId = getUserIdFromToken()
    
    try {
      // ========== VALIDATION ==========
      
      // 1. Validate có hóa đơn gốc không
      if (!originalInvoiceId || !originalInvoice) {
        setSnackbar({
          open: true,
          message: '⚠️ Không tìm thấy hóa đơn gốc',
          severity: 'warning'
        })
        return
      }
      
      // 2. Validate template
      if (!selectedTemplate || !selectedTemplate.templateID || selectedTemplate.templateID <= 0) {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng chọn mẫu hóa đơn hợp lệ',
          severity: 'warning'
        })
        return
      }
      
      // 3. ❌ REMOVED: Validate reference text
      // Backend tự động tạo reference text từ thông tin hóa đơn gốc
      // Frontend chỉ hiển thị preview, không gửi lên backend
      
      // 4. Validate adjustment reason
      if (!adjustmentReason || adjustmentReason.trim().length < 10) {
        setSnackbar({
          open: true,
          message: '⚠️ Vui lòng nhập lý do điều chỉnh (tối thiểu 10 ký tự)',
          severity: 'warning'
        })
        return
      }
      
      // 5. Validate có ít nhất 1 item có adjustment
      const hasAdjustment = items.some(item => 
        item.adjustmentQuantity !== 0 || item.adjustmentPrice !== 0
      )
      
      if (!hasAdjustment) {
        setSnackbar({
          open: true,
          message: '⚠️ Chưa có sản phẩm nào được điều chỉnh. Vui lòng nhập số lượng hoặc đơn giá điều chỉnh.',
          severity: 'warning'
        })
        return
      }
      
      // 6. Validate không được để số âm sau điều chỉnh
      const negativeItems = items.filter(item => {
        const finalQty = item.originalQuantity + item.adjustmentQuantity
        const finalPrice = item.originalPrice + item.adjustmentPrice
        return finalQty < 0 || finalPrice < 0
      })
      
      if (negativeItems.length > 0) {
        const errorDetails = negativeItems.map(item => 
          `${item.name}: ${item.originalQuantity} + (${item.adjustmentQuantity}) = ${item.originalQuantity + item.adjustmentQuantity}`
        ).join('\n')
        
        setSnackbar({
          open: true,
          message: `⚠️ Có ${negativeItems.length} sản phẩm có giá trị âm sau điều chỉnh:\n${errorDetails}`,
          severity: 'error'
        })
        return
      }
      
      // ========== BUILD REQUEST ==========
      
      setIsSubmitting(true)
      
      // ⭐ User ID đã lấy từ token ở đầu function
      const userId = performedByUserId
      
      console.log('🔍 [CreateAdjustmentInvoice] User ID from token:', userId)
      console.log('🔍 [CreateAdjustmentInvoice] Current user role:', user?.role)
      
      if (!userId || userId === 0 || isNaN(userId)) {
        console.error('❌ Invalid user ID:', userId)
        setSnackbar({
          open: true,
          message: '❌ Không xác định được user ID. Vui lòng đăng nhập lại.',
          severity: 'error'
        })
        setIsSubmitting(false)
        return
      }
      
      // 🛡️ Validate originalInvoiceId
      const originalInvoiceIdNum = Number(originalInvoiceId)
      if (!originalInvoiceIdNum || isNaN(originalInvoiceIdNum) || originalInvoiceIdNum <= 0) {
        console.error('❌ Invalid originalInvoiceId:', originalInvoiceId)
        setSnackbar({
          open: true,
          message: '❌ ID hóa đơn gốc không hợp lệ. Vui lòng thử lại.',
          severity: 'error'
        })
        setIsSubmitting(false)
        return
      }
      
      // 🛡️ Validate templateId
      const templateIdNum = selectedTemplate?.templateID || 0
      if (!templateIdNum || templateIdNum <= 0) {
        console.error('❌ Invalid templateId:', templateIdNum)
        setSnackbar({
          open: true,
          message: '❌ Vui lòng chọn mẫu hóa đơn.',
          severity: 'error'
        })
        setIsSubmitting(false)
        return
      }
      
      // ✅ Chỉ gửi những item CÓ điều chỉnh VÀ có đầy đủ thông tin
      const adjustmentItems = items
        .filter(item => {
          // ✅ Phải có productId (đã chọn sản phẩm)
          if (!item.productId) {
            console.warn('⚠️ Skipping item without productId:', item)
            return false
          }
          
          // ✅ Phải có điều chỉnh (qty hoặc price khác 0)
          const hasAdjustment = item.adjustmentQuantity !== 0 || item.adjustmentPrice !== 0
          if (!hasAdjustment) {
            console.log('ℹ️ Skipping item without adjustment:', item.name)
            return false
          }
          
          return true
        })
        .map(item => {
          const adjustmentItem = {
            productID: item.productId!,
            quantity: item.adjustmentQuantity,        // Số lượng điều chỉnh (+/-)
            unitPrice: item.adjustmentPrice,          // Đơn giá điều chỉnh (+/-)
            overrideVATRate: item.vatRate,            // VAT rate (optional)
          }
          
          console.log('📦 Mapping adjustment item:', {
            productName: item.name,
            productID: item.productId,
            adjustmentQty: item.adjustmentQuantity,
            adjustmentPrice: item.adjustmentPrice,
            vatRate: item.vatRate,
            // Debug info
            originalQty: item.originalQuantity,
            originalPrice: item.originalPrice,
            finalQty: item.finalQuantity,
            finalPrice: item.finalPrice,
          })
          
          // 🛡️ Validate adjustment item data
          if (!adjustmentItem.productID || adjustmentItem.productID <= 0) {
            console.error('❌ Invalid productID in adjustment item:', adjustmentItem)
            throw new Error(`Sản phẩm "${item.name}" thiếu thông tin ID`)
          }
          
          if (isNaN(adjustmentItem.quantity) || isNaN(adjustmentItem.unitPrice)) {
            console.error('❌ Invalid number in adjustment item:', adjustmentItem)
            throw new Error(`Sản phẩm "${item.name}" có giá trị không hợp lệ`)
          }
          
          return adjustmentItem
        })
      
      // 🛡️ Validation: Phải có ít nhất 1 item có điều chỉnh
      if (adjustmentItems.length === 0) {
        setSnackbar({
          open: true,
          message: '❌ Không có sản phẩm nào được điều chỉnh.\n\n💡 Vui lòng nhập số lượng hoặc giá điều chỉnh cho ít nhất 1 sản phẩm.',
          severity: 'error'
        })
        setIsSubmitting(false)
        return
      }
      
      // ⭐ REQUEST STRUCTURE - KHỞP VỚI BACKEND API SPEC
      // Backend API: POST /api/Invoice/adjustment
      // Fields: originalInvoiceId, templateId, adjustmentReason, performedBy, adjustmentItems, rootPath?
      
      const requestData: CreateAdjustmentInvoiceRequest = {
        originalInvoiceId: originalInvoiceIdNum,
        templateId: templateIdNum,
        adjustmentReason: adjustmentReason.trim(),  // ✅ Backend field
        performedBy: userId,
        adjustmentItems,
        invoiceStatusID,  // ⚠️ PENDING: Chờ backend support field này
        // rootPath: undefined  // ✅ Optional - backend tự lấy từ config
      }
      
      // 🔍 ENHANCED LOGGING for debugging
      console.group('📤 ADJUSTMENT INVOICE REQUEST')
      console.log(`Status: ${invoiceStatusID} - ${statusLabel}`)
      console.log(`👤 Performed By (User ID from TOKEN): ${userId} (type: ${typeof userId})`)
      console.log(`🏢 Company ID: ${company?.companyID || 'N/A'}`)
      console.log(`Original Invoice ID: ${originalInvoiceIdNum} (type: ${typeof originalInvoiceIdNum})`)
      console.log(`Template ID: ${templateIdNum} (type: ${typeof templateIdNum})`)
      console.log(`Adjustment Reason: "${adjustmentReason.trim()}"`)
      console.log(`Performed By: ${userId} (type: ${typeof userId})`)
      console.log(`Items Count: ${adjustmentItems.length}`)
      
      // 🔍 DETAILED VALIDATION
      console.log('\n🔍 VALIDATION CHECK:')
      console.log('Original Invoice exists:', !!originalInvoice)
      console.log('Original Invoice ID:', originalInvoice?.invoiceID)
      console.log('Original Invoice Status:', originalInvoice?.invoiceStatusID)
      console.log('Template selected:', !!selectedTemplate)
      console.log('Template object:', selectedTemplate)
      console.log('Template ID:', selectedTemplate?.templateID)
      console.log('Template Name:', selectedTemplate?.templateName)
      console.log('Template Serial:', selectedTemplate?.serial)
      
      console.log('\nFull Request:', JSON.stringify(requestData, null, 2))
      console.log('Adjustment Items Detail:')
      adjustmentItems.forEach((item, idx) => {
        console.log(`  [${idx}]:`, {
          productID: item.productID,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          overrideVATRate: item.overrideVATRate,
          types: {
            productID: typeof item.productID,
            quantity: typeof item.quantity,
            unitPrice: typeof item.unitPrice,
            overrideVATRate: typeof item.overrideVATRate,
          }
        })
      })
      console.groupEnd()
      
      // 🛡️ Final validation: Check all productIDs are valid numbers
      const invalidItems = adjustmentItems.filter(item => 
        !item.productID || typeof item.productID !== 'number' || item.productID <= 0
      )
      
      if (invalidItems.length > 0) {
        console.error('❌ Invalid productIDs found:', invalidItems)
        setSnackbar({
          open: true,
          message: `❌ Có ${invalidItems.length} sản phẩm thiếu thông tin.\n\n💡 Vui lòng chọn lại sản phẩm từ dropdown.`,
          severity: 'error'
        })
        setIsSubmitting(false)
        return
      }
      
      // 🛡️ Additional validation: Check for suspicious data
      adjustmentItems.forEach(item => {
        const hasZeroPrice = item.unitPrice === 0
        const hasZeroQty = item.quantity === 0
        const hasNegativePrice = item.unitPrice < 0
        const hasNegativeQty = item.quantity < 0
        
        // Log warning for zero/negative values
        if (hasZeroPrice || hasZeroQty || hasNegativePrice || hasNegativeQty) {
          console.warn(`⚠️ Suspicious item data:`, {
            productID: item.productID,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            hasZeroPrice,
            hasZeroQty,
            hasNegativePrice,
            hasNegativeQty
          })
        }
      })
      
      // ========== CREATE ADJUSTMENT INVOICE ==========
      
      const response = await invoiceService.createAdjustmentInvoice(requestData)
      
      console.log('✅ Adjustment invoice created:', response)
      
      // ⚠️ Backend trả về invoiceId có thể là object hoặc number
      const createdInvoiceId = typeof response.invoiceId === 'object' 
        ? (response.invoiceId as { value?: number; invoiceID?: number })?.value || (response.invoiceId as { value?: number; invoiceID?: number })?.invoiceID || 0
        : response.invoiceId
      
      console.log('🔍 Invoice ID extracted:', { raw: response.invoiceId, parsed: createdInvoiceId, type: typeof createdInvoiceId })
      
      // ========== SUCCESS HANDLING ==========
      
      let successMessage = ''
      
      if (invoiceStatusID === 6) {
        // Pending Approval - Accountant
        successMessage = `✅ Gửi hóa đơn điều chỉnh chờ duyệt thành công! (ID: ${createdInvoiceId})\n📋 Hóa đơn đang chờ phê duyệt từ Kế toán trưởng.`
      } else if (invoiceStatusID === 7) {
        // Pending Sign - HOD
        successMessage = `✅ Tạo hóa đơn điều chỉnh thành công! (ID: ${createdInvoiceId})\n🔐 Hóa đơn ở trạng thái Chờ ký, bạn có thể ký số ngay.`
      } else {
        // Default/Other statuses
        successMessage = createdInvoiceId
          ? `✅ ${statusLabel} thành công!\n📄 Mã hóa đơn: ${response.fullInvoiceCode || response.invoiceNumber || createdInvoiceId}\n💰 Số tiền điều chỉnh: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(response.adjustmentAmount || totals.total)}`
          : `✅ ${statusLabel} thành công!`
      }
      
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      })
      
      // ⭐ Navigate dựa trên role: HOD → /approval/invoices, Others → /invoices
      setTimeout(() => {
        if (user?.role === USER_ROLES.HOD) {
          // KẾ TOÁN TRƯởNG: Chuyển về trang Duyệt hóa đơn
          console.log('🎯 HOD: Redirecting to /approval/invoices (Adjustment)')
          navigate('/approval/invoices')
        } else {
          // KẾ TOÁN & OTHERS: Chuyển về trang Danh sách hóa đơn
          console.log('🎯 Accountant/Others: Redirecting to /invoices (Adjustment)')
          navigate('/invoices')
        }
      }, 2000)
      
    } catch (error: unknown) {
      console.group('❌ ERROR CREATING ADJUSTMENT INVOICE')
      console.error('Error object:', error)
      
      let errorMessage = 'Lỗi khi tạo hóa đơn điều chỉnh'
      let errorDetails = ''
      
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      // Parse Axios error
      const axiosError = error as { 
        response?: { 
          status?: number
          data?: { 
            message?: string
            detail?: string
            title?: string
            errors?: Record<string, string[]> 
          } 
        } 
      }
      
      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status)
        console.error('Response data:', axiosError.response.data)
        
        const data = axiosError.response.data
        
        // Handle backend error message
        if (data?.message) {
          errorMessage = data.message
        } else if (data?.detail) {
          errorMessage = data.detail
          errorDetails = `\n\n🔍 Chi tiết: ${data.detail}`
          
          // Specific error analysis
          if (data.detail.includes('Object reference not set')) {
            errorDetails += '\n\n⚠️ Backend đang gặp lỗi NULL REFERENCE:'
            errorDetails += '\n\n🔍 Các nguyên nhân có thể:'
            errorDetails += `\n• ⭐ User ID ${performedByUserId} không tồn tại trong database hoặc thiếu dữ liệu`
            errorDetails += `\n• ⭐ User không có Company liên kết (CompanyID = null)`
            errorDetails += `\n• Hóa đơn gốc ID ${originalInvoice?.invoiceID || 'N/A'} không tồn tại hoặc đã bị xóa`
            errorDetails += `\n• Template ID ${selectedTemplate?.templateID || 'N/A'} không tồn tại`
            errorDetails += '\n• Template.Serial hoặc SerialNumber bị NULL'
            errorDetails += '\n• Sản phẩm không tồn tại trong hệ thống'
            errorDetails += '\n• Backend thiếu xử lý null cho một field nào đó'
            errorDetails += '\n\n💡 Hãy thử:'
            errorDetails += '\n1. ⭐ Kiểm tra USER ID trong database (performedBy)'
            errorDetails += '\n2. ⭐ Kiểm tra User có CompanyID không'
            errorDetails += '\n3. Kiểm tra Template và Serial có đầy đủ không'
            errorDetails += '\n4. Check backend logs để biết chính xác line nào bị NULL'
            errorDetails += '\n5. Nếu vẫn lỗi → Liên hệ backend developer'
            errorDetails += '\n\n📊 Debug info:'
            errorDetails += `\n• User ID (from token): ${performedByUserId}`
            errorDetails += `\n• Company ID: ${company?.companyID || 'NULL - ĐÂY CÓ THỂ LÀ VẤN ĐỀ!'}`
            errorDetails += `\n• Original Invoice: ${originalInvoice?.invoiceNumber || 'N/A'} (Status: ${originalInvoice?.invoiceStatusID})`
            errorDetails += `\n• Template: ${selectedTemplate?.templateName || 'N/A'}`
          }
        } else if (data?.title) {
          errorMessage = data.title
        }
        
        // Handle validation errors
        if (data?.errors) {
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n')
          errorDetails += `\n\n📋 Validation errors:\n${validationErrors}`
        }
      }
      
      console.groupEnd()
      
      setSnackbar({
        open: true,
        message: errorMessage + errorDetails,
        severity: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== ROLE-BASED SUBMIT FUNCTIONS ====================
  
  /**
   * ⭐ KẾ TOÁN: Lưu hóa đơn điều chỉnh dưới dạng nháp
   * Status: 1 (DRAFT - Nháp)
   * 
   * Flow: Kế toán tạo nháp → Sau đó từ danh sách “Gửi duyệt” riêng
   */
  const handleSaveDraft = async () => {
    await handleSubmitAdjustmentInvoice(1, 'Lưu hóa đơn điều chỉnh nháp')
  }

  /**
   * ⭐ KẾ TOÁN: Gửi hóa đơn điều chỉnh cho kế toán trưởng duyệt
   * Status: 6 (PENDING_APPROVAL - Chờ duyệt)
   * 
   * Flow: Kế toán tạo → Gửi cho KTT → KTT duyệt → Chờ ký
   */
  const handleSubmitForApproval = async () => {
    await handleSubmitAdjustmentInvoice(6, 'Gửi hóa đơn điều chỉnh chờ duyệt')
  }

  /**
   * ⭐ KẾ TOÁN TRƯỞNG: Tạo hóa đơn điều chỉnh với trạng thái chờ ký
   * Status: 7 (PENDING_SIGN - Chờ ký)
   * 
   * Flow: KTT tạo → Chờ ký → Ký số → Gửi CQT
   * Lưu ý: KTT không cần gửi duyệt vì tự duyệt
   */
  const handleCreateInvoiceHOD = async () => {
    await handleSubmitAdjustmentInvoice(7, 'Tạo hóa đơn điều chỉnh chờ ký')
  }

  // ==================== OTHER HANDLERS ====================

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
      field: 'originalQuantity',
      headerName: 'SL Gốc',
      width: 80,
      type: 'number',
      editable: false,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#999' }}>
            {params.value || 0}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'adjustmentQuantity',
      headerName: 'SL Đ/C (+/-)',
      width: 110,
      type: 'number',
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.8125rem',
              color: params.value === 0 ? '#bbb' : (params.value > 0 ? '#2e7d32' : '#d32f2f'),
              fontWeight: params.value === 0 ? 400 : 700
            }}
          >
            {params.value > 0 ? `+${params.value}` : params.value || 0}
          </Typography>
        </Box>
      ),
      renderEditCell: (params) => <QuantityEditCell {...params} />,
    },
    {
      field: 'originalPrice',
      headerName: 'ĐG Gốc',
      width: 120,
      type: 'number',
      editable: false,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#999' }}>
            {params.value ? Number(params.value).toLocaleString('vi-VN') : '0'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'adjustmentPrice',
      headerName: 'ĐG Đ/C (+/-)',
      width: 130,
      type: 'number',
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.8125rem',
              color: params.value === 0 ? '#bbb' : (params.value > 0 ? '#2e7d32' : '#d32f2f'),
              fontWeight: params.value === 0 ? 400 : 700
            }}
          >
            {params.value > 0 ? `+${Number(params.value).toLocaleString('vi-VN')}` : 
             params.value < 0 ? Number(params.value).toLocaleString('vi-VN') : '0'}
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
    {
      field: 'adjustmentAmount',
      headerName: 'Thành tiền Đ/C',
      width: 150,
      type: 'number',
      editable: false,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => {
        // Get the row data to access adjustmentAmount
        const row = params.row as InvoiceItem
        const adjustmentValue = row.adjustmentAmount || 0
        
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: '100%',
              backgroundColor: '#fffbf0',
              borderLeft: '3px solid #ff9800'
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.875rem', 
                fontWeight: 700,
                color: adjustmentValue === 0 ? '#bbb' : (adjustmentValue > 0 ? '#2e7d32' : '#d32f2f')
              }}
            >
              {adjustmentValue === 0 ? '0' : 
               adjustmentValue > 0 ? `+${Number(adjustmentValue).toLocaleString('vi-VN')}` :
               Number(adjustmentValue).toLocaleString('vi-VN')}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 110, // Tăng width để chứa 2 nút
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%', height: '100%' }}>
          {/* 🎯 Nút trả hàng toàn bộ */}
          <Tooltip title="Trả hàng toàn bộ (SL Đ/C = -SL Gốc)" arrow>
            <IconButton
              size="small"
              onClick={() => {
                const updatedItems = items.map(item => 
                  item.id === params.row.id 
                    ? { 
                        ...item, 
                        adjustmentQuantity: -item.originalQuantity,
                        adjustmentAmount: 0 - (item.originalQuantity * item.originalPrice),
                        totalAfterTax: 0 - (item.originalQuantity * item.originalPrice)
                      }
                    : item
                )
                setItems(updatedItems)
                console.log(`🔄 Trả toàn bộ: ${params.row.name} (-${params.row.originalQuantity})`)
              }}
              sx={{
                padding: '4px',
                color: '#ff6f00',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#fff3e0',
                  color: '#e65100',
                },
              }}
            >
              <Undo sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header NGOÀI Paper */}
      <Box sx={{ px: 2, py: 1.5, maxWidth: '1600px', margin: '0 auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Hóa đơn điều chỉnh
          </Typography>
        </Stack>
      </Box>

      {/* Alert: Thông tin hóa đơn gốc - NGOÀI Paper */}
      <Box sx={{ px: 2, pb: 1, maxWidth: '1600px', margin: '0 auto' }}>
        {loadingOriginalInvoice ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : originalInvoice ? (
          <Alert 
            severity="info" 
            icon={<Info />}
            sx={{ 
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.875rem' }}>
                Điều chỉnh tăng hoặc giảm giá trị hóa đơn đã phát hành
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Hóa đơn gốc: #{originalInvoice.invoiceNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Phát hành ngày: {new Date(originalInvoice.signDate).toLocaleDateString('vi-VN')} • 
                    Giá trị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalInvoice.totalAmount)}
                  </Typography>
                </Box>
                <Chip 
                  label={originalInvoice.taxStatusName || 'Đã phát hành'} 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 500, fontSize: '0.75rem' }} 
                />
              </Stack>
            </Stack>
          </Alert>
        ) : originalInvoiceId ? (
          <Alert severity="warning">
            Không tìm thấy hóa đơn gốc với ID: {originalInvoiceId}
          </Alert>
        ) : null}
      </Box>

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
                HÓA ĐƠN ĐIỀU CHỈNH - GIÁ TRỊ GIA TĂNG
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
                        ⚠️ Loại hóa đơn điều chỉnh PHẢI GIỐNG hóa đơn gốc
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
                {/* READ-ONLY: Thông tin người mua từ hóa đơn gốc */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    {invoiceType === 'B2B' ? 'Mã Số Thuế:' : 'CCCD:'}
                  </Typography>
                  <TextField
                    size="small"
                    placeholder={invoiceType === 'B2B' ? '0101243150 (10 số) hoặc 0101243150136 (13 số)' : '001234567890 (12 số)'}
                    variant="standard"
                    value={buyerTaxCode}
                    disabled
                    sx={{ width: 160, fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }}
                  />
                  <Chip label="Từ hóa đơn gốc" size="small" color="default" sx={{ fontSize: '0.7rem' }} />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    {invoiceType === 'B2B' ? 'Tên đơn vị:' : 'Tên Khách Hàng:'}
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={invoiceType === 'B2B' ? 'CÔNG TY CỔ PHẦN MISA' : 'Nguyễn Văn A'}
                    variant="standard"
                    value={buyerCompanyName}
                    disabled
                    sx={{ fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }}
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
                    disabled
                    sx={{ fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }}
                  />
                </Stack>

                {/* ✅ Chỉ hiện field "Người mua hàng" khi ở chế độ B2B */}
                {invoiceType === 'B2B' && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                      Người mua hàng:
                    </Typography>
                    <TextField size="small" placeholder="Kế toán A" variant="standard" value={buyerName} disabled sx={{ width: 160, fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }} />
                    <Typography variant="caption" sx={{ minWidth: 50, fontSize: '0.8125rem' }}>
                      Email:
                    </Typography>
                    <TextField size="small" placeholder="hoadon@gmail.com" variant="standard" value={buyerEmail} disabled sx={{ flex: 1, fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }} />
                  </Stack>
                )}

                {/* ✅ Khi B2C thì hiện Email ở dòng riêng */}
                {invoiceType === 'B2C' && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                      Email:
                    </Typography>
                    <TextField size="small" placeholder="hoadon@gmail.com" variant="standard" value={buyerEmail} disabled sx={{ flex: 1, fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }} />
                  </Stack>
                )}

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Số điện thoại:
                  </Typography>
                  <TextField size="small" variant="standard" value={buyerPhone} disabled sx={{ width: 160, fontSize: '0.8125rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } }} />
                  <Typography variant="caption" sx={{ minWidth: 80, fontSize: '0.8125rem' }}>
                    Hình thức TT:
                  </Typography>
                  <TextField
                    size="small"
                    variant="standard"
                    value={paymentMethod}
                    disabled
                    sx={{ 
                      width: 150, 
                      fontSize: '0.8125rem', 
                      '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#666' } 
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* ✅ THÔNG TIN HÓA ĐƠN ĐIỀU CHỈNH */}
          <Stack spacing={1.5} sx={{ mb: 2, p: 2, bgcolor: '#fff8e1', borderRadius: 1, border: '1px solid #ffd54f' }}>
            <Typography variant="caption" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#f57c00' }}>
              📋 Thông tin hóa đơn điều chỉnh (bắt buộc)
            </Typography>
            
            {/* Dòng tham chiếu */}
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Dòng tham chiếu: <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="VD: Điều chỉnh (tăng/giảm) cho hóa đơn Mẫu số 01GTKT3/001 Ký hiệu C24TAA Số 0000123 ngày 15 tháng 12 năm 2024"
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                helperText="ℹ️ Hệ thống sẽ tự động tạo dòng tham chiếu chuẩn theo quy định"
                disabled  // ✅ Disable vì backend tự tạo
                sx={{ 
                  bgcolor: '#f5f5f5',  // Grey background cho disabled field
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8125rem'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
                    color: '#666'
                  }
                }}
              />
            </Stack>
            
            {/* Lý do điều chỉnh */}
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Lý do điều chỉnh: <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="VD: Khách hàng trả lại 2 sản phẩm do không đúng quy cách"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                helperText={`${adjustmentReason.length}/10 ký tự tối thiểu`}
                error={adjustmentReason.length > 0 && adjustmentReason.length < 10}
                sx={{ 
                  bgcolor: '#fff',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8125rem'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem'
                  }
                }}
              />
            </Stack>
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
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddRow}
              startIcon={<Add fontSize="small" />}
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                borderColor: '#1976d2',
                fontSize: '0.8125rem',
                py: 0.5,
                px: 1.5,
                '&:hover': { 
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  borderColor: '#1976d2'
                }
              }}>
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

            {/* Buttons phải */}
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
                // KẾ TOÁN TRƯỞNG: Tạo hóa đơn điều chỉnh (Chờ ký)
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
                  {isSubmitting ? 'Đang xử lý...' : '📝 Tạo hóa đơn điều chỉnh (Chờ ký)'}
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
                  config={mapTemplateToConfig!}
                  products={mapItemsToProducts}
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
                  customerInfo={mapBuyerToCustomerInfo}
                  paymentMethod={paymentMethod}
                  invoiceNumber={undefined} // ⚠️ KHÔNG CÓ MÃ HÓA ĐƠN - chưa tạo
                  taxAuthorityCode={null} // ⚠️ KHÔNG CÓ MÃ CQT - chưa đồng bộ
                  backgroundFrame={selectedTemplate?.frameUrl || ''}
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

        {/* ✅ Dialog xác nhận hủy bỏ */}
        <Dialog
          open={cancelDialog}
          onClose={handleCancelDialogClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Close sx={{ color: '#f57c00' }} />
              Xác nhận hủy bỏ
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Bạn có chắc chắn muốn hủy bỏ việc tạo hóa đơn điều chỉnh?
              {originalInvoiceId && (
                <><br /><br />Bạn sẽ được quay lại trang chi tiết hóa đơn gốc.</>
              )}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCancelDialogClose}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Tiếp tục chỉnh sửa
            </Button>
            <Button
              onClick={handleConfirmCancel}
              variant="contained"
              size="small"
              color="error"
              sx={{ textTransform: 'none' }}
            >
              Hủy bỏ
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default CreateVatInvoice
