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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import customerService from '@/services/customerService'
import { STATEMENT_STATUS, STATEMENT_STATUS_LABELS } from '@/constants/statementStatus'

// ==================== INTERFACES ====================

export interface StatementFilterState {
  searchText: string
  period: string // Kỳ cước (VD: "1/2026", "01/2026")
  status: string[]
  customer: string | null
}

interface StatementFilterProps {
  onFilterChange?: (filters: StatementFilterState) => void
  onReset?: () => void
  totalResults?: number
  filteredResults?: number
  actionButton?: React.ReactNode
}

// ==================== DATA ====================

// Trạng thái Bảng kê (7 statuses)
const allStatuses = [
  { value: STATEMENT_STATUS.DRAFT, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.DRAFT] },
  { value: STATEMENT_STATUS.PUBLISHED, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.PUBLISHED] },
  { value: STATEMENT_STATUS.SENT, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.SENT] },
  { value: STATEMENT_STATUS.PARTIALLY_PAID, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.PARTIALLY_PAID] },
  { value: STATEMENT_STATUS.PAID, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.PAID] },
  { value: STATEMENT_STATUS.CANCELLED, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.CANCELLED] },
  { value: STATEMENT_STATUS.REFUNDED, label: STATEMENT_STATUS_LABELS[STATEMENT_STATUS.REFUNDED] },
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
    period: '',
    status: [],
    customer: null,
  })

  // Ref để track first mount
  const isFirstMount = useRef(true)

  // Load customers từ API
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoadingCustomers(true)
        const data = await customerService.getAllCustomers()
        // 💡 STATEMENT FILTER: Hiển thị TẤT CẢ customers (kể cả inactive) vì cần xem bảng kê lịch sử
        const customerOptions = data
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
    if (filters.period && filters.period.trim() !== '') count++
    if (filters.status.length > 0 && !filters.status.includes('ALL')) count++
    if (filters.customer && filters.customer !== 'ALL') count++

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, filters.status, filters.customer])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchText])

  // ==================== HANDLERS ====================

  const handleChange = (field: keyof StatementFilterState, value: string | string[] | null) => {
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
      period: '',
      status: [],
      customer: null,
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
              placeholder="Tìm theo mã bảng kê, tên khách hàng, số HĐ..."
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
                badgeContent={getActiveFilterCount()} 
                color="primary"
                invisible={getActiveFilterCount() === 0}
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
                  onClick={handleToggleAdvanced}
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

          {/* 3. Nút Action (ví dụ: Tạo Bảng kê mới) */}
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

            {/* Row: 3 filters chính */}
           
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Kỳ cước */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Kỳ cước"
                  placeholder="VD: 1/2026 hoặc 01/2026"
                  value={filters.period}
                  onChange={(e) => handleChange('period', e.target.value)}
                  sx={{
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
                  }}
                />
              </Box>

              {/* Trạng thái bảng kê */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-label">Trạng thái</InputLabel>
                  <Select
                    labelId="status-label"
                    multiple
                    value={filters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    input={<OutlinedInput label="Trạng thái" />}
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
                    }}
                  >
                    {/* Option "Chọn tất cả" */}
                    <MenuItem value="ALL">
                      <Checkbox checked={filters.status.includes('ALL')} />
                      <ListItemText
                        primary="Chọn tất cả"
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

              {/* Khách hàng */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
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
                      label="Khách hàng"
                      placeholder="Chọn khách hàng..."
                      sx={{
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
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Footer: Reset & Results */}
            <Box
              sx={{
                pt: 2,
                mt: 3,
                borderTop: '1px solid #e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#1976d2',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}>
                Hiển thị {filteredResults} / {totalResults} kết quả
              </Typography>

              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<ClearIcon />}
                onClick={handleReset}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)',
                  },
                }}>
                Đặt lại bộ lọc
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  )
}

export default StatementFilter
