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
  Autocomplete,
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
import CheckIcon from '@mui/icons-material/Check'
import { Dayjs } from 'dayjs'

// Interface cho state của filter
export interface InvoiceFilterState {
  searchText: string
  dateFrom: Dayjs | null
  dateTo: Dayjs | null
  invoiceStatus: string[]
  taxStatus: string
  customer: string | null
  project: string | null
  invoiceType: string[]
  amountFrom: string
  amountTo: string
}

// Interface cho props
interface InvoiceFilterProps {
  onFilterChange?: (filters: InvoiceFilterState) => void
  onReset?: () => void
}

// Dữ liệu mẫu cho Selects - đồng bộ với InvoiceManagement
const allInvoiceStatus = [
  'Nháp',
  'Đã ký',
  'Đã phát hành',
  'Đã gửi',
  'Bị từ chối',
  'Đã thanh toán',
  'Đã hủy',
]

const allTaxStatus = ['Chờ đồng bộ', 'Đã đồng bộ', 'Lỗi']

const allInvoiceTypes = [
  'Hóa đơn GTGT',
  'Hóa đơn Bán hàng',
  'Hóa đơn Điều chỉnh',
  'Hóa đơn Thay thế',
]

const mockCustomers = [
  { label: 'Công ty TNHH ABC Technology' },
  { label: 'Công ty Cổ phần XYZ Solutions' },
  { label: 'Doanh nghiệp Tư nhân DEF' },
  { label: 'Công ty TNHH GHI Logistics' },
  { label: 'Tập đoàn JKL Group' },
  { label: 'Công ty CP MNO Trading' },
]

const mockProjects = [
  { label: 'Dự án Website TMĐT' },
  { label: 'Dự án Mobile App iOS' },
  { label: 'Dự án ERP System' },
  { label: 'Dự án Cloud Migration' },
  { label: 'Dự án AI/ML Platform' },
]

const InvoiceFilter: React.FC<InvoiceFilterProps> = ({ onFilterChange, onReset }) => {
  // State quản lý việc ẩn/hiện bộ lọc nâng cao
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // State quản lý tất cả giá trị lọc
  const [filters, setFilters] = useState<InvoiceFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    invoiceStatus: [],
    taxStatus: '',
    customer: null,
    project: null,
    invoiceType: [],
    amountFrom: '',
    amountTo: '',
  })

  // Handler chung cho các input
  const handleChange = (field: keyof InvoiceFilterState, value: unknown) => {
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
    const resetFilters: InvoiceFilterState = {
      searchText: '',
      dateFrom: null,
      dateTo: null,
      invoiceStatus: [],
      taxStatus: '',
      customer: null,
      project: null,
      invoiceType: [],
      amountFrom: '',
      amountTo: '',
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
              placeholder="Tìm kiếm theo Số HĐ, Ký hiệu, Tên khách hàng..."
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

            {/* Row 1: Thời gian & Trạng thái */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              📅 Thời gian & Trạng thái
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Từ ngày - Đến ngày */}
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

              {/* Trạng thái Hóa đơn */}
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái Hóa đơn</InputLabel>
                  <Select
                    multiple
                    value={filters.invoiceStatus}
                    onChange={(e) => handleChange('invoiceStatus', e.target.value)}
                    input={<OutlinedInput label="Trạng thái Hóa đơn" />}
                    renderValue={(selected) =>
                      selected.length > 2 ? `${selected.length} trạng thái` : selected.join(', ')
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
                    {allInvoiceStatus.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Checkbox
                          checked={filters.invoiceStatus.indexOf(status) > -1}
                          size="small"
                          sx={{
                            color: '#1976d2',
                            '&.Mui-checked': {
                              color: '#1976d2',
                            },
                          }}
                        />
                        <ListItemText primary={status} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Trạng thái CQT */}
              <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái CQT</InputLabel>
                  <Select
                    value={filters.taxStatus}
                    label="Trạng thái CQT"
                    onChange={(e) => handleChange('taxStatus', e.target.value)}
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
                    {allTaxStatus.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 2: Khách hàng & Dự án */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              👥 Khách hàng & Dự án
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* Khách hàng */}
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <Autocomplete
                  size="small"
                  options={mockCustomers}
                  value={mockCustomers.find((c) => c.label === filters.customer) || null}
                  onChange={(_e, value) => handleChange('customer', value?.label || null)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Khách hàng"
                      placeholder="Chọn hoặc nhập tên khách hàng..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
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
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* Dự án */}
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <Autocomplete
                  size="small"
                  options={mockProjects}
                  value={mockProjects.find((p) => p.label === filters.project) || null}
                  onChange={(_e, value) => handleChange('project', value?.label || null)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dự án"
                      placeholder="Chọn hoặc nhập tên dự án..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
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
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Row 3: Loại HĐ & Số tiền */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                mt: 3,
                color: '#666',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
              📝 Loại hóa đơn & Số tiền
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
              {/* Loại Hóa đơn */}
              <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Loại Hóa đơn</InputLabel>
                  <Select
                    multiple
                    value={filters.invoiceType}
                    onChange={(e) => handleChange('invoiceType', e.target.value)}
                    input={<OutlinedInput label="Loại Hóa đơn" />}
                    renderValue={(selected) =>
                      selected.length > 1 ? `${selected.length} loại HĐ` : selected.join(', ')
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
                    {allInvoiceTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Checkbox
                          checked={filters.invoiceType.indexOf(type) > -1}
                          size="small"
                          sx={{
                            color: '#1976d2',
                            '&.Mui-checked': {
                              color: '#1976d2',
                            },
                          }}
                        />
                        <ListItemText primary={type} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Khoảng tiền */}
              <Box sx={{ flex: '1 1 20%', minWidth: 180 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Số tiền từ"
                  type="number"
                  placeholder="0"
                  value={filters.amountFrom}
                  onChange={(e) => handleChange('amountFrom', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                          VNĐ
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
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
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 20%', minWidth: 180 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Số tiền đến"
                  type="number"
                  placeholder="0"
                  value={filters.amountTo}
                  onChange={(e) => handleChange('amountTo', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                          VNĐ
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
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
                    },
                  }}
                />
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

export default InvoiceFilter
