import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import InfoIcon from '@mui/icons-material/Info'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PrintIcon from '@mui/icons-material/Print'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'
import InvoiceSymbolGuideModal from '@/components/InvoiceSymbolGuideModal'
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
import companyService, { Company } from '@/services/companyService'
import API_CONFIG from '@/config/api.config'
import { mapEditorStateToApiRequest } from '@/utils/templateApiMapper'
import type { TemplateEditorState } from '@/utils/templateApiMapper'
import { exportTemplateToHTML } from '@/utils/templateHtmlExporter'

// Interface cũ - tương thích với InvoiceTemplatePreview
interface TemplateConfig {
  templateName: string
  companyLogo: string | null
  companyName: string
  companyTaxCode: string
  companyAddress: string
  companyPhone: string
  companyBankAccount: string
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
  const isEditMode = !!templateId
  
  // Set title based on mode
  usePageTitle(isEditMode ? 'Chỉnh sửa mẫu' : 'Tạo mẫu mới')

  // ============ COMPANY LOGO STATE ============
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  // ============ KHỞI TẠO STATE MỚI VỚI REDUCER ============
  const initialState: TemplateState = {
    templateName: 'Hóa đơn bán hàng (mẫu CB)',
    invoiceType: 'withCode',
    symbol: { 
      invoiceType: '1', // 1: HĐ điện tử GTGT
      taxCode: 'C', // C: Có mã CQT
      year: new Date().getFullYear().toString().slice(-2), // 2 số cuối năm hiện tại
      invoiceForm: 'T', // T: Hóa đơn doanh nghiệp
      management: 'AA' // Mặc định AA
    },
    logo: null,
    background: { frame: '/khunghoadon.png' },
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
      rowCount: 3,
      sttTitle: 'STT',
      sttContent: '[STT]',
    },
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

  const { state, dispatch } = useTemplateReducer(initialState)

  // ============ UI STATES (giữ lại cho component) ============
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [addDialogType] = useState<'field' | 'column'>('field')
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const previewRef = React.useRef<HTMLDivElement>(null)
  
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

  // ============ COMPATIBILITY (tương thích với Preview) ============
  const blankRows = state.table.rowCount
  const config: TemplateConfig = useMemo(() => {
    console.log('🔄 [useMemo Config] Creating config from state.company:', state.company)
    
    const configObject = {
      templateName: state.templateName,
      companyLogo: companyLogo || state.logo, // 🆕 Use API logo if available, fallback to state.logo
      companyName: state.company.name,
      companyTaxCode: state.company.taxCode,
      companyAddress: state.company.address,
      companyPhone: state.company.phone,
      companyBankAccount: state.company.bankAccount,
    }
    
    console.log('📤 [useMemo Config] Passing to preview:', configObject)
    
    return configObject
  }, [state, companyLogo])

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

    // Auto save mỗi 30s - chạy ngầm không hiển thị UI
    const autoSaveInterval = setInterval(() => {
      const draft = {
        state,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft))
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [state, templateId])

  // ============ NEW HANDLERS VỚI DISPATCH ============
  

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

  // ============ FETCH COMPANY DATA FROM API ============
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const companyData: Company = await companyService.getDefaultCompany()
        
        console.log('🏢 [API Response] Company Data:', companyData)
        console.log('📋 Fields:', {
          companyName: companyData.companyName,
          taxCode: companyData.taxCode,
          address: companyData.address,
          contactPhone: companyData.contactPhone,
          accountNumber: companyData.accountNumber,
          bankName: companyData.bankName,
          logoUrl: companyData.logoUrl,
        })
        
        // Map API data to state format
        const bankAccount = `${companyData.accountNumber} - ${companyData.bankName}`
        
        // 🆕 Set company logo from API
        if (companyData.logoUrl) {
          setCompanyLogo(companyData.logoUrl)
          console.log('🖼️ Company logo loaded from API:', companyData.logoUrl)
        }
        
        console.log('💾 [Dispatching] Company updates:', {
          name: companyData.companyName,
          taxCode: companyData.taxCode,
          address: companyData.address,
          phone: companyData.contactPhone,
          bankAccount: bankAccount,
          logoUrl: companyData.logoUrl,
        })
        
        // Update company info in state
        dispatch({ type: 'SET_COMPANY_NAME', payload: companyData.companyName })
        dispatch({ type: 'SET_COMPANY_FIELD', payload: { id: 'name', value: companyData.companyName } })
        dispatch({ type: 'SET_COMPANY_FIELD', payload: { id: 'taxCode', value: companyData.taxCode } })
        dispatch({ type: 'SET_COMPANY_FIELD', payload: { id: 'address', value: companyData.address } })
        dispatch({ type: 'SET_COMPANY_FIELD', payload: { id: 'phone', value: companyData.contactPhone } })
        dispatch({ type: 'SET_COMPANY_FIELD', payload: { id: 'bankAccount', value: bankAccount } })
        
        console.log('✅ Company data loaded and dispatched successfully')
      } catch (error) {
        console.error('❌ Error loading company data:', error)
        // Keep default hardcoded values if API fails
      }
    }

    fetchCompanyData()
  }, [dispatch])

  const handleBack = () => {
    navigate('/admin/templates')
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
      console.log('=== STEP 1: Creating/Finding Serial ===')
      // Step 1: Get or Create Serial (Mã số hóa đơn)
      // ✅ Smart function: Tìm serial đã tồn tại, nếu chưa có thì tạo mới
      const serialData = {
        prefixID: parseInt(state.symbol.invoiceType) || 1,
        serialStatusID: serialStatuses.find(s => s.symbol === state.symbol.taxCode)?.serialStatusID || (state.symbol.taxCode === 'C' ? 1 : 2),
        year: state.symbol.year,
        invoiceTypeID: invoiceTypes.find(t => t.symbol === state.symbol.invoiceForm)?.invoiceTypeID || 1,
        tail: state.symbol.management,
      }
      console.log('Serial Data:', serialData)
      
      const serialResponse = await templateService.getOrCreateSerial(serialData)
      console.log('Serial Response:', serialResponse)
      
      console.log('=== STEP 2: Processing Logo ===')
      // Step 2: Determine logoUrl - Priority: uploaded logo > company API logo
      let logoUrl: string | null = null
      
      if (state.logo) {
        // User uploaded a new logo - process it
        if (state.logo.startsWith('blob:') || state.logo.startsWith('data:image')) {
          try {
            console.log('Converting blob/base64 logo to file...')
            // Convert blob/base64 to File
            const response = await fetch(state.logo)
            const blob = await response.blob()
            const file = new File([blob], 'logo.png', { type: 'image/png' })
            logoUrl = await templateService.uploadLogo(file)
            console.log('✅ New logo uploaded:', logoUrl)
          } catch (uploadError) {
            console.warn('⚠️ Logo upload failed, falling back to company logo:', uploadError)
            // Fallback to company logo from API
            logoUrl = companyLogo
          }
        } else if (state.logo.startsWith('http://') || state.logo.startsWith('https://')) {
          // Already a valid URL from server
          logoUrl = state.logo
          console.log('✅ Using existing logo URL:', logoUrl)
        } else {
          console.warn('⚠️ Invalid logo URL format, using company logo from API')
          logoUrl = companyLogo
        }
      } else {
        // No uploaded logo - use company logo from API
        logoUrl = companyLogo
        console.log('✅ Using company logo from API:', logoUrl)
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
        background: state.background,
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
      
      // Step 4a: Export template HTML
      let renderedHtml: string | undefined;
      try {
        if (previewRef.current) {
          console.log('📝 Exporting template HTML...');
          renderedHtml = await exportTemplateToHTML(previewRef.current);
          console.log('✅ Template HTML exported successfully, length:', renderedHtml.length);
        } else {
          console.warn('⚠️ Preview ref not available, skipping HTML export');
        }
      } catch (htmlError) {
        console.error('❌ Error exporting template HTML:', htmlError);
        // Continue without HTML - non-blocking
      }
      
      // Step 4b: Create Template with HTML
      const templateData = {
        templateName: state.templateName,
        serialID: serialResponse.serialID,
        templateTypeID: state.invoiceType === 'withCode' ? 1 : 2,
        layoutDefinition,
        templateFrameID,
        logoUrl,
        renderedHtml, // ✅ NEW: Template HTML
      }
      console.log('Template Data:', {
        templateName: templateData.templateName,
        serialID: templateData.serialID,
        templateTypeID: templateData.templateTypeID,
        templateFrameID: templateData.templateFrameID,
        logoUrl: templateData.logoUrl,
        renderedHtmlLength: renderedHtml?.length || 0,
        layoutDefinition: 'LayoutDefinitionRequest object (see above)',
      })
      
      const templateResponse = await templateService.createTemplate(templateData)
      console.log('Template Response:', templateResponse)
      showSuccess(`Đã tạo mẫu hóa đơn thành công! Mã số: ${serialResponse.serial || 'N/A'}`)
      
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
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [config, state, visibility, blankRows])

  const handlePrintPreview = useCallback(async () => {
    if (!templateId) {
      // Nếu chưa có templateId (template mới), phải save trước
      try {
        await handleSave()
        // After save, handleSave will set templateId via navigate
        // User will need to click preview again after save
        alert('Vui lòng click "Xem Trước Bản In" lần nữa sau khi đã lưu template.')
      } catch (error) {
        console.error('Error saving template:', error)
        alert('Không thể lưu template. Vui lòng kiểm tra thông tin và thử lại.')
      }
    } else {
      // Đã có templateId, navigate trực tiếp tới preview page với API HTML
      console.log('🎯 [TemplateEditor] Navigating to final preview (API HTML):', templateId)
      navigate(`/admin/templates/preview/${templateId}`)
    }
  }, [templateId, navigate, handleSave])

  // Keyboard shortcuts - Save and Print only
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
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleSave, handlePrintPreview])

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
            {/* Symbol Structure Guide */}
            <Tooltip title="Cấu trúc Ký hiệu Hóa đơn" arrow>
              <IconButton 
                onClick={() => setGuideModalOpen(true)}
                sx={{ 
                  color: '#1976d2',
                  bgcolor: '#e3f2fd',
                  '&:hover': { 
                    bgcolor: '#bbdefb',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                  width: 36,
                  height: 36,
                }}
              >
                <InfoIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Final Preview Button - Optimized */}
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrintPreview}
              disabled={!templateId}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 3,
                py: 0.85,
                bgcolor: templateId ? '#1976d2' : '#e0e0e0',
                color: 'white',
                boxShadow: templateId ? '0 2px 4px rgba(25, 118, 210, 0.2)' : 'none',
                '&:hover': {
                  bgcolor: templateId ? '#1565c0' : '#e0e0e0',
                  boxShadow: templateId ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none',
                  transform: templateId ? 'translateY(-2px)' : 'none',
                },
                '&:disabled': {
                  bgcolor: '#e0e0e0',
                  color: '#9e9e9e',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Xem Trước Cuối Cùng
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 3, py: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          {/* Left - Form 30% - Sticky Sidebar */}
          <Box sx={{ 
            width: { xs: '100%', md: '30%' },
            position: { md: 'sticky' },
            top: { md: 16 },
            alignSelf: { md: 'flex-start' },
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
          <Box sx={{ 
            width: { xs: '100%', md: '70%' },
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Info Alert - Smart Preview Explanation */}
           

            {/* Zoom Controls */}
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
                position: 'relative',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  bgcolor: '#f7f7f7',
                },
              }}>
              
              {/* Smart Preview: Backend HTML (100% accurate) or React fallback */}
              <Box
                ref={previewRef}
                sx={{
                  // Scale được xử lý bên trong TemplatePreviewIframe
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  borderRadius: 1.5,
                  overflow: 'visible',
                  bgcolor: 'transparent',
                  mb: 2,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.18)',
                  },
                }}
              >
                {/* ✅ Luôn dùng React Preview để edit được (drag logo, adjust size) */}
                <InvoiceTemplatePreview
                  config={config}
                  visibility={visibility}
                  blankRows={blankRows}
                  backgroundFrame={state.background.frame}
                  bilingual={state.settings.bilingual}
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

      {/* Invoice Symbol Guide Modal */}
      <InvoiceSymbolGuideModal 
        open={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
      </Box>
    </DragDropContext>
  )
}

export default TemplateEditor
