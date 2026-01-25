import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import DrawIcon from '@mui/icons-material/Draw'
import UploadIcon from '@mui/icons-material/Upload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PersonIcon from '@mui/icons-material/Person'
import { usePageTitle } from '@/hooks/usePageTitle'
import Spinner from '@/components/Spinner'
import UploadMinuteDialog from '@/components/UploadMinuteDialog'

import { getMinutes, uploadMinute, validatePdfFile, signMinuteSeller, completeMinute, type MinuteRecord } from '@/services/minuteService'
import { getInvoiceByMinuteCode } from '@/services/invoiceService'

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
 * Map trạng thái biên bản sang tiếng Việt
 * Backend enum: EMinuteStatus
 * - Pending = 1: Chờ ký
 * - Signed = 2: Đã ký đầy đủ
 * - Sent = 3: Đã gửi
 * - Complete = 4: Hai bên đồng thuận
 * - Cancelled = 5: Đã hủy
 */
const getMinuteStatusLabel = (status: string | number): string => {
  // Nếu là số (enum value)
  if (typeof status === 'number') {
    switch (status) {
      case 1: return 'Chờ ký'
      case 2: return 'Đã ký đầy đủ'
      case 3: return 'Đã gửi'
      case 4: return 'Hai bên đồng thuận'
      case 5: return 'Đã hủy'
      default: return 'Không xác định'
    }
  }
  
  // Nếu là chuỗi (enum name)
  const statusStr = status.toString().toLowerCase()
  switch (statusStr) {
    case 'pending': return 'Chờ ký'
    case 'signed': return 'Đã ký đầy đủ'
    case 'sent': return 'Đã gửi'
    case 'complete': return 'Hai bên đồng thuận'
    case 'cancelled': return 'Đã hủy'
    default: return status.toString() // Hiển thị giá trị gốc nếu không match
  }
}

/**
 * Lấy màu cho trạng thái biên bản
 */
const getStatusColor = (status: string | number): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
  // Nếu là số (enum value)
  if (typeof status === 'number') {
    switch (status) {
      case 1: return 'warning'    // Pending - Chờ ký (vàng cam)
      case 2: return 'info'       // Signed - Đã ký đầy đủ (xanh dương)
      case 3: return 'primary'    // Sent - Đã gửi (xanh dương đậm)
      case 4: return 'success'    // Complete - Hai bên đồng thuận (xanh lá)
      case 5: return 'error'      // Cancelled - Đã hủy (đỏ)
      default: return 'default'
    }
  }
  
  // Nếu là chuỗi (enum name)
  const statusStr = status.toString().toLowerCase()
  switch (statusStr) {
    case 'pending': return 'warning'    // Chờ ký
    case 'signed': return 'info'        // Đã ký đầy đủ
    case 'sent': return 'primary'       // Đã gửi
    case 'complete': return 'success'   // Hai bên đồng thuận
    case 'cancelled': return 'error'    // Đã hủy
    default: return 'default'
  }
}

/**
 * Map role name từ tiếng Anh sang tiếng Việt
 */
const mapRoleNameToVietnamese = (roleName: string): string => {
  const roleMapping: { [key: string]: string } = {
    'Accountant User': 'Kế toán',
    'Admin User': 'Quản trị viên',
    'Head Dept User': 'Kế toán trưởng',
    'Sales User': 'Nhân viên bán hàng',
  }
  
  return roleMapping[roleName] || roleName
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
  
  // Navigation hook
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
  
  // State for uploading file to specific minute record
  const [uploadingMinute, setUploadingMinute] = useState<{
    recordId: number
    invoiceId: number
    minuteType: 'Adjustment' | 'Replacement'
  } | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadDialogForRecordOpen, setUploadDialogForRecordOpen] = useState(false)
  
  // State for buyer confirmation modal (NM - Người Mua)
  const [confirmBuyerModal, setConfirmBuyerModal] = useState<{
    open: boolean
    minuteId: number | null
    minuteCode: string
  }>({ open: false, minuteId: null, minuteCode: '' })

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
   * Ký số biên bản (Bên bán)
   * API: POST /api/Minute/sign-seller/{minuteId}
   */
  const handleSignSeller = async (recordId: string, minuteCode: string) => {
    try {
      const minuteId = parseInt(recordId, 10)
      if (isNaN(minuteId)) {
        throw new Error('ID biên bản không hợp lệ')
      }
      
      console.log('✍️ Signing minute:', { minuteId, minuteCode })
      
      // Gọi API ký số
      await signMinuteSeller(minuteId)
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: `✅ Đã ký số biên bản ${minuteCode} thành công!`,
        severity: 'success',
      })
      
      // Reload danh sách để cập nhật trạng thái
      await loadRecords()
      
    } catch (err) {
      console.error('❌ Sign seller error:', err)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Không thể ký biên bản',
        severity: 'error',
      })
    }
  }
  
  /**
   * Navigate đến chi tiết HĐ điều chỉnh/thay thế theo mã biên bản
   * Tìm invoice có minuteCode tương ứng và navigate đến detail page
   */
  const handleNavigateToInvoiceByMinuteCode = async (minuteCode: string) => {
    try {
      console.log('🔍 Finding invoice with minuteCode:', minuteCode)
      
      // Tìm invoice theo minuteCode
      const invoice = await getInvoiceByMinuteCode(minuteCode)
      
      if (invoice) {
        console.log('✅ Found invoice:', invoice.invoiceID)
        // Navigate đến chi tiết hóa đơn
        navigate(`/invoices/${invoice.invoiceID}`)
      } else {
        // Chưa có HĐ điều chỉnh/thay thế được tạo từ biên bản này
        setSnackbar({
          open: true,
          message: `Chưa có hóa đơn điều chỉnh/thay thế được tạo từ biên bản ${minuteCode}`,
          severity: 'warning',
        })
      }
    } catch (err) {
      console.error('❌ Navigate to invoice error:', err)
      setSnackbar({
        open: true,
        message: 'Không thể tìm hóa đơn tương ứng',
        severity: 'error',
      })
    }
  }
  
  /**
   * Mở modal xác nhận người mua (NM)
   */
  const handleOpenBuyerConfirm = (recordId: number, minuteCode: string) => {
    setConfirmBuyerModal({
      open: true,
      minuteId: recordId,
      minuteCode: minuteCode,
    })
  }
  
  /**
   * Đóng modal xác nhận người mua
   */
  const handleCloseBuyerConfirm = () => {
    setConfirmBuyerModal({ open: false, minuteId: null, minuteCode: '' })
  }
  
  /**
   * Xác nhận hoàn thành biên bản (Người mua đã xác nhận)
   * API: PUT /api/Minute/{minuteId}/complete
   */
  const handleConfirmBuyer = async () => {
    if (!confirmBuyerModal.minuteId) return
    
    try {
      console.log('✅ Completing minute:', { 
        minuteId: confirmBuyerModal.minuteId, 
        minuteCode: confirmBuyerModal.minuteCode 
      })
      
      // Gọi API complete
      await completeMinute(confirmBuyerModal.minuteId)
      
      // Đóng modal
      handleCloseBuyerConfirm()
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: `✅ Đã xác nhận biên bản ${confirmBuyerModal.minuteCode} thành công!`,
        severity: 'success',
      })
      
      // Reload danh sách để cập nhật trạng thái
      await loadRecords()
      
    } catch (err) {
      console.error('❌ Complete minute error:', err)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Không thể xác nhận biên bản',
        severity: 'error',
      })
    }
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

  /**
   * Mở dialog upload cho biên bản cụ thể
   */
  const handleOpenUploadForRecord = (record: AdjustmentReplacementRecord) => {
    setUploadingMinute({
      recordId: record.id,
      invoiceId: record.invoiceId,
      minuteType: record.minuteType,
    })
    setUploadFile(null)
    setUploadDescription('')
    setUploadDialogForRecordOpen(true)
  }

  /**
   * Upload file PDF cho biên bản
   */
  const handleUploadFileForRecord = async () => {
    if (!uploadingMinute || !uploadFile) {
      setSnackbar({
        open: true,
        message: '⚠️ Vui lòng chọn file PDF',
        severity: 'warning',
      })
      return
    }

    // Validate PDF file
    const validationError = validatePdfFile(uploadFile)
    if (validationError) {
      setSnackbar({
        open: true,
        message: validationError,
        severity: 'error',
      })
      return
    }

    setLoading(true)
    try {
      const minuteTypeNumber = uploadingMinute.minuteType === 'Adjustment' ? 1 : 2

      await uploadMinute({
        invoiceId: uploadingMinute.invoiceId,
        minuteType: minuteTypeNumber,
        description: uploadDescription,
        pdfFile: uploadFile,
      })

      setUploadDialogForRecordOpen(false)
      setUploadingMinute(null)
      setUploadFile(null)
      setUploadDescription('')
      
      setSnackbar({
        open: true,
        message: '✅ Upload biên bản thành công!',
        severity: 'success',
      })
      
      await loadRecords()
    } catch (error) {
      console.error('❌ Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : '❌ Upload thất bại'
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
    } finally {
      setLoading(false)
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
    // 1. Mã biên bản (Click để xem HĐ điều chỉnh/thay thế tương ứng)
    {
      field: 'minuteCode',
      headerName: 'Mã biên bản',
      flex: 0.9,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip title="Click để xem HĐ điều chỉnh/thay thế">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: 'primary.main',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
                onClick={() => handleNavigateToInvoiceByMinuteCode(value)}>
                {value || '-'}
              </Typography>
            </Tooltip>
          </Box>
        )
      },
    },
    // 2. Người tạo
    {
      field: 'createdByName',
      headerName: 'Người tạo',
      flex: 1.1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        const vietnameseName = mapRoleNameToVietnamese(value)
        return (
          <Tooltip title={`Vai trò: ${vietnameseName}`} arrow placement="top">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: '100%' }}>
              <PersonIcon fontSize="small" sx={{ color: '#546e7a', fontSize: '1.125rem' }} />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#2c3e50',
                  fontSize: '0.875rem',
                }}>
                {vietnameseName || '-'}
              </Typography>
            </Box>
          </Tooltip>
        )
      },
    },
    // 3. Số hóa đơn
    {
      field: 'invoiceNo',
      headerName: 'Số hóa đơn',
      flex: 0.9,
      minWidth: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as AdjustmentReplacementRecord
        const value = params.value as string
        const hasInvoice = record.invoiceId && value && value !== 'Chưa có'
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip 
              title={hasInvoice ? `Click để xem chi tiết hóa đơn: ${value}` : 'Chưa có hóa đơn'} 
              arrow 
              placement="top"
            >
              <Typography
                variant="body2"
                onClick={hasInvoice ? () => navigate(`/invoices/${record.invoiceId}`) : undefined}
                sx={{
                  fontWeight: 600,
                  color: hasInvoice ? 'primary.main' : '#2c3e50',
                  fontSize: '0.875rem',
                  cursor: hasInvoice ? 'pointer' : 'default',
                  textDecoration: hasInvoice ? 'underline' : 'none',
                  '&:hover': hasInvoice ? {
                    color: 'primary.dark',
                    textDecoration: 'underline',
                  } : {},
                }}
              >
                {value || '-'}
              </Typography>
            </Tooltip>
          </Box>
        )
      },
    },
    // 4. Loại biên bản
    {
      field: 'minuteType',
      headerName: 'Loại biên bản',
      flex: 1.1,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const recordType = params.value as 'Adjustment' | 'Replacement'
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Chip 
              label={getRecordTypeLabel(recordType)} 
              color={getRecordTypeColor(recordType)} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
              }}
            />
          </Box>
        )
      },
    },
    // 5. Trạng thái
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string
        const statusLabel = getMinuteStatusLabel(status)
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Chip 
              label={statusLabel} 
              color={getStatusColor(status)} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
              }}
            />
          </Box>
        )
      },
    },
    // 6. Lý do / Mô tả
    {
      field: 'description',
      headerName: 'Lý do / Mô tả',
      flex: 1.5,
      minWidth: 220,
      sortable: true,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 2 }}>
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
    // 7. Ngày tạo
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      flex: 0.9,
      minWidth: 120,
      sortable: true,
      type: 'date',
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value: string) => new Date(value),
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
    // 8. Chữ ký
    {
      field: 'signatures',
      headerName: 'Chữ ký',
      flex: 0.9,
      minWidth: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as AdjustmentReplacementRecord
        
        // NM chỉ có thể click khi NB đã ký và NM chưa xác nhận
        const canConfirmBuyer = record.isSellerSigned && !record.isBuyerSigned
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
            {/* NB - Người Bán */}
            <Tooltip title={record.isSellerSigned ? 'Người bán đã ký' : 'Người bán chưa ký'} arrow>
              <Chip 
                label="NB" 
                size="small"
                color={record.isSellerSigned ? 'success' : 'default'}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 26,
                  minWidth: 40,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              />
            </Tooltip>
            
            {/* NM - Người Mua (clickable khi NB đã ký) */}
            <Tooltip 
              title={
                record.isBuyerSigned 
                  ? 'Người mua đã xác nhận' 
                  : canConfirmBuyer 
                    ? 'Click để xác nhận người mua' 
                    : 'Cần người bán ký trước'
              } 
              arrow
            >
              <Chip 
                label="NM" 
                size="small"
                color={record.isBuyerSigned ? 'success' : 'default'}
                onClick={canConfirmBuyer ? () => handleOpenBuyerConfirm(record.id, record.minuteCode) : undefined}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 26,
                  minWidth: 40,
                  transition: 'all 0.2s ease',
                  cursor: canConfirmBuyer ? 'pointer' : 'default',
                  '&:hover': {
                    transform: canConfirmBuyer ? 'scale(1.1)' : 'scale(1.05)',
                    backgroundColor: canConfirmBuyer ? 'primary.light' : undefined,
                  },
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
      flex: 1,
      minWidth: 140,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as AdjustmentReplacementRecord
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 0.5 }}>
            {/* Icon 1: Ký số */}
            <Tooltip 
              title={record.isSellerSigned ? 'Đã ký số' : 'Ký số'} 
              arrow 
              placement="top"
            >
              <span> {/* Wrap in span to show tooltip on disabled button */}
                <IconButton
                  size="small"
                  onClick={() => handleSignSeller(record.id.toString(), record.minuteCode)}
                  disabled={record.isSellerSigned}
                  sx={{
                    color: record.isSellerSigned ? 'success.main' : 'warning.main',
                    '&:hover': {
                      backgroundColor: record.isSellerSigned ? 'transparent' : 'warning.lighter',
                      transform: record.isSellerSigned ? 'none' : 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-disabled': {
                      color: 'success.main',
                    },
                  }}
                >
                  <DrawIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            
            {/* Icon 2: Upload file PDF */}
            <Tooltip title="Upload file PDF" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleOpenUploadForRecord(record)}
                sx={{
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: 'success.lighter',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <UploadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Icon 3: Xem PDF */}
            <Tooltip title="Xem PDF" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleDownloadPDF(record.id.toString(), record.minuteCode)}
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

        {/* ============================================================ */}
        {/* UPLOAD FILE FOR SPECIFIC RECORD DIALOG */}
        {/* ============================================================ */}
        <Dialog
          open={uploadDialogForRecordOpen}
          onClose={() => {
            setUploadDialogForRecordOpen(false)
            setUploadingMinute(null)
            setUploadFile(null)
            setUploadDescription('')
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Upload File PDF cho Biên Bản
            {uploadingMinute && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Loại: <strong>{uploadingMinute.minuteType === 'Adjustment' ? 'Điều chỉnh' : 'Thay thế'}</strong>
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* File Upload */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  File PDF <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadFileIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  {uploadFile ? uploadFile.name : 'Chọn file PDF (tối đa 10MB)'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setUploadFile(file)
                      }
                    }}
                  />
                </Button>
              </Box>

              {/* Description */}
              <TextField
                label="Mô tả"
                multiline
                rows={3}
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Nhập mô tả cho biên bản (không bắt buộc)"
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setUploadDialogForRecordOpen(false)
                setUploadingMinute(null)
                setUploadFile(null)
                setUploadDescription('')
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleUploadFileForRecord}
              disabled={!uploadFile || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {loading ? 'Đang upload...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ============================================================ */}
        {/* BUYER CONFIRMATION MODAL (NM - Người Mua) */}
        {/* ============================================================ */}
        <Dialog
          open={confirmBuyerModal.open}
          onClose={handleCloseBuyerConfirm}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle sx={{ 
            pb: 1, 
            fontWeight: 600,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
            Xác Nhận Người Mua
          </DialogTitle>
          <DialogContent sx={{ pt: 3, marginTop: 1}}>
            <Stack spacing={2}>
              <Typography variant="body1" color="text.secondary">
                Bạn đang xác nhận cho biên bản:
              </Typography>
              <Box sx={{ 
                bgcolor: 'primary.lighter', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.light',
              }}>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                  {confirmBuyerModal.minuteCode}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Vui lòng đảm bảo bạn đã <strong>kiểm tra đầy đủ thông tin</strong> trước khi xác nhận.
                  Hành động này không thể hoàn tác.
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              onClick={handleCloseBuyerConfirm}
              color="inherit"
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmBuyer}
              color="success"
              startIcon={<PersonIcon />}
            >
              Xác Nhận
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default AdjustmentReplacementRecordManagement