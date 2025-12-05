import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Divider,
  
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InfoIcon from '@mui/icons-material/Info'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PrintIcon from '@mui/icons-material/Print'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useTemplateReducer } from '@/hooks/useTemplateReducer'
import { TemplateState } from '@/types/templateEditor'
import { AddFieldDialog } from '@/components/AddFieldDialog'
import templateFrameService, { TemplateFrame } from '@/services/templateFrameService'
import invoiceSymbolService, { 
  PrefixApiResponse, 
  SerialStatusApiResponse, 
  InvoiceTypeApiResponse 
} from '@/services/invoiceSymbolService'
import templateService from '@/services/templateService'
import API_CONFIG from '@/config/api.config'
import { mapEditorStateToApiRequest } from '@/utils/templateApiMapper'
import type { TemplateEditorState } from '@/utils/templateApiMapper'

// Interface cũ - tương thích với InvoiceTemplatePreview
interface TemplateConfig {
  templateName: string
  companyLogo: string | null
  companyName: string
  companyTaxCode: string
  companyAddress: string
  companyPhone: string
  companyBankAccount: string
  modelCode: string
  templateCode: string
}

// Interface cho visibility
interface TemplateVisibility {
  showQrCode?: boolean
  showLogo?: boolean
  showCompanyName?: boolean
  showCompanyTaxCode?: boolean
  showCompanyAddress?: boolean
  showCompanyPhone?: boolean
  showCompanyBankAccount?: boolean
  showCustomerInfo?: boolean
  showPaymentInfo?: boolean
  showSignature?: boolean
}

const TemplateEditor: React.FC = () => {
  const { templateId: urlTemplateId } = useParams<{ templateId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const templateId = urlTemplateId || searchParams.get('templateId')
  
  // ✅ Ref cho input file để reset sau khi xóa
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  // ============ KHỞI TẠO STATE MỚI VỚI REDUCER ============
  const initialState: TemplateState = {
    templateName: 'Hóa đơn bán hàng (mẫu CB)',
    invoiceType: 'withCode',
    invoiceDate: new Date().toISOString(),
    symbol: { 
      invoiceType: '1', // 1: HĐ điện tử GTGT
      taxCode: 'C', // C: Có mã CQT
      year: new Date().getFullYear().toString().slice(-2), // 2 số cuối năm hiện tại
      invoiceForm: 'T', // T: Hóa đơn doanh nghiệp
      management: 'AA' // Mặc định AA
    },
    logo: null,
    logoSize: 150,
    background: { custom: null, frame: '/khunghoadon.png' },
    company: {
      name: 'Công ty Cổ phần Giải pháp Tổng thể Kỷ Nguyên Số',
      taxCode: '0316882091',
      address: 'Tòa nhà ABC, 123 Đường XYZ, Phường Tân Định, Quận 1, TP. Hồ Chí Minh, Việt Nam',
      phone: '(028) 38 995 822',
      bankAccount: '245889119 - Ngân hàng TMCP Á Châu - CN Sài Gòn',
      fields: [
        { id: 'name', label: 'Đơn vị bán', value: 'Công ty Cổ phần Giải pháp Tổng thể Kỷ Nguyên Số', visible: true },
        { id: 'taxCode', label: 'Mã số thuế', value: '0316882091', visible: false },
        { id: 'address', label: 'Địa chỉ', value: 'Tòa nhà ABC, 123 Đường XYZ, Phường Tân Định, Quận 1, TP. Hồ Chí Minh, Việt Nam', visible: true },
        { id: 'phone', label: 'Điện thoại', value: '(028) 38 995 822', visible: true },
        { id: 'fax', label: 'Fax', value: '', visible: false },
        { id: 'website', label: 'Website', value: 'kns.com.vn', visible: false },
        { id: 'email', label: 'Email', value: 'contact@kns.com.vn', visible: false },
        { id: 'bankAccount', label: 'Số tài khoản', value: '245889119 - Ngân hàng TMCP Á Châu - CN Sài Gòn', visible: true },
      ],
    },
    table: {
      columns: [
        { id: 'code', label: 'Mã hàng', visible: false, hasCode: false },
        { id: 'name', label: 'Tên hàng hóa, dịch vụ', visible: false, hasCode: false },
        { id: 'specs', label: 'Quy cách', visible: false, hasCode: false },
        { id: 'unit', label: 'Đơn vị tính', visible: true, hasCode: false },
        { id: 'quantity', label: 'Số lượng', visible: true, hasCode: true },
        { id: 'price', label: 'Đơn giá', visible: true, hasCode: true },
        { id: 'amount', label: 'Thành tiền', visible: false, hasCode: true },
        { id: 'note', label: 'Ghi chú', visible: false, hasCode: false },
        { id: 'warehouse', label: 'Kho nhập', visible: false, hasCode: false },
      ],
      rowCount: 5,
      sttTitle: 'STT',
      sttContent: '[STT]',
    },
    modelCode: '01GTKT',
    templateCode: '2C25TYY',
    settings: {
      numberFont: 'arial',
      showQrCode: true,
      bilingual: false,
      visibility: {
        showLogo: true,
        showCompanyName: true,
        showCompanyTaxCode: true,
        showCompanyAddress: true,
        showCompanyPhone: true,
        showCompanyBankAccount: true,
        showSignature: true,
      },
      customerVisibility: {
        customerName: true,
        customerTaxCode: true,
        customerAddress: true,
        customerPhone: true,
        customerEmail: true,
        paymentMethod: true,
      },
    },
  }

  const { state, dispatch, canUndo, canRedo } = useTemplateReducer(initialState)

  // ============ UI STATES (giữ lại cho component) ============
  const [loading, setLoading] = useState(false)
  const [previewScale, setPreviewScale] = useState(1.0)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [addDialogType] = useState<'field' | 'column'>('field')
  
  // ============ API INTEGRATION STATES ============
  const [templateFrames, setTemplateFrames] = useState<TemplateFrame[]>([])
  const [framesLoading, setFramesLoading] = useState(false)
  const [frameImageErrors, setFrameImageErrors] = useState<Set<number>>(new Set())
  
  // Invoice Symbol API data
  const [prefixes, setPrefixes] = useState<PrefixApiResponse[]>([])
  const [serialStatuses, setSerialStatuses] = useState<SerialStatusApiResponse[]>([])
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceTypeApiResponse[]>([])
  const [symbolDataLoading, setSymbolDataLoading] = useState(false)
  
  // ============ VALIDATION & FEEDBACK ============
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [showConfirmDelete, setShowConfirmDelete] = useState<{open: boolean; id: string; type: 'field' | 'column'}>({
    open: false, id: '', type: 'field'
  })
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')

  // ============ COMPATIBILITY (tương thích với Preview) ============
  const blankRows = state.table.rowCount
  const config: TemplateConfig = useMemo(() => ({
    templateName: state.templateName,
    companyLogo: state.logo,
    companyName: state.company.name,
    companyTaxCode: state.company.taxCode,
    companyAddress: state.company.address,
    companyPhone: state.company.phone,
    companyBankAccount: state.company.bankAccount,
    modelCode: state.modelCode,
    templateCode: state.templateCode,
  }), [state])

  // ✅ Luôn hiển thị đầy đủ tất cả thông tin (không cần toggle)
  const visibility = useMemo<TemplateVisibility>(() => ({
    showQrCode: state.settings.showQrCode,
    showLogo: !!state.logo, // Chỉ cần check có logo hay không
    showCompanyName: true,
    showCompanyTaxCode: true,
    showCompanyAddress: true,
    showCompanyPhone: true,
    showCompanyBankAccount: true,
    showSignature: true,
  }), [state.settings.showQrCode, state.logo])

  // ============ VALIDATION FUNCTIONS ============
  const validateTemplateName = useCallback((value: string): string | null => {
    if (!value || value.trim().length < 5) {
      return 'Tên mẫu phải có ít nhất 5 ký tự'
    }
    if (value.length > 100) {
      return 'Tên mẫu không được vượt quá 100 ký tự'
    }
    return null
  }, [])

  const validateSymbol = useCallback((): string | null => {
    if (!state.symbol.year || state.symbol.year.length !== 2) {
      return 'Năm phải có đúng 2 chữ số'
    }
    if (!state.symbol.management || state.symbol.management.length !== 2) {
      return 'Mã quản lý mẫu phải có đúng 2 ký tự'
    }
    return null
  }, [state.symbol])

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }, [])

  // ============ FETCH TEMPLATE FRAMES FROM API ============
  const fetchTemplateFrames = useCallback(async () => {
    // Check authentication
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
    if (!token) {
      console.warn('No auth token found, skipping frame fetch')
      return
    }

    setFramesLoading(true)
    try {
      const frames = await templateFrameService.getAllTemplateFrames()
      setTemplateFrames(frames)
    } catch (error) {
      console.error('Failed to load template frames:', error)
      // Fallback to empty array, UI will use local images
      setTemplateFrames([])
    } finally {
      setFramesLoading(false)
    }
  }, [])

  // Fetch invoice symbol data (Prefix, SerialStatus, InvoiceType)
  const fetchSymbolData = useCallback(async () => {
    // Check authentication
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
    if (!token) {
      console.warn('No auth token found, skipping symbol data fetch')
      return
    }

    setSymbolDataLoading(true)
    try {
      const data = await invoiceSymbolService.fetchAllSymbolData()
      setPrefixes(data.prefixes)
      setSerialStatuses(data.serialStatuses)
      setInvoiceTypes(data.invoiceTypes)
    } catch (error) {
      console.error('Failed to load symbol data:', error)
      // Keep empty arrays, UI will show default options
    } finally {
      setSymbolDataLoading(false)
    }
  }, [])

  // Fetch frames on component mount
  useEffect(() => {
    fetchTemplateFrames()
    fetchSymbolData()
  }, [fetchTemplateFrames, fetchSymbolData])

  // Load data khi edit hoặc chọn template từ selection page
  useEffect(() => {
    if (templateId && templateFrames.length > 0) {
      // Find frame from API data
      const selectedFrame = templateFrames.find(frame => frame.id === parseInt(templateId))
      
      if (selectedFrame) {
        // Use imageUrl from API (Cloudinary)
        dispatch({ type: 'SET_BACKGROUND_FRAME', payload: selectedFrame.imageUrl })
      } else {
        // Fallback to local path if frame not found in API
        const fallbackPath = `/khunghoadon/khunghoadon${templateId}.png`
        dispatch({ type: 'SET_BACKGROUND_FRAME', payload: fallbackPath })
      }
    }
  }, [templateId, templateFrames, dispatch])

  // ============ AUTOSAVE - Lưu draft mỗi 30s ============
  useEffect(() => {
    const AUTOSAVE_KEY = 'template-editor-draft'
    
    // Load draft khi mount
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY)
    if (savedDraft && !templateId) {
      try {
        // const draft = JSON.parse(savedDraft)
        // Có thể hỏi user có muốn restore không (future feature)
        // TODO: Implement draft restoration feature
      } catch (e) {
        console.error('Failed to parse draft:', e)
      }
    }

    // Auto save mỗi 30s
    const autoSaveInterval = setInterval(() => {
      setAutoSaveStatus('saving')
      const draft = {
        state,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft))
      
      setTimeout(() => {
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      }, 500)
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [state, templateId])

  // ============ NEW HANDLERS VỚI DISPATCH ============
  
  const handleTemplateNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const error = validateTemplateName(value)
    setErrors(prev => ({ ...prev, templateName: error || '' }))
    dispatch({ type: 'SET_TEMPLATE_NAME', payload: value })
  }, [dispatch, validateTemplateName])

  const handleInvoiceTypeChange = useCallback((type: 'withCode' | 'withoutCode') => {
    dispatch({ type: 'SET_INVOICE_TYPE', payload: type })
    showSuccess('Đã thay đổi loại hóa đơn')
  }, [dispatch, showSuccess])


  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Kích thước logo không được vượt quá 2MB' }))
        return
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Vui lòng chọn file ảnh' }))
        return
      }
      setErrors(prev => ({ ...prev, logo: '' }))
      const fileUrl = URL.createObjectURL(file)
      dispatch({ type: 'SET_LOGO', payload: fileUrl })
      showSuccess('Đã tải logo thành công')
    }
    // ✅ Reset input value để có thể upload lại cùng file
    e.target.value = ''
  }, [dispatch, showSuccess])

  
  const handleAddField = useCallback((label: string, value?: string) => {
    dispatch({ type: 'ADD_COMPANY_FIELD', payload: { label, value: value || '' } })
    setOpenAddDialog(false)
    showSuccess(`Đã thêm trường "${label}"`)
  }, [dispatch, showSuccess])

  const handleAddColumn = useCallback((label: string) => {
    dispatch({ type: 'ADD_TABLE_COLUMN', payload: { label } })
    setOpenAddDialog(false)
    showSuccess(`Đã thêm cột "${label}"`)
  }, [dispatch, showSuccess])
  
  const confirmDelete = useCallback(() => {
    if (showConfirmDelete.type === 'field') {
      dispatch({ type: 'DELETE_COMPANY_FIELD', payload: showConfirmDelete.id })
      showSuccess('Đã xóa trường')
    } else {
      dispatch({ type: 'DELETE_TABLE_COLUMN', payload: showConfirmDelete.id })
      showSuccess('Đã xóa cột')
    }
    setShowConfirmDelete({ open: false, id: '', type: 'field' })
  }, [dispatch, showConfirmDelete, showSuccess])

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    
    if (!destination) return
    if (source.index === destination.index) return
    
    if (draggableId.startsWith('company-field-')) {
      dispatch({
        type: 'REORDER_COMPANY_FIELDS',
        payload: { startIndex: source.index, endIndex: destination.index },
      })
    } else if (draggableId.startsWith('table-column-')) {
      dispatch({
        type: 'REORDER_TABLE_COLUMNS',
        payload: { startIndex: source.index, endIndex: destination.index },
      })
    }
  }, [dispatch])

  const handleBack = () => {
    navigate('/admin/templates/select')
  }

  const handleContinue = async () => {
    // Validate trước khi save
    const nameError = validateTemplateName(state.templateName)
    const symbolError = validateSymbol()
    
    if (nameError || symbolError) {
      setErrors({
        templateName: nameError || '',
        symbol: symbolError || '',
      })
      setErrors(prev => ({ ...prev, _general: 'Vui lòng sửa các lỗi trước khi lưu' }))
      return
    }
    
    setLoading(true)
    setIsSaving(true)
    try {
      console.log('=== STEP 1: Creating Serial ===')
      // Step 1: Create Serial (Mã số hóa đơn)
      const serialData = {
        prefixID: parseInt(state.symbol.invoiceType) || 1,
        serialStatusID: serialStatuses.find(s => s.symbol === state.symbol.taxCode)?.serialStatusID || (state.symbol.taxCode === 'C' ? 1 : 2),
        year: state.symbol.year,
        invoiceTypeID: invoiceTypes.find(t => t.symbol === state.symbol.invoiceForm)?.invoiceTypeID || 1,
        tail: state.symbol.management,
      }
      console.log('Serial Data:', serialData)
      
      const serialResponse = await templateService.createSerial(serialData)
      console.log('Serial Response:', serialResponse)
      
      console.log('=== STEP 2: Processing Logo ===')
      // Step 2: Upload logo if exists (convert blob/base64 to file)
      let logoUrl: string | null = null
      if (state.logo) {
        // If logo is blob URL or base64, upload it
        if (state.logo.startsWith('blob:') || state.logo.startsWith('data:image')) {
          try {
            console.log('Converting blob/base64 logo to file...')
            // Convert blob/base64 to File
            const response = await fetch(state.logo)
            const blob = await response.blob()
            const file = new File([blob], 'logo.png', { type: 'image/png' })
            logoUrl = await templateService.uploadLogo(file)
            console.log('Logo uploaded:', logoUrl)
          } catch (uploadError) {
            console.warn('Logo upload failed, skipping logo:', uploadError)
            // Skip logo instead of using blob/base64 (backend doesn't accept local URLs)
            logoUrl = null
          }
        } else if (state.logo.startsWith('http://') || state.logo.startsWith('https://')) {
          // Already a valid URL from server
          logoUrl = state.logo
          console.log('Using existing logo URL:', logoUrl)
        } else {
          console.warn('Invalid logo URL format:', state.logo)
          logoUrl = null
        }
      } else {
        console.log('No logo provided')
      }
      
      console.log('=== STEP 3: Preparing Layout Definition ===')
      // Step 3: Prepare layout definition (serialize ALL state for complete restore)
      console.log('📊 Current blankRows value:', blankRows)
      console.log('📊 state.table.rowCount:', state.table.rowCount)
      
      // ✅ OPTIMIZED: Map editor state to API request schema
      const editorState: TemplateEditorState = {
        table: {
          columns: state.table.columns.map(col => ({
            id: col.id,
            label: col.label,
            hasCode: col.hasCode ?? false,
            visible: col.visible,
          })),
          rowCount: state.table.rowCount,
          sttTitle: state.table.sttTitle,
          sttContent: state.table.sttContent,
        },
        company: {
          name: state.company.name,
          phone: state.company.phone,
          fields: state.company.fields.map(field => ({
            id: field.id,
            label: field.label,
            value: field.value ?? '',
            visible: field.visible,
          })),
          address: state.company.address,
          taxCode: state.company.taxCode,
          bankAccount: state.company.bankAccount,
        },
        settings: state.settings,
        modelCode: state.modelCode,
        background: state.background,
        invoiceDate: state.invoiceDate,
        templateCode: state.templateCode,
      }
      
      const layoutDefinition = mapEditorStateToApiRequest(editorState)
      console.log('✅ Layout Definition (FULL API Schema):', layoutDefinition)
      console.log('🔍 DEBUG bilingual:', {
        'state.settings.bilingual': state.settings.bilingual,
        'editorState.settings?.bilingual': editorState.settings?.bilingual,
        'layoutDefinition.settings.bilingual': layoutDefinition.settings.bilingual,
      })
      
      console.log('=== STEP 4: Finding Template Frame ID ===')
      // Find templateFrameID - more robust logic
      let templateFrameID: number
      
      // Try to find by matching imageUrl
      const matchedFrame = templateFrames.find(f => 
        f.imageUrl === state.background.frame || 
        f.imageUrl.includes(state.background.frame) ||
        state.background.frame.includes(f.imageUrl)
      )
      
      if (matchedFrame) {
        // Use frameID property (not id)
        templateFrameID = matchedFrame.frameID
        console.log('Found matching frame:', matchedFrame)
        console.log('Using frameID:', templateFrameID)
      } else if (templateId) {
        // Fallback to templateId from URL
        templateFrameID = parseInt(templateId)
        console.log('Using templateId from URL:', templateFrameID)
      } else {
        // Default to first frame or 1
        templateFrameID = templateFrames.length > 0 ? templateFrames[0].frameID : 1
        console.log('Using default frame ID:', templateFrameID)
      }
      
      // Validate templateFrameID
      if (!templateFrameID || isNaN(templateFrameID)) {
        console.error('❌ Invalid templateFrameID:', templateFrameID)
        throw new Error('Không tìm thấy khung viền hợp lệ. Vui lòng chọn lại khung viền.')
      }
      
      console.log('=== STEP 5: Creating Template ===')
      // Step 4: Create Template
      const templateData = {
        templateName: state.templateName,
        serialID: serialResponse.serialID,
        templateTypeID: state.invoiceType === 'withCode' ? 1 : 2,
        layoutDefinition,
        templateFrameID,
        logoUrl,
      }
      console.log('Template Data:', {
        templateName: templateData.templateName,
        serialID: templateData.serialID,
        templateTypeID: templateData.templateTypeID,
        templateFrameID: templateData.templateFrameID,
        logoUrl: templateData.logoUrl,
        layoutDefinition: 'LayoutDefinitionRequest object (see above)',
      })
      
      const templateResponse = await templateService.createTemplate(templateData)
      console.log('Template Response:', templateResponse)
      
      setLastSaved(new Date())
      showSuccess(`Đã tạo mẫu hóa đơn thành công! Mã số: ${serialResponse.fullSerial || 'N/A'}`)
      
      // Redirect to template list after 1.5s
      setTimeout(() => {
        navigate('/admin/templates')
      }, 1500)
    } catch (error: unknown) {
      const err = error as Error
      console.error('❌ Error creating template:', err)
      
      // More detailed error message
      let errorMessage = 'Có lỗi xảy ra khi tạo mẫu hóa đơn.'
      if (err.message) {
        if (err.message.includes('Serial')) {
          errorMessage = 'Lỗi khi tạo mã số hóa đơn: ' + err.message
        } else if (err.message.includes('Template')) {
          errorMessage = 'Lỗi khi tạo mẫu hóa đơn: ' + err.message
        } else {
          errorMessage = err.message
        }
      }
      
      setErrors(prev => ({ 
        ...prev, 
        _general: errorMessage
      }))
    } finally {
      setLoading(false)
      setIsSaving(false)
    }
  }

  // NEW: Enhanced handlers with useCallback
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const data = {
        ...config,
        ...state,
        visibility,
        blankRows,
      }
      console.log('Auto-saving:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [config, state, visibility, blankRows])

  const handlePrintPreview = useCallback(() => {
    if (templateId) {
      navigate(`/admin/templates/preview/${templateId}`)
    } else {
      alert('Vui lòng lưu mẫu trước khi xem trước bản in')
    }
  }, [templateId, navigate])

  const handleZoomIn = () => {
    setPreviewScale((prev) => Math.min(1.0, prev + 0.05)) // Max 100% để fit trong 75% container
  }

  const handleZoomOut = () => {
    setPreviewScale((prev) => Math.max(0.4, prev - 0.05)) // Min 40%
  }

  const handleResetZoom = () => {
    setPreviewScale(1.0) // Reset về 100%
  }

  // Keyboard shortcuts - Enhanced with Undo/Redo
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

      // Ctrl/Cmd + P: Print Preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        handlePrintPreview()
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) dispatch({ type: 'UNDO' })
      }

      // Ctrl/Cmd + Y hoặc Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo) dispatch({ type: 'REDO' })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleSave, handlePrintPreview, canUndo, canRedo, dispatch])

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        {/* Header */}
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={handleBack} sx={{ color: '#555' }}>
              <ArrowBackIcon />
            </IconButton>
           <Box>
                         <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                           Thiết lập mẫu hóa đơn
                         </Typography>
                         <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mt: 0.25 }}>
                           Hãy chọn một mẫu hoá đơn phù hợp với đơn vị để tiếp tục
                         </Typography>
                       </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Auto-save indicator */}
            {lastSaved && (
              <Chip
                icon={isSaving ? <CircularProgress size={12} /> : <SaveIcon sx={{ fontSize: 14 }} />}
                label={isSaving ? 'Đang lưu...' : `Đã lưu ${lastSaved.toLocaleTimeString('vi-VN')}`}
                size="small"
                color={isSaving ? 'default' : 'success'}
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            )}

            <Tooltip title="Trợ giúp" arrow>
              <IconButton sx={{ color: '#757575' }}>
                <HelpOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Print Preview Button - NEW */}
            <Tooltip title="Xem trước bản in (Ctrl+P)" arrow>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintPreview}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 0.75,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}>
                Xem Trước Bản In
              </Button>
            </Tooltip>

            {/* Undo/Redo Buttons - NEW */}
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Tooltip title="Hoàn tác (Ctrl+Z)" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={() => dispatch({ type: 'UNDO' })}
                  disabled={!canUndo}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                  }}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Làm lại (Ctrl+Y)" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={() => dispatch({ type: 'REDO' })}
                  disabled={!canRedo}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                  }}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* Autosave Status */}
            {autoSaveStatus === 'saved' && (
              <Chip 
                label="✓ Đã tự động lưu" 
                size="small" 
                sx={{ 
                  bgcolor: '#e8f5e9', 
                  color: '#2e7d32',
                  fontSize: '0.75rem',
                  height: 24,
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
            {autoSaveStatus === 'saving' && (
              <Chip 
                label="Đang lưu..." 
                size="small" 
                icon={<CircularProgress size={12} sx={{ color: '#1976d2' }} />}
                sx={{ 
                  bgcolor: '#e3f2fd', 
                  color: '#1976d2',
                  fontSize: '0.75rem',
                  height: 24,
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}

            <Button
              variant="contained"
              startIcon={<PlayCircleIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#1976d2',
                fontSize: '0.875rem',
                px: 2.5,
                py: 0.75,
                boxShadow: 'none',
                '&:hover': { 
                  bgcolor: '#1565c0',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                },
              }}>
              Xem phim hướng dẫn
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 3, py: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
          {/* Left - Form 30% - Sticky Sidebar */}
          <Box sx={{ 
            width: { xs: '100%', lg: '25%' },
            position: { lg: 'sticky' },
            top: { lg: 16 },
            alignSelf: { lg: 'flex-start' },
          }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}>
              <Stack spacing={2.5}>
                
               

                {/* Hình thức */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Hình thức hoá đơn <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  <RadioGroup 
                    value={state.invoiceType} 
                    onChange={(e) => handleInvoiceTypeChange(e.target.value as 'withCode' | 'withoutCode')}
                  >
                    <FormControlLabel
                      value="withCode"
                      control={<Radio size="small" />}
                      label={<Typography sx={{ fontSize: '0.875rem' }}>HĐ có mã của CQT</Typography>}
                    />
                    <FormControlLabel
                      value="withoutCode"
                      control={<Radio size="small" />}
                      label={<Typography sx={{ fontSize: '0.875rem' }}>HĐ không có mã của CQT</Typography>}
                    />
                  </RadioGroup>
                </Box>

                {/* Ký hiệu - Theo quy định Việt Nam */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Ký hiệu hóa đơn <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  
                  {/* Grid layout cho 5 phần */}
                  <Stack spacing={1.5}>
                    {/* Phần 1: Loại hóa đơn (1 chữ số) */}
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#616161', mb: 0.5 }}>
                        1️⃣ Loại hóa đơn (1 chữ số)
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={state.symbol.invoiceType}
                          onChange={(e) => dispatch({ type: 'SET_SYMBOL_INVOICE_TYPE', payload: e.target.value as '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' })}
                          disabled={symbolDataLoading}
                          sx={{
                            fontSize: '0.875rem',
                            bgcolor: '#fafafa',
                            '&:hover': { bgcolor: '#f5f5f5' },
                            '& .MuiSelect-select': { fontWeight: 600, letterSpacing: '0.5px' },
                          }}
                        >
                          {prefixes.length > 0 ? (
                            prefixes.map((prefix) => (
                              <MenuItem key={prefix.prefixID} value={String(prefix.prefixID)}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {prefix.prefixID} - {prefix.prefixName}
                                </Typography>
                              </MenuItem>
                            ))
                          ) : [
                              <MenuItem key="1" value="1">
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {symbolDataLoading && <CircularProgress size={14} sx={{ mr: 0.5, verticalAlign: 'middle' }} />}
                                  1 - Hóa đơn điện tử giá trị gia tăng
                                </Typography>
                              </MenuItem>,
                              <MenuItem key="2" value="2"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>2 - Hóa đơn điện tử bán hàng</Typography></MenuItem>,
                              <MenuItem key="3" value="3"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>3 - Hóa đơn điện tử bán tài sản công</Typography></MenuItem>,
                              <MenuItem key="4" value="4"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>4 - Hóa đơn điện tử bán hàng dự trữ quốc gia</Typography></MenuItem>,
                              <MenuItem key="5" value="5"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>5 - Tem điện tử, vé điện tử, thẻ điện tử, phiếu thu điện tử</Typography></MenuItem>,
                              <MenuItem key="6" value="6"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>6 - Phiếu xuất kho kiêm vận chuyển nội bộ/gửi bán đại lý</Typography></MenuItem>,
                              <MenuItem key="7" value="7"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>7 - Hóa đơn thương mại điện tử</Typography></MenuItem>,
                              <MenuItem key="8" value="8"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>8 - Hóa đơn GTGT tích hợp biên lai thu thuế, phí, lệ phí</Typography></MenuItem>,
                              <MenuItem key="9" value="9"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>9 - Hóa đơn bán hàng tích hợp biên lai thu thuế, phí, lệ phí</Typography></MenuItem>
                            ]}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Phần 2: Ký tự mã CQT (C/K) */}
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#616161', mb: 0.5 }}>
                        2️⃣ Mã cơ quan thuế (1 chữ cái)
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={state.symbol.taxCode}
                          onChange={(e) => dispatch({ type: 'SET_SYMBOL_TAX_CODE', payload: e.target.value as 'C' | 'K' })}
                          disabled={symbolDataLoading}
                          sx={{
                            fontSize: '0.875rem',
                            bgcolor: '#fafafa',
                            '&:hover': { bgcolor: '#f5f5f5' },
                            '& .MuiSelect-select': { fontWeight: 600, letterSpacing: '0.5px' },
                          }}
                        >
                          {serialStatuses.length > 0 ? (
                            serialStatuses.map((status) => (
                              <MenuItem key={status.serialStatusID} value={status.symbol} sx={{ fontSize: '0.875rem' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {status.symbol} - {status.statusName}
                                </Typography>
                              </MenuItem>
                            ))
                          ) : [
                              <MenuItem key="C" value="C" sx={{ fontSize: '0.875rem' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {symbolDataLoading && <CircularProgress size={14} sx={{ mr: 0.5, verticalAlign: 'middle' }} />}
                                  C - Hóa đơn có mã của cơ quan thuế
                                </Typography>
                              </MenuItem>,
                              <MenuItem key="K" value="K" sx={{ fontSize: '0.875rem' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  K - Hóa đơn không có mã của cơ quan thuế
                                </Typography>
                              </MenuItem>
                            ]}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Phần 3: Năm (2 chữ số) */}
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#616161', mb: 0.5 }}>
                        3️⃣ Năm lập hóa đơn (2 chữ số)
                      </Typography>
                    <TextField
                        fullWidth
                      size="small"
                      value={state.symbol.year}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                          dispatch({ type: 'SET_SYMBOL_YEAR', payload: value })
                        }}
                        placeholder="25"
                      inputProps={{
                        maxLength: 2,
                          style: { fontWeight: 600, letterSpacing: '0.5px' }
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.875rem',
                            bgcolor: '#fafafa',
                            '&:hover': { bgcolor: '#f5f5f5' },
                          },
                        }}
                        helperText="Ví dụ: 2025 → 25"
                      />
                    </Box>

                    {/* Phần 4: Loại hóa đơn điện tử (1 chữ cái) */}
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#616161', mb: 0.5 }}>
                        4️⃣ Loại hóa đơn điện tử (1 chữ cái)
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={state.symbol.invoiceForm}
                          onChange={(e) => dispatch({ type: 'SET_SYMBOL_INVOICE_FORM', payload: e.target.value as 'T' | 'D' | 'L' | 'M' | 'N' | 'B' | 'G' | 'H' | 'X' })}
                          disabled={symbolDataLoading}
                          sx={{
                        fontSize: '0.875rem', 
                            bgcolor: '#fafafa',
                            '&:hover': { bgcolor: '#f5f5f5' },
                            '& .MuiSelect-select': { fontWeight: 600 },
                          }}
                        >
                          {invoiceTypes.length > 0 ? (
                            invoiceTypes.map((type) => (
                              <MenuItem key={type.invoiceTypeID} value={type.symbol}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {type.symbol} - {type.typeName}
                                </Typography>
                              </MenuItem>
                            ))
                          ) : [
                              <MenuItem key="T" value="T">
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {symbolDataLoading && <CircularProgress size={14} sx={{ mr: 0.5, verticalAlign: 'middle' }} />}
                                  T - HĐ DN, tổ chức, hộ, cá nhân kinh doanh đăng ký sử dụng
                                </Typography>
                              </MenuItem>,
                              <MenuItem key="D" value="D"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>D - HĐ tài sản công và HĐ bán hàng dự trữ quốc gia</Typography></MenuItem>,
                              <MenuItem key="L" value="L"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>L - HĐ Cơ quan thuế cấp theo từng lần phát sinh</Typography></MenuItem>,
                              <MenuItem key="M" value="M"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>M - HĐ khởi tạo từ máy tính tiền</Typography></MenuItem>,
                              <MenuItem key="N" value="N"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>N - Phiếu xuất kho kiêm vận chuyển nội bộ</Typography></MenuItem>,
                              <MenuItem key="B" value="B"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>B - Phiếu xuất kho gửi bán đại lý điện</Typography></MenuItem>,
                              <MenuItem key="G" value="G"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>G - Tem, vé, thẻ điện tử là hóa đơn GTGT</Typography></MenuItem>,
                              <MenuItem key="H" value="H"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>H - Tem, vé, thẻ điện tử là hóa đơn bán hàng</Typography></MenuItem>,
                              <MenuItem key="X" value="X"><Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>X - Hóa đơn thương mại điện tử</Typography></MenuItem>
                            ]}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Phần 5: Quản lý mẫu (2 ký tự) */}
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#616161', mb: 0.5 }}>
                        5️⃣ Quản lý mẫu (2 ký tự)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={state.symbol.management}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2)
                          dispatch({ type: 'SET_SYMBOL_MANAGEMENT', payload: value })
                        }}
                        placeholder="AA"
                        inputProps={{
                          maxLength: 2,
                          style: { fontWeight: 600, letterSpacing: '0.5px' }
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            bgcolor: '#fafafa',
                            '&:hover': { bgcolor: '#f5f5f5' },
                          },
                        }}
                        helperText="Do người bán tự xác định. Mặc định: AA"
                      />
                    </Box>
                  </Stack>
                  
                  {/* Preview ký hiệu hoàn chỉnh */}
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#f0f7ff', 
                    borderRadius: 1.5,
                    border: '2px solid #1976d2',
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1565c0' }}>
                        📋 Ký hiệu hoàn chỉnh:
                    </Typography>
                      <Typography sx={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 700, 
                        color: '#1976d2', 
                        letterSpacing: '1px',
                        fontFamily: 'monospace',
                      }}>
                        {state.symbol.invoiceType}{state.symbol.taxCode}{state.symbol.year || '__'}{state.symbol.invoiceForm}{state.symbol.management || 'AA'}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.7rem', color: '#1565c0', mt: 1 }}>
                      💡 Ví dụ: 1C25TAA = Loại 1 (GTGT), có mã CQT, năm 2025, doanh nghiệp, quản lý AA
                    </Typography>
                  </Box>
                </Box>

                {/* Logo */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Logo
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      py: 1.25,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      borderColor: errors.logo ? '#d32f2f' : '#d0d0d0',
                      color: errors.logo ? '#d32f2f' : '#616161',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        borderColor: errors.logo ? '#d32f2f' : '#1976d2', 
                        bgcolor: errors.logo ? '#ffebee' : '#e3f2fd',
                        color: errors.logo ? '#d32f2f' : '#1976d2',
                        transform: 'translateY(-2px)',
                      },
                    }}>
                    {config.companyLogo ? '✓ Đã tải lên logo' : 'Tải lên logo công ty'}
                    <input 
                      ref={logoInputRef}
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                    />
                  </Button>
                  
                  {/* Error message cho Logo */}
                  {errors.logo && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#d32f2f', mt: 0.5 }}>
                      {errors.logo}
                    </Typography>
                  )}
                  
                  {config.companyLogo && (
                    <Box 
                      sx={{ 
                        mt: 1.5, 
                        p: 1.5,
                        bgcolor: '#f9f9f9',
                        borderRadius: 1.5,
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1976d2',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                        },
                      }}>
                      {/* Quick delete button */}
                      <Tooltip title="Xóa logo" arrow>
                        <IconButton
                          size="small"
                          onClick={() => {
                            dispatch({ type: 'SET_LOGO', payload: null })
                            // ✅ Reset input file để có thể upload lại
                            if (logoInputRef.current) {
                              logoInputRef.current.value = ''
                            }
                            showSuccess('Đã xóa logo')
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'white',
                            boxShadow: 1,
                            '&:hover': { bgcolor: '#ffebee', color: '#d32f2f' },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <img 
                        src={config.companyLogo} 
                        alt="Logo preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 100, 
                          objectFit: 'contain',
                          borderRadius: 4,
                        }} 
                      />
                      <Typography sx={{ fontSize: '0.75rem', color: '#9e9e9e', mt: 1 }}>
                        Logo công ty
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Empty state cho logo */}
                  {!config.companyLogo && !errors.logo && (
                    <Box sx={{ 
                      mt: 1, 
                      p: 2, 
                      bgcolor: '#f5f9ff', 
                      borderRadius: 1,
                      border: '1px dashed #bbdefb',
                    }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#1976d2', textAlign: 'center' }}>
                        💡 Tải lên logo công ty để hiển thị trên hóa đơn
                      </Typography>
                    </Box>
                  )}
                </Box>

              

                {/* Khung viền mẫu - với Preview Grid từ API */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Khung viền mẫu
                  </Typography>
                  
                  {/* Loading state for frames */}
                  {framesLoading && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      p: 3,
                      bgcolor: '#f9f9f9',
                      borderRadius: 1.5,
                      border: '1px solid #e0e0e0',
                    }}>
                      <CircularProgress size={24} />
                      <Typography sx={{ ml: 1.5, fontSize: '0.75rem', color: '#757575' }}>
                        Đang tải khung viền...
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Grid preview khung viền từ API */}
                  {!framesLoading && (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: 1,
                    p: 1.5,
                    bgcolor: '#f9f9f9',
                    borderRadius: 1.5,
                    border: '1px solid #e0e0e0',
                  }}>
                      {(templateFrames.length > 0 ? templateFrames : 
                        // Fallback to local frames if API fails
                        Array.from({ length: 11 }, (_, i) => ({
                          id: i + 1,
                          name: `Khung ${i + 1}`,
                          imageUrl: `/khunghoadon/khunghoadon${i + 1}.png`,
                          imagePath: `/khunghoadon/khunghoadon${i + 1}.png`,
                          category: 'Universal' as const,
                          description: `Mẫu ${i + 1}`,
                        }))
                      ).map((frame) => {
                        const isSelected = state.background.frame === frame.imageUrl || 
                                         state.background.frame === frame.imagePath
                      
                      return (
                          <Tooltip key={frame.id} title={frame.name} arrow>
                          <Box
                            onClick={() => {
                                dispatch({ type: 'SET_BACKGROUND_FRAME', payload: frame.imageUrl })
                                showSuccess(`Đã chọn ${frame.name}`)
                            }}
                            sx={{
                              position: 'relative',
                              aspectRatio: '1',
                              border: isSelected ? '3px solid #1976d2' : '2px solid #e0e0e0',
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: 2,
                                borderColor: '#1976d2',
                              },
                            }}
                          >
                            <img 
                                src={frameImageErrors.has(frame.id) 
                                  ? `/khunghoadon/khunghoadon${frame.id}.png` 
                                  : frame.imageUrl
                                }
                                alt={frame.name}
                                onError={() => {
                                  console.warn(`Failed to load frame image: ${frame.imageUrl}`)
                                  setFrameImageErrors(prev => new Set(prev).add(frame.id))
                                }}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                            />
                            {isSelected && (
                              <Box sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: '#1976d2',
                                color: 'white',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                              }}>
                                ✓
                              </Box>
                            )}
                            <Typography sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              fontSize: '0.65rem',
                              textAlign: 'center',
                              py: 0.3,
                            }}>
                                {frame.id}
                            </Typography>
                              {'recommended' in frame && frame.recommended && (
                                <Box sx={{
                                  position: 'absolute',
                                  top: 4,
                                  left: 4,
                                  bgcolor: '#4caf50',
                                  color: 'white',
                                  borderRadius: 0.5,
                                  px: 0.5,
                                  py: 0.25,
                                  fontSize: '0.6rem',
                                  fontWeight: 600,
                                }}>
                                  Đề xuất
                                </Box>
                              )}
                          </Box>
                        </Tooltip>
                      )
                    })}
                  </Box>
                  )}
                  
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    color: '#9e9e9e', 
                    mt: 1,
                    textAlign: 'center',
                  }}>
                    {templateFrames.length > 0 
                      ? `Click để chọn khung viền • ${templateFrames.length} khung có sẵn`
                      : 'Click để chọn khung viền • Đang sử dụng khung mặc định'
                    }
                  </Typography>
                </Box>

               
                {/* 3 Accordion Sections */}
                <Box sx={{ mt: 2 }}>
                  {/* Section 1: Điều chỉnh nhanh các thông tin */}
                  <Accordion  
                    disableGutters
                    elevation={0}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px !important',
                      mb: 1.5,
                      '&:before': { display: 'none' },
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#1976d2',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                      },
                    }}>
                    <AccordionSummary
                      expandIcon={<ChevronRightIcon sx={{ color: '#757575', fontSize: 20 }} />}
                      sx={{
                        minHeight: 56,
                        px: 2,
                        '& .MuiAccordionSummary-expandIconWrapper': {
                          transition: 'transform 0.3s ease',
                        },
                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                          transform: 'rotate(90deg)',
                        },
                        '&:hover': {
                          bgcolor: '#f9fafb',
                        },
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography sx={{ 
                          fontSize: '0.9375rem', 
                          fontWeight: 600, 
                          color: '#2c3e50',
                          letterSpacing: '-0.01em',
                          flex: 1,
                        }}>
                          Thông tin cơ bản
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Stack spacing={2.5}>
                        {/* Tên mẫu */}
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.8125rem', 
                            fontWeight: 600, 
                            color: '#37474f',
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}>
                            📝 Tên mẫu hóa đơn
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={state.templateName}
                            onChange={handleTemplateNameChange}
                            error={!!errors.templateName}
                            helperText={errors.templateName}
                            placeholder="Ví dụ: Hóa đơn bán hàng (mẫu CB)"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8125rem',
                                bgcolor: '#fafafa',
                                '&:hover': { bgcolor: '#f5f5f5' },
                                '&.Mui-focused': { bgcolor: '#fff' },
                              },
                            }}
                          />
                        </Box>

                        {/* Ngày lập hóa đơn */}
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.8125rem', 
                            fontWeight: 600, 
                            color: '#37474f',
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}>
                            📅 Ngày lập hóa đơn (Invoice Date)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={new Date(state.invoiceDate).toISOString().split('T')[0]}
                            onChange={(e) => dispatch({ type: 'SET_INVOICE_DATE', payload: new Date(e.target.value).toISOString() })}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8125rem',
                                bgcolor: '#fafafa',
                                '&:hover': { bgcolor: '#f5f5f5' },
                                '&.Mui-focused': { bgcolor: '#fff' },
                              },
                            }}
                            helperText="Tự động lấy ngày hiện tại, có thể chỉnh sửa"
                          />
                          <Box sx={{ 
                            mt: 0.5, 
                            p: 1, 
                            bgcolor: '#e3f2fd', 
                            borderRadius: 1,
                            border: '1px solid #bbdefb',
                          }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: 500 }}>
                              📌 Hiển thị: {new Date(state.invoiceDate).toLocaleDateString('vi-VN', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#1976d2', mt: 0.25 }}>
                              English: {new Date(state.invoiceDate).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Typography>
                          </Box>
                        </Box>

                        {/* QR Code */}
                        <Paper
                          elevation={0}
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            bgcolor: '#fafafa',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#1976d2',
                              bgcolor: '#f9fafb',
                            },
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={state.settings.showQrCode}
                                onChange={() => dispatch({ type: 'TOGGLE_QR_CODE' })}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                  QR Code
                                </Typography>
                                <Tooltip title="Mã QR tra cứu hóa đơn trên cổng Tổng cục thuế">
                                  <InfoIcon sx={{ fontSize: 14, color: '#9e9e9e' }} />
                                </Tooltip>
                              </Box>
                            }
                            sx={{ width: '100%', m: 0, p: 1.5 }}
                          />
                        </Paper>

                        {/* Song ngữ */}
                        <Paper
                          elevation={0}
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            bgcolor: '#fafafa',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#1976d2',
                              bgcolor: '#f9fafb',
                            },
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={state.settings.bilingual}
                                onChange={() => dispatch({ type: 'TOGGLE_BILINGUAL' })}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                  🌐 Hóa đơn song ngữ (Vietnamese - English)
                                </Typography>
                                <Tooltip title="Hiển thị nội dung hóa đơn bằng tiếng Việt và tiếng Anh theo chuẩn quốc tế">
                                  <InfoIcon sx={{ fontSize: 14, color: '#9e9e9e' }} />
                                </Tooltip>
                              </Box>
                            }
                            sx={{ width: '100%', m: 0, p: 1.5 }}
                          />
                        </Paper>

                        {/* Tùy chọn hiển thị */}

                       
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  
                </Box>
              </Stack>

              {/* Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleBack}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    py: 1.2,
                    borderColor: '#d0d0d0',
                    color: '#616161',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      borderColor: '#999', 
                      bgcolor: '#f5f5f5',
                      transform: 'translateY(-1px)',
                    },
                  }}>
                  Quay lại
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleContinue}
                  disabled={loading || isSaving}
                  startIcon={(loading || isSaving) ? <CircularProgress size={16} color="inherit" /> : undefined}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    py: 1.2,
                    bgcolor: '#1976d2',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      bgcolor: '#1565c0',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      bgcolor: '#e0e0e0',
                    },
                  }}
                >
                  {isSaving ? 'Đang lưu...' : loading ? 'Đang xử lý...' : 'Tiếp tục'}
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Right - Preview 70% */}
          <Box sx={{ width: { xs: '100%', lg: '75%' } }}>
            {/* Zoom Controls */}
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                📄 Xem trước mẫu hóa đơn (trang A4)
              </Typography>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Thu nhỏ (Ctrl + -)">
                  <IconButton 
                    size="small" 
                    onClick={handleZoomOut}
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #e0e0e0',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Chip 
                  label={`${Math.round(previewScale * 100)}%`} 
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    minWidth: 60,
                  }}
                />
                
                <Tooltip title="Phóng to (Ctrl + +)">
                  <IconButton 
                    size="small" 
                    onClick={handleZoomIn}
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #e0e0e0',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Vừa màn hình">
                  <IconButton 
                    size="small" 
                    onClick={handleResetZoom}
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #e0e0e0',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Preview Container - Optimized for 75% width */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3,
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                bgcolor: '#fafafa',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'visible', // Visible để hiển thị đầy đủ viền
                minHeight: 'calc(100vh - 220px)', // Fit viewport
                position: 'relative',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  bgcolor: '#f7f7f7',
                },
              }}>
              
              {/* Page 1 Indicator */}
              <Box
                sx={{
                  width: '100%',
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Divider sx={{ flex: 1, borderColor: '#bdbdbd' }} />
                <Chip 
                  label="📄 Trang 1" 
                  size="small" 
                  sx={{ 
                    bgcolor: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }} 
                />
                <Divider sx={{ flex: 1, borderColor: '#bdbdbd' }} />
              </Box>

              {/* Invoice Preview with Scale Transform - Centered & Contained */}
              <Box
                sx={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  borderRadius: 1.5,
                  overflow: 'visible', // Visible để không cắt viền invoice
                  bgcolor: 'transparent', // Transparent để thấy viền
                  mb: 2,
                  maxWidth: '100%', // Không vượt quá container
                  display: 'flex',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.18)',
                  },
                }}
              >
                <InvoiceTemplatePreview
                  config={config}
                  visibility={visibility}
                  blankRows={blankRows}
                  backgroundFrame={state.background.custom || state.background.frame}
                  bilingual={state.settings.bilingual}
                  invoiceDate={state.invoiceDate}
                  logoSize={state.logoSize}
                  invoiceType={state.invoiceType}
                  symbol={state.symbol}
                  customerVisibility={{
                    customerName: true,
                    customerTaxCode: true,
                    customerAddress: true,
                    customerPhone: true,
                    customerEmail: true,
                    paymentMethod: true,
                  }}
                />
              </Box>

              {/* Pagination Info - Enhanced */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems="center"
                sx={{
                  bgcolor: 'white',
                  px: 2.5,
                  py: 1.25,
                  borderRadius: 1.5,
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#424242' }}>
                    📏 Kích thước:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    A4 (210 × 297mm)
                  </Typography>
                </Stack>
                
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#424242' }}>
                    🔍 Zoom:
                  </Typography>
                  <Chip 
                    label={`${Math.round(previewScale * 100)}%`}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: previewScale >= 1.0 ? '#e8f5e9' : previewScale <= 0.5 ? '#fff3e0' : '#e3f2fd',
                      color: previewScale >= 1.0 ? '#2e7d32' : previewScale <= 0.5 ? '#e65100' : '#1565c0',
                    }}
                  />
                </Stack>
                
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#424242' }}>
                    📄 Trang:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1/1
                  </Typography>
                </Stack>
              </Stack>

            </Paper>
          </Box>
        </Stack>
      </Box>

      {/* AddFieldDialog - NEW */}
      <AddFieldDialog
        open={openAddDialog}
        type={addDialogType}
        onClose={() => setOpenAddDialog(false)}
        onSubmit={addDialogType === 'field' ? handleAddField : handleAddColumn}
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDelete.open}
        onClose={() => setShowConfirmDelete({ open: false, id: '', type: 'field' })}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Xác nhận xóa
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa {showConfirmDelete.type === 'field' ? 'trường' : 'cột'} này không?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowConfirmDelete({ open: false, id: '', type: 'field' })}
            sx={{ textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage('')}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errors._general}
        autoHideDuration={5000}
        onClose={() => setErrors(prev => ({ ...prev, _general: '' }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setErrors(prev => ({ ...prev, _general: '' }))}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errors._general}
        </Alert>
      </Snackbar>
      </Box>
    </DragDropContext>
  )
}

export default TemplateEditor
