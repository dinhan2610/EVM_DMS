import React, { useState, useEffect } from 'react'
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
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Checkbox,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InfoIcon from '@mui/icons-material/Info'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CodeIcon from '@mui/icons-material/Code'
import AddIcon from '@mui/icons-material/Add'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'

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
  const [loading, setLoading] = useState(false)
  
  // Get templateId from URL params or query params
  const templateId = urlTemplateId || searchParams.get('templateId')

  // State UI mới
  const [invoiceType, setInvoiceType] = useState<'withCode' | 'withoutCode'>('withCode')
  const [symbolPrefix] = useState<string>('2C25T') // Cố định, không cho sửa
  const [symbolYear, setSymbolYear] = useState<string>('YY') // Người dùng có thể sửa
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [backgroundFrame, setBackgroundFrame] = useState<string>('/khunghoadon.png') // Default frame

  // State cho accordion "Tùy chỉnh nội dung chi tiết hóa đơn"
  const [detailTab, setDetailTab] = useState<'company' | 'stt'>('company')
  const [companyFields, setCompanyFields] = useState([
    { id: 1, label: 'Mã số thuế', value: '6868688688-9f5', checked: false },
    { id: 2, label: 'Địa chỉ', value: 'Số 499 Nguyễn Trãi, Thanh Xuân, Hà Nội', checked: true },
    { id: 3, label: 'Điện thoại', value: '0974993653', checked: true },
    { id: 4, label: 'Fax', value: '', checked: false },
    { id: 5, label: 'Website', value: 'hoanglong@com.vn', checked: false },
    { id: 6, label: 'Email', value: 'hoanglong@gmail.com', checked: false },
    { id: 7, label: 'Số tài khoản', value: '5678000 - Ngân hàng Thương Mại Cổ Phần Á Châu', checked: true },
  ])
  const [tableColumns, setTableColumns] = useState([
    { id: 1, label: 'Mã hàng', checked: false, hasCode: false, hasSettings: false },
    { id: 2, label: 'Tên hàng hóa, dịch vụ', checked: false, hasCode: false, hasSettings: false },
    { id: 3, label: 'Quy cách', checked: false, hasCode: false, hasSettings: false },
    { id: 4, label: 'Đơn vị tính', checked: true, hasCode: false, hasSettings: false },
    { id: 5, label: 'Số lượng', checked: true, hasCode: true, hasSettings: false },
    { id: 6, label: 'Đơn giá', checked: true, hasCode: true, hasSettings: false },
    { id: 7, label: 'Thành tiền', checked: false, hasCode: true, hasSettings: false },
    { id: 8, label: 'Ghi chú', checked: false, hasCode: false, hasSettings: false },
    { id: 9, label: 'Kho nhập', checked: false, hasCode: false, hasSettings: false },
    { id: 10, label: 'Mã hàng', checked: false, hasCode: false, hasSettings: true },
    { id: 11, label: 'Ghi chú', checked: false, hasCode: false, hasSettings: true },
  ])
  const [rowCount, setRowCount] = useState(5)
  const [sttTitle, setSttTitle] = useState('STT')
  const [sttContent, setSttContent] = useState('[STT]')

  // State cũ - tương thích với InvoiceTemplatePreview
  const [blankRows] = useState<number>(8)
  const [config, setConfig] = useState<TemplateConfig>({
    templateName: 'Hóa đơn bán hàng (mẫu CB)',
    companyLogo: null,
    companyName: 'CÔNG TY CP HOÀNG LONG',
    companyTaxCode: '6888888888-915',
    companyAddress: 'Số 469 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    companyPhone: '0974993653',
    companyBankAccount: '56789/0 - Ngân hàng Thương Mại Cổ Phần Á Châu',
    modelCode: '01GTKT',
    templateCode: '2C23TYY',
  })

  const [visibility] = useState<TemplateVisibility>({
    showQrCode: true,
    showLogo: true,
    showCompanyName: true,
    showCompanyTaxCode: true,
    showCompanyAddress: true,
    showCompanyPhone: true,
    showCompanyBankAccount: true,
    showCustomerInfo: true,
    showPaymentInfo: true,
    showSignature: true,
  })

  // Load data khi edit hoặc chọn template từ selection page
  useEffect(() => {
    if (templateId) {
      console.log('Loading template:', templateId)
      
      // Map templateId với background frame tương ứng
      const templateBackgrounds: Record<string, string> = {
        '1': '/khunghoadon/khunghoadon1.png',
        '2': '/khunghoadon/khunghoadon2.png',
        '3': '/khunghoadon/khunghoadon3.png',
        '4': '/khunghoadon/khunghoadon4.png',
        '5': '/khunghoadon/khunghoadon5.png',
        '6': '/khunghoadon/khunghoadon6.png',
        '7': '/khunghoadon/khunghoadon7.png',
        '8': '/khunghoadon/khunghoadon8.png',
        '9': '/khunghoadon/khunghoadon9.png',
        '10': '/khunghoadon/khunghoadon10.png',
        '11': '/khunghoadon/khunghoadon11.png',
      }
      
      // Set background frame theo templateId
      const selectedBackground = templateBackgrounds[templateId] || '/khunghoadon.png'
      setBackgroundFrame(selectedBackground)
    }
  }, [templateId])

  // Sync modelCode và templateCode khi UI state thay đổi
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      modelCode: invoiceType === 'withCode' ? '01GTKT' : '02GTTT',
      templateCode: symbolPrefix + symbolYear,
    }))
  }, [invoiceType, symbolPrefix, symbolYear])

  // Handlers
  const handleInputChange = (field: keyof TemplateConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const logoUrl = URL.createObjectURL(file)
      setConfig((prev) => ({
        ...prev,
        companyLogo: logoUrl,
      }))
    }
  }

  const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCustomBackground(URL.createObjectURL(file))
    }
  }

  const handleBack = () => {
    navigate('/admin/templates/select')
  }

  const handleContinue = async () => {
    setLoading(true)
    try {
      const data = {
        ...config,
        invoiceType,
        symbolPrefix,
        symbolYear,
        customBackground,
        visibility,
        blankRows,
      }
      console.log('Saving:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      navigate('/admin/templates')
    } catch (error) {
      console.error('Error:', error)
      alert('Có lỗi xảy ra!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={handleBack} sx={{ color: '#555' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#1a1a1a' }}>
              Thiết lập mẫu hóa đơn
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Trợ giúp" arrow>
              <IconButton sx={{ color: '#757575' }}>
                <HelpOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
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
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Left - Form 30% */}
          <Box sx={{ width: { xs: '100%', lg: '25%' } }}>
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
                {/* Tên mẫu */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Tên mẫu <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={config.templateName}
                    onChange={handleInputChange('templateName')}
                    placeholder="Nhập tên mẫu hóa đơn"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1976d2',
                        },
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                            borderWidth: 2,
                          },
                        },
                      },
                    }}
                  />
                </Box>

                {/* Hình thức */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Hình thức hoá đơn <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  <RadioGroup value={invoiceType} onChange={(e) => setInvoiceType(e.target.value as 'withCode' | 'withoutCode')}>
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

                {/* Ký hiệu */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Ký hiệu <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  
                  {/* Input ký hiệu */}
                  <Stack direction="row" spacing={0} alignItems="stretch" sx={{ mb: 1.5 }}>
                    {/* Phần cố định - 2C25T */}
                    <Box
                      sx={{
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px 0 0 4px',
                        borderRight: 'none',
                        minHeight: '40px',
                      }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#424242', letterSpacing: '0.5px' }}>
                        {symbolPrefix}
                      </Typography>
                    </Box>

                    {/* Phần người dùng có thể sửa - YY */}
                    <TextField
                      size="small"
                      value={symbolYear}
                      onChange={(e) => setSymbolYear(e.target.value.toUpperCase())}
                      placeholder="YY"
                      inputProps={{
                        maxLength: 4,
                        style: { 
                          textAlign: 'center', 
                          fontWeight: 600, 
                          letterSpacing: '0.5px',
                        }
                      }}
                      sx={{ 
                        width: 45,
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.875rem',
                          borderRadius: '0 4px 4px 0',
                          height: '40px',
                          '& input': {
                            padding: '8.5px 8px',
                          },
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />

                    {/* Preview box */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1.5 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#9e9e9e' }}>
                        →
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 700, 
                        color: '#1976d2', 
                        letterSpacing: '0.8px',
                        px: 1.5,
                        py: 0.5,
                        bgcolor: '#f0f7ff',
                        borderRadius: 1,
                        border: '1px solid #bbdefb',
                      }}>
                        {symbolPrefix}{symbolYear || 'YY'}
                      </Typography>
                    </Box>

                    {/* Icon help - không có border */}
                    <Tooltip 
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>
                            Hướng dẫn ký hiệu:
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', mb: 0.3 }}>
                            • <strong>{symbolPrefix}</strong>: Ký hiệu cố định
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem' }}>
                            • <strong>YY</strong>: Năm hoặc ký tự tùy chỉnh (2-4 ký tự)
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', mt: 0.5, fontStyle: 'italic', color: '#90caf9' }}>
                            Ví dụ: {symbolPrefix}24, {symbolPrefix}2024, {symbolPrefix}ABC
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', mt: 0.5, fontWeight: 600, color: '#90caf9' }}>
                            → Kết quả: {symbolPrefix}{symbolYear || 'YY'}
                          </Typography>
                        </Box>
                      } 
                      arrow
                      placement="right">
                      <IconButton
                        size="small"
                        sx={{ 
                          ml: 0.5,
                          width: 32,
                          height: 32,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            bgcolor: '#e3f2fd',
                          },
                        }}>
                        <InfoIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
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
                      borderColor: '#d0d0d0',
                      color: '#616161',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        borderColor: '#1976d2', 
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        transform: 'translateY(-2px)',
                      },
                    }}>
                    {config.companyLogo ? '✓ Đã tải lên logo' : 'Tải lên logo công ty'}
                    <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                  </Button>
                  {config.companyLogo && (
                    <Box 
                      sx={{ 
                        mt: 1.5, 
                        p: 1.5,
                        bgcolor: '#f9f9f9',
                        borderRadius: 1.5,
                        border: '1px solid #e0e0e0',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1976d2',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                        },
                      }}>
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
                        Logo đã tải lên
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Hình nền riêng */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#616161', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                    Ký thiết lập hình nền riêng
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
                      borderColor: '#d0d0d0',
                      color: '#616161',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        borderColor: '#1976d2', 
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        transform: 'translateY(-2px)',
                      },
                    }}>
                    {customBackground ? '✓ Đã tải lên hình nền' : 'Tải lên hình nền tùy chỉnh'}
                    <input type="file" hidden accept="image/*" onChange={handleCustomBackgroundUpload} />
                  </Button>
                  {customBackground && (
                    <Box 
                      sx={{ 
                        mt: 1.5, 
                        p: 1.5,
                        bgcolor: '#f9f9f9',
                        borderRadius: 1.5,
                        border: '1px solid #e0e0e0',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1976d2',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                        },
                      }}>
                      <img 
                        src={customBackground} 
                        alt="Background preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 100, 
                          objectFit: 'contain',
                          borderRadius: 4,
                        }} 
                      />
                      <Typography sx={{ fontSize: '0.75rem', color: '#9e9e9e', mt: 1 }}>
                        Hình nền đã tải lên
                      </Typography>
                    </Box>
                  )}
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
                      <Typography sx={{ 
                        fontSize: '0.9375rem', 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        letterSpacing: '-0.01em',
                      }}>
                        Điều chỉnh nhanh các thông tin
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Typography sx={{ 
                        fontSize: '0.8125rem', 
                        color: '#616161', 
                        lineHeight: 1.6,
                      }}>
                        Tên mẫu, ký hiệu, font chữ của số, QR code, song ngữ, tùy chọn hiển thị các thông tin của hóa đơn.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>

                  {/* Section 2: Logo, khung viền, hình nền, logo chìm */}
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
                      <Typography sx={{ 
                        fontSize: '0.9375rem', 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        letterSpacing: '-0.01em',
                      }}>
                        Logo, khung viền, hình nền, logo chìm
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Typography sx={{ 
                        fontSize: '0.8125rem', 
                        color: '#616161', 
                        lineHeight: 1.6,
                      }}>
                        Cài đặt logo, khung viền, hình nền, logo chìm cho mẫu hóa đơn.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>

                  {/* Section 3: Tùy chỉnh nội dung chi tiết hóa đơn */}
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
                      <Typography sx={{ 
                        fontSize: '0.9375rem', 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        letterSpacing: '-0.01em',
                      }}>
                        Tùy chỉnh nội dung chi tiết hóa đơn
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      {/* Tabs */}
                      <Tabs 
                        value={detailTab} 
                        onChange={(_, newValue) => setDetailTab(newValue)}
                        sx={{
                          borderBottom: '1px solid #e0e0e0',
                          minHeight: 42,
                          '& .MuiTab-root': {
                            minHeight: 42,
                            textTransform: 'none',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#616161',
                            '&.Mui-selected': {
                              color: '#1976d2',
                              fontWeight: 600,
                            },
                          },
                          '& .MuiTabs-indicator': {
                            backgroundColor: '#1976d2',
                          },
                        }}>
                        <Tab label="CÔNG TY CP HOÀNG LONG" value="company" />
                        <Tab label="STT" value="stt" />
                      </Tabs>

                      {/* Company Tab Content */}
                      {detailTab === 'company' && (
                        <Box sx={{ p: 2 }}>
                          {/* Toolbar placeholder */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2,
                            pb: 1.5,
                            borderBottom: '1px solid #e0e0e0',
                          }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9e9e9e' }}>
                              20 ▼
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#9e9e9e' }}>
                              B I A
                            </Typography>
                          </Box>

                          {/* Company Name Field */}
                          <TextField
                            fullWidth
                            size="small"
                            value={config.companyName}
                            onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                            sx={{ 
                              mb: 2,
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.875rem',
                                bgcolor: '#f8f9fa',
                              },
                            }}
                          />

                          {/* Company Fields List */}
                          <Stack spacing={1}>
                            {companyFields.map((field) => (
                              <Box 
                                key={field.id}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: 1,
                                  py: 0.5,
                                  '&:hover': {
                                    bgcolor: '#f9fafb',
                                  },
                                }}>
                                <DragIndicatorIcon sx={{ fontSize: 18, color: '#ccc' }} />
                                <Checkbox
                                  size="small"
                                  checked={field.checked}
                                  onChange={(e) => {
                                    const updated = companyFields.map(f => 
                                      f.id === field.id ? { ...f, checked: e.target.checked } : f
                                    )
                                    setCompanyFields(updated)
                                  }}
                                  sx={{
                                    '&.Mui-checked': {
                                      color: '#1976d2',
                                    },
                                  }}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography sx={{ fontSize: '0.8125rem', color: '#424242', mb: 0.25 }}>
                                    {field.label}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.75rem', color: '#9e9e9e' }}>
                                    {field.value}
                                  </Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: '#9e9e9e' }}>
                                  <KeyboardArrowDownIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>

                          {/* Add Button */}
                          <Button
                            fullWidth
                            startIcon={<AddIcon />}
                            sx={{
                              mt: 2,
                              textTransform: 'none',
                              fontSize: '0.8125rem',
                              color: '#1976d2',
                              justifyContent: 'center',
                              '&:hover': {
                                bgcolor: '#e3f2fd',
                              },
                            }}>
                            Thêm dòng
                          </Button>
                        </Box>
                      )}

                      {/* STT Tab Content */}
                      {detailTab === 'stt' && (
                        <Box sx={{ p: 2 }}>
                          {/* Title & Content Fields */}
                          <Stack spacing={1.5} sx={{ mb: 2 }}>
                            <Box>
                              <Typography sx={{ fontSize: '0.75rem', color: '#616161', mb: 0.5 }}>
                                Tiêu đề
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                value={sttTitle}
                                onChange={(e) => setSttTitle(e.target.value)}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '0.875rem',
                                    bgcolor: '#f8f9fa',
                                  },
                                }}
                              />
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '0.75rem', color: '#616161', mb: 0.5 }}>
                                Nội dung
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                value={sttContent}
                                onChange={(e) => setSttContent(e.target.value)}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '0.875rem',
                                    bgcolor: '#f8f9fa',
                                  },
                                }}
                              />
                            </Box>
                          </Stack>

                          {/* Table Columns List */}
                          <Stack spacing={1} sx={{ mb: 2 }}>
                            {tableColumns.map((col) => (
                              <Box 
                                key={col.id}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: 1,
                                  py: 0.5,
                                  '&:hover': {
                                    bgcolor: '#f9fafb',
                                  },
                                }}>
                                <DragIndicatorIcon sx={{ fontSize: 18, color: '#ccc' }} />
                                <Checkbox
                                  size="small"
                                  checked={col.checked}
                                  onChange={(e) => {
                                    const updated = tableColumns.map(c => 
                                      c.id === col.id ? { ...c, checked: e.target.checked } : c
                                    )
                                    setTableColumns(updated)
                                  }}
                                  sx={{
                                    '&.Mui-checked': {
                                      color: '#1976d2',
                                    },
                                  }}
                                />
                                <Typography sx={{ flex: 1, fontSize: '0.8125rem', color: '#424242' }}>
                                  {col.label}
                                </Typography>
                                
                                {/* Icons */}
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {col.hasCode && (
                                    <IconButton size="small" sx={{ color: '#9e9e9e' }}>
                                      <CodeIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  {col.hasSettings && (
                                    <>
                                      <IconButton size="small" sx={{ color: '#9e9e9e' }}>
                                        <SettingsIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" sx={{ color: '#f44336' }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Stack>

                          {/* Add Column Button */}
                          <Button
                            fullWidth
                            startIcon={<AddIcon />}
                            sx={{
                              mb: 2,
                              textTransform: 'none',
                              fontSize: '0.8125rem',
                              color: '#1976d2',
                              justifyContent: 'center',
                              '&:hover': {
                                bgcolor: '#e3f2fd',
                              },
                            }}>
                            Thêm cột
                          </Button>

                          {/* Row Count */}
                          <FormControlLabel
                            control={
                              <Checkbox 
                                size="small" 
                                defaultChecked
                                sx={{
                                  '&.Mui-checked': {
                                    color: '#1976d2',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.8125rem', color: '#424242' }}>
                                  Số dòng hàng hóa dịch vụ và hiển thị đề trưởng
                                </Typography>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={rowCount}
                                  onChange={(e) => setRowCount(parseInt(e.target.value) || 5)}
                                  sx={{ 
                                    width: 60,
                                    '& .MuiOutlinedInput-root': {
                                      fontSize: '0.875rem',
                                      height: 28,
                                    },
                                    '& input': {
                                      textAlign: 'center',
                                      py: 0.5,
                                    },
                                  }}
                                />
                              </Box>
                            }
                            sx={{ mb: 2, ml: 0 }}
                          />

                          {/* Action Buttons */}
                          <Stack direction="row" spacing={1.5}>
                            <Button
                              variant="outlined"
                              fullWidth
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.8125rem',
                                color: '#616161',
                                borderColor: '#d0d0d0',
                                '&:hover': {
                                  borderColor: '#999',
                                  bgcolor: '#f5f5f5',
                                },
                              }}>
                              Huỷ bỏ
                            </Button>
                            <Button
                              variant="contained"
                              fullWidth
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.8125rem',
                                bgcolor: '#1976d2',
                                '&:hover': {
                                  bgcolor: '#1565c0',
                                },
                              }}>
                              Lưu lại
                            </Button>
                          </Stack>
                        </Box>
                      )}
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
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
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
                  }}>
                  {loading ? 'Đang xử lý...' : 'Tiếp tục'}
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Right - Preview 70% */}
          <Box sx={{ width: { xs: '100%', lg: '75%' } }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2, 
                minHeight: 800,
                bgcolor: '#fafafa',
                transition: 'box-shadow 0.3s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                overflow: 'auto',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}>
              <InvoiceTemplatePreview
                config={config}
                visibility={visibility}
                blankRows={blankRows}
                backgroundFrame={backgroundFrame}
              />
            </Paper>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}

export default TemplateEditor
