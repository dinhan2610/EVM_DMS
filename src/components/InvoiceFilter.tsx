import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Collapse,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Autocomplete,
  Typography,
  Divider,
  Tooltip,
  Chip,
  Badge,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import { Dayjs } from 'dayjs'
import customerService from '@/services/customerService'
import { INVOICE_TYPE, INVOICE_TYPE_LABELS } from '@/services/invoiceService'

// Interface cho state của filter
export interface InvoiceFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  invoiceStatus: string[]
  taxStatus: string
  customer: string | null
  invoiceType: string[]
}

// Interface cho props
interface InvoiceFilterProps {
  onFilterChange?: (filters: InvoiceFilterState) => void
  onReset?: () => void
  totalResults?: number // Tổng số bản ghi
  filteredResults?: number // Số bản ghi sau khi lọc
  actionButton?: React.ReactNode // Nút action tùy chỉnh (ví dụ: Tạo hóa đơn)
}

// Dữ liệu mẫu cho Selects - đồng bộ với InvoiceManagement
const allInvoiceStatus = [
  'Nháp',
  'Đã ký',
  'Đã phát hành',
  'Đã gửi',
  'Bị từ chối',
  'Đã thanh toán',
  'Đã hủy',
]

const allTaxStatus = ['Chờ đồng bộ', 'Đã đồng bộ', 'Lỗi']

// Loại hóa đơn - Chỉ 3 loại: Gốc, Điều chỉnh, Thay thế
const allInvoiceTypes = [
  { value: INVOICE_TYPE.ORIGINAL, label: INVOICE_TYPE_LABELS[INVOICE_TYPE.ORIGINAL] },
  { value: INVOICE_TYPE.ADJUSTMENT, label: INVOICE_TYPE_LABELS[INVOICE_TYPE.ADJUSTMENT] },
  { value: INVOICE_TYPE.REPLACEMENT, label: INVOICE_TYPE_LABELS[INVOICE_TYPE.REPLACEMENT] },
]

const InvoiceFilter: React.FC<InvoiceFilterProps> = ({ 
  onFilterChange, 
  onReset,
  totalResults = 0,
  filteredResults = 0,
  actionButton,
}) => {
  // State quản lý việc ẩn/hiện bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State cho customers từ API
  const [customers, setCustomers] = useState<Array<{ label: string; value: string }>>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  // State quản lý tất cả giá trị lọc
  const [filters, setFilters] = useState<InvoiceFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    invoiceStatus: [],
    taxStatus: '',
    customer: null,
    invoiceType: [],
  })

  // Load customers từ API
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoadingCustomers(true)
        const data = await customerService.getActiveCustomers()
        const customerOptions = data
          .map((c) => ({
            label: c.customerName,
            value: c.customerName, // Dùng customerName làm giá trị filter
          }))
          .sort((a, b) => a.label.localeCompare(b.label, 'vi')) // Sắp xếp theo alphabet
        
        // Thêm option "Tất cả" vào đầu danh sách
        setCustomers([{ label: 'Tất cả khách hàng', value: 'ALL' }, ...customerOptions])
      } catch (error) {
        console.error('❌ Failed to load customers for filter:', error)
        setCustomers([{ label: 'Tất cả khách hàng', value: 'ALL' }])
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    loadCustomers()
  }, [])

  // Tính số lượng filters đang active (không đếm 'ALL')
  const getActiveFilterCount = useCallback(() => {
    let count = 0
    
    // Search text
    if (filters.searchText && filters.searchText.trim() !== '') count++
    
    // Date range
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    
    // Invoice status - chỉ đếm nếu không phải 'ALL' và có lựa chọn
    if (filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('ALL')) {
      count++
    }
    
    // Tax status
    if (filters.taxStatus && filters.taxStatus !== '') count++
    
    // Customer - chỉ đếm nếu không phải 'ALL'
    if (filters.customer && filters.customer !== 'ALL') count++
    
    // Invoice type - chỉ đếm nếu không phải 'ALL' và có lựa chọn
    if (filters.invoiceType.length > 0 && !filters.invoiceType.includes('ALL')) {
      count++
    }
    
    return count
  }, [filters])

  const activeFilterCount = getActiveFilterCount()

  // Ref để track lần đầu mount
  const isFirstMount = useRef(true)

  // Auto-apply filters khi thay đổi (trừ searchText vì cần debounce)
  useEffect(() => {
    // Bỏ qua lần đầu mount
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    
    // Chỉ auto-apply cho các field không phải searchText
    if (onFilterChange) {
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.invoiceStatus,
    filters.taxStatus,
    filters.customer,
    filters.invoiceType,
  ])

  // Debounced search - tự động apply sau 500ms
  useEffect(() => {
    // Bỏ qua lần đầu mount
    if (isFirstMount.current) {
      return
    }
    
    const timer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(filters)
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchText])

  // Handler chung cho các input
  const handleChange = (field: keyof InvoiceFilterState, value: unknown) => {
    let processedValue = value
    
    // Xử lý logic "Chọn tất cả" cho Trạng thái hóa đơn
    if (field === 'invoiceStatus' && Array.isArray(value)) {
      const hasSelectAll = value.includes('ALL')
      const prevHasSelectAll = filters.invoiceStatus.includes('ALL')
      
      if (hasSelectAll && !prevHasSelectAll) {
        // User vừa chọn "Tất cả" -> chọn tất cả options
        processedValue = ['ALL', ...allInvoiceStatus]
      } else if (!hasSelectAll && prevHasSelectAll) {
        // User vừa bỏ "Tất cả" -> bỏ chọn tất cả
        processedValue = []
      } else if (hasSelectAll && value.length < allInvoiceStatus.length + 1) {
        // User bỏ chọn một item -> tự động bỏ "Tất cả"
        processedValue = value.filter((v) => v !== 'ALL')
      } else if (!hasSelectAll && value.length === allInvoiceStatus.length) {
        // User chọn đủ tất cả items -> tự động thêm "Tất cả"
        processedValue = ['ALL', ...value]
      }
    }
    
    // Xử lý logic "Chọn tất cả" cho Loại hóa đơn
    if (field === 'invoiceType' && Array.isArray(value)) {
      const hasSelectAll = value.includes('ALL')
      const prevHasSelectAll = filters.invoiceType.includes('ALL')
      
      if (hasSelectAll && !prevHasSelectAll) {
        // User vừa chọn "Tất cả" -> chọn tất cả options
        processedValue = ['ALL', ...allInvoiceTypes.map((t) => String(t.value))]
      } else if (!hasSelectAll && prevHasSelectAll) {
        // User vừa bỏ "Tất cả" -> bỏ chọn tất cả
        processedValue = []
      } else if (hasSelectAll && value.length < allInvoiceTypes.length + 1) {
        // User bỏ chọn một item -> tự động bỏ "Tất cả"
        processedValue = value.filter((v) => v !== 'ALL')
      } else if (!hasSelectAll && value.length === allInvoiceTypes.length) {
        // User chọn đủ tất cả items -> tự động thêm "Tất cả"
        processedValue = ['ALL', ...value]
      }
    }
    
    setFilters((prev) => ({
      ...prev,
      [field]: processedValue,
    }))
  }

  // Xử lý reset bộ lọc
  const handleResetFilter = () => {
    const resetFilters: InvoiceFilterState = {
      searchText: '',
      dateFrom: null,
      dateTo: null,
      invoiceStatus: [],
      taxStatus: '',
      customer: null,
      invoiceType: [],
    }
    setFilters(resetFilters)
    if (onReset) {
      onReset()
    }
    if (onFilterChange) {
      onFilterChange(resetFilters)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          },
        }}>
        {/* Phần tìm kiếm và nút lọc - LUÔN TRÊN 1 HÀNG */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 1. Thanh Tìm kiếm */}
          <Box sx={{ flex: '1 1 auto', maxWidth: 480, minWidth: 200 }}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo Số HĐ, Ký hiệu, Tên khách hàng..."
              value={filters.searchText}
              onChange={(e) => handleChange('searchText', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#1976d2', fontSize: '1.3rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#f0f2f5',
                    '& fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    '& fieldset': {
                      borderColor: '#1976d2',
                      borderWidth: '2px',
                    },
                  },
                },
              }}
            />
          </Box>

          {/* 2. Nút Lọc */}
          <Tooltip title={advancedOpen ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'} arrow>
            <Box sx={{ flex: '0 0 auto', minWidth: 120 }}>
              <Badge 
                badgeContent={activeFilterCount} 
                color="primary"
                invisible={activeFilterCount === 0}
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 700,
                    minWidth: 20,
                    height: 20,
                    borderRadius: '10px',
                  },
                }}>
                <Button
                  fullWidth
                  variant={advancedOpen ? 'contained' : 'outlined'}
                  color="primary"
                  size="medium"
                  startIcon={<FilterListIcon sx={{ fontSize: '1.2rem' }} />}
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    height: 42,
                    borderRadius: 2,
                    borderWidth: advancedOpen ? '0' : '1.5px',
                    boxShadow: advancedOpen ? '0 2px 12px rgba(25, 118, 210, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: advancedOpen
                        ? '0 4px 16px rgba(25, 118, 210, 0.4)'
                        : '0 2px 8px rgba(25, 118, 210, 0.2)',
                    },
                  }}>
                  Lọc
                </Button>
              </Badge>
            </Box>
          </Tooltip>

          {/* 3. Nút Action (ví dụ: Tạo hóa đơn) */}
          {actionButton && (
            <Box sx={{ flex: '0 0 auto', ml: 'auto' }}>
              {actionButton}
            </Box>
          )}
        </Box>

        {/* === BỘ LỌC NÂNG CAO === */}
        <Collapse in={advancedOpen} timeout="auto">
          <Box sx={{ pt: 3, mt: 3 }}>
            {/* Tiêu đề */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              
              <Divider sx={{ flex: 1, borderColor: '#e3f2fd' }} />
            </Box>

            {/* Row 1: Thời gian & Trạng thái */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              📅 Thời gian & Trạng thái
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Từ ngày - Đến ngày */}
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <DatePicker
                  label="Từ ngày"
                  value={filters.dateFrom}
                  onChange={(date) => handleChange('dateFrom', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          transition: 'all 0.3s',
                          '&:hover': {
                            backgroundColor: '#f0f2f5',
                            '& fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#fff',
                            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <DatePicker
                  label="Đến ngày"
                  value={filters.dateTo}
                  onChange={(date) => handleChange('dateTo', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          transition: 'all 0.3s',
                          '&:hover': {
                            backgroundColor: '#f0f2f5',
                            '& fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#fff',
                            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>

              {/* Trạng thái Hóa đơn */}
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái Hóa đơn</InputLabel>
                  <Select
                    multiple
                    value={filters.invoiceStatus}
                    onChange={(e) => handleChange('invoiceStatus', e.target.value)}
                    input={<OutlinedInput label="Trạng thái Hóa đơn" />}
                    renderValue={(selected) => {
                      const filteredSelected = selected.filter((s) => s !== 'ALL')
                      if (selected.includes('ALL') || filteredSelected.length === allInvoiceStatus.length) {
                        return 'Tất cả trạng thái'
                      }
                      return filteredSelected.length > 2
                        ? `${filteredSelected.length} trạng thái`
                        : filteredSelected.join(', ')
                    }}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#f0f2f5',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                    }}>
                    {/* Option Chọn tất cả */}
                    <MenuItem value="ALL" sx={{ borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                      <Checkbox
                        checked={filters.invoiceStatus.includes('ALL')}
                        size="small"
                        sx={{
                          color: '#1976d2',
                          '&.Mui-checked': {
                            color: '#1976d2',
                          },
                        }}
                      />
                      <ListItemText
                        primary="Chọn tất cả"
                        primaryTypographyProps={{
                          fontWeight: 600,
                          color: '#1976d2',
                        }}
                      />
                    </MenuItem>
                    {allInvoiceStatus.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Checkbox
                          checked={filters.invoiceStatus.indexOf(status) > -1}
                          size="small"
                          sx={{
                            color: '#1976d2',
                            '&.Mui-checked': {
                              color: '#1976d2',
                            },
                          }}
                        />
                        <ListItemText primary={status} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Trạng thái CQT */}
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái CQT</InputLabel>
                  <Select
                    value={filters.taxStatus}
                    label="Trạng thái CQT"
                    onChange={(e) => handleChange('taxStatus', e.target.value)}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#f0f2f5',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                    }}>
                    <MenuItem value="">
                      <em>Tất cả</em>
                    </MenuItem>
                    {allTaxStatus.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 2: Khách hàng & Loại hóa đơn */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              👥 Khách hàng & Loại hóa đơn
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Khách hàng */}
              <Box sx={{ flex: '1 1 48%', minWidth: 250 }}>
                <Autocomplete
                  size="small"
                  options={customers}
                  loading={isLoadingCustomers}
                  value={customers.find((c) => c.value === filters.customer) || null}
                  onChange={(_e, value) => handleChange('customer', value?.value || null)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  noOptionsText={isLoadingCustomers ? 'Đang tải...' : 'Không có khách hàng'}
                  renderOption={(props, option) => {
                    const isAllOption = option.value === 'ALL'
                    return (
                      <Box
                        component="li"
                        {...props}
                        sx={{
                          borderBottom: isAllOption ? '1px solid #e0e0e0' : 'none',
                          fontWeight: isAllOption ? 600 : 400,
                          color: isAllOption ? '#1976d2' : 'inherit',
                          '&[aria-selected="true"]': {
                            backgroundColor: isAllOption ? 'rgba(25, 118, 210, 0.12)' : undefined,
                          },
                        }}>
                        {option.label}
                      </Box>
                    )
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Khách hàng"
                      placeholder="Chọn hoặc nhập tên khách hàng..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          transition: 'all 0.3s',
                          '&:hover': {
                            backgroundColor: '#f0f2f5',
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#fff',
                            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* Loại Hóa đơn */}
              <Box sx={{ flex: '1 1 48%', minWidth: 250 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Loại Hóa đơn</InputLabel>
                  <Select
                    multiple
                    value={filters.invoiceType}
                    onChange={(e) => handleChange('invoiceType', e.target.value)}
                    input={<OutlinedInput label="Loại Hóa đơn" />}
                    renderValue={(selected) => {
                      const filteredSelected = selected.filter((s) => s !== 'ALL')
                      if (selected.includes('ALL') || filteredSelected.length === allInvoiceTypes.length) {
                        return 'Tất cả loại HĐ'
                      }
                      if (filteredSelected.length === 0) return ''
                      if (filteredSelected.length > 1) return `${filteredSelected.length} loại HĐ`
                      // Hiển thị label của loại được chọn
                      const selectedType = allInvoiceTypes.find((t) => String(t.value) === String(filteredSelected[0]))
                      return selectedType?.label || filteredSelected[0]
                    }}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#f0f2f5',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                    }}>
                    {/* Option Chọn tất cả */}
                    <MenuItem value="ALL" sx={{ borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                      <Checkbox
                        checked={filters.invoiceType.includes('ALL')}
                        size="small"
                        sx={{
                          color: '#1976d2',
                          '&.Mui-checked': {
                            color: '#1976d2',
                          },
                        }}
                      />
                      <ListItemText
                        primary="Chọn tất cả"
                        primaryTypographyProps={{
                          fontWeight: 600,
                          color: '#1976d2',
                        }}
                      />
                    </MenuItem>
                    {allInvoiceTypes.map((type) => (
                      <MenuItem key={type.value} value={String(type.value)}>
                        <Checkbox
                          checked={filters.invoiceType.indexOf(String(type.value)) > -1}
                          size="small"
                          sx={{
                            color: '#1976d2',
                            '&.Mui-checked': {
                              color: '#1976d2',
                            },
                          }}
                        />
                        <ListItemText primary={type.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              {/* Hiển thị số lượng kết quả */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {filteredResults !== totalResults && totalResults > 0 && (
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                    Hiển thị <strong style={{ color: '#1976d2' }}>{filteredResults}</strong> / {totalResults} kết quả
                  </Typography>
                )}
                {activeFilterCount > 0 && (
                  <Chip 
                    label={`${activeFilterCount} bộ lọc`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              
              {/* Nút Xóa bộ lọc */}
              {activeFilterCount > 0 && (
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ClearIcon />}
                  onClick={handleResetFilter}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: 140,
                    height: 42,
                    borderRadius: 2,
                    borderColor: '#ddd',
                    color: '#666',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: '#f44336',
                      backgroundColor: '#ffebee',
                      color: '#f44336',
                      transform: 'translateY(-1px)',
                    },
                  }}>
                  Xóa bộ lọc
                </Button>
              )}
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  )
}

export default InvoiceFilter
