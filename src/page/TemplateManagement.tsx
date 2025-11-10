import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Tooltip,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

// Interface cho mẫu hóa đơn
interface InvoiceTemplate {
  id: string
  templateName: string // Tên mẫu (VD: Hóa đơn GTGT (Mẫu C25TKN))
  templateCode: string // Ký hiệu (C25TKN)
  modelCode: string // Mẫu số (1K24TXN)
  invoiceType: 'GTGT' | 'BanHang' | 'DichVu' | 'DieuChinh' | 'ThayThe' // Loại hóa đơn
  status: 'Active' | 'Inactive'
  createdAt: string
  createdBy: string // Người tạo
  description?: string // Mô tả
}

const TemplateManagement = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<InvoiceTemplate | null>(null)

  // Mock Data - move outside to avoid dependency issue
  const [templates] = useState<InvoiceTemplate[]>([
    {
      id: '1',
      templateName: 'Hóa đơn GTGT (Mẫu C25TKN)',
      templateCode: 'C25TKN',
      modelCode: '1K24TXN',
      invoiceType: 'GTGT',
      status: 'Active',
      createdAt: '2024-01-15',
      createdBy: 'Nguyễn Văn A',
      description: 'Mẫu hóa đơn giá trị gia tăng cho doanh nghiệp',
    },
    {
      id: '2',
      templateName: 'Hóa đơn Bán hàng (Mẫu D26TTS)',
      templateCode: 'D26TTS',
      modelCode: '2K24TXN',
      invoiceType: 'BanHang',
      status: 'Active',
      createdAt: '2024-02-20',
      createdBy: 'Trần Thị B',
      description: 'Mẫu hóa đơn bán hàng hóa, dịch vụ',
    },
    {
      id: '3',
      templateName: 'Hóa đơn Dịch vụ (Mẫu E27DVC)',
      templateCode: 'E27DVC',
      modelCode: '3K24TXN',
      invoiceType: 'DichVu',
      status: 'Inactive',
      createdAt: '2024-03-10',
      createdBy: 'Lê Văn C',
      description: 'Mẫu hóa đơn chuyên dùng cho dịch vụ',
    },
  ])

  // Lọc templates theo search
  const filteredTemplates = useMemo(() => {
    if (!searchText) return templates
    return templates.filter(
      (template) =>
        template.templateName.toLowerCase().includes(searchText.toLowerCase()) ||
        template.templateCode.toLowerCase().includes(searchText.toLowerCase()) ||
        template.modelCode.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [templates, searchText])

  // Xử lý xem chi tiết
  const handleViewDetails = (template: InvoiceTemplate) => {
    setViewingTemplate(template)
  }

  // Xử lý đóng modal xem chi tiết
  const handleCloseViewModal = () => {
    setViewingTemplate(null)
  }

  // Xử lý chỉnh sửa
  const handleEdit = (id: string) => {
    navigate(`/admin/templates/edit/${id}`)
  }

  // Xử lý xóa template
  const handleDeleteClick = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    console.log('Deleting template:', selectedTemplate?.id)
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  // Mapping loại hóa đơn
  const invoiceTypeLabels: Record<string, string> = {
    GTGT: 'Hóa đơn GTGT',
    BanHang: 'Hóa đơn Bán hàng',
    DichVu: 'Hóa đơn Dịch vụ',
    DieuChinh: 'Hóa đơn Điều chỉnh',
    ThayThe: 'Hóa đơn Thay thế',
  }

  const invoiceTypeColors: Record<
    string,
    'primary' | 'success' | 'info' | 'warning' | 'error' | 'default'
  > = {
    GTGT: 'primary',
    BanHang: 'success',
    DichVu: 'info',
    DieuChinh: 'warning',
    ThayThe: 'error',
  }

  // Định nghĩa columns
  const columns: GridColDef[] = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const index = filteredTemplates.findIndex((template) => template.id === params.row.id)
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
              {index + 1}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'templateCode',
      headerName: 'Ký hiệu mẫu',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Tooltip title="Click để xem thông tin chi tiết" arrow>
            <Typography
              variant="body2"
              onClick={() => handleViewDetails(params.row)}
              sx={{
                fontWeight: 600,
                color: '#1c84ee',
                cursor: 'pointer',
                fontFamily: 'monospace',
                '&:hover': {
                  textDecoration: 'underline',
                  color: '#0d6efd',
                },
              }}>
              {params.value}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'templateName',
      headerName: 'Tên mẫu hóa đơn',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            py: 1,
          }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
          {params.row.description && (
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
              {params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'modelCode',
      headerName: 'Mẫu số',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#444' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'invoiceType',
      headerName: 'Loại hóa đơn',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Chip
            label={invoiceTypeLabels[params.value] || params.value}
            color={invoiceTypeColors[params.value] || 'default'}
            size="small"
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {new Date(params.value as string).toLocaleDateString('vi-VN')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'createdBy',
      headerName: 'Người tạo',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography variant="body2" sx={{ color: '#444', fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Chip
            label={params.value === 'Active' ? 'Đang dùng' : 'Không dùng'}
            color={params.value === 'Active' ? 'success' : 'default'}
            icon={params.value === 'Active' ? <CheckCircle /> : <Cancel />}
            size="small"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            width: '100%',
            height: '100%',
          }}>
          <Tooltip title="Xem trước mẫu" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/templates/preview/${params.row.id}`)}
              sx={{
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(28, 132, 238, 0.08)',
                },
              }}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa" arrow>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row.id)}
              sx={{
                color: '#ed6c02',
                '&:hover': {
                  backgroundColor: 'rgba(237, 108, 2, 0.08)',
                },
              }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa" arrow>
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row as InvoiceTemplate)}
              sx={{
                color: '#d32f2f',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                },
              }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Quản lý Mẫu hóa đơn
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Quản lý và cấu hình các mẫu hóa đơn điện tử
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/templates/select')}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
              },
            }}>
            Tạo mẫu mới
          </Button>
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
              label="Tìm kiếm theo tên mẫu, ký hiệu, mẫu số"
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
            rows={filteredTemplates}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                py: 1,
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteCancel}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            },
          }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Xác nhận xóa
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Bạn có chắc chắn muốn xóa mẫu hóa đơn{' '}
              <strong>"{selectedTemplate?.templateName}"</strong> không?
            </Typography>
            <Typography variant="body2" sx={{ color: '#d32f2f', mt: 1, fontSize: '0.8125rem' }}>
              Hành động này không thể hoàn tác.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleDeleteCancel}
              variant="outlined"
              sx={{
                textTransform: 'none',
                borderColor: '#ddd',
                color: '#666',
              }}>
              Hủy
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{
                textTransform: 'none',
              }}>
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal xem chi tiết */}
        {viewingTemplate && (
          <Dialog
            open={!!viewingTemplate}
            onClose={handleCloseViewModal}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
              },
            }}>
            <DialogTitle sx={{ pb: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chi tiết Mẫu hóa đơn
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Ký hiệu mẫu
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {viewingTemplate.templateCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Tên mẫu hóa đơn
                  </Typography>
                  <Typography variant="body1">{viewingTemplate.templateName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Mẫu số
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {viewingTemplate.modelCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Loại hóa đơn
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={invoiceTypeLabels[viewingTemplate.invoiceType]}
                      color={invoiceTypeColors[viewingTemplate.invoiceType]}
                      size="small"
                    />
                  </Box>
                </Box>
                {viewingTemplate.description && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                      Mô tả
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      {viewingTemplate.description}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Trạng thái
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={viewingTemplate.status === 'Active' ? 'Đang dùng' : 'Không dùng'}
                      color={viewingTemplate.status === 'Active' ? 'success' : 'default'}
                      icon={viewingTemplate.status === 'Active' ? <CheckCircle /> : <Cancel />}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Người tạo
                  </Typography>
                  <Typography variant="body1">{viewingTemplate.createdBy}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {new Date(viewingTemplate.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={handleCloseViewModal}
                variant="contained"
                color="primary"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 120,
                  boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
                  },
                }}>
                Đóng
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Box>
  )
}

export default TemplateManagement
