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
  invoiceType?: number // Optional: 1=Gốc, 2=Điều chỉnh, 3=Thay thế, 4=Hủy, 5=Giải trình
  originalInvoiceNumber?: number // Số HĐ gốc (cho HĐ điều chỉnh/thay thế)
  adjustmentReason?: string // Lý do điều chỉnh
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
  invoiceType,
  originalInvoiceNumber,
  adjustmentReason,
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
      if (import.meta.env.DEV) {
        console.log(`[InvoicePreviewModal] Loading preview for invoice ${invoiceId}, type: ${invoiceType}`)
      }
      
      let html = await invoiceService.getInvoiceHTML(invoiceId)
      
      // ✨ Inject CSS override to change .page-container width from 210mm to 209mm
      const cssOverride = `
        <style>
          .page-container {
            width: 209mm !important;
          }
        </style>
      `
      
      // ✨ Generate invoice type badge & info based on type
      let invoiceTypeBadge = ''
      let adjustmentInfo = ''
      
      if (invoiceType === 2) {
        // Hóa đơn điều chỉnh
        invoiceTypeBadge = `
        <style>
          .invoice-type-badge {
            position: absolute;
            top: 20mm;
            right: 20mm;
            padding: 8px 16px;
            background-color: #ff9800;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
        </style>
        <div class="invoice-type-badge">HÓA ĐƠN ĐIỀU CHỈNH</div>
        `
        
        if (originalInvoiceNumber || adjustmentReason) {
          adjustmentInfo = `
          <div style="margin: 10px 0; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
            ${originalInvoiceNumber ? `<div style="margin-bottom: 5px;"><strong>📄 Điều chỉnh hóa đơn số:</strong> ${originalInvoiceNumber}</div>` : ''}
            ${adjustmentReason ? `<div><strong>📝 Lý do:</strong> ${adjustmentReason}</div>` : ''}
          </div>
          `
        }
      } else if (invoiceType === 3) {
        // Hóa đơn thay thế
        invoiceTypeBadge = `
        <style>
          .invoice-type-badge {
            position: absolute;
            top: 20mm;
            right: 20mm;
            padding: 8px 16px;
            background-color: #2196f3;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
        </style>
        <div class="invoice-type-badge">HÓA ĐƠN THAY THẾ</div>
        `
        
        if (originalInvoiceNumber) {
          adjustmentInfo = `
          <div style="margin: 10px 0; padding: 10px; background-color: #d1ecf1; border-left: 4px solid #2196f3; border-radius: 4px;">
            <div><strong>📄 Thay thế hóa đơn số:</strong> ${originalInvoiceNumber}</div>
          </div>
          `
        }
      } else if (invoiceType === 4) {
        // Hóa đơn hủy - Watermark lớn
        invoiceTypeBadge = `
        <style>
          .invoice-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: bold;
            color: rgba(255, 0, 0, 0.15);
            z-index: 9999;
            pointer-events: none;
            white-space: nowrap;
            letter-spacing: 20px;
          }
          .invoice-type-badge {
            position: absolute;
            top: 20mm;
            right: 20mm;
            padding: 8px 16px;
            background-color: #f44336;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
        </style>
        <div class="invoice-watermark">ĐÃ HỦY</div>
        <div class="invoice-type-badge">HÓA ĐƠN ĐÃ HỦY</div>
        `
      } else if (invoiceType === 5) {
        // Hóa đơn giải trình
        invoiceTypeBadge = `
        <style>
          .invoice-type-badge {
            position: absolute;
            top: 20mm;
            right: 20mm;
            padding: 8px 16px;
            background-color: #9c27b0;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
        </style>
        <div class="invoice-type-badge">HÓA ĐƠN GIẢI TRÌNH</div>
        `
        
        if (originalInvoiceNumber) {
          adjustmentInfo = `
          <div style="margin: 10px 0; padding: 10px; background-color: #f3e5f5; border-left: 4px solid #9c27b0; border-radius: 4px;">
            <div><strong>📄 Giải trình cho hóa đơn số:</strong> ${originalInvoiceNumber}</div>
          </div>
          `
        }
      }
      
      // Insert CSS before </head> tag, or before </body> if no </head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${cssOverride}</head>`)
      } else if (html.includes('</body>')) {
        html = html.replace('</body>', `${cssOverride}</body>`)
      } else {
        html += cssOverride
      }
      
      // Insert invoice type badge & watermark after <body> tag
      if (invoiceTypeBadge && html.includes('<body')) {
        html = html.replace(/<body([^>]*)>/, `<body$1>${invoiceTypeBadge}`)
      }
      
      // Insert adjustment info after "Hình thức thanh toán" section
      if (adjustmentInfo && html.includes('Hình thức thanh toán')) {
        html = html.replace(
          /(Hình thức thanh toán.*?<\/div>\s*<\/div>)/s,
          `$1${adjustmentInfo}`
        )
      }
      
      setHtmlContent(html)
      
      const typeLabel = 
        invoiceType === 2 ? 'ĐIỀU CHỈNH' :
        invoiceType === 3 ? 'THAY THẾ' :
        invoiceType === 4 ? 'HỦY' :
        invoiceType === 5 ? 'GIẢI TRÌNH' : 'GỐC'
      if (import.meta.env.DEV) {
        console.log(`[InvoicePreviewModal] ✅ Preview loaded (Type: ${typeLabel}, width: 209mm)`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải preview hóa đơn'
      if (import.meta.env.DEV) {
        console.error('[InvoicePreviewModal] Error:', message)
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [invoiceId, invoiceType, originalInvoiceNumber, adjustmentReason])

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
      if (import.meta.env.DEV) {
        console.log('[InvoicePreviewModal] Opening print window...')
      }
      
      await invoiceService.printInvoiceHTML(invoiceId)
      
      if (import.meta.env.DEV) {
        console.log('[InvoicePreviewModal] ✅ Print window opened')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể mở cửa sổ in'
      if (import.meta.env.DEV) {
        console.error('[InvoicePreviewModal] Print error:', message)
      }
      alert(`❌ ${message}`)
    } finally {
      setPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true)
      if (import.meta.env.DEV) {
        console.log('[InvoicePreviewModal] Downloading PDF...')
      }
      
      await invoiceService.saveInvoicePDF(invoiceId, invoiceNumber)
      
      if (import.meta.env.DEV) {
        console.log('[InvoicePreviewModal] ✅ PDF downloaded')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải PDF'
      if (import.meta.env.DEV) {
        console.error('[InvoicePreviewModal] Download error:', message)
      }
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
