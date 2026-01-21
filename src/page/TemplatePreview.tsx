/**
 * TemplatePreviewPage - HYBRID APPROACH
 * 
 * 🎯 Purpose: Final preview page using BACKEND-RENDERED HTML
 * ✅ Features:
 *    - Backend consistency (HTML from API)
 *    - Print-ready preview
 *    - Zoom controls
 *    - Print functionality
 * 
 * ⚠️ This is NOT for real-time editing preview
 *    Use TemplateEditor with InvoiceTemplatePreview for that
 */

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
} from '@mui/material'
import { 
  ArrowBack, 
  Print, 
  ZoomIn, 
  ZoomOut, 
  ZoomOutMap,
  Download,
  Info,
} from '@mui/icons-material'
import { usePageTitle } from '@/hooks/usePageTitle'
import TemplatePreviewIframe from '@/components/TemplatePreviewIframe'
import { getTemplatePreviewHtml } from '@/services/templateService'

const TemplatePreviewPage: React.FC = () => {
  usePageTitle('Xem trước mẫu hóa đơn')
  
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  /**
   * Navigate back to template editor
   */
  const handleBack = () => {
    if (templateId) {
      navigate(`/admin/templates/edit/${templateId}`)
    } else {
      navigate('/admin/templates')
    }
  }

  /**
   * Print template using backend HTML
   */
  const handlePrint = async () => {
    if (!templateId) return
    
    try {
      setIsLoading(true)
      console.log('🖨️ [Print] Fetching HTML for print...')
      
      const html = await getTemplatePreviewHtml(Number(templateId))
      
      // Open new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        
        // Wait for images/fonts to load before printing
        setTimeout(() => {
          printWindow.print()
          console.log('✅ [Print] Print dialog opened')
        }, 500)
      } else {
        alert('Vui lòng cho phép popup để in')
      }
    } catch (error) {
      console.error('❌ [Print] Error:', error)
      alert('Không thể in preview. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Download HTML file
   */
  const handleDownload = async () => {
    if (!templateId) return
    
    try {
      setIsLoading(true)
      const html = await getTemplatePreviewHtml(Number(templateId))
      
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `template-${templateId}-preview.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('✅ [Download] HTML file downloaded')
    } catch (error) {
      console.error('❌ [Download] Error:', error)
      alert('Không thể tải xuống. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Zoom controls
   */
  const handleZoomIn = () => {
    setScale(prev => Math.min(1.5, prev + 0.1))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.4, prev - 0.1))
  }

  const handleResetZoom = () => {
    setScale(1.0)
  }

  /**
   * Reload preview (force refresh from API)
   */
  const handleReload = () => {
    setReloadTrigger(prev => prev + 1)
  }

  if (!templateId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Template ID không hợp lệ
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f5f7fa',
      pb: 4,
    }}>
      {/* Header - Fixed */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: 'white',
          mb: 3,
        }}
      >
        <Box sx={{ px: 3, py: 2 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            {/* Title */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                  Xem trước cuối cùng
                </Typography>
                <Chip 
                  label="Backend Render" 
                  size="small" 
                  color="success"
                  icon={<Info />}
                  sx={{ height: 24, fontSize: '0.7rem' }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Preview này được render từ backend để đảm bảo 100% giống bản in
              </Typography>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ textTransform: 'none' }}
              >
                Quay lại chỉnh sửa
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownload}
                disabled={isLoading}
                sx={{ textTransform: 'none' }}
              >
                Tải HTML
              </Button>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handlePrint}
                disabled={isLoading}
                sx={{ textTransform: 'none' }}
              >
                In mẫu
              </Button>
            </Stack>
          </Stack>

          {/* Zoom Controls Bar */}
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center"
            sx={{ 
              mt: 2,
              pt: 2,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
              Zoom:
            </Typography>
            
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Phóng to">
                <IconButton 
                  size="small" 
                  onClick={handleZoomIn}
                  disabled={scale >= 1.5}
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Chip 
                label={`${Math.round(scale * 100)}%`}
                size="small"
                sx={{ 
                  minWidth: 60,
                  fontWeight: 600,
                  bgcolor: scale === 1.0 ? '#e3f2fd' : '#f5f5f5',
                  color: scale === 1.0 ? '#1976d2' : 'text.secondary',
                }}
              />
              
              <Tooltip title="Thu nhỏ">
                <IconButton 
                  size="small" 
                  onClick={handleZoomOut}
                  disabled={scale <= 0.4}
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset zoom (100%)">
                <IconButton 
                  size="small" 
                  onClick={handleResetZoom}
                  disabled={scale === 1.0}
                >
                  <ZoomOutMap fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider orientation="vertical" flexItem />

            <Typography variant="caption" color="text.secondary">
              📄 Kích thước: A4 (210 × 297mm)
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              size="small"
              onClick={handleReload}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              🔄 Tải lại
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Preview Content */}
      <Box sx={{ px: 3 }}>
        <Box sx={{ 
          maxWidth: '1200px', 
          mx: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <TemplatePreviewIframe
            templateId={Number(templateId)}
            scale={scale}
            height="1400px"
            onLoad={() => console.log('✅ Preview loaded')}
            onError={(error) => console.error('❌ Preview error:', error)}
            skeletonLoading
            reloadTrigger={reloadTrigger}
          />
        </Box>
      </Box>

      {/* Info Banner */}
      <Box sx={{ px: 3, mt: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>💡 Lưu ý:</strong> Preview này sử dụng HTML được render từ backend, 
            đảm bảo 100% giống với bản in và email gửi khách hàng. 
            Nếu bạn cần chỉnh sửa, vui lòng quay lại trang chỉnh sửa.
          </Typography>
        </Alert>
      </Box>
    </Box>
  )
}

export default TemplatePreviewPage

