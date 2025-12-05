import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import invoiceService, { Template } from '@/services/invoiceService'
import customerService from '@/services/customerService'
import productService, { Product } from '@/services/productService'
import companyService, { Company } from '@/services/companyService'
import { mapToBackendInvoiceRequest } from '@/utils/invoiceAdapter'
import { numberToWords } from '@/utils/numberToWords'
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
} from '@mui/material'
import {
  HelpOutline,
  Info,
  Public,
  VerifiedUser,
  ExpandMore,
  Settings,
  Send,
  Visibility,
  Close,
  Save,
  Publish,
  KeyboardArrowUp,
  KeyboardArrowDown,
  DeleteOutline,
} from '@mui/icons-material'
import SendInvoiceEmailModal from '@/components/SendInvoiceEmailModal'
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams } from '@mui/x-data-grid'

// Interface cho hàng hóa/dịch vụ
interface InvoiceItem {
  id: number
  stt: number
  type: string
  code: string
  name: string
  unit: string
  quantity: number
  priceAfterTax: number
  discountPercent: number // Tỷ lệ chiết khấu (%)
  discountAmount: number // Tiền chiết khấu
  totalAfterTax: number
}

// Component edit cell cho Tên hàng hóa/Dịch vụ
const ProductNameEditCell = (params: GridRenderEditCellParams & { products?: Product[], onProductSelect?: (rowId: string | number, product: Product) => void }) => {
  const [inputValue, setInputValue] = useState(params.value || '')
  const availableProducts = params.products || []

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    params.api.setEditCellValue({ id: params.id, field: params.field, value: newValue })
    
    // Tìm product được chọn và lưu productId
    const selectedProduct = availableProducts.find(p => p.name === newValue)
    if (selectedProduct && params.onProductSelect) {
      params.onProductSelect(params.id, selectedProduct)
      // Cập nhật unit tự động
      params.api.setEditCellValue({ id: params.id, field: 'unit', value: selectedProduct.unit })
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
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              maxHeight: 200,
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
        <MenuItem value="" disabled sx={{ fontSize: '0.8125rem', color: '#999' }}>
          {availableProducts.length === 0 ? '-- Đang tải sản phẩm... --' : '-- Chọn sản phẩm --'}
        </MenuItem>
        {availableProducts.map((product) => (
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
            {product.name} ({product.code})
          </MenuItem>
        ))}
      </Select>
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


const CreateVatInvoice: React.FC = () => {
  const navigate = useNavigate()

  // Template states
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  
  // Product states
  const [products, setProducts] = useState<Product[]>([])
  
  // Company states
  const [company, setCompany] = useState<Company | null>(null)
  
  const [isPaid, setIsPaid] = useState(false)
  const [showTypeColumn, setShowTypeColumn] = useState(true)
  const [discountType, setDiscountType] = useState<string>('none') // 'none' | 'per-item' | 'total'
  const [vatRate, setVatRate] = useState<number>(10) // Thuế GTGT: 0, 5, 10
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
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
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt') // Hình thức thanh toán
  
  // State cho customer lookup
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [customerNotFound, setCustomerNotFound] = useState(false)
  
  // Function: Tự động tìm và điền thông tin khách hàng theo MST
  const handleTaxCodeLookup = async (taxCode: string) => {
    if (!taxCode || taxCode.trim().length < 10) {
      setCustomerNotFound(false)
      return
    }
    
    try {
      setIsSearchingCustomer(true)
      setCustomerNotFound(false)
      
      const customers = await customerService.getAllCustomers()
      const foundCustomer = customers.find(c => c.taxCode === taxCode.trim())
      
      if (foundCustomer) {
        // Tự động điền thông tin
        setBuyerCustomerID(foundCustomer.customerID) // ✅ Lưu customer ID
        setBuyerCompanyName(foundCustomer.customerName)
        setBuyerAddress(foundCustomer.address)
        setBuyerEmail(foundCustomer.contactEmail)
        setBuyerPhone(foundCustomer.contactPhone)
        // buyerName is independent - user can enter manually
        
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
  
  // Handle product selection - lưu productId vào item
  const handleProductSelect = useCallback((rowId: string | number, product: Product) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === rowId 
          ? { ...item, productId: product.id, name: product.name, unit: product.unit }
          : item
      )
    )
    console.log(`✅ Selected product for row ${rowId}:`, product.name, `(ID: ${product.id})`)
  }, [])
  
  // Handle tax code change with debounce
  const handleTaxCodeChange = (value: string) => {
    setBuyerTaxCode(value)
    setCustomerNotFound(false)
  }
  
  // Handle tax code blur (trigger lookup)
  const handleTaxCodeBlur = () => {
    if (buyerTaxCode && buyerTaxCode.trim().length >= 10) {
      handleTaxCodeLookup(buyerTaxCode)
    }
  }

  const handleOpenSendEmailModal = () => {
    setSendEmailModalOpen(true)
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
    // priceAfterTax là giá CHƯA thuế (vì calculateAfterTax = false)
    // Tính tổng tiền hàng (CHƯA bao gồm thuế, chưa trừ chiết khấu)
    const subtotalBeforeDiscount = currentItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.priceAfterTax
      return sum + itemTotal
    }, 0)

    // Tính tổng tiền chiết khấu
    const totalDiscount = currentItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0)

    // Tổng tiền sau chiết khấu (VẪN chưa bao gồm thuế)
    const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscount

    // Tính thuế GTGT = subtotalAfterDiscount × (vatRate/100)
    const tax = Math.round(subtotalAfterDiscount * (vatRate / 100))
    
    // Tổng tiền thanh toán = subtotalAfterDiscount + thuế
    const total = subtotalAfterDiscount + tax

    return {
      subtotal: Math.round(subtotalAfterDiscount),     // Tổng tiền hàng CHƯA thuế (sau CK)
      discount: Math.round(totalDiscount),             // Chiết khấu
      subtotalAfterDiscount: Math.round(subtotalAfterDiscount), // Sau chiết khấu, chưa thuế
      tax: Math.round(tax),                            // Tiền thuế VAT
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

  // Hàm lấy user ID từ token (cần implement)
  // Hàm submit hóa đơn
  // ⭐ Handler chung để xử lý submit
  const handleSubmitInvoice = async (invoiceStatusID: number, statusLabel: string) => {
    try {
      // Validate
      if (!selectedTemplate) {
        setSnackbar({
          open: true,
          message: 'Vui lòng chọn mẫu hóa đơn',
          severity: 'warning'
        })
        return
      }

      // Validate templateID exists
      if (!selectedTemplate.templateID || selectedTemplate.templateID <= 0) {
        setSnackbar({
          open: true,
          message: `Template không hợp lệ (ID: ${selectedTemplate.templateID}). Vui lòng chọn template khác.`,
          severity: 'error'
        })
        console.error('❌ Invalid template:', selectedTemplate)
        return
      }

      if (!buyerCompanyName || !buyerAddress) {
        setSnackbar({
          open: true,
          message: 'Vui lòng điền tên đơn vị và địa chỉ người mua',
          severity: 'warning'
        })
        return
      }

      if (items.length === 0) {
        setSnackbar({
          open: true,
          message: 'Vui lòng thêm ít nhất một sản phẩm',
          severity: 'warning'
        })
        return
      }

      setIsSubmitting(true)

      // Map frontend state sang backend request
      const backendRequest = mapToBackendInvoiceRequest(
        selectedTemplate.templateID,
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
        vatRate,
        totals,
        paymentMethod, // Hình thức thanh toán từ dropdown
        5,              // minRows
        invoiceStatusID, // ⭐ Status: 1=Nháp, 6=Chờ duyệt
        invoiceNotes,   // Ghi chú hóa đơn
        0               // signedBy (0=chưa ký)
      )

      console.log(`📤 Sending invoice request (${statusLabel}):`, backendRequest)

      // Gọi API
      const response = await invoiceService.createInvoice(backendRequest)

      console.log('✅ Invoice created:', response)

      setSnackbar({
        open: true,
        message: `${statusLabel} thành công!`,
        severity: 'success'
      })

      // Navigate to invoice list after 1 second
      setTimeout(() => {
        navigate('/invoices')
      }, 1000)

    } catch (error: unknown) {
      console.error('❌ Error creating invoice:', error)
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi tạo hóa đơn'
      const apiError = error as { response?: { data?: { message?: string } } }
      setSnackbar({
        open: true,
        message: apiError.response?.data?.message || errorMessage,
        severity: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ⭐ Lưu nháp (invoiceStatusID = 1)
  const handleSaveDraft = async () => {
    await handleSubmitInvoice(1, 'Lưu hóa đơn nháp')
  }

  // ⭐ Gửi duyệt (invoiceStatusID = 6)
  const handleSubmitForApproval = async () => {
    await handleSubmitInvoice(6, 'Gửi hóa đơn chờ duyệt')
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
      vatRate,
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
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%', height: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
          <Info sx={{ fontSize: 16, color: '#1976d2', cursor: 'pointer' }} />
        </Box>
      ),
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
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Lập hóa đơn
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Đã thanh toán</Typography>}
          />
        </Stack>
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
                    placeholder="<Chưa cấp số>"
                    variant="outlined"
                    sx={{ fontSize: '0.8125rem' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Info fontSize="small" sx={{ color: '#1976d2' }} />
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

              {/* Thông tin người mua */}
              <Stack spacing={0.8}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    MST người mua:
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="0101243150-136"
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
                  <Button size="small" startIcon={<VerifiedUser sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, whiteSpace: 'nowrap' }}>
                    KT tình trạng hoạt động
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Tên đơn vị:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="CÔNG TY CỔ PHẦN MISA"
                    variant="standard"
                    value={buyerCompanyName}
                    onChange={(e) => setBuyerCompanyName(e.target.value)}
                    sx={{ fontSize: '0.8125rem' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <ExpandMore fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
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

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Người mua hàng:
                  </Typography>
                  <TextField size="small" placeholder="Kế toán A" variant="standard" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} sx={{ width: 160, fontSize: '0.8125rem' }} />
                  <Typography variant="caption" sx={{ minWidth: 50, fontSize: '0.8125rem' }}>
                    Email:
                  </Typography>
                  <TextField size="small" placeholder="hoadon@gmail.com" variant="standard" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} sx={{ flex: 1, fontSize: '0.8125rem' }} />
                </Stack>

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
                      width: 120,
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
                      value="Đổi trừ công nợ"
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
                      Đổi trừ công nợ
                    </MenuItem>
                    <MenuItem
                      value="Khác"
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
                      Khác
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

            {/* Dòng 1: Hiện cột + Loại tiền + Tỷ giá + Chiết khấu */}
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

              {/* Loại tiền */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Loại tiền:
                </Typography>
                <Select size="small" value="VND" variant="outlined" sx={{ width: 90, fontSize: '0.8125rem' }}>
                  <MenuItem value="VND">VND</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </Stack>

              {/* Tỷ giá */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Tỷ giá:
                </Typography>
                <TextField
                  size="small"
                  value="1,00"
                  variant="outlined"
                  sx={{
                    width: 80,
                    fontSize: '0.8125rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      fontSize: '0.8125rem',
                    },
                  }}
                />
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

          {/* Ô nhập ghi chú hóa đơn */}
          {showInvoiceNotes && (
            <Box sx={{ mb: 1.5 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Nhập ghi chú cho hóa đơn..."
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8125rem',
                    bgcolor: '#fafafa'
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

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Thuế GTGT:</Typography>
                  <Select 
                    size="small" 
                    value={vatRate} 
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    variant="standard" 
                    sx={{ 
                      width: 70, 
                      fontSize: '0.8125rem',
                      '& .MuiSelect-select': {
                        textAlign: 'center',
                        paddingLeft: '8px',
                      }
                    }}
                  >
                    <MenuItem value={0} sx={{ justifyContent: 'center' }}>0%</MenuItem>
                    <MenuItem value={5} sx={{ justifyContent: 'center' }}>5%</MenuItem>
                    <MenuItem value={10} sx={{ justifyContent: 'center' }}>10%</MenuItem>
                  </Select>
                </Stack>

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
                startIcon={<Settings fontSize="small" />}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Thêm trường mở rộng
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Send fontSize="small" />}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}
                onClick={handleOpenSendEmailModal}>
                Gửi hóa đơn nháp
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Visibility fontSize="small" />}
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
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Hủy bỏ
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save fontSize="small" />}
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                sx={{ textTransform: 'none', backgroundColor: '#1976d2', fontSize: '0.8125rem', py: 0.5 }}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu nháp'}
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<Publish fontSize="small" />}
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                sx={{ textTransform: 'none', backgroundColor: '#2e7d32', minWidth: 140, fontSize: '0.8125rem', py: 0.5 }}>
                Gửi cho KT Trưởng
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
      </Box>
    </Box>
  )
}

export default CreateVatInvoice
