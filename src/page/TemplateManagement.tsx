import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Tooltip,
  IconButton,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Search,
  FilterList,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

// Interface cho mẫu hóa đơn
interface InvoiceTemplate {
  id: string
  templateName: string // Tên mẫu (VD: Hóa đơn GTGT (Mẫu C25TKN))
  templateCode: string // Ký hiệu (C25TKN)
  modelCode: string // Mẫu số (1K24TXN)
  status: 'Active' | 'Inactive'
  createdAt: string
}

const TemplateManagement: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)

  // Mock Data
  const mockTemplates: InvoiceTemplate[] = [
    {
      id: '1',
      templateName: 'Hóa đơn GTGT (Mẫu C25TKN)',
      templateCode: 'C25TKN',
      modelCode: '1K24TXN',
      status: 'Active',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      templateName: 'Hóa đơn Bán hàng (Mẫu D26TTS)',
      templateCode: 'D26TTS',
      modelCode: '2K24TXN',
      status: 'Active',
      createdAt: '2024-02-20',
    },
    {
      id: '3',
      templateName: 'Hóa đơn Dịch vụ (Mẫu E27DVC)',
      templateCode: 'E27DVC',
      modelCode: '3K24TXN',
      status: 'Inactive',
      createdAt: '2024-03-10',
    },
  ]

  // Lọc templates theo search
  const filteredTemplates = mockTemplates.filter(
    (template) =>
      template.templateName.toLowerCase().includes(searchText.toLowerCase()) ||
      template.templateCode.toLowerCase().includes(searchText.toLowerCase()) ||
      template.modelCode.toLowerCase().includes(searchText.toLowerCase())
  )

  // Xử lý xóa template
  const handleDeleteClick = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    // TODO: Implement delete logic
    console.log('Deleting template:', selectedTemplate?.id)
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  // Định nghĩa columns
  const columns: GridColDef[] = [
    {
      field: 'templateName',
      headerName: 'Tên mẫu',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pl: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {params.value}
          </Typography>
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'templateCode',
      headerName: 'Ký hiệu',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#666' }}>
            {new Date(params.value as string).toLocaleDateString('vi-VN')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Chip
            label={params.value === 'Active' ? 'Đang dùng' : 'Không dùng'}
            color={params.value === 'Active' ? 'success' : 'default'}
            icon={params.value === 'Active' ? <CheckCircle /> : <Cancel />}
            size="small"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              height: 24,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%' }}>
          <Tooltip title="Xem trước" arrow>
            <IconButton
              size="small"
              color="info"
              onClick={() => navigate(`/admin/templates/preview/${params.row.id}`)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.08)',
                },
              }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa" arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/admin/templates/edit/${params.row.id}`)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
              }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa" arrow>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row as InvoiceTemplate)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                },
              }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.75rem', mb: 0.5 }}>
            Quản lý Mẫu hóa đơn
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Quản lý và cấu hình các mẫu hóa đơn điện tử
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate('/admin/templates/new')}
          sx={{
            textTransform: 'none',
            fontSize: '0.9375rem',
            fontWeight: 500,
            px: 3,
            py: 1,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}>
          Tạo mẫu mới
        </Button>
      </Stack>

      {/* Search & Filter Bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Tìm kiếm theo tên mẫu, ký hiệu, mẫu số..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#999' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          sx={{
            textTransform: 'none',
            borderColor: '#ddd',
            color: '#666',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}>
          Bộ lọc
        </Button>
      </Stack>

      {/* DataGrid */}
      <Paper
        elevation={1}
        sx={{
          height: 500,
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
        }}>
        <DataGrid
          rows={filteredTemplates}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0',
              fontSize: '0.875rem',
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnHeader': {
              borderRight: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#f9f9f9',
              },
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
          }}
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
    </Box>
  )
}

export default TemplateManagement
