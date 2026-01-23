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
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'

// Interface cho state của filter
export interface TemplateFilterState {
  searchText: string
  status: string[]
}

// Interface cho props
interface TemplateFilterProps {
  onFilterChange?: (filters: TemplateFilterState) => void
  onReset?: () => void
  totalResults?: number // Tổng số bản ghi
  filteredResults?: number // Số bản ghi sau khi lọc
  actionButton?: React.ReactNode // Nút action tùy chỉnh (ví dụ: Tạo mẫu mới)
}

// Dữ liệu cho Selects
const allStatus = ['Active', 'Inactive']

const TemplateFilter: React.FC<TemplateFilterProps> = ({ 
  onFilterChange, 
  onReset,
  totalResults = 0,
  filteredResults = 0,
  actionButton,
}) => {
  // State quản lý việc ẩn/hiện bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State quản lý tất cả giá trị lọc
  const [filters, setFilters] = useState<TemplateFilterState>({
    searchText: '',
    status: [],
  })

  // Tính số lượng filters đang active (không đếm 'ALL')
  const getActiveFilterCount = useCallback(() => {
    let count = 0
    
    // Search text
    if (filters.searchText && filters.searchText.trim() !== '') count++
    
    // Status - chỉ đếm nếu không phải 'ALL' và có lựa chọn
    if (filters.status.length > 0 && !filters.status.includes('ALL')) {
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
    filters.status,
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
  const handleChange = (field: keyof TemplateFilterState, value: unknown) => {
    let processedValue = value
    
    // Xử lý logic "Chọn tất cả" cho Trạng thái
    if (field === 'status' && Array.isArray(value)) {
      const hasSelectAll = value.includes('ALL')
      const prevHasSelectAll = filters.status.includes('ALL')
      
      if (hasSelectAll && !prevHasSelectAll) {
        // User vừa chọn "Tất cả" -> chọn tất cả options
        processedValue = ['ALL', ...allStatus]
      } else if (!hasSelectAll && prevHasSelectAll) {
        // User vừa bỏ "Tất cả" -> bỏ chọn tất cả
        processedValue = []
      } else if (hasSelectAll && value.length < allStatus.length + 1) {
        // User bỏ chọn một item -> tự động bỏ "Tất cả"
        processedValue = value.filter((v) => v !== 'ALL')
      } else if (!hasSelectAll && value.length === allStatus.length) {
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
    const resetFilters: TemplateFilterState = {
      searchText: '',
      status: [],
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
            placeholder="Tìm kiếm theo Tên mẫu, Ký hiệu mẫu, Loại mẫu hóa đơn..."
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

        {/* 3. Nút Action (ví dụ: Tạo mẫu mới) */}
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

          {/* Row: Trạng thái */}
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {/* Trạng thái */}
            <Box sx={{ flex: '1 1 100%', minWidth: 250, maxWidth: 400 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  multiple
                  value={filters.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  input={<OutlinedInput label="Trạng thái" />}
                  renderValue={(selected) => {
                    const filteredSelected = selected.filter((s) => s !== 'ALL')
                    if (selected.includes('ALL') || filteredSelected.length === allStatus.length) {
                      return 'Tất cả trạng thái'
                    }
                    return filteredSelected.map(s => s === 'Active' ? 'Đang dùng' : 'Không dùng').join(', ')
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
                      checked={filters.status.includes('ALL')}
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
                  {allStatus.map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox
                        checked={filters.status.indexOf(status) > -1}
                        size="small"
                        sx={{
                          color: '#1976d2',
                          '&.Mui-checked': {
                            color: '#1976d2',
                          },
                        }}
                      />
                      <ListItemText primary={status === 'Active' ? 'Đang dùng' : 'Không dùng'} />
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
  )
}

export default TemplateFilter
