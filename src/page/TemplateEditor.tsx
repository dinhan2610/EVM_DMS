import React, { useState, useEffect, ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Stack,
  Divider,
} from '@mui/material'
import { Upload, Save, Cancel } from '@mui/icons-material'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'

// Interface cho cấu hình mẫu
interface TemplateConfig {
  templateName: string
  companyLogo: string | null // URL (dùng URL.createObjectURL)
  companyName: string
  companyTaxCode: string
  companyAddress: string
  companyPhone: string
  modelCode: string // Mẫu số (1K24TXN)
  templateCode: string // Ký hiệu (C25TKN)
}

const TemplateEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // State quản lý cấu hình
  const [config, setConfig] = useState<TemplateConfig>({
    templateName: '',
    companyLogo: null,
    companyName: '',
    companyTaxCode: '',
    companyAddress: '',
    companyPhone: '',
    modelCode: '',
    templateCode: '',
  })

  // useEffect để load data khi có templateId
  useEffect(() => {
    if (templateId) {
      setIsEditMode(true)
      loadTemplateData(templateId)
    } else {
      // Create mode - set defaults
      setIsEditMode(false)
      setConfig({
        templateName: '',
        companyLogo: null,
        companyName: '',
        companyTaxCode: '',
        companyAddress: '',
        companyPhone: '',
        modelCode: '',
        templateCode: '',
      })
    }
  }, [templateId])

  // Hàm load template data (mock)
  const loadTemplateData = async (id: string) => {
    setLoading(true)
    try {
      // Mock async API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock data based on ID
      const mockData: Record<string, TemplateConfig> = {
        '1': {
          templateName: 'Hóa đơn VAT Tiêu chuẩn (Mẫu C25TKN)',
          companyLogo: null,
          companyName: 'CÔNG TY TNHH XNK PETROLIMEX',
          companyTaxCode: '0123456789',
          companyAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          companyPhone: '028 1234 5678',
          modelCode: '1K24TXN',
          templateCode: 'C25TKN',
        },
        '2': {
          templateName: 'Hóa đơn Bán hàng (Mẫu D26TTS)',
          companyLogo: null,
          companyName: 'CÔNG TY TNHH ABC',
          companyTaxCode: '9876543210',
          companyAddress: '456 Lê Văn Việt, Quận 9, TP.HCM',
          companyPhone: '028 9876 5432',
          modelCode: '2K24TXN',
          templateCode: 'D26TTS',
        },
      }

      setConfig(mockData[id] || mockData['1'])
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
      // TODO: Call API to save template
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      console.log('Saving template:', config)
      console.log('Mode:', isEditMode ? 'Edit' : 'Create')
      
      // Navigate back to list
      navigate('/admin/templates')
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setLoading(false)
    }
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
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.75rem', mb: 0.5 }}>
            {isEditMode ? 'Chỉnh sửa Mẫu hóa đơn' : 'Tạo Mẫu hóa đơn mới'}
          </Typography>
          {isEditMode && config.templateName && (
            <Typography variant="body2" color="text.secondary">
              {config.templateName}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* 2-Column Layout: Form (42%) + Preview (58%) */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* CỘT TRÁI: Form */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 42%' } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Thông tin Mẫu hóa đơn
            </Typography>

            <Stack spacing={2.5}>
              {/* Tên mẫu */}
              <TextField
                label="Tên Mẫu"
                placeholder="VD: Hóa đơn VAT Tiêu chuẩn"
                fullWidth
                variant="outlined"
                value={config.templateName}
                onChange={handleInputChange('templateName')}
              />

              {/* Logo upload */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Logo Công ty
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  sx={{ textTransform: 'none' }}>
                  Tải lên Logo
                  <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </Button>
                {config.companyLogo && (
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={config.companyLogo}
                      alt="Logo Preview"
                      style={{ maxHeight: 60, maxWidth: 150, objectFit: 'contain' }}
                    />
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Thông tin công ty */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
                Thông tin Công ty
              </Typography>

              <TextField
                label="Tên Công ty"
                placeholder="VD: CÔNG TY TNHH XNK PETROLIMEX"
                fullWidth
                variant="outlined"
                value={config.companyName}
                onChange={handleInputChange('companyName')}
              />

              <TextField
                label="Mã số thuế"
                placeholder="VD: 0123456789"
                fullWidth
                variant="outlined"
                value={config.companyTaxCode}
                onChange={handleInputChange('companyTaxCode')}
              />

              <TextField
                label="Địa chỉ"
                placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={config.companyAddress}
                onChange={handleInputChange('companyAddress')}
              />

              <TextField
                label="Điện thoại"
                placeholder="VD: 028 1234 5678"
                fullWidth
                variant="outlined"
                value={config.companyPhone}
                onChange={handleInputChange('companyPhone')}
              />

              <Divider />

              {/* Mẫu số & Ký hiệu */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
                Mẫu số & Ký hiệu
              </Typography>

              <TextField
                label="Mẫu số"
                placeholder="VD: 1K24TXN"
                fullWidth
                variant="outlined"
                value={config.modelCode}
                onChange={handleInputChange('modelCode')}
              />

              <TextField
                label="Ký hiệu"
                placeholder="VD: C25TKN"
                fullWidth
                variant="outlined"
                value={config.templateCode}
                onChange={handleInputChange('templateCode')}
              />

              {/* Action Buttons */}
              <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#ddd',
                    color: '#666',
                  }}>
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                  }}>
                  {loading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật Mẫu' : 'Lưu Mẫu')}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* CỘT PHẢI: Xem trước Live */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 58%' } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Xem trước Live
          </Typography>

          <InvoiceTemplatePreview config={config} />
        </Box>
      </Stack>
    </Box>
  )
}

export default TemplateEditor
