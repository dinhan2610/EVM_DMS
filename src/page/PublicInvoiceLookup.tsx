import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Card,
  CardContent,
  IconButton,
  Chip,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SecurityIcon from '@mui/icons-material/Security'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudIcon from '@mui/icons-material/Cloud'
import BoltIcon from '@mui/icons-material/Bolt'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// Interface cho kết quả tra cứu
interface InvoiceLookupResult {
  invoiceNumber: string
  serialNumber: string
  templateCode: string
  issueDate: string
  customerName: string
  taxCode: string
  totalAmount: number
  taxAmount: number
  status: string
  taxAuthorityCode?: string
  pdfUrl?: string
}

const PublicInvoiceLookup: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  
  // Form states
  const [lookupCode, setLookupCode] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaText, setCaptchaText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InvoiceLookupResult | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let captcha = ''
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(captcha)
    return captcha
  }

  // Draw CAPTCHA on canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f0f9ff')
    gradient.addColorStop(1, '#e0f2fe')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(6, 182, 212, ${Math.random() * 0.3})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // Draw text
    ctx.font = 'bold 32px Arial'
    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add slight rotation and spacing
    const charWidth = canvas.width / text.length
    for (let i = 0; i < text.length; i++) {
      ctx.save()
      const x = charWidth * i + charWidth / 2
      const y = canvas.height / 2
      ctx.translate(x, y)
      ctx.rotate((Math.random() - 0.5) * 0.4)
      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }

    // Add dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(6, 182, 212, ${Math.random() * 0.5})`
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      )
    }
  }

  // Initialize CAPTCHA
  useEffect(() => {
    const text = generateCaptcha()
    drawCaptcha(text)
  }, [])

  // Refresh CAPTCHA
  const handleRefreshCaptcha = () => {
    const text = generateCaptcha()
    drawCaptcha(text)
    setCaptchaInput('')
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!lookupCode.trim()) {
      setError('Vui lòng nhập mã tra cứu hóa đơn')
      return false
    }

    if (!captchaInput.trim()) {
      setError('Vui lòng nhập mã kiểm tra')
      return false
    }

    if (captchaInput.toUpperCase() !== captchaText) {
      setError('Mã kiểm tra không chính xác')
      handleRefreshCaptcha()
      return false
    }

    return true
  }

  // Handle search
  const handleSearch = async () => {
    setError(null)
    setResult(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Mock API call - Thay thế bằng API thực tế
      // const response = await axios.get(`/api/Invoice/lookup/${lookupCode}`)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock data for demo
      const mockResult: InvoiceLookupResult = {
        invoiceNumber: '0000001',
        serialNumber: 'K24TNT',
        templateCode: '01GTTT0/001',
        issueDate: new Date().toLocaleDateString('vi-VN'),
        customerName: 'CÔNG TY TNHH ABC',
        taxCode: '0123456789',
        totalAmount: 10000000,
        taxAmount: 1000000,
        status: 'Đã phát hành',
        taxAuthorityCode: 'CKS24A1B2C3D4E5',
      }

      setResult(mockResult)
    } catch (err) {
      setError('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.')
      handleRefreshCaptcha()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: '#0f172a',
          borderBottom: '2px solid #06b6d4'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={2} 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9,
              },
            }}
            onClick={() => window.location.href = '/'}
          >
            <CloudIcon sx={{ fontSize: 32, color: '#06b6d4' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                Kỷ Nguyên Số
              </Typography>
              <Typography variant="caption" sx={{ color: '#06b6d4' }}>
                Digital Era Solutions
              </Typography>
            </Box>
          </Stack>
          {!isMobile && (
            <Button
              href="tel:1900xxxx"
              component="a"
              startIcon={<PhoneIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                color: '#06b6d4', 
                textTransform: 'none',
                border: '1px solid #06b6d4',
                '&:hover': { 
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  borderColor: '#06b6d4'
                }
              }}
            >
              Liên hệ
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          flexGrow: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 4, md: 8 },
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            {/* Left side - Search Form */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={24}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  boxShadow: '0 20px 60px rgba(6, 182, 212, 0.3)',
                }}
              >
                <Stack spacing={3}>
                  {/* Title */}
                  <Box>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#0f172a',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <DescriptionIcon sx={{ fontSize: 32, color: '#06b6d4' }} />
                      Tra cứu hóa đơn
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nhập mã tra cứu để xem thông tin chi tiết hóa đơn điện tử
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Error Alert */}
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  {/* Lookup Code Input */}
                  <TextField
                    fullWidth
                    label="Mã nhận hóa đơn / Mã tra cứu"
                    placeholder="Nhập mã số bí mật..."
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ fontSize: 20, mr: 1, color: '#06b6d4' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#06b6d4',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#06b6d4',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#06b6d4',
                      },
                    }}
                  />

                  {/* CAPTCHA */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      Mã kiểm tra <span style={{ color: '#ef4444' }}>*</span>
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          flex: 1,
                          border: '2px solid #e5e7eb',
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={200}
                          height={60}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </Box>
                      <IconButton
                        onClick={handleRefreshCaptcha}
                        disabled={isLoading}
                        sx={{
                          backgroundColor: '#f1f5f9',
                          '&:hover': {
                            backgroundColor: '#e2e8f0',
                          },
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: 20, color: '#06b6d4' }} />
                      </IconButton>
                    </Stack>
                    <TextField
                      fullWidth
                      placeholder="Nhập mã kiểm tra..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      required
                      disabled={isLoading}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {/* Search Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon sx={{ fontSize: 20 }} />}
                    sx={{
                      py: 1.5,
                      backgroundColor: '#06b6d4',
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)',
                      '&:hover': {
                        backgroundColor: '#0891b2',
                        boxShadow: '0 15px 40px rgba(6, 182, 212, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isLoading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Right side - Features/Illustration */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#fff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    mb: 2,
                  }}
                >
                  Giải pháp hóa đơn điện tử
                  <br />
                  <span style={{ color: '#06b6d4' }}>Thời đại số</span>
                </Typography>

                <Typography variant="h6" sx={{ color: '#94a3b8', mb: 3 }}>
                  Tra cứu nhanh chóng, chính xác, bảo mật tuyệt đối
                </Typography>

                {/* Features */}
                <Stack spacing={2}>
                  {[
                    { icon: <CheckCircleIcon sx={{ fontSize: 24 }} />, text: 'Tra cứu 24/7 mọi lúc mọi nơi' },
                    { icon: <SecurityIcon sx={{ fontSize: 24 }} />, text: 'Bảo mật dữ liệu tuyệt đối' },
                    { icon: <BoltIcon sx={{ fontSize: 24 }} />, text: 'Kết quả tức thì trong 2 giây' },
                    { icon: <CloudIcon sx={{ fontSize: 24 }} />, text: 'Đồng bộ với Cơ quan Thuế' },
                  ].map((feature, index) => (
                    <Card
                      key={index}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          transform: 'translateX(10px)',
                        },
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ color: '#06b6d4' }}>{feature.icon}</Box>
                          <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                            {feature.text}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          {/* Result Section */}
          {result && (
            <Box sx={{ mt: 6 }}>
              <Paper
                elevation={12}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  backgroundColor: '#fff',
                  border: '2px solid #06b6d4',
                }}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                      Thông tin hóa đơn
                    </Typography>
                    <Chip label={result.status} color="success" />
                  </Box>

                  <Divider />

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Số hóa đơn</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {result.invoiceNumber}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Ký hiệu</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {result.serialNumber}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Mẫu số</Typography>
                      <Typography variant="body1">{result.templateCode}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Ngày phát hành</Typography>
                      <Typography variant="body1">{result.issueDate}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">Khách hàng</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.customerName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Mã số thuế</Typography>
                      <Typography variant="body1">{result.taxCode}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Tổng tiền</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#06b6d4' }}>
                        {result.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </Typography>
                    </Grid>
                    {result.taxAuthorityCode && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="success" icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}>
                          <Typography variant="body2">
                            Mã CQT: <strong>{result.taxAuthorityCode}</strong>
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>

                  {result.pdfUrl && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DescriptionIcon sx={{ fontSize: 20 }} />}
                      sx={{
                        borderColor: '#06b6d4',
                        color: '#06b6d4',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#0891b2',
                          backgroundColor: 'rgba(6, 182, 212, 0.05)',
                        },
                      }}
                    >
                      Tải hóa đơn PDF
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: '#0f172a',
          color: '#fff',
          py: 6,
          borderTop: '2px solid #06b6d4',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#06b6d4' }}>
                  CÔNG TY CỔ PHẦN GIẢI PHÁP TỔNG THỂ KỶ NGUYÊN SỐ
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <LocationOnIcon sx={{ fontSize: 18, color: '#06b6d4', mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Địa chỉ: Tầng 10, Tòa nhà Diamond Plaza, 34 Lê Duẩn, Quận 1, TP.HCM
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Hotline: 1900 xxxx
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Email: contact@digitalerasolution.com
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DescriptionIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      MST: 0123456789
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Box
                  sx={{
                    border: '2px solid #06b6d4',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 40, color: '#06b6d4' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
                    ISO 27001:2013
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Chứng nhận Bảo mật
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3, borderColor: 'rgba(6, 182, 212, 0.2)' }} />
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#64748b' }}>
            © 2026 Digital Era Solutions. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default PublicInvoiceLookup
