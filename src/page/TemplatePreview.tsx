import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Stack } from '@mui/material'
import { ArrowBack, Print } from '@mui/icons-material'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'

// Interface cho cấu hình mẫu
interface TemplateConfig {
  templateName: string
  companyLogo: string | null
  companyName: string
  companyTaxCode: string
  companyAddress: string
  companyPhone: string
  modelCode: string
  templateCode: string
}

const TemplatePreview: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

  // Load template data
  useEffect(() => {
    if (templateId) {
      loadTemplateData(templateId)
    }
  }, [templateId])

  const loadTemplateData = async (id: string) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

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

  const handleBack = () => {
    navigate('/admin/templates')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Đang tải...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.75rem', mb: 0.5 }}>
            Xem trước Mẫu hóa đơn
          </Typography>
          {config.templateName && (
            <Typography variant="body2" color="text.secondary">
              {config.templateName}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ textTransform: 'none' }}>
            Quay lại
          </Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ textTransform: 'none' }}>
            In mẫu
          </Button>
        </Stack>
      </Stack>

      {/* Preview Content */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ maxWidth: '21cm', width: '100%' }}>
          <InvoiceTemplatePreview config={config} />
        </Box>
      </Box>
    </Box>
  )
}

export default TemplatePreview
