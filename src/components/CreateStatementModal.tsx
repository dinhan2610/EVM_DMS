/**
 * CreateStatementModal Component
 * 
 * Modal để tạo Bảng kê công nợ mới với Live Preview
 * Features:
 * - Customer autocomplete (searchable)
 * - Period selector (Month + Year)
 * - Live preview card với opening balance, current charges, total due
 * - Loading states và validation
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
  Stack,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PersonIcon from '@mui/icons-material/Person'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { getAllCustomers, Customer as ApiCustomer } from '@/services/customerService'
import { generateStatement } from '@/services/statementService'

// ==================== INTERFACES ====================

interface Customer {
  id: number
  name: string
  taxCode: string
  address: string
  email: string
}

interface CreateStatementModalProps {
  open: boolean
  onClose: () => void
  onCreate: (customerId: number, month: number, year: number) => void
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get previous month and year
 */
const getPreviousMonth = (): { month: number; year: number } => {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const currentYear = now.getFullYear()
  
  if (month === 0) {
    // If January, go to December of previous year
    return { month: 12, year: currentYear - 1 }
  }
  
  return { month, year: currentYear }
}

/**
 * Generate year options (current year +/- 2)
 */
const getYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
}

// ==================== COMPONENT ====================

const CreateStatementModal = ({ open, onClose, onCreate }: CreateStatementModalProps) => {
  // Customer data state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false)
  const [customersError, setCustomersError] = useState<string | null>(null)
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(getPreviousMonth().month)
  const [selectedYear, setSelectedYear] = useState<number>(getPreviousMonth().year)
  
  // Creation state
  const [creating, setCreating] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Fetch customers from API when modal opens
  useEffect(() => {
    if (open && customers.length === 0) {
      fetchCustomers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /**
   * Fetch all customers from API
   */
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      setCustomersError(null)
      
      const apiCustomers = await getAllCustomers()
      
      // Map API Customer to modal Customer interface
      const mappedCustomers: Customer[] = apiCustomers.map((c: ApiCustomer) => ({
        id: c.customerID,
        name: c.customerName,
        taxCode: c.taxCode,
        address: c.address,
        email: c.contactEmail,
      }))
      
      setCustomers(mappedCustomers)
    } catch (error) {
      console.error('[CreateStatementModal] Error fetching customers:', error)
      setCustomersError('Không thể tải danh sách khách hàng. Vui lòng thử lại.')
    } finally {
      setLoadingCustomers(false)
    }
  }
  
  // Options
  const monthOptions = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ]
  
  const yearOptions = getYearOptions()
  
  // Handle create
  const handleCreate = async () => {
    if (!selectedCustomer || !selectedMonth || !selectedYear) return

    try {
      setCreating(true)
      setCreateError(null)

      // Call real API to generate statement
      const statement = await generateStatement(
        selectedCustomer.id,
        selectedMonth,
        selectedYear
      )

      console.log('✅ Statement created successfully:', statement)

      // Call parent onCreate for additional handling (navigation, refresh, etc.)
      onCreate(selectedCustomer.id, selectedMonth, selectedYear)
      
      handleClose()
    } catch (error) {
      console.error('❌ Error creating statement:', error)
      let errorMessage = 'Không thể tạo bảng kê. Vui lòng thử lại.'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string; message?: string } } }
        // Backend returns error in "detail" field
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      setCreateError(errorMessage)
    } finally {
      setCreating(false)
    }
  }
  
  // Handle close
  const handleClose = () => {
    setSelectedCustomer(null)
    setSelectedMonth(getPreviousMonth().month)
    setSelectedYear(getPreviousMonth().year)
    setCreateError(null)
    onClose()
  }
  
  // Check if create button should be disabled
  const isCreateDisabled = !selectedCustomer || creating
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          height: '650px',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1976d2',
          color: '#fff',
          pb: 1.5,
          pt: 1.5,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DescriptionOutlinedIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Tạo Bảng Kê Mới
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Tạo bảng kê công nợ cho khách hàng
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.15)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* Content - Horizontal Split Layout */}
      <DialogContent sx={{ p: 0, height: 'calc(100% - 135px)', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* LEFT SIDE - Form Inputs */}
          <Box
            sx={{
              flex: '1 1 50%',
              p: 3,
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Error Alert for customer loading */}
            {customersError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {customersError}
                <Button
                  size="small"
                  onClick={fetchCustomers}
                  sx={{ ml: 2 }}
                >
                  Thử lại
                </Button>
              </Alert>
            )}
            
            {/* Customer Select */}
            <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '15px',
            }}
          >
            <PersonIcon sx={{ fontSize: 20, color: '#1976d2' }} />
            Khách hàng
            <Typography component="span" sx={{ color: '#d32f2f', fontSize: '14px' }}>
              *
            </Typography>
          </Typography>
          <Autocomplete
            value={selectedCustomer}
            onChange={(_, newValue) => setSelectedCustomer(newValue)}
            options={customers}
            loading={loadingCustomers}
            getOptionLabel={(option) => `${option.name} - ${option.taxCode}`}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Tìm kiếm khách hàng..."
                variant="outlined"
                size="medium"
                error={!!customersError}
                helperText={customersError}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    MST: {option.taxCode} • {option.email}
                  </Typography>
                </Box>
              </li>
            )}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#d0d0d0',
                },
                '&:hover fieldset': {
                  borderColor: '#1976d2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2,
                },
              },
            }}
          />
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              backgroundColor: '#fff',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
              Địa chỉ
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50', lineHeight: 1.6 }}>
              {selectedCustomer?.address || 'Chưa có thông tin'}
            </Typography>
          </Box>
        </Box>
        
        {/* Period Select */}
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '15px',
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 20, color: '#1976d2' }} />
            Kỳ cước
            <Typography component="span" sx={{ color: '#d32f2f', fontSize: '14px' }}>
              *
            </Typography>
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              fullWidth
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#d0d0d0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: 2,
                  },
                },
              }}
            >
              {monthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              fullWidth
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#d0d0d0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: 2,
                  },
                },
              }}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  Năm {year}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Box>
          </Box>
          
          {/* RIGHT SIDE - Customer Info */}
          <Box
            sx={{
              flex: '1 1 50%',
              p: 3,
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedCustomer ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Info Card */}
                <Box
                  sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    borderRadius: 2.5,
                    border: '1px solid rgba(25, 118, 210, 0.2)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <DescriptionOutlinedIcon sx={{ color: '#fff', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                        {selectedCustomer.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 0.5 }}>
                        Mã số thuế: {selectedCustomer.taxCode}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Kỳ: Tháng {selectedMonth}/{selectedYear}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Instructions */}
                <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Hệ thống sẽ tự động:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <li>
                      <Typography variant="body2">
                        Tính toán nợ đầu kỳ từ kỳ trước
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Tổng hợp các hoá đơn trong kỳ {selectedMonth}/{selectedYear}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Tạo bảng kê và gửi email thông báo
                      </Typography>
                    </li>
                  </Box>
                </Alert>

                {/* Error Display */}
                {createError && (
                  <Alert severity="error" onClose={() => setCreateError(null)}>
                    {createError}
                  </Alert>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  borderRadius: 3,
                  border: '2px dashed #d0d0d0',
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 48, color: '#999' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#666', fontWeight: 600, mb: 1 }}>
                  Chưa có dữ liệu xem trước
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', maxWidth: 250 }}>
                  Vui lòng chọn khách hàng và kỳ cước để xem trước số liệu
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      {/* Footer */}
      <DialogActions
        sx={{
          borderTop: '1px solid #e0e0e0',
          px: 3,
          py: 2,
          gap: 1.5,
          backgroundColor: '#fafafa',
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          size="medium"
          disabled={creating}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2.5,
            px: 3,
            py: 0.8,
            color: '#666',
            borderColor: '#d0d0d0',
            fontSize: '14px',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isCreateDisabled}
          variant="contained"
          size="medium"
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2.5,
            px: 4,
            py: 0.8,
            fontSize: '14px',
            backgroundColor: '#1976d2',
            boxShadow: '0 4px 14px rgba(25, 118, 210, 0.35)',
            minWidth: 140,
            '&:hover': {
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.45)',
              backgroundColor: '#1565c0',
            },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#999',
              boxShadow: 'none',
            },
          }}
        >
          {creating ? (
            <>
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="span"
                  sx={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                Đang tạo...
              </Box>
            </>
          ) : (
            'Tạo Bảng Kê'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateStatementModal
