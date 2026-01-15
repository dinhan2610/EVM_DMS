/**
 * 🔔 TAX ERROR NOTIFICATION DETAIL MODAL
 * Modal hiển thị chi tiết thông báo sai sót với 2 tabs:
 * - Tab 1: Thông tin chi tiết
 * - Tab 2: Preview HTML
 * 
 * @component TaxErrorNotificationDetailModal
 * @author EIMS Team
 * @created 2026-01-16
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import taxErrorNotificationService, { NotificationDetail } from '@/services/taxErrorNotificationService'

// ==================== INTERFACES ====================

interface TaxErrorNotificationDetailModalProps {
  open: boolean
  notificationId: number | null
  onClose: () => void
}

// ==================== COMPONENT ====================

const TaxErrorNotificationDetailModal: React.FC<TaxErrorNotificationDetailModalProps> = ({
  open,
  notificationId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<NotificationDetail | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // ==================== API CALLS ====================

  /**
   * Load chi tiết thông báo
   */
  const loadNotificationDetail = useCallback(async () => {
    if (!notificationId) return

    setLoading(true)
    setError(null)

    try {
      // Call API để lấy chi tiết
      const response = await taxErrorNotificationService.getNotificationById(notificationId)
      console.log('✅ Loaded notification detail:', response)
      setDetail(response)
    } catch (err) {
      console.error('❌ Error loading notification detail:', err)
      setError('Không thể tải chi tiết thông báo. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [notificationId])

  /**
   * Load PDF preview
   */
  const loadPdfPreview = useCallback(async () => {
    if (!notificationId || pdfUrl) return

    try {
      const pdfBlob = await taxErrorNotificationService.exportPDF(notificationId)
      const url = window.URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
    } catch (err) {
      console.error('❌ Error loading PDF:', err)
      setError('Không thể tải PDF. Vui lòng thử lại.')
    }
  }, [notificationId, pdfUrl])

  // ==================== EFFECTS ====================

  /**
   * Load notification detail khi modal mở
   */
  useEffect(() => {
    if (open && notificationId) {
      loadNotificationDetail()
      loadPdfPreview()  // Load PDF ngay khi mở modal
    } else {
      // Reset state khi đóng
      setDetail(null)
      setPdfUrl((prevUrl) => {
        // Cleanup PDF URL để tránh memory leak
        if (prevUrl) {
          window.URL.revokeObjectURL(prevUrl)
        }
        return null
      })
      setError(null)
    }
  }, [open, notificationId, loadNotificationDetail, loadPdfPreview])

  // Cleanup PDF URL khi component unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  /**
   * Download PDF
   */
  const handleDownloadPDF = async () => {
    if (!notificationId) return

    setDownloading(true)
    try {
      const pdfBlob = await taxErrorNotificationService.exportPDF(notificationId)
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `TB-${detail?.notificationNumber || notificationId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ PDF downloaded successfully')
    } catch (err) {
      console.error('❌ Error downloading PDF:', err)
      alert('Không thể tải PDF. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  // ==================== HANDLERS ====================

  const handleClose = () => {
    onClose()
  }

  // ==================== RENDER HELPERS ====================

  /**
   * Render PDF preview
   */
  const renderPdfViewer = () => {
    if (!pdfUrl) return null

    return (
      <Box 
        sx={{ 
          flex: 1,
          width: '100%',
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#ffffff',
          display: 'flex',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          },
        }}
      >
        <iframe
          src={`${pdfUrl}#view=Fit&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
          width="100%"
          height="100%"
          style={{ 
            border: 'none', 
            display: 'block',
          }}
          title="PDF Preview"
        />
      </Box>
    )
  }

  // ==================== MAIN RENDER ====================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth={false}
      PaperProps={{
        sx: {
          width: 900,
          maxWidth: '95vw',
          height: '96vh',
          maxHeight: '96vh',
          m: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          borderRadius: 2,
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        px: 3,
        minHeight: 56,
        bgcolor: 'grey.50',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PictureAsPdfIcon sx={{ fontSize: 28, color: 'error.main' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
            Xem thông báo sai sót
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ 
        p: 2.5, 
        height: 'calc(100% - 112px)', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'grey.50',
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 500, 
            gap: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <CircularProgress size={48} thickness={3.6} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Đang tải thông báo...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                Vui lòng chờ trong giây lát
              </Typography>
            </Box>
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {error}
          </Alert>
        ) : (
          renderPdfViewer()
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ 
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 3,
        py: 2,
        minHeight: 56,
        bgcolor: 'grey.50',
        gap: 1.5,
      }}>
        <Button
          variant="contained"
          size="medium"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownloadPDF}
          disabled={!detail || downloading}
          sx={{
            minWidth: 160,
            fontWeight: 600,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            transition: 'all 0.2s',
          }}
        >
          {downloading ? 'Đang tải...' : 'Tải xuống PDF'}
        </Button>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          size="medium"
          sx={{
            minWidth: 100,
            fontWeight: 600,
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
              transform: 'translateY(-1px)',
              boxShadow: 1,
            },
            transition: 'all 0.2s',
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaxErrorNotificationDetailModal
