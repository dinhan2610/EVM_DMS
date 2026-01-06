import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import invoiceService from '@/services/invoiceService'

interface InvoicePreviewModalProps {
  open: boolean
  onClose: () => void
  invoiceId: number
  invoiceNumber: string | number
}

/**
 * Modal hiển thị preview HTML của hóa đơn đã phát hành
 * - Sử dụng API: GET /api/Invoice/preview-by-invoice/{id}
 * - Cho phép: Xem trước, In, Tải PDF, Mở tab mới
 * 
 * Use case:
 * - Xem preview trước khi in
 * - In trực tiếp
 * - Tải về PDF
 * - Kiểm tra format hóa đơn
 */
export default function InvoicePreviewModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
}: InvoicePreviewModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`[InvoicePreviewModal] Loading preview for invoice ${invoiceId}`)
      
      let html = await invoiceService.getInvoiceHTML(invoiceId)
      
      // ✨ Inject CSS override to change .page-container width from 210mm to 209mm
      const cssOverride = `
        <style>
          .page-container {
            width: 209mm !important;
          }
        </style>
      `
      
      // Insert CSS before </head> tag, or before </body> if no </head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${cssOverride}</head>`)
      } else if (html.includes('</body>')) {
        html = html.replace('</body>', `${cssOverride}</body>`)
      } else {
        // Fallback: append to end
        html += cssOverride
      }
      
      setHtmlContent(html)
      
      console.log('[InvoicePreviewModal] ✅ Preview loaded with CSS override (width: 209mm)')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải preview hóa đơn'
      console.error('[InvoicePreviewModal] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  // Load HTML when modal opens
  useEffect(() => {
    if (open && invoiceId) {
      loadPreview()
    } else {
      // Reset state when closed
      setHtmlContent('')
      setLoading(true)
      setError(null)
    }
  }, [open, invoiceId, loadPreview])

  const handlePrint = async () => {
    try {
      setPrinting(true)
      console.log('[InvoicePreviewModal] Opening print window...')
      
      await invoiceService.printInvoiceHTML(invoiceId)
      
      console.log('[InvoicePreviewModal] ✅ Print window opened')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể mở cửa sổ in'
      console.error('[InvoicePreviewModal] Print error:', message)
      alert(`❌ ${message}`)
    } finally {
      setPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true)
      console.log('[InvoicePreviewModal] Downloading PDF...')
      
      await invoiceService.saveInvoicePDF(invoiceId, invoiceNumber)
      
      console.log('[InvoicePreviewModal] ✅ PDF downloaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải PDF'
      console.error('[InvoicePreviewModal] Download error:', message)
      alert(`❌ ${message}`)
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (htmlContent) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
        newWindow.document.title = `Hóa đơn ${invoiceNumber}`
      } else {
        alert('❌ Popup bị chặn. Vui lòng cho phép popup.')
      }
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 6 }}>
        <Box flex={1}>
          Xem trước hóa đơn #{invoiceNumber}
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent 
        sx={{ 
          p: 0, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {loading && (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flex={1}
          >
            <Box textAlign="center">
              <CircularProgress size={48} />
              <Box mt={2} color="text.secondary">
                Đang tải preview...
              </Box>
            </Box>
          </Box>
        )}
        
        {error && (
          <Box p={3}>
            <Alert 
              severity="error"
              action={
                <Button size="small" onClick={loadPreview}>
                  Thử lại
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && htmlContent && (
          <Box flex={1} sx={{ overflow: 'hidden' }}>
            <iframe
              srcDoc={htmlContent}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              title={`Invoice Preview ${invoiceNumber}`}
            />
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          color="inherit"
        >
          Đóng
        </Button>

        <Box flex={1} />

        <Tooltip title="Tải lại preview">
          <IconButton 
            onClick={loadPreview}
            disabled={loading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Mở trong tab mới">
          <IconButton 
            onClick={handleOpenInNewTab}
            disabled={loading || !htmlContent}
            size="small"
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>

        <Button 
          onClick={handlePrint} 
          startIcon={<PrintIcon />}
          variant="outlined"
          disabled={loading || !!error || printing}
        >
          {printing ? 'Đang mở...' : 'In'}
        </Button>

        <Button 
          onClick={handleDownloadPdf} 
          startIcon={<DownloadIcon />}
          variant="contained"
          disabled={loading || !!error || downloading}
        >
          {downloading ? 'Đang tải...' : 'Tải PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
