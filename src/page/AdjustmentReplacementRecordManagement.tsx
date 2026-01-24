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
import UploadMinuteDialog from '@/components/UploadMinuteDialog'

import { getMinutes, type MinuteRecord } from '@/services/minuteService'

// ============================================================
// 📋 INTERFACE DEFINITIONS - Cập nhật theo API response
// ============================================================

/**
 * Interface cho Biên Bản Điều Chỉnh/Thay Thế
 * Map từ MinuteRecord (API) sang UI format
 */
export interface AdjustmentReplacementRecord {
  id: number // minuteInvoiceId
  minuteCode: string // Mã biên bản (ví dụ: BB-DC--1)
  invoiceNo: string // Số hóa đơn gốc
  customerName: string // Tên khách hàng
  minuteType: 'Adjustment' | 'Replacement' // Loại: điều chỉnh hoặc thay thế
  status: string // Trạng thái biên bản
  description: string // Mô tả / Lý do
  filePath: string // URL file PDF
  createdAt: string // Ngày tạo
  createdByName: string // Người tạo
  isSellerSigned: boolean // Người bán đã ký
  isBuyerSigned: boolean // Người mua đã ký
  invoiceId: number // ID hóa đơn
}

// ============================================================
// 📊 MAPPING FUNCTION - Cập nhật theo API response
// ============================================================

/**
 * Map dữ liệu từ API response sang UI format
 * 
 * @param item - MinuteRecord từ API
 * @returns AdjustmentReplacementRecord cho UI
 */
const mapRecordToUI = (item: MinuteRecord): AdjustmentReplacementRecord => {
  return {
    id: item.minuteInvoiceId,
    minuteCode: item.minuteCode,
    invoiceNo: item.invoiceNo || 'Chưa có',
    customerName: item.customerName,
    minuteType: item.minuteType,
    status: item.status,
    description: item.description,
    filePath: item.filePath,
    createdAt: item.createdAt,
    createdByName: item.createdByName,
    isSellerSigned: item.isSellerSigned,
    isBuyerSigned: item.isBuyerSigned,
    invoiceId: item.invoiceId,
  }
}

// ============================================================
// 🎨 HELPER FUNCTIONS - Styling & Display
// ============================================================

/**
 * Lấy màu cho loại biên bản
 */
const getRecordTypeColor = (type: 'Adjustment' | 'Replacement'): 'warning' | 'info' => {
  return type === 'Adjustment' ? 'warning' : 'info'
}

/**
 * Lấy label cho loại biên bản
 */
const getRecordTypeLabel = (type: 'Adjustment' | 'Replacement'): string => {
  return type === 'Adjustment' ? 'Điều chỉnh' : 'Thay thế'
}

/**
 * Lấy màu cho trạng thái biên bản
 */
const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  switch (status) {
    case 'Sent': return 'success' // Đã gửi
    case 'Draft': return 'default' // Bản nháp
    case 'Pending': return 'warning' // Chờ duyệt
    case 'Rejected': return 'error' // Từ chối
    case 'Approved': return 'success' // Đã duyệt
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
  const [filters] = useState<FilterState>({
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

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

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
      
      // Gọi API thật
      const response = await getMinutes()
      const mappedData = response.items.map(item => mapRecordToUI(item))
      setRecords(mappedData)
      
      console.log('✅ [AdjustmentReplacementRecords] Data loaded:', mappedData.length)
      
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
   * Tải xuống biên bản PDF từ Cloudinary
   * Sử dụng filePath từ API response
   */
  const handleDownloadPDF = (recordId: string, minuteCode: string) => {
    try {
      // Tìm record theo ID để lấy filePath
      const record = records.find(r => r.id.toString() === recordId)
      
      if (!record || !record.filePath) {
        setSnackbar({
          open: true,
          message: '❌ Không tìm thấy file PDF của biên bản này',
          severity: 'error',
        })
        return
      }

      console.log('📥 Downloading PDF:', { minuteCode, filePath: record.filePath })
      
      // Tạo link download trực tiếp từ Cloudinary URL
      const link = document.createElement('a')
      link.href = record.filePath
      link.target = '_blank' // Mở trong tab mới
      link.download = `${minuteCode}.pdf` // Gợi ý tên file khi download
      link.style.display = 'none'
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup sau 100ms
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
      
      setSnackbar({
        open: true,
        message: `✅ Đang tải xuống biên bản ${minuteCode}.pdf`,
        severity: 'success',
      })
      
    } catch (err) {
      console.error('❌ Download PDF error:', err)
      setSnackbar({
        open: true,
        message: `❌ Không thể tải PDF: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        severity: 'error',
      })
    }
  }
  
  /**
   * Upload biên bản từ file
   * Mở dialog để user nhập thông tin và chọn file PDF
   */
  const handleUploadRecord = () => {
    setUploadDialogOpen(true)
  }

  /**
   * Callback khi upload thành công
   * Reload danh sách và hiển thị thông báo
   */
  const handleUploadSuccess = async () => {
    await loadRecords()
    setSnackbar({
      open: true,
      message: '✅ Upload biên bản thành công!',
      severity: 'success',
    })
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
        record.minuteCode.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.invoiceNo.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.description.toLowerCase().includes(filters.searchText.toLowerCase())

      // Lọc theo khoảng ngày
      const matchesDateFrom = 
        !filters.dateFrom || 
        dayjs(record.createdAt).isAfter(filters.dateFrom, 'day') || 
        dayjs(record.createdAt).isSame(filters.dateFrom, 'day')
      
      const matchesDateTo = 
        !filters.dateTo || 
        dayjs(record.createdAt).isBefore(filters.dateTo, 'day') || 
        dayjs(record.createdAt).isSame(filters.dateTo, 'day')

      // Lọc theo loại biên bản
      const matchesRecordType = 
        filters.recordType.length === 0 || 
        filters.recordType.includes('all') || 
        filters.recordType.includes(record.minuteType)

      // Lọc theo trạng thái
      const matchesStatus = 
        filters.status.length === 0 || 
        filters.status.includes(record.status)

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
      field: 'minuteCode',
      headerName: 'Mã biên bản',
      width: 140,
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
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 130,
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
      field: 'minuteType',
      headerName: 'Loại biên bản',
      width: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const recordType = params.value as 'Adjustment' | 'Replacement'
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
      field: 'invoiceNo',
      headerName: 'Số hóa đơn',
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
      minWidth: 220,
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
      field: 'description',
      headerName: 'Lý do / Mô tả',
      flex: 1.3,
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
      width: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1.5 }}>
            <Chip 
              label={status} 
              color={getStatusColor(status)} 
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
      field: 'createdByName',
      headerName: 'Người tạo',
      width: 150,
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
      field: 'signatures',
      headerName: 'Chữ ký',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as AdjustmentReplacementRecord
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1, py: 1.5 }}>
            <Tooltip title={record.isSellerSigned ? 'Người bán đã ký' : 'Người bán chưa ký'} arrow>
              <Chip 
                label="NB" 
                size="small"
                color={record.isSellerSigned ? 'success' : 'default'}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  minWidth: 38,
                }}
              />
            </Tooltip>
            <Tooltip title={record.isBuyerSigned ? 'Người mua đã ký' : 'Người mua chưa ký'} arrow>
              <Chip 
                label="NM" 
                size="small"
                color={record.isBuyerSigned ? 'success' : 'default'}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  minWidth: 38,
                }}
              />
            </Tooltip>
          </Box>
        )
      },
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
                onClick={() => handleViewDetail(record.id.toString())}
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
                onClick={() => handleDownloadPDF(record.id.toString(), record.minuteCode)}
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
      <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          
          {/* ============================================================ */}
          {/* HEADER */}
          {/* ============================================================ */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Biên Bản Điều Chỉnh/Thay Thế
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
            <Paper sx={{ p: 3, mt: 2, bgcolor: 'warning.light', border: 1, borderColor: 'warning.main', opacity: 0.1 }}>
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
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
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
                    bgcolor: 'grey.50',
                    borderBottom: 2,
                    borderColor: 'divider',
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

        {/* ============================================================ */}
        {/* UPLOAD MINUTE DIALOG */}
        {/* ============================================================ */}
        <UploadMinuteDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      </Box>
    </LocalizationProvider>
  )
}

export default AdjustmentReplacementRecordManagement