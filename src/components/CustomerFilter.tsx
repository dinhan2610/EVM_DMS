import React, { useState } from 'react'
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
  Chip,
  Badge,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import { Dayjs } from 'dayjs'

// Interface cho state của filter
export interface CustomerFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  status: string
}

// Interface cho props
interface CustomerFilterProps {
  onFilterChange?: (filters: CustomerFilterState) => void
  onReset?: () => void
  onAddCustomer?: () => void
}

// Dữ liệu cho Status
const allStatus = ['Active', 'Inactive']

const CustomerFilter: React.FC<CustomerFilterProps> = ({ onFilterChange, onReset, onAddCustomer }) => {
  // State quản lý việc ẩn/hiện bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State quản lý tất cả giá trị lọc
  const [filters, setFilters] = useState<CustomerFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    status: '',
  })

  // Tính số lượng filter đang active (không tính searchText)
  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.status,
  ].filter(Boolean).length

  // Handler chung cho các input
  const handleChange = (field: keyof CustomerFilterState, value: unknown) => {
    const newFilters = {
      ...filters,
      [field]: value,
    }
    setFilters(newFilters)
    
    // Auto-apply khi thay đổi searchText
    if (field === 'searchText' && onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  // Xử lý áp dụng bộ lọc
  const handleApplyFilter = () => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }

  // Xử lý reset bộ lọc
  const handleResetFilter = () => {
    const resetFilters: CustomerFilterState = {
      searchText: '',
      dateFrom: null,
      dateTo: null,
      status: '',
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
        {/* Phần tìm kiếm, nút lọc và nút thêm */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Group Left: Search + Filter */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', flex: '1 1 auto', minWidth: 320 }}>
            {/* 1. Thanh Tìm kiếm */}
            <Box sx={{ flex: '1 1 auto', maxWidth: 480, minWidth: 280 }}>
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm theo Tên khách hàng, MST, Email..."
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

            {/* 2. Nút Lọc với Badge */}
            <Tooltip title={advancedOpen ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'} arrow>
              <Box sx={{ flex: '0 0 auto', minWidth: 120 }}>
                <Badge 
                  badgeContent={activeFilterCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 12,
                      top: 8,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }
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
                    }}>
                    Lọc
                  </Button>
                </Badge>
              </Box>
            </Tooltip>
          </Box>

          {/* Group Right: Add Button - Căn phải */}
          {onAddCustomer && (
            <Box sx={{ flex: '0 0 auto', minWidth: 180 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="medium"
                startIcon={<AddIcon sx={{ fontSize: '1.2rem' }} />}
                onClick={onAddCustomer}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  height: 42,
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(25, 118, 210, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
                  },
                }}>
                Thêm Khách hàng
              </Button>
            </Box>
          )}
        </Box>

        {/* === BỘ LỌC NÂNG CAO === */}
        <Collapse in={advancedOpen} timeout="auto">
          <Box sx={{ pt: 3, mt: 3 }}>
            {/* Tiêu đề */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: '#1976d2',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}>
                🔍 Bộ lọc nâng cao
              </Typography>
              <Divider sx={{ flex: 1, borderColor: '#e3f2fd' }} />
            </Box>

            {/* Row 1: Thời gian tạo khách hàng */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              📅 Thời gian tạo khách hàng
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Từ ngày */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
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

              {/* Đến ngày */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
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

              {/* Trạng thái */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={filters.status}
                    label="Trạng thái"
                    onChange={(e) => handleChange('status', e.target.value)}
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
                    {allStatus.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                            size="small"
                            color={status === 'Active' ? 'success' : 'default'}
                            variant={status === 'Active' ? 'filled' : 'outlined'}
                            sx={{ 
                              fontWeight: 500, 
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
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

export default CustomerFilter
