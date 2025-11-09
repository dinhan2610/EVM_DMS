import { useState, useMemo } from 'react'
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
  Stack,
  InputAdornment,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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

const RequestManagement = () => {
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
    navigate('/newinvoices', {
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
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.status === 'Pending') {
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Xem chi tiết" arrow>
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleViewDetails(params.row)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    },
                  }}>
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chấp nhận" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleAccept(params.row)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                    },
                  }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Từ chối" arrow>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleOpenRejectModal(params.row)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    },
                  }}>
                  <HighlightOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        }
        // Đã xử lý: chỉ hiển thị nút xem chi tiết
        return (
          <Tooltip title="Xem chi tiết" arrow>
            <IconButton
              size="small"
              color="info"
              onClick={() => handleViewDetails(params.row)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.08)',
                },
              }}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
