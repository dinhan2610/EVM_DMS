import React, { useState, useEffect, useMemo } from 'react'
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
  Typography,
  Divider,
  Tooltip,
  Badge,
  IconButton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

// Interface cho state của filter
export interface AuditLogsFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  // Activity Logs filters
  activityStatus: string
  // Data Logs filters
  tableName: string
  action: string
}

// Interface cho props
interface AuditLogsFilterProps {
  currentTab: 'activity' | 'data'
  onFilterChange?: (filters: AuditLogsFilterState) => void
  onReset?: () => void
}

// Danh sách bảng dữ liệu
const tableOptions = [
  { value: 'all', label: 'Tất cả bảng' },
  { value: 'Invoice', label: 'Hóa đơn' },
  { value: 'InvoiceItem', label: 'Sản phẩm hóa đơn' },
  { value: 'InvoiceHistory', label: 'Lịch sử hóa đơn' },
  { value: 'User', label: 'Người dùng' },
  { value: 'Customer', label: 'Khách hàng' },
  { value: 'InvoiceRequest', label: 'Yêu cầu hóa đơn' },
  { value: 'Statement', label: 'Bảng kê' },
]

// Danh sách hành động
const actionOptions = [
  { value: 'all', label: 'Tất cả hành động' },
  { value: 'Added', label: 'Thêm mới' },
  { value: 'Modified', label: 'Cập nhật' },
  { value: 'Deleted', label: 'Xóa' },
]

// Danh sách trạng thái activity
const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'Success', label: 'Thành công' },
  { value: 'Failed', label: 'Thất bại' },
]

// Shared input styles (matching InvoiceFilter)
const filterInputStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#f8f9fa',
    borderRadius: 1.5,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f0f2f5',
      '& fieldset': {
        borderColor: '#1976d2',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
      '& fieldset': {
        borderColor: '#1976d2',
        borderWidth: '2px',
      },
    },
  },
}

const AuditLogsFilter: React.FC<AuditLogsFilterProps> = ({
  currentTab,
  onFilterChange,
  onReset,
}) => {
  // State quản lý việc ẩn/hiện bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State quản lý tất cả giá trị lọc
  const [filters, setFilters] = useState<AuditLogsFilterState>({
    searchText: '',
    dateFrom: dayjs().subtract(7, 'day'),
    dateTo: dayjs(),
    activityStatus: 'all',
    tableName: 'all',
    action: 'all',
  })

  // Tính số lượng filter đang active (cho badge)
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    // Date filters (always count if set)
    if (filters.dateFrom && !filters.dateFrom.isSame(dayjs().subtract(7, 'day'), 'day')) {
      count++
    }
    if (filters.dateTo && !filters.dateTo.isSame(dayjs(), 'day')) {
      count++
    }
    
    // Tab-specific filters
    if (currentTab === 'activity') {
      if (filters.activityStatus !== 'all') count++
    } else if (currentTab === 'data') {
      if (filters.tableName !== 'all') count++
      if (filters.action !== 'all') count++
    }
    
    return count
  }, [filters, currentTab])

  // Handler chung cho các input
  const handleChange = (field: keyof AuditLogsFilterState, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handler xóa search text
  const handleClearSearch = () => {
    handleChange('searchText', '')
  }

  // Xử lý áp dụng bộ lọc
  const handleApplyFilter = () => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }

  // Xử lý reset bộ lọc
  const handleResetFilter = () => {
    const resetFilters: AuditLogsFilterState = {
      searchText: '',
      dateFrom: dayjs().subtract(7, 'day'),
      dateTo: dayjs(),
      activityStatus: 'all',
      tableName: 'all',
      action: 'all',
    }
    setFilters(resetFilters)
    if (onReset) {
      onReset()
    }
    if (onFilterChange) {
      onFilterChange(resetFilters)
    }
  }

  // Debounced search (500ms) - chỉ trigger khi user ngừng gõ
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(filters)
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchText])

  // Instant filter cho các dropdown và date (không cần debounce)
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo, filters.activityStatus, filters.tableName, filters.action])

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
        {/* Phần tìm kiếm và nút lọc */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 1. Thanh Tìm kiếm */}
          <Box sx={{ flex: '1 1 auto', maxWidth: 480, minWidth: 280 }}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo người thực hiện, IP, hành động, mô tả..."
              value={filters.searchText}
              onChange={(e) => handleChange('searchText', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#1976d2', fontSize: '1.3rem' }} />
                  </InputAdornment>
                ),
                endAdornment: filters.searchText && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{ 
                        padding: '4px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                        } 
                      }}
                    >
                      <CloseIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText={
                filters.searchText ? (
                  <Typography 
                    variant="caption" 
                    component="span" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      color: 'text.secondary',
                    }}
                  >
                    <SearchIcon sx={{ fontSize: '0.875rem' }} />
                    Tự động tìm kiếm khi gõ...
                  </Typography>
                ) : null
              }
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

          {/* 2. Nút Lọc với Badge */}
          <Tooltip title={advancedOpen ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'} arrow>
            <Box sx={{ flex: '0 0 auto', minWidth: 120 }}>
              <Badge 
                badgeContent={activeFilterCount} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    minWidth: 20,
                    height: 20,
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
                    minWidth: 120,
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
        </Box>

        {/* === BỘ LỌC NÂNG CAO === */}
        <Collapse in={advancedOpen} timeout="auto">
          <Box sx={{ pt: 3, mt: 3 }}>
            {/* Tiêu đề */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Divider sx={{ flex: 1, borderColor: '#e3f2fd' }} />
            </Box>

            {/* Row 1: Khoảng thời gian */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
              📅 Khoảng thời gian
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Từ ngày */}
              <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
                <DatePicker
                  label="Từ ngày"
                  value={filters.dateFrom}
                  onChange={(date) => handleChange('dateFrom', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: filterInputStyles,
                    },
                  }}
                />
              </Box>

              {/* Đến ngày */}
              <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
                <DatePicker
                  label="Đến ngày"
                  value={filters.dateTo}
                  onChange={(date) => handleChange('dateTo', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: filterInputStyles,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Row 2: Bộ lọc theo tab */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                mt: 3,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
              {currentTab === 'activity' ? '👤 Bộ lọc hoạt động' : '💾 Bộ lọc dữ liệu'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Activity Logs Filters */}
              {currentTab === 'activity' && (
                <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={filters.activityStatus}
                      label="Trạng thái"
                      onChange={(e) => handleChange('activityStatus', e.target.value)}
                      sx={filterInputStyles}>
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Data Logs Filters */}
              {currentTab === 'data' && (
                <>
                  <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Bảng dữ liệu</InputLabel>
                      <Select
                        value={filters.tableName}
                        label="Bảng dữ liệu"
                        onChange={(e) => handleChange('tableName', e.target.value)}
                        sx={filterInputStyles}>
                        {tableOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Hành động</InputLabel>
                      <Select
                        value={filters.action}
                        label="Hành động"
                        onChange={(e) => handleChange('action', e.target.value)}
                        sx={filterInputStyles}>
                        {actionOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
            </Box>

            {/* Action Buttons */}
            <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={handleApplyFilter}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 140,
                  height: 42,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                }}>
                Áp dụng lọc
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  )
}

export default AuditLogsFilter
