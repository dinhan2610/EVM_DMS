import { useState } from 'react';
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
  Paper,
  Skeleton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InvoiceTemplatePrint from '@/components/InvoiceTemplatePrint';
import PrintControls from '@/components/PrintControls';
import PageTitle from '@/components/PageTitle';

// Types
interface ProductItem {
  stt: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

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
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useState(() => {
    setTimeout(() => setIsLoading(false), 800);
  });

  // Mock data generator
  const generateMockProducts = (count: number): ProductItem[] => {
    const productNames = [
      'Xăng RON95',
      'Dầu Diesel',
      'Dầu nhớt Total 5W-30',
      'Lọc gió động cơ',
      'Lọc dầu động cơ',
      'Bình ắc quy GS 65Ah',
      'Lốp Michelin 195/65R15',
      'Nước làm mát Prestone',
      'Dung dịch rửa kính',
      'Bóng đèn LED H4',
    ];

    return Array.from({ length: count }, (_, i) => ({
      stt: i + 1,
      name: productNames[i % productNames.length],
      unit: i % 3 === 0 ? 'Lít' : i % 3 === 1 ? 'Cái' : 'Hộp',
      quantity: Math.floor(Math.random() * 10) + 1,
      price: Math.floor(Math.random() * 500000) + 50000,
      total: 0,
    })).map(item => ({
      ...item,
      total: item.quantity * item.price,
    }));
  };

  const handleAddMockData = (count: number) => {
    if (count === 0) {
      setProducts([]);
    } else {
      const newProducts = generateMockProducts(count);
      setProducts(newProducts);
    }
  };

  // Mock config data
  const config = {
    companyName: 'CÔNG TY TNHH XÂY DỰNG VÀ THƯƠNG MẠI ABC',
    companyAddress: '123 Đường Trần Hưng Đạo, Quận 1, TP.HCM',
    companyPhone: '(028) 3829 5678',
    companyEmail: 'info@abccorp.com.vn',
    companyTaxCode: '0123456789',
    companyWebsite: 'www.abccorp.com.vn',
    companyLogo: '/logo.png',
    invoiceNumber: 'HD-2024-00123',
    invoiceDate: '15/11/2024',
    invoiceSymbol: 'C25TKN',
    invoiceSerial: '1K24TXN/123',
    modelCode: '1K24TXN',
    templateCode: 'C25TKN',
  };

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

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: { xs: 2, md: 3 } }}>
      <PageTitle title={`Xem trước mẫu #${templateId}`} />

      <Container maxWidth="xl">
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

        {/* Print Controls */}
        <Fade in timeout={600}>
          <Box>
            <PrintControls
              onAddMockData={handleAddMockData}
              currentRowCount={products.length}
              showMockDataControl={true}
            />
          </Box>
        </Fade>

        {/* Invoice Preview Area */}
        <Fade in timeout={800}>
          <Paper
            elevation={2}
            id="invoice-print-area"
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
            <InvoiceTemplatePrint
              config={config}
              products={products}
              visibility={{
                showLogo: true,
                showSignature: true,
                showCompanyInfo: true,
              }}
              backgroundFrame="khunghoadon/Group 1.png"
            />
          </Paper>
        </Fade>

        {/* Bottom Actions - No Print */}
        <Fade in timeout={1000}>
          <Stack
            direction="row"
            justifyContent="center"
            sx={{
              mt: 4,
              mb: 2,
              display: 'block',
            }}
            className="no-print">
            <Button
              variant="text"
              onClick={() => navigate('/admin/templates')}
              sx={{
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.04)',
                },
              }}>
              ← Về Danh Sách Mẫu
            </Button>
          </Stack>
        </Fade>
      </Container>
    </Box>
  );
}
