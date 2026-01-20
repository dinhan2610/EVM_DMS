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
  Typography,
  Divider,
  Tooltip,
  Chip,
  Badge,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Dayjs } from 'dayjs'

// ==================== INTERFACES ====================

export interface DebtFilterState {
  searchText: string
  dateFrom: Dayjs | null // Ngày tạo HĐ từ
  dateTo: Dayjs | null // Ngày tạo HĐ đến
  dueDateFrom: Dayjs | null // Hạn thanh toán từ
  dueDateTo: Dayjs | null // Hạn thanh toán đến
  paymentStatus: string[] // Multi-select: Unpaid, PartiallyPaid, Paid, Overdue
  overdueOnly: boolean // Chỉ hiển thị quá hạn
}

interface DebtFilterProps {
  onFilterChange?: (filters: DebtFilterState) => void
  onReset?: () => void
  totalResults?: number
  filteredResults?: number
  actionButton?: React.ReactNode // Nút action tùy chỉnh (thống nhất với InvoiceFilter/ItemFilter)
}

// ==================== CONSTANTS ====================

// Trạng thái thanh toán - Aligned với backend
const PAYMENT_STATUS_OPTIONS = [
  { value: 'Unpaid', label: 'Chưa thanh toán', color: '#757575' },
  { value: 'PartiallyPaid', label: 'Trả một phần', color: '#ff9800' },
  { value: 'Paid', label: 'Đã thanh toán', color: '#4caf50' },
  { value: 'Overdue', label: 'Quá hạn', color: '#f44336' },
]

// ==================== COMPONENT ====================

const DebtFilter: React.FC<DebtFilterProps> = ({
  onFilterChange,
  onReset,
  totalResults = 0,
  filteredResults = 0,
  actionButton,
}) => {
  // State - UI
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State - Filter values
  const [filters, setFilters] = useState<DebtFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    dueDateFrom: null,
    dueDateTo: null,
    paymentStatus: [],
    overdueOnly: false,
  })

  // Ref để track lần đầu mount
  const isFirstMount = useRef(true)

  // ==================== COMPUTED VALUES ====================

  // Tính số lượng filters đang active
  const getActiveFilterCount = useCallback(() => {
    let count = 0

    if (filters.searchText?.trim()) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.dueDateFrom) count++
    if (filters.dueDateTo) count++
    if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes('ALL')) count++
    if (filters.overdueOnly) count++

    return count
  }, [filters])

  const activeFilterCount = getActiveFilterCount()

  // ==================== EFFECTS ====================

  // Auto-apply filters khi thay đổi (trừ searchText)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (onFilterChange) {
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.dueDateFrom,
    filters.dueDateTo,
    filters.paymentStatus,
    filters.overdueOnly,
  ])

  // Debounced search - tự động apply sau 500ms
  useEffect(() => {
    if (isFirstMount.current) return

    const timer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(filters)
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchText])

  // ==================== HANDLERS ====================

  const handleChange = (field: keyof DebtFilterState, value: unknown) => {
    let processedValue = value

    // Xử lý logic "Chọn tất cả" cho Payment Status
    if (field === 'paymentStatus' && Array.isArray(value)) {
      const hasSelectAll = value.includes('ALL')
      const prevHasSelectAll = filters.paymentStatus.includes('ALL')
      const allStatusValues = PAYMENT_STATUS_OPTIONS.map((s) => s.value)

      if (hasSelectAll && !prevHasSelectAll) {
        processedValue = ['ALL', ...allStatusValues]
      } else if (!hasSelectAll && prevHasSelectAll) {
        processedValue = []
      } else if (hasSelectAll && value.length < allStatusValues.length + 1) {
        processedValue = value.filter((v) => v !== 'ALL')
      } else if (!hasSelectAll && value.length === allStatusValues.length) {
        processedValue = ['ALL', ...value]
      }
    }

    setFilters((prev) => ({
      ...prev,
      [field]: processedValue,
    }))
  }

  const handleResetFilter = () => {
    const resetFilters: DebtFilterState = {
      searchText: '',
      dateFrom: null,
      dateTo: null,
      dueDateFrom: null,
      dueDateTo: null,
      paymentStatus: [],
      overdueOnly: false,
    }
    setFilters(resetFilters)
    if (onReset) onReset()
    if (onFilterChange) onFilterChange(resetFilters)
  }

  // ==================== RENDER ====================

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
        }}
      >
        {/* ========== ROW 1: Search + Filter Button + Quick Toggle + Action ========== */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Search Input */}
          <Box sx={{ flex: '1 1 auto', maxWidth: 480, minWidth: 200 }}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo tên KH, MST, SĐT, Email..."
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
                    '& fieldset': { borderColor: '#1976d2' },
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    '& fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
                  },
                },
              }}
            />
          </Box>

          {/* Filter Button with Badge */}
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
                }}
              >
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
                  }}
                >
                  Lọc
                </Button>
              </Badge>
            </Box>
          </Tooltip>

          {/* Overdue Only Toggle - Quick Access */}
          <FormControlLabel
            control={
              <Switch
                checked={filters.overdueOnly}
                onChange={(e) => handleChange('overdueOnly', e.target.checked)}
                color="error"
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningAmberIcon sx={{ fontSize: 18, color: filters.overdueOnly ? '#f44336' : '#999' }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: filters.overdueOnly ? 600 : 400,
                    color: filters.overdueOnly ? '#f44336' : '#666',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Chỉ quá hạn
                </Typography>
              </Box>
            }
            sx={{ flex: '0 0 auto', mr: 0 }}
          />

          {/* Action Button (nếu có) */}
          {actionButton && (
            <Box sx={{ flex: '0 0 auto' }}>
              {actionButton}
            </Box>
          )}
        </Box>

        {/* ========== ADVANCED FILTERS (Collapse) ========== */}
        <Collapse in={advancedOpen} timeout="auto">
          <Box sx={{ pt: 3, mt: 3 }}>
            <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />

            {/* Row 2: Date Filters */}
            <Typography
              variant="caption"
              sx={{ display: 'block', mb: 1.5, color: '#666', fontWeight: 600, fontSize: '0.8rem' }}
            >
              📅 Thời gian
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 22%', minWidth: 180 }}>
                <DatePicker
                  label="Ngày HĐ từ"
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
                          '&:hover': { backgroundColor: '#f0f2f5' },
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
              <Box sx={{ flex: '1 1 22%', minWidth: 180 }}>
                <DatePicker
                  label="Ngày HĐ đến"
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
                          '&:hover': { backgroundColor: '#f0f2f5' },
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
              <Box sx={{ flex: '1 1 22%', minWidth: 180 }}>
                <DatePicker
                  label="Hạn TT từ"
                  value={filters.dueDateFrom}
                  onChange={(date) => handleChange('dueDateFrom', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          '&:hover': { backgroundColor: '#f0f2f5' },
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
              <Box sx={{ flex: '1 1 22%', minWidth: 180 }}>
                <DatePicker
                  label="Hạn TT đến"
                  value={filters.dueDateTo}
                  onChange={(date) => handleChange('dueDateTo', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          '&:hover': { backgroundColor: '#f0f2f5' },
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
            </Box>

            {/* Row 3: Payment Status */}
            <Typography
              variant="caption"
              sx={{ display: 'block', mb: 1.5, color: '#666', fontWeight: 600, fontSize: '0.8rem' }}
            >
              💳 Trạng thái thanh toán
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
              {/* Payment Status Multi-Select */}
              <Box sx={{ flex: '1 1 100%', maxWidth: 400 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái thanh toán</InputLabel>
                  <Select
                    multiple
                    value={filters.paymentStatus}
                    onChange={(e) => handleChange('paymentStatus', e.target.value)}
                    input={<OutlinedInput label="Trạng thái thanh toán" />}
                    renderValue={(selected) => {
                      const filteredSelected = selected.filter((s) => s !== 'ALL')
                      if (selected.includes('ALL') || filteredSelected.length === PAYMENT_STATUS_OPTIONS.length) {
                        return 'Tất cả trạng thái'
                      }
                      if (filteredSelected.length > 2) return `${filteredSelected.length} trạng thái`
                      return filteredSelected
                        .map((v) => PAYMENT_STATUS_OPTIONS.find((s) => s.value === v)?.label || v)
                        .join(', ')
                    }}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      '&:hover': { backgroundColor: '#f0f2f5' },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                    }}
                  >
                    {/* Chọn tất cả */}
                    <MenuItem value="ALL" sx={{ borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                      <Checkbox
                        checked={filters.paymentStatus.includes('ALL')}
                        size="small"
                        sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                      />
                      <ListItemText
                        primary="Chọn tất cả"
                        primaryTypographyProps={{ fontWeight: 600, color: '#1976d2' }}
                      />
                    </MenuItem>
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Checkbox
                          checked={filters.paymentStatus.indexOf(status.value) > -1}
                          size="small"
                          sx={{ color: status.color, '&.Mui-checked': { color: status.color } }}
                        />
                        <ListItemText
                          primary={status.label}
                          primaryTypographyProps={{ color: status.color, fontWeight: 500 }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Action Row */}
            <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              {/* Results Count */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {filteredResults !== totalResults && totalResults > 0 && (
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                    Hiển thị <strong style={{ color: '#1976d2' }}>{filteredResults}</strong> / {totalResults} khách hàng
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

              {/* Reset Button */}
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
                  }}
                >
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

export default DebtFilter
