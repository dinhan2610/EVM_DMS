/*
 * TemplateEditor.tsx - Trang Thiết lập Mẫu hóa đơn
 * UI/UX chuyên nghiệp theo chuẩn thiết kế mới
 * Bố cục 2 cột: Form (30%) + Live Preview (70%)
 */

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
  Checkbox,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpOutlineIcon,
  PlayCircleOutline as PlayCircleIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'

// Interface cho cấu hình mẫu
interface TemplateConfig {
  templateName: string
  invoiceType: 'withCode' | 'withoutCode'
  symbolPrefix: string
  symbolYear: string
  isNonTaxZone: boolean
  companyLogo: string | null
  backgroundFrame: string
  backgroundRatio: string
  customBackground: string | null
  companyName: string
  companyTaxCode: string
  companyAddress: string
  companyPhone: string
  companyBankAccount: string
}

const TemplateEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // State cho 6 ô ký hiệu
  const [symbolCode, setSymbolCode] = useState<string[]>(Array(6).fill(''))

  // State cho số dòng trống
  const [blankRows, setBlankRows] = useState<number>(8)

  // State quản lý cấu hình
  const [config, setConfig] = useState<TemplateConfig>({
    templateName: '',
    companyLogo: null,
    companyName: 'GLOBAL SOLUTIONS LTD',
    companyTaxCode: '6868686868-666',
    companyAddress: '95 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    companyPhone: '024 1234 5678',
    companyBankAccount: '123456789 - Vietcombank',
    modelCode: '1K24TXN',
    templateCode: '',
  })

  // State cho visibility controls
  const [visibility, setVisibility] = useState<TemplateVisibility>({
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

  // Tự động set tên mẫu mặc định
  const autoTemplateName = 'Mẫu hóa đơn mới'

  // useEffect để load data khi có templateId
  useEffect(() => {
    if (templateId) {
      setIsEditMode(true)
      loadTemplateData(templateId)
    } else {
      setIsEditMode(false)
    }
  }, [templateId])

  // Update template code when symbolCode changes
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      templateCode: symbolCode.join(''),
    }))
  }, [symbolCode])

  // Hàm load template data (mock)
  const loadTemplateData = async (id: string) => {
    setLoading(true)
    try {
      // Mock async API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock data based on ID
      const mockData: Record<string, TemplateConfig & { symbolCodeArray: string[]; blankRowsValue: number }> = {
        '1': {
          templateName: 'Hóa đơn VAT Tiêu chuẩn',
          companyLogo: null,
          companyName: 'CÔNG TY TNHH XNK PETROLIMEX',
          companyTaxCode: '0123456789',
          companyAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          companyPhone: '028 1234 5678',
          companyBankAccount: '1234567890 - Vietcombank',
          modelCode: '1K24TXN',
          templateCode: 'C25TKN',
          symbolCodeArray: ['C', '2', '5', 'T', 'K', 'N'],
          blankRowsValue: 8,
        },
        '2': {
          templateName: 'Hóa đơn Bán hàng',
          companyLogo: null,
          companyName: 'CÔNG TY TNHH ABC',
          companyTaxCode: '9876543210',
          companyAddress: '456 Lê Văn Việt, Quận 9, TP.HCM',
          companyPhone: '028 9876 5432',
          companyBankAccount: '9876543210 - ACB',
          modelCode: '2K24TXN',
          templateCode: 'D26TTS',
          symbolCodeArray: ['D', '2', '6', 'T', 'T', 'S'],
          blankRowsValue: 10,
        },
      }

      const data = mockData[id] || mockData['1']
      setConfig({
        templateName: data.templateName,
        companyLogo: data.companyLogo,
        companyName: data.companyName,
        companyTaxCode: data.companyTaxCode,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
        companyBankAccount: data.companyBankAccount,
        modelCode: data.modelCode,
        templateCode: data.templateCode,
      })
      setSymbolCode(data.symbolCodeArray)
      setBlankRows(data.blankRowsValue)
    } catch (error) {
      console.error('Error loading template:', error)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý lưu template
  const handleSave = async () => {
    setLoading(true)
    try {
      const templateData = {
        ...config,
        templateName: config.templateName || autoTemplateName,
        symbolCode: symbolCode.join(''),
        blankRows,
        visibility,
      }

      // TODO: Call API to save template
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Saving template:', templateData)
      console.log('Mode:', isEditMode ? 'Edit' : 'Create')

      // Navigate back to list
      navigate('/admin/templates')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Có lỗi xảy ra khi lưu mẫu!')
    } finally {
      setLoading(false)
    }
  }

  // Handler cho 6 ô ký hiệu
  const handleSymbolCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...symbolCode]
      newCode[index] = value.toUpperCase()
      setSymbolCode(newCode)
    }
  }

  // Handler cho visibility checkbox
  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisibility({
      ...visibility,
      [event.target.name]: event.target.checked,
    })
  }

  // Xử lý hủy
  const handleCancel = () => {
    navigate('/admin/templates')
  }

  // Xử lý thay đổi input
  const handleInputChange = (field: keyof TemplateConfig) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  // Xử lý upload logo
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const logoUrl = URL.createObjectURL(file)
      setConfig((prev) => ({
        ...prev,
        companyLogo: logoUrl,
      }))
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.75rem', mb: 0.5, color: 'primary.main' }}>
            {isEditMode ? '✏️ Chỉnh sửa Mẫu hóa đơn' : 'Tạo Mẫu hóa đơn mới'}
          </Typography>
          {isEditMode && config.templateName && (
            <Typography variant="body2" color="text.secondary">
              {config.templateName}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/templates')}
          sx={{ 
            textTransform: 'none',
            borderColor: '#ddd',
            color: '#666',
            '&:hover': {
              borderColor: '#999',
              bgcolor: '#f5f5f5',
            }
          }}
        >
          Quay lại
        </Button>
      </Stack>

      {/* 2-Column Layout with Flexbox */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* ======= CỘT TRÁI: FORM EDITOR (30%) ======= */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 30%' } }}>
          
          {/* PANEL 1: THÔNG TIN CHUNG - Accordion */}
          <Accordion elevation={2} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiAccordionSummary-content': {
                  my: 1,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#555' }}>
                 Thông tin chung
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <TextField
                  label="Tên Mẫu hóa đơn"
                  size="small"
                  fullWidth
                  value={config.templateName || autoTemplateName}
                  onChange={handleInputChange('templateName')}
                  placeholder={autoTemplateName}
                />

                {/* Mẫu số - Ký hiệu (6 ô) */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Mẫu số - Ký hiệu <Chip label="6 ký tự" size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {Array.from(Array(6)).map((_, index) => (
                      <TextField
                        key={index}
                        size="small"
                        value={symbolCode[index]}
                        onChange={(e) => handleSymbolCodeChange(index, e.target.value)}
                        inputProps={{ maxLength: 1, style: { textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold' } }}
                        sx={{ width: 50 }}
                      />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Ví dụ: D26TTS (mỗi ô 1 ký tự)
                  </Typography>
                </Box>

                <TextField
                  label="Mẫu số"
                  size="small"
                  fullWidth
                  value={config.modelCode}
                  onChange={handleInputChange('modelCode')}
                  placeholder="VD: 1K24TXN"
                />

                <TextField
                  label="Số dòng trống (trong bảng)"
                  type="number"
                  size="small"
                  fullWidth
                  value={blankRows}
                  onChange={(e) => setBlankRows(parseInt(e.target.value, 10) || 0)}
                  inputProps={{ min: 0, max: 20 }}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* PANEL 2: LOGO & HÌNH NỀN - Accordion */}
          <Accordion elevation={2} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiAccordionSummary-content': {
                  my: 1,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#555' }}>
                 Logo & Hình nền
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={visibility.showQrCode}
                      onChange={handleVisibilityChange}
                      name="showQrCode"
                    />
                  }
                  label="Sử dụng QR code"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={visibility.showLogo}
                      onChange={handleVisibilityChange}
                      name="showLogo"
                    />
                  }
                  label="Sử dụng logo công ty"
                />
                {visibility.showLogo && (
                  <Box sx={{ ml: 4 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<UploadIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      Tải ảnh lên
                      <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                    </Button>
                    {config.companyLogo && (
                      <Box sx={{ mt: 1 }}>
                        <img
                          src={config.companyLogo}
                          alt="Logo Preview"
                          style={{ maxHeight: 50, maxWidth: 120, objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* PANEL 3: TÙY CHỈNH NỘI DUNG HIỂN THỊ - Accordion */}
          <Accordion elevation={2} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiAccordionSummary-content': {
                  my: 1,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#555' }}>
                Tùy chỉnh nội dung hiển thị
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Box sx={{ maxHeight: 350, overflowY: 'auto', pr: 1 }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 700, color: 'text.primary' }}>
                    📋 Thông tin công ty:
                  </Typography>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showCompanyName} onChange={handleVisibilityChange} name="showCompanyName" />}
                    label="Tên công ty"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showCompanyTaxCode} onChange={handleVisibilityChange} name="showCompanyTaxCode" />}
                    label="Mã số thuế"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showCompanyAddress} onChange={handleVisibilityChange} name="showCompanyAddress" />}
                    label="Địa chỉ"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showCompanyPhone} onChange={handleVisibilityChange} name="showCompanyPhone" />}
                    label="Số điện thoại"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showCompanyBankAccount} onChange={handleVisibilityChange} name="showCompanyBankAccount" />}
                    label="Số tài khoản"
                  />

                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700, color: 'text.primary' }}>
                    📝 Thông tin khác:
                  </Typography>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showCustomerInfo} onChange={handleVisibilityChange} name="showCustomerInfo" />}
                    label="Thông tin người mua"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showPaymentInfo} onChange={handleVisibilityChange} name="showPaymentInfo" />}
                    label="Hình thức thanh toán"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={visibility.showSignature} onChange={handleVisibilityChange} name="showSignature" />}
                    label="Phần chữ ký"
                  />
                </Stack>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* PANEL 4: THÔNG TIN CÔNG TY - Accordion */}
          <Accordion elevation={2} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiAccordionSummary-content': {
                  my: 1,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#555' }}>
                 Thông tin công ty
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <TextField
                  label="Tên công ty"
                  size="small"
                  fullWidth
                  value={config.companyName}
                  onChange={handleInputChange('companyName')}
                />
                <TextField
                  label="Mã số thuế"
                  size="small"
                  fullWidth
                  value={config.companyTaxCode}
                  onChange={handleInputChange('companyTaxCode')}
                />
                <TextField
                  label="Địa chỉ"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={config.companyAddress}
                  onChange={handleInputChange('companyAddress')}
                />
                <TextField
                  label="Số điện thoại"
                  size="small"
                  fullWidth
                  value={config.companyPhone}
                  onChange={handleInputChange('companyPhone')}
                />
                <TextField
                  label="Số tài khoản"
                  size="small"
                  fullWidth
                  value={config.companyBankAccount}
                  onChange={handleInputChange('companyBankAccount')}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* ACTION BUTTONS */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, py: 1.2 }}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, py: 1.2 }}
            >
              {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật Mẫu' : 'Lưu Mẫu'}
            </Button>
          </Stack>
        </Box>

        {/* ======= CỘT PHẢI: LIVE PREVIEW (70%) ======= */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 70%' } }}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Box sx={{ 
              transform: 'scale(0.95)', 
              transformOrigin: 'top center',
            }}>
              <InvoiceTemplatePreview
                config={config}
                visibility={visibility}
                blankRows={blankRows}
              />
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default TemplateEditor
