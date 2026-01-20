/**
 * 🎯 USER FILTER COMPONENT
 * Professional filter system for User Management page
 * 
 * @component UserFilter
 * @description Advanced filtering with expandable/collapsible sections
 * 
 * Design principles:
 * - Clean, modern UI with smooth transitions
 * - Responsive layout (mobile-first)
 * - Color consistency: Primary blue (#1976d2), Neutral grays
 * - Accessibility: Tooltips, ARIA labels, keyboard navigation
 * - Performance: Optimized re-renders, debounced search
 * 
 * @author EIMS Team
 * @created 2026-01-20 - Optimized from InvoiceFilter pattern
 */

import React, { useState, useEffect } from 'react'
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

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * Filter state interface
 * Essential filter criteria cho User Management
 */
export interface UserFilterState {
  searchText: string           // Tìm kiếm tên/email/số ĐT
  roles: string[]              // Lọc theo vai trò (Admin, HOD, Accountant, Sale)
  status: string               // Trạng thái: Tất cả, Hoạt động, Vô hiệu
  dateFrom: Dayjs | null       // Ngày tham gia từ
  dateTo: Dayjs | null         // Ngày tham gia đến
}

/**
 * Component props
 */
interface UserFilterProps {
  onFilterChange?: (filters: UserFilterState) => void
  onReset?: () => void
  showAdvancedByDefault?: boolean // Mở rộng bộ lọc mặc định
}

// ============================================================================
// CONSTANTS & DATA
// ============================================================================

/**
 * 🎭 Vai trò người dùng (4 roles nội bộ)
 * - Admin: Quản trị viên (full quyền)
 * - HOD: Kế toán trưởng (ký số, duyệt HĐ)
 * - Accountant: Kế toán (xử lý HĐ)
 * - Sale: Nhân viên bán hàng (tạo yêu cầu HĐ)
 */
const ALL_ROLES = [
  { value: 'Admin', label: 'Quản trị viên', color: '#d32f2f' },
  { value: 'HOD', label: 'Kế toán trưởng', color: '#f57c00' },
  { value: 'Accountant', label: 'Kế toán', color: '#388e3c' },
  { value: 'Sale', label: 'Nhân viên bán hàng', color: '#1976d2' },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserFilter: React.FC<UserFilterProps> = ({ 
  onFilterChange, 
  onReset,
  showAdvancedByDefault = false 
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  // Trạng thái mở/đóng bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(showAdvancedByDefault)

  // Trạng thái tất cả giá trị lọc
  const [filters, setFilters] = useState<UserFilterState>({
    searchText: '',
    roles: [],
    status: 'all',
    dateFrom: null,
    dateTo: null,
  })

  // ✅ OPTIMIZATION: Debounced search for real-time filtering
  useEffect(() => {
    // Debounce search: wait 500ms after user stops typing
    const debounceTimer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(filters)
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchText]) // Only trigger on searchText change

  // ✅ Trigger immediately for other filters (no debounce needed)
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.roles, filters.status, filters.dateFrom, filters.dateTo])

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handler chung cho tất cả input changes
   */
  const handleChange = (field: keyof UserFilterState, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  /**
   * Clear search text
   */
  const handleClearSearch = () => {
    setFilters((prev) => ({
      ...prev,
      searchText: '',
    }))
  }

  /**
   * Áp dụng bộ lọc
   */
  const handleApplyFilter = () => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }

  /**
   * Reset tất cả bộ lọc về trạng thái ban đầu
   */
  const handleResetFilter = () => {
    const resetFilters: UserFilterState = {
      searchText: '',
      roles: [],
      status: 'all',
      dateFrom: null,
      dateTo: null,
    }
    setFilters(resetFilters)
    if (onReset) {
      onReset()
    }
    if (onFilterChange) {
      onFilterChange(resetFilters)
    }
  }

  /**
   * Đếm số filter đang active (để hiển thị badge)
   */
  const getActiveFilterCount = (): number => {
    let count = 0
    if (filters.searchText.trim()) count++
    if (filters.roles.length > 0) count++
    if (filters.status !== 'all') count++
    if (filters.dateFrom || filters.dateTo) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  // ========================================
  // RENDER
  // ========================================

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
        {/* ========================================
            PHẦN 1: THANH TÌM KIẾM & NÚT LỌC
            ======================================== */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 1. Thanh Tìm kiếm */}
          <Box sx={{ flex: '1 1 auto', maxWidth: 520, minWidth: 280 }}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo Tên, Email, Số điện thoại..."
              value={filters.searchText}
              onChange={(e) => handleChange('searchText', e.target.value.trim())}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#1976d2', fontSize: '1.3rem' }} />
                  </InputAdornment>
                ),
                endAdornment: filters.searchText && (
                  <InputAdornment position="end">
                    <Tooltip title="Xóa tìm kiếm" arrow>
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        sx={{
                          padding: '4px',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: '1.1rem', color: '#666' }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              helperText={
                filters.searchText ? (
                  <Typography variant="caption" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
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

          {/* 2. Nút Lọc nâng cao */}
          <Tooltip title={advancedOpen ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'} arrow>
            <Box sx={{ flex: '0 0 auto', minWidth: 120, position: 'relative' }}>
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
                {activeFilterCount > 0 && (
                  <Chip
                    label={activeFilterCount}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: advancedOpen ? 'rgba(255,255,255,0.3)' : '#1976d2',
                      color: advancedOpen ? '#fff' : '#fff',
                    }}
                  />
                )}
              </Button>
            </Box>
          </Tooltip>
        </Box>

        {/* ========================================
            PHẦN 2: BỘ LỌC NÂNG CAO (COLLAPSIBLE)
            ======================================== */}
        <Collapse in={advancedOpen} timeout="auto">
          <Box sx={{ pt: 3, mt: 3 }}>
            <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />

            {/* ========== ROW 1: VAI TRÒ & TRẠNG THÁI ========== */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
              }}>
              🎭 Vai trò & Trạng thái
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Vai trò */}
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    multiple
                    value={filters.roles}
                    onChange={(e) => handleChange('roles', e.target.value)}
                    input={<OutlinedInput label="Vai trò" />}
                    renderValue={(selected) =>
                      selected.length > 2
                        ? `${selected.length} vai trò`
                        : selected
                            .map((role) => ALL_ROLES.find((r) => r.value === role)?.label || role)
                            .join(', ')
                    }
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
                    {ALL_ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Checkbox
                          checked={filters.roles.indexOf(role.value) > -1}
                          size="small"
                          sx={{
                            color: role.color,
                            '&.Mui-checked': {
                              color: role.color,
                            },
                          }}
                        />
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{role.label}</Typography>
                              <Chip 
                                label={role.value} 
                                size="small" 
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.65rem',
                                  backgroundColor: `${role.color}20`,
                                  color: role.color,
                                }} 
                              />
                            </Box>
                          } 
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Trạng thái */}
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái tài khoản</InputLabel>
                  <Select
                    value={filters.status}
                    label="Trạng thái tài khoản"
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
                    <MenuItem value="all">
                      <em>Tất cả trạng thái</em>
                    </MenuItem>
                    <MenuItem value="active">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
                        <Typography>Hoạt động</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#9e9e9e' }} />
                        <Typography>Vô hiệu</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* ========== ROW 2: NGÀY THAM GIA ========== */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
              }}>
              📅 Ngày tham gia
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 220 }}>
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
              <Box sx={{ flex: '1 1 45%', minWidth: 220 }}>
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

            {/* ========== ACTION BUTTONS ========== */}
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

export default UserFilter
