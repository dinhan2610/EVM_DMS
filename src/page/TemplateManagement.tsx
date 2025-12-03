import { useState, useMemo, useEffect } from 'react'
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
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import templateService, { TemplateResponse } from '@/services/templateService'

// Interface cho UI (simplified for DataGrid)
interface InvoiceTemplate {
  id: number
  templateName: string
  templateCode: string // serial
  status: 'Active' | 'Inactive'
  templateType: string // templateTypeName
  frameUrl: string | null // for preview
  layoutDefinition: string // for future use
}

const TemplateManagement = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<TemplateResponse | null>(null)
  
  // API State
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await templateService.getAllTemplates()
      
      // Map API response to UI format (API now returns full details)
      const mappedTemplates: InvoiceTemplate[] = response.map((template) => ({
        id: template.templateID,
        templateName: template.templateName,
        templateCode: template.serial,
        status: template.isActive ? 'Active' : 'Inactive',
        templateType: template.templateTypeName,
        frameUrl: template.frameUrl,
        layoutDefinition: template.layoutDefinition,
      }))
      
      setTemplates(mappedTemplates)
      console.log('✅ Loaded templates:', mappedTemplates.length, 'templates')
    } catch (err) {
      const error = err as Error
      console.error('❌ Error fetching templates:', error)
      setError(error.message || 'Không thể tải danh sách mẫu hóa đơn')
      setSnackbar({
        open: true,
        message: error.message || 'Không thể tải danh sách mẫu hóa đơn',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  // Lọc templates theo search
  const filteredTemplates = useMemo(() => {
    if (!searchText) return templates
    return templates.filter(
      (template) =>
        template.templateName.toLowerCase().includes(searchText.toLowerCase()) ||
        template.templateCode.toLowerCase().includes(searchText.toLowerCase()) ||
        template.templateType.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [templates, searchText])

  // Xử lý xem chi tiết
  const handleViewDetails = async (template: InvoiceTemplate) => {
    try {
      const detail = await templateService.getTemplateById(template.id)
      setViewingTemplate(detail)
    } catch (err) {
      const error = err as Error
      setSnackbar({
        open: true,
        message: error.message || 'Không thể tải chi tiết mẫu hóa đơn',
        severity: 'error',
      })
    }
  }

  // Xử lý đóng modal xem chi tiết
  const handleCloseViewModal = () => {
    setViewingTemplate(null)
  }

  // Xử lý chỉnh sửa
  const handleEdit = (id: number) => {
    navigate(`/admin/templates/edit/${id}`)
  }

  // Xử lý xóa template (placeholder - backend chưa có DELETE endpoint)
  const handleDeleteClick = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    console.log('Deleting template:', selectedTemplate?.id)
    // TODO: Implement delete API when backend provides endpoint
    setSnackbar({
      open: true,
      message: 'Chức năng xóa mẫu đang được phát triển',
      severity: 'success',
    })
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
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
      field: 'frameUrl',
      headerName: 'Khung viền',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            py: 0.5,
          }}>
          {params.value ? (
            <Tooltip title="Click để xem chi tiết" arrow>
              <Box
                onClick={() => handleViewDetails(params.row)}
                sx={{
                  width: 60,
                  height: 80,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}>
                <img
                  src={params.value}
                  alt="Frame"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = '/khunghoadon/khunghoadon1.png'
                  }}
                />
              </Box>
            </Tooltip>
          ) : (
            <Typography variant="caption" sx={{ color: '#999' }}>
              N/A
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'templateType',
      headerName: 'Loại mẫu',
      width: 150,
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
            label={params.value || 'Hóa đơn mới'}
            color="primary"
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
              Quản lý và cấu hình các mẫu hóa đơn điện tử ({templates.length} mẫu)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Tải lại danh sách" arrow>
              <IconButton
                onClick={fetchTemplates}
                disabled={loading}
                sx={{
                  border: '1px solid #e0e0e0',
                  '&:hover': { bgcolor: '#f5f5f5' },
                }}>
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
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
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && templates.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        )}

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
                    Mã số hóa đơn (Serial)
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#1c84ee' }}>
                    {viewingTemplate.serial}
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
                    Loại mẫu
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={viewingTemplate.templateTypeName}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Trạng thái
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={viewingTemplate.isActive ? 'Đang dùng' : 'Không dùng'}
                      color={viewingTemplate.isActive ? 'success' : 'default'}
                      icon={viewingTemplate.isActive ? <CheckCircle /> : <Cancel />}
                      size="small"
                    />
                  </Box>
                </Box>
                {viewingTemplate.frameUrl && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                      Khung viền mẫu
                    </Typography>
                    <Box sx={{ mt: 1, maxWidth: 300 }}>
                      <img 
                        src={viewingTemplate.frameUrl} 
                        alt="Template Frame"
                        style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }}
                        onError={(e) => {
                          e.currentTarget.src = '/khunghoadon/khunghoadon1.png'
                        }}
                      />
                    </Box>
                  </Box>
                )}
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

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  )
}

export default TemplateManagement
