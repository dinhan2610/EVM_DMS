import { useState, useMemo } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DrawIcon from '@mui/icons-material/Draw'
import EmailIcon from '@mui/icons-material/Email'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import FindReplaceIcon from '@mui/icons-material/FindReplace'
import RestoreIcon from '@mui/icons-material/Restore'
import CancelIcon from '@mui/icons-material/Cancel'
import SearchIcon from '@mui/icons-material/Search'
import RequestDetailModal from '../components/RequestDetailModal.tsx'

// Interface
export interface InvoiceRequest {
  id: string
  requestorName: string // Tên PM/Sales
  projectName: string
  requestDate: string
  status: 'Pending' | 'Approved' | 'Rejected'
  // Dữ liệu để điền form
  customerName: string
  customerEmail: string
  customerTaxCode: string
  customerAddress: string
  items: Array<{ description: string; quantity: number; unitPrice: number }>
  supportingDocs: string[] // Tên file đính kèm
  notes?: string
}

// Mock Data
const mockRequests: InvoiceRequest[] = [
  {
    id: '1',
    requestorName: 'Nguyễn Văn A',
    projectName: 'Dự án Website TMĐT',
    requestDate: '2024-10-15',
    status: 'Pending',
    customerName: 'Công ty TNHH ABC Technology',
    customerEmail: 'contact@abctech.com',
    customerTaxCode: '0123456789',
    customerAddress: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    items: [
      { description: 'Phát triển Website TMĐT - Giai đoạn 1', quantity: 1, unitPrice: 50000000 },
      { description: 'Tư vấn UX/UI Design', quantity: 1, unitPrice: 15000000 },
    ],
    supportingDocs: ['contract_abc_2024.pdf', 'proposal_ecommerce.pdf'],
    notes: 'Thanh toán theo tiến độ 30%',
  },
  {
    id: '2',
    requestorName: 'Trần Thị B',
    projectName: 'Dự án Mobile App',
    requestDate: '2024-10-18',
    status: 'Pending',
    customerName: 'Công ty Cổ phần XYZ Digital',
    customerEmail: 'info@xyzdigital.vn',
    customerTaxCode: '0987654321',
    customerAddress: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    items: [
      { description: 'Phát triển Mobile App iOS & Android', quantity: 1, unitPrice: 80000000 },
      { description: 'Bảo hành & Support 3 tháng', quantity: 1, unitPrice: 10000000 },
    ],
    supportingDocs: ['contract_xyz_2024.pdf', 'technical_specs.pdf'],
    notes: 'VAT 10%, thanh toán sau 15 ngày',
  },
  {
    id: '3',
    requestorName: 'Lê Văn C',
    projectName: 'Dự án ERP System',
    requestDate: '2024-10-12',
    status: 'Approved',
    customerName: 'Tập đoàn DEF Corporation',
    customerEmail: 'procurement@defcorp.com',
    customerTaxCode: '0111222333',
    customerAddress: '789 Võ Văn Tần, Quận 3, TP.HCM',
    items: [
      { description: 'Triển khai hệ thống ERP - Module HR', quantity: 1, unitPrice: 120000000 },
      { description: 'Đào tạo người dùng', quantity: 1, unitPrice: 20000000 },
    ],
    supportingDocs: ['contract_def_2024.pdf', 'erp_requirements.pdf'],
    notes: 'Đã được duyệt ngày 16/10/2024',
  },
  {
    id: '4',
    requestorName: 'Phạm Thị D',
    projectName: 'Dự án Digital Marketing',
    requestDate: '2024-10-10',
    status: 'Rejected',
    customerName: 'Công ty TNHH GHI Media',
    customerEmail: 'hello@ghimedia.vn',
    customerTaxCode: '0444555666',
    customerAddress: '321 Pasteur, Quận 3, TP.HCM',
    items: [
      { description: 'Chiến dịch quảng cáo Google Ads - Q4/2024', quantity: 1, unitPrice: 30000000 },
    ],
    supportingDocs: ['contract_ghi_2024.pdf'],
    notes: 'Từ chối: Thiếu chữ ký khách hàng trên hợp đồng',
  },
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'Pending':
      return 'warning'
    case 'Approved':
      return 'success'
    case 'Rejected':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'Chờ duyệt'
    case 'Approved':
      return 'Đã duyệt'
    case 'Rejected':
      return 'Đã từ chối'
    default:
      return status
  }
}

// Component menu thao tác cho mỗi yêu cầu
interface RequestActionsMenuProps {
  request: InvoiceRequest
  onViewDetails: (request: InvoiceRequest) => void
  onAccept: (request: InvoiceRequest) => void
  onReject: (request: InvoiceRequest) => void
}

const RequestActionsMenu = ({ request, onViewDetails, onAccept, onReject }: RequestActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const isPending = request.status === 'Pending'
  const isApproved = request.status === 'Approved'

  const menuItems = [
    {
      label: 'Xem chi tiết',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      enabled: true,
      action: () => {
        onViewDetails(request)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Chỉnh sửa',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: isPending,
      action: () => {
        console.log('Chỉnh sửa yêu cầu:', request.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Chấp nhận',
      icon: <CheckCircleOutlineIcon fontSize="small" />,
      enabled: isPending,
      action: () => {
        onAccept(request)
        handleClose()
      },
      color: 'success.main',
    },
    {
      label: 'Từ chối',
      icon: <HighlightOffIcon fontSize="small" />,
      enabled: isPending,
      action: () => {
        onReject(request)
        handleClose()
      },
      color: 'error.main',
    },
    {
      label: 'Ký số',
      icon: <DrawIcon fontSize="small" />,
      enabled: isApproved,
      action: () => {
        console.log('Ký số:', request.id)
        handleClose()
      },
      color: 'secondary.main',
    },
    { divider: true },
    {
      label: 'Gửi email',
      icon: <EmailIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('Gửi email:', request.id)
        handleClose()
      },
      color: 'info.main',
    },
    {
      label: 'In hóa đơn',
      icon: <PrintIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('In hóa đơn:', request.id)
        handleClose()
      },
      color: 'text.primary',
    },
    {
      label: 'Tải xuống',
      icon: <DownloadIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('Tải xuống:', request.id)
        handleClose()
      },
      color: 'text.primary',
    },
    { divider: true },
    {
      label: 'Tạo HĐ điều chỉnh',
      icon: <FindReplaceIcon fontSize="small" />,
      enabled: isApproved,
      action: () => {
        console.log('Tạo HĐ điều chỉnh:', request.id)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Tạo HĐ thay thế',
      icon: <RestoreIcon fontSize="small" />,
      enabled: isApproved,
      action: () => {
        console.log('Tạo HĐ thay thế:', request.id)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Hủy',
      icon: <CancelIcon fontSize="small" />,
      enabled: isApproved,
      action: () => {
        console.log('Hủy yêu cầu:', request.id)
        handleClose()
      },
      color: 'error.main',
    },
  ]

  return (
    <>
      <Tooltip title="Thao tác" arrow placement="left">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
              transform: 'scale(1.1)',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          timeout: 250,
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: 220,
              borderRadius: 2.5,
              mt: 0.5,
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
              border: '1px solid',
              borderColor: 'divider',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                borderLeft: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        }}
      >
        {menuItems.map((item, index) => {
          if ('divider' in item) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          }

          return (
            <MenuItem
              key={item.label}
              onClick={item.enabled ? item.action : undefined}
              disabled={!item.enabled}
              sx={{
                py: 1.25,
                px: 2.5,
                gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': item.enabled ? {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(4px)',
                } : {},
                '&.Mui-disabled': {
                  opacity: 0.4,
                },
                cursor: item.enabled ? 'pointer' : 'not-allowed',
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.enabled ? item.color : 'text.disabled',
                  minWidth: 28,
                  transition: 'color 0.2s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: item.enabled ? 500 : 400,
                  letterSpacing: '0.01em',
                  color: item.enabled ? 'text.primary' : 'text.disabled',
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

const RequestManagement = () => {
  usePageTitle('Quản lý yêu cầu')
  
  const navigate = useNavigate()
  const [requests, setRequests] = useState<InvoiceRequest[]>(mockRequests)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<InvoiceRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [searchText, setSearchText] = useState('')
  const [viewingRequest, setViewingRequest] = useState<InvoiceRequest | null>(null)

  // Handlers
  const handleOpenRejectModal = (request: InvoiceRequest) => {
    setSelectedRequest(request)
    setRejectionModalOpen(true)
  }

  const handleCloseRejectModal = () => {
    setRejectionModalOpen(false)
    setSelectedRequest(null)
    setRejectionReason('')
  }

  const handleConfirmReject = () => {
    if (!selectedRequest) return

    console.log('Rejecting request:', selectedRequest.id, 'Reason:', rejectionReason)

    // Cập nhật trạng thái
    setRequests((prev) =>
      prev.map((req) =>
        req.id === selectedRequest.id
          ? { ...req, status: 'Rejected' as const, notes: `Từ chối: ${rejectionReason}` }
          : req
      )
    )

    handleCloseRejectModal()
  }

  const handleAccept = (request: InvoiceRequest) => {
    console.log('Accepting request:', request.id)

    // Cập nhật trạng thái
    setRequests((prev) =>
      prev.map((req) => (req.id === request.id ? { ...req, status: 'Approved' as const } : req))
    )

    // Điều hướng đến trang tạo hóa đơn với dữ liệu từ request
    navigate('/create-invoice', {
      state: {
        requestData: request,
      },
    })
  }

  const handleViewDetails = (request: InvoiceRequest) => {
    setViewingRequest(request)
  }

  const handleCloseViewModal = () => {
    setViewingRequest(null)
  }

  // Filter requests với useMemo để tối ưu
  const filteredRequests = useMemo(() => {
    if (!searchText) return requests
    return requests.filter(
      (req) =>
        req.requestorName.toLowerCase().includes(searchText.toLowerCase()) ||
        req.projectName.toLowerCase().includes(searchText.toLowerCase()) ||
        req.customerName.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [requests, searchText])

  // DataGrid Columns
  const columns: GridColDef[] = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const index = filteredRequests.findIndex((req) => req.id === params.row.id)
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                color: '#666'
              }}>
              {index + 1}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'requestorName',
      headerName: 'Người yêu cầu',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'projectName',
      headerName: 'Dự án',
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'requestDate',
      headerName: 'Ngày yêu cầu',
      type: 'date',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params) => new Date(params),
      renderCell: (params) => formatDate(params.row.requestDate),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          color={getStatusColor(params.row.status)}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        return (
          <RequestActionsMenu
            request={params.row as InvoiceRequest}
            onViewDetails={handleViewDetails}
            onAccept={handleAccept}
            onReject={handleOpenRejectModal}
          />
        )
      },
    },
  ]

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Quản lý Yêu cầu Xuất hóa đơn
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Duyệt và xử lý các yêu cầu xuất hóa đơn từ người bán hàng
            </Typography>
          </Box>
          
        </Box>

        {/* Data Table */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
          {/* Search Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              size="small"
              label="Tìm kiếm theo người yêu cầu, dự án hoặc khách hàng"
              variant="outlined"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 500,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                  },
                },
              }}
            />
          </Box>
          {/* Table Section */}
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
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
            }}
            autoHeight
          />
        </Paper>

        {/* Rejection Modal */}
        <Dialog
          open={rejectionModalOpen}
          onClose={handleCloseRejectModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            },
          }}>
          <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Từ chối Yêu cầu Xuất hóa đơn
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <>
                <DialogContentText sx={{ mb: 2 }}>
                  Vui lòng nhập lý do từ chối cho yêu cầu của{' '}
                  <strong>{selectedRequest.requestorName}</strong> (Dự án:{' '}
                  <strong>{selectedRequest.projectName}</strong>).
                </DialogContentText>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Lý do từ chối"
                  placeholder="Ví dụ: Thiếu chữ ký khách hàng, thông tin không đầy đủ..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  sx={{ mt: 1 }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseRejectModal} sx={{ textTransform: 'none', fontWeight: 500 }}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmReject}
              variant="contained"
              color="error"
              disabled={!rejectionReason.trim()}
              sx={{ textTransform: 'none', fontWeight: 500, minWidth: 150 }}>
              Xác nhận Từ chối
            </Button>
          </DialogActions>
        </Dialog>

        {/* Request Detail Modal */}
        <RequestDetailModal request={viewingRequest} open={!!viewingRequest} onClose={handleCloseViewModal} />
      </Box>
    </Box>
  )
}

export default RequestManagement
