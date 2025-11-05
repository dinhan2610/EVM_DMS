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
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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

  // Load dữ liệu khi ở chế độ Edit
  useEffect(() => {
    if (templateId) {
      setIsEditMode(true)
      loadTemplateData(templateId)
    } else {
      // Chế độ Create - set default values
      setConfig({
        templateName: 'Hóa đơn GTGT (Mẫu mới)',
        companyLogo: null,
        companyName: 'CÔNG TY CỔ PHẦN GIẢI PHÁP TOÀN CẦU',
        companyTaxCode: '0123456789',
        companyAddress: '123 Nguyễn Văn A, Quận 1, TP.HCM',
        companyPhone: '028 1234 5678',
        modelCode: '1K24TXN',
        templateCode: 'C25TKN',
      })
    }
  }, [templateId])

  // Mock function để load dữ liệu template
  const loadTemplateData = async (id: string) => {
    setLoading(true)
    try {
      // TODO: Call API to load template data
      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Mock data dựa trên id
      const mockData: Record<string, TemplateConfig> = {
        '1': {
          templateName: 'Hóa đơn GTGT (Mẫu C25TKN)',
          companyLogo: null,
          companyName: 'CÔNG TY CỔ PHẦN GIẢI PHÁP TOÀN CẦU',
          companyTaxCode: '0123456789',
          companyAddress: '123 Nguyễn Văn A, Quận 1, TP.HCM',
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
      
      // Sau khi lưu thành công, quay về trang danh sách
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
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({
      ...prev,
      [name]: value,
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
          <Typography variant="body2" sx={{ color: '#666' }}>
            {isEditMode 
              ? `Cập nhật thông tin cho mẫu: ${config.templateName || 'Đang tải...'}`
              : 'Cấu hình thông tin và xem trước mẫu hóa đơn'
            }
          </Typography>
        </Box>
      </Stack>

      {/* Layout 2 cột */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 1 }}>
        {/* CỘT TRÁI: Form Cấu hình */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 42%' } }}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              {/* Thông tin Mẫu */}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Thông tin Mẫu
              </Typography>

              <TextField
                label="Tên mẫu"
                name="templateName"
                value={config.templateName}
                onChange={handleInputChange}
                size="small"
                fullWidth
              />

              <TextField
                label="Mẫu số (VD: 1K24TXN)"
                name="modelCode"
                value={config.modelCode}
                onChange={handleInputChange}
                size="small"
                fullWidth
                placeholder="1K24TXN"
              />

              <TextField
                label="Ký hiệu (VD: C25TKN)"
                name="templateCode"
                value={config.templateCode}
                onChange={handleInputChange}
                size="small"
                fullWidth
                placeholder="C25TKN"
              />

              <Divider sx={{ my: 1 }} />

              {/* Thông tin Công ty */}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Thông tin Công ty
              </Typography>

              {/* Upload Logo */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={config.companyLogo || ''}
                  sx={{ width: 64, height: 64, bgcolor: '#e0e0e0' }}
                  variant="rounded">
                  {!config.companyLogo && (
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      LOGO
                    </Typography>
                  )}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#ddd',
                    color: '#666',
                  }}>
                  Tải lên Logo
                  <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </Button>
              </Stack>

              <TextField
                label="Tên công ty"
                name="companyName"
                value={config.companyName}
                onChange={handleInputChange}
                size="small"
                fullWidth
              />

              <TextField
                label="Mã số thuế"
                name="companyTaxCode"
                value={config.companyTaxCode}
                onChange={handleInputChange}
                size="small"
                fullWidth
              />

              <TextField
                label="Địa chỉ"
                name="companyAddress"
                value={config.companyAddress}
                onChange={handleInputChange}
                size="small"
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                label="Điện thoại"
                name="companyPhone"
                value={config.companyPhone}
                onChange={handleInputChange}
                size="small"
                fullWidth
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

          <Paper
            elevation={3}
            sx={{
              p: 4,
              border: '2px dashed #ddd',
              backgroundColor: '#fafafa',
              minHeight: '842px', // A4 ratio
            }}>
            {/* Header: Logo + Thông tin công ty */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {/* Thông tin công ty bên trái */}
              <Box sx={{ flex: '0 0 66%' }}>
                <Stack spacing={0.5}>
                  {config.companyLogo && (
                    <Box sx={{ mb: 1 }}>
                      <img
                        src={config.companyLogo}
                        alt="Logo"
                        style={{ maxHeight: 60, maxWidth: 150, objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {config.companyName || 'TÊN CÔNG TY'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    <strong>MST:</strong> {config.companyTaxCode || '0000000000'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    <strong>Địa chỉ:</strong> {config.companyAddress || 'Địa chỉ công ty'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    <strong>Điện thoại:</strong> {config.companyPhone || '0000 000 000'}
                  </Typography>
                </Stack>
              </Box>

              {/* Mẫu số / Ký hiệu bên phải */}
              <Box sx={{ flex: '0 0 33%' }}>
                <Box
                  sx={{
                    border: '1px solid #333',
                    borderRadius: 1,
                    p: 1.5,
                    textAlign: 'center',
                    backgroundColor: 'white',
                  }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                    <strong>Mẫu số:</strong> {config.modelCode || 'MẪU SỐ'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    <strong>Ký hiệu:</strong> {config.templateCode || 'KÝ HIỆU'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', mt: 0.5 }}>
                    <strong>Số:</strong> 0000001
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Title */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                textAlign: 'center',
                my: 2,
                color: '#d32f2f',
                fontSize: '1.25rem',
              }}>
              HÓA ĐƠN GIÁ TRỊ GIA TĂNG
            </Typography>

            <Typography variant="body2" sx={{ textAlign: 'center', fontSize: '0.8125rem', mb: 2 }}>
              Ngày 5 tháng 11 năm 2024
            </Typography>

            {/* Customer Info (Mockup) */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                <strong>Đơn vị mua hàng:</strong> CÔNG TY TNHH ABC
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                <strong>Mã số thuế:</strong> 0987654321
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                <strong>Địa chỉ:</strong> 456 Nguyễn Văn B, Quận 2, TP.HCM
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                <strong>Người mua hàng:</strong> Nguyễn Văn A
              </Typography>
            </Box>

            {/* Items Table (Mockup) */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 50 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Tên hàng hóa, dịch vụ</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 60 }}>
                      ĐVT
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>
                      Số lượng
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 120 }}>
                      Đơn giá
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 120 }}>
                      Thành tiền
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockItems.map((item) => (
                    <TableRow key={item.stt}>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                        {item.stt}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{item.name}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                        {item.unit}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                        {item.price.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {item.total.toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals (Mockup) */}
            <Box sx={{ mb: 3 }}>
              <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  <strong>Cộng tiền hàng:</strong>{' '}
                  <span style={{ marginLeft: 16 }}>{subtotal.toLocaleString('vi-VN')} đ</span>
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  <strong>Thuế GTGT (10%):</strong>{' '}
                  <span style={{ marginLeft: 16 }}>{tax.toLocaleString('vi-VN')} đ</span>
                </Typography>
                <Divider sx={{ width: 300, my: 0.5 }} />
                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  <strong>Tổng tiền thanh toán:</strong>{' '}
                  <span style={{ marginLeft: 16 }}>{grandTotal.toLocaleString('vi-VN')} đ</span>
                </Typography>
              </Stack>
            </Box>

            {/* Signature (Mockup) */}
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 5 }}>
                  Người mua hàng
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#999' }}>
                  (Ký, ghi rõ họ tên)
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 5 }}>
                  Người bán hàng
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#999' }}>
                  (Ký, đóng dấu)
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Box>
  )
}

export default TemplateEditor
