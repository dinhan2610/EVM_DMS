import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Typography,
  Button,
  Paper,
  Tooltip,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import templateService from '@/services/templateService'
import TemplateFilter, { TemplateFilterState } from '@/components/TemplateFilter'

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
  usePageTitle('Quản lý mẫu')
  
  const navigate = useNavigate()
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  
  // State quản lý bộ lọc - sử dụng TemplateFilterState
  const [filters, setFilters] = useState<TemplateFilterState>({
    searchText: '',
    status: [],
  })
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  // ✅ REMOVED: viewingTemplate, previewHtml, previewLoading states (modal đã xóa)
  
  // API State
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
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

  // Lọc templates - tích hợp với TemplateFilter
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Lọc theo text search (tên mẫu, ký hiệu mẫu, loại mẫu)
      const matchesSearch =
        !filters.searchText ||
        template.templateName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        template.templateCode.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        template.templateType.toLowerCase().includes(filters.searchText.toLowerCase())

      // Lọc theo trạng thái (multiselect) - bỏ qua nếu có 'ALL' hoặc empty
      const matchesStatus = 
        filters.status.length === 0 || 
        filters.status.includes('ALL') || 
        filters.status.includes(template.status)

      return matchesSearch && matchesStatus
    })
  }, [templates, filters])

  // ✅ DISABLED: Xử lý xem chi tiết (đã xóa click handler ở templateCode và frameUrl columns)
  // User muốn xóa chức năng click vào "Ký hiệu mẫu" và "Khung viền" để xem chi tiết
  // Giữ lại code để tham khảo sau này nếu cần
  // const handleViewDetails = async (template: InvoiceTemplate) => {
  //   try {
  //     setPreviewLoading(true)
  //     setViewingTemplate(null)
  //     setPreviewHtml('')
  //     
  //     // Fetch template detail and HTML preview in parallel
  //     const [detail, html] = await Promise.all([
  //       templateService.getTemplateById(template.id),
  //       templateService.getTemplatePreviewHtml(template.id)
  //     ])
  //     
  //     setViewingTemplate(detail)
  //     setPreviewHtml(html)
  //   } catch (err) {
  //     const error = err as Error
  //     setSnackbar({
  //       open: true,
  //       message: error.message || 'Không thể tải chi tiết mẫu hóa đơn',
  //       severity: 'error',
  //     })
  //   } finally {
  //     setPreviewLoading(false)
  //   }
  // }

  // ✅ DISABLED: Xử lý đóng modal xem chi tiết
  // const handleCloseViewModal = () => {
  //   setViewingTemplate(null)
  //   setPreviewHtml('')
  //   setPreviewLoading(false)
  // }

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

  // Toggle template active status
  const handleToggleTemplateStatus = async (template: InvoiceTemplate) => {
    try {
      setActionLoading(true)
      const newStatus = template.status === 'Active' ? false : true
      
      // ✅ Fetch full template data first to preserve all fields
      const fullTemplate = await templateService.getTemplateById(template.id)
      
      // ✅ FIX: Parse layoutDefinition multiple times to clean corrupted data
      // Some templates have been stringified 3-7 times, creating nested escape characters
      // We need to parse repeatedly until we get the actual object
      let parsedLayoutDefinition = fullTemplate.layoutDefinition
      let parseCount = 0
      const MAX_PARSE_ATTEMPTS = 10
      
      while (typeof parsedLayoutDefinition === 'string' && parseCount < MAX_PARSE_ATTEMPTS) {
        try {
          const beforeParse = parsedLayoutDefinition.substring(0, 100)
          parsedLayoutDefinition = JSON.parse(parsedLayoutDefinition)
          parseCount++
          console.log(`✅ Parse attempt ${parseCount}: ${beforeParse.substring(0, 50)}...`)
        } catch (parseError) {
          // If parse fails, we've reached the final state (either valid object or invalid string)
          console.error(`❌ Failed to parse layoutDefinition at attempt ${parseCount}:`, parseError)
          break
        }
      }
      
      if (parseCount > 0) {
        console.log(`✅ Successfully parsed layoutDefinition ${parseCount} times. Type: ${typeof parsedLayoutDefinition}`)
      }
      
      // ✅ VALIDATION: Ensure we have a valid object, not a corrupt string
      if (typeof parsedLayoutDefinition === 'string') {
        throw new Error(
          `layoutDefinition vẫn là string sau ${parseCount} lần parse. ` +
          `Dữ liệu có thể bị corrupt hoàn toàn. Preview: ${parsedLayoutDefinition.substring(0, 100)}`
        )
      }
      
      // ✅ CRITICAL FIX: Send OBJECT, not STRING
      // Backend expects layoutDefinition as OBJECT for both CREATE and UPDATE
      // Axios will automatically stringify the entire request body
      // If we stringify manually + Axios stringifies = double stringify = corruption
      await templateService.updateTemplate(template.id, {
        templateID: template.id,
        templateName: fullTemplate.templateName,
        layoutDefinition: parsedLayoutDefinition, // ✅ Send OBJECT (Axios will stringify)
        templateFrameID: fullTemplate.templateFrameID, // ✅ Use existing frameID
        logoUrl: fullTemplate.logoUrl, // ✅ Preserve existing logo
        isActive: newStatus, // ✅ Only change isActive status
      })
      
      // Update local state
      setTemplates(templates.map(t => 
        t.id === template.id 
          ? { ...t, status: newStatus ? 'Active' : 'Inactive' }
          : t
      ))
      
      setSnackbar({
        open: true,
        message: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} mẫu ký hiệu (${template.templateCode})`,
        severity: 'success',
      })
    } catch (error) {
      console.error('Error toggling template status:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể thay đổi trạng thái mẫu',
        severity: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Handler 
  //  filter change
  const handleFilterChange = (newFilters: TemplateFilterState) => {
    setFilters(newFilters)
  }

  // Handler cho reset filter
  const handleResetFilter = () => {
    setFilters({
      searchText: '',
      status: [],
    })
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
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#546e7a' }}>
              {index + 1}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'templateCode',
      headerName: 'Ký hiệu mẫu',
      flex: 1.2,
      minWidth: 140,
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
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#2c3e50',
            }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'templateName',
      headerName: 'Tên mẫu hóa đơn',
      flex: 2,
      minWidth: 250,
      headerAlign: 'center',
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
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#2c3e50' }}>
            {params.value}
          </Typography>
          {params.row.templateType && (
            <Typography variant="caption" sx={{ color: '#546e7a', fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
              {params.row.templateType}
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
            <Box
              sx={{
                width: 60,
                height: 80,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                overflow: 'hidden',
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
          ) : (
            <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '0.75rem' }}>
              N/A
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 130,
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
              fontWeight: 600,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      getActions: (params) => [
        <Tooltip title="Xem trước mẫu" key="view" arrow>
          <IconButton
            size="small"
            color="info"
            onClick={() => navigate(`/admin/templates/preview/${params.row.id}`)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        <Tooltip title="Chỉnh sửa" key="edit" arrow>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(params.row.id)}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        <Tooltip title="Xóa" key="delete" arrow>
          <span>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row as InvoiceTemplate)}
              disabled
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>,
        <Tooltip
          title={params.row.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          key="toggle"
          arrow
        >
          <IconButton
            size="small"
            color={params.row.status === 'Active' ? 'error' : 'success'}
            onClick={() => handleToggleTemplateStatus(params.row as InvoiceTemplate)}
            disabled={actionLoading}
          >
            {params.row.status === 'Active' ? (
              <LockOutlinedIcon fontSize="small" />
            ) : (
              <LockOpenOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>,
      ],
    },
  ]

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
            Quản lý Mẫu hóa đơn
          </Typography>
          <Typography variant="body2" sx={{ color: '#546e7a', fontSize: '0.875rem' }}>
            Quản lý và cấu hình các mẫu hóa đơn điện tử của doanh nghiệp
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* B\u1ed9 l\u1ecdc n\u00e2ng cao v\u1edbi n\u00fat T\u1ea1o m\u1eabu m\u1edbi */}
        <TemplateFilter 
          onFilterChange={handleFilterChange} 
          onReset={handleResetFilter}
          totalResults={templates.length}
          filteredResults={filteredTemplates.length}
          actionButton={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/templates/new')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                height: 42,
                px: 3,
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(25, 118, 210, 0.3)',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-1px)',
                },
              }}>
              Tạo mẫu hóa đơn
            </Button>
          }
        />

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
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e0e0e0',
                minHeight: 56,
              },
              '& .MuiTablePagination-root': {
                overflow: 'visible',
              },
              '& .MuiTablePagination-toolbar': {
                minHeight: 56,
                paddingLeft: 2,
                paddingRight: 2,
              },
              '& .MuiTablePagination-selectLabel': {
                margin: 0,
              },
              '& .MuiTablePagination-displayedRows': {
                margin: 0,
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Xác nhận xóa
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#546e7a', fontSize: '0.875rem' }}>
              Bạn có chắc chắn muốn xóa mẫu hóa đơn{' '}
              <strong>"{selectedTemplate?.templateName}"</strong> không?
            </Typography>
            <Typography variant="body2" sx={{ color: '#d32f2f', mt: 1, fontSize: '0.875rem', fontWeight: 500 }}>
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

        {/* ✅ REMOVED: Modal xem chi tiết - Không còn cần vì đã xóa click handlers ở templateCode và frameUrl */}

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
