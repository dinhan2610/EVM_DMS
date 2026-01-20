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
  Badge,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import { Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import customerService from '@/services/customerService'
import { STATEMENT_STATUS, STATEMENT_STATUS_LABELS } from '@/constants/statementStatus'

// ==================== INTERFACES ====================

export interface StatementFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  periodFrom: string // Kỳ cước từ (VD: "01/2025")
  periodTo: string // Kỳ cước đến (VD: "12/2025")
  status: string[]
  customer: string | null
  emailSentStatus: string // Trạng thái gửi email ("ALL", "SENT", "NOT_SENT")
  linkedInvoice: string // Trạng thái gắn hóa đơn ("ALL", "LINKED", "NOT_LINKED")
}

interface StatementFilterProps {
  onFilterChange?: (filters: StatementFilterState) => void
  onReset?: () => void
  totalResults?: number
  filteredResults?: number
  actionButton?: React.ReactNode
}

// ==================== DATA ====================

// Trạng thái Bảng kê
const allStatuses = [
  { value: STATEMENT_STATUS.DRAFT, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.DRAFT] },
  { value: STATEMENT_STATUS.INVOICED, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.INVOICED] },
]

// Trạng thái gửi email
const emailStatusOptions = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SENT', label: 'Đã gửi email' },
  { value: 'NOT_SENT', label: 'Chưa gửi email' },
]

// Trạng thái gắn hóa đơn
const invoiceLinkedOptions = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'LINKED', label: 'Đã gắn HĐ' },
  { value: 'NOT_LINKED', label: 'Chưa gắn HĐ' },
]

// ==================== MAIN COMPONENT ====================

const StatementFilter: React.FC<StatementFilterProps> = ({
  onFilterChange,
  onReset,
  totalResults = 0,
  filteredResults = 0,
  actionButton,
}) => {
  // State
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [customers, setCustomers] = useState<Array<{ label: string; value: string }>>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  const [filters, setFilters] = useState<StatementFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    periodFrom: '',
    periodTo: '',
    status: [],
    customer: null,
    emailSentStatus: 'ALL',
    linkedInvoice: 'ALL',
  })

  // Ref để track first mount
  const isFirstMount = useRef(true)

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
        console.error('❌ Failed to load customers:', error)
        setCustomers([{ label: 'Tất cả khách hàng', value: 'ALL' }])
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    loadCustomers()
  }, [])

  // ==================== ACTIVE FILTER COUNT ====================

  const getActiveFilterCount = useCallback(() => {
    let count = 0

    if (filters.searchText && filters.searchText.trim() !== '') count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.periodFrom && filters.periodFrom.trim() !== '') count++
    if (filters.periodTo && filters.periodTo.trim() !== '') count++
    if (filters.status.length > 0 && !filters.status.includes('ALL')) count++
    if (filters.customer && filters.customer !== 'ALL') count++
    if (filters.emailSentStatus && filters.emailSentStatus !== 'ALL') count++
    if (filters.linkedInvoice && filters.linkedInvoice !== 'ALL') count++

    return count
  }, [filters])

  // ==================== AUTO-APPLY FILTERS ====================

  // Auto-apply cho tất cả trừ searchText
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
    filters.periodFrom,
    filters.periodTo,
    filters.status,
    filters.customer,
    filters.emailSentStatus,
    filters.linkedInvoice,
    onFilterChange,
  ])

  // Debounced search
  useEffect(() => {
    if (isFirstMount.current) {
      return
    }

    const handler = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(filters)
      }
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [filters.searchText, onFilterChange])

  // ==================== HANDLERS ====================

  const handleChange = (field: keyof StatementFilterState, value: string | string[] | Dayjs | null) => {
    setFilters((prev) => {
      // Xử lý Status multi-select với "Chọn tất cả"
      if (field === 'status') {
        const prevStatus = prev.status
        const newValue = value as string[]

        // Click "Tất cả"
        if (newValue.includes('ALL') && !prevStatus.includes('ALL')) {
          return {
            ...prev,
            status: ['ALL', ...allStatuses.map((s) => s.value)],
          }
        }
        // Bỏ chọn "Tất cả"
        else if (prevStatus.includes('ALL') && !newValue.includes('ALL')) {
          return {
            ...prev,
            status: newValue.filter((v) => v !== 'ALL'),
          }
        }
        // Auto thêm "Tất cả" khi chọn đủ
        else if (newValue.length === allStatuses.length && !newValue.includes('ALL')) {
          return {
            ...prev,
            status: ['ALL', ...newValue],
          }
        }
        // Xóa "Tất cả" nếu bỏ bất kỳ item nào
        else if (prevStatus.includes('ALL') && newValue.length < allStatuses.length) {
          return {
            ...prev,
            status: newValue.filter((v) => v !== 'ALL'),
          }
        }

        return { ...prev, status: newValue }
      }

      return { ...prev, [field]: value }
    })
  }

  const handleReset = () => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      periodFrom: '',
      periodTo: '',
      status: [],
      customer: null,
      emailSentStatus: 'ALL',
      linkedInvoice: 'ALL',
    })

    if (onReset) {
      onReset()
    }
  }

  const handleToggleAdvanced = () => {
    setAdvancedOpen(!advancedOpen)
  }

  // ==================== RENDER ====================

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        backgroundColor: '#fff',
      }}
    >
      {/* Search Bar + Filter Button + Action Button */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <TextField
          placeholder="🔍 Tìm theo mã bảng kê, khách hàng, số HĐ..."
          value={filters.searchText}
          onChange={(e) => handleChange('searchText', e.target.value)}
          size="small"
          sx={{
            minWidth: 300,
            flex: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#f8f9fa',
              '&:hover': {
                backgroundColor: '#f0f2f5',
              },
              '&.Mui-focused': {
                backgroundColor: '#fff',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666' }} />
              </InputAdornment>
            ),
            endAdornment: filters.searchText && (
              <InputAdornment position="end">
                <Tooltip title="Xóa tìm kiếm">
                  <Button
                    size="small"
                    onClick={() => handleChange('searchText', '')}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </Button>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        {/* Filter Button with Badge */}
        <Badge
          badgeContent={getActiveFilterCount()}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              right: -3,
              top: 13,
              border: '2px solid #fff',
              padding: '0 4px',
            },
          }}
        >
          <Button
            variant={advancedOpen ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            onClick={handleToggleAdvanced}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Bộ lọc
          </Button>
        </Badge>

        {/* Action Button (Tạo Bảng kê mới) */}
        {actionButton && <Box sx={{ ml: 'auto' }}>{actionButton}</Box>}
      </Box>

      {/* Advanced Filters */}
      <Collapse in={advancedOpen}>
        <Divider />
        <Box sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
          {/* Row 1: Date Range + Period Range */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 200, flex: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <DatePicker
                  label="📅 Ngày tạo từ"
                  value={filters.dateFrom}
                  onChange={(date) => handleChange('dateFrom', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'Chọn ngày bắt đầu',
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box sx={{ minWidth: 200, flex: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <DatePicker
                  label="📅 Ngày tạo đến"
                  value={filters.dateTo}
                  onChange={(date) => handleChange('dateTo', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'Chọn ngày kết thúc',
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box sx={{ minWidth: 200, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="📊 Kỳ cước từ"
                placeholder="VD: 01/2025"
                value={filters.periodFrom}
                onChange={(e) => handleChange('periodFrom', e.target.value)}
                helperText="Định dạng: MM/YYYY"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  },
                }}
              />
            </Box>

            <Box sx={{ minWidth: 200, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="📊 Kỳ cước đến"
                placeholder="VD: 12/2025"
                value={filters.periodTo}
                onChange={(e) => handleChange('periodTo', e.target.value)}
                helperText="Định dạng: MM/YYYY"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Row 2: Status + Email Status + Invoice Linked */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 200, flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-label">🏷️ Trạng thái</InputLabel>
                <Select
                  labelId="status-label"
                  multiple
                  value={filters.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  input={<OutlinedInput label="🏷️ Trạng thái" />}
                  renderValue={(selected) => {
                    if (selected.includes('ALL')) {
                      return 'Tất cả trạng thái'
                    }
                    return selected
                      .filter((v) => v !== 'ALL')
                      .map((v) => STATEMENT_STATUS_LABELS[v as keyof typeof STATEMENT_STATUS_LABELS])
                      .join(', ')
                  }}
                  sx={{
                    backgroundColor: '#fff',
                  }}
                >
                  {/* Option "Chọn tất cả" */}
                  <MenuItem value="ALL">
                    <Checkbox checked={filters.status.includes('ALL')} />
                    <ListItemText
                      primary="✓ Chọn tất cả"
                      sx={{ fontWeight: 600, color: '#1976d2' }}
                    />
                  </MenuItem>
                  <Divider />
                  {allStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Checkbox checked={filters.status.includes(status.value)} />
                      <ListItemText primary={status.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 200, flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="email-status-label">📧 Gửi email</InputLabel>
                <Select
                  labelId="email-status-label"
                  value={filters.emailSentStatus}
                  onChange={(e) => handleChange('emailSentStatus', e.target.value)}
                  label="📧 Gửi email"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                >
                  {emailStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 200, flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="invoice-linked-label">🔗 Gắn hóa đơn</InputLabel>
                <Select
                  labelId="invoice-linked-label"
                  value={filters.linkedInvoice}
                  onChange={(e) => handleChange('linkedInvoice', e.target.value)}
                  label="🔗 Gắn hóa đơn"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                >
                  {invoiceLinkedOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Row 3: Customer Autocomplete */}
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={customers}
              value={customers.find((c) => c.value === filters.customer) || null}
              onChange={(_, newValue) => handleChange('customer', newValue?.value || null)}
              getOptionLabel={(option) => option.label}
              loading={isLoadingCustomers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="👤 Khách hàng"
                  placeholder="Chọn khách hàng..."
                  InputProps={{
                    ...params.InputProps,
                    sx: { backgroundColor: '#fff' },
                  }}
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                },
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Results Display */}
            <Typography variant="body2" sx={{ color: '#666' }}>
              Hiển thị <strong style={{ color: '#1976d2' }}>{filteredResults}</strong> /{' '}
              {totalResults} kết quả
            </Typography>

            {/* Reset Button */}
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleReset}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default StatementFilter
