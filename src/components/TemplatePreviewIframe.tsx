/**
 * TemplatePreviewIframe Component
 * 
 * 🎯 Purpose: Display backend-rendered HTML preview in iframe
 * ✅ Use cases:
 *    - Final preview before saving template
 *    - Print preview
 *    - Consistency check with backend rendering
 * 
 * ⚠️ Important: This is NOT for real-time editor preview
 *    Use InvoiceTemplatePreview component for real-time editing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, CircularProgress, Alert, Typography, Skeleton } from '@mui/material'
import { getTemplatePreviewHtml } from '@/services/templateService'

interface TemplatePreviewIframeProps {
  /** Template ID to preview */
  templateId: number
  
  /** Zoom scale (0.4 to 1.0) */
  scale?: number
  
  /** Custom height for iframe */
  height?: string | number
  
  /** Callback when HTML is loaded */
  onLoad?: () => void
  
  /** Callback when error occurs */
  onError?: (error: Error) => void
  
  /** Show loading skeleton instead of spinner */
  skeletonLoading?: boolean
  
  /** Reload trigger - change this to force reload */
  reloadTrigger?: number
}

const TemplatePreviewIframe: React.FC<TemplatePreviewIframeProps> = ({
  templateId,
  scale = 1.0,
  height = '1200px',
  onLoad,
  onError,
  skeletonLoading = false,
  reloadTrigger = 0,
}) => {
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  /**
   * Fetch HTML from backend
   */
  const fetchPreviewHtml = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📄 [TemplatePreviewIframe] Fetching HTML for template:', templateId)
      const htmlContent = await getTemplatePreviewHtml(templateId)
      
      setHtml(htmlContent)
      
      // Call onLoad callback after setting HTML
      setTimeout(() => {
        onLoad?.()
      }, 100)
      
      console.log('✅ [TemplatePreviewIframe] HTML loaded successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      console.error('❌ [TemplatePreviewIframe] Error:', error)
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [templateId, onLoad, onError])

  /**
   * Load HTML on mount and when templateId or reloadTrigger changes
   */
  useEffect(() => {
    if (templateId) {
      fetchPreviewHtml()
    }
  }, [templateId, reloadTrigger, fetchPreviewHtml])

  /**
   * Handle iframe load event (for additional processing if needed)
   */
  const handleIframeLoad = () => {
    console.log('📄 [TemplatePreviewIframe] Iframe loaded')
    
    // Optional: Add print-specific CSS to iframe
    if (iframeRef.current?.contentWindow) {
      try {
        const iframeDoc = iframeRef.current.contentWindow.document
        
        // Inject additional print CSS if needed
        const printStyle = iframeDoc.createElement('style')
        printStyle.textContent = `
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
        `
        iframeDoc.head.appendChild(printStyle)
      } catch (err) {
        // Ignore cross-origin errors
        console.debug('Cannot access iframe content (expected for cross-origin)')
      }
    }
  }

  /**
   * Loading state
   */
  if (loading) {
    if (skeletonLoading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="60%" height={40} sx={{ mt: 2, borderRadius: 1 }} />
        </Box>
      )
    }
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: typeof height === 'string' ? height : `${height}px`,
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
        }}
      >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Đang tải preview từ server...
        </Typography>
      </Box>
    )
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Không thể tải preview
        </Typography>
        <Typography variant="body2">
          {error.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Vui lòng kiểm tra kết nối hoặc thử lại sau.
        </Typography>
      </Alert>
    )
  }

  /**
   * Success state - Render iframe
   */
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '793px', // A4 width tại 96dpi
        margin: '0 auto',
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Template Preview"
        onLoad={handleIframeLoad}
        style={{
          width: '100%',
          height: height === 'auto' ? '1400px' : (typeof height === 'string' ? height : `${height}px`),
          minHeight: '1123px', // A4 height tại 96dpi
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#ffffff',
          display: 'block',
        }}
        // Security: Sandbox iframe to prevent malicious scripts
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </Box>
  )
}

export default TemplatePreviewIframe
