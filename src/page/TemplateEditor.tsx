/*
 * TemplateEditor.tsx - Trang Tạo/Chỉnh sửa Mẫu hóa đơn
 * Bố cục 2 cột chuyên nghiệp: Form (30%) + Live Preview (70%)
 * Tích hợp đầy đủ state management và visibility controls
 */

import React, { useState, useEffect, ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  FormControlLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import UploadIcon from '@mui/icons-material/Upload'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'

// Interface cho cấu hình mẫu
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
  showQrCode: boolean
  showLogo: boolean
  showCompanyName: boolean
  showCompanyTaxCode: boolean
  showCompanyAddress: boolean
  showCompanyPhone: boolean
  showCompanyBankAccount: boolean
  showCustomerInfo: boolean
  showPaymentInfo: boolean
  showSignature: boolean
}

const TemplateEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // State cho loại mẫu
  const [templateType, setTemplateType] = useState<'GTGT' | 'Banhang' | ''>('')

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

  // Tự động set tên mẫu dựa vào loại
  const autoTemplateName =
    templateType === 'GTGT' ? 'Hóa đơn Giá trị Gia tăng' : 'Hóa đơn Bán hàng'

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
        templateType,
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
            {isEditMode ? '✏️ Chỉnh sửa Mẫu hóa đơn' : (
              <>
                <Box component="span" sx={{ color: 'primary.main' }}>➕</Box> Tạo Mẫu hóa đơn mới
              </>
            )}
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
          
          {/* Dropdown chọn loại mẫu (chỉ hiện khi tạo mới) - Compact */}
          {!isEditMode && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 1, 
                mb: 1.5, 
                bgcolor: 'white',
                border: '1px solid #e3e8ef',
                borderRadius: 1,
              }}
            >
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                  📄 Loại mẫu hóa đơn
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as 'GTGT' | 'Banhang' | '')}
                    displayEmpty
                    sx={{
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic' }}>
                        Vui lòng chọn loại mẫu hóa đơn
                      </Typography>
                    </MenuItem>
                    <MenuItem value="GTGT">
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography sx={{ fontSize: '1rem' }}>💼</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                          Hóa đơn GTGT
                        </Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Banhang">
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography sx={{ fontSize: '1rem' }}>🛒</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                          Hóa đơn Bán hàng
                        </Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          )}

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
          {templateType ? (
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
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '400px',
              bgcolor: '#f9f9f9',
              border: '2px dashed #ddd',
              borderRadius: 2,
            }}>
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                  📋 Chưa có bản xem trước
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vui lòng chọn loại mẫu hóa đơn để xem bản xem trước
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  )
}

export default TemplateEditor
