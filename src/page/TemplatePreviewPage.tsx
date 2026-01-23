import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Stack, 
  Alert,
  
} from '@mui/material';
import {
  ArrowBack,
  Print,
  Download,
} from '@mui/icons-material';
import Spinner from '@/components/Spinner';
import templateService from '@/services/templateService';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Template Preview Page - Xem chi tiết mẫu hóa đơn
 * 
 * UI Design: Giống 100% InvoiceDetail.tsx
 * - Simple layout with padding (p: 3)
 * - Toolbar buttons at top: Back, Download, Print (không có zoom controls)
 * - Info section với Alert
 * - Centered iframe với maxWidth: '21cm'
 * - No fixed positioning, no fancy animations
 * - Iframe auto-height với onLoad handler
 * 
 * API: GET /api/InvoiceTemplate/preview-template/{id}
 * Returns: HTML string (text/html)
 */
export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { setTitle } = usePageTitle('Xem trước mẫu hóa đơn');
  
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch template preview HTML from API
  useEffect(() => {
    const fetchPreview = async () => {
      if (!templateId) {
        setError('Template ID không hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // ✅ Fetch template detail first (always works)
        const templateDetail = await templateService.getTemplateById(parseInt(templateId));
        setTemplateName(templateDetail.templateName);
        
        // ✅ Try to fetch preview HTML (may fail if template is inactive)
        try {
          const html = await templateService.getTemplatePreviewHtml(parseInt(templateId));
          
          // Override CSS để remove scrollbars trong iframe
          const htmlWithOverrides = html.replace(
            '</head>',
            `<style>
              /* Remove all scrollbars from iframe content */
              html, body {
                overflow: hidden !important;
                max-width: 100% !important;
                width: 209mm !important; /* Slightly less than 21cm to prevent overflow */
              }
              body > * {
                max-width: 100% !important;
              }
            </style></head>`
          );
          
          setPreviewHtml(htmlWithOverrides);
        } catch (previewError) {
          // ✅ Preview HTML failed (template inactive or backend error)
          console.warn('Cannot load preview HTML:', previewError);
          setError(
            'Không thể tải preview HTML. ' +
            (templateDetail.isActive 
              ? 'Vui lòng thử lại sau.' 
              : 'Mẫu đang ở trạng thái "Không dùng" nên không thể xem preview.')
          );
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Không thể tải thông tin mẫu hóa đơn');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [templateId]);

  // Update page title when template loads
  useEffect(() => {
    if (templateName) {
      setTitle(`${templateName} - Xem trước mẫu`);
    }
  }, [templateName, setTitle]);

  // Handle print - giống InvoiceDetail
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      alert('❌ Popup bị chặn. Vui lòng cho phép popup.');
    }
  };

  // Handle download PDF - giống InvoiceDetail
  const handleDownload = () => {
    alert('💡 Sử dụng chức năng In và chọn "Lưu dưới dạng PDF" trong hộp thoại in');
    handlePrint();
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Loading state - giống InvoiceDetail với Spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner />
      </Box>
    );
  }

  // Error state - giống InvoiceDetail
  if (error || !previewHtml) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không thể tải mẫu hóa đơn'}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Quay lại</Button>
      </Box>
    );
  }

  return (
    <>
      <Box 
        sx={{ 
          p: 3,
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
        
        {/* Button Row - giống InvoiceDetail.tsx line 385-427 */}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ textTransform: 'none' }}>
            Quay lại
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{ textTransform: 'none' }}>
            Tải PDF
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ textTransform: 'none' }}>
            In mẫu
          </Button>
        </Stack>

      
       

        {/* Preview Content - giống InvoiceDetail.tsx line 596-656 */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            width: '100%',
            overflow: 'hidden',
          }}>
          <Box 
            sx={{ 
              maxWidth: '21cm',
              width: '100%',
              '@media (max-width: 900px)': {
                maxWidth: '100%',
                px: 1,
              },
            }}>
            
            {/* ✅ Show info alert if preview HTML not available */}
            {error && !previewHtml && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Thông tin mẫu: {templateName}</strong>
                <br />
                {error}
              </Alert>
            )}
            
            {/* ✅ Only show iframe if preview HTML is available */}
            {previewHtml && (
              <Box 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden', // ✅ Container prevents overflow
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  mb: 2,
                }}>
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '297mm', // A4 height
                    border: 'none',
                    display: 'block',
                    overflow: 'hidden', // ✅ Iframe itself no scroll
                  }}
                  title={`Template ${templateId} Preview`}
                  scrolling="no" // ✅ HTML attribute to disable scrollbars
                  onLoad={(e) => {
                    const iframe = e.target as HTMLIFrameElement;
                    if (iframe.contentWindow) {
                      try {
                        // ✅ Set iframe content to overflow: hidden via JS
                        const iframeDoc = iframe.contentWindow.document;
                        if (iframeDoc.body) {
                          iframeDoc.body.style.overflow = 'hidden';
                          iframeDoc.documentElement.style.overflow = 'hidden';
                        }
                        
                        // Calculate actual content height
                        const contentHeight = iframeDoc.body.scrollHeight;
                        iframe.style.height = contentHeight + 'px';
                      } catch (err) {
                        console.log('Cannot access iframe content height (CORS):', err);
                      }
                  }
                }}
              />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
