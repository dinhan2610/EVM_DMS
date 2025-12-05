import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import companyService from '@/services/companyService'

// Interfaces
interface CompanyInfo {
  companyID?: number
  companyName: string
  taxCode: string
  address: string
  contactPhone: string
  accountNumber: string
  bankName: string
}

interface ApiConfig {
  isSandbox: boolean
  apiUrl: string
  apiKey: string
  secretKey: string
}

interface EmailConfig {
  smtpHost: string
  smtpPort: string
  username: string
  password: string
  useSSL: boolean
}

// Initial States
const initialCompanyInfo: CompanyInfo = {
  companyName: '',
  taxCode: '',
  address: '',
  contactPhone: '',
  accountNumber: '',
  bankName: '',
}

const initialApiConfig: ApiConfig = {
  isSandbox: true,
  apiUrl: 'https://api-sandbox.vnpt-invoice.com.vn',
  apiKey: '',
  secretKey: '',
}

const initialEmailConfig: EmailConfig = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  username: '',
  password: '',
  useSSL: true,
}

const SystemConfiguration = () => {
  // State: Current Tab
  const [currentTab, setCurrentTab] = useState<'company' | 'integrations' | 'notifications'>('company')

  // State: Forms
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo)
  const [originalCompanyInfo, setOriginalCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo)
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(initialApiConfig)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(initialEmailConfig)

  // State: Password Visibility
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  // State: Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Load company info from API
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const company = await companyService.getDefaultCompany()
        console.log('🏢 Company info loaded:', company)
        const companyData = {
          companyID: company.companyID,
          companyName: company.companyName,
          taxCode: company.taxCode,
          address: company.address,
          contactPhone: company.contactPhone,
          accountNumber: company.accountNumber,
          bankName: company.bankName,
        }
        setCompanyInfo(companyData)
        setOriginalCompanyInfo(companyData)
      } catch (error) {
        console.error('❌ Error loading company info:', error)
        setSnackbar({
          open: true,
          message: 'Không thể tải thông tin doanh nghiệp',
          severity: 'error',
        })
      }
    }
    
    loadCompanyInfo()
  }, [])

  // Handlers: Company Info
  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditCompany = () => {
    setIsEditingCompany(true)
  }

  const handleCancelEdit = () => {
    setCompanyInfo(originalCompanyInfo)
    setIsEditingCompany(false)
  }

  const handleSaveCompanyInfo = async () => {
    // Validation
    if (!companyInfo.companyName.trim() || !companyInfo.taxCode.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ Tên công ty và Mã số thuế!',
        severity: 'error',
      })
      return
    }

    try {
      const { companyID, ...updateData } = companyInfo
      const updated = await companyService.updateCompany(companyID || 1, updateData)
      
      console.log('✅ Company updated:', updated)
      
      setOriginalCompanyInfo(companyInfo)
      setIsEditingCompany(false)
      
      setSnackbar({
        open: true,
        message: 'Đã lưu thông tin doanh nghiệp thành công!',
        severity: 'success',
      })
    } catch (error) {
      console.error('❌ Error updating company:', error)
      setSnackbar({
        open: true,
        message: 'Không thể cập nhật thông tin doanh nghiệp',
        severity: 'error',
      })
    }
  }

  // Handlers: API Config
  const handleApiConfigChange = (field: keyof ApiConfig, value: string | boolean) => {
    setApiConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveApiConfig = () => {
    if (!apiConfig.apiUrl.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập API URL!',
        severity: 'error',
      })
      return
    }

    setSnackbar({
      open: true,
      message: 'Đã lưu cấu hình API thành công!',
      severity: 'success',
    })
  }

  const handleTestConnection = () => {
    if (!apiConfig.apiUrl.trim() || !apiConfig.apiKey.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin API để kiểm tra!',
        severity: 'error',
      })
      return
    }

    // Simulate API test
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Kết nối thành công với máy chủ CQT!',
        severity: 'success',
      })
    }, 1000)
  }

  // Handlers: Email Config
  const handleEmailConfigChange = (field: keyof EmailConfig, value: string | boolean) => {
    setEmailConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEmailConfig = () => {
    if (!emailConfig.smtpHost.trim() || !emailConfig.username.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin máy chủ SMTP!',
        severity: 'error',
      })
      return
    }

    setSnackbar({
      open: true,
      message: 'Đã lưu cấu hình email thành công!',
      severity: 'success',
    })
  }

  const handleSendTestEmail = () => {
    if (!emailConfig.smtpHost.trim() || !emailConfig.username.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng lưu cấu hình trước khi gửi email thử nghiệm!',
        severity: 'error',
      })
      return
    }

    // Simulate email sending
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Email thử nghiệm đã được gửi thành công!',
        severity: 'success',
      })
    }, 1000)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          Cấu hình Hệ thống
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quản lý thông tin doanh nghiệp, tích hợp API và cấu hình thông báo
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Paper
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              minHeight: 64,
              py: 2,
            },
          }}
        >
          <Tab
            value="company"
            icon={<BusinessOutlinedIcon />}
            iconPosition="start"
            label="Thông tin Doanh nghiệp"
          />
          <Tab
            value="integrations"
            icon={<IntegrationInstructionsOutlinedIcon />}
            iconPosition="start"
            label="Tích hợp API"
          />
          <Tab
            value="notifications"
            icon={<NotificationsOutlinedIcon />}
            iconPosition="start"
            label="Thông báo"
          />
        </Tabs>
      </Paper>

      {/* Tab Panel 1: Company Info */}
      {currentTab === 'company' && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessOutlinedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Thông tin Doanh nghiệp
              </Typography>
            </Box>
            
            {/* Edit/Save/Cancel Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isEditingCompany ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<i className="ri-edit-line" />}
                  onClick={handleEditCompany}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancelEdit}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSaveCompanyInfo}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Lưu
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Alert severity={isEditingCompany ? 'warning' : 'info'} sx={{ mb: 3, borderRadius: 2 }}>
            {isEditingCompany ? (
              <>
                <strong>Đang chỉnh sửa.</strong> Thông tin này sẽ được cập nhật vào cơ sở dữ liệu và hiển thị trên tất cả hóa đơn mới.
              </>
            ) : (
              <>
                <strong>Thông tin doanh nghiệp.</strong> Các thông tin này được đồng bộ từ cơ sở dữ liệu và sẽ hiển thị trên hóa đơn điện tử. Click "Chỉnh sửa" để cập nhật.
              </>
            )}
          </Alert>

          <Grid container spacing={3}>
            {/* Dòng 1: Tên công ty */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Tên công ty"
                required
                value={companyInfo.companyName}
                onChange={isEditingCompany ? (e) => handleCompanyInfoChange('companyName', e.target.value) : undefined}
                slotProps={{
                  input: {
                    readOnly: !isEditingCompany,
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>
                        🏢
                      </Box>
                    ),
                  },
                }}
                placeholder="VD: Công ty TNHH ABC Technology"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isEditingCompany ? 'white' : '#f5f5f5',
                    '& input': {
                      color: isEditingCompany ? 'text.primary' : 'text.secondary',
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </Grid>

            {/* Dòng 2: Mã số thuế - Số điện thoại */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Mã số thuế"
                required
                value={companyInfo.taxCode}
                onChange={isEditingCompany ? (e) => handleCompanyInfoChange('taxCode', e.target.value) : undefined}
                slotProps={{
                  input: {
                    readOnly: !isEditingCompany,
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>
                        🏷️
                      </Box>
                    ),
                  },
                }}
                placeholder="VD: 0123456789"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isEditingCompany ? 'white' : '#f5f5f5',
                    '& input': {
                      color: isEditingCompany ? 'text.primary' : 'text.secondary',
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Số điện thoại"
                value={companyInfo.contactPhone}
                onChange={isEditingCompany ? (e) => handleCompanyInfoChange('contactPhone', e.target.value) : undefined}
                slotProps={{
                  input: {
                    readOnly: !isEditingCompany,
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>
                        📞
                      </Box>
                    ),
                  },
                }}
                placeholder="VD: 0901234567"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isEditingCompany ? 'white' : '#f5f5f5',
                    '& input': {
                      color: isEditingCompany ? 'text.primary' : 'text.secondary',
                    },
                  },
                }}
              />
            </Grid>

            {/* Dòng 3: Số tài khoản - Ngân hàng */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Số tài khoản"
                value={companyInfo.accountNumber}
                onChange={isEditingCompany ? (e) => handleCompanyInfoChange('accountNumber', e.target.value) : undefined}
                slotProps={{
                  input: {
                    readOnly: !isEditingCompany,
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>
                        💳
                      </Box>
                    ),
                  },
                }}
                placeholder="VD: 1234567890"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isEditingCompany ? 'white' : '#f5f5f5',
                    '& input': {
                      color: isEditingCompany ? 'text.primary' : 'text.secondary',
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Ngân hàng"
                value={companyInfo.bankName}
                onChange={isEditingCompany ? (e) => handleCompanyInfoChange('bankName', e.target.value) : undefined}
                slotProps={{
                  input: {
                    readOnly: !isEditingCompany,
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>
                        🏦
                      </Box>
                    ),
                  },
                }}
                placeholder="VD: Vietcombank - Chi nhánh TP.HCM"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isEditingCompany ? 'white' : '#f5f5f5',
                    '& input': {
                      color: isEditingCompany ? 'text.primary' : 'text.secondary',
                    },
                  },
                }}
              />
            </Grid>

            {/* Dòng 4: Địa chỉ */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Địa chỉ"
                value={companyInfo.address}
                onChange={isEditingCompany ? (e) => handleCompanyInfoChange('address', e.target.value) : undefined}
                slotProps={{
                  input: {
                    readOnly: !isEditingCompany,
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'primary.main', alignSelf: 'flex-start', mt: 0.5 }}>
                        📍
                      </Box>
                    ),
                  },
                }}
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isEditingCompany ? 'white' : '#f5f5f5',
                    '& textarea': {
                      color: isEditingCompany ? 'text.primary' : 'text.secondary',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tab Panel 2: API Integrations */}
      {currentTab === 'integrations' && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IntegrationInstructionsOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cấu hình API Cơ quan Thuế (CQT)
            </Typography>
            <Chip
              label={apiConfig.isSandbox ? 'Sandbox' : 'Production'}
              size="small"
              color={apiConfig.isSandbox ? 'warning' : 'success'}
              sx={{ ml: 'auto' }}
            />
          </Box>

          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Lưu ý bảo mật
            </Typography>
            <Typography variant="caption">
              API Key và Secret Key là thông tin nhạy cảm. Không chia sẻ với bất kỳ ai.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={apiConfig.isSandbox}
                  onChange={(e) => {
                    handleApiConfigChange('isSandbox', e.target.checked)
                    handleApiConfigChange(
                      'apiUrl',
                      e.target.checked
                        ? 'https://api-sandbox.vnpt-invoice.com.vn'
                        : 'https://api.vnpt-invoice.com.vn'
                    )
                  }}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Sử dụng môi trường Sandbox (Thử nghiệm)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bật để sử dụng môi trường test, tắt để sử dụng môi trường production
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              size="small"
              label="API URL"
              required
              value={apiConfig.apiUrl}
              onChange={(e) => handleApiConfigChange('apiUrl', e.target.value)}
              placeholder="https://api.vnpt-invoice.com.vn"
              helperText="URL của API Cơ quan Thuế"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="API Key"
              type={showApiKey ? 'text' : 'password'}
              required
              value={apiConfig.apiKey}
              onChange={(e) => handleApiConfigChange('apiKey', e.target.value)}
              placeholder="Nhập API Key từ Cơ quan Thuế"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                      size="small"
                    >
                      {showApiKey ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Secret Key"
              type={showSecretKey ? 'text' : 'password'}
              required
              value={apiConfig.secretKey}
              onChange={(e) => handleApiConfigChange('secretKey', e.target.value)}
              placeholder="Nhập Secret Key từ Cơ quan Thuế"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      edge="end"
                      size="small"
                    >
                      {showSecretKey ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSaveApiConfig}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              Lưu Cấu hình API
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handleTestConnection}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Kiểm tra kết nối
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Tab Panel 3: Notifications */}
      {currentTab === 'notifications' && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cấu hình Máy chủ Email (SMTP)
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Cấu hình máy chủ SMTP để gửi email thông báo tự động cho khách hàng và người dùng.
          </Alert>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Máy chủ SMTP"
                required
                value={emailConfig.smtpHost}
                onChange={(e) => handleEmailConfigChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                helperText="VD: smtp.gmail.com, smtp.outlook.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Port"
                type="number"
                required
                value={emailConfig.smtpPort}
                onChange={(e) => handleEmailConfigChange('smtpPort', e.target.value)}
                placeholder="587"
                helperText="Port thông dụng: 587 (TLS), 465 (SSL)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Tên đăng nhập (Email)"
                type="email"
                required
                value={emailConfig.username}
                onChange={(e) => handleEmailConfigChange('username', e.target.value)}
                placeholder="your-email@gmail.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Mật khẩu"
                type={showEmailPassword ? 'text' : 'password'}
                required
                value={emailConfig.password}
                onChange={(e) => handleEmailConfigChange('password', e.target.value)}
                placeholder="Mật khẩu ứng dụng"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        edge="end"
                        size="small"
                      >
                        {showEmailPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={emailConfig.useSSL}
                      onChange={(e) => handleEmailConfigChange('useSSL', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Sử dụng SSL/TLS
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Khuyến nghị bật để bảo mật kết nối email
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSaveEmailConfig}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              Lưu Cấu hình Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<SendOutlinedIcon />}
              onClick={handleSendTestEmail}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Gửi email thử nghiệm
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SystemConfiguration
