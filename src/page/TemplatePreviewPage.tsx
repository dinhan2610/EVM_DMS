import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Stack, 
  Breadcrumbs, 
  Link, 
  Fade,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview';
import PageTitle from '@/components/PageTitle';
import templateService, { TemplateResponse } from '@/services/templateService';
import type { InvoiceSymbol, ProductItem } from '@/types/invoiceTemplate';

/**
 * Enhanced Template Preview Page với UX/UI tối ưu
 * 
 * Features:
 * - Loading states với Skeleton
 * - Smooth animations
 * - Responsive breadcrumbs
 * - Enhanced print button
 * - Mock data generator
 */
export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [products] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch template from API
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        setError('Template ID không hợp lệ');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await templateService.getTemplateById(parseInt(templateId));
        setTemplate(response);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Không thể tải mẫu hóa đơn');
        setSnackbar({
          open: true,
          message: error.message || 'Không thể tải mẫu hóa đơn',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  // **OPTIMIZED: Parse layoutDefinition ONCE and memoize**
  const parsedLayout = useMemo(() => {
    if (!template || !template.layoutDefinition) {
      return null;
    }

    try {
      return JSON.parse(template.layoutDefinition);
    } catch (err) {
      console.error('❌ Error parsing layoutDefinition:', err);
      return null;
    }
  }, [template]);

  // Extract all data from parsed layout
  const config = useMemo(() => {
    if (!parsedLayout) return null;

    return {
      companyName: parsedLayout.company?.name || 'Công ty ABC',
      companyAddress: parsedLayout.company?.address || '',
      companyPhone: parsedLayout.company?.phone || '',
      companyEmail: parsedLayout.company?.fields?.find((f: { id: string; value: string }) => f.id === 'email')?.value || '',
      companyTaxCode: parsedLayout.company?.taxCode || '',
      companyWebsite: parsedLayout.company?.fields?.find((f: { id: string; value: string }) => f.id === 'website')?.value || '',
      companyLogo: template?.logoUrl || '/logo.png',
      invoiceNumber: 'HD-PREVIEW-001',
      invoiceDate: new Date().toLocaleDateString('vi-VN'),
      invoiceSymbol: template?.serial || '',
      invoiceSerial: template?.serial || '',
      modelCode: parsedLayout.modelCode || '',
      templateCode: parsedLayout.templateCode || template?.serial || '',
    };
  }, [parsedLayout, template]);

  const backgroundFrame = useMemo(() => {
    if (!template) return '';
    return template.frameUrl || parsedLayout?.background?.frame || '';
  }, [template, parsedLayout]);

  const visibility = useMemo(() => {
    return parsedLayout?.settings?.visibility || {
      showLogo: true,
      showSignature: true,
      showCompanyInfo: true,
    };
  }, [parsedLayout]);

  const customerVisibility = useMemo(() => {
    return parsedLayout?.settings?.customerVisibility || {
      customerName: false,
      customerTaxCode: false,
      customerAddress: false,
      customerPhone: false,
      customerEmail: false,
      paymentMethod: false,
    };
  }, [parsedLayout]);

  const invoiceType = useMemo(() => {
    return parsedLayout?.invoiceType || 'withCode';
  }, [parsedLayout]);

  const symbol = useMemo((): InvoiceSymbol => {
    if (!template) {
      return {
        invoiceType: '1' as const,
        taxCode: 'C' as const,
        year: new Date().getFullYear().toString().slice(-2),
        invoiceForm: 'T' as const,
        management: 'AA',
      };
    }

    // Parse serial from template (e.g., "1C25TAA")
    const serial = template.serial || '';
    if (serial.length >= 6) {
      return {
        invoiceType: serial[0] as InvoiceSymbol['invoiceType'],
        taxCode: serial[1] as InvoiceSymbol['taxCode'],
        year: serial.substring(2, 4),
        invoiceForm: serial[4] as InvoiceSymbol['invoiceForm'],
        management: serial.substring(5),
      };
    }
    
    // Fallback to layout or default
    return parsedLayout?.symbol || {
      invoiceType: '1' as const,
      taxCode: 'C' as const,
      year: new Date().getFullYear().toString().slice(-2),
      invoiceForm: 'T' as const,
      management: 'AA',
    };
  }, [template, parsedLayout]);

  const blankRows = useMemo(() => parsedLayout?.blankRows || 8, [parsedLayout]);
  const bilingual = useMemo(() => parsedLayout?.settings?.bilingual || false, [parsedLayout]);
  const logoSize = useMemo(() => parsedLayout?.logoSize || 150, [parsedLayout]);

  if (isLoading) {
    return (
      <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 3 }}>
        <PageTitle title={`Xem trước mẫu #${templateId}`} />
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} />
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error || !template || !config) {
    return (
      <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 3 }}>
        <PageTitle title={`Xem trước mẫu #${templateId}`} />
        <Container maxWidth="xl">
          <Alert severity="error" sx={{ mt: 3 }}>
            {error || 'Không thể tải mẫu hóa đơn'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/templates')}
            sx={{ mt: 2 }}>
            Quay Lại
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: { xs: 2, md: 3 } }}>
      <PageTitle title={`Xem trước mẫu #${templateId}`} />

      <Container maxWidth={false} sx={{ maxWidth: '1400px', mx: 'auto' }}>
        {/* Page Header với Breadcrumbs */}
        <Fade in timeout={400}>
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs 
              aria-label="breadcrumb" 
              sx={{ 
                mb: 2,
                '& .MuiBreadcrumb-separator': { mx: 1 },
              }}>
              <Link
                underline="hover"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  color: 'inherit',
                  '&:hover': { color: 'primary.main' },
                  transition: 'color 0.2s',
                }}
                onClick={() => navigate('/dashboard')}>
                <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
                Trang chủ
              </Link>
              <Link
                underline="hover"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'inherit',
                  '&:hover': { color: 'primary.main' },
                  transition: 'color 0.2s',
                }}
                onClick={() => navigate('/admin/templates')}>
                Quản lý mẫu
              </Link>
              <Typography 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'text.primary',
                  fontWeight: 600,
                }}>
                Xem trước & In
              </Typography>
            </Breadcrumbs>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#1976d2',
                    mb: 0.5,
                    fontSize: { xs: '1.5rem', md: '2rem' },
                  }}>
                  Xem Trước Mẫu Hóa Đơn
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}>
                  Kiểm tra và in hóa đơn với tính năng phân trang chuyên nghiệp
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/admin/templates')}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateX(-4px)',
                  },
                  transition: 'all 0.3s',
                }}>
                Quay Lại
              </Button>
            </Stack>
          </Box>
        </Fade>

        {/* Invoice Preview Area */}
        <Fade in timeout={800}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              minHeight: '297mm',
            }}>
            <Box
              id="invoice-print-area"
              sx={{
                width: '210mm',
                minHeight: '297mm',
                mx: 'auto',
                position: 'relative',
              }}>
              <InvoiceTemplatePreview
                config={config}
                products={products}
                visibility={visibility}
                backgroundFrame={backgroundFrame}
                customerVisibility={customerVisibility}
                invoiceType={invoiceType}
                symbol={symbol}
                blankRows={blankRows}
                bilingual={bilingual}
                logoSize={logoSize}
              />
            </Box>
          </Box>
        </Fade>

      

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
