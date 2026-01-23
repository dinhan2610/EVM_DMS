import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import Spinner from '@/components/Spinner'

// ============================================================
// 📋 INTERFACE DEFINITIONS - Cập nhật theo API của bạn
// ============================================================

/**
 * Interface cho Biên Bản Điều Chỉnh/Thay Thế
 * 
 * TODO: Cập nhật interface này theo response từ API backend
 */
export interface AdjustmentReplacementRecord {
  id: string
  recordNumber: string // Số biên bản
  recordDate: string // Ngày lập biên bản
  recordType: 'adjustment' | 'replacement' // Loại: điều chỉnh hoặc thay thế
  originalInvoiceNumber: string // Số hóa đơn gốc
  originalInvoiceSymbol: string // Ký hiệu hóa đơn gốc
  customerName: string // Tên khách hàng
  taxCode: string // MST khách hàng
  reason: string // Lý do điều chỉnh/thay thế
  status: string // Trạng thái biên bản
  statusId: number // ID trạng thái
  createdBy: string // Người lập
  approvedBy?: string // Người duyệt
  amount: number // Số tiền liên quan
  notes?: string // Ghi chú
}

// ============================================================
// 📊 MAPPING FUNCTION - Cập nhật theo API response
// ============================================================

/**
 * Map dữ liệu từ API response sang UI format
 * 
 * TODO: Implement mapping logic theo cấu trúc response từ backend
 * 
 * @param item - Raw data từ API
 * @returns Formatted data cho UI
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const mapRecordToUI = (item: any): AdjustmentReplacementRecord => {
  // TODO: Implement mapping logic
  return {
    id: item.id?.toString() || '0',
    recordNumber: item.recordNumber || '',
    recordDate: item.recordDate || new Date().toISOString(),
    recordType: item.recordType || 'adjustment',
    originalInvoiceNumber: item.originalInvoiceNumber || '',
    originalInvoiceSymbol: item.originalInvoiceSymbol || '',
    customerName: item.customerName || '',
    taxCode: item.taxCode || '',
    reason: item.reason || '',
    status: item.status || 'Chờ xử lý',
    statusId: item.statusId || 1,
    createdBy: item.createdBy || '',
    approvedBy: item.approvedBy,
    amount: item.amount || 0,
    notes: item.notes,
  }
}

// ============================================================
// 🎨 HELPER FUNCTIONS - Styling & Display
// ============================================================

/**
 * Lấy màu cho loại biên bản
 */
const getRecordTypeColor = (type: 'adjustment' | 'replacement'): 'warning' | 'info' => {
  return type === 'adjustment' ? 'warning' : 'info'
}

/**
 * Lấy label cho loại biên bản
 */
const getRecordTypeLabel = (type: 'adjustment' | 'replacement'): string => {
  return type === 'adjustment' ? 'Điều chỉnh' : 'Thay thế'
}

/**
 * Lấy màu cho trạng thái biên bản
 * 
 * TODO: Cập nhật theo status definition của backend
 */
const getStatusColor = (statusId: number): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  // TODO: Map statusId to color
  switch (statusId) {
    case 1: return 'default' // Chờ xử lý
    case 2: return 'primary' // Đang xử lý
    case 3: return 'success' // Đã hoàn thành
    case 4: return 'error' // Từ chối
    default: return 'default'
  }
}

// ============================================================
// 🔧 FILTER INTERFACE
// ============================================================

/**
 * Interface cho bộ lọc
 * 
 * TODO: Customize theo nhu cầu lọc dữ liệu
 */
interface FilterState {
  searchText: string
  dateFrom: Date | null
  dateTo: Date | null
  recordType: string[] // ['adjustment', 'replacement', 'all']
  status: string[] // Status IDs
  customer: string | null
}

// ============================================================
// 📱 MAIN COMPONENT
// ============================================================

const AdjustmentReplacementRecordManagement = () => {
  usePageTitle('Biên Bản Điều Chỉnh/Thay Thế')
  const navigate = useNavigate()
  
  // ============================================================
  // 📊 STATE MANAGEMENT
  // ============================================================
  
  const [records, setRecords] = useState<AdjustmentReplacementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' 
  })
  
  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  })
  
  // Filter state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    recordType: [],
    status: [],
    customer: null,
  })
  
  // Template download menu state
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null)
  const templateMenuOpen = Boolean(templateMenuAnchor)

  // ============================================================
  // 🔌 API INTEGRATION - TODO: Implement your API calls
  // ============================================================
  
  /**
   * Load danh sách biên bản từ API
   * 
   * TODO: Replace with actual API call
   * Example: const response = await apiService.getRecords()
   */
  const loadRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Implement API call here
      // const response = await yourApiService.getAdjustmentReplacementRecords()
      // const mappedData = response.map(item => mapRecordToUI(item))
      // setRecords(mappedData)
      
      // MOCK DATA - Remove this when implementing real API
      const mockData: AdjustmentReplacementRecord[] = []
      setRecords(mockData)
      
      console.log('✅ [AdjustmentReplacementRecords] Data loaded:', mockData.length)
      
    } catch (err) {
      console.error('❌ Failed to load records:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách biên bản')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  // ============================================================
  // 🎯 EVENT HANDLERS - TODO: Implement your business logic
  // ============================================================
  
  /**
   * Tải xuống mẫu biên bản
   * API: GET /api/Email/preview-minutes-template?type={1|2}
   * - type=1: Mẫu biên bản thay thế
   * - type=2: Mẫu biên bản điều chỉnh
   * 
   * ⚡ Fix CORS: Dùng cách mở link trực tiếp thay vì fetch
   */
  const handleDownloadTemplate = (type: 1 | 2) => {
    try {
      const templateName = type === 1 ? 'Thay thế' : 'Điều chỉnh'
      const fileName = type === 1 ? 'Mau_Bien_Ban_Thay_The.html' : 'Mau_Bien_Ban_Dieu_Chinh.html'
      
      console.log(`📄 Tải mẫu biên bản ${templateName}...`)
      
      // ✅ Tạo link download trực tiếp (bypass CORS)
      const apiUrl = `https://eims.site/api/Email/preview-minutes-template?type=${type}`
      
      // Tạo thẻ <a> ẩn để trigger download
      const link = document.createElement('a')
      link.href = apiUrl
      link.download = fileName // Suggest filename
      link.target = '_blank' // Mở tab mới để download
      link.style.display = 'none'
      
      // Thêm vào DOM, click, rồi xóa
      document.body.appendChild(link)
      link.click()
      
      // Cleanup sau 100ms
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
      
      console.log(`✅ Đã khởi tạo tải mẫu biên bản ${templateName}`)
      
      setSnackbar({
        open: true,
        message: `✅ Đang tải xuống mẫu biên bản ${templateName}...`,
        severity: 'success',
      })
      
      // Đóng menu
      setTemplateMenuAnchor(null)
      
    } catch (err) {
      console.error('❌ Tải mẫu biên bản thất bại:', err)
      
      setSnackbar({
        open: true,
        message: `❌ Không thể tải mẫu biên bản: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
      
      setTemplateMenuAnchor(null)
    }
  }
  
  /**
   * Xem chi tiết biên bản
   */
  const handleViewDetail = (recordId: string) => {
    // TODO: Navigate to detail page or open modal
    console.log('View detail:', recordId)
    navigate(`/adjustment-replacement-records/${recordId}`)
  }
  
  /**
   * Tải xuống biên bản PDF
   */
  const handleDownloadPDF = async (recordId: string, recordNumber: string) => {
    try {
      // TODO: Implement PDF download
      console.log('Download PDF:', recordId, recordNumber)
      
      setSnackbar({
        open: true,
        message: `✅ Đã tải xuống biên bản ${recordNumber}.pdf`,
        severity: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Không thể tải PDF: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    }
  }
  
  /**
   * Upload biên bản từ file
   * 
   * TODO: Implement file upload API
   * Expected flow:
   * 1. User chọn file (Excel/PDF)
   * 2. Upload file lên server
   * 3. Server parse và tạo record
   * 4. Reload danh sách
   */
  const handleUploadRecord = async () => {
    try {
      // TODO: Implement file upload dialog
      // const file = await showFilePickerDialog()
      // const formData = new FormData()
      // formData.append('file', file)
      // await uploadRecordFile(formData)
      
      console.log('Upload record clicked - API pending')
      
      setSnackbar({
        open: true,
        message: '⚠️ Chức năng upload đang được phát triển',
        severity: 'warning',
      })
      
      // After successful upload:
      // await loadRecords()
      // setSnackbar({ open: true, message: '✅ Upload biên bản thành công!', severity: 'success' })
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: `❌ Upload thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    }
  }

  // ============================================================
  // 🔍 FILTER LOGIC
  // ============================================================
  
  /**
   * Lọc dữ liệu theo filter state
   * 
   * TODO: Customize filter logic theo requirements
   */
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Lọc theo text search
      const matchesSearch =
        !filters.searchText ||
        record.recordNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.originalInvoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.taxCode.toLowerCase().includes(filters.searchText.toLowerCase())

      // Lọc theo khoảng ngày
      const matchesDateFrom = 
        !filters.dateFrom || 
        dayjs(record.recordDate).isAfter(filters.dateFrom, 'day') || 
        dayjs(record.recordDate).isSame(filters.dateFrom, 'day')
      
      const matchesDateTo = 
        !filters.dateTo || 
        dayjs(record.recordDate).isBefore(filters.dateTo, 'day') || 
        dayjs(record.recordDate).isSame(filters.dateTo, 'day')

      // Lọc theo loại biên bản
      const matchesRecordType = 
        filters.recordType.length === 0 || 
        filters.recordType.includes('all') || 
        filters.recordType.includes(record.recordType)

      // Lọc theo trạng thái
      const matchesStatus = 
        filters.status.length === 0 || 
        filters.status.includes(String(record.statusId))

      // Lọc theo khách hàng
      const matchesCustomer = 
        !filters.customer || 
        filters.customer === 'ALL' || 
        record.customerName === filters.customer

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesRecordType &&
        matchesStatus &&
        matchesCustomer
      )
    })
  }, [records, filters])

  // ============================================================
  // 📋 DATAGRID COLUMNS DEFINITION
  // ============================================================
  
  const columns: GridColDef[] = [
    {
      field: 'recordNumber',
      headerName: 'Số biên bản',
      width: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#1976d2',
                fontSize: '0.875rem',
              }}>
              {value || '-'}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'recordDate',
      headerName: 'Ngày lập',
      width: 120,
      sortable: true,
      type: 'date',
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value: string) => new Date(value),
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: '#546e7a',
              fontSize: '0.875rem',
            }}>
            {dayjs(params.value as Date).format('DD/MM/YYYY')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'recordType',
      headerName: 'Loại',
      width: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const recordType = params.value as 'adjustment' | 'replacement'
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
            <Chip 
              label={getRecordTypeLabel(recordType)} 
              color={getRecordTypeColor(recordType)} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                borderRadius: '20px',
              }}
            />
          </Box>
        )
      },
    },
    {
      field: 'originalInvoiceNumber',
      headerName: 'Số HĐ gốc',
      width: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#2c3e50',
                fontSize: '0.875rem',
              }}>
              {value || '-'}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 200,
      sortable: true,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 2, py: 1.5 }}>
            <Tooltip title={value} arrow placement="top">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#2c3e50',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                {value || '-'}
              </Typography>
            </Tooltip>
          </Box>
        )
      },
    },
    {
      field: 'taxCode',
      headerName: 'MST',
      width: 135,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                letterSpacing: '0.02em',
                color: '#2c3e50',
                fontSize: '0.875rem',
              }}>
              {value || '-'}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'reason',
      headerName: 'Lý do',
      flex: 1.2,
      minWidth: 180,
      sortable: true,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 2, py: 1.5 }}>
            <Tooltip title={value} arrow placement="top">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 400,
                  color: '#546e7a',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontStyle: 'italic',
                }}>
                {value || '-'}
              </Typography>
            </Tooltip>
          </Box>
        )
      },
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const statusId = params.row.statusId as number
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
            <Chip 
              label={params.value as string} 
              color={getStatusColor(statusId)} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                borderRadius: '20px',
              }}
            />
          </Box>
        )
      },
    },
    {
      field: 'amount',
      headerName: 'Số tiền',
      width: 140,
      sortable: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', pr: 3, py: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#2e7d32',
              fontSize: '0.875rem',
            }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(params.value as number)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as AdjustmentReplacementRecord
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 0.5, py: 1.5 }}>
            {/* Icon 1: Xem chi tiết */}
            <Tooltip title="Xem chi tiết" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleViewDetail(record.id)}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Icon 2: Tải PDF */}
            <Tooltip title="Tải PDF" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleDownloadPDF(record.id, record.recordNumber)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'error.main',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      },
    },
  ]

  // ============================================================
  // 🎨 RENDER UI
  // ============================================================

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          
          {/* ============================================================ */}
          {/* HEADER */}
          {/* ============================================================ */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Biên Bản Điều Chỉnh/Thay Thế
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Quản lý các biên bản điều chỉnh và thay thế hóa đơn điện tử
            </Typography>
          </Box>

          {/* ============================================================ */}
          {/* FILTER BAR - TODO: Implement filter component */}
          {/* ============================================================ */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2.5,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fff',
            }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Tổng số: <strong>{filteredRecords.length}</strong> / {records.length} biên bản
              </Typography>
              
              {/* Action buttons group */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Nút tải mắu biên bản */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FileDownloadOutlinedIcon />}
                  endIcon={<ArrowDropDownIcon />}
                  onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    height: 42,
                    minWidth: 180,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      transform: 'translateY(-1px)',
                    },
                  }}>
                  Tải mẫu biên bản
                </Button>
                
                {/* Menu dropdown cho mẫu biên bản */}
                <Menu
                  anchorEl={templateMenuAnchor}
                  open={templateMenuOpen}
                  onClose={() => setTemplateMenuAnchor(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: {
                      elevation: 8,
                      sx: {
                        minWidth: 240,
                        borderRadius: 2,
                        mt: 0.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          py: 1.5,
                          px: 2,
                          gap: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            transform: 'translateX(4px)',
                          },
                        },
                      },
                    },
                  }}>
                  <MenuItem onClick={() => handleDownloadTemplate(1)}>
                    <ListItemIcon>
                      <FileDownloadOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Mẫu biên bản Thay thế"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    />
                  </MenuItem>
                  <MenuItem onClick={() => handleDownloadTemplate(2)}>
                    <ListItemIcon>
                      <FileDownloadOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Mẫu biên bản Điều chỉnh"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    />
                  </MenuItem>
                </Menu>
                
                {/* Nút upload biên bản */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<UploadIcon />}
                  onClick={handleUploadRecord}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    height: 42,
                    minWidth: 160,
                    boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
                      transform: 'translateY(-1px)',
                    },
                  }}>
                  Upload biên bản
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* ============================================================ */}
          {/* LOADING STATE */}
          {/* ============================================================ */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Spinner />
            </Box>
          )}

          {/* ============================================================ */}
          {/* ERROR STATE */}
          {/* ============================================================ */}
          {error && (
            <Paper sx={{ p: 3, mt: 2, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
              <Typography color="error" variant="body1">
                {error}
              </Typography>
            </Paper>
          )}

          {/* ============================================================ */}
          {/* DATA TABLE */}
          {/* ============================================================ */}
          {!loading && !error && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
              <DataGrid
                rows={filteredRecords}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                autoHeight={false}
                rowHeight={64}
                columnHeaderHeight={56}
                density="comfortable"
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: '0 16px',
                    '&.MuiDataGrid-columnHeader--checkbox': {
                      padding: '0 8px',
                    },
                  },
                  '& .MuiDataGrid-columnHeaderCheckbox': {
                    padding: '0',
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1a1a1a',
                    letterSpacing: '0.01em',
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      },
                    },
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '2px solid #e0e0e0',
                    backgroundColor: '#fafafa',
                    minHeight: '64px',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                  '& .MuiTablePagination-root': {
                    overflow: 'visible',
                  },
                  '& .MuiTablePagination-toolbar': {
                    minHeight: '64px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#666',
                    margin: 0,
                  },
                  '& .MuiTablePagination-select': {
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  },
                  '& .MuiTablePagination-actions': {
                    marginLeft: '20px',
                    '& .MuiIconButton-root': {
                      padding: '8px',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                    },
                  },
                }}
              />
            </Paper>
          )}
        </Box>
        
        {/* ============================================================ */}
        {/* SNACKBAR NOTIFICATION */}
        {/* ============================================================ */}
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

export default AdjustmentReplacementRecordManagement
