import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Stack,
  alpha,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import { useNavigate, useParams } from 'react-router-dom'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AttachFileIcon from '@mui/icons-material/AttachFile'

// ==================== INTERFACES ====================

/**
 * Interface cho dòng item trong bảng kê
 */
interface StatementItem {
  id: number
  stt: number
  itemName: string      // Tên hàng hóa/dịch vụ
  unit: string          // Đơn vị tính
  quantity: number      // Số lượng
  unitPrice: number     // Đơn giá
  amount: number        // Thành tiền (auto calculated)
  vatRate: number       // Thuế suất GTGT (0, 5, 8, 10)
  note: string          // Ghi chú
}

/**
 * Interface cho Customer
 */
interface Customer {
  id: number
  name: string
  taxCode: string
  address: string
  email: string
  phone: string
}

/**
 * Interface cho form data
 */
interface StatementForm {
  customerId: number | null
  period: Dayjs | null
  previousDebt: number
  items: StatementItem[]
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format currency to VND
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

/**
 * Parse number from string, return 0 if invalid
 */
const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Validate VAT rate (only 0, 5, 8, 10)
 */
const normalizeVatRate = (rate: number): number => {
  const validRates = [0, 5, 8, 10]
  const closest = validRates.reduce((prev, curr) => 
    Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
  )
  return closest
}

// ==================== MOCK DATA ====================

const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'Công ty TNHH Công nghệ ABC',
    taxCode: '0123456789',
    address: '123 Đường Láng, Đống Đa, Hà Nội',
    email: 'abc@company.com',
    phone: '024 1234 5678',
  },
  {
    id: 2,
    name: 'Công ty CP Viễn thông XYZ',
    taxCode: '0987654321',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    email: 'xyz@company.com',
    phone: '028 9876 5432',
  },
  {
    id: 3,
    name: 'Doanh nghiệp tư nhân Minh Tuấn',
    taxCode: '0111222333',
    address: '789 Trần Phú, Hải Châu, Đà Nẵng',
    email: 'minhtuan@company.com',
    phone: '0236 3333 444',
  },
]

/**
 * Create empty statement item
 */
const createEmptyItem = (stt: number): StatementItem => ({
  id: Date.now() + stt,
  stt,
  itemName: '',
  unit: 'Cái',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  vatRate: 10,
  note: '',
})

// ==================== MAIN COMPONENT ====================

const CreateStatement = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id

  // ==================== STATE ====================
  const [formData, setFormData] = useState<StatementForm>({
    customerId: null,
    period: dayjs(),
    previousDebt: 0,
    items: [createEmptyItem(1)],
  })
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoadingDebt, setIsLoadingDebt] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  })

  // ==================== CALCULATIONS (Real-time) ====================
  const calculations = useMemo(() => {
    const totalGoods = formData.items.reduce((sum, item) => sum + item.amount, 0)
    const totalVAT = formData.items.reduce((sum, item) => {
      return sum + (item.amount * item.vatRate) / 100
    }, 0)
    const grandTotal = totalGoods + totalVAT + formData.previousDebt

    return {
      totalGoods,
      totalVAT,
      grandTotal,
    }
  }, [formData.items, formData.previousDebt])

  // ==================== HANDLERS - FORM ====================
  const handleCustomerChange = useCallback((_event: React.SyntheticEvent, newValue: Customer | null) => {
    setSelectedCustomer(newValue)
    setFormData((prev) => ({ ...prev, customerId: newValue?.id || null }))
  }, [])

  const handlePeriodChange = useCallback((newValue: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, period: newValue }))
  }, [])

  const handlePreviousDebtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setFormData((prev) => ({ ...prev, previousDebt: value }))
  }, [])

  // ==================== KILLER FEATURE 1: AUTO FETCH DEBT ====================
  const handleAutoFetchDebt = useCallback(async () => {
    if (!selectedCustomer) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn khách hàng trước',
        severity: 'warning',
      })
      return
    }

    setIsLoadingDebt(true)

    // Simulate API call: fetchCustomerDebt(customerId)
    setTimeout(() => {
      const mockDebt = Math.floor(Math.random() * 50000000) + 5000000
      setFormData((prev) => ({ ...prev, previousDebt: mockDebt }))
      setIsLoadingDebt(false)
      setSnackbar({
        open: true,
        message: `Đã tải nợ kỳ trước: ${formatCurrency(mockDebt)}`,
        severity: 'success',
      })
    }, 1500)
  }, [selectedCustomer])

  // ==================== HANDLERS - ITEMS ====================
  const handleProcessRowUpdate = useCallback((newRow: StatementItem) => {
    // Validate và normalize data
    const quantity = Math.max(0, parseNumber(newRow.quantity))
    const unitPrice = Math.max(0, parseNumber(newRow.unitPrice))
    const vatRate = normalizeVatRate(parseNumber(newRow.vatRate))

    // Real-time calculation: Amount = Quantity * UnitPrice
    const updatedRow: StatementItem = {
      ...newRow,
      itemName: String(newRow.itemName || '').trim(),
      unit: String(newRow.unit || 'Cái').trim(),
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
      vatRate,
      note: String(newRow.note || '').trim(),
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === updatedRow.id ? updatedRow : item)),
    }))

    return updatedRow
  }, [])

  const handleProcessRowUpdateError = useCallback((error: Error) => {
    console.error('Row update error:', error)
    setSnackbar({
      open: true,
      message: 'Lỗi khi cập nhật dữ liệu',
      severity: 'error',
    })
  }, [])

  const handleAddRow = useCallback(() => {
    const newItem = createEmptyItem(formData.items.length + 1)
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }, [formData.items.length])

  const handleDeleteRow = useCallback((id: number) => {
    setFormData((prev) => {
      if (prev.items.length === 1) {
        setSnackbar({
          open: true,
          message: 'Phải có ít nhất 1 dòng dữ liệu',
          severity: 'error',
        })
        return prev
      }

      const filteredItems = prev.items.filter((item) => item.id !== id)
      // Re-index STT
      const reindexedItems = filteredItems.map((item, idx) => ({
        ...item,
        stt: idx + 1,
      }))

      return { ...prev, items: reindexedItems }
    })
  }, [])

  // ==================== KILLER FEATURE 2: EXCEL IMPORT ====================
  const handleFileUpload = useCallback(async (file: File) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        // Dynamic import XLSX
        const XLSX = await import('xlsx')
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 }) as unknown[][]

        if (jsonData.length <= 1) {
          setSnackbar({
            open: true,
            message: 'File Excel không có dữ liệu hoặc chỉ có header',
            severity: 'error',
          })
          return
        }

        // Skip header row (index 0), parse từ row 1
        const importedItems = jsonData
          .slice(1)
          .filter((row: unknown) => Array.isArray(row) && row[0]) // Chỉ lấy row có tên hàng hóa
          .map((row: unknown, idx: number) => {
            const rowArray = row as unknown[]
            const quantity = parseNumber((rowArray[2] as string | number) || 1)
            const unitPrice = parseNumber((rowArray[3] as string | number) || 0)
            const vatRate = normalizeVatRate(parseNumber((rowArray[4] as string | number) || 10))

            return {
              id: Date.now() + idx,
              stt: idx + 1,
              itemName: String(rowArray[0] || '').trim(),
              unit: String(rowArray[1] || 'Cái').trim(),
              quantity,
              unitPrice,
              amount: quantity * unitPrice,
              vatRate,
              note: String(rowArray[5] || '').trim(),
            }
          })

        if (importedItems.length === 0) {
          setSnackbar({
            open: true,
            message: 'Không tìm thấy dữ liệu hợp lệ trong file Excel',
            severity: 'warning',
          })
          return
        }

        setFormData((prev) => ({ ...prev, items: importedItems }))
        setSnackbar({
          open: true,
          message: `✓ Đã nhập thành công ${importedItems.length} dòng từ Excel`,
          severity: 'success',
        })
      } catch (error) {
        console.error('Import Excel error:', error)
        setSnackbar({
          open: true,
          message: 'Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng',
          severity: 'error',
        })
      }
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        handleFileUpload(file)
      } else {
        setSnackbar({
          open: true,
          message: 'Chỉ hỗ trợ file Excel (.xlsx, .xls)',
          severity: 'error',
        })
      }
    },
    [handleFileUpload]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  // ==================== FORM ACTIONS ====================
  const handleSaveDraft = useCallback(() => {
    if (!selectedCustomer || !formData.period) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin khách hàng và kỳ cước',
        severity: 'error',
      })
      return
    }

    console.log('💾 Lưu nháp:', formData)
    setSnackbar({
      open: true,
      message: 'Đã lưu bảng kê dạng nháp',
      severity: 'success',
    })

    setTimeout(() => navigate('/statements'), 1500)
  }, [formData, selectedCustomer, navigate])

  const handleSaveAndExport = useCallback(() => {
    if (!selectedCustomer || !formData.period) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin',
        severity: 'error',
      })
      return
    }

    console.log('📤 Lưu & Kết xuất:', formData, calculations)
    setSnackbar({
      open: true,
      message: 'Đang tạo hóa đơn từ bảng kê...',
      severity: 'info',
    })

    // TODO: Navigate to invoice creation or trigger export
  }, [formData, selectedCustomer, calculations])

  // ==================== DATAGRID COLUMNS ====================
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'stt',
        headerName: 'STT',
        width: 70,
        align: 'center',
        headerAlign: 'center',
        editable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'itemName',
        headerName: 'Tên hàng hóa/Dịch vụ',
        flex: 1,
        minWidth: 250,
        editable: true,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'unit',
        headerName: 'ĐVT',
        width: 100,
        editable: true,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'quantity',
        headerName: 'Số lượng',
        width: 110,
        type: 'number',
        editable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {params.value.toLocaleString('vi-VN')}
          </Typography>
        ),
      },
      {
        field: 'unitPrice',
        headerName: 'Đơn giá',
        width: 150,
        type: 'number',
        editable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1976d2' }}>
            {formatCurrency(params.value as number)}
          </Typography>
        ),
      },
      {
        field: 'amount',
        headerName: 'Thành tiền',
        width: 170,
        editable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2e7d32' }}>
            {formatCurrency(params.value as number)}
          </Typography>
        ),
      },
      {
        field: 'vatRate',
        headerName: 'Thuế suất (%)',
        width: 120,
        editable: true,
        type: 'singleSelect',
        valueOptions: [0, 5, 8, 10],
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#1976d2' }}>
            {params.value}%
          </Typography>
        ),
      },
      {
        field: 'note',
        headerName: 'Ghi chú',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'actions',
        headerName: '',
        width: 70,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteRow(params.row.id)}
            disabled={formData.items.length === 1}
            sx={{
              '&:hover': {
                backgroundColor: alpha('#d32f2f', 0.1),
              },
              '&.Mui-disabled': {
                color: '#ccc',
              },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [formData.items.length, handleDeleteRow]
  )

  // ==================== RENDER ====================
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              {isEditMode ? 'Sửa Bảng kê' : 'Tạo Bảng kê mới'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Nhập thông tin bảng kê công nợ khách hàng theo kỳ
            </Typography>
          </Box>

          {/* Section A: Header - Customer & Period Selection */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                Thông tin cơ bản
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Autocomplete
                    fullWidth
                    options={mockCustomers}
                    getOptionLabel={(option) => option.name}
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Khách hàng" 
                        required 
                        placeholder="Tìm kiếm khách hàng..." 
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            MST: {option.taxCode} • {option.address}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Tháng/Năm"
                      views={['month', 'year']}
                      value={formData.period}
                      onChange={handlePeriodChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          helperText: 'Chọn kỳ báo cáo bảng kê',
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Nợ kỳ trước"
                      type="number"
                      value={formData.previousDebt}
                      onChange={handlePreviousDebtChange}
                      helperText="Số tiền nợ chưa thanh toán từ kỳ trước"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Tự động lấy nợ từ hóa đơn cũ chưa thanh toán">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={handleAutoFetchDebt}
                                disabled={isLoadingDebt}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: alpha('#1976d2', 0.1),
                                  },
                                }}
                              >
                                {isLoadingDebt ? <CircularProgress size={20} /> : <AutorenewIcon />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Paper>

          {/* Section B: Body - Smart Grid with Excel Import */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                Chi tiết hàng hóa/dịch vụ
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
            {/* Toolbar */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1.5}>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Import Excel
                  <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileInputChange} />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddRow}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Thêm dòng
                </Button>
              </Stack>
            </Box>

            {/* Drag & Drop Zone */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: `2px dashed ${isDragging ? '#1976d2' : '#e0e0e0'}`,
                borderRadius: 2,
                backgroundColor: isDragging ? alpha('#1976d2', 0.04) : '#fafafa',
                p: 2,
                mb: 2,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <AttachFileIcon
                sx={{
                  fontSize: 48,
                  color: isDragging ? '#1976d2' : '#bdbdbd',
                  mb: 1,
                  transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              />
              <Typography variant="body1" sx={{ fontWeight: 600, color: isDragging ? '#1976d2' : '#666' }}>
                Kéo thả file Excel vào đây
              </Typography>
              <Typography variant="caption" sx={{ color: '#999' }}>
                Hỗ trợ định dạng .xlsx, .xls
              </Typography>
            </Box>

            {/* Info Alert */}
            <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Định dạng Excel:</strong> Cột A = Tên hàng hóa, B = ĐVT, C = Số lượng, D = Đơn giá, E = Thuế
                suất (%), F = Ghi chú
              </Typography>
            </Alert>

            {/* DataGrid */}
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <DataGrid
                rows={formData.items}
                columns={columns}
                disableRowSelectionOnClick
                autoHeight
                hideFooter
                processRowUpdate={handleProcessRowUpdate}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0',
                    fontWeight: 600,
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                    outline: '2px solid #1976d2',
                  },
                }}
              />
            </Box>
            </Box>
          </Paper>

          {/* Section C: Footer - Summary */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                Tổng kết
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Tổng tiền hàng:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {formatCurrency(calculations.totalGoods)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Tổng tiền thuế GTGT:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {formatCurrency(calculations.totalVAT)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nợ kỳ trước:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: '#f57c00' }}>
                    {formatCurrency(formData.previousDebt)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Tổng thanh toán:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {formatCurrency(calculations.grandTotal)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>

          {/* Action Buttons */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/statements')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 120,
                }}
              >
                Hủy
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSaveDraft}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 140,
                }}
              >
                Lưu nháp
              </Button>
              <Button
                variant="contained"
                startIcon={<PublishOutlinedIcon />}
                onClick={handleSaveAndExport}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 160,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
                  },
                }}
              >
                Lưu & Kết xuất
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* Snackbar Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  )
}

export default CreateStatement
