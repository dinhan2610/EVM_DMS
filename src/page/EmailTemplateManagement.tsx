import { useState, useMemo, useRef, useEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
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
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'

import ReceiptIcon from '@mui/icons-material/Receipt'
import PaymentIcon from '@mui/icons-material/Payment'
import DescriptionIcon from '@mui/icons-material/Description'
import SettingsIcon from '@mui/icons-material/Settings'
import emailTemplateService, { EmailTemplate } from '@/services/emailTemplateService'

// ==================== MOCK DATA ====================

// ✅ UPDATED: Match with API variables from backend
const AVAILABLE_VARIABLES = [
  { key: '{{CustomerName}}', label: 'Tên khách hàng', example: 'Công ty ABC' },
  { key: '{{CustomerEmail}}', label: 'Email KH', example: 'info@abc.com' },
  { key: '{{InvoiceNumber}}', label: 'Số hóa đơn', example: 'C24TAA-001' },
  { key: '{{Serial}}', label: 'Ký hiệu hóa đơn', example: '1C26TKN' },
  { key: '{{IssuedDate}}', label: 'Ngày phát hành', example: '23/01/2026' },
  { key: '{{TotalAmount}}', label: 'Tổng tiền', example: '30.000.000' },
  { key: '{{LookupCode}}', label: 'Mã tra cứu', example: 'ABC123XYZ' },
  { key: '{{CompanyName}}', label: 'Tên công ty', example: 'Công ty KNS' },
  { key: '{{CompanyPhone}}', label: 'SĐT công ty', example: '1900 1234' },
  { key: '{{Message}}', label: 'Lời nhắn', example: 'Vui lòng kiểm tra hóa đơn đính kèm' },
  { key: '{{Reason}}', label: 'Lý do điều chỉnh/thu hồi', example: 'Sai thông tin khách hàng' },
  { key: '{{AttachmentList}}', label: 'Danh sách file đính kèm', example: '<li>invoice.pdf</li>' },
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
  usePageTitle('Quản lý mẫu email')
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'invoice' | 'payment' | 'minutes' | 'system'>('all')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Modal states
  const [openEditModal, setOpenEditModal] = useState(false)
  const [openPreviewModal, setOpenPreviewModal] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [baseContent, setBaseContent] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'detail' | 'preview'>('detail') // 'detail' = raw, 'preview' = with examples
  
  // Form states
  const [editForm, setEditForm] = useState({ 
    templateCode: '',
    languageCode: 'vi',
    name: '', 
    subject: '', 
    bodyContent: '', 
    category: 'invoice',
    isActive: true 
  })
  const quillRef = useRef<ReactQuill>(null)

  // ✅ Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await emailTemplateService.getAllEmailTemplates()
      setTemplates(data)
      console.log('✅ Loaded templates:', data.length)
    } catch (error) {
      console.error('❌ Error loading templates:', error)
      setSnackbar({ 
        open: true, 
        message: 'Lỗi khi tải danh sách mẫu email', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

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
          t.templateCode.toLowerCase().includes(searchText.toLowerCase())
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
      minutes: templates.filter((t) => t.category === 'minutes').length,
      system: templates.filter((t) => t.category === 'system').length,
    }
  }, [templates])

  // Handle create new template - Reset form to defaults
  const handleCreateNew = () => {
    console.log('[handleCreateNew] Opening create modal')
    
    setSelectedTemplate(null)
    setEditForm({ 
      templateCode: '',
      languageCode: 'vi',
      name: '', 
      subject: '', 
      bodyContent: '', 
      category: 'invoice',
      isActive: true 
    })
    setSaving(false) // Reset saving state
    setOpenEditModal(true)
  }

  // Handle edit - Load template data into form
  const handleEdit = (template: EmailTemplate) => {
    console.log('[handleEdit] Editing template:', template.name, '(ID:', template.emailTemplateID, ')')
    
    setSelectedTemplate(template)
    setEditForm({
      templateCode: template.templateCode, // Read-only when editing
      languageCode: template.languageCode,
      name: template.name,
      subject: template.subject,
      bodyContent: template.bodyContent,
      category: template.category,
      isActive: template.isActive,
    })
    setSaving(false) // Reset saving state
    setOpenEditModal(true)
  }

  // Handle save with comprehensive validation and error handling
  const handleSave = async () => {
    // === STEP 1: CLIENT-SIDE VALIDATION ===
    const errors: string[] = []
    
    if (!editForm.name?.trim()) errors.push('Tên mẫu email')
    if (!editForm.subject?.trim()) errors.push('Tiêu đề email')
    if (!editForm.bodyContent?.trim() || editForm.bodyContent === '<p><br></p>') errors.push('Nội dung HTML')
    if (!editForm.category?.trim()) errors.push('Danh mục')
    if (!editForm.languageCode?.trim()) errors.push('Ngôn ngữ')
    if (!selectedTemplate && !editForm.templateCode?.trim()) errors.push('Mã template')
    
    if (errors.length > 0) {
      setSnackbar({ 
        open: true, 
        message: `Vui lòng điền đầy đủ: ${errors.join(', ')}`, 
        severity: 'error' 
      })
      return
    }

    // === STEP 2: VALIDATE TEMPLATE CODE FORMAT (CREATE ONLY) ===
    if (!selectedTemplate) {
      const templateCodeRegex = /^[A-Z0-9_]+$/
      if (!templateCodeRegex.test(editForm.templateCode)) {
        setSnackbar({ 
          open: true, 
          message: 'Mã template chỉ được chứa chữ IN HOA, số và gạch dưới', 
          severity: 'error' 
        })
        return
      }
    }

    // === STEP 3: SAVE TO API ===
    setSaving(true)
    try {
      if (selectedTemplate) {
        // === UPDATE EXISTING TEMPLATE ===
        console.log('[handleSave] Updating template ID:', selectedTemplate.emailTemplateID)
        
        // API expects: PUT /api/EmailTemplates/{id}
        // Body: { emailTemplateID: 0, subject, bodyContent, category, name, isActive }
        const updateData = {
          emailTemplateID: 0, // Not used by API, but expected in body for consistency
          subject: editForm.subject.trim(),
          bodyContent: editForm.bodyContent.trim(),
          category: editForm.category.trim(),
          name: editForm.name.trim(),
          isActive: editForm.isActive,
        }
        
        console.log('[handleSave] Update payload:', JSON.stringify(updateData, null, 2))
        
        await emailTemplateService.updateEmailTemplate(
          selectedTemplate.emailTemplateID,
          updateData
        )
        
        setSnackbar({ 
          open: true, 
          message: `✅ Đã cập nhật mẫu "${editForm.name}"!`, 
          severity: 'success' 
        })
      } else {
        // === CREATE NEW TEMPLATE ===
        console.log('[handleSave] Creating new template:', editForm.templateCode)
        
        // API expects: POST /api/EmailTemplates
        // Body: { templateCode, languageCode, subject, category, bodyContent, name, isActive }
        const createData = {
          templateCode: editForm.templateCode.trim(),
          languageCode: editForm.languageCode.trim(),
          subject: editForm.subject.trim(),
          category: editForm.category.trim(),
          bodyContent: editForm.bodyContent.trim(),
          name: editForm.name.trim(),
          isActive: editForm.isActive,
        }
        
        console.log('[handleSave] Create payload:', JSON.stringify(createData, null, 2))
        
        await emailTemplateService.createEmailTemplate(createData)
        
        setSnackbar({ 
          open: true, 
          message: `✅ Đã tạo mẫu "${editForm.name}" thành công!`, 
          severity: 'success' 
        })
      }
      
      // === STEP 4: RELOAD & CLOSE ===
      await loadTemplates()
      setOpenEditModal(false)
      setSelectedTemplate(null)
      setEditForm({
        templateCode: '',
        languageCode: 'vi',
        name: '',
        subject: '',
        bodyContent: '',
        category: 'invoice',
        isActive: true,
      })
      
    } catch (error: unknown) {
      console.error('❌ Error saving template:', error)
      
      // Parse error message
      let errorMessage = 'Lỗi khi lưu mẫu email'
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = `Mã template "${editForm.templateCode}" đã tồn tại. Vui lòng sử dụng mã khác.`
        } else if (error.message.includes('400')) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
        } else if (error.message.includes('401')) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
        } else if (error.message.includes('403')) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này.'
        } else if (error.message.includes('404')) {
          errorMessage = 'Không tìm thấy mẫu email này.'
        } else {
          errorMessage = error.message
        }
      }
      
      setSnackbar({ 
        open: true, 
        message: `❌ ${errorMessage}`, 
        severity: 'error' 
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDeleteClick = (template: EmailTemplate) => {
    if (template.isSystemTemplate) {
      setSnackbar({ 
        open: true, 
        message: 'Không thể xóa mẫu hệ thống!', 
        severity: 'error' 
      })
      return
    }
    setSelectedTemplate(template)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedTemplate) {
      try {
        await emailTemplateService.deleteEmailTemplate(selectedTemplate.emailTemplateID)
        setSnackbar({ open: true, message: 'Đã xóa mẫu email!', severity: 'success' })
        await loadTemplates()
      } catch (error) {
        console.error('❌ Error deleting template:', error)
        setSnackbar({ 
          open: true, 
          message: 'Lỗi khi xóa mẫu email', 
          severity: 'error' 
        })
      }
    }
    setOpenDeleteDialog(false)
    setSelectedTemplate(null)
  }

  // Handle view current template detail - Show current bodyContent WITHOUT variable replacement
  const handleViewDetail = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setBaseContent('') // Clear base content to use bodyContent
    setViewMode('detail') // Raw view - no variable replacement
    setOpenPreviewModal(true)
  }

  // Handle preview base template - Fetch base content from API WITH example data
  const handlePreviewBase = async (template: EmailTemplate) => {
    try {
      setLoadingPreview(true)
      setSelectedTemplate(template)
      setViewMode('preview') // Preview mode - replace variables with examples
      setOpenPreviewModal(true)
      
      // Fetch base content HTML from API
      const content = await emailTemplateService.getBaseContent(template.templateCode)
      setBaseContent(content)
      
      console.log('✅ Base content loaded:', content.length, 'characters')
    } catch (error) {
      console.error('❌ Error loading base content:', error)
      setSnackbar({
        open: true,
        message: 'Không thể tải nội dung mẫu gốc',
        severity: 'error',
      })
      // Fallback to current bodyContent if API fails
      setBaseContent(template.bodyContent)
    } finally {
      setLoadingPreview(false)
    }
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
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        // ✅ FIX: Use params.api to get correct row index with pagination
        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.row.emailTemplateID)
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#546e7a', fontSize: '0.875rem' }}>
              {rowIndex + 1}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'name',
      headerName: 'Tên mẫu email',
      flex: 2,
      minWidth: 280,
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
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const categoryLabels: Record<string, string> = {
          invoice: 'Hóa đơn',
          payment: 'Thanh toán',
          minutes: 'Biên bản',
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
          minutes: <DescriptionIcon sx={{ fontSize: 16 }} />,
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
      flex: 1,
      minWidth: 130,
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
      width: 200,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isSystem = params.row.isSystemTemplate
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%', height: '100%' }}>
            {/* View Current Detail */}
            <Tooltip 
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    Xem chi tiết
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', opacity: 0.9 }}>
                    HTML gốc với biến động
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
            >
              <IconButton
                size="small"
                onClick={() => handleViewDetail(params.row)}
                sx={{ 
                  color: '#1976d2',
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: alpha('#1976d2', 0.12),
                    transform: 'scale(1.1)',
                    color: '#1565c0',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Preview Base Template */}
            <Tooltip 
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    Xem trước mẫu gốc
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', opacity: 0.9 }}>
                    Base Template với dữ liệu mẫu
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
            >
              <IconButton
                size="small"
                onClick={() => handlePreviewBase(params.row)}
                sx={{ 
                  color: '#9c27b0',
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: alpha('#9c27b0', 0.12),
                    transform: 'scale(1.1)',
                    color: '#7b1fa2',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isSystem ? (
              <Tooltip 
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Mẫu hệ thống
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                      Chỉ xem, không thể chỉnh sửa
                    </Typography>
                  </Box>
                } 
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled
                    sx={{ 
                      color: '#bdbdbd',
                      cursor: 'not-allowed',
                      opacity: 0.5,
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip 
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                      Chỉnh sửa mẫu email
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', opacity: 0.9 }}>
                      Sửa nội dung, tiêu đề, trạng thái
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <IconButton
                  size="small"
                  onClick={() => handleEdit(params.row)}
                  sx={{ 
                    color: '#ed6c02',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      backgroundColor: alpha('#ed6c02', 0.12),
                      transform: 'scale(1.1)',
                      color: '#e65100',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    }
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {isSystem ? (
              <Tooltip 
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Mẫu hệ thống
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                      Không thể xóa
                    </Typography>
                  </Box>
                }
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled
                    sx={{ 
                      color: '#bdbdbd',
                      cursor: 'not-allowed',
                      opacity: 0.5,
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip 
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: '#ff5252' }}>
                      Xóa mẫu email
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', opacity: 0.9 }}>
                      Thao tác này không thể hoàn tác
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(params.row)}
                  sx={{ 
                    color: '#d32f2f',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      backgroundColor: alpha('#d32f2f', 0.12),
                      transform: 'scale(1.1)',
                      color: '#c62828',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    }
                  }}
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
                value="minutes"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon sx={{ fontSize: 18 }} />
                    <span>Biên bản</span>
                    <Badge 
                      badgeContent={categoryCounts.minutes} 
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
            getRowId={(row) => row.emailTemplateID}
            loading={loading}
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
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedTemplate ? 'Chỉnh sửa Mẫu Email' : 'Tạo Mẫu Email Mới'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {selectedTemplate 
                  ? `Đang chỉnh sửa: ${selectedTemplate.name}`
                  : 'Tạo mẫu email tự động cho hệ thống'
                }
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              {/* === SECTION 1: Thông tin cơ bản === */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon sx={{ fontSize: 18 }} />
                  Thông tin cơ bản
                </Typography>
                <Stack spacing={2}>
                  {/* Mã template - Chỉ hiện khi tạo mới */}
                  {!selectedTemplate && (
                    <TextField
                      label="Mã template *"
                      fullWidth
                      value={editForm.templateCode}
                      onChange={(e) => setEditForm({ ...editForm, templateCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                      placeholder="INVOICE_SEND"
                      size="small"
                      required
                      error={!selectedTemplate && !editForm.templateCode}
                      helperText="Mã duy nhất để xác định mẫu (chữ in hoa, số, gạch dưới). Ví dụ: INVOICE_SEND, PAYMENT_REMINDER"
                      InputProps={{
                        sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                      }}
                    />
                  )}

                  {/* Tên mẫu */}
                  <TextField
                    label="Tên mẫu email *"
                    fullWidth
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Thông báo hóa đơn mới"
                    size="small"
                    required
                    error={!editForm.name}
                    helperText="Tên hiển thị trong danh sách quản lý"
                  />

                  {/* Row: Ngôn ngữ + Danh mục */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <FormControl size="small" fullWidth required error={!editForm.languageCode}>
                      <InputLabel>Ngôn ngữ *</InputLabel>
                      <Select
                        value={editForm.languageCode}
                        onChange={(e) => setEditForm({ ...editForm, languageCode: e.target.value })}
                        label="Ngôn ngữ *"
                      >
                        <MenuItem value="vi">🇻🇳 Tiếng Việt</MenuItem>
                        <MenuItem value="en">🇬🇧 English</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth required error={!editForm.category}>
                      <InputLabel>Danh mục *</InputLabel>
                      <Select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        label="Danh mục *"
                      >
                        <MenuItem value="invoice">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptIcon sx={{ fontSize: 16 }} />
                            Hóa đơn
                          </Box>
                        </MenuItem>
                        <MenuItem value="payment">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PaymentIcon sx={{ fontSize: 16 }} />
                            Thanh toán
                          </Box>
                        </MenuItem>
                        <MenuItem value="minutes">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon sx={{ fontSize: 16 }} />
                            Biên bản
                          </Box>
                        </MenuItem>
                        <MenuItem value="system">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SettingsIcon sx={{ fontSize: 16 }} />
                            Hệ thống
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Trạng thái */}
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
                </Stack>
              </Box>

              {/* === SECTION 2: Nội dung email === */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 18 }} />
                  Nội dung email
                </Typography>
                <Stack spacing={2}>
                  {/* Tiêu đề email */}
                  <TextField
                    label="Tiêu đề email *"
                    fullWidth
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    placeholder="🔔 [Hóa đơn] #{{InvoiceNumber}} - {{CompanyName}}"
                    size="small"
                    required
                    error={!editForm.subject}
                    helperText="Có thể sử dụng biến động như {{InvoiceNumber}}, {{CustomerName}}"
                    multiline
                    rows={2}
                  />

                  {/* Biến động */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 1, display: 'block' }}>
                      BIẾN ĐỘNG KHẢ DỤNG (Click để chèn vào nội dung)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {AVAILABLE_VARIABLES.map((variable) => (
                        <Tooltip key={variable.key} title={`Ví dụ: ${variable.example}`} arrow placement="top">
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
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: alpha('#1976d2', 0.15),
                                transform: 'translateY(-2px)',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                              },
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>

                  {/* Nội dung HTML */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 1, display: 'block' }}>
                      NỘI DUNG HTML *
                    </Typography>
                    <Box 
                      sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1, 
                        overflow: 'hidden',
                        '& .ql-editor': {
                          minHeight: '300px',
                          maxHeight: '400px',
                        }
                      }}
                    >
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={editForm.bodyContent}
                        onChange={(value) => setEditForm({ ...editForm, bodyContent: value })}
                        placeholder="Nhập nội dung email hoặc dán HTML..."
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ color: [] }, { background: [] }],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            [{ align: [] }],
                            ['link', 'image'],
                            ['code-block'],
                            ['clean'],
                          ],
                        }}
                      />
                    </Box>
                    {!editForm.bodyContent && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>
                        Nội dung không được để trống
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2.5, gap: 1, backgroundColor: '#fafafa' }}>
            <Button 
              onClick={() => setOpenEditModal(false)} 
              sx={{ textTransform: 'none' }}
            >
              Hủy
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                // Validate required fields before preview
                if (!editForm.name || !editForm.subject || !editForm.bodyContent) {
                  setSnackbar({ 
                    open: true, 
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc!', 
                    severity: 'error' 
                  })
                  return
                }
                setOpenEditModal(false)
                setSelectedTemplate({ 
                  emailTemplateID: selectedTemplate?.emailTemplateID || 0,
                  templateCode: editForm.templateCode || selectedTemplate?.templateCode || '',
                  languageCode: editForm.languageCode,
                  category: editForm.category,
                  name: editForm.name,
                  subject: editForm.subject,
                  bodyContent: editForm.bodyContent,
                  isActive: editForm.isActive,
                  isSystemTemplate: selectedTemplate?.isSystemTemplate || false,
                  createdAt: selectedTemplate?.createdAt || '',
                  updatedAt: selectedTemplate?.updatedAt || null,
                } as EmailTemplate)
                setViewMode('preview')
                setOpenPreviewModal(true)
              }}
              sx={{ textTransform: 'none' }}
            >
              Xem trước
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={
                saving || 
                !editForm.name || 
                !editForm.subject || 
                !editForm.bodyContent || 
                (!selectedTemplate && !editForm.templateCode)
              }
              sx={{ 
                textTransform: 'none',
                minWidth: 140,
              }}
            >
              {saving 
                ? 'Đang lưu...' 
                : (selectedTemplate ? 'Cập nhật mẫu' : 'Tạo mẫu mới')
              }
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {baseContent ? 'Xem trước Mẫu Gốc (Base Template)' : 'Xem Chi tiết Mẫu Hiện tại'}
                </Typography>
                {baseContent && (
                  <Chip 
                    label="Base" 
                    size="small" 
                    color="secondary"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
              <IconButton size="small" onClick={() => {
                setOpenPreviewModal(false)
                setBaseContent('')
                setViewMode('detail')
              }}>
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
                  {viewMode === 'preview' 
                    ? replaceVariables(selectedTemplate?.subject || editForm.subject)
                    : (selectedTemplate?.subject || editForm.subject)
                  }
                </Typography>
              </Paper>

              {/* Preview Content - Use baseContent from API or bodyContent */}
              {loadingPreview ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {viewMode === 'detail' && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>Chế độ Xem Chi tiết:</strong> Hiển thị HTML gốc với placeholders
                    </Alert>
                  )}
                  {viewMode === 'preview' && baseContent && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <strong>Chế độ Preview:</strong> Hiển thị mẫu gốc với dữ liệu mẫu
                    </Alert>
                  )}
                  <Box
                    sx={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      p: 3,
                      overflow: 'hidden',
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: viewMode === 'preview' 
                        ? replaceVariables(baseContent || selectedTemplate?.bodyContent || editForm.bodyContent)
                        : (baseContent || selectedTemplate?.bodyContent || editForm.bodyContent)
                    }}
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
            <Button onClick={() => {
              setOpenPreviewModal(false)
              setBaseContent('')
              setViewMode('detail')
            }} variant="contained" sx={{ textTransform: 'none' }}>
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
