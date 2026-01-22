import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Button, 
  Stack, 
  Fade,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
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
  // ✅ Handle both JSON string AND object (BE might return either)
  const parsedLayout = useMemo(() => {
    if (!template || !template.layoutDefinition) {
      console.warn('⚠️ No template or layoutDefinition')
      return null;
    }

    console.log('🔍 Raw layoutDefinition type:', typeof template.layoutDefinition)
    console.log('🔍 Raw layoutDefinition:', template.layoutDefinition)

    // If already an object, return as-is
    if (typeof template.layoutDefinition === 'object') {
      console.log('✅ layoutDefinition is object:', template.layoutDefinition)
      return template.layoutDefinition;
    }

    // If string, parse it
    try {
      const parsed = JSON.parse(template.layoutDefinition);
      console.log('✅ Parsed layoutDefinition:', parsed)
      return parsed;
    } catch (err) {
      console.error('❌ Error parsing layoutDefinition:', err);
      console.error('❌ Failed to parse:', template.layoutDefinition);
      return null;
    }
  }, [template]);

  // Extract all data from parsed layout
  const config = useMemo(() => {
    if (!parsedLayout) {
      console.warn('⚠️ No parsedLayout, using defaults')
      return null;
    }

    // ✅ Handle BOTH naming conventions: camelCase (FE) and PascalCase (BE/C#)
    const displaySettings = parsedLayout.displaySettings || parsedLayout.DisplaySettings
    const customerSettings = parsedLayout.customerSettings || parsedLayout.CustomerSettings

    console.log('🔍 parsedLayout structure:', {
      hasCompany: !!parsedLayout.company,
      hasTable: !!parsedLayout.table,
      hasSettings: !!parsedLayout.settings,
      hasDisplaySettings: !!displaySettings,
      hasCustomerSettings: !!customerSettings,
      keys: Object.keys(parsedLayout),
    })

    // ✅ Extract from FULL schema (company, table) OR use defaults (NOT templateName)
    const companyName = parsedLayout.company?.name || 'Công ty ABC'  // ❌ Không dùng template?.templateName
    const companyAddress = parsedLayout.company?.address || ''
    const companyPhone = parsedLayout.company?.phone || ''
    const companyTaxCode = parsedLayout.company?.taxCode || ''
    
    console.log('🔍 Extracted company data:', {
      companyName,
      companyAddress,
      companyPhone,
      companyTaxCode,
      hasOldSchema: !!displaySettings,
      hasFullSchema: !!parsedLayout.company,
    })

    return {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail: parsedLayout.company?.fields?.find((f: { id: string; value: string }) => f.id === 'email')?.value || '',
      companyTaxCode,
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
    if (!parsedLayout) return {
      showLogo: true,
      showSignature: true,
      showCompanyInfo: true,
    };

    // ✅ Handle BOTH schemas and naming conventions
    const settings = parsedLayout.settings || {}
    const displaySettings = parsedLayout.displaySettings || parsedLayout.DisplaySettings || {}
    
    return {
      showLogo: settings.visibility?.showLogo ?? displaySettings.showLogo ?? displaySettings.ShowLogo ?? true,
      showSignature: settings.visibility?.showSignature ?? displaySettings.showSignature ?? displaySettings.ShowSignature ?? true,
      showCompanyName: settings.visibility?.showCompanyName ?? displaySettings.showCompanyName ?? displaySettings.ShowCompanyName ?? true,
      showCompanyPhone: settings.visibility?.showCompanyPhone ?? displaySettings.showPhone ?? displaySettings.ShowPhone ?? true,
      showCompanyAddress: settings.visibility?.showCompanyAddress ?? displaySettings.showAddress ?? displaySettings.ShowAddress ?? true,
      showCompanyTaxCode: settings.visibility?.showCompanyTaxCode ?? displaySettings.showTaxCode ?? displaySettings.ShowTaxCode ?? false,
      showCompanyBankAccount: settings.visibility?.showCompanyBankAccount ?? displaySettings.showBankAccount ?? displaySettings.ShowBankAccount ?? true,
    };
  }, [parsedLayout]);

  const customerVisibility = useMemo(() => {
    if (!parsedLayout) return {
      customerName: false,
      customerTaxCode: false,
      customerAddress: false,
      customerPhone: false,
      customerEmail: false,
      paymentMethod: false,
    };

    // ✅ Handle BOTH schemas and naming conventions
    const settings = parsedLayout.settings || {}
    const customerSettings = parsedLayout.customerSettings || parsedLayout.CustomerSettings || {}
    
    return {
      customerName: settings.customerVisibility?.customerName ?? customerSettings.showName ?? customerSettings.ShowName ?? false,
      customerTaxCode: settings.customerVisibility?.customerTaxCode ?? customerSettings.showTaxCode ?? customerSettings.ShowTaxCode ?? false,
      customerAddress: settings.customerVisibility?.customerAddress ?? customerSettings.showAddress ?? customerSettings.ShowAddress ?? false,
      customerPhone: settings.customerVisibility?.customerPhone ?? customerSettings.showPhone ?? customerSettings.ShowPhone ?? false,
      customerEmail: settings.customerVisibility?.customerEmail ?? customerSettings.showEmail ?? customerSettings.ShowEmail ?? false,
      paymentMethod: settings.customerVisibility?.paymentMethod ?? customerSettings.showPaymentMethod ?? customerSettings.ShowPaymentMethod ?? false,
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

  const blankRows = useMemo(() => {
    if (!parsedLayout) return 8;
    
    // ✅ Handle BOTH schemas and naming conventions
    const tableSettings = parsedLayout.tableSettings || parsedLayout.TableSettings || {}
    return parsedLayout.table?.rowCount ?? 
           parsedLayout.blankRows ?? 
           tableSettings.minRows ?? 
           tableSettings.MinRows ?? 
           8;
  }, [parsedLayout]);
  
  const bilingual = useMemo(() => {
    if (!parsedLayout) return false;
    
    // ✅ Handle BOTH schemas and naming conventions
    const displaySettings = parsedLayout.displaySettings || parsedLayout.DisplaySettings || {}
    return parsedLayout.settings?.bilingual ?? 
           displaySettings.isBilingual ?? 
           displaySettings.IsBilingual ?? 
           false;
  }, [parsedLayout]);

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
          

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}>
              
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
