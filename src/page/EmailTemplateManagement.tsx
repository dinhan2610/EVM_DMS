import { useState, useMemo, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  alpha,
  Tabs,
  Tab,
  Badge,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'

import ReceiptIcon from '@mui/icons-material/Receipt'
import PaymentIcon from '@mui/icons-material/Payment'
import DescriptionIcon from '@mui/icons-material/Description'
import SettingsIcon from '@mui/icons-material/Settings'
import type { EmailTemplate } from '@/types/email-template.types'

// ==================== MOCK DATA ====================

// Danh sách biến động đơn giản (8 biến thiết yếu)
const AVAILABLE_VARIABLES = [
  { key: '{{CustomerName}}', label: 'Tên khách hàng', example: 'Công ty ABC' },
  { key: '{{CustomerEmail}}', label: 'Email KH', example: 'info@abc.com' },
  { key: '{{InvoiceNo}}', label: 'Số hóa đơn', example: 'C24TAA-001' },
  { key: '{{InvoiceDate}}', label: 'Ngày HĐ', example: '01/12/2024' },
  { key: '{{InvoiceAmount}}', label: 'Tổng tiền', example: '30.000.000 đ' },
  { key: '{{CompanyName}}', label: 'Tên công ty', example: 'Công ty Điện lực' },
  { key: '{{CompanyPhone}}', label: 'SĐT công ty', example: '1900 1234' },
  { key: '{{DueDate}}', label: 'Hạn thanh toán', example: '31/12/2024' },
]

const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    code: 'HD_MOI',
    name: 'Thông báo Hóa đơn mới',
    subject: 'Thông báo Hóa đơn số {{InvoiceNo}}',
    content: `<p>Kính gửi: <strong>{{CustomerName}}</strong></p>
<p>{{CompanyName}} trân trọng thông báo về việc phát hành hóa đơn điện tử:</p>
<ul>
  <li>Số hóa đơn: <strong>{{InvoiceNo}}</strong></li>
  <li>Ngày lập: {{InvoiceDate}}</li>
  <li>Tổng tiền: <strong style="color: #d32f2f;">{{InvoiceAmount}}</strong></li>
</ul>
<p>Vui lòng thanh toán trước ngày {{DueDate}}.</p>
<p>Trân trọng,<br>{{CompanyName}}<br>{{CompanyPhone}}</p>`,
    isActive: true,
    isSystemTemplate: true, // ⭐ Mẫu hệ thống - không được xóa
    variables: [],
    category: 'invoice',
    createdAt: '2024-12-01',
    updatedAt: '2024-12-07',
  },
  {
    id: '2',
    code: 'NHAC_NO',
    name: 'Nhắc nhở thanh toán',
    subject: 'Nhắc thanh toán hóa đơn {{InvoiceNo}}',
    content: `<p>Kính gửi: <strong>{{CustomerName}}</strong></p>
<p>Chúng tôi nhận thấy hóa đơn <strong>{{InvoiceNo}}</strong> chưa được thanh toán.</p>
<p>Tổng tiền: <strong style="color: #d32f2f;">{{InvoiceAmount}}</strong></p>
<p>Hạn thanh toán: <strong>{{DueDate}}</strong></p>
<p>Vui lòng thanh toán để tránh gián đoạn dịch vụ.</p>
<p>Liên hệ: {{CompanyPhone}} | {{CustomerEmail}}</p>`,
    isActive: true,
    isSystemTemplate: true, // ⭐ Mẫu hệ thống - không được xóa
    variables: [],
    category: 'payment',
    createdAt: '2024-12-01',
    updatedAt: '2024-12-07',
  },
  {
    id: '3',
    code: 'CHAO_MUNG',
    name: 'Email chào mừng khách hàng',
    subject: 'Chào mừng đến với {{CompanyName}}',
    content: `<p>Xin chào <strong>{{CustomerName}}</strong>,</p>
<p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của {{CompanyName}}.</p>
<p>Mọi thắc mắc vui lòng liên hệ:</p>
<ul>
  <li>Hotline: {{CompanyPhone}}</li>
  <li>Email: {{CustomerEmail}}</li>
</ul>
<p>Trân trọng!</p>`,
    isActive: false,
    isSystemTemplate: false, // ⭐ Mẫu tùy chỉnh - có thể xóa
    variables: [],
    category: 'system',
    createdAt: '2024-12-05',
    updatedAt: '2024-12-07',
  },
]

// ==================== HELPER FUNCTIONS ====================

const replaceVariables = (content: string): string => {
  let result = content
  AVAILABLE_VARIABLES.forEach(({ key, example }) => {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), example)
  })
  return result
}

// ==================== MAIN COMPONENT ====================

const EmailTemplateManagement = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'invoice' | 'payment' | 'statement' | 'system'>('all')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Modal states
  const [openEditModal, setOpenEditModal] = useState(false)
  const [openPreviewModal, setOpenPreviewModal] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  
  // Form states
  const [editForm, setEditForm] = useState({ name: '', subject: '', content: '', isActive: true })
  const quillRef = useRef<ReactQuill>(null)

  // Filtered templates với category filter
  const filteredTemplates = useMemo(() => {
    let result = templates
    
    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter)
    }
    
    // Filter by search text
    if (searchText) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(searchText.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchText.toLowerCase()) ||
          t.code.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    
    // Sort: System templates first (create new array to avoid mutating)
    return [...result].sort((a, b) => {
      if (a.isSystemTemplate === b.isSystemTemplate) return 0
      return a.isSystemTemplate ? -1 : 1
    })
  }, [templates, searchText, categoryFilter])
  
  // Count by category for badge
  const categoryCounts = useMemo(() => {
    return {
      all: templates.length,
      invoice: templates.filter((t) => t.category === 'invoice').length,
      payment: templates.filter((t) => t.category === 'payment').length,
      statement: templates.filter((t) => t.category === 'statement').length,
      system: templates.filter((t) => t.category === 'system').length,
    }
  }, [templates])

  // Handle create new
  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setEditForm({ name: '', subject: '', content: '', isActive: true })
    setOpenEditModal(true)
  }

  // Handle edit
  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      isActive: template.isActive,
    })
    setOpenEditModal(true)
  }

  // Handle save
  const handleSave = () => {
    if (!editForm.name || !editForm.subject || !editForm.content) {
      setSnackbar({ open: true, message: 'Vui lòng điền đầy đủ thông tin!', severity: 'error' })
      return
    }

    if (selectedTemplate) {
      // Update existing
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selectedTemplate.id
            ? { ...t, ...editForm, updatedAt: new Date().toISOString().split('T')[0] }
            : t
        )
      )
      setSnackbar({ open: true, message: 'Đã cập nhật mẫu email!', severity: 'success' })
    } else {
      // Create new
      const newTemplate: EmailTemplate = {
        id: String(templates.length + 1),
        code: `CUSTOM_${templates.length + 1}`,
        ...editForm,
        isSystemTemplate: false, // Mẫu tùy chỉnh
        variables: [],
        category: 'system',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      }
      setTemplates((prev) => [...prev, newTemplate])
      setSnackbar({ open: true, message: 'Đã tạo mẫu email mới!', severity: 'success' })
    }
    
    setOpenEditModal(false)
  }

  // Handle delete
  const handleDeleteClick = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedTemplate) {
      setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id))
      setSnackbar({ open: true, message: 'Đã xóa mẫu email!', severity: 'success' })
    }
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  // Handle preview
  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setOpenPreviewModal(true)
  }

  // Insert variable
  const insertVariable = (variable: string) => {
    if (!quillRef.current) return
    
    const editor = quillRef.current.getEditor()
    const selection = editor.getSelection()
    const index = selection ? selection.index : editor.getLength()
    
    editor.insertText(index, variable, 'user')
    editor.setSelection(index + variable.length, 0)
  }

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const index = filteredTemplates.findIndex((t) => t.id === params.row.id)
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', fontSize: '0.875rem' }}>
              {index + 1}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'name',
      headerName: 'Tên mẫu email',
      flex: 1,
      minWidth: 250,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', lineHeight: 1.4 }}>
              {params.value}
            </Typography>
            {params.row.isSystemTemplate && (
              <Chip
                label="Hệ thống"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: alpha('#ff9800', 0.1),
                  color: '#ff9800',
                }}
              />
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Loại',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const categoryLabels: Record<string, string> = {
          invoice: 'Hóa đơn',
          payment: 'Thanh toán',
          statement: 'Bảng kê',
          system: 'Hệ thống',
        }
        const categoryColors: Record<string, string> = {
          invoice: '#2e7d32',
          payment: '#d32f2f',
          statement: '#1976d2',
          system: '#666',
        }
        const categoryIcons: Record<string, JSX.Element> = {
          invoice: <ReceiptIcon sx={{ fontSize: 16 }} />,
          payment: <PaymentIcon sx={{ fontSize: 16 }} />,
          statement: <DescriptionIcon sx={{ fontSize: 16 }} />,
          system: <SettingsIcon sx={{ fontSize: 16 }} />,
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Chip
              label={categoryLabels[params.value] || params.value}
              icon={categoryIcons[params.value]}
              size="small"
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                height: 28,
                backgroundColor: alpha(categoryColors[params.value] || '#666', 0.1),
                color: categoryColors[params.value] || '#666',
              }}
            />
          </Box>
        )
      },
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Chip
            label={params.value ? 'Đang dùng' : 'Không dùng'}
            color={params.value ? 'success' : 'default'}
            icon={params.value ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
            size="small"
            sx={{ fontSize: '0.8125rem', fontWeight: 500, height: 28 }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isSystem = params.row.isSystemTemplate
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', height: '100%' }}>
            <Tooltip title="Xem trước" arrow>
              <IconButton
                size="small"
                onClick={() => handlePreview(params.row)}
                sx={{ color: '#1976d2', '&:hover': { backgroundColor: alpha('#1976d2', 0.08) } }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isSystem ? (
              <Tooltip title="Mẫu hệ thống - Chỉ xem, không chỉnh sửa" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled
                    sx={{ color: '#ccc' }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Chỉnh sửa" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(params.row)}
                  sx={{ color: '#ed6c02', '&:hover': { backgroundColor: alpha('#ed6c02', 0.08) } }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {isSystem ? (
              <Tooltip title="Mẫu hệ thống - Không thể xóa" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled
                    sx={{ color: '#ccc' }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Xóa" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(params.row)}
                  sx={{ color: '#d32f2f', '&:hover': { backgroundColor: alpha('#d32f2f', 0.08) } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      },
    },
  ]

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Quản lý Mẫu Email
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Quản lý các mẫu email tự động cho hệ thống
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.24)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.32)',
              },
            }}
          >
            Tạo mẫu mới
          </Button>
        </Box>

        {/* DataGrid */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Category Filter Tabs */}
          <Box sx={{ borderBottom: '1px solid #e0e0e0' }}>
            <Tabs
              value={categoryFilter}
              onChange={(_, newValue) => setCategoryFilter(newValue)}
              sx={{
                px: 3,
                pt: 2,
                minHeight: 48,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  minHeight: 48,
                  '&.Mui-selected': {
                    color: '#1976d2',
                    fontWeight: 600,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#1976d2',
                  height: 3,
                },
              }}
            >
              <Tab
                value="all"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Tất cả</span>
                    <Badge 
                      badgeContent={categoryCounts.all} 
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                value="invoice"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ fontSize: 18 }} />
                    <span>Hóa đơn</span>
                    <Badge 
                      badgeContent={categoryCounts.invoice} 
                      color="success"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                value="payment"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon sx={{ fontSize: 18 }} />
                    <span>Thanh toán</span>
                    <Badge 
                      badgeContent={categoryCounts.payment} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                value="statement"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon sx={{ fontSize: 18 }} />
                    <span>Bảng kê</span>
                    <Badge 
                      badgeContent={categoryCounts.statement} 
                      color="info"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                value="system"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon sx={{ fontSize: 18 }} />
                    <span>Hệ thống</span>
                    <Badge 
                      badgeContent={categoryCounts.system} 
                      color="warning"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    />
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Search Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              size="small"
              label="Tìm kiếm theo tên mẫu, mã mẫu"
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
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            getRowHeight={() => 72}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                py: 0,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1a1a1a',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
              },
              '& .MuiDataGrid-row': {
                '&:nth-of-type(even)': {
                  backgroundColor: '#fafafa',
                },
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f0f7ff !important',
              },
            }}
          />
        </Paper>

        {/* Edit/Create Modal */}
        <Dialog 
          open={openEditModal} 
          onClose={() => setOpenEditModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedTemplate ? 'Chỉnh sửa Mẫu Email' : 'Tạo Mẫu Email Mới'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.5}>
              {/* Tên mẫu */}
              <TextField
                label="Tên mẫu email"
                fullWidth
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="VD: Thông báo hóa đơn mới"
                size="small"
              />

              {/* Tiêu đề email */}
              <TextField
                label="Tiêu đề email"
                fullWidth
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                placeholder="VD: Hóa đơn {{InvoiceNo}} - {{CompanyName}}"
                size="small"
              />

              {/* Biến động - Dropdown chèn nhanh */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 1, display: 'block' }}>
                  CHÈN BIẾN ĐỘNG
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <Tooltip key={variable.key} title={`VD: ${variable.example}`} arrow>
                      <Chip
                        label={variable.label}
                        size="small"
                        onClick={() => insertVariable(variable.key)}
                        sx={{
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: alpha('#1976d2', 0.08),
                          color: '#1976d2',
                          border: `1px solid ${alpha('#1976d2', 0.2)}`,
                          '&:hover': {
                            backgroundColor: alpha('#1976d2', 0.15),
                            transform: 'translateY(-1px)',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              {/* Nội dung email - WYSIWYG Editor */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 1, display: 'block' }}>
                  NỘI DUNG EMAIL
                </Typography>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={editForm.content}
                    onChange={(value) => setEditForm({ ...editForm, content: value })}
                    style={{ height: '300px' }}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ color: [] }, { background: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ align: [] }],
                        ['link'],
                        ['clean'],
                      ],
                    }}
                  />
                </Box>
              </Box>

              {/* Trạng thái */}
              <Box sx={{ pt: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={editForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                    label="Trạng thái"
                  >
                    <MenuItem value="active">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 18, color: '#2e7d32' }} />
                        Đang sử dụng
                      </Box>
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Cancel sx={{ fontSize: 18, color: '#999' }} />
                        Không sử dụng
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2, gap: 1 }}>
            <Button onClick={() => setOpenEditModal(false)} sx={{ textTransform: 'none' }}>
              Hủy
            </Button>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                setOpenEditModal(false)
                setSelectedTemplate({ 
                  ...editForm, 
                  id: selectedTemplate?.id || '', 
                  code: selectedTemplate?.code || '', 
                  isSystemTemplate: selectedTemplate?.isSystemTemplate || false,
                  variables: [], 
                  category: 'system', 
                  createdAt: '', 
                  updatedAt: '' 
                } as EmailTemplate)
                setOpenPreviewModal(true)
              }}
              sx={{ textTransform: 'none' }}
            >
              Xem trước
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ textTransform: 'none' }}
            >
              Lưu mẫu
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Modal */}
        <Dialog
          open={openPreviewModal}
          onClose={() => setOpenPreviewModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Xem trước Email
              </Typography>
              <IconButton size="small" onClick={() => setOpenPreviewModal(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ maxWidth: 650, margin: '0 auto' }}>
              {/* Preview Subject */}
              <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                  Tiêu đề:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  {replaceVariables(selectedTemplate?.subject || editForm.subject)}
                </Typography>
              </Paper>

              {/* Preview Content */}
              <Box
                sx={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  p: 3,
                  overflow: 'hidden',
                }}
                dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate?.content || editForm.content) }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
            <Button onClick={() => setOpenPreviewModal(false)} variant="contained" sx={{ textTransform: 'none' }}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa mẫu email <strong>{selectedTemplate?.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDeleteDialog(false)} sx={{ textTransform: 'none' }}>
              Hủy
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              sx={{ textTransform: 'none' }}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
    </Box>
  )
}

export default EmailTemplateManagement
