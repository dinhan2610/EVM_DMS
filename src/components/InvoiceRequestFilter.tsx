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
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from '@/types/invoiceRequest.types'

// Interface cho state của filter
export interface InvoiceRequestFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  requiredDateFrom: Dayjs | null // Hạn xuất HĐ từ ngày
  requiredDateTo: Dayjs | null   // Hạn xuất HĐ đến ngày
  statusIDs: number[]   // Trạng thái yêu cầu
  requestTypes: number[] // Loại yêu cầu
  customer: string | null
  createdBy: string | null // Người tạo (Sale)
}

// Interface cho props
interface InvoiceRequestFilterProps {
  onFilterChange?: (filters: InvoiceRequestFilterState) => void
  onReset?: () => void
  totalResults?: number
  filteredResults?: number
  actionButton?: React.ReactNode
}

// Trạng thái yêu cầu - mapping từ types
const allRequestStatuses = [
  { value: 1, label: REQUEST_STATUS_LABELS[1] },  // Chờ duyệt
  { value: 2, label: REQUEST_STATUS_LABELS[2] },  // Đã duyệt
  { value: 3, label: REQUEST_STATUS_LABELS[3] },  // Từ chối
  { value: 4, label: REQUEST_STATUS_LABELS[4] },  // Đã tạo HĐ
  { value: 5, label: REQUEST_STATUS_LABELS[5] },  // Đã hủy
]

// Loại yêu cầu - mapping từ types
const allRequestTypes = [
  { value: 1, label: REQUEST_TYPE_LABELS[1] },  // Xuất HĐ thường
  { value: 2, label: REQUEST_TYPE_LABELS[2] },  // Xuất HĐ gấp
]

const InvoiceRequestFilter: React.FC<InvoiceRequestFilterProps> = ({ 
  onFilterChange, 
  onReset,
  totalResults = 0,
  filteredResults = 0,
  actionButton,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [customers, setCustomers] = useState<Array<{ label: string; value: string }>>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  const [filters, setFilters] = useState<InvoiceRequestFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    requiredDateFrom: null,
    requiredDateTo: null,
    statusIDs: [],
    requestTypes: [],
    customer: null,
    createdBy: null,
  })

  // Load customers từ API
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoadingCustomers(true)
        const data = await customerService.getAllCustomers()
        const customerOptions = data
          .filter((c) => c.isActive)
          .map((c) => ({
            label: c.customerName,
            value: c.customerName,
          }))
          .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
        
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

  // Tính số lượng filters đang active
  const getActiveFilterCount = useCallback(() => {
    let count = 0
    
    if (filters.searchText && filters.searchText.trim() !== '') count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.requiredDateFrom) count++
    if (filters.requiredDateTo) count++
    if (filters.statusIDs.length > 0 && !filters.statusIDs.includes(-1)) count++
    if (filters.requestTypes.length > 0 && !filters.requestTypes.includes(-1)) count++
    if (filters.customer && filters.customer !== 'ALL') count++
    if (filters.createdBy && filters.createdBy !== 'ALL') count++
    
    return count
  }, [filters])

  const activeFilterCount = getActiveFilterCount()
  const isFirstMount = useRef(true)

  // Auto-apply filters
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.requiredDateFrom,
    filters.requiredDateTo,
    filters.statusIDs,
    filters.requestTypes,
    filters.customer,
    filters.createdBy,
  ])

  // Debounced search
  useEffect(() => {
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

  const handleChange = (field: keyof InvoiceRequestFilterState, value: unknown) => {
    let processedValue = value
    
    // Logic "Chọn tất cả" cho Trạng thái
    if (field === 'statusIDs' && Array.isArray(value)) {
      const hasSelectAll = value.includes(-1)
      const prevHasSelectAll = filters.statusIDs.includes(-1)
      
      if (hasSelectAll && !prevHasSelectAll) {
        processedValue = [-1, ...allRequestStatuses.map((s) => s.value)]
      } else if (!hasSelectAll && prevHasSelectAll) {
        processedValue = []
      } else if (hasSelectAll && value.length < allRequestStatuses.length + 1) {
        processedValue = value.filter((v) => v !== -1)
      } else if (!hasSelectAll && value.length === allRequestStatuses.length) {
        processedValue = [-1, ...value]
      }
    }
    
    // Logic "Chọn tất cả" cho Loại yêu cầu
    if (field === 'requestTypes' && Array.isArray(value)) {
      const hasSelectAll = value.includes(-1)
      const prevHasSelectAll = filters.requestTypes.includes(-1)
      
      if (hasSelectAll && !prevHasSelectAll) {
        processedValue = [-1, ...allRequestTypes.map((t) => t.value)]
      } else if (!hasSelectAll && prevHasSelectAll) {
        processedValue = []
      } else if (hasSelectAll && value.length < allRequestTypes.length + 1) {
        processedValue = value.filter((v) => v !== -1)
      } else if (!hasSelectAll && value.length === allRequestTypes.length) {
        processedValue = [-1, ...value]
      }
    }
    
    setFilters((prev) => ({
      ...prev,
      [field]: processedValue,
    }))
  }

  const handleResetFilter = () => {
    const resetFilters: InvoiceRequestFilterState = {
      searchText: '',
      dateFrom: null,
      dateTo: null,
      requiredDateFrom: null,
      requiredDateTo: null,
      statusIDs: [],
      requestTypes: [],
      customer: null,
      createdBy: null,
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
        {/* Search & Filter Header */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Bar */}
          <Box sx={{ flex: '1 1 auto', maxWidth: actionButton ? 420 : 480, minWidth: 280 }}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo số yêu cầu, mã khách hàng, tên Sale..."
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

          {/* Filter Button */}
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

          {/* Action Button */}
          {actionButton && (
            <Box sx={{ flex: '0 0 auto', ml: 'auto' }}>
              {actionButton}
            </Box>
          )}
        </Box>

        {/* Advanced Filters */}
        <Collapse in={advancedOpen} timeout="auto">
          <Box sx={{ pt: 3, mt: 3 }}>
            {/* Row 1: Ngày tạo & Hạn xuất */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              📅 Thời gian
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <DatePicker
                  label="Ngày tạo từ"
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
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <DatePicker
                  label="Ngày tạo đến"
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
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <DatePicker
                  label="Hạn xuất từ"
                  value={filters.requiredDateFrom}
                  onChange={(date) => handleChange('requiredDateFrom', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <DatePicker
                  label="Hạn xuất đến"
                  value={filters.requiredDateTo}
                  onChange={(date) => handleChange('requiredDateTo', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Row 2: Trạng thái & Loại yêu cầu */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              🏷️ Phân loại
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 48%', minWidth: 250 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái yêu cầu</InputLabel>
                  <Select
                    multiple
                    value={filters.statusIDs}
                    onChange={(e) => handleChange('statusIDs', e.target.value)}
                    input={<OutlinedInput label="Trạng thái yêu cầu" />}
                    renderValue={(selected) => {
                      const filteredSelected = selected.filter((s) => s !== -1)
                      if (selected.includes(-1) || filteredSelected.length === allRequestStatuses.length) {
                        return 'Tất cả trạng thái'
                      }
                      return filteredSelected.length > 2
                        ? `${filteredSelected.length} trạng thái`
                        : filteredSelected.map(id => allRequestStatuses.find(s => s.value === id)?.label).join(', ')
                    }}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                    }}>
                    <MenuItem value={-1} sx={{ borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                      <Checkbox checked={filters.statusIDs.includes(-1)} size="small" />
                      <ListItemText
                        primary="Chọn tất cả"
                        primaryTypographyProps={{
                          fontWeight: 600,
                          color: '#1976d2',
                        }}
                      />
                    </MenuItem>
                    {allRequestStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Checkbox checked={filters.statusIDs.indexOf(status.value) > -1} size="small" />
                        <ListItemText primary={status.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 48%', minWidth: 250 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Loại yêu cầu</InputLabel>
                  <Select
                    multiple
                    value={filters.requestTypes}
                    onChange={(e) => handleChange('requestTypes', e.target.value)}
                    input={<OutlinedInput label="Loại yêu cầu" />}
                    renderValue={(selected) => {
                      const filteredSelected = selected.filter((s) => s !== -1)
                      if (selected.includes(-1) || filteredSelected.length === allRequestTypes.length) {
                        return 'Tất cả loại'
                      }
                      return filteredSelected.map(id => allRequestTypes.find(t => t.value === id)?.label).join(', ')
                    }}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                    }}>
                    <MenuItem value={-1} sx={{ borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                      <Checkbox checked={filters.requestTypes.includes(-1)} size="small" />
                      <ListItemText
                        primary="Chọn tất cả"
                        primaryTypographyProps={{
                          fontWeight: 600,
                          color: '#1976d2',
                        }}
                      />
                    </MenuItem>
                    {allRequestTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Checkbox checked={filters.requestTypes.indexOf(type.value) > -1} size="small" />
                        <ListItemText primary={type.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 3: Khách hàng */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              👥 Khách hàng
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 100%', minWidth: 250 }}>
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
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
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

export default InvoiceRequestFilter
