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
  OutlinedInput,
  Checkbox,
  ListItemText,
  Typography,
  Divider,
  Tooltip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import { Dayjs } from 'dayjs'

// Interface cho state của filter
export interface TaxErrorNotificationFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  status: string[]
  type: string[]
  taxAuthority: string
}

// Interface cho props
interface TaxErrorNotificationFilterProps {
  onFilterChange?: (filters: TaxErrorNotificationFilterState) => void
  onReset?: () => void
}

// Dữ liệu cho Selects
const allStatuses = [
  'Chờ gửi',
  'Đang gửi',
  'CQT Tiếp nhận',
  'CQT Từ chối',
  'Lỗi',
]

const allTypes = [
  'Hủy',
  'Điều chỉnh',
  'Thay thế',
  'Giải trình',
]

const allTaxAuthorities = [
  'Cục Thuế TP. Hà Nội',
  'Cục Thuế TP. Hồ Chí Minh',
  'Cục Thuế TP. Đà Nẵng',
  'Cục Thuế TP. Hải Phòng',
  'Cục Thuế TP. Cần Thơ',
]

const TaxErrorNotificationFilter: React.FC<TaxErrorNotificationFilterProps> = ({ 
  onFilterChange, 
  onReset 
}) => {
  // State quản lý việc ẩn/hiện bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State quản lý tất cả giá trị lọc
  const [filters, setFilters] = useState<TaxErrorNotificationFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    status: [],
    type: [],
    taxAuthority: '',
  })

  // Handler chung cho các input
  const handleChange = (field: keyof TaxErrorNotificationFilterState, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Xử lý áp dụng bộ lọc
  const handleApplyFilter = () => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }

  // Xử lý reset bộ lọc
  const handleResetFilter = () => {
    const resetFilters: TaxErrorNotificationFilterState = {
      searchText: '',
      dateFrom: null,
      dateTo: null,
      status: [],
      type: [],
      taxAuthority: '',
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
        {/* Phần tìm kiếm và nút lọc */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 1. Thanh Tìm kiếm */}
          <Box sx={{ flex: '1 1 auto', maxWidth: 480, minWidth: 280 }}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo Số HĐ, Mã giao dịch, Mã thông báo, Khách hàng..."
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

            {/* Row 1: Thời gian */}
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
            </Box>

            {/* Row 2: Trạng thái & Loại thông báo */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              🏷️ Trạng thái & Loại thông báo
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Trạng thái (Multi-select) */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    multiple
                    value={filters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    input={<OutlinedInput label="Trạng thái" />}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      '&:hover': {
                        backgroundColor: '#f0f2f5',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                      },
                    }}>
                    {allStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Checkbox checked={filters.status.indexOf(status) > -1} />
                        <ListItemText primary={status} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Loại thông báo (Multi-select) */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Loại thông báo</InputLabel>
                  <Select
                    multiple
                    value={filters.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    input={<OutlinedInput label="Loại thông báo" />}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      '&:hover': {
                        backgroundColor: '#f0f2f5',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                      },
                    }}>
                    {allTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Checkbox checked={filters.type.indexOf(type) > -1} />
                        <ListItemText primary={type} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Cơ quan thuế */}
              <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Cơ quan thuế</InputLabel>
                  <Select
                    value={filters.taxAuthority}
                    onChange={(e) => handleChange('taxAuthority', e.target.value)}
                    label="Cơ quan thuế"
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1.5,
                      '&:hover': {
                        backgroundColor: '#f0f2f5',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#fff',
                      },
                    }}>
                    <MenuItem value="">
                      <em>Tất cả</em>
                    </MenuItem>
                    {allTaxAuthorities.map((authority) => (
                      <MenuItem key={authority} value={authority}>
                        {authority}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Divider sx={{ mb: 2, borderColor: '#e3f2fd' }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="secondary"
                size="medium"
                startIcon={<ClearIcon />}
                onClick={handleResetFilter}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  borderWidth: '1.5px',
                  '&:hover': {
                    borderWidth: '1.5px',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  },
                }}>
                Đặt lại
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="medium"
                startIcon={<SearchIcon />}
                onClick={handleApplyFilter}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                  },
                }}>
                Áp dụng
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  )
}

export default TaxErrorNotificationFilter
