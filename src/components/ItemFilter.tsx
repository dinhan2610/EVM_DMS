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
import { useCategories } from '@/hooks/useCategories'

// ==================== INTERFACES ====================

export interface ItemFilterState {
  searchText: string
  categoryIds: number[] // Multi-select categories
  status: 'all' | 'active' | 'inactive'
  vatRates: string[] // Multi-select VAT rates
  priceRange: 'all' | 'under1m' | '1m-5m' | '5m-10m' | 'over10m'
}

interface ItemFilterProps {
  onFilterChange?: (filters: ItemFilterState) => void
  onReset?: () => void
  totalResults?: number
  filteredResults?: number
  actionButton?: React.ReactNode
}

// ==================== CONSTANTS ====================

// VAT Rates options
const VAT_RATE_OPTIONS = [
  { value: '0%', label: '0%' },
  { value: '5%', label: '5%' },
  { value: '8%', label: '8%' },
  { value: '10%', label: '10%' },
]

// Price Range options
const PRICE_RANGE_OPTIONS = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'under1m', label: 'Dưới 1 triệu' },
  { value: '1m-5m', label: '1 - 5 triệu' },
  { value: '5m-10m', label: '5 - 10 triệu' },
  { value: 'over10m', label: 'Trên 10 triệu' },
]

// ==================== COMPONENT ====================

const ItemFilter: React.FC<ItemFilterProps> = ({
  onFilterChange,
  onReset,
  totalResults = 0,
  filteredResults = 0,
  actionButton,
}) => {
  // State - UI
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Categories from API
  const { categories, loading: isLoadingCategories } = useCategories()

  // State - Filter values
  const [filters, setFilters] = useState<ItemFilterState>({
    searchText: '',
    categoryIds: [],
    status: 'all',
    vatRates: [],
    priceRange: 'all',
  })

  // Ref để track lần đầu mount
  const isFirstMount = useRef(true)

  // ==================== COMPUTED VALUES ====================

  // Tính số lượng filters đang active
  const getActiveFilterCount = useCallback(() => {
    let count = 0

    if (filters.searchText?.trim()) count++
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(-1)) count++ // -1 = ALL
    if (filters.status !== 'all') count++
    if (filters.vatRates.length > 0 && !filters.vatRates.includes('ALL')) count++
    if (filters.priceRange !== 'all') count++

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
    filters.categoryIds,
    filters.status,
    filters.vatRates,
    filters.priceRange,
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

  const handleChange = (field: keyof ItemFilterState, value: unknown) => {
    let processedValue = value

    // Xử lý logic "Chọn tất cả" cho Category
    if (field === 'categoryIds' && Array.isArray(value)) {
      const hasSelectAll = value.includes(-1)
      const prevHasSelectAll = filters.categoryIds.includes(-1)
      const allCategoryIds = categories.map((c) => c.id)

      if (hasSelectAll && !prevHasSelectAll) {
        processedValue = [-1, ...allCategoryIds]
      } else if (!hasSelectAll && prevHasSelectAll) {
        processedValue = []
      } else if (hasSelectAll && value.length < allCategoryIds.length + 1) {
        processedValue = value.filter((v) => v !== -1)
      } else if (!hasSelectAll && value.length === allCategoryIds.length) {
        processedValue = [-1, ...value]
      }
    }

    // Xử lý logic "Chọn tất cả" cho VAT Rates
    if (field === 'vatRates' && Array.isArray(value)) {
      const hasSelectAll = value.includes('ALL')
      const prevHasSelectAll = filters.vatRates.includes('ALL')
      const allVatValues = VAT_RATE_OPTIONS.map((v) => v.value)

      if (hasSelectAll && !prevHasSelectAll) {
        processedValue = ['ALL', ...allVatValues]
      } else if (!hasSelectAll && prevHasSelectAll) {
        processedValue = []
      } else if (hasSelectAll && value.length < allVatValues.length + 1) {
        processedValue = value.filter((v) => v !== 'ALL')
      } else if (!hasSelectAll && value.length === allVatValues.length) {
        processedValue = ['ALL', ...value]
      }
    }

    setFilters((prev) => ({
      ...prev,
      [field]: processedValue,
    }))
  }

  const handleResetFilter = () => {
    const resetFilters: ItemFilterState = {
      searchText: '',
      categoryIds: [],
      status: 'all',
      vatRates: [],
      priceRange: 'all',
    }
    setFilters(resetFilters)
    if (onReset) onReset()
    if (onFilterChange) onFilterChange(resetFilters)
  }

  // ==================== RENDER ====================

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
      }}
    >
      {/* ========== ROW 1: Search + Filter Button + Action ========== */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {/* Search Input */}
        <Box sx={{ flex: '1 1 auto', maxWidth: 480, minWidth: 200 }}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm theo mã, tên, mô tả sản phẩm..."
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

        {/* Action Button */}
        {actionButton && (
          <Box sx={{ flex: '0 0 auto', ml: 'auto' }}>
            {actionButton}
          </Box>
        )}
      </Box>

      {/* ========== ADVANCED FILTERS (Collapse) ========== */}
      <Collapse in={advancedOpen} timeout="auto">
        <Box sx={{ pt: 3, mt: 3 }}>
          <Divider sx={{ mb: 3, borderColor: '#e3f2fd' }} />

          {/* Row 2: Status & Category & VAT */}
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1.5, color: '#666', fontWeight: 600, fontSize: '0.8rem' }}
          >
            🏷️ Trạng thái & Danh mục
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {/* Status Filter */}
            <Box sx={{ flex: '1 1 20%', minWidth: 180 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  label="Trạng thái"
                  onChange={(e) => handleChange('status', e.target.value)}
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
                  <MenuItem value="all">Tất cả trạng thái</MenuItem>
                  <MenuItem value="active">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                      Đang hoạt động
                    </Box>
                  </MenuItem>
                  <MenuItem value="inactive">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9e9e9e' }} />
                      Ngừng hoạt động
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Category Multi-Select */}
            <Box sx={{ flex: '1 1 40%', minWidth: 250 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Danh mục sản phẩm</InputLabel>
                <Select
                  multiple
                  value={filters.categoryIds}
                  onChange={(e) => handleChange('categoryIds', e.target.value)}
                  input={<OutlinedInput label="Danh mục sản phẩm" />}
                  renderValue={(selected) => {
                    const filteredSelected = selected.filter((s) => s !== -1)
                    if (selected.includes(-1) || filteredSelected.length === categories.length) {
                      return 'Tất cả danh mục'
                    }
                    if (filteredSelected.length > 2) return `${filteredSelected.length} danh mục`
                    return filteredSelected
                      .map((id) => categories.find((c) => c.id === id)?.name || id)
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
                  <MenuItem value={-1} sx={{ borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                    <Checkbox
                      checked={filters.categoryIds.includes(-1)}
                      size="small"
                      sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                    />
                    <ListItemText
                      primary="Chọn tất cả"
                      primaryTypographyProps={{ fontWeight: 600, color: '#1976d2' }}
                    />
                  </MenuItem>
                  {isLoadingCategories ? (
                    <MenuItem disabled>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        Đang tải danh mục...
                      </Typography>
                    </MenuItem>
                  ) : (
                    categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Checkbox
                          checked={filters.categoryIds.indexOf(category.id) > -1}
                          size="small"
                          sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                        />
                        <ListItemText primary={category.name} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* VAT Rates Multi-Select */}
            <Box sx={{ flex: '1 1 20%', minWidth: 160 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Thuế GTGT</InputLabel>
                <Select
                  multiple
                  value={filters.vatRates}
                  onChange={(e) => handleChange('vatRates', e.target.value)}
                  input={<OutlinedInput label="Thuế GTGT" />}
                  renderValue={(selected) => {
                    const filteredSelected = selected.filter((s) => s !== 'ALL')
                    if (selected.includes('ALL') || filteredSelected.length === VAT_RATE_OPTIONS.length) {
                      return 'Tất cả thuế suất'
                    }
                    if (filteredSelected.length > 2) return `${filteredSelected.length} thuế suất`
                    return filteredSelected.join(', ')
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
                      checked={filters.vatRates.includes('ALL')}
                      size="small"
                      sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                    />
                    <ListItemText
                      primary="Chọn tất cả"
                      primaryTypographyProps={{ fontWeight: 600, color: '#1976d2' }}
                    />
                  </MenuItem>
                  {VAT_RATE_OPTIONS.map((vat) => (
                    <MenuItem key={vat.value} value={vat.value}>
                      <Checkbox
                        checked={filters.vatRates.indexOf(vat.value) > -1}
                        size="small"
                        sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                      />
                      <ListItemText primary={vat.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Row 3: Price Range */}
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1.5, color: '#666', fontWeight: 600, fontSize: '0.8rem' }}
          >
            💰 Mức giá
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {/* Price Range */}
            <Box sx={{ flex: '0 0 auto', minWidth: 200 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Khoảng giá</InputLabel>
                <Select
                  value={filters.priceRange}
                  label="Khoảng giá"
                  onChange={(e) => handleChange('priceRange', e.target.value)}
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
                  {PRICE_RANGE_OPTIONS.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
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
                  Hiển thị <strong style={{ color: '#1976d2' }}>{filteredResults}</strong> / {totalResults} sản phẩm
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
  )
}

export default ItemFilter
